// Screenshots of the Round Robin page for self-review: 1440, 1024 and 390 px wide,
// light and dark, mid-playback and at the end. Output: shots/*.png
// Run with `npm run shots` (Playwright is installed in e2e/).

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'e2e', 'package.json'));
const { chromium } = require('@playwright/test');

const PORT = 8797;
const BASE = `http://localhost:${PORT}`;
const PATH = process.argv[2] || '/operating-systems/cpu-scheduling/round-robin/';
const OUT = join(ROOT, 'shots');
const WIDTHS = [
  { w: 1440, h: 1000 },
  { w: 1024, h: 1000 },
  { w: 390, h: 844, mobile: true },
];

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('dev server did not start');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = spawn(process.execPath, [join(ROOT, 'dev.mjs'), '--port', String(PORT)], { stdio: 'ignore' });
  try {
    await waitForServer();
    const browser = await chromium.launch();
    for (const scheme of ['light', 'dark']) {
      for (const { w, h, mobile } of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width: w, height: h },
          deviceScaleFactor: mobile ? 3 : 1,
          isMobile: !!mobile,
          hasTouch: !!mobile,
          colorScheme: scheme,
        });
        const page = await context.newPage();
        await page.goto(BASE + PATH);
        await page.waitForFunction(() => window.__trace && document.fonts.status === 'loaded');
        await page.waitForTimeout(400);
        const T = await page.evaluate(() => window.__trace.player.length);
        await page.evaluate((t) => window.__trace.player.seek(t, { animate: false }), Math.round(T * 0.45 * 2) / 2 + 0.5);
        // On a phone, frame the stage (the dock stays fixed at the bottom).
        if (mobile) await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-stage]').getBoundingClientRect().top + window.scrollY - 16));
        await page.waitForTimeout(350);
        await page.screenshot({ path: join(OUT, `rr-${w}-${scheme}-mid.png`), fullPage: !mobile, animations: 'disabled' });
        await page.evaluate((t) => window.__trace.player.seek(t, { animate: false }), T);
        await page.waitForTimeout(350);
        await page.screenshot({ path: join(OUT, `rr-${w}-${scheme}-end.png`), fullPage: !mobile, animations: 'disabled' });
        await context.close();
      }
    }
    await browser.close();
    console.log(`Saved 12 screenshots to ${OUT}`);
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
