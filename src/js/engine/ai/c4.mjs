// Connect Four (7 columns, 6 rows) and five agents: random, greedy (one ply), minimax,
// alpha-beta and Monte Carlo tree search. Board: 42 cells, index col * 6 + row (row 0 at
// the bottom), 0 empty, 1 Red, 2 Yellow; Red moves first. Agents are generator functions
// that yield now and then, so a runner can slice their work; they never change the board
// they are given. Pure, no DOM. Rules in sections/ai/SPEC.md.
import { prng } from '../prng.mjs';

export const COLS = 7;
export const ROWS = 6;
export const ORDER = [3, 2, 4, 1, 5, 0, 6]; // centre first
export const LIMITS = { depth: [1, 6], iterations: [50, 20000] };
const WIN = 1000000;

export const emptyBoard = () => ({ cells: new Array(COLS * ROWS).fill(0), heights: new Array(COLS).fill(0), turn: 1, moves: [] });
export const cloneBoard = (b) => ({ cells: b.cells.slice(), heights: b.heights.slice(), turn: b.turn, moves: b.moves.slice() });
export const legalMoves = (b) => ORDER.filter((c) => b.heights[c] < ROWS);
export const at = (b, col, row) => (col < 0 || col >= COLS || row < 0 || row >= ROWS ? -1 : b.cells[col * ROWS + row]);

export function play(b, col) {
  const row = b.heights[col];
  b.cells[col * ROWS + row] = b.turn;
  b.heights[col]++;
  b.moves.push(col);
  b.turn = 3 - b.turn;
  return row;
}
export function undo(b) {
  const col = b.moves.pop();
  b.heights[col]--;
  b.cells[col * ROWS + b.heights[col]] = 0;
  b.turn = 3 - b.turn;
}

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
/** Did the piece just placed at (col, row) make four in a line? */
export function winsAt(b, col, row) {
  const p = at(b, col, row);
  for (const [dc, dr] of DIRS) {
    let n = 1;
    for (let s = 1; at(b, col + dc * s, row + dr * s) === p; s++) n++;
    for (let s = 1; at(b, col - dc * s, row - dr * s) === p; s++) n++;
    if (n >= 4) return true;
  }
  return false;
}
/** 1 or 2 when that side has four in a line, 0 otherwise. */
export function winnerOf(b) {
  for (let c = 0; c < COLS; c++) for (let r = 0; r < b.heights[c]; r++) if (winsAt(b, c, r)) return at(b, c, r);
  return 0;
}
export const isFull = (b) => b.moves.length === COLS * ROWS;

/** The simple heuristic, from `side`'s point of view (see SPEC.md). */
export function heuristic(b, side) {
  let score = 0;
  const other = 3 - side;
  for (let r = 0; r < ROWS; r++) if (at(b, 3, r) === side) score += 3;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      for (const [dc, dr] of DIRS) {
        const ec = c + dc * 3;
        const er = r + dr * 3;
        if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
        let mine = 0;
        let theirs = 0;
        for (let s = 0; s < 4; s++) {
          const v = at(b, c + dc * s, r + dr * s);
          if (v === side) mine++;
          else if (v === other) theirs++;
        }
        if (theirs === 0) score += mine === 3 ? 5 : mine === 2 ? 1 : 0;
        if (mine === 0) score -= theirs === 3 ? 5 : theirs === 2 ? 1 : 0;
      }
    }
  }
  return score;
}

// ---------- agents ----------

function* randomAgent(board, { seed }) {
  const rand = prng(seed);
  const ms = legalMoves(board).slice().sort((a, b) => a - b);
  const move = ms[Math.floor(rand() * ms.length)];
  return { move, nodes: 0, explain: { kind: 'random', options: ms } };
}

function* greedyAgent(board) {
  const b = cloneBoard(board);
  const side = b.turn;
  const scores = {};
  let best = null;
  for (const c of legalMoves(b)) {
    const row = play(b, c);
    const s = winsAt(b, c, row) ? WIN : heuristic(b, side);
    undo(b);
    scores[c] = s;
    if (best === null || s > scores[best]) best = c;
  }
  return { move: best, nodes: Object.keys(scores).length, explain: { kind: 'scores', scores, unit: 'heuristic after the move' } };
}

/** Shared depth-limited search; pruning on for alpha-beta. Yields every 50 nodes, so a slice
 * never runs long even on a slow phone. */
function* searchAgent(board, { depth = 4, pruning }) {
  const b = cloneBoard(board);
  const side = b.turn;
  let nodes = 0;
  function* rec(d, alpha, beta, maximizing) {
    nodes++;
    if (nodes % 50 === 0) yield nodes;
    const ms = legalMoves(b);
    if (d === 0 || ms.length === 0) return ms.length === 0 ? 0 : heuristic(b, side);
    let best = maximizing ? -Infinity : Infinity;
    for (const c of ms) {
      const row = play(b, c);
      let v;
      if (winsAt(b, c, row)) {
        nodes++;
        v = (maximizing ? 1 : -1) * (WIN + d); // sooner wins count more
      } else v = yield* rec(d - 1, alpha, beta, !maximizing);
      undo(b);
      if (maximizing ? v > best : v < best) best = v;
      if (pruning) {
        if (maximizing) alpha = Math.max(alpha, best);
        else beta = Math.min(beta, best);
        if (alpha >= beta) break;
      }
    }
    return best;
  }
  const scores = {};
  let move = null;
  let alpha = -Infinity;
  for (const c of legalMoves(b)) {
    const row = play(b, c);
    nodes++;
    const v = winsAt(b, c, row) ? WIN + depth : yield* rec(depth - 1, pruning ? alpha : -Infinity, Infinity, false);
    undo(b);
    scores[c] = v;
    if (move === null || v > scores[move]) move = c;
    if (pruning) alpha = Math.max(alpha, v);
  }
  return { move, nodes, explain: { kind: 'scores', scores, unit: pruning ? 'value found by alpha-beta (a bound where a branch was cut short)' : 'value found by minimax', depth } };
}

