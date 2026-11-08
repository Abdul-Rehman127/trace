// Every page loads with zero console errors and zero CSP or Trusted Types violations,
// in both themes, served with the production headers.
import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/operating-systems/cpu-scheduling/',
  '/operating-systems/cpu-scheduling/fcfs/',
  '/operating-systems/cpu-scheduling/sjf/',
  '/operating-systems/cpu-scheduling/srtf/',
  '/operating-systems/cpu-scheduling/priority/',
  '/operating-systems/cpu-scheduling/round-robin/',
  '/operating-systems/cpu-scheduling/compare/',
  '/about/',
];

async function watch(page) {
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  // Runs before any page script. Init scripts are injected by the browser and are not subject to the page CSP.
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return problems;
}

for (const scheme of ['light', 'dark']) {
  for (const path of PAGES) {
    test(`${path} (${scheme}) has no errors or CSP violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const problems = await watch(page);
      const res = await page.goto(path);
      expect(res.status()).toBe(200);
      const csp = res.headers()['content-security-policy'];
      expect(csp).toContain("require-trusted-types-for 'script'");
      await page.waitForLoadState('networkidle');
      // Toggling the theme exercises the module script.
      await page.locator('[data-theme-toggle]').click();
      const violations = await page.evaluate(() => window.__csp);
      expect(violations).toEqual([]);
      expect(problems).toEqual([]);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }
}

test('unknown paths get the 404 page with status 404', async ({ page }) => {
  const problems = await watch(page);
  const res = await page.goto('/no-such-page/');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Page not found');
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  // The 404 response itself is logged by the browser as a failed resource; nothing else may fail.
  expect(problems.filter((p) => !p.includes('404'))).toEqual([]);
});

test('theme toggle switches and is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(14, 19, 26)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');
});

test('fonts and hashed assets are cached immutably; HTML carries the security headers', async ({ request }) => {
  const html = await request.get('/');
  const headers = html.headers();
  for (const h of ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security', 'cross-origin-opener-policy']) {
    expect(headers[h], h).toBeTruthy();
  }
  const body = await html.text();
  const css = /href="\/(app\.[0-9a-f]{10}\.css)"/.exec(body)[1];
  const js = /src="\/(app\.[0-9a-f]{10}\.js)"/.exec(body)[1];
  for (const path of [`/${css}`, `/${js}`, '/fonts/ibm-plex-sans-latin-400-normal.woff2']) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(200);
    expect(r.headers()['cache-control'], path).toBe('public, max-age=31536000, immutable');
  }
});

test('the violation listener really catches CSP and Trusted Types violations @chromium-only', async ({ page }) => {
  await watch(page);
  await page.goto('/');
  const result = await page.evaluate(() => {
    let threw = false;
    try {
      document.body.innerHTML = '<b>x</b>';
    } catch {
      threw = true;
    }
    return threw;
  });
  expect(result).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__csp.length)).toBeGreaterThan(0);
});
