// Logic: tables, simplification and equivalence update as you type, errors point at a
// position, links round-trip, and the circuit's propagation has no stale state.
import { test, expect } from '@playwright/test';

const LG = '/logic/';

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

test('truth table: rows, columns, canonical forms, a positioned error and a link', async ({ page }) => {
  const done = await open(page, `${LG}truth-table/`);
  const out = page.locator('[data-lg-out]');
  await expect(out.locator('tbody tr')).toHaveCount(8);
  const field = page.locator('#lg-expr');
  await field.fill('A XOR B');
  await expect(out.locator('tbody tr')).toHaveCount(4);
  await expect(out).toContainText('Σm(1, 2)');
  await expect(out).toContainText('ΠM(0, 3)');
  await field.fill('A AND');
  await expect(out.locator('.lg-error')).toContainText('Position 6');
  await expect(out.locator('.lg-caret')).toContainText('^');
  await field.fill("AB + C'");
  await expect(out).toContainText('A AND B OR NOT C');
  await expect.poll(() => page.url()).toContain('e=AB');
  await page.goto(page.url());
  await page.waitForFunction(() => !!window.__trace);
  await expect(field).toHaveValue("AB + C'");
  await done();
});

test('simplifier: two minimal answers are both listed, minterm input works, K-map groups', async ({ page }) => {
  const done = await open(page, `${LG}simplifier/`);
  const out = page.locator('[data-lg-out]');
  await expect(out.locator('.lg-answers').first().locator('li')).toHaveCount(2);
  await expect(out).toContainText('more than one minimal answer');
  await page.locator('[data-lg-mterm] summary').click();
  await page.locator('#lg-n').fill('4');
  await page.locator('#lg-m').fill('0, 2, 5, 7, 8, 10, 13, 15');
  await page.locator('[data-lg-use-m]').click();
  await expect(out.locator('.lg-answers').first().locator('li')).toHaveCount(1);
  await expect(out.locator('.lg-answers').first()).toHaveText("BD + B'D'");
  await expect(out.locator('.kmap td .gm.g1')).toHaveCount(4);
  await expect(out.locator('.kmap td .gm.g2')).toHaveCount(4);
  await page.locator('#lg-m').fill('0, 2, 99');
  await expect(out).toContainText('"99" is not a valid minterm');
  await done();
});

test('equivalence: equivalent pairs and the first differing row', async ({ page }) => {
  const done = await open(page, `${LG}equivalence/`);
  const out = page.locator('[data-lg-out]');
  await expect(out.locator('.lg-verdict')).toHaveClass(/yes/);
  await page.locator('#lg-a').fill('A OR B');
  await page.locator('#lg-b').fill('A XOR B');
  await expect(out.locator('.lg-verdict')).toHaveClass(/no/);
  await expect(out.locator('.lg-verdict')).toContainText('row 3: A = 1, B = 1');
  await expect(out.locator('tr.differs')).toHaveCount(1);
  await page.locator('#lg-b').fill('A OR (B');
  await expect(out).toContainText('Second expression');
  await done();
});

test('circuit: switching inputs propagates level by level; a new expression mid-play leaves no stale state', async ({ page }) => {
  const done = await open(page, `${LG}circuit/`);
  await expect(page.locator('[data-lg-q]')).toHaveText('Q = 0');
  await page.locator('[data-var="A"]').click();
  await expect(page.locator('[data-lg-q]')).toHaveText('Q = 1', { timeout: 5000 });
  await expect(page.locator('[data-var="A"]')).toHaveAttribute('aria-pressed', 'true');
  // Start a change, then replace the expression while it is travelling.
  await page.locator('[data-var="B"]').click();
  await page.locator('#lg-expr').fill('A AND B');
  expect(await page.evaluate(() => window.__trace.player.playing)).toBe(false);
  await expect(page.locator('[data-lg-switches] [data-var]')).toHaveCount(2);
  await expect(page.locator('.circuit .gate')).toHaveCount(1);
  await expect(page.locator('[data-lg-q]')).toHaveText('Q = 1');
  await expect(page.locator('[data-lg-gates] li')).toHaveText(['G1 = A AND B']);
  await expect.poll(() => page.url()).toContain('in=11');
  await page.goto(page.url());
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('[data-lg-q]')).toHaveText('Q = 1');
  await done();
});

test('circuit: reduced motion jumps straight to the result', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${LG}circuit/`);
  await page.waitForFunction(() => !!window.__trace);
  await page.locator('[data-var="C"]').click();
  await expect(page.locator('[data-lg-q]')).toHaveText('Q = 1');
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
});

test('390 px: no sideways page scroll on any logic page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['truth-table/', 'circuit/', 'simplifier/', 'equivalence/']) {
    await page.goto(`${LG}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBe(390);
  }
});

test('no layout shift while loading the logic pages @chromium-only', async ({ page }) => {
  // Web fonts are blocked here so a shift can only come from the page itself; the font swap
  // (kept by the owner, with metric overrides) is measured by Lighthouse and fontswap.spec.
  await page.route('**/*.woff2', (r) => r.abort());
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const path of ['truth-table/', 'circuit/', 'simplifier/', 'equivalence/']) {
    await page.goto(`${LG}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__cls), path).toBe(0);
  }
});
