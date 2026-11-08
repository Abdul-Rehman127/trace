// Checks a deployed Trace site against dist/_headers (run node build.mjs first) and basic serving rules.
// Usage: node scripts/live-check.mjs [https://trace.abmans.com]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.argv[2] || 'https://trace.abmans.com';

const rules = [];
let cur = null;
for (const raw of readFileSync(join(ROOT, 'dist', '_headers'), 'utf8').split(/\r?\n/)) {
  if (!raw.trim()) continue;
  if (!/^\s/.test(raw)) {
    const pattern = raw.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    cur = { re: new RegExp(`^${pattern}$`), h: [] };
    rules.push(cur);
  } else {
    const i = raw.indexOf(':');
    cur.h.push([raw.slice(0, i).trim().toLowerCase(), raw.slice(i + 1).trim()]);
  }
}
const expected = (path) => {
  const m = new Map();
  for (const r of rules) if (r.re.test(path)) for (const [k, v] of r.h) m.set(k, m.has(k) ? `${m.get(k)}, ${v}` : v);
  return m;
};

const home = await (await fetch(`${ORIGIN}/`)).text();
const css = /href="\/(app\.[0-9a-f]{10}\.css)"/.exec(home)[1];
const js = /src="\/(app\.[0-9a-f]{10}\.js)"/.exec(home)[1];
const paths = [
  '/', '/operating-systems/cpu-scheduling/round-robin/', `/${css}`, `/${js}`,
  '/fonts/ibm-plex-sans-latin-400-normal.woff2', '/fonts/big-shoulders-display.woff2',
  '/sitemap.xml', '/robots.txt', '/og.png', '/favicon.svg', '/apple-touch-icon.png', '/no-such-page/',
];
let failures = 0;
for (const p of paths) {
  const r = await fetch(ORIGIN + p, { redirect: 'manual' });
  const bad = [];
  for (const [k, v] of expected(p)) {
    const got = r.headers.get(k);
    if (got !== v) bad.push(`${k}: expected "${v.slice(0, 50)}", got "${String(got).slice(0, 50)}"`);
  }
  if (bad.length) failures++;
  const type = (r.headers.get('content-type') || '').split(';')[0];
  console.log(`${r.status} ${p.padEnd(50)} ${type.padEnd(22)} cache="${r.headers.get('cache-control')}" ${bad.length ? `MISMATCH ${bad.join(' | ')}` : `all ${expected(p).size} _headers values match`}`);
}
console.log(`paths with header mismatches: ${failures}`);

const sm = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`sitemap: ${locs.length} URLs, all https://trace.abmans.com: ${locs.every((l) => l.startsWith('https://trace.abmans.com/'))}`);
for (const l of locs) console.log(`  ${l}`);
console.log(`robots.txt: ${JSON.stringify(await (await fetch(`${ORIGIN}/robots.txt`)).text())}`);
const nf = await fetch(`${ORIGIN}/no-such-page/`);
const nfb = await nf.text();
console.log(`unknown path: status ${nf.status}, noindex ${nfb.includes('content="noindex"')}, h1 "${/<h1>([^<]+)/.exec(nfb)?.[1]}"`);
for (const p of ['/about', '/operating-systems/cpu-scheduling/fcfs']) {
  const r = await fetch(ORIGIN + p, { redirect: 'manual' });
  console.log(`no trailing slash ${p}: ${r.status} -> ${r.headers.get('location')}`);
}
