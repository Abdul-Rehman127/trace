// Records every body the analytics beacon sends (sendBeacon, fetch and XHR, including
// Blob bodies) on a live share-link page, then reports whether any part of the query string
// appears in any of them. Usage: node scripts/live-beacon.mjs [origin]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'e2e', 'package.json'));
const { chromium, webkit } = require('@playwright/test');
const ORIGIN = process.argv[2] || 'https://trace.abmans.com';
const PATH = '/operating-systems/cpu-scheduling/round-robin/?alg=rr&q=4&tie=new&p=0:24,0:3,0:3';
const NEEDLES = ['alg=', 'q=4', 'tie=new', 'p=0', '0:24', '0%3A24', '0:3', '0%3A3', '?alg'];
const UA = {
  chromium: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  webkit: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
};

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const context = await browser.newContext({ userAgent: UA[name] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__sent = [];
    const record = (via, url, body) => {
      const push = (text) => window.__sent.push({ via, url: String(url), body: text });
      if (body instanceof Blob) body.text().then(push);
      else if (body == null) push('');
      else push(typeof body === 'string' ? body : JSON.stringify(body));
    };
    const sb = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => {
      record('sendBeacon', url, data);
      return sb(url, data);
    };
    const f = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      record('fetch', typeof input === 'string' ? input : input.url, init.body);
      return f(input, init);
    };
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, url, ...rest) {
      this.__url = url;
      return open.call(this, m, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (body) {
      record('xhr', this.__url, body);
      return send.call(this, body);
    };
  });
  await page.goto(ORIGIN + PATH, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  // Change an input (the page updates its URL with replaceState), then simulate the tab
  // being hidden, which is when the beacon flushes its final report.
  await page.locator('#p2-burst').fill('5');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pagehide'));
  });
  await page.waitForTimeout(1500);
  const sent = await page.evaluate(() => window.__sent);
  console.log(`\n===== ${name}: ${sent.length} beacon sends recorded; page URL now ${page.url()}`);
  for (const s of sent) {
    const hits = NEEDLES.filter((n) => s.body.includes(n) || s.url.includes(n));
    let fields = '';
    try {
      const j = JSON.parse(s.body);
      fields = Object.keys(j).join(', ');
      if (j.location || j.referrer || j.landingPath) fields += ` | location=${j.location} referrer=${j.referrer} landingPath=${j.landingPath}`;
      if (j.eventType !== undefined) fields += ` | eventType=${j.eventType} nt=${j.nt}`;
    } catch {
      fields = s.body ? `raw ${s.body.slice(0, 120)}` : '(empty body)';
    }
    console.log(`${s.via} ${s.url.replace(ORIGIN, '')} query-string pieces found: ${hits.length ? hits.join(' ') : 'none'}`);
    console.log(`   ${fields}`);
    if (process.env.FULL && s.body) console.log(`   FULL: ${s.body}`);
  }
  await browser.close();
}
