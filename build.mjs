// Static site generator for Trace. Zero dependencies except esbuild.
// Output: dist/ with one HTML file per page in src/pages.mjs, hashed CSS and JS,
// fonts, static files, robots.txt, sitemap.xml and _headers.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rm, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { PAGES, SITE } from './src/pages.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const CSS_ORDER = ['tokens.css', 'base.css', 'components.css', 'tool.css'];

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/** `{{key}}` is HTML-escaped, `{{{key}}}` is inserted raw (trusted build-time HTML only). */
export function render(template, data) {
  return template
    .replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, k) => {
      if (!(k in data)) throw new Error(`Template value missing: ${k}`);
      return String(data[k]);
    })
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
      if (!(k in data)) throw new Error(`Template value missing: ${k}`);
      return esc(data[k]);
    });
}

/** JSON for a <script type="application/ld+json"> data block, safe against `</script>`. */
const jsonForScript = (obj) =>
  JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const absolute = (path) => SITE.origin + path;

function jsonLd(page) {
  const blocks = [];
  if (page.template === 'tool') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: page.h1,
      url: absolute(page.slug),
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      inLanguage: 'en',
      isAccessibleForFree: true,
      author: { '@type': 'Person', name: SITE.author.name, url: SITE.author.url },
    });
  }
  if (page.slug !== '/' && !page.noindex) {
    const items = [{ name: 'Trace', path: '/' }, ...page.breadcrumb];
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: absolute(c.path),
      })),
    });
  }
  return blocks
    .map((b) => `<script type="application/ld+json">${jsonForScript(b)}</script>\n`)
    .join('');
}

function crumbsHtml(page) {
  if (!page.breadcrumb.length) return '';
  const parts = page.breadcrumb.map((c, i) => {
    const last = i === page.breadcrumb.length - 1;
    return last
      ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
      : `<li><a href="${esc(c.path)}">${esc(c.name)}</a></li>`;
  });
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${parts.join('')}</ol></nav>`;
}

/** Map a page slug to its output file. "/a/b/" -> dist/a/b/index.html */
const outFile = (slug) =>
  slug.endsWith('.html') ? join(DIST, slug) : join(DIST, slug, 'index.html');

async function buildCss() {
  const parts = [];
  for (const f of CSS_ORDER) {
    const p = join(SRC, 'css', f);
    if (existsSync(p)) parts.push(await readFile(p, 'utf8'));
  }
  const result = await esbuild.transform(parts.join('\n'), {
    loader: 'css',
    minify: true,
    target: ['chrome100', 'safari15', 'firefox100'],
  });
  const name = `app.${hash(result.code)}.css`;
  await writeFile(join(DIST, name), result.code);
  return name;
}

async function buildJs() {
  const result = await esbuild.build({
    entryPoints: [join(SRC, 'js', 'main.mjs')],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    write: false,
    legalComments: 'none',
  });
  const code = result.outputFiles[0].contents;
  const name = `app.${hash(code)}.js`;
  await writeFile(join(DIST, name), code);
  return name;
}

async function copyDir(from, to, filter = () => true) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (entry.isFile() && filter(entry.name)) await copyFile(join(from, entry.name), join(to, entry.name));
  }
}

async function main() {
  const started = performance.now();
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const [css, js] = await Promise.all([buildCss(), buildJs()]);
  await copyDir(join(SRC, 'fonts'), join(DIST, 'fonts'), (n) => n.endsWith('.woff2') || n.endsWith('.txt'));
  for (const f of ['favicon.svg', 'og.png', 'apple-touch-icon.png']) {
    const p = join(SRC, 'static', f);
    if (existsSync(p)) await copyFile(p, join(DIST, f));
  }

  const layout = await readFile(join(SRC, 'templates', 'layout.html'), 'utf8');
  const templates = new Map();
  const loadTemplate = async (name) => {
    if (!templates.has(name)) {
      const p = join(SRC, 'templates', `${name}.html`);
      // Templates not written yet fall back to the stub (Phase 0 scaffold).
      templates.set(name, await readFile(existsSync(p) ? p : join(SRC, 'templates', 'stub.html'), 'utf8'));
    }
    return templates.get(name);
  };

  const titles = new Set();
  for (const page of PAGES) {
    if (titles.has(page.title)) throw new Error(`Duplicate title: ${page.title}`);
    titles.add(page.title);
    const body = render(await loadTemplate(page.template), { ...page });
    const html = render(layout, {
      title: page.title,
      description: page.description,
      canonical: absolute(page.slug === '/404.html' ? '/' : page.slug),
      // 404 is noindex and has no canonical; every other page points at itself, never with a query.
      robots: page.noindex
        ? '<meta name="robots" content="noindex">\n'
        : `<link rel="canonical" href="${esc(absolute(page.slug))}">\n`,
      ogImage: absolute('/og.png'),
      css,
      js,
      jsonld: jsonLd(page),
      crumbs: crumbsHtml(page),
      body,
    });
    if (/\sstyle\s*=|<style[\s>]|<script(?![^>]*\b(type="module" src=|type="application\/ld\+json"))/i.test(html)) {
      throw new Error(`CSP-forbidden markup in ${page.slug}`);
    }
    const file = outFile(page.slug);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.filter((p) => !p.noindex)
    .map((p) => `  <url><loc>${esc(absolute(p.slug))}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n');
  await writeFile(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  const robots = await readFile(join(SRC, 'static', 'robots.txt'), 'utf8');
  await writeFile(join(DIST, 'robots.txt'), robots.replace('{{origin}}', SITE.origin));
  await copyFile(join(SRC, 'static', '_headers'), join(DIST, '_headers'));

  console.log(`Built ${PAGES.length} pages, ${css}, ${js} in ${Math.round(performance.now() - started)} ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
