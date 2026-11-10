// Networking: the subnet calculator, VLSM planner and practice update and validate as you
// type, share links round-trip, and the TCP simulator keeps no stale state across reset,
// input changes and a hidden tab. Every test also checks for CSP and console errors.
import { test, expect } from '@playwright/test';

const NET = '/networking/';

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
const row = (page, label) => page.locator('[data-net-rows] div', { has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd .mono');

test('subnet calculator: the brief golden case, then live updates, errors and a share link', async ({ page }) => {
  const done = await open(page, `${NET}subnet-calculator/`);
  await expect(row(page, 'Network address')).toHaveText('192.168.1.128');
  await expect(row(page, 'Broadcast address')).toHaveText('192.168.1.191');
  await expect(row(page, 'Usable hosts')).toHaveText('62');
  await expect(row(page, 'First usable host')).toHaveText('192.168.1.129');
  await expect(row(page, 'Last usable host')).toHaveText('192.168.1.190');
  await expect(page.locator('[data-net-notes]')).toContainText('host bits set');
  const field = page.locator('#net-cidr');
  await field.fill('172.16.5.10/20');
  await expect(row(page, 'Broadcast address')).toHaveText('172.16.15.255');
  await expect(row(page, 'Usable hosts')).toHaveText('4,094');
  await expect(page.locator('[data-net-bits] .bits .kinds .nb')).toHaveCount(20);
  await field.fill('192.168.01.1/24');
  await expect(page.locator('#net-cidr-err')).toContainText('leading zero');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(row(page, 'Usable hosts')).toHaveText('4,094');
  await field.fill('10.1.1.5 255.255.255.254');
  await expect(row(page, 'First address')).toHaveText('10.1.1.4');
  await expect(row(page, 'Usable hosts')).toHaveText('2');
  await expect.poll(() => page.url()).toContain('ip=10.1.1.5');
  await page.goto(page.url());
  await page.waitForFunction(() => !!window.__trace);
  await expect(field).toHaveValue('10.1.1.5 255.255.255.254');
  await page.locator('[data-example="198.51.100.7/32"]').click();
  await expect(row(page, 'Host address')).toHaveText('198.51.100.7');
  await done();
});

test('VLSM: the hand-checked plan, does-not-fit, and a share link', async ({ page }) => {
  const done = await open(page, `${NET}vlsm-calculator/`);
  const rows = page.locator('[data-vlsm-rows] tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('/25');
  await expect(rows.nth(4)).toContainText('192.168.10.240');
  await expect(page.locator('[data-vlsm-summary]')).toContainText('12 free');
  await page.locator('[data-net="192.168.20.0/24"]').click();
  await expect(page.locator('[data-vlsm-summary]')).toContainText('Does not fit: Guests');
  await page.locator('#vlsm-hosts').fill('A 30, B 30, C 0');
  await expect(page.locator('#vlsm-hosts-err')).toContainText('out of range');
  await page.locator('#vlsm-hosts').fill('A 30, B 30');
  await expect(rows).toHaveCount(2);
  await expect.poll(() => page.url()).toContain('hosts=A+30');
  await page.goto(page.url());
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('#vlsm-hosts')).toHaveValue('A 30, B 30');
  await done();
});

test('practice: a question is reproducible from its link and checks answers', async ({ page }) => {
  const done = await open(page, `${NET}subnetting-practice/?q=12345&level=2&type=hosts`);
  const prompt = await page.locator('[data-pr-prompt]').textContent();
  const answer = await page.evaluate(() => window.__trace.question.answer);
  await page.locator('#pr-answer').fill('nonsense');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('[data-pr-result]')).toContainText('could not be read');
  await page.locator('#pr-answer').fill(answer);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('[data-pr-result]')).toHaveText(/Correct\./);
  await expect(page.locator('[data-pr-steps] li').first()).toBeVisible();
  await page.goto(`${NET}subnetting-practice/?q=12345&level=2&type=hosts`);
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('[data-pr-prompt]')).toHaveText(prompt);
  // "Next question" picks a new seed (the text can repeat: a hosts question depends only on the prefix).
  await page.locator('[data-pr-next]').click();
  await expect.poll(() => page.url()).toMatch(/q=\d+&level=2&type=hosts/);
  expect(new URL(page.url()).searchParams.get('q')).not.toBe('12345');
  await page.locator('[data-type="same"]').click();
  await expect(page.locator('[data-pr-prompt]')).toContainText('same subnet');
  await done();
});

