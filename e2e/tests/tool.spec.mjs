// The simulator: playback, keyboard, inputs and errors, presets, share links,
// algorithm switching, mobile layout, reduced motion. Every test also asserts
// that no CSP or Trusted Types violation happened during the interaction.
import { test, expect } from '@playwright/test';

const RR = '/operating-systems/cpu-scheduling/round-robin/';
// The golden Round Robin case (24, 3, 3 with q=4), loaded through a share link.
const RR_CLASSIC = `${RR}?alg=rr&q=4&tie=new&p=0:24,0:3,0:3`;
const PRIORITY = '/operating-systems/cpu-scheduling/priority/';
const OVERVIEW = '/operating-systems/cpu-scheduling/';

async function open(page, path) {
  const problems = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto(path);
  await page.waitForFunction(() => !!window.__trace);
  return async () => {
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    expect(problems).toEqual([]);
  };
}

const clock = (page) => page.locator('[data-clock]');
const time = (page) => page.evaluate(() => window.__trace.player.time);

test('Round Robin opens on the four-process example with q=2', async ({ page }) => {
  const done = await open(page, RR);
  await expect(page.locator('[data-proc-rows] tr[data-slot]')).toHaveCount(4);
  await expect(page.locator('[data-opt="quantum"]')).toHaveValue('2');
  await expect(page.locator('[data-clock-total]')).toHaveText('13');
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('5.00');
  expect(new URL(page.url()).search).toBe('');
  await page.locator('[data-preset="classic"]').click();
  await expect(page.locator('[data-opt="quantum"]')).toHaveValue('4');
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('5.67');
  await done();
});

test('plays, pauses, steps forward and back, resets', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  await expect(clock(page)).toHaveText('0');
  await expect(page.locator('[data-clock-total]')).toHaveText('30');
  const play = page.locator('[data-act="play"]');
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Pause');
  await page.waitForTimeout(800);
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Play');
  const paused = await time(page);
  expect(paused).toBeGreaterThan(0.5);
  await page.waitForTimeout(300);
  expect(await time(page)).toBe(paused);

  await page.locator('[data-act="reset"]').click();
  await expect.poll(() => time(page)).toBe(0);
  await page.locator('[data-act="fwd"]').click();
  await expect.poll(() => time(page)).toBe(1);
  await expect(clock(page)).toHaveText('1');
  await page.locator('[data-act="fwd"]').click();
  await page.locator('[data-act="back"]').click();
  await expect.poll(() => time(page)).toBe(1);
  await expect(page.locator('[data-live]')).toContainText('Time 1.');
  await done();
});

test('narration, queue and slider follow the playhead', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  await expect(page.locator('[data-why-text]')).toHaveText('P1 is next in line, so it runs for up to 4 units.');
  await expect(page.locator('[data-queue] li')).toHaveText(['P2', 'P3']);
  await page.evaluate(() => window.__trace.player.seek(4, { animate: false }));
  await expect(page.locator('[data-why-text]')).toContainText('P1 used its 4-unit slice and goes to the back of the queue.');
  await expect(page.locator('[data-why-time]')).toHaveText('at time 4');
  await expect(page.locator('[data-queue] li')).toHaveText(['P3', 'P1']);
  const slider = page.locator('[data-ruler]');
  await expect(slider).toHaveAttribute('aria-valuenow', '4');
  await expect(slider).toHaveAttribute('aria-valuetext', 'Time 4 of 30. P2 is running.');
  await page.evaluate(() => window.__trace.player.seek(30, { animate: false }));
  await expect(page.locator('[data-queue] li')).toHaveText(['Empty']);
  await expect(page.locator('.done-mark.show')).toHaveCount(3);
  await done();
});

for (const [name, path] of [['default', RR], ['tie trap', `${RR}?alg=rr&q=2&tie=new&p=0:5,2:3,4:2`], ['heavy', `${RR}?alg=rr&q=2&p=0:7,1:4,2:9,3:2,5:6,6:3,8:5,9:1`]]) {
  test(`narration box never changes height or scrolls (${name})`, async ({ page }) => {
    const done = await open(page, path);
    const heights = await page.evaluate(async () => {
      const box = document.querySelector('[data-why]');
      const p = window.__trace.player;
      const out = [];
      for (let t = 0; t <= p.length; t++) {
        p.seek(t, { animate: false });
        out.push([box.getBoundingClientRect().height, box.scrollHeight - box.clientHeight]);
      }
      return out;
    });
    expect(new Set(heights.map((h) => h[0])).size).toBe(1);
    expect(heights.every((h) => h[1] <= 0)).toBe(true);
    await done();
  });
}

