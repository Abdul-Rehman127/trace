// Writes sections/<name>/content-review.md for one section: the full text of every page in
// it, taken from the built HTML, the interface copy of one simulator page, and the section's
// "Needs verification" list (src/content/<name>/needs-verification.md).
// Run after `node build.mjs`: node scripts/section-review.mjs memory
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../src/pages.mjs';
import { toMarkdown } from './markdown.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];
const pages = PAGES.filter((p) => p.section === name);
if (!pages.length) {
  console.error(`No pages with section "${name}".`);
  process.exit(1);
}
const file = (slug) => join(ROOT, 'dist', join(slug, 'index.html'));
const words = (md) => md.replace(/[#*`|[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
const TOOL = /<div class="tool"[\s\S]*?<div class="toast"[^>]*><\/div>\s*(?:<\/section>\s*<\/div>\s*)?<\/div>/;

const out = [`# Trace: content review, ${name} section`, '', 'Generated from the built pages by scripts/section-review.mjs. Interactive parts are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content under the tool.', ''];
for (const page of pages) {
  const html = readFileSync(file(page.slug), 'utf8');
  const main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html)[1];
  const article = /<article class="prose">([\s\S]*?)<\/article>/.exec(main);
  out.push('---', '', `## Page: ${page.slug}`, '', `- Title: ${page.title}`, `- Description (${page.description.length} characters): ${page.description}`);
  if (article) out.push(`- Written content: ${words(toMarkdown(article[1]))} words`);
  out.push('', toMarkdown(main.replace(TOOL, '\n[Interactive tool: see "Interface copy" at the end]\n')).replace(/^# /gm, '### H1: ').replace(/^## /gm, '#### ').replace(/^### (?!H1)/gm, '##### '), '');
}
const first = readFileSync(file(pages[0].slug), 'utf8');
const tool = TOOL.exec(first);
if (tool) out.push('---', '', `## Interface copy (${pages[0].slug})`, '', toMarkdown(tool[0]), '');
const nv = join(ROOT, 'src', 'content', name, 'needs-verification.md');
if (existsSync(nv)) out.push('---', '', readFileSync(nv, 'utf8'));
const target = join(ROOT, 'sections', name, 'content-review.md');
writeFileSync(target, out.join('\n'));
console.log(`Wrote ${target}`);