test('TCP: plays to the end with the golden numbers; reset, input and scenario changes mid-play leave no stale state', async ({ page }) => {
  const done = await open(page, `${NET}tcp-handshake/`);
  await expect(page.locator('[data-tcp-rows] tr').nth(1)).toContainText('5000');
  await expect(page.locator('[data-tcp-rows] tr').nth(1)).toContainText('1001');
  await page.locator('[data-speed] [data-value="4"]').click();
  await page.locator('[data-act="play"]').click();
  await expect.poll(() => page.evaluate(() => window.__trace.player.time)).toBeGreaterThan(2);
  await page.locator('[data-act="reset"]').click();
  expect(await page.evaluate(() => window.__trace.player.playing)).toBe(false);
  // Time 0 is after the first moment: the SYN is on its way.
  await expect(page.locator('[data-state="client"]')).toHaveText('SYN_SENT');
  await expect(page.locator('[data-state="server"]')).toHaveText('LISTEN');
  await expect(page.locator('.tcp-diagram .td-seg:not(.fut)')).toHaveCount(1);
  await page.locator('[data-act="play"]').click();
  await page.locator('#tcp-d').fill('100');
  expect(await page.evaluate(() => window.__trace.player.playing)).toBe(false);
  await expect(page.locator('[data-tcp-rows] tr')).toHaveCount(9);
  await page.locator('[data-scenario="simultaneous"]').click();
  await page.locator('[data-act="play"]').click();
  await expect(page.locator('[data-state="server"]')).toHaveText('CLOSED', { timeout: 15000 });
  await expect(page.locator('[data-state="client"]')).toHaveText('CLOSED');
  await expect(page.locator('.tcp-diagram .fut')).toHaveCount(0);
  await expect.poll(() => page.url()).toContain('s=simultaneous');
  await done();
});

test('TCP: a hidden tab freezes playback and the diagram matches the clock', async ({ page }) => {
  const done = await open(page, `${NET}tcp-handshake/?s=lost&c=10&sv=20&d=0`);
  await page.locator('[data-act="play"]').click();
  await expect.poll(() => page.evaluate(() => window.__trace.player.time)).toBeGreaterThan(1);
  const setHidden = (hidden) =>
    page.evaluate((v) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await setHidden(true);
  const frozen = await page.evaluate(() => window.__trace.player.time);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__trace.player.time)).toBe(frozen);
  await setHidden(false);
  await page.locator('[data-act="play"]').click();
  const k = await page.evaluate(() => Math.floor(window.__trace.player.time + 1e-9));
  const visible = await page.locator('.tcp-diagram .td-seg:not(.fut)').evaluateAll((els) => els.map((e) => Number(e.dataset.t)));
  for (const t of visible) expect(t).toBeLessThanOrEqual(k);
  await expect(page.locator('[data-clock]')).toHaveText(String(k));
  await done();
});

test('390 px: no sideways page scroll on any networking page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['subnet-calculator/', 'subnetting-practice/', 'vlsm-calculator/', 'tcp-handshake/']) {
    await page.goto(`${NET}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBe(390);
  }
});

test('no layout shift while loading the networking pages and playing TCP @chromium-only', async ({ page }) => {
  // Web fonts are blocked here so a shift can only come from the page itself; the font swap
  // (kept by the owner, with metric overrides) is measured by Lighthouse and fontswap.spec.
  await page.route('**/*.woff2', (r) => r.abort());
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const path of ['subnet-calculator/', 'subnetting-practice/', 'vlsm-calculator/']) {
    await page.goto(`${NET}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__cls), path).toBe(0);
  }
  await page.goto(`${NET}tcp-handshake/`);
  await page.waitForFunction(() => !!window.__trace);
  await page.evaluate(() => {
    window.__trace.player.setSpeed(4);
    window.__trace.player.play();
  });
  await page.waitForFunction(() => !window.__trace.player.playing, null, { timeout: 15000 });
  expect(await page.evaluate(() => window.__cls)).toBe(0);
});

test('reduced motion on TCP: stepping animates nothing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${NET}tcp-handshake/`);
  await page.waitForFunction(() => !!window.__trace);
  for (let i = 0; i < 3; i++) await page.locator('[data-act="fwd"]').click();
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
});
