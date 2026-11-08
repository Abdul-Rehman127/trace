// Playback robustness: nothing is left behind when playback is interrupted, and the
// compositor-driven playhead never drifts from the clock.
import { test, expect } from '@playwright/test';

const RR = '/operating-systems/cpu-scheduling/round-robin/';
const LONGEST = `${RR}?alg=rr&q=2&tie=new&p=0:99,1:99,2:99,3:99,4:99,5:99,6:99,7:99`;

async function open(page, path) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  await page.goto(path);
  await page.waitForFunction(() => !!window.__trace);
  return problems;
}

/** What the timeline looks like right now. */
const snapshot = (page) =>
  page.evaluate(() => {
    const lanes = document.querySelector('[data-lanes]');
    // Playback animations only; short CSS transitions (check marks fading in) are excluded.
    const running = document
      .getAnimations()
      .filter((a) => !(a instanceof CSSTransition) && a.effect && a.effect.target && lanes.contains(a.effect.target) && a.playState === 'running');
    const head = document.querySelector('[data-head]');
    return {
      time: window.__trace.player.time,
      playing: window.__trace.player.playing,
      on: document.querySelectorAll('.bar-seg.on').length,
      live: document.querySelectorAll('.bar-seg.live').length,
      inline: [...document.querySelectorAll('.fill, .flbl')].filter((e) => e.style.transform).length,
      running: running.length,
      headX: new DOMMatrix(getComputedStyle(head).transform).m41,
    };
  });

/** Head position (in units) and clock, read in the same frame. */
const syncSample = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => {
          const lanes = document.querySelector('[data-lanes]');
          const u = parseFloat(lanes.style.getPropertyValue('--u'));
          const x = new DOMMatrix(getComputedStyle(document.querySelector('[data-head]')).transform).m41;
          resolve({ head: x / u, clock: window.__trace.player.clockNow() });
        }),
      ),
  );

/** Play until the clock is in the middle of a bar (fractional part 0.3 to 0.7). */
async function playToMidSegment(page) {
  await page.evaluate(() => window.__trace.player.play());
  await page.waitForFunction(() => {
    const t = window.__trace.player.clockNow();
    return t > 2.2 && t % 1 > 0.3 && t % 1 < 0.7;
  });
}

test('pressing R mid-segment leaves no .on, .live, transforms or animations', async ({ page }) => {
  const problems = await open(page, RR);
  await playToMidSegment(page);
  const mid = await snapshot(page);
  expect(mid.live).toBe(2);
  expect(mid.running).toBeGreaterThan(0);
  await page.locator('h1').click();
  await page.keyboard.press('r');
  await expect.poll(async () => (await snapshot(page)).time).toBe(0);
  const s = await snapshot(page);
  expect(s).toMatchObject({ playing: false, on: 0, live: 0, inline: 0, running: 0, headX: 0 });
  expect(problems).toEqual([]);
});

test('changing an input mid-play resets cleanly', async ({ page }) => {
  const problems = await open(page, RR);
  await playToMidSegment(page);
  await page.locator('#p2-burst').fill('4');
  const s = await snapshot(page);
  expect(s).toMatchObject({ playing: false, time: 0, on: 0, live: 0, inline: 0, running: 0, headX: 0 });
  await expect(page.locator('[data-clock-total]')).toHaveText('14');
  expect(problems).toEqual([]);
});

test('jumping mid-play pauses and leaves a consistent frame', async ({ page }) => {
  const problems = await open(page, RR);
  // End key
  await playToMidSegment(page);
  await page.locator('h1').click();
  await page.keyboard.press('End');
  await expect.poll(async () => (await snapshot(page)).time).toBe(13);
  let s = await snapshot(page);
  const bars = await page.locator('.bar-seg').count();
  expect(s).toMatchObject({ playing: false, on: bars, live: 0, inline: 0, running: 0 });
  // Click on the ruler while playing
  await page.evaluate(() => window.__trace.player.seek(0, { animate: false }));
  await playToMidSegment(page);
  const box = await page.locator('[data-ticks]').boundingBox();
  await page.mouse.click(box.x + 12 + box.width * 0.1, box.y + box.height / 2);
  await expect.poll(async () => (await snapshot(page)).playing).toBe(false);
  await page.waitForTimeout(300);
  s = await snapshot(page);
  expect(s.running).toBe(0);
  expect(Number.isInteger(s.time)).toBe(true);
  // Every bar that started before the playhead is on, the rest are not.
  const consistent = await page.evaluate((t) => {
    const bars = [...document.querySelectorAll('.bar-seg')];
    return bars.every((b) => {
      const start = Number(b.style.getPropertyValue('--s'));
      return b.classList.contains('on') === start < t;
    });
  }, s.time);
  expect(consistent).toBe(true);
  // Step forward while playing
  await playToMidSegment(page);
  await page.locator('[data-act="fwd"]').click();
  await page.waitForTimeout(400);
  s = await snapshot(page);
  expect(s.playing).toBe(false);
  expect(Number.isInteger(s.time)).toBe(true);
  expect(s.running).toBe(0);
  expect(problems).toEqual([]);
});

