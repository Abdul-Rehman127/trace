// Content lint over the built site (run `node build.mjs` first). Exits non-zero on any failure.
// Checks: no em dashes in copy; no "learn" or "discover" in titles, headings or link names;
// title and description lengths; exactly one H1; no skipped heading levels; every internal
// link and in-page anchor resolves; every indexable page is in the sitemap; canonicals use
// https://trace.abmans.com and match the page.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, SITE } from '../src/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const fileFor = (slug) => join(DIST, slug.endsWith('.html') ? slug : join(slug, 'index.html'));
const TITLE = [20, 65];
const DESC = [110, 160];

const failures = [];
const fail = (slug, msg) => failures.push(`${slug}: ${msg}`);
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const pages = new Map();
for (const p of PAGES) {
  const f = fileFor(p.slug);
  if (!existsSync(f)) {
    fail(p.slug, 'page was not built');
    continue;
  }
  pages.set(p.slug, { page: p, html: readFileSync(f, 'utf8') });
}
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');

for (const [slug, { page, html }] of pages) {
  // Em dashes anywhere in the page (copy, attributes, data). En dashes too, for the same reason.
  if (/[—–]|&mdash;|&ndash;/.test(html)) fail(slug, 'contains an em or en dash');

  const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] || '');
  const desc = decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] || '');
  if (title.length < TITLE[0] || title.length > TITLE[1]) fail(slug, `title is ${title.length} characters (want ${TITLE[0]} to ${TITLE[1]})`);
  if (!page.noindex && (desc.length < DESC[0] || desc.length > DESC[1])) fail(slug, `description is ${desc.length} characters (want ${DESC[0]} to ${DESC[1]})`);

  // Banned words in names: title, headings, link and button text.
  const names = [title, ...[...html.matchAll(/<(h[1-6]|a|button|summary)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => decode(text(m[2])))];
  for (const n of names) if (/\b(learn|discover)/i.test(n)) fail(slug, `"${n.trim().slice(0, 60)}" uses learn or discover`);

  const h1s = html.match(/<h1\b/g) || [];
  if (h1s.length !== 1) fail(slug, `has ${h1s.length} H1 elements`);
  let last = 0;
  for (const m of html.matchAll(/<h([1-6])\b/g)) {
    const level = Number(m[1]);
    if (last && level > last + 1) fail(slug, `heading jumps from h${last} to h${level}`);
    last = level;
  }

  const pageIds = ids(html);
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (/^(https?:|mailto:)/.test(href)) continue;
    if (href.startsWith('#')) {
      if (href.length > 1 && !pageIds.has(href.slice(1))) fail(slug, `anchor ${href} has no target`);
      continue;
    }
    if (!href.startsWith('/')) continue;
    const [pathAndQuery, hash] = href.split('#');
    const path = pathAndQuery.split('?')[0];
    const target = path.endsWith('/') ? join(DIST, path, 'index.html') : join(DIST, path);
    if (!existsSync(target)) {
      fail(slug, `link ${href} does not resolve`);
      continue;
    }
    if (hash && path.endsWith('/') && !ids(readFileSync(target, 'utf8')).has(hash)) fail(slug, `link ${href} points at a missing id`);
  }

  if (!page.noindex) {
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    if (canonical !== `${SITE.origin}${slug}`) fail(slug, `canonical is ${canonical}`);
    if (!canonical?.startsWith('https://trace.abmans.com/')) fail(slug, 'canonical is not on https://trace.abmans.com');
    if (!sitemap.includes(`<loc>${SITE.origin}${slug}</loc>`)) fail(slug, 'missing from sitemap.xml');
  }
}

if (failures.length) {
  console.error(`Content lint: ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`Content lint: ${pages.size} pages clean.`);
