// Opens every page of the live site in Chromium and WebKit with normal browser user agents
// (Cloudflare injects the analytics beacon only for browsers), and records console messages,
// CSP / Trusted Types violations, and every request to Cloudflare Insights with its payload.
// Usage: node scripts/live-browser.mjs [origin] > report.json
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'e2e', 'package.json'));
const { chromium, webkit } = require('@playwright/test');
const ORIGIN = process.argv[2] || 'https://trace.abmans.com';
if (/\.pages\.dev/.test(ORIGIN)) {
  console.error('Note: this is a preview deployment. Cloudflare Pages injects its own analytics snippet there, so one CSP error per page is expected (see README). Use the local build or production for CSP checks.');
}

const PAGES = [
  '/', '/operating-systems/cpu-scheduling/', '/operating-systems/cpu-scheduling/fcfs/', '/operating-systems/cpu-scheduling/sjf/',
  '/operating-systems/cpu-scheduling/srtf/', '/operating-systems/cpu-scheduling/priority/', '/operating-systems/cpu-scheduling/round-robin/',
  '/operating-systems/cpu-scheduling/compare/', '/about/', '/this-page-does-not-exist/',
  '/operating-systems/cpu-scheduling/round-robin/?alg=rr&q=4&tie=new&p=0:24,0:3,0:3',
];
const UA = {
  chromium: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  webkit: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
};

const out = [];
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  for (const path of PAGES) {
    const context = await browser.newContext({ userAgent: UA[name] });
    const page = await context.newPage();
    const rec = { engine: name, path, console: [], violations: [], beacon: [], pageErrors: [], beaconScript: null };
    page.on('console', (m) => rec.console.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => rec.pageErrors.push(e.message));
    page.on('request', (r) => {
      if (/cloudflareinsights|cdn-cgi\/rum/.test(r.url())) rec.beacon.push({ method: r.method(), url: r.url(), body: r.postData() });
    });
    page.on('response', (r) => {
      if (/cloudflareinsights|cdn-cgi\/rum/.test(r.url())) {
        const b = rec.beacon.find((x) => x.url === r.url() && x.status === undefined);
        if (b) b.status = r.status();
      }
    });
    page.on('requestfailed', (r) => {
      if (/cloudflareinsights|cdn-cgi\/rum/.test(r.url())) {
        const b = rec.beacon.find((x) => x.url === r.url() && x.status === undefined);
        if (b) b.status = `failed: ${r.failure()?.errorText}`;
      }
    });
    await page.addInitScript(() => {
      window.__v = [];
      document.addEventListener('securitypolicyviolation', (e) =>
        window.__v.push({ directive: e.violatedDirective, blocked: e.blockedURI, source: e.sourceFile, sample: e.sample }),
      );
    });
    const res = await page.goto(ORIGIN + path, { waitUntil: 'load' });
    rec.status = res.status();
    await page.waitForTimeout(3500);
    rec.beaconScript = await page.evaluate(() => {
      const s = document.querySelector('script[src*="cloudflareinsights"]');
      return s ? s.getAttribute('src').split('/').slice(0, 4).join('/') : null;
    });
    // Interact on simulator pages so the URL changes by replaceState, then flush the beacon by hiding the page.
    if (path.includes('round-robin')) {
      await page.locator('#p2-burst').fill('5');
      await page.waitForTimeout(800);
      rec.urlAfterEdit = page.url();
    }
    rec.violations = await page.evaluate(() => window.__v);
    await page.goto('about:blank');
    await page.waitForTimeout(1500);
    out.push(rec);
    await context.close();
  }
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