test('backgrounding the tab freezes playback and resumes in sync', async ({ page }) => {
  const problems = await open(page, RR);
  await playToMidSegment(page);
  const setHidden = (hidden) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await setHidden(true);
  const frozen = await page.evaluate(() => window.__trace.player.clockNow());
  await page.waitForTimeout(1200);
  const hidden = await snapshot(page);
  expect(hidden.running).toBe(0);
  expect(await page.evaluate(() => window.__trace.player.clockNow())).toBeCloseTo(frozen, 5);
  await setHidden(false);
  await page.waitForTimeout(500);
  const after = await syncSample(page);
  expect(after.clock).toBeGreaterThan(frozen);
  expect(after.clock).toBeLessThan(frozen + 1.5); // resumed from the frozen moment, not from wall time
  expect(Math.abs(after.head - after.clock)).toBeLessThan(0.05);
  expect(problems).toEqual([]);
});

for (const speed of [0.5, 4]) {
  test(`playhead stays within 0.05 units of the clock at ${speed}x on the longest schedule`, async ({ page }) => {
    test.setTimeout(60000);
    const problems = await open(page, LONGEST);
    await page.evaluate((s) => {
      window.__trace.player.setSpeed(s);
      window.__trace.player.play();
    }, speed);
    let worst = 0;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(150);
      const { head, clock } = await syncSample(page);
      worst = Math.max(worst, Math.abs(head - clock));
    }
    console.log(`worst playhead drift at ${speed}x: ${worst.toFixed(4)} units`);
    expect(worst).toBeLessThan(0.05);
    expect(problems).toEqual([]);
  });
}

test.describe('tooltip on touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('a tap shows it, it stays after the finger lifts, the next tap hides it, and it stays inside the stage', async ({ page }) => {
    await open(page, RR);
    const bar = page.locator('.lane:not(.cpu) .bar-seg').last();
    await bar.scrollIntoViewIfNeeded();
    await bar.tap();
    const tip = page.locator('[data-tip]');
    await expect(tip).toBeVisible();
    await page.waitForTimeout(300);
    await expect(tip).toBeVisible();
    const t = await tip.boundingBox();
    const sc = await page.locator('[data-scroller]').boundingBox();
    expect(t.x).toBeGreaterThanOrEqual(sc.x);
    expect(t.x + t.width).toBeLessThanOrEqual(sc.x + sc.width + 0.5);
    await page.locator('h1').tap();
    await expect(tip).toBeHidden();
  });
});

test('mouse tooltip is clamped inside the visible timeline', async ({ page }) => {
  await open(page, `${RR}?alg=rr&q=4&tie=new&p=0:24,0:3,0:3`);
  const bar = page.locator('.cpu .bar-seg').last();
  await bar.hover({ position: { x: 4, y: 10 } });
  const tip = page.locator('[data-tip]');
  await expect(tip).toBeVisible();
  const t = await tip.boundingBox();
  const sc = await page.locator('[data-scroller]').boundingBox();
  expect(t.x + t.width).toBeLessThanOrEqual(sc.x + sc.width + 0.5);
  await page.mouse.move(5, 5);
  await expect(tip).toBeHidden();
});

test('the decision log lists every moment and each line scrubs to it', async ({ page }) => {
  await open(page, RR);
  const log = page.locator('[data-log]');
  await expect(page.locator('[data-log-list] li')).toHaveCount(0); // built only when opened
  await log.locator('summary').click();
  const lines = page.locator('.log-line');
  const moments = await page.evaluate(() => [...new Set(window.__trace.player && document.querySelectorAll('.log-t').length ? [...document.querySelectorAll('.log-t')].map((e) => e.textContent) : [])]);
  expect(moments.length).toBeGreaterThan(5);
  await expect(lines.first()).toHaveAttribute('aria-current', 'step');
  const line = page.locator('.log-line', { has: page.locator('.log-t', { hasText: /^7$/ }) });
  await line.click();
  await expect.poll(() => page.evaluate(() => window.__trace.player.time)).toBe(7);
  await expect(line).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('[data-why-text]')).toHaveText(await line.locator('.log-text').textContent());
  // Keyboard: lines are buttons
  await page.locator('.log-line').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__trace.player.time)).toBe(Number(await page.locator('.log-t').nth(1).textContent()));
  // A new schedule rebuilds the open log
  await page.locator('#p3-burst').fill('2');
  await expect(page.locator('.log-line').first()).toHaveAttribute('aria-current', 'step');
});
