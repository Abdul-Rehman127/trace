// Generates src/static/og.png (1200 x 630) and src/static/apple-touch-icon.png (180 x 180)
// once, with Playwright, from small HTML pages in the design system. Run: node scripts/og.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'e2e', 'package.json'));
const { chromium } = require('@playwright/test');

const font = (f) => pathToFileURL(join(ROOT, 'src', 'fonts', f)).href;
const css = `
@font-face{font-family:BS;src:url(${font('big-shoulders-display.woff2')});font-weight:100 900}
@font-face{font-family:Mono;src:url(${font('ibm-plex-mono-latin-500-normal.woff2')})}
@font-face{font-family:Sans;src:url(${font('ibm-plex-sans-latin-400-normal.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#EDF1F6;color:#111826;font-family:Sans;padding:84px 88px;position:relative;overflow:hidden}
h1{font:700 172px/.9 BS;letter-spacing:.005em}
p{margin-top:22px;font-size:34px;color:#4C5767;max-width:860px;line-height:1.3}
.stage{position:absolute;left:88px;right:88px;bottom:80px;height:96px;background:#FBFCFD;border:2px solid #D8DFE8;border-radius:22px;padding:26px 28px}
.lane{position:relative;height:42px}
.b{position:absolute;top:0;height:42px;border-radius:9px;font:500 20px/42px Mono;padding-left:14px}
.g{opacity:.18}
.head{position:absolute;top:12px;bottom:12px;width:4px;background:#111826;border-radius:2px}
.f{position:absolute;inset:0 auto 0 0;border-radius:9px 0 0 9px;padding-left:14px}
`;
// Round Robin, q=2, the default example: P1 0-2, P2 2-4, P3 4-5, P1 5-7, P4 7-9, P2 9-10, P1 10-11, P4 11-13
const segs = [['P1',0,2,'#2a78d6','#000'],['P2',2,4,'#eb6834','#0b0b0b'],['P3',4,5,'#1baf7a','#0b0b0b'],['P1',5,7,'#2a78d6','#000'],['P4',7,9,'#eda100','#0b0b0b'],['P2',9,10,'#eb6834','#0b0b0b'],['P1',10,11,'#2a78d6','#000'],['P4',11,13,'#eda100','#0b0b0b']];
const W = 1024 - 56;
const u = W / 13;
const cut = 8.6;
const bars = segs.map(([id, s, e, c, on]) => {
  const left = s * u + 2, width = (e - s) * u - 4;
  if (e <= cut) return `<div class="b" style="left:${left}px;width:${width}px;background:${c};color:${on}">${id}</div>`;
  const ghost = `<div class="b g" style="left:${left}px;width:${width}px;background:${c}"></div>`;
  if (s >= cut) return ghost;
  return ghost + `<div class="b f" style="left:${left}px;width:${(cut - s) * u - 2}px;background:${c};color:${on}">${id}</div>`;
}).join('');
const og = `<!doctype html><html><head><style>${css}</style></head><body>
<h1>Trace</h1><p>Step-by-step simulators that show how computers decide, and why.</p>
<div class="stage"><div class="lane">${bars}</div>
<div class="head" style="left:${28 + cut * u}px"></div></div></body></html>`;

const icon = `<!doctype html><html><head><style>*{margin:0}body{width:180px;height:180px;background:#111826;position:relative}
.b{position:absolute;height:28px;border-radius:9px}</style></head><body>
<div class="b" style="left:28px;top:50px;width:68px;background:#2a78d6"></div>
<div class="b" style="left:96px;top:102px;width:56px;background:#eb6834"></div>
<div style="position:absolute;left:62px;top:30px;width:11px;height:120px;border-radius:6px;background:#E9EEF4"></div>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), 'trace-og-'));
writeFileSync(join(dir, 'og.html'), og);
writeFileSync(join(dir, 'icon.html'), icon);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(dir, 'og.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(ROOT, 'src', 'static', 'og.png') });
await page.setViewportSize({ width: 180, height: 180 });
await page.goto(pathToFileURL(join(dir, 'icon.html')).href);
await page.screenshot({ path: join(ROOT, 'src', 'static', 'apple-touch-icon.png') });
await browser.close();
console.log('Wrote src/static/og.png and src/static/apple-touch-icon.png');