test('keyboard shortcuts work, and are ignored while typing', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  await page.locator('h1').click();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => time(page)).toBe(1);
  await page.keyboard.press('End');
  await expect.poll(() => time(page)).toBe(30);
  await page.keyboard.press('Home');
  await expect.poll(() => time(page)).toBe(0);
  await page.keyboard.press(']');
  await expect(page.locator('[data-speed] [aria-pressed="true"]')).toHaveText('2x');
  await page.keyboard.press('[');
  await page.keyboard.press('[');
  await expect(page.locator('[data-speed] [aria-pressed="true"]')).toHaveText('0.5x');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-act="play"]')).toHaveAttribute('aria-label', 'Pause');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-act="play"]')).toHaveAttribute('aria-label', 'Play');
  const theme = await page.evaluate(() => document.documentElement.dataset.theme || '');
  await page.keyboard.press('t');
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).not.toBe(theme);

  // Slider keys
  await page.locator('[data-ruler]').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => time(page)).toBe(2);

  // Typing in a field: "r" and arrows do not drive playback
  const q = page.locator('[data-opt="quantum"]');
  await q.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('r');
  expect(await time(page)).toBe(2); // typing in the field did not move playback
  await done();
});

test('invalid input shows the exact error and keeps the last valid timeline', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  const burst = page.locator('#p2-burst');
  await burst.fill('0');
  await expect(burst).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#p2-err')).toHaveText('Burst for P2 must be a whole number from 1 to 99.');
  await expect(page.locator('[data-clock-total]')).toHaveText('30');
  await burst.fill('5');
  await expect(burst).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#p2-err')).toBeHidden();
  await expect(page.locator('[data-clock-total]')).toHaveText('32');
  const q = page.locator('[data-opt="quantum"]');
  await q.fill('100');
  await expect(page.locator('#opt-quantum-err')).toHaveText('Quantum must be a whole number from 1 to 99.');
  await q.fill('2');
  await expect(page.locator('#opt-quantum-err')).toBeHidden();
  await done();
});

test('add and remove processes by slot, up to 8', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  await page.locator('[aria-label="Remove P2"]').click();
  await expect(page.locator('[data-proc-rows] tr[data-slot]')).toHaveCount(2);
  await page.locator('[data-add]').click();
  // The lowest free slot is reused, colors never repaint.
  await expect(page.locator('[data-proc-rows] tr[data-slot]').nth(1)).toHaveAttribute('data-slot', '2');
  await expect(page.locator('#p2-arrival')).toHaveValue('1');
  await expect(page.locator('#p2-burst')).toHaveValue('3');
  await expect(page.locator('#p2-arrival')).toBeFocused();
  for (let i = 0; i < 5; i++) await page.locator('[data-add]').click();
  await expect(page.locator('[data-proc-rows] tr[data-slot]')).toHaveCount(8);
  await expect(page.locator('[data-add]')).toBeDisabled();
  await expect(page.locator('[data-add-note]')).toHaveText('Trace supports up to 8 processes, one color each.');
  await expect(page.locator('.lane:not(.cpu)')).toHaveCount(8);
  await done();
});

test('presets load and the tie rule changes the schedule', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  await page.locator('[data-preset="tie"]').click();
  await expect(page.locator('[data-preset="tie"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-opt="quantum"]')).toHaveValue('2');
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('3.67');
  await page.locator('[data-tie] [data-value="preempted"]').click();
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('3.33');
  await expect(page.locator('[data-tie-hint]')).toHaveText('The preempted process rejoins the queue before a process that arrives at the same moment.');
  await page.locator('[data-preset="heavy"]').click();
  await expect(page.locator('.lane:not(.cpu)')).toHaveCount(8);
  await done();
});

