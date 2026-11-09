// Review screenshots for one section: every page in it, light and dark, at 1440, 1024
// and 390 px, in the states default, hover, selected, focus, mid-play and end (simulator
// pages; the compare page has no playback). Writes JPEGs to the folder given, named
// <page>-<theme>-<width>-<state>.jpg, plus an index.md.
// Usage: node build.mjs && node scripts/review-shots.mjs memory <out-dir>
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../src/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'e2e', 'package.json'));
const { chromium } = require('@playwright/test');
const [section, outDir] = process.argv.slice(2);
const PORT = 8792;
const pages = PAGES.filter((p) => p.section === section);
mkdirSync(outDir, { recursive: true });

const server = spawn(process.execPath, [join(ROOT, 'dev.mjs'), '--port', String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch();
const index = [`# Review screenshots: ${section}`, '', 'Light and dark; 1440, 1024 and 390 px. Each image shows the page from the top through the results.', ''];

const name = (slug) => slug.replace(/^\/|\/$/g, '').replace(/\//g, '_');
for (const page of pages) {
  const isCompare = page.template.endsWith('compare');
  index.push(`## ${page.slug}`, '');
  for (const theme of ['light', 'dark']) {
    for (const width of [1440, 1024, 390]) {
      const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme });
      const tab = await ctx.newPage();
      await tab.goto(`http://localhost:${PORT}${page.slug}`);
      await tab.waitForFunction(() => !!window.__trace);
      await tab.evaluate(() => document.fonts.ready);
      await tab.mouse.move(1, 1);
      const shot = async (state) => {
        await tab.waitForTimeout(260);
        const f = `${name(page.slug)}-${theme}-${width}-${state}.jpg`;
        // From the top of the intro (title and selector) to the bottom of the tool and results.
        const clip = await tab.evaluate(() => {
          const top = document.querySelector('.intro').getBoundingClientRect().top + window.scrollY;
          const bottom = document.querySelector('.tool').getBoundingClientRect().bottom + window.scrollY;
          return { x: 0, y: Math.max(0, top - 8), width: document.documentElement.clientWidth, height: bottom - top + 16 };
        });
        await tab.screenshot({ path: join(outDir, f), type: 'jpeg', quality: 72, fullPage: true, clip, animations: 'disabled' });
        index.push(`- ${theme}, ${width} px, ${state}: \`${f}\``);
      };
      await shot('default');
      // Hover: the first algorithm link or button that is not the current one, else the first preset chip.
      const hoverTarget = isCompare ? tab.locator('.cmp-open').first() : tab.locator('.alg:not([aria-current]):not([aria-pressed="true"])').first();
      await hoverTarget.hover();
      await shot('hover');
      await tab.mouse.move(1, 1);
      // Selected: the Belady preset pressed (and, on the overview, LRU chosen in the selector).
      if (page.selectable) await tab.locator('[data-alg-choice="lru"]').click();
      await tab.locator('[data-preset="belady"]').click();
      await tab.mouse.move(1, 1);
      await shot('selected');
      // Focus: keyboard focus on the reference string field.
      await tab.locator('#pg-refs').focus();
      await tab.keyboard.press('Shift+Tab');
      await tab.keyboard.press('Tab');
      await shot('focus');
      if (!isCompare) {
        await tab.locator('[data-preset="classic"]').click();
        await tab.evaluate(() => {
          window.__trace.player.setSpeed(4);
          window.__trace.player.play();
        });
        await tab.waitForFunction(() => window.__trace.player.time >= 9);
        await tab.evaluate(() => window.__trace.player.pause());
        await shot('mid-play');
        await tab.evaluate(() => window.__trace.player.seek(window.__trace.player.length, { animate: false }));
        await shot('end');
      }
      await ctx.close();
    }
  }
  index.push('');
}
writeFileSync(join(outDir, 'index.md'), index.join('\n'));
await browser.close();
server.kill();
console.log(`Wrote ${index.filter((l) => l.startsWith('- ')).length} screenshots to ${outDir}`);
