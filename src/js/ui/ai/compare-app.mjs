// Compare agents: one Connect Four position given to every agent, one after another without
// blocking the page; the chosen column, the computing time and the work done.
import { fmtInt } from '../../engine/format.mjs';
import { AGENTS, AGENT_KEYS, boardFromMoves, LIMITS } from '../../engine/ai/c4.mjs';
import { c4BoardTree } from '../../engine/ai/views.mjs';
import { readParams, getParam } from '../../engine/logic/share.mjs';
import { runAgent, warmUp } from './runner.mjs';
import { h, fromTree, createToast, bindCopy, autoGrow, fieldError, replaceQuery } from '../dom.mjs';

export function mountAiCompare(root) {
  const movesEl = root.querySelector('[data-ai-moves]');
  const err = root.querySelector('#ai-moves-err');
  const boardEl = root.querySelector('[data-c4]');
  const rows = root.querySelector('[data-cmp-rows]');
  const status = root.querySelector('[data-cmp-status]');
  const runBtn = root.querySelector('[data-cmp-run]');
  const cancelBtn = root.querySelector('[data-cmp-cancel]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const grow = autoGrow(movesEl);
  const params = readParams(window.location.search);
  const opts = { depth: 4, iterations: 1000, seed: 1 };
  let board = null;
  let job = null;
  let stop = false;
  let results = {};

  const query = () => `m=${movesEl.value.trim()}&depth=${opts.depth}&it=${opts.iterations}`;

  function load() {
    const text = movesEl.value.trim();
    const b = boardFromMoves(text);
    fieldError(movesEl, err, b ? null : 'Use column numbers 1 to 7, each into a column that is not full, and stop when someone has won.');
    if (!b) return;
    board = b;
    boardEl.replaceChildren(fromTree(c4BoardTree(b, { label: 'Position to compare on' })));
    results = {};
    renderRows();
    status.textContent = `${b.turn === 1 ? 'Red' : 'Yellow'} to move. Press "Ask every agent".`;
  }

  function renderRows() {
    rows.replaceChildren(
      ...AGENT_KEYS.map((k) => {
        const r = results[k];
        const work = !r ? '' : k === 'mcts' ? `${fmtInt(r.iterations)} iterations` : k === 'random' ? 'none' : `${fmtInt(r.nodes)} positions`;
        return h('tr', {}, h('th', { scope: 'row', text: AGENTS[k].label }), h('td', { text: r ? `Column ${r.move + 1}` : '' }), h('td', { class: 'mono', text: r ? `${r.ms < 1 ? '<1' : Math.round(r.ms)} ms` : '' }), h('td', { class: 'mono', text: work }));
      }),
    );
  }

  async function runAll() {
    if (!board) return;
    stop = false;
    runBtn.disabled = true;
    cancelBtn.hidden = false;
    results = {};
    renderRows();
    for (const k of AGENT_KEYS) {
      if (stop) break;
      status.textContent = `${AGENTS[k].label} is thinking...`;
      job = runAgent(k, board, opts);
      const r = await job.promise;
      job = null;
      if (!r) break;
      results[k] = r;
      renderRows();
    }
    status.textContent = stop ? 'Stopped.' : `Every agent answered. Times are measured in this browser and vary from run to run.`;
    runBtn.disabled = false;
    cancelBtn.hidden = true;
    replaceQuery(query());
  }

  movesEl.addEventListener('input', () => load());
  for (const el of root.querySelectorAll('[data-ai-opt]')) {
    el.addEventListener('input', () => {
      const v = Number(el.value);
      const [lo, hi] = el.dataset.aiOpt === 'depth' ? LIMITS.depth : LIMITS.iterations;
      if (/^\d+$/.test(el.value.trim()) && v >= lo && v <= hi) opts[el.dataset.aiOpt] = v;
    });
  }
  for (const chip of root.querySelectorAll('[data-moves]')) {
    chip.addEventListener('click', () => {
      movesEl.value = chip.dataset.moves;
      grow();
      load();
      replaceQuery(query());
    });
  }
  runBtn.addEventListener('click', () => runAll());
  cancelBtn.addEventListener('click', () => {
    stop = true;
    if (job) job.cancel();
  });
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${query()}`, toast);

  const m = getParam(params, 'm');
  if (m !== null) movesEl.value = m;
  for (const [k, p] of [['depth', 'depth'], ['iterations', 'it']]) {
    const v = getParam(params, p);
    if (v && /^\d{1,5}$/.test(v)) opts[k] = Number(v);
    const el = root.querySelector(`[data-ai-opt="${k}"]`);
    if (el) el.value = String(opts[k]);
  }
  grow();
  load();
  if (board) warmUp(board);
  return { runAll, get results() {
    return results;
  } };
}
