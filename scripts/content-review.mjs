// Writes content-review.md: the full text of every page, taken from the built HTML in
// dist/, plus the interface copy and the list of claims that need verification.
// Run after `node build.mjs`: node scripts/content-review.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../src/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = (slug) => join(ROOT, 'dist', slug.endsWith('.html') ? slug : join(slug, 'index.html'));

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;/g, '·');

/** A small HTML to Markdown converter for this site's own, well-formed markup. */
function toMarkdown(html) {
  let s = html
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<div class="mini[^"]*"[\s\S]*?<div class="mini-head"[^>]*><div class="mini-line"><\/div><\/div>\s*<\/div>/g, '\n[Timeline graphic]\n')
    .replace(/<caption[\s\S]*?<\/caption>/g, '')
    .replace(/<\/span><span class="tl-desc">/g, ': ')
    .replace(/<\/(a|button)><(a|button)\b/g, '</$1> / <$2');
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/g, (_, row) => {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    return `\n| ${cells.join(' | ')} |`;
  });
  s = s
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '\n- $1')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n$1\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<code>([\s\S]*?)<\/code>/g, '`$1`')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
    .replace(/<(br)\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '');
  return decode(s)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l, i, a) => l || (a[i - 1] && a[i - 1].trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const words = (md) => md.replace(/[#*`|[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;

const out = [
  '# Trace: content review',
  '',
  'The full text of every page, extracted from the built HTML. Interactive parts of the simulator pages are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content only (the article under the tool).',
  '',
];

for (const page of PAGES) {
  const html = readFileSync(file(page.slug), 'utf8');
  const main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html)[1];
  const withoutTool = main.replace(/<div class="tool"[\s\S]*?<div class="toast"[^>]*><\/div>\s*<\/div>/, '\n[Interactive simulator: see "Interface copy" at the end]\n')
    .replace(/<div class="tool" data-tool data-alg="compare"[\s\S]*?<\/section>\s*<\/div>\s*<\/div>/, '\n[Interactive comparison: see "Interface copy" at the end]\n');
  const article = /<article class="prose">([\s\S]*?)<\/article>/.exec(main);
  out.push('---', '', `## Page: ${page.slug}`, '');
  out.push(`- Title: ${page.title}`, `- Description (${page.description.length} characters): ${page.description}`);
  if (article) out.push(`- Written content: ${words(toMarkdown(article[1]))} words`);
  out.push('', toMarkdown(withoutTool).replace(/^# /gm, '### H1: ').replace(/^## /gm, '#### ').replace(/^### (?!H1)/gm, '##### '), '');
}

// Interface copy, once: the Round Robin tool (it shows every control) and the compare page.
const rr = readFileSync(file('/operating-systems/cpu-scheduling/round-robin/'), 'utf8');
const tool = /<div class="tool"[\s\S]*?<div class="toast"[^>]*><\/div>\s*<\/div>/.exec(rr)[0];
const prio = readFileSync(file('/operating-systems/cpu-scheduling/priority/'), 'utf8');
const prioOpts = /<div class="opts opt-priority">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/.exec(prio)[0];
out.push('---', '', '## Interface copy (simulator pages)', '', toMarkdown(tool + prioOpts), '');
out.push(
  '### Messages produced by scripts',
  '',
  '- Field errors: "Arrival for P2 must be a whole number from 0 to 99." / "Burst for P2 must be a whole number from 1 to 99." / "Priority for P2 must be a whole number from 1 to 99." / "Quantum must be a whole number from 1 to 99."',
  '- Add process limit: "Trace supports up to 8 processes, one color each."',
  '- Option hints: "A process that arrives just as a slice ends joins the queue before the preempted process." / "The preempted process rejoins the queue before a process that arrives at the same moment." / "A better priority arrival interrupts the running process." / "The running process always finishes first." / "1 is the highest priority." / "99 is the highest priority."',
  '- Toasts: "Link copied", "Speed 2x", and share-link notices such as "The quantum in this link was ignored. Quantum must be a whole number from 1 to 99." and "P2 and P3 in this link could not be read, so they were left out."',
  '- Narration: the full sentence list is in the Checkpoint B report; it is generated by src/js/engine/narrate.mjs.',
  '- Compare note: "Round Robin uses a quantum of 3. Priority is non-preemptive, and a lower number means a higher priority. Ties follow the rules on each algorithm\'s page."',
  '',
);
out.push(readFileSync(join(ROOT, 'src', 'content', 'needs-verification.md'), 'utf8'));
writeFileSync(join(ROOT, 'content-review.md'), out.join('\n'));
console.log('Wrote content-review.md');
