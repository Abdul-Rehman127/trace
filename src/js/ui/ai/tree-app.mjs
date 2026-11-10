// Tic-tac-toe game tree explorer: steps through the trace of minimax or alpha-beta with the
// shared player. Each step shows the position being looked at, the running node count, the
// branches cut so far and the first moves' values as they are settled.
import { fmtInt } from '../../engine/format.mjs';
import { search, parseBoard, boardText, toMove, isOver, moves } from '../../engine/ai/ttt.mjs';
import { tttBoardTree, narrateTtt, boardAfter } from '../../engine/ai/views.mjs';
import { readParams, getParam } from '../../engine/logic/share.mjs';
import { createPlayer, bindTransport, SPEEDS } from '../controls.mjs';
import { bindKeys } from '../keys.mjs';
import { toggleTheme } from '../theme.mjs';
import { h, fromTree, sentenceNodes, createToast, bindCopy, replaceQuery } from '../dom.mjs';

const DEFAULT = 'X...O.X..';
const MAX_EMPTY = 7;
const HINT = { minimax: 'Minimax looks at every move to the end of the game.', alphabeta: 'Alpha-beta finds the same value but skips branches that cannot change the choice.' };

export function mountTree(root) {
  const stage = root.querySelector('[data-stage]');
  const boardEl = root.querySelector('[data-ai-board]');
  const nowEl = stage.querySelector('[data-ai-now]');
  const nodesEl = stage.querySelector('[data-ai-nodes]');
  const prunedEl = stage.querySelector('[data-ai-pruned]');
  const kidsEl = stage.querySelector('[data-ai-children]');
  const whyText = stage.querySelector('[data-why-text]');
  const whyTime = stage.querySelector('[data-why-time]');
  const clock = stage.querySelector('[data-clock]');
  const clockTotal = stage.querySelector('[data-clock-total]');
  const ruler = stage.querySelector('[data-ruler]');
  const fill = stage.querySelector('[data-pg-fill]');
  const summary = root.querySelector('[data-ai-summary]');
  const hint = root.querySelector('[data-ai-alg-hint]');
  const algButtons = [...root.querySelectorAll('[data-ai-alg] button')];
  const live = root.querySelector('[data-live]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const params = readParams(window.location.search);

  let board = parseBoard(getParam(params, 'b') || '') || parseBoard(DEFAULT);
  let alg = getParam(params, 'alg') === 'alphabeta' ? 'alphabeta' : 'minimax';
  let trace = [];
  // Per step k (events 0..k-1 applied): node count, prune count, first-move values.
  let cum = [];
  let shownK = -1;

  function prepare() {
    const r = search(board, { pruning: alg === 'alphabeta', trace: true });
    trace = r.trace;
    cum = [{ nodes: 0, pruned: 0, kids: {} }];
    let nodes = 0;
    let pruned = 0;
    const kids = {};
    for (const e of trace) {
      if (e.kind === 'enter') nodes++;
      if (e.kind === 'prune') {
        pruned += e.skipped.length;
        if (e.path.length === 0) for (const m of e.skipped) kids[m] = 'cut';
      }
      if (e.kind === 'return' && e.path.length === 1) kids[e.path[0]] = e.value;
      if (e.kind === 'leaf' && e.path.length === 1) kids[e.path[0]] = e.value;
      cum.push({ nodes, pruned, kids: { ...kids } });
    }
  }

  function show(k) {
    if (k === shownK) return;
    shownK = k;
    const state = cum[Math.min(k, cum.length - 1)];
    const e = trace[Math.max(0, Math.min(k, trace.length) - 1)] || trace[0];
    const at = k === 0 ? [] : e.path;
    const marks = {};
    for (const m of at) marks[m] = 'path';
    nowEl.replaceChildren(fromTree(tttBoardTree(boardAfter(board, at), { label: 'Position being looked at', marks })));
    nodesEl.textContent = fmtInt(state.nodes);
    prunedEl.textContent = fmtInt(state.pruned);
    kidsEl.replaceChildren(
      ...moves(board).map((m) => {
        const v = state.kids[m];
        const text = v === undefined ? 'not settled yet' : v === 'cut' ? 'cut: not needed' : v === 1 ? '+1, X wins' : v === -1 ? '−1, O wins' : '0, draw';
        return h('li', { class: `ai-kid${v === 'cut' ? ' cut' : v === undefined ? ' open' : ''}` }, h('b', { text: `Square ${m + 1}` }), h('span', { text: text }));
      }),
    );
    const nodes = [];
    const sentences = k === 0 ? [['Press play or step forward to start the search from this position.']] : narrateTtt(board, e);
    sentences.forEach((s, j) => {
      if (j) nodes.push(' ');
      nodes.push(...sentenceNodes(s));
    });
    whyText.replaceChildren(...nodes);
    whyTime.textContent = k ? `step ${k}` : '';
    clock.textContent = String(k);
    ruler.setAttribute('aria-valuenow', String(k));
    ruler.setAttribute('aria-valuetext', `Step ${k} of ${trace.length}, ${state.nodes} positions examined`);
  }

  const player = createPlayer({
    onFrame: (t) => (fill.style.transform = `scaleX(${trace.length ? Math.min(1, t / trace.length) : 0})`),
    onUnit: (k) => show(k),
    onState: (s) => showState(s),
  });
  const showState = bindTransport(stage, player, { onUserStep: () => {} });

  function load({ fromUser }) {
    const empty = board.filter((v) => v === 0).length;
    for (const b of algButtons) b.setAttribute('aria-pressed', String(b.dataset.value === alg));
    hint.textContent = HINT[alg];
    boardEl.replaceChildren(fromTree(tttBoardTree(board, { buttons: !isOver(board), label: 'Starting position' })));
    for (const btn of boardEl.querySelectorAll('[data-sq]')) btn.addEventListener('click', () => playSquare(Number(btn.dataset.sq)));
    summary.replaceChildren(...summaryNodes());
    if (empty > MAX_EMPTY) {
      trace = [];
      cum = [{ nodes: 0, pruned: 0, kids: {} }];
      toast(`This position has ${empty} empty squares; the step-through needs ${MAX_EMPTY} or fewer. The totals below still apply.`, 5000);
    } else prepare();
    clockTotal.textContent = String(trace.length);
    ruler.setAttribute('aria-valuemax', String(trace.length));
    shownK = -1;
    player.load(trace.length);
    if (fromUser) replaceQuery(`b=${boardText(board)}&alg=${alg}`);
  }

  function summaryNodes() {
    const mm = search(board);
    const ab = search(board, { pruning: true });
    const row = (label, v) => h('div', {}, h('dt', { text: label }), h('dd', {}, h('span', { class: 'mono', text: v })));
    return [
      row('Value with best play', isOver(board) ? 'game over' : mm.value === 1 ? '+1 (X wins)' : mm.value === -1 ? '−1 (O wins)' : '0 (draw)'),
      row('Best move', mm.move === null ? 'none' : `square ${mm.move + 1}`),
      row('Minimax examined', `${fmtInt(mm.nodes)} positions`),
      row('Alpha-beta examined', `${fmtInt(ab.nodes)} positions`),
    ];
  }

  function playSquare(i) {
    if (board[i] || isOver(board)) return;
    board = board.slice();
    board[i] = toMove(board);
    live.textContent = `Square ${i + 1} played.`;
    load({ fromUser: true });
  }

  for (const b of algButtons) {
    b.addEventListener('click', () => {
      alg = b.dataset.value;
      load({ fromUser: true });
    });
  }
  for (const chip of root.querySelectorAll('[data-pos]')) {
    chip.addEventListener('click', () => {
      board = parseBoard(chip.dataset.pos);
      load({ fromUser: true });
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?b=${boardText(board)}&alg=${alg}`, toast);

  const changeSpeed = (dir) => {
    const i = SPEEDS.indexOf(player.speed);
    player.setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + dir))]);
  };
  bindKeys(
    {
      toggle: () => player.toggle(),
      back: () => player.stepBack(),
      forward: () => player.stepForward(),
      home: () => player.seek(0),
      end: () => player.seek(player.length),
      reset: () => player.seek(0),
      slower: () => changeSpeed(-1),
      faster: () => changeSpeed(1),
      theme: toggleTheme,
    },
    ruler,
  );

  load({ fromUser: false });
  showState({ playing: false, speed: player.speed, time: 0 });
  return { player, get board() {
    return board;
  }, get trace() {
    return trace;
  } };
}
