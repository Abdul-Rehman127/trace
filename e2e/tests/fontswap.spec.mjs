// Fonts that arrive after the first paint (slow networks) must not move anything:
// the metric-matched fallbacks keep CLS at 0. Fonts are delayed by 1.5 s here.
import { test, expect } from '@playwright/test';

const PAGES = [
  '/', '/operating-systems/cpu-scheduling/', '/operating-systems/cpu-scheduling/fcfs/', '/operating-systems/cpu-scheduling/sjf/',
  '/operating-systems/cpu-scheduling/srtf/', '/operating-systems/cpu-scheduling/priority/', '/operating-systems/cpu-scheduling/round-robin/',
  '/operating-systems/cpu-scheduling/compare/', '/about/', '/no-such-page/',
];

for (const width of [412, 1280]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 }, isMobile: width < 640, hasTouch: width < 640 });
    for (const path of PAGES) {
      test(`${path}: late fonts cause no layout shift @fontswap @chromium-only`, async ({ page }) => {
        await page.route('**/*.woff2', async (route) => {
          await new Promise((r) => setTimeout(r, 1500));
          await route.continue();
        });
        await page.addInitScript(() => {
          window.__cls = [];
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls.push({ value: e.value, nodes: e.sources.map((s) => (s.node ? s.node.nodeName + '.' + (s.node.className || '') : '?')) });
          }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(path);
        await page.waitForFunction(() => document.fonts.status === 'loaded' && performance.now() > 2500);
        await page.waitForTimeout(300);
        const shifts = await page.evaluate(() => window.__cls);
        const total = shifts.reduce((s, x) => s + x.value, 0);
        expect(total, JSON.stringify(shifts)).toBe(0);
      });
    }
  });
}
