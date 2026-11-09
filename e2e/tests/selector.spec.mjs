// The algorithm selector: real buttons, a 3 + 2 grid on phones, and a cross-page view
// transition that keeps share links working and never trips the CSP.
import { test, expect } from '@playwright/test';

const CPU = '/operating-systems/cpu-scheduling/';

async function watch(page) {
  const problems = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective));
    // Records whether the page arrived through a view transition (Chromium supports pagereveal).
    window.addEventListener('pagereveal', (e) => { window.__vt = !!e.viewTransition; });
  });
  return problems;
}

test('each option is a bordered button; the selected one is filled with a check', async ({ page }) => {
  await page.goto(`${CPU}fcfs/`);
  const opts = page.locator('.algs .alg');
  await expect(opts).toHaveCount(5);
  const look = await opts.evaluateAll((els) => els.map((el) => {
    const s = getComputedStyle(el);
    const check = el.querySelector('.alg-check');
    return { border: s.borderTopWidth, h: el.getBoundingClientRect().height, check: getComputedStyle(check).visibility };
  }));
  for (const l of look) {
    expect(l.border).toBe('1px');
    expect(l.h).toBeGreaterThanOrEqual(40);
  }
  expect(look.map((l) => l.check)).toEqual(['visible', 'hidden', 'hidden', 'hidden', 'hidden']);
  await expect(opts.first()).toHaveAttribute('aria-current', 'page');
});

test('hovering does not move the label (icon space is reserved) @chromium-only', async ({ page }) => {
  await page.goto(`${CPU}fcfs/`);
  const label = page.locator('[data-alg-link="sjf"] .alg-t');
  const before = await label.evaluate((el) => el.getBoundingClientRect().left);
  const width = await page.locator('[data-alg-link="sjf"]').evaluate((el) => el.getBoundingClientRect().width);
  await page.locator('[data-alg-link="sjf"]').hover();
  await page.waitForTimeout(300);
  expect(await label.evaluate((el) => el.getBoundingClientRect().left)).toBe(before);
  expect(await page.locator('[data-alg-link="sjf"]').evaluate((el) => el.getBoundingClientRect().width)).toBe(width);
});

test('at 390 px the selector is a 3 + 2 grid of 44 px targets with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${CPU}round-robin/`);
  const m = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.algs .alg')];
    const rects = els.map((el) => el.getBoundingClientRect());
    return {
      docW: document.documentElement.scrollWidth,
      minH: Math.min(...rects.map((r) => r.height)),
      rows: [...new Set(rects.map((r) => Math.round(r.top)))].length,
      firstRow: rects.filter((r) => Math.round(r.top) === Math.round(rects[0].top)).length,
      right: Math.max(...rects.map((r) => r.right)),
    };
  });
  expect(m.docW).toBe(390);
  expect(m.minH).toBeGreaterThanOrEqual(44);
  expect(m.rows).toBe(2);
  expect(m.firstRow).toBe(3);
  expect(m.right).toBeLessThanOrEqual(390);
});

test('moving between algorithm pages uses a view transition, keeps the processes, and stays inside the CSP @chromium-only', async ({ page }) => {
  const problems = await watch(page);
  await page.goto(`${CPU}fcfs/?alg=fcfs&p=0:24,0:3,0:7`);
  await page.waitForFunction(() => !!window.__trace);
  await page.locator('#p1-burst').fill('9');
  await expect(page.locator('[data-alg-link="sjf"]')).toHaveAttribute('href', /\?alg=sjf&p=0:9,0:3,0:7$/);
  await page.locator('[data-alg-link="sjf"]').click();
  await page.waitForURL(/\/sjf\/\?alg=sjf&p=0:9,0:3,0:7$/);
  await page.waitForFunction(() => !!window.__trace);
  expect(await page.evaluate(() => window.__vt)).toBe(true);
  await expect(page.locator('#p1-burst')).toHaveValue('9');
  await expect(page.locator('[data-alg-link="sjf"]')).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  expect(problems).toEqual([]);
});

test('with reduced motion there is no view transition @chromium-only', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await watch(page);
  await page.goto(`${CPU}fcfs/`);
  await page.locator('[data-alg-link="sjf"]').click();
  await page.waitForURL(/\/sjf\/$/);
  await page.waitForFunction(() => !!window.__trace);
  expect(await page.evaluate(() => window.__vt)).toBe(false);
});

test('compare page algorithm names are labelled links to the simulator', async ({ page }) => {
  await page.goto(`${CPU}compare/`);
  const link = page.locator('.cmp-open').first();
  await expect(link).toHaveAccessibleName('FCFS, open in the simulator');
  await expect(link).toHaveAttribute('href', /\/fcfs\/\?alg=fcfs&p=/);
  expect(await link.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px');
});