test('the share link updates and restores the exact scenario', async ({ page }) => {
  const done = await open(page, RR_CLASSIC);
  await page.locator('#p3-burst').fill('7');
  await page.locator('[data-opt="quantum"]').fill('3');
  await page.locator('[data-tie] [data-value="preempted"]').click();
  await expect.poll(() => page.url()).toContain('alg=rr&q=3&tie=preempted&p=0:24,0:3,0:7');
  const url = page.url();
  const avg = await page.locator('[data-avg="waiting"]').textContent();
  await page.goto(url);
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('#p3-burst')).toHaveValue('7');
  await expect(page.locator('[data-opt="quantum"]')).toHaveValue('3');
  await expect(page.locator('[data-tie] [data-value="preempted"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-avg="waiting"]')).toHaveText(avg);
  // Links to other algorithms carry the processes along.
  await expect(page.locator('[data-alg-link="sjf"]')).toHaveAttribute('href', /\?alg=sjf&p=0:24,0:3,0:7$/);
  await done();
});

test('copy link uses the clipboard and confirms', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const done = await open(page, RR_CLASSIC);
  await page.locator('[data-copy]').click();
  await expect(page.locator('[data-toast]')).toHaveText('Link copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/\/operating-systems\/cpu-scheduling\/round-robin\/\?alg=rr&q=4&tie=new&p=0:24,0:3,0:3$/);
  await done();
});

test('a hostile query string loads safely with a notice', async ({ page }) => {
  const done = await open(page, `${RR}?alg=rr&q=0&p=0:5,x:%3Cscript%3E,2:100&tie=%22%3E`);
  await expect(page.locator('[data-toast]')).toContainText('The quantum in this link was ignored.');
  await expect(page.locator('[data-proc-rows] tr[data-slot]')).toHaveCount(1);
  await expect(page.locator('#p1-burst')).toHaveValue('5');
  await done();
});

test('overview page switches algorithm in place', async ({ page }) => {
  const done = await open(page, OVERVIEW);
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('17.00');
  await page.locator('[data-alg-choice="sjf"]').click();
  await expect(page.locator('[data-tool]')).toHaveAttribute('data-alg', 'sjf');
  await expect(page.locator('[data-alg-choice="sjf"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('3.00');
  await page.locator('[data-alg-choice="rr"]').click();
  await expect(page.locator('[data-opt="quantum"]')).toBeVisible();
  await expect(page.locator('[data-preset="tie"]')).toBeVisible();
  await done();
});

test('priority page: priority column and preemptive switch', async ({ page }) => {
  const done = await open(page, PRIORITY);
  await expect(page.locator('#p1-priority')).toBeVisible();
  await expect(page.locator('[data-avg="waiting"]')).toHaveText('8.20');
  await page.locator('#p5-priority').fill('0');
  await expect(page.locator('#p5-err')).toHaveText('Priority for P5 must be a whole number from 1 to 99.');
  await page.locator('#p5-priority').fill('2');
  await page.locator('[data-order] [data-value="high"]').click();
  await expect(page.locator('[data-order-hint]')).toHaveText('99 is the highest priority.');
  await page.locator('#opt-preemptive').check();
  await expect(page.locator('[data-preempt-hint]')).toHaveText('A better priority arrival interrupts the running process.');
  await done();
});

test.describe('mobile 390 px', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('no horizontal page scroll, dock fixed at the bottom, timeline scrolls inside', async ({ page }) => {
    const done = await open(page, `${RR}?alg=rr&q=1&p=0:99,1:99,2:99,3:99,4:99,5:99,6:99,7:99`);
    const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(widths[0]).toBeLessThanOrEqual(widths[1]);
    const bar = page.locator('[data-transport]');
    expect(await bar.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
    const box = await bar.boundingBox();
    expect(Math.round(box.y + box.height)).toBe(844);
    for (const b of await page.locator('[data-transport] button:visible').all()) {
      const r = await b.boundingBox();
      expect(r.width).toBeGreaterThanOrEqual(44);
      expect(r.height).toBeGreaterThanOrEqual(44);
    }
    const scroll = await page.locator('[data-scroller]').evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scroll).toBe(true);
    await done();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('steps jump straight to the next unit', async ({ page }) => {
    const done = await open(page, RR_CLASSIC);
    await page.locator('[data-act="fwd"]').click();
    expect(await time(page)).toBe(1);
    await done();
  });
});
