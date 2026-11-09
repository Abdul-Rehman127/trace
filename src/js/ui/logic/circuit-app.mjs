// Circuit: the diagram is rebuilt only when the expression changes. Switching an input
// sends the change through the gates one level per unit on the shared player; each level
// change only updates the classes and value labels of that level's gates and wires.
import { parseExpr, rowEnv } from '../../engine/logic/expr.mjs';
import { layoutCircuit, circuitValues, gateList } from '../../engine/logic/circuit.mjs';
import { circuitSvgTree, gateTableTree, errorTree } from '../../engine/logic/views.mjs';
import { narrateLevel, gateRows } from '../../engine/logic/narrate.mjs';
import { readParams, getParam, enc } from '../../engine/logic/share.mjs';
import { createPlayer, bindTransport, SPEEDS } from '../controls.mjs';
import { createLog } from '../log.mjs';
import { bindKeys } from '../keys.mjs';
import { toggleTheme } from '../theme.mjs';
import { h, fromTree, sentenceNodes, createToast, bindCopy, autoGrow, replaceQuery, prefersReducedMotion } from '../dom.mjs';

const DEFAULT = 'A XOR B XOR C';

export function mountCircuit(root) {
  const stage = root.querySelector('[data-stage]');
  const field = root.querySelector('[data-lg-field="lg-expr"]');
  const scroller = stage.querySelector('[data-lg-scroll]');
  const switchesEl = root.querySelector('[data-lg-switches]');
  const whyText = stage.querySelector('[data-why-text]');
  const whyTime = stage.querySelector('[data-why-time]');
  const qEl = stage.querySelector('[data-lg-q]');
  const clock = stage.querySelector('[data-clock]');
  const clockTotal = stage.querySelector('[data-clock-total]');
  const gatesEl = root.querySelector('[data-lg-gates]');
  const gateTable = root.querySelector('[data-lg-gate-table]');
  const live = root.querySelector('[data-live]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const grow = autoGrow(field);
  const params = readParams(window.location.search);

  let parsed = null;
  let layout = null;
  let env = {};
  let before = [];
  let after = [];
  let changed = null;
  let nodeEls = new Map(); // node id -> { g, wires: [paths from it], val: text }
  let shownK = -1;

  function paint(values, upto) {
    // Nodes at or below level `upto` show their new value, the rest the old one.
    for (const n of layout.nodes) {
      const v = n.level <= upto ? values.after[n.id] : values.before[n.id];
      const el = nodeEls.get(n.id);
      if (!el) continue;
      el.g.classList.toggle('on', v);
      el.g.classList.toggle('off', !v);
      if (el.val) el.val.textContent = v ? '1' : '0';
      for (const w of el.wires) {
        w.classList.toggle('on', v);
        w.classList.toggle('off', !v);
      }
    }
    const out = upto >= layout.depth ? after[layout.root] : before[layout.root];
    const o = nodeEls.get('out');
    o.g.classList.toggle('on', out);
    o.g.classList.toggle('off', !out);
    o.val.textContent = `Q = ${out ? 1 : 0}`;
    qEl.textContent = `Q = ${out ? 1 : 0}`;
  }

  function show(k) {
    if (!layout || k === shownK) return;
    shownK = k;
    paint({ before, after }, k);
    clock.textContent = String(k);
    whyTime.textContent = changed ? `level ${k}` : '';
    const nodes = [];
    narrateLevel(layout, before, after, k, changed).forEach((s, j) => {
      if (j) nodes.push(' ');
      nodes.push(...sentenceNodes(s));
    });
    whyText.replaceChildren(...nodes);
    log.setMoment(k);
  }

  const player = createPlayer({ onFrame: () => {}, onUnit: (k) => show(k), onState: (s) => showState(s) });
  const showState = bindTransport(stage, player, { onUserStep: () => {} });
  const log = createLog(root, { onPick: (k) => player.seek(k) });

  function rebuild() {
    const svg = fromTree(circuitSvgTree(layout, after));
    scroller.replaceChildren(svg);
    nodeEls = new Map();
    for (const g of svg.querySelectorAll('[data-node]')) {
      const id = g.dataset.node === 'out' ? 'out' : Number(g.dataset.node);
      nodeEls.set(id, { g, val: g.querySelector('.g-val, .g-out'), wires: [] });
    }
    for (const w of svg.querySelectorAll('[data-from]')) nodeEls.get(Number(w.dataset.from))?.wires.push(w);
    gatesEl.replaceChildren(...gateList(layout).map((t) => h('li', { class: 'mono', text: t })));
  }

  function updateTable() {
    gateTable.replaceChildren(fromTree(gateTableTree(gateRows(layout, after))));
  }

  function setSwitches() {
    switchesEl.replaceChildren(
      ...parsed.vars.map((v) => {
        const b = h('button', { type: 'button', class: 'lg-switch', 'data-var': v, 'aria-pressed': String(!!env[v]) }, h('span', { class: 'lg-sw-name', text: v }), h('span', { class: 'lg-sw-val', text: env[v] ? '1' : '0' }));
        b.addEventListener('click', () => toggle(v));
        return b;
      }),
    );
  }

  function load(text, { fromUser }) {
    const p = parseExpr(text);
    field.setAttribute('aria-invalid', String(!!p.error));
    if (p.error) {
      scroller.replaceChildren(fromTree(errorTree(text, p.pos, p.error)));
      return;
    }
    parsed = p;
    layout = layoutCircuit(p.ast);
    const keep = env;
    env = Object.fromEntries(p.vars.map((v) => [v, !!keep[v]]));
    after = circuitValues(layout, env);
    before = after;
    changed = null;
    rebuild();
    setSwitches();
    updateTable();
    clockTotal.textContent = String(layout.depth);
    log.setMoments(Array.from({ length: layout.depth + 1 }, (_, k) => k), (k) => narrateLevel(layout, before, after, k, changed), (k) => `Level ${k}`);
    shownK = -1;
    player.load(layout.depth);
    player.seek(layout.depth, { animate: false });
    if (fromUser) scheduleUrl();
  }

  function toggle(v) {
    env[v] = !env[v];
    before = after;
    after = circuitValues(layout, env);
    changed = v;
    for (const b of switchesEl.querySelectorAll('[data-var]')) {
      const on = !!env[b.dataset.var];
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.lg-sw-val').textContent = on ? '1' : '0';
    }
    updateTable();
    log.setMoments(Array.from({ length: layout.depth + 1 }, (_, k) => k), (k) => narrateLevel(layout, before, after, k, changed), (k) => `Level ${k}`);
    shownK = -1;
    player.load(layout.depth);
    if (prefersReducedMotion()) player.seek(layout.depth, { animate: false });
    else player.play();
    live.textContent = `${v} is now ${env[v] ? 1 : 0}. Output Q is ${after[layout.root] ? 1 : 0}.`;
    scheduleUrl();
  }

  let urlTimer = 0;
  const bitsOf = () => (parsed ? parsed.vars.map((v) => (env[v] ? '1' : '0')).join('') : '');
  function scheduleUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => replaceQuery(`e=${enc(field.value.trim())}&in=${bitsOf()}`), 400);
  }

  field.addEventListener('input', () => load(field.value, { fromUser: true }));
  for (const chip of root.querySelectorAll('[data-expr]')) {
    chip.addEventListener('click', () => {
      field.value = chip.dataset.expr;
      grow();
      load(field.value, { fromUser: true });
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?e=${enc(field.value.trim())}&in=${bitsOf()}`, toast);

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
    // No timeline slider on this page; arrow keys work through the page-wide shortcuts.
    document.createElement('div'),
  );

  field.value = getParam(params, 'e') ?? DEFAULT;
  grow();
  const bits = getParam(params, 'in');
  const first = parseExpr(field.value);
  if (!first.error && bits && /^[01]{1,6}$/.test(bits)) first.vars.forEach((v, i) => (env[v] = bits[i] === '1'));
  else if (!first.error) Object.assign(env, rowEnv(first.vars, 0));
  load(field.value, { fromUser: false });
  showState({ playing: false, speed: player.speed, time: 0 });
  return { player, toggle, get layout() {
    return layout;
  }, get values() {
    return after;
  }, get env() {
    return env;
  } };
}
