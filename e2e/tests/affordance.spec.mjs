// Every visible link on every page has an affordance: an underline or a visible border
// (buttons and link buttons). The wordmark is the one allowed exception: a logo link in
// the top corner is a convention. Taken from src/pages.mjs, so new pages are covered.
import { test, expect } from '@playwright/test';
import { PAGES } from '../../src/pages.mjs';

const ALLOWED = ['mark'];

for (const p of PAGES) {
  const path = p.slug === '/404.html' ? '/no-such-page/' : p.slug;
  test(`links on ${path} look like links`, async ({ page }) => {
    await page.goto(path);
    const bare = await page.evaluate((allowed) => {
      const out = [];
      for (const a of document.querySelectorAll('a[href]')) {
        const r = a.getBoundingClientRect();
        const s = getComputedStyle(a);
        if (r.width === 0 || r.height === 0 || s.visibility === 'hidden' || a.closest('[hidden], .sr-only')) continue;
        if (a.classList.contains('skip')) continue;
        if (allowed.some((c) => a.classList.contains(c))) continue;
        const underline = s.textDecorationLine.includes('underline');
        const border = ['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none');
        if (!underline && !border) out.push(`${a.className || a.tagName}: ${a.textContent.trim().slice(0, 40)}`);
      }
      return out;
    }, ALLOWED);
    expect(bare).toEqual([]);
  });
}
