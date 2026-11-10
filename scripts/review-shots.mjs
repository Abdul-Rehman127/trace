// Review screenshots for one section: every page in it, light and dark, at 1440, 1024
// and 390 px, in the states default, hover, selected, focus, mid-play and end (simulator
// pages with a player; the others have no playback). Writes JPEGs to the folder given, named
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
      // Hover: an algorithm or tool link that is not the current page, else an open-in-simulator link.
      const hoverTarget = (await tab.locator('.alg:not([aria-current]):not([aria-pressed="true"])').count())
        ? tab.locator('.alg:not([aria-current]):not([aria-pressed="true"])').first()
        : tab.locator('.cmp-open').first();
      await hoverTarget.hover();
      await shot('hover');
      await tab.mouse.move(1, 1);
      // Selected: a preset, example or scenario chip pressed (and, on an overview, another algorithm chosen).
      if (page.selectable) await tab.locator('[data-alg-choice]').nth(1).click();
      for (const sel of ['[data-preset="belady"]', '[data-scenario="simultaneous"]', '[data-example]', '[data-net][data-hosts]', '[data-type="range"]']) {
        const loc = tab.locator(sel);
        if (await loc.count()) {
          await loc.nth(Math.min(1, (await loc.count()) - 1)).click();
          break;
        }
      }
      await tab.mouse.move(1, 1);
      await shot('selected');
      // Focus: keyboard focus on the first field (or board square or chip where there is no field).
      await tab.locator('textarea, input.num, button.ttt-c:not([disabled]), .presets .chip').first().focus();
      await tab.keyboard.press('Shift+Tab');
      await tab.keyboard.press('Tab');
      await shot('focus');
      const playable = await tab.evaluate(() => !!(window.__trace && window.__trace.player));
      if (playable) {
        // Mid-play: start playing, then move to the halfway point (long traces would take minutes).
        await tab.evaluate(() => {
          const p = window.__trace.player;
          p.seek(Math.floor(p.length / 2), { animate: false });
          p.setSpeed(4);
          p.play();
        });
        await tab.waitForTimeout(300);
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