/** MCTS with UCT (c = sqrt 2) and random playouts. Yields every 5 iterations. */
function* mctsAgent(board, { iterations = 1000, seed }) {
  const rand = prng(seed);
  const root = { move: null, parent: null, kids: [], untried: legalMoves(board).slice(), visits: 0, wins: 0, player: 3 - board.turn };
  const b = cloneBoard(board);
  for (let it = 1; it <= iterations; it++) {
    let node = root;
    let depth = 0;
    // Selection
    while (node.untried.length === 0 && node.kids.length) {
      let best = null;
      let bestU = -Infinity;
      for (const k of node.kids) {
        const u = k.wins / k.visits + Math.SQRT2 * Math.sqrt(Math.log(node.visits) / k.visits);
        if (u > bestU) {
          bestU = u;
          best = k;
        }
      }
      node = best;
      play(b, node.move);
      depth++;
    }
    // Expansion (unless the game is already over here)
    let over = node.move !== null && winsAt(b, node.move, b.heights[node.move] - 1);
    if (!over && node.untried.length) {
      const i = Math.floor(rand() * node.untried.length);
      const c = node.untried.splice(i, 1)[0];
      const mover = b.turn;
      play(b, c);
      depth++;
      const child = { move: c, parent: node, kids: [], untried: legalMoves(b).slice(), visits: 0, wins: 0, player: mover };
      node.kids.push(child);
      node = child;
      over = winsAt(b, c, b.heights[c] - 1);
    }
    // Playout
    let result = over ? node.player : 0;
    let played = 0;
    while (!result && b.moves.length < COLS * ROWS) {
      const ms = legalMoves(b);
      const c = ms[Math.floor(rand() * ms.length)];
      play(b, c);
      played++;
      if (winsAt(b, c, b.heights[c] - 1)) result = 3 - b.turn;
    }
    for (let k = 0; k < played; k++) undo(b);
    // Backpropagation: a win for the node's mover counts 1, a draw 0.5.
    for (let n = node; n; n = n.parent) {
      n.visits++;
      n.wins += result === 0 ? 0.5 : result === n.player ? 1 : 0;
    }
    for (let k = 0; k < depth; k++) undo(b);
    if (it % 5 === 0) yield it;
  }
  const stats = {};
  for (const k of root.kids) stats[k.move] = { visits: k.visits, rate: k.wins / k.visits };
  let move = null;
  for (const c of ORDER) if (stats[c] && (move === null || stats[c].visits > stats[move].visits)) move = c;
  return { move, nodes: iterations, iterations, explain: { kind: 'mcts', stats, iterations } };
}

export const AGENTS = {
  random: { label: 'Random', make: randomAgent },
  greedy: { label: 'Greedy', make: greedyAgent },
  minimax: { label: 'Minimax', make: (b, o) => searchAgent(b, { ...o, pruning: false }) },
  alphabeta: { label: 'Alpha-beta', make: (b, o) => searchAgent(b, { ...o, pruning: true }) },
  mcts: { label: 'MCTS', make: mctsAgent },
};
export const AGENT_KEYS = Object.keys(AGENTS);

/** Run an agent to completion synchronously (tests and the build). */
export function think(key, board, options = {}) {
  const gen = AGENTS[key].make(board, { seed: 1, ...options });
  for (;;) {
    const r = gen.next();
    if (r.done) return r.value;
  }
}

/**
 * Play a whole game between two agents. The seed for each move is derived from the game
 * seed and the move number, so a game is reproducible from its seed alone.
 */
export function playGame(redKey, yellowKey, { seed = 1, options = {}, maxMoves = 42 } = {}) {
  const b = emptyBoard();
  const record = [];
  for (let n = 0; n < maxMoves; n++) {
    const key = b.turn === 1 ? redKey : yellowKey;
    const r = think(key, b, { ...options[key], seed: (seed * 1000003 + n * 7919) >>> 0 });
    const row = play(b, r.move);
    record.push({ player: 3 - b.turn, agent: key, col: r.move, row, nodes: r.nodes, explain: r.explain });
    if (winsAt(b, r.move, row)) return { winner: 3 - b.turn, record, board: b };
    if (isFull(b)) break;
  }
  return { winner: 0, record, board: b };
}

/** Moves as a string of column numbers 1 to 7, e.g. "4453". */
export const movesText = (b) => b.moves.map((c) => c + 1).join('');
/** Board from a moves string; null if any move is illegal or the game is already over before the end. */
export function boardFromMoves(s) {
  if (typeof s !== 'string' || !/^[1-7]{0,42}$/.test(s)) return null;
  const b = emptyBoard();
  for (const ch of s) {
    const c = Number(ch) - 1;
    if (b.heights[c] >= ROWS || winnerOf(b)) return null;
    play(b, c);
  }
  return b;
}
