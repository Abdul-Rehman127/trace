// Connect Four arena: two agents play a seeded game, computed move by move without blocking
// the page (runner.mjs), then replayed on the shared player with each move explained. Also a
// game against an agent, and a round robin with the seeds shown.
import { fmtInt } from '../../engine/format.mjs';
import { AGENTS, AGENT_KEYS, emptyBoard, cloneBoard, play, winsAt, isFull, LIMITS } from '../../engine/ai/c4.mjs';
import { c4BoardTree, c4ExplainTree } from '../../engine/ai/views.mjs';
import { readParams, getParam } from '../../engine/logic/share.mjs';
import { parseBounded } from '../../engine/networking/tcp.mjs';
import { runAgent, warmUp, runnerMode } from './runner.mjs';
import { createPlayer, bindTransport, SPEEDS } from '../controls.mjs';
import { bindKeys } from '../keys.mjs';
import { toggleTheme } from '../theme.mjs';
import { h, fromTree, createToast, bindCopy, fieldError, replaceQuery } from '../dom.mjs';

const moveSeed = (seed, n) => (seed * 1000003 + n * 7919) >>> 0;

export function mountArena(root) {
  const stage = root.querySelector('[data-stage]');
  const boardEl = stage.querySelector('[data-c4]');
  const explainEl = stage.querySelector('[data-why-explain]');
  const whyTime = stage.querySelector('[data-why-time]');
  const clock = stage.querySelector('[data-clock]');
  const clockTotal = stage.querySelector('[data-clock-total]');
  const ruler = stage.querySelector('[data-ruler]');
  const fill = stage.querySelector('[data-pg-fill]');
  const status = root.querySelector('[data-ai-status]');
  const runBtn = root.querySelector('[data-ai-run]');
  const cancelBtn = root.querySelector('[data-ai-cancel]');
  const live = root.querySelector('[data-live]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const params = readParams(window.location.search);
  const pick = { red: getParam(params, 'red'), yellow: getParam(params, 'yellow') };
  const opts = { seed: 1, depth: 4, iterations: 1000 };
  if (!AGENT_KEYS.includes(pick.red)) pick.red = 'greedy';
  if (!AGENT_KEYS.includes(pick.yellow)) pick.yellow = 'alphabeta';
  for (const k of ['seed', 'depth', 'iterations']) {
    const v = getParam(params, k === 'iterations' ? 'it' : k);
    if (v !== null && /^\d{1,9}$/.test(v)) opts[k] = Number(v);
  }
  opts.depth = Math.max(LIMITS.depth[0], Math.min(LIMITS.depth[1], opts.depth));
  opts.iterations = Math.max(LIMITS.iterations[0], Math.min(LIMITS.iterations[1], opts.iterations));

  let record = []; // { board after, col, row, key, result, mover }
  let job = null;
  let human = false;

  const query = () => `red=${pick.red}&yellow=${pick.yellow}&seed=${opts.seed}&depth=${opts.depth}&it=${opts.iterations}`;

  function show(k) {
    const entry = record[k - 1];
    const board = entry ? entry.board : emptyBoard();
    boardEl.replaceChildren(fromTree(c4BoardTree(board, { last: entry ? { col: entry.col, row: entry.row } : null, buttons: human && !job })));
    if (human && !job) for (const b of boardEl.querySelectorAll('[data-drop]')) b.addEventListener('click', () => humanMove(Number(b.dataset.drop)));
    explainEl.replaceChildren(entry ? (entry.result ? fromTree(c4ExplainTree(entry.key, entry.result, entry.mover)) : h('p', { text: `You played column ${entry.col + 1}.` })) : h('p', { text: record.length ? 'The start of the game.' : 'Choose two agents and press "Play the game".' }));
    whyTime.textContent = entry ? `move ${k}` : '';
    clock.textContent = String(k);
    ruler.setAttribute('aria-valuenow', String(k));
    ruler.setAttribute('aria-valuetext', entry ? `Move ${k}: column ${entry.col + 1}` : 'Before the first move');
  }

  const player = createPlayer({
    onFrame: (t) => (fill.style.transform = `scaleX(${record.length ? Math.min(1, t / record.length) : 0})`),
    onUnit: (k) => show(k),
    onState: (s) => showState(s),
  });
  const showState = bindTransport(stage, player, { onUserStep: () => {} });

  function loadRecord() {
    clockTotal.textContent = String(record.length);
    ruler.setAttribute('aria-valuemax', String(record.length));
    player.load(record.length);
    player.seek(record.length, { animate: false });
  }

  const busy = (on) => {
    runBtn.disabled = on;
    cancelBtn.hidden = !on;
  };

  async function agentMove(board, key, n) {
    const mover = board.turn;
    job = runAgent(key, board, { ...opts, seed: moveSeed(opts.seed, n) }, (p) => (status.textContent = `${AGENTS[key].label} is thinking (${fmtInt(p)})...`));
    const result = await job.promise;
    job = null;
    return result && { result, mover };
  }

  async function playGameAsync() {
    human = false;
    record = [];
    busy(true);
    status.textContent = 'Playing...';
    const b = emptyBoard();
    let outcome = 'draw';
    for (let n = 0; n < 42; n++) {
      const key = b.turn === 1 ? pick.red : pick.yellow;
      const r = await agentMove(b, key, n);
      if (!r) {
        status.textContent = 'Stopped.';
        busy(false);
        loadRecord();
        return;
      }
      const row = play(b, r.result.move);
      record.push({ board: cloneBoard(b), col: r.result.move, row, key, result: r.result, mover: r.mover });
      if (winsAt(b, r.result.move, row)) {
        outcome = r.mover === 1 ? 'Red' : 'Yellow';
        break;
      }
      if (isFull(b)) break;
    }
    status.textContent = outcome === 'draw' ? `Draw after ${record.length} moves.` : `${outcome} (${AGENTS[outcome === 'Red' ? pick.red : pick.yellow].label}) wins in ${record.length} moves.`;
    live.textContent = status.textContent;
    busy(false);
    loadRecord();
    replaceQuery(query());
  }

  async function humanMove(col) {
    const last = record.at(-1);
    const b = last ? cloneBoard(last.board) : emptyBoard();
    if (b.turn !== 1 || b.heights[col] >= 6) return;
    let row = play(b, col);
    record.push({ board: cloneBoard(b), col, row, key: null, result: null, mover: 1 });
    if (winsAt(b, col, row)) return finishHuman('You win.');
    if (isFull(b)) return finishHuman('Draw.');
    loadRecord();
    busy(true);
    status.textContent = `${AGENTS[pick.yellow].label} is thinking...`;
    const r = await agentMove(b, pick.yellow, record.length);
    busy(false);
    if (!r) return finishHuman('Stopped.');
    row = play(b, r.result.move);
    record.push({ board: cloneBoard(b), col: r.result.move, row, key: pick.yellow, result: r.result, mover: 2 });
    if (winsAt(b, r.result.move, row)) return finishHuman(`${AGENTS[pick.yellow].label} wins.`);
    if (isFull(b)) return finishHuman('Draw.');
    status.textContent = 'Your move: drop a Red piece.';
    loadRecord();
  }
  function finishHuman(text) {
    human = false;
    status.textContent = text;
    live.textContent = text;
    loadRecord();
  }

  // ----- controls -----
  for (const group of root.querySelectorAll('[data-pick]')) {
    const side = group.dataset.pick;
    for (const chip of group.querySelectorAll('[data-agent]')) {
      chip.setAttribute('aria-pressed', String(chip.dataset.agent === pick[side]));
      chip.addEventListener('click', () => {
        pick[side] = chip.dataset.agent;
        for (const c of group.querySelectorAll('[data-agent]')) c.setAttribute('aria-pressed', String(c === chip));
        replaceQuery(query());
      });
    }
  }
  for (const el of root.querySelectorAll('[data-ai-opt]')) {
    const key = el.dataset.aiOpt;
    el.value = String(opts[key]);
    el.addEventListener('input', () => {
      const [lo, hi, label] = key === 'seed' ? [0, 999999999, 'The seed'] : key === 'depth' ? [...LIMITS.depth, 'The depth'] : [...LIMITS.iterations, 'Iterations'];
      const r = parseBounded(el.value, lo, hi, label);
      fieldError(el, root.querySelector(`#${el.id}-err`), r.error);
      if (!r.error) {
        opts[key] = r.value;
        replaceQuery(query());
      }
    });
  }
  runBtn.addEventListener('click', () => playGameAsync());
  cancelBtn.addEventListener('click', () => job && job.cancel());
  root.querySelector('[data-ai-human-start]').addEventListener('click', () => {
    human = true;
    record = [];
    status.textContent = 'Your move: drop a Red piece.';
    loadRecord();
  });
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${query()}`, toast);

  // ----- round robin -----
  const rrOut = root.querySelector('[data-rr-out]');
  const rrStatus = root.querySelector('[data-rr-status]');
  const rrRun = root.querySelector('[data-rr-run]');
  const rrCancel = root.querySelector('[data-rr-cancel]');
  let rrStop = false;
  rrCancel.addEventListener('click', () => {
    rrStop = true;
    if (job) job.cancel();
  });
  rrRun.addEventListener('click', async () => {
    rrStop = false;
    rrRun.disabled = true;
    rrCancel.hidden = false;
    const games = [];
    let g = 0;
    const total = AGENT_KEYS.length * (AGENT_KEYS.length - 1);
    for (const red of AGENT_KEYS) {
      for (const yellow of AGENT_KEYS) {
        if (red === yellow || rrStop) continue;
        g++;
        const seed = opts.seed + g;
        rrStatus.textContent = `Game ${g} of ${total}: ${AGENTS[red].label} against ${AGENTS[yellow].label}, seed ${seed}...`;
        const b = emptyBoard();
        let winner = 0;
        for (let n = 0; n < 42 && !rrStop; n++) {
          const key = b.turn === 1 ? red : yellow;
          job = runAgent(key, b, { ...opts, seed: moveSeed(seed, n) });
          const r = await job.promise;
          job = null;
          if (!r) break;
          const row = play(b, r.move);
          if (winsAt(b, r.move, row)) {
            winner = 3 - b.turn;
            break;
          }
          if (isFull(b)) break;
        }
        if (!rrStop) games.push({ red, yellow, seed, winner, moves: b.moves.length });
      }
    }
    rrOut.replaceChildren(roundRobinTable(games));
    rrStatus.textContent = rrStop ? `Stopped after ${games.length} games.` : `${games.length} games played with depth ${opts.depth} and ${fmtInt(opts.iterations)} MCTS iterations.`;
    rrRun.disabled = false;
    rrCancel.hidden = true;
  });

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
  loadRecord();
  showState({ playing: false, speed: player.speed, time: 0 });
  warmUp(emptyBoard());
  return { player, runnerMode, get record() {
    return record;
  }, play: playGameAsync, humanMove, get busy() {
    return !!job;
  } };
}

/** Results per agent (wins, draws, losses) and every game with its seed. */
function roundRobinTable(games) {
  const tally = Object.fromEntries(AGENT_KEYS.map((k) => [k, { w: 0, d: 0, l: 0 }]));
  for (const g of games) {
    if (g.winner === 0) {
      tally[g.red].d++;
      tally[g.yellow].d++;
    } else {
      const [w, l] = g.winner === 1 ? [g.red, g.yellow] : [g.yellow, g.red];
      tally[w].w++;
      tally[l].l++;
    }
  }
  const summary = h('table', { class: 'data net-table' }, h('caption', { class: 'sr-only', text: 'Round robin results per agent' }), h('thead', {}, h('tr', {}, ...['Agent', 'Wins', 'Draws', 'Losses'].map((t) => h('th', { scope: 'col', text: t })))), h('tbody', {}, ...AGENT_KEYS.map((k) => h('tr', {}, h('th', { scope: 'row', text: AGENTS[k].label }), h('td', { text: String(tally[k].w) }), h('td', { text: String(tally[k].d) }), h('td', { text: String(tally[k].l) })))));
  const list = h('table', { class: 'data net-table rr-games' }, h('caption', { class: 'sr-only', text: 'Every game with its seed' }), h('thead', {}, h('tr', {}, ...['Red', 'Yellow', 'Seed', 'Result', 'Moves'].map((t) => h('th', { scope: 'col', text: t })))), h('tbody', {}, ...games.map((g) => h('tr', {}, h('td', { text: AGENTS[g.red].label }), h('td', { text: AGENTS[g.yellow].label }), h('td', { class: 'mono', text: String(g.seed) }), h('td', { text: g.winner === 0 ? 'Draw' : g.winner === 1 ? 'Red wins' : 'Yellow wins' }), h('td', { text: String(g.moves) })))));
  return h('div', {}, summary, list);
}
