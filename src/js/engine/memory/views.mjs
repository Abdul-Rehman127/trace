// Node trees for the page replacement results, the "one more frame" panel and the
// compare page. Same tree format as table.mjs: the build serializes them, the browser
// builds DOM from them. Pure, no DOM.

import { simulatePaging, faultRate, faultsByFrames, PAGING_ALGORITHMS } from './paging.mjs';
import { encodePaging } from './share.mjs';
import { ALG_NAMES } from './presets.mjs';

const N = (t, a, ...c) => ({ t, a: a || {}, c: c.flat().filter((x) => x !== null && x !== undefined && x !== '') });
const SR = (text) => N('span', { class: 'sr-only' }, text);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const PR_PATH = '/memory/page-replacement/';
export const PAGING_LINKS = [
  { alg: 'fifo', label: 'FIFO', path: `${PR_PATH}fifo/` },
  { alg: 'lru', label: 'LRU', path: `${PR_PATH}lru/` },
  { alg: 'opt', label: 'Optimal', path: `${PR_PATH}optimal/` },
  { alg: 'clock', label: 'Clock', path: `${PR_PATH}clock/` },
];

/** "14 of 20 (70%)": the counts people compare with their own working, then the percent. */
const rateText = (faults, refs) => `${faults} of ${refs} (${faultRate(faults, refs).percent}%)`;
/** The reduced fraction, only when it differs from the counts (shown small, as a secondary note). */
const reducedNote = (faults, refs) => {
  const r = faultRate(faults, refs);
  return r.den !== refs ? N('span', { class: 'pg-frac' }, `= ${r.num}/${r.den}`) : null;
};

/** Children of <dl data-totals>. */
export function totalsTree(result) {
  const item = (label, value) => N('div', null, N('dt', null, label), N('dd', null, value));
  return [
    item('Page faults', String(result.faults)),
    item('Hits', String(result.hits)),
    N('div', null, N('dt', null, 'Fault rate'), N('dd', null, rateText(result.faults, result.references), reducedNote(result.faults, result.references))),
    item('References', String(result.references)),
  ];
}

/** A row of fault and hit marks. Screen readers get the counts, not 40 marks. */
export function stripTree(result) {
  return N(
    'div',
    { class: 'pg-strip', role: 'img', 'aria-label': `${plural(result.faults, 'fault')} and ${plural(result.hits, 'hit')} in ${plural(result.references, 'step')}` },
    result.steps.map((s) => N('span', { class: s.hit ? 'h' : 'f' }, s.hit ? 'H' : 'F')),
  );
}

/** The frame counts the "one more frame" panel compares: n and n+1, or 7 and 8 at the top. */
export const moreFrames = (frames) => (frames >= 8 ? [7, 8] : [frames, frames + 1]);

/** Children of <div data-more>: the same string with one more frame, side by side. */
export function moreTree(input) {
  const [a, b] = moreFrames(input.frames).map((frames) => simulatePaging({ ...input, frames }));
  const card = (r) =>
    N(
      'div',
      { class: 'pg-more-card' },
      N('p', { class: 'pg-more-head' }, N('span', null, plural(r.frames, 'frame')), N('b', null, plural(r.faults, 'fault'))),
      stripTree(r),
    );
  let message;
  if (b.faults > a.faults) {
    message = `Adding a frame caused more faults here, ${a.faults} with ${plural(a.frames, 'frame')} against ${b.faults} with ${plural(b.frames, 'frame')}. This is Belady's anomaly. FIFO and Clock can show it; LRU and Optimal cannot.`;
  } else if (b.faults === a.faults) {
    message = `One more frame gives the same number of faults on this string.`;
  } else {
    message = `One more frame saves ${plural(a.faults - b.faults, 'fault')} on this string.`;
  }
  return [
    N('h3', { class: 'label' }, 'With one more frame'),
    N('div', { class: 'pg-more-grid' }, card(a), card(b)),
    N('p', { class: `pg-more-note${b.faults > a.faults ? ' is-anomaly' : ''}` }, message),
  ];
}

const ARROW = N(
  'svg',
  { class: 'cmp-open-ic', width: '12', height: '12', viewBox: '0 0 12 12', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' },
  N('path', { d: 'M2 6h8M6.5 2.5 10 6 6.5 9.5' }),
);

/** Compare page: results of all four algorithms for one input. */
export function compareResults(input) {
  return PAGING_ALGORITHMS.map((alg) => simulatePaging({ ...input, algorithm: alg }));
}

/** Rows of the compare table. */
export function cmpRowsTree(input, results = compareResults(input)) {
  const best = Math.min(...results.map((r) => r.faults));
  return results.map((r) => {
    const link = PAGING_LINKS.find((l) => l.alg === r.algorithm);
    const name = ALG_NAMES[r.algorithm];
    return N(
      'tr',
      null,
      N('th', { scope: 'row' }, N('a', { class: 'cmp-open', href: `${link.path}?${encodePaging({ ...input, algorithm: r.algorithm })}`, 'aria-label': `${name}, open in the simulator` }, N('span', null, name), ARROW)),
      N('td', null, String(r.faults), r.faults === best ? N('span', { class: 'pg-fewest' }, ' fewest') : null),
      N('td', null, String(r.hits)),
      N('td', null, rateText(r.faults, r.references)),
    );
  });
}

/** One strip per algorithm. */
export function cmpStripsTree(results) {
  return results.map((r) => N('div', { class: 'pg-strip-row' }, N('span', { class: 'pg-strip-name' }, ALG_NAMES[r.algorithm]), stripTree(r)));
}

export const framesHeadTree = () => Array.from({ length: 8 }, (_, i) => N('th', { scope: 'col' }, String(i + 1)));

/** Faults for 1..8 frames per algorithm; a rise from the previous column is marked in text. */
export function byFramesTree(input) {
  return PAGING_ALGORITHMS.map((alg) => {
    const counts = faultsByFrames(alg, input.refs, input.options);
    return N(
      'tr',
      null,
      N('th', { scope: 'row' }, ALG_NAMES[alg]),
      counts.map((c, i) => {
        const up = i > 0 && c > counts[i - 1];
        return N('td', up ? { class: 'up' } : null, String(c), up ? N('span', { class: 'up-mark', 'aria-hidden': 'true' }, ' ▲') : null, up ? SR(`, more than with ${i} frames`) : null);
      }),
    );
  });
}

/** One sentence under the compare tables. */
export function cmpNote(input, results = compareResults(input)) {
  const opt = results.find((r) => r.algorithm === 'opt');
  const rises = PAGING_ALGORITHMS.filter((alg) => {
    const c = faultsByFrames(alg, input.refs, input.options);
    return c.some((v, i) => i > 0 && v > c[i - 1]);
  }).map((a) => ALG_NAMES[a]);
  const base = `Optimal needs to know the future, so its ${plural(opt.faults, 'fault')} are the lowest any algorithm can reach on this string with ${plural(input.frames, 'frame')}.`;
  if (!rises.length) return base;
  return `${base} A marked rise in the frame table means more frames caused more faults (Belady's anomaly), seen here for ${rises.join(' and ')}.`;
}
