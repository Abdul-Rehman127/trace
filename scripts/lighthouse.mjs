// Lighthouse (mobile, the default form factor) on every page, served locally by dev.mjs
// with the production headers. Gate: Performance 95 or more; Accessibility, Best Practices
// and SEO 100; CLS 0. Prints a table and exits non-zero on any miss. Numbers are reported
// as measured; nothing here tunes the test.
//
// Lighthouse is run through npx at a pinned version and is not a dependency of the site
// (see DECISIONS.md). It needs a local Chrome or Chromium.
// Usage: node scripts/lighthouse.mjs [--only /memory/] [--origin https://...]
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../src/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIGHTHOUSE = 'lighthouse@12.8.2';
const PORT = 8797;
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const remote = args.includes('--origin') ? args[args.indexOf('--origin') + 1] : '';
const origin = remote || `http://localhost:${PORT}`;
const out = join(tmpdir(), 'trace-lighthouse');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let server = null;
if (!remote) {
  server = spawn(process.execPath, [join(ROOT, 'dev.mjs'), '--port', String(PORT)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1200));
}

const paths = PAGES.filter((p) => !p.noindex && (!only || p.slug.includes(only))).map((p) => p.slug);
const rows = [];
let failed = 0;
for (const path of paths) {
  const file = join(out, `${path.replace(/\//g, '_') || 'home'}.json`);
  const run = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['-y', LIGHTHOUSE, `${origin}${path}`, '--quiet', '--chrome-flags=--headless=new', '--output=json', `--output-path=${file}`, '--only-categories=performance,accessibility,best-practices,seo'],
    { stdio: 'ignore', shell: process.platform === 'win32', timeout: 300000 },
  );
  if (run.status !== 0) {
    rows.push({ path, error: `lighthouse exited with ${run.status}` });
    failed++;
    continue;
  }
  const r = JSON.parse(readFileSync(file, 'utf8'));
  const score = (id) => Math.round(r.categories[id].score * 100);
  const cls = r.audits['cumulative-layout-shift'].numericValue;
  const row = { path, perf: score('performance'), a11y: score('accessibility'), bp: score('best-practices'), seo: score('seo'), cls: +cls.toFixed(4) };
  const misses = [];
  if (row.perf < 95) misses.push('performance');
  if (row.a11y < 100) misses.push('accessibility');
  if (row.bp < 100) misses.push('best practices');
  if (row.seo < 100) misses.push('SEO');
  if (cls > 0) misses.push('CLS');
  if (misses.length) {
    failed++;
    const audits = Object.values(r.audits).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary').map((a) => a.id);
    row.misses = `${misses.join(', ')}${audits.length ? ` (failing audits: ${audits.join(', ')})` : ''}`;
  }
  rows.push(row);
  console.log(`${String(row.perf).padStart(3)} ${String(row.a11y).padStart(3)} ${String(row.bp).padStart(3)} ${String(row.seo).padStart(3)}  CLS ${row.cls}  ${path}${row.misses ? `  MISS: ${row.misses}` : ''}`);
}
if (server) server.kill();
console.log(`Lighthouse mobile: ${rows.length - failed} of ${rows.length} pages pass (Performance, Accessibility, Best Practices, SEO, CLS).`);
process.exit(failed ? 1 : 0);
