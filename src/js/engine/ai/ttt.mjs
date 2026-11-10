// Tic-tac-toe: rules, the full game-tree count, and minimax and alpha-beta search with node
// counts and a step-by-step trace. Board: 9 cells (0 empty, 1 X, 2 O), X moves first.
// Values are from X's point of view: +1 X wins, 0 draw, -1 O wins. Pure, no DOM.

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export function winner(b) {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return 0;
}
export const full = (b) => b.every((x) => x !== 0);
export const toMove = (b) => (b.filter((x) => x === 1).length > b.filter((x) => x === 2).length ? 2 : 1);
export const moves = (b) => b.flatMap((x, i) => (x === 0 ? [i] : []));
export const isOver = (b) => winner(b) !== 0 || full(b);

/** Positions in the full game tree from b, b included; play stops at a win or a full board. */
export function countTree(b = Array(9).fill(0)) {
  const board = b.slice();
  let count = 0;
  (function walk(p) {
    count++;
    if (winner(board) || full(board)) return;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = p;
      walk(p === 1 ? 2 : 1);
      board[i] = 0;
    }
  })(toMove(board));
  return count;
}

const terminalValue = (b) => {
  const w = winner(b);
  return w === 1 ? 1 : w === 2 ? -1 : 0;
};

/**
 * Minimax or alpha-beta to the end of the game.
 * @returns {{ value, move, nodes, trace?: object[] }} trace events when options.trace:
 *   { kind: 'enter', path, depth } | { kind: 'leaf', path, value } |
 *   { kind: 'return', path, value, best } | { kind: 'prune', path, skipped: [moves], alpha, beta }
 */
export function search(board, { pruning = false, trace = false } = {}) {
  const b = board.slice();
  const events = trace ? [] : null;
  let nodes = 0;
  function rec(path, alpha, beta) {
    nodes++;
    if (events) events.push({ kind: 'enter', path: path.slice() });
    if (isOver(b)) {
      const v = terminalValue(b);
      if (events) events.push({ kind: 'leaf', path: path.slice(), value: v });
      return { value: v, move: null };
    }
    const p = toMove(b);
    const maximizing = p === 1;
    let best = maximizing ? -Infinity : Infinity;
    let bestMove = null;
    const ms = moves(b);
    for (let k = 0; k < ms.length; k++) {
      const m = ms[k];
      b[m] = p;
      path.push(m);
      const { value } = rec(path, alpha, beta);
      path.pop();
      b[m] = 0;
      if (maximizing ? value > best : value < best) {
        best = value;
        bestMove = m;
      }
      if (pruning) {
        if (maximizing) alpha = Math.max(alpha, best);
        else beta = Math.min(beta, best);
        if (alpha >= beta) {
          if (events && k < ms.length - 1) events.push({ kind: 'prune', path: path.slice(), skipped: ms.slice(k + 1), alpha, beta });
          break;
        }
      }
    }
    if (events) events.push({ kind: 'return', path: path.slice(), value: best, best: bestMove });
    return { value: best, move: bestMove };
  }
  const r = rec([], -Infinity, Infinity);
  return { value: r.value, move: r.move, nodes, trace: events };
}

/** Parse "X.O......" style (9 characters of X, O and . or _ ) into a board, or null. */
export function parseBoard(s) {
  if (typeof s !== 'string' || !/^[XO._-]{9}$/i.test(s)) return null;
  const b = [...s.toUpperCase()].map((c) => (c === 'X' ? 1 : c === 'O' ? 2 : 0));
  const x = b.filter((v) => v === 1).length;
  const o = b.filter((v) => v === 2).length;
  return x === o || x === o + 1 ? b : null;
}
export const boardText = (b) => b.map((v) => (v === 1 ? 'X' : v === 2 ? 'O' : '.')).join('');
