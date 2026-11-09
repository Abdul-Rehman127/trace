// AI engine invariants from the brief (sections/ai/SPEC.md): the full Tic-tac-toe tree
// count, alpha-beta equal to minimax and never more nodes, perfect play draws, no lost wins,
// reproducible agents, legal random moves, and no agent changing the board it is given.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { countTree, search, winner, moves, toMove, isOver, parseBoard } from '../src/js/engine/ai/ttt.mjs';
import { emptyBoard, cloneBoard, play, think, playGame, legalMoves, AGENT_KEYS, boardFromMoves, winsAt, heuristic } from '../src/js/engine/ai/c4.mjs';
import { prng, int } from './random.mjs';

describe('Tic-tac-toe', () => {
  test('the full game tree from the empty board has 549,946 positions including the root (brief, computed)', () => {
    assert.equal(countTree(), 549946);
  });
  test('perfect play from the empty board is a draw', () => {
    assert.equal(search(Array(9).fill(0)).value, 0);
    assert.equal(search(Array(9).fill(0), { pruning: true }).value, 0);
  });
  // Positions start 2 to 6 moves in (the empty board is covered by the tests above), which keeps
  // each full search small enough for the deploy gate.
  test('alpha-beta: same value and move as minimax, never more nodes, on 800 random positions', () => {
    const rand = prng(71);
    for (let n = 0; n < 800; n++) {
      const b = Array(9).fill(0);
      const k = int(rand, 2, 6);
      for (let i = 0; i < k && !isOver(b); i++) {
        const ms = moves(b);
        b[ms[int(rand, 0, ms.length - 1)]] = toMove(b);
      }
      if (isOver(b)) continue;
      const mm = search(b);
      const ab = search(b, { pruning: true });
      assert.equal(ab.value, mm.value);
      assert.equal(ab.move, mm.move);
      assert.ok(ab.nodes <= mm.nodes);
    }
  });
  test('minimax never loses a won position: playing its move keeps the value', () => {
    const rand = prng(72);
    for (let n = 0; n < 300; n++) {
      const b = Array(9).fill(0);
      for (let i = 0; i < int(rand, 2, 5) && !isOver(b); i++) {
        const ms = moves(b);
        b[ms[int(rand, 0, ms.length - 1)]] = toMove(b);
      }
      if (isOver(b)) continue;
      const r = search(b);
      const p = toMove(b);
      const after = b.slice();
      after[r.move] = p;
      const v = isOver(after) ? (winner(after) === 1 ? 1 : winner(after) === 2 ? -1 : 0) : search(after).value;
      assert.equal(v, r.value);
    }
  });
  test('the trace marks pruned branches only with pruning on', () => {
    const b = parseBoard('X.O.X....');
    assert.ok(search(b, { pruning: true, trace: true }).trace.some((e) => e.kind === 'prune'));
    assert.ok(!search(b, { trace: true }).trace.some((e) => e.kind === 'prune'));
  });
});

describe('Connect Four', () => {
  const randomBoard = (rand, n) => {
    const b = emptyBoard();
    for (let i = 0; i < n; i++) {
      const ms = legalMoves(b);
      const c = ms[int(rand, 0, ms.length - 1)];
      const row = play(b, c);
      if (winsAt(b, c, row)) {
        b.cells[c * 6 + row] = 0;
        b.heights[c]--;
        b.moves.pop();
        b.turn = 3 - b.turn;
        break;
      }
    }
    return b;
  };
  test('alpha-beta equals minimax at the same depth: value and move, never more nodes', () => {
    const rand = prng(73);
    for (let n = 0; n < 40; n++) {
      const b = randomBoard(rand, int(rand, 0, 16));
      const depth = int(rand, 1, 3);
      const mm = think('minimax', b, { depth });
      const ab = think('alphabeta', b, { depth });
      assert.equal(ab.move, mm.move, `moves ${b.moves.join('')} depth ${depth}`);
      assert.equal(ab.explain.scores[ab.move], mm.explain.scores[mm.move]);
      assert.ok(ab.nodes <= mm.nodes);
    }
  });
  test('every agent is reproducible with a fixed seed, plays legal moves, and leaves the board alone', () => {
    const rand = prng(74);
    for (let n = 0; n < 12; n++) {
      const b = randomBoard(rand, int(rand, 0, 20));
      const snapshot = JSON.stringify(b);
      for (const key of AGENT_KEYS) {
        const opts = { seed: n + 1, depth: 3, iterations: 200 };
        const a = think(key, b, opts);
        const c = think(key, b, opts);
        assert.deepEqual(a, c, key);
        assert.ok(legalMoves(b).includes(a.move), `${key} move ${a.move}`);
        assert.equal(JSON.stringify(b), snapshot, `${key} changed the board`);
      }
    }
  });
  test('the random agent only plays legal moves, over many seeds', () => {
    const b = boardFromMoves('444444333');
    for (let s = 0; s < 500; s++) assert.ok(legalMoves(b).includes(think('random', b, { seed: s }).move));
  });
  test('MCTS with a fixed seed and iteration count is deterministic, and takes an immediate win', () => {
    const b = boardFromMoves('112233');
    const a = think('mcts', b, { seed: 9, iterations: 500 });
    assert.deepEqual(think('mcts', b, { seed: 9, iterations: 500 }), a);
    assert.equal(a.move, 3);
  });
  test('every searching agent takes a win in one and blocks a loss in one', () => {
    const win = boardFromMoves('112233'); // Red to move, column 4 wins
    const block = boardFromMoves('1122335'); // Yellow to move, must block column 4
    for (const key of ['greedy', 'minimax', 'alphabeta']) assert.equal(think(key, win, { depth: 2 }).move, 3, key);
    for (const key of ['minimax', 'alphabeta']) assert.equal(think(key, block, { depth: 2 }).move, 3, key);
  });
  test('games are reproducible from the seed and end legally', () => {
    const g = playGame('greedy', 'mcts', { seed: 5, options: { mcts: { iterations: 100 } } });
    const h = playGame('greedy', 'mcts', { seed: 5, options: { mcts: { iterations: 100 } } });
    assert.deepEqual(g.record.map((r) => r.col), h.record.map((r) => r.col));
    assert.ok([0, 1, 2].includes(g.winner));
  });
  test('moves strings round-trip and reject illegal sequences', () => {
    assert.equal(boardFromMoves('4444444'), null);
    assert.equal(boardFromMoves('8'), null);
    assert.deepEqual(boardFromMoves('').moves, []);
    assert.equal(typeof heuristic(cloneBoard(boardFromMoves('4')), 1), 'number');
  });
});
