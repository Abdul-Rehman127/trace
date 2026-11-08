// Live checks: canonical and og:url on every page, and that "Copy link" produces a URL that
// restores the exact scenario. Usage: node scripts/live-share.mjs [origin]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'e2e', 'package.json'));
const { chromium } = require('@playwright/test');
const ORIGIN = process.argv[2] || 'https://trace.abmans.com';
const PAGES = ['/', '/operating-systems/cpu-scheduling/', '/operating-systems/cpu-scheduling/fcfs/', '/operating-systems/cpu-scheduling/sjf/',
  '/operating-systems/cpu-scheduling/srtf/', '/operating-systems/cpu-scheduling/priority/', '/operating-systems/cpu-scheduling/round-robin/',
  '/operating-systems/cpu-scheduling/compare/', '/about/'];

for (const p of PAGES) {
  const html = await (await fetch(ORIGIN + p)).text();
  const canonical = /<link rel="canonical" href="([^"]+)">/.exec(html)?.[1];
  const og = /<meta property="og:url" content="([^"]+)">/.exec(html)?.[1];
  const ok = canonical === `https://trace.abmans.com${p}` && og === canonical;
  console.log(`${ok ? 'ok  ' : 'BAD '} ${p.padEnd(48)} canonical=${canonical} og:url=${og === canonical ? 'same' : og}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
for (const [path, edits] of [
  ['/operating-systems/cpu-scheduling/round-robin/', async (page) => {
    await page.locator('#p3-burst').fill('7');
    await page.locator('[data-opt="quantum"]').fill('3');
    await page.locator('[data-tie] [data-value="preempted"]').click();
  }],
  ['/operating-systems/cpu-scheduling/priority/', async (page) => {
    await page.locator('#p5-priority').fill('9');
    await page.locator('#opt-preemptive').check();
  }],
  ['/operating-systems/cpu-scheduling/compare/', async (page) => {
    await page.locator('#p2-burst').fill('6');
  }],
]) {
  const page = await context.newPage();
  await page.goto(ORIGIN + path);
  await page.waitForFunction(() => !!window.__trace);
  await edits(page);
  const before = await page.locator('table').first().innerText();
  const avgBefore = await page.locator('[data-avg="waiting"], [data-cmp-rows]').first().innerText();
  await page.locator('[data-copy]').click();
  await page.waitForFunction(() => document.querySelector('[data-toast]').textContent !== '', null, { timeout: 3000 }).catch(() => {});
  const toast = await page.locator('[data-toast]').innerText();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  const fresh = await context.newPage();
  await fresh.goto(url);
  await fresh.waitForFunction(() => !!window.__trace);
  const after = await fresh.locator('table').first().innerText();
  const avgAfter = await fresh.locator('[data-avg="waiting"], [data-cmp-rows]').first().innerText();
  const ok = url.startsWith(`${ORIGIN}${path}?`) && before === after && avgBefore === avgAfter;
  console.log(`${ok ? 'ok  ' : 'BAD '} copy link on ${path}: toast "${toast}", url ${url}, inputs and results restored: ${before === after && avgBefore === avgAfter}`);
  await page.close();
  await fresh.close();
}
await browser.close();
