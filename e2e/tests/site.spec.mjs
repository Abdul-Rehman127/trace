// Phase 3 pages: home hero, compare, written content without JavaScript, email,
// SEO tags, sitemap, headings and house style.
import { test, expect } from '@playwright/test';

const ALG_PAGES = ['fcfs', 'sjf', 'srtf', 'priority', 'round-robin'].map((s) => `/operating-systems/cpu-scheduling/${s}/`);
const INDEXABLE = ['/', '/operating-systems/cpu-scheduling/', ...ALG_PAGES, '/operating-systems/cpu-scheduling/compare/', '/about/'];
const ORIGIN = 'https://trace.abmans.com';

test('home hero animates, and stays static with reduced motion', async ({ browser }) => {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const count = await page.evaluate(() => document.querySelector('[data-hero]').getAnimations({ subtree: true }).length);
    if (reducedMotion === 'reduce') expect(count).toBe(0);
    else expect(count).toBeGreaterThan(10);
    await expect(page.locator('#operating-systems a')).toHaveCount(7);
    await context.close();
  }
});

test('compare runs all five and updates with the inputs', async ({ page }) => {
  await page.goto('/operating-systems/cpu-scheduling/compare/');
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('[data-cmp-rows] tr')).toHaveCount(5);
  await expect(page.locator('[data-cmp-strips] .mini-lane')).toHaveCount(5);
  const srtf = page.locator('[data-cmp-rows] tr', { hasText: 'SRTF' });
  await expect(srtf.locator('td').first()).toContainText('6.50');
  await expect(srtf.locator('td').first()).toHaveClass(/best/);
  await page.locator('#p3-burst').fill('1');
  await expect(srtf.locator('td').first()).not.toContainText('6.50');
  await expect.poll(() => page.url()).toContain('p=0:8:2,1:4:3,2:1:1,3:5:4');
  const url = page.url();
  await page.goto(url);
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('#p3-burst')).toHaveValue('1');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const path of ALG_PAGES) {
    test(`${path} reads well: content, formulas and the worked example`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('[data-tool]')).toBeHidden();
      await expect(page.locator('noscript').first()).toBeAttached();
      await expect(page.locator('.prose h2', { hasText: 'Worked example' })).toBeVisible();
      await expect(page.locator('.prose table.data tbody tr').first()).toBeVisible();
      await expect(page.locator('.formula-list li')).toHaveCount(3);
      await expect(page.locator('[data-email]')).toHaveText('Email: abdul at abmans dot com');
      const words = await page.locator('.prose').evaluate((el) => el.innerText.split(/\s+/).filter(Boolean).length);
      expect(words).toBeGreaterThanOrEqual(600);
    });
  }
});

test('the mistake-report email is assembled in the browser', async ({ page }) => {
  await page.goto('/operating-systems/cpu-scheduling/srtf/');
  const link = page.locator('[data-email] a');
  await expect(link).toHaveText('abdul@abmans.com');
  await expect(link).toHaveAttribute('href', 'mailto:abdul@abmans.com?subject=Mistake%20on%20the%20SRTF%20page');
  const html = await (await page.request.get('/operating-systems/cpu-scheduling/srtf/')).text();
  expect(html).not.toContain('abdul@abmans.com');
});

test('titles, descriptions, canonicals, JSON-LD and headings', async ({ request }) => {
  const titles = new Set();
  for (const path of INDEXABLE) {
    const html = await (await request.get(path)).text();
    const title = /<title>([^<]+)<\/title>/.exec(html)[1];
    expect(titles.has(title), `duplicate title ${title}`).toBe(false);
    titles.add(title);
    const desc = /<meta name="description" content="([^"]+)">/.exec(html)[1];
    expect(desc.length, path).toBeGreaterThanOrEqual(140);
    expect(desc.length, path).toBeLessThanOrEqual(155);
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}${path}">`);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    if (path !== '/') expect(blocks.some((b) => b['@type'] === 'BreadcrumbList')).toBe(true);
    if (path.includes('cpu-scheduling')) {
      const app = blocks.find((b) => b['@type'] === 'WebApplication');
      expect(app.isAccessibleForFree).toBe(true);
      expect(app.offers.price).toBe('0');
      expect(JSON.stringify(app)).not.toMatch(/aggregateRating|"review/i);
    }
    expect((html.match(/<h1[\s>]/g) || []).length, path).toBe(1);
    // Headings never skip a level.
    const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `${path} heading order`).toBeLessThanOrEqual(1);
    expect(html.includes('—'), `${path} has an em dash`).toBe(false);
    expect(html).toContain('<meta property="og:image" content="https://trace.abmans.com/og.png">');
  }
});

test.describe('390 px phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const path of [...INDEXABLE, '/404.html']) {
    test(`${path} has no horizontal page overflow`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(inner).toBe(390);
      expect(scroll).toBeLessThanOrEqual(390);
    });
  }
});

test('sitemap, robots, 404 noindex, icons', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of INDEXABLE) expect(sitemap).toContain(`<loc>${ORIGIN}${path}</loc>`);
  expect(sitemap).not.toContain('404');
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  const nf = await (await request.get('/404.html')).text();
  expect(nf).toContain('<meta name="robots" content="noindex">');
  expect(nf).not.toContain('rel="canonical"');
  for (const icon of ['/favicon.svg', '/apple-touch-icon.png', '/og.png']) expect((await request.get(icon)).status(), icon).toBe(200);
});
