// Build-time HTML fragments for tool pages. Trusted, generated from page metadata only.
import { readFileSync } from 'node:fs';
import { presetsFor, defaultScenario } from '../js/engine/presets.mjs';
import { simulate } from '../js/engine/scheduling.mjs';
import { validateScenario } from '../js/engine/validate.mjs';
import { narrationContext, narrateMoment, longestMoments } from '../js/engine/narrate.mjs';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

const CPU = '/operating-systems/cpu-scheduling/';
export const ALG_LINKS = [
  { alg: 'fcfs', label: 'FCFS', path: `${CPU}fcfs/` },
  { alg: 'sjf', label: 'SJF', path: `${CPU}sjf/` },
  { alg: 'srtf', label: 'SRTF', path: `${CPU}srtf/` },
  { alg: 'priority', label: 'Priority', path: `${CPU}priority/` },
  { alg: 'rr', label: 'Round Robin', path: `${CPU}round-robin/` },
];

export const TIE_HINT = {
  new: 'A process that arrives just as a slice ends joins the queue before the preempted process.',
  preempted: 'The preempted process rejoins the queue before a process that arrives at the same moment.',
};
export const PREEMPT_HINT = {
  true: 'A better priority arrival interrupts the running process.',
  false: 'The running process always finishes first.',
};
export const ORDER_HINT = {
  low: '1 is the highest priority.',
  high: '99 is the highest priority.',
};

// Check and play marks share one reserved slot; CSS shows the check when selected, the play mark on hover.
const ALG_HL = '<span class="alg-hl" aria-hidden="true"></span>';
const ALG_ICONS =
  '<span class="alg-ic" aria-hidden="true">' +
  '<svg class="alg-check" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M2 6.5 4.8 9 10 3"/></svg>' +
  '<svg class="alg-go" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" focusable="false"><path d="M3 1.8v8.4L10 6z"/></svg>' +
  '</span>';
// The icon hangs off the label's left edge, inside the button's reserved padding.
const algInner = (label) => `${ALG_HL}<span class="alg-t">${ALG_ICONS}${label}</span>`;

function selector(page) {
  if (page.selectable) {
    const items = ALG_LINKS.map(
      (a) =>
        `<button type="button" class="alg" data-alg-choice="${a.alg}" aria-pressed="${a.alg === page.algorithm}">${algInner(a.label)}</button>`,
    ).join('');
    return `<div class="algs-wrap"><div class="algs" role="group" aria-label="Algorithm">${items}</div></div>`;
  }
  const items = ALG_LINKS.map((a) =>
    a.alg === page.algorithm
      ? `<a class="alg" href="${a.path}" data-alg-link="${a.alg}" aria-current="page">${algInner(a.label)}</a>`
      : `<a class="alg" href="${a.path}" data-alg-link="${a.alg}">${algInner(a.label)}</a>`,
  ).join('');
  return `<div class="algs-wrap"><nav class="algs" aria-label="Algorithm">${items}</nav></div>`;
}

function segmented(name, labelId, choices, current) {
  const buttons = choices
    .map(([value, label]) => `<button type="button" data-value="${value}" aria-pressed="${value === current}">${label}</button>`)
    .join('');
  return `<div class="seg seg-sm" role="group" aria-labelledby="${labelId}" data-${name}>${buttons}</div>`;
}

function options(page) {
  const s = defaultScenario(page.algorithm === 'compare' ? 'fcfs' : page.algorithm);
  const o = s.options;
  const show = (alg) => page.selectable || page.algorithm === 'compare' || page.algorithm === alg;
  const out = [];
  if (show('rr')) {
    out.push(`<div class="opts opt-rr">
            <div class="field">
              <div><label for="opt-quantum">Time quantum</label><small id="opt-quantum-hint">Length of each slice</small></div>
              <input class="num" id="opt-quantum" data-opt="quantum" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${o.quantum}" aria-describedby="opt-quantum-hint">
            </div>
            <p class="err" id="opt-quantum-err" data-err-for="opt-quantum" hidden></p>
            <div class="field field-stack">
              <div><span class="flabel" id="tie-label">Ties at the same moment</span><small data-tie-hint>${esc(TIE_HINT[o.rrTie])}</small></div>
              ${segmented('tie', 'tie-label', [['new', 'New arrival first'], ['preempted', 'Preempted first']], o.rrTie)}
            </div>
          </div>`);
  }
  if (show('priority')) {
    out.push(`<div class="opts opt-priority">
            <div class="field">
              <div><label for="opt-preemptive">Preemptive</label><small data-preempt-hint>${esc(PREEMPT_HINT[o.preemptive])}</small></div>
              <input class="switch" id="opt-preemptive" data-opt="preemptive" type="checkbox"${o.preemptive ? ' checked' : ''}>
            </div>
            <div class="field field-stack">
              <div><span class="flabel" id="order-label">Highest priority</span><small data-order-hint>${esc(ORDER_HINT[o.lowerNumberIsHigherPriority ? 'low' : 'high'])}</small></div>
              ${segmented('order', 'order-label', [['low', 'Lowest number'], ['high', 'Highest number']], o.lowerNumberIsHigherPriority ? 'low' : 'high')}
            </div>
          </div>`);
  }
  return out.join('\n          ');
}

function presets(page) {
  const algs = page.selectable ? ['fcfs', 'rr'] : [page.algorithm];
  const seen = new Set();
  const chips = [];
  for (const alg of algs) {
    for (const p of presetsFor(alg)) {
      if (seen.has(p.key)) continue;
      seen.add(p.key);
      const cls = p.key === 'tie' ? 'chip opt-rr' : 'chip';
      chips.push(`<button type="button" class="${cls}" data-preset="${p.key}">${esc(p.label)}</button>`);
    }
  }
  return chips.join('\n            ');
}

/** A narration sentence list as trusted HTML (process names in <strong>). */
function sentencesHtml(sentences) {
  return sentences
    .map((parts) => parts.map((p) => (typeof p === 'string' ? esc(p) : `<strong>${esc(p.pid)}</strong>`)).join(''))
    .join(' ');
}

/** The narration at t = 0 and the invisible sizers, rendered at build time so loading never shifts the panel. */
function narrationParts(algorithm) {
  const v = validateScenario(defaultScenario(algorithm)).value;
  const ctx = narrationContext(v, simulate(v));
  return {
    whyText: sentencesHtml(narrateMoment(ctx, 0)),
    whySizers: longestMoments(ctx).map((s) => `<p>${sentencesHtml(s)}</p>`).join(''),
  };
}

const INPUTS = readFileSync(new URL('./inputs.html', import.meta.url), 'utf8');
const fill = (tpl, data) => tpl.replace(/\{\{\{\s*(\w+)\s*\}\}\}|\{\{\s*(\w+)\s*\}\}/g, (_, raw, safe) => (raw ? String(data[raw]) : esc(data[safe])));

/** Values for src/templates/tool.html and compare.html. */
export function toolData(page) {
  const s = defaultScenario(page.algorithm);
  const base = {
    options: options(page),
    presets: presets(page),
    rows: String(s.processes.length),
  };
  if (page.algorithm === 'compare') {
    return { ...base, alg: 'compare', inputs: fill(INPUTS, base) };
  }
  return {
    inputs: fill(INPUTS, base),
    h1: page.h1,
    lede: page.lede,
    alg: page.algorithm,
    selectable: page.selectable ? '1' : '0',
    selector: selector(page),
    options: options(page),
    presets: presets(page),
    rows: String(s.processes.length),
    ...narrationParts(page.algorithm),
  };
}
