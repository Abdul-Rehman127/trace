// Build-time values for the page replacement templates (paging.html, paging-compare.html)
// and the generated worked examples in src/content/memory/*.html.
import { readFileSync } from 'node:fs';
import { simulatePaging } from '../js/engine/memory/paging.mjs';
import { validatePaging } from '../js/engine/memory/validate.mjs';
import { defaultPaging, PAGING_PRESETS, ALG_NAMES } from '../js/engine/memory/presets.mjs';
import { narratePagingStep, pagingView } from '../js/engine/memory/narrate.mjs';
import { pagingTableTree, treeToHtml } from '../js/engine/memory/table.mjs';
import { totalsTree, moreTree, PAGING_LINKS, cmpRowsTree, cmpStripsTree, framesHeadTree, byFramesTree, cmpNote, compareResults } from '../js/engine/memory/views.mjs';
import { selector, transportHtml, fill } from './parts.mjs';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const INPUTS = readFileSync(new URL('./paging-inputs.html', import.meta.url), 'utf8');
const html = (nodes) => (Array.isArray(nodes) ? nodes : [nodes]).map(treeToHtml).join('');

/** A sentence list as trusted HTML, page numbers in <strong>. */
const sentencesHtml = (sentences) =>
  sentences.map((parts) => parts.map((p) => (typeof p === 'string' ? esc(p) : `<strong>${esc(p.pid)}</strong>`)).join('')).join(' ');

/**
 * The narration box is sized by its longest possible text, so it never moves the page.
 * Candidates: every step of the default run plus worst cases (8 frames, two-digit pages,
 * a full Clock sweep and an Optimal tie among many pages).
 */
function sizers(algorithm) {
  const worst = [
    { refs: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], frames: 8 },
    { refs: [10, 11, 12, 13, 14, 15, 16, 17, 18, 10, 11, 12, 13, 14, 15, 16, 17], frames: 8 },
    { refs: [21, 22, 23, 24, 25, 26, 27, 28, 29], frames: 8 },
  ];
  const algs = algorithm === 'fifo' || algorithm === 'lru' || algorithm === 'opt' || algorithm === 'clock' ? [algorithm] : ['fifo', 'lru', 'opt', 'clock'];
  const texts = [];
  for (const alg of algs) {
    for (const w of [defaultPaging(alg), ...worst.map((x) => ({ ...x, algorithm: alg, options: { newBit: 1 } }))]) {
      const r = simulatePaging(w);
      for (let k = 0; k <= r.references; k++) texts.push(sentencesHtml(narratePagingStep(r, k)));
    }
  }
  // The few longest by text length are enough for the box to take their height.
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  return [...new Set(texts)].sort((a, b) => plain(b).length - plain(a).length).slice(0, 3).map((t) => `<p>${t}</p>`).join('');
}

function presetsHtml() {
  return PAGING_PRESETS.map((p) => `<button type="button" class="chip" data-preset="${p.key}">${esc(p.label)}</button>`).join('\n            ');
}

function clockOption(page) {
  const show = page.selectable || page.algorithm === 'clock' || page.algorithm === 'compare';
  if (!show) return '';
  return `<div class="opts opt-clock">
            <div class="field field-stack">
              <div><span class="flabel" id="bit-label">New page reference bit</span><small data-bit-hint>A page gets bit 1 when it is loaded, so it starts with a second chance. Some courses start it at 0.</small></div>
              <div class="seg seg-sm" role="group" aria-labelledby="bit-label" data-bit><button type="button" data-value="1" aria-pressed="true">Starts at 1</button><button type="button" data-value="0" aria-pressed="false">Starts at 0</button></div>
            </div>
          </div>`;
}

function inputsHtml(page) {
  const d = defaultPaging('fifo');
  return fill(INPUTS, { refs: d.refs.join(', '), frames: String(d.frames), presets: presetsHtml(), clockOption: clockOption(page) });
}

/** Values for paging.html and paging-compare.html. */
export function pagingData(page) {
  if (page.template === 'paging-compare') {
    const input = validatePaging(defaultPaging('fifo')).value;
    const results = compareResults(input);
    return {
      inputs: inputsHtml(page),
      cmpRows: html(cmpRowsTree(input, results)),
      cmpStrips: html(cmpStripsTree(results)),
      framesHead: html(framesHeadTree()),
      byFrames: html(byFramesTree(input)),
      cmpNote: cmpNote(input, results),
    };
  }
  const input = validatePaging(defaultPaging(page.algorithm)).value;
  const r = simulatePaging(input);
  return {
    alg: page.algorithm,
    selectable: page.selectable ? '1' : '0',
    selector: selector(page, PAGING_LINKS),
    inputs: inputsHtml(page),
    transport: transportHtml('step'),
    table: treeToHtml(pagingTableTree(r, { k: 0, caption: 'Step table: frames after each page reference' })),
    steps: String(r.references),
    whyText: sentencesHtml(narratePagingStep(r, 0)),
    whySizers: sizers(page.selectable ? 'all' : page.algorithm),
    viewLabel: pagingView(r, 0).label,
    viewItems: '<li class="pg-chip slot" aria-hidden="true"></li>'.repeat(r.frames),
    totals: html(totalsTree(r)),
    more: html(moreTree(input)),
  };
}

/** A complete, static step table for a worked example on a content page. */
export function pagingExampleHtml(algorithm, refs, frames, newBit = 1) {
  const r = simulatePaging({ algorithm, refs, frames, options: { newBit } });
  const caption = `${ALG_NAMES[algorithm]} with ${frames} frames on ${refs.join(', ')}`;
  return {
    table: `<div class="table-scroll pg-example">${treeToHtml(pagingTableTree(r, { caption }))}</div>`,
    faults: r.faults,
    hits: r.hits,
    result: r,
  };
}
