// Node trees and narration for the AI pages, shared by the build and the browser. Pure.
import { fmtInt } from '../format.mjs';
import { toMove } from './ttt.mjs';
import { COLS, ROWS, AGENTS } from './c4.mjs';

const N = (t, a, ...c) => ({ t, a: a || {}, c: c.flat().filter((x) => x !== null && x !== undefined && x !== '') });
const MARK = ['', 'X', 'O'];
const sq = (i) => `square ${i + 1}`;
const valueWord = (v) => (v === 1 ? 'X wins (+1)' : v === -1 ? 'O wins (−1)' : 'a draw (0)');

/** The Tic-tac-toe board after a path of moves from `root`. */
export function boardAfter(root, path) {
  const b = root.slice();
  for (const m of path) b[m] = toMove(b);
  return b;
}

/** A 3 by 3 board; `marks` maps square index to a class (e.g. the squares on the current path). */
export function tttBoardTree(b, { label = 'Board', marks = {}, buttons = false } = {}) {
  return N(
    'div',
    { class: 'ttt', role: buttons ? 'group' : 'img', 'aria-label': `${label}: ${b.map((v, i) => `${sq(i)} ${v ? MARK[v] : 'empty'}`).join(', ')}` },
    b.map((v, i) =>
      buttons
        ? N('button', { type: 'button', class: `ttt-c ${marks[i] || ''}`, 'data-sq': String(i), 'aria-label': `${sq(i)}, ${v ? MARK[v] : 'empty'}`, ...(v ? { disabled: '' } : {}) }, MARK[v])
        : N('span', { class: `ttt-c ${marks[i] || ''}` }, MARK[v]),
    ),
  );
}

/** Narration for one trace event. */
export function narrateTtt(root, e) {
  const path = e.path;
  const describe = (p) => (p.length ? p.map((m, i) => `${MARK[toMove(boardAfter(root, p.slice(0, i)))]} ${m + 1}`).join(', ') : 'the starting position');
  const who = (p) => MARK[toMove(boardAfter(root, p))];
  switch (e.kind) {
    case 'enter':
      return path.length ? [['Looking at the position after ', { pid: describe(path) }, `. ${who(path)} is to move here.`]] : [['Start at the position on the board. ', { pid: who(path) }, ' is to move and wants the best value for itself.']];
    case 'leaf':
      return [['After ', { pid: describe(path) }, ` the game is over: ${valueWord(e.value)}.`]];
    case 'return': {
      const mover = who(path);
      const aim = mover === 'X' ? 'the highest' : 'the lowest';
      return [[path.length ? `All moves from here are checked. ${mover} picks ${aim} value, so this position is worth ` : `All moves are checked. ${mover} picks ${aim} value: `, { pid: String(e.value) }, e.best !== null ? ` (play ${sq(e.best)}).` : '.']];
    }
    case 'prune':
      return [[`Alpha-beta cuts this branch: the value found so far already makes this position no better for the player choosing above it than an option checked earlier (alpha ${e.alpha} ≥ beta ${e.beta}). Skipped: ${e.skipped.map((m) => sq(m)).join(', ')}.`]];
    default:
      return [['']];
  }
}

// ---------- Connect Four ----------

/** The board as a grid of cells, top row first; `last` marks the newest piece. */
export function c4BoardTree(board, { last = null, buttons = false, label = 'Connect Four board' } = {}) {
  const rows = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const v = board.cells[c * ROWS + r];
      const isLast = last && last.col === c && last.row === r;
      rows.push(N('span', { class: `c4-c p${v}${isLast ? ' last' : ''}`, 'data-col': String(c) }, v ? N('span', { class: 'sr-only' }, v === 1 ? 'Red' : 'Yellow') : null));
    }
  }
  const head = buttons
    ? N('div', { class: 'c4-drop', role: 'group', 'aria-label': 'Drop a piece' }, Array.from({ length: COLS }, (_, c) => N('button', { type: 'button', class: 'c4-btn', 'data-drop': String(c), 'aria-label': `Drop in column ${c + 1}`, ...(board.heights[c] >= ROWS ? { disabled: '' } : {}) }, String(c + 1))))
    : N('div', { class: 'c4-cols', 'aria-hidden': 'true' }, Array.from({ length: COLS }, (_, c) => N('span', null, String(c + 1))));
  return N('div', { class: 'c4-wrap' }, head, N('div', { class: 'c4', role: 'img', 'aria-label': `${label}: ${board.moves.length} pieces played` }, rows));
}

/** Why an agent chose its move, in plain language plus a small per-column table. */
export function c4ExplainTree(key, result, mover) {
  const name = AGENTS[key].label;
  const side = mover === 1 ? 'Red' : 'Yellow';
  const col = result.move + 1;
  const ex = result.explain;
  const kids = [];
  if (ex.kind === 'random') {
    kids.push(N('p', null, `${name} (${side}) picks a legal column at random: column ${col}. It looks at nothing else.`));
  } else if (ex.kind === 'scores') {
    const what = key === 'greedy' ? 'It looks one move ahead and scores each resulting position with the simple heuristic; a move that wins at once scores highest.' : `It searches ${ex.depth} moves ahead and backs values up the tree, assuming both sides play their best by the same heuristic${key === 'alphabeta' ? ', skipping branches that cannot change the choice' : ''}.`;
    kids.push(N('p', null, `${name} (${side}) plays column ${col}. ${what}`));
    kids.push(
      N('table', { class: 'data c4-scores' }, N('thead', null, N('tr', null, N('th', { scope: 'col' }, 'Column'), N('th', { scope: 'col' }, 'Value'))), N('tbody', null, Object.entries(ex.scores).sort((a, b) => a[0] - b[0]).map(([c, v]) => N('tr', { class: Number(c) === result.move ? 'chosen' : null }, N('td', null, String(Number(c) + 1)), N('td', { class: 'mono' }, Math.abs(v) >= 1000000 ? (v > 0 ? 'win' : 'loss') : String(v)))))),
    );
  } else if (ex.kind === 'mcts') {
    kids.push(N('p', null, `MCTS (${side}) ran ${fmtInt(ex.iterations)} random games from this position, steering toward moves that kept winning, and plays the column it tried most: column ${col}.`));
    kids.push(
      N('table', { class: 'data c4-scores' }, N('thead', null, N('tr', null, N('th', { scope: 'col' }, 'Column'), N('th', { scope: 'col' }, 'Tried'), N('th', { scope: 'col' }, 'Win rate'))), N('tbody', null, Object.entries(ex.stats).sort((a, b) => a[0] - b[0]).map(([c, s]) => N('tr', { class: Number(c) === result.move ? 'chosen' : null }, N('td', null, String(Number(c) + 1)), N('td', { class: 'mono' }, String(s.visits)), N('td', { class: 'mono' }, `${Math.round(s.rate * 100)}%`))))),
    );
  }
  return N('div', { class: 'c4-explain' }, kids);
}
