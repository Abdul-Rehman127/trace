// Build-time values for the AI templates (ai-tree.html, ai-arena.html, ai-compare.html)
// and the numbers quoted in src/content/ai/*.html. Everything here is computed by running
// the engine; nothing is typed in by hand.
import { countTree, search, parseBoard, moves } from '../js/engine/ai/ttt.mjs';
import { AGENTS, AGENT_KEYS, boardFromMoves, think, emptyBoard } from '../js/engine/ai/c4.mjs';
import { tttBoardTree, c4BoardTree, narrateTtt } from '../js/engine/ai/views.mjs';
import { treeToHtml } from '../js/engine/memory/table.mjs';
import { selector, transportHtml } from './parts.mjs';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const fmt = (n) => n.toLocaleString('en-US');

const AI = '/ai/';
export const AI_LINKS = [
  { alg: 'tree', label: 'Game tree', path: `${AI}game-tree/` },
  { alg: 'arena', label: 'Connect Four', path: `${AI}connect-four/` },
  { alg: 'compare', label: 'Compare agents', path: `${AI}compare/` },
];

export const TTT_POSITIONS = [
  ['X to win', 'XO.XO....'],
  ['Block or lose', 'X...O.X..'],
  ['Opening reply', 'X........'],
  ['Late game', 'XOXOX....'],
];
export const DEFAULT_TTT = 'X...O.X..';
export const C4_POSITIONS = [
  ['Opening', '4'],
  ['Threat to block', '4455'],
  ['Midgame', '44433523'],
  ['Win available', '112233'],
];
export const DEFAULT_C4 = '44433523';

const COPY_CHIP = `<button type="button" class="chip chip-link" data-copy>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>
              <span>Copy link</span>
            </button>`;
const COPY_FALLBACK = `<div class="copy-fallback" data-copy-fallback hidden>
            <label for="share-url">Copy this link</label>
            <input id="share-url" type="text" readonly data-copy-field>
          </div>`;
const sentencesHtml = (sentences) => sentences.map((parts) => parts.map((p) => (typeof p === 'string' ? esc(p) : `<strong>${esc(p.pid)}</strong>`)).join('')).join(' ');

/** Summary rows for a Tic-tac-toe position: both searches, value, move, nodes. */
export function tttSummaryHtml(b) {
  const mm = search(b);
  const ab = search(b, { pruning: true });
  const row = (label, v) => `<div><dt>${esc(label)}</dt><dd><span class="mono">${esc(v)}</span></dd></div>`;
  return [
    row('Value with best play', mm.value === 1 ? '+1 (X wins)' : mm.value === -1 ? '−1 (O wins)' : '0 (draw)'),
    row('Best move', mm.move === null ? 'none' : `square ${mm.move + 1}`),
    row('Minimax examined', `${fmt(mm.nodes)} positions`),
    row('Alpha-beta examined', `${fmt(ab.nodes)} positions`),
  ].join('');
}

export function aiData(page) {
  const base = { selector: selector({ ...page, algorithm: page.tool }, AI_LINKS), copyChip: COPY_CHIP, copyFallback: COPY_FALLBACK };
  if (page.tool === 'tree') {
    const b = parseBoard(DEFAULT_TTT);
    const r = search(b, { trace: true });
    const sizers = [];
    for (const [, pos] of TTT_POSITIONS) {
      const pb = parseBoard(pos);
      for (const e of search(pb, { pruning: true, trace: true }).trace.slice(0, 400)) sizers.push(sentencesHtml(narrateTtt(pb, e)));
    }
    const plain = (s) => s.replace(/<[^>]+>/g, '');
    return {
      ...base,
      board: treeToHtml(tttBoardTree(b, { buttons: true, label: 'Starting position' })),
      nowBoard: treeToHtml(tttBoardTree(b, { label: 'Position being looked at' })),
      positions: TTT_POSITIONS.map(([label, pos]) => `<button type="button" class="chip" data-pos="${pos}">${esc(label)}</button>`).join('\n            '),
      transport: transportHtml('step', r.trace.length),
      steps: String(r.trace.length),
      // The same list the script draws at step 0, so loading moves nothing.
      children: moves(b).map((m) => `<li class="ai-kid open"><b>Square ${m + 1}</b><span>not settled yet</span></li>`).join(''),
      whyText: sentencesHtml(narrateTtt(b, r.trace[0])),
      whySizers: [...new Set(sizers)].sort((x, y) => plain(y).length - plain(x).length).slice(0, 3).map((t) => `<p>${t}</p>`).join(''),
      summary: tttSummaryHtml(b),
    };
  }
  if (page.tool === 'arena') {
    const chips = (side, active) => AGENT_KEYS.map((k) => `<button type="button" class="chip" data-agent="${k}" aria-pressed="${k === active}">${esc(AGENTS[k].label)}</button>`).join('');
    return {
      ...base,
      redChips: chips('red', 'greedy'),
      yellowChips: chips('yellow', 'alphabeta'),
      transport: transportHtml('move', 0),
      board: treeToHtml(c4BoardTree(emptyBoard())),
      explain: '<p>Choose two agents and press "Play the game". Then step through the moves; each one comes with the reason it was chosen.</p>',
      status: '',
    };
  }
  const b = boardFromMoves(DEFAULT_C4);
  return {
    ...base,
    moves: DEFAULT_C4,
    positions: C4_POSITIONS.map(([label, m]) => `<button type="button" class="chip" data-moves="${m}">${esc(label)}</button>`).join('\n            '),
    board: treeToHtml(c4BoardTree(b, { label: 'Position to compare on' })),
    rows: AGENT_KEYS.map((k) => `<tr><th scope="row">${esc(AGENTS[k].label)}</th><td></td><td></td><td></td></tr>`).join(''),
  };
}

/** Numbers quoted in the AI content pages, computed at build time. */
export function aiContentData(key) {
  const out = {};
  if (key === 'ai/tree') {
    out.treeSize = fmt(countTree());
    const empty = Array(9).fill(0);
    out.emptyMinimax = fmt(search(empty).nodes);
    out.emptyAlphabeta = fmt(search(empty, { pruning: true }).nodes);
    const b = parseBoard(DEFAULT_TTT);
    out.exMinimax = fmt(search(b).nodes);
    out.exAlphabeta = fmt(search(b, { pruning: true }).nodes);
  }
  if (key === 'ai/compare') {
    const b = boardFromMoves(DEFAULT_C4);
    const mm = think('minimax', b, { depth: 4 });
    const ab = think('alphabeta', b, { depth: 4 });
    out.cmpMinimax = fmt(mm.nodes);
    out.cmpAlphabeta = fmt(ab.nodes);
    out.cmpSame = mm.move === ab.move ? 'the same column' : 'different columns';
  }
  return out;
}
