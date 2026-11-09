// Mounts the page replacement simulator: inputs, the shared player and transport,
// the step table, narration, the "what the algorithm looks at" list, results,
// the decision log, share links and keyboard.
//
// One owner for motion: the shared player's requestAnimationFrame loop. A step change
// writes one attribute on the table (data-k) and the CSS shows and hides columns; the
// progress bar is one transform per frame. Reset, a new input and a hidden tab all go
// through player.load() or the player's own visibility handling.

import { simulatePaging } from '../../engine/memory/paging.mjs';
import { encodePaging, decodePaging } from '../../engine/memory/share.mjs';
import { defaultPaging } from '../../engine/memory/presets.mjs';
import { narratePagingStep, pagingView, pagingSentenceText } from '../../engine/memory/narrate.mjs';
import { pagingTableTree } from '../../engine/memory/table.mjs';
import { totalsTree, moreTree } from '../../engine/memory/views.mjs';
import { createPlayer, bindTransport, SPEEDS } from '../controls.mjs';
import { createLog } from '../log.mjs';
import { bindKeys } from '../keys.mjs';
import { toggleTheme } from '../theme.mjs';
import { h, fromTree, sentenceNodes, createToast, bindCopy, prefersReducedMotion } from '../dom.mjs';
import { createPagingInputs } from './paging-inputs.mjs';

const URL_DEBOUNCE = 400;
const LABEL_W = 96; // step table label column, px (see .pg in tool.css)
const COL_W = 44; // one step column, px

export function mountPaging(root) {
  const stage = root.querySelector('[data-stage]');
  const pageAlg = root.dataset.alg;
  const selectable = root.dataset.selectable === '1';
  const scroller = stage.querySelector('[data-pg-scroll]');
  const ruler = stage.querySelector('[data-ruler]');
  const fill = stage.querySelector('[data-pg-fill]');
  const clock = stage.querySelector('[data-clock]');
  const clockTotal = stage.querySelector('[data-clock-total]');
  const whyText = stage.querySelector('[data-why-text]');
  const whyTime = stage.querySelector('[data-why-time]');
  const viewLabel = stage.querySelector('[data-view-label]');
  const viewList = stage.querySelector('[data-view]');
  const totals = root.querySelector('[data-totals]');
  const more = root.querySelector('[data-more]');
  const live = root.querySelector('[data-live]');
  const toast = createToast(root.querySelector('[data-toast]'));

  const decoded = decodePaging(window.location.search, defaultPaging(pageAlg));
  let algorithm = selectable ? decoded.input.algorithm : pageAlg;
  root.dataset.alg = algorithm;
  let changedByUser = decoded.found;
  let current = null; // { input, result }
  let table = null;
  let columns = []; // columns[c] = { head: [cells], body: [cells] }
  let tableK = 0;
  let shownK = -1;

  // Move the table's column state from tableK to k, touching only the columns that change.
  function setTableK(k) {
    const lo = Math.max(0, Math.min(tableK, k) - 1);
    const hi = Math.min(columns.length - 1, Math.max(tableK, k));
    for (let c = lo; c <= hi; c++) {
      const col = columns[c];
      const now = c === k - 1;
      for (const cell of col.head) cell.classList.toggle('now', now);
      for (const cell of col.body) {
        cell.classList.toggle('now', now);
        cell.classList.toggle('fut', c >= k);
      }
    }
    tableK = k;
    table.setAttribute('data-k', String(k));
  }

  // Scroll position and width are tracked from events, so following the playhead never reads layout.
  let viewW = 0;
  let scrollX = 0;
  scroller.addEventListener('scroll', () => (scrollX = scroller.scrollLeft), { passive: true });
  new ResizeObserver((entries) => (viewW = entries[0].contentRect.width)).observe(scroller);

  // ---------- screen reader announcements (steps, pauses and jumps only) ----------
  let announceTimer = 0;
  function announce() {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (!current) return;
      const k = Math.round(player.time);
      const text = narratePagingStep(current.result, k).map(pagingSentenceText).join(' ');
      live.textContent = k === 0 ? text : `Step ${k}. ${text}`;
    }, 300);
  }

  function follow(k) {
    if (!viewW || k < 1) return;
    const left = LABEL_W + (k - 1) * COL_W;
    const right = left + COL_W;
    if (left < scrollX + LABEL_W || right > scrollX + viewW) {
      scroller.scrollLeft = Math.max(0, right - viewW + COL_W);
    }
  }

  function show(k, { playing }) {
    if (!current || k === shownK) return;
    shownK = k;
    const r = current.result;
    setTableK(k);
    clock.textContent = String(k);
    whyTime.textContent = k === 0 ? '' : `at step ${k}`;
    const nodes = [];
    narratePagingStep(r, k).forEach((s, j) => {
      if (j) nodes.push(' ');
      nodes.push(...sentenceNodes(s));
    });
    whyText.replaceChildren(...nodes);
    const view = pagingView(r, k);
    // One slot per frame, filled or not, so the list keeps its height while playing.
    const chips = view.items.map((it) => h('li', { class: 'pg-chip' }, h('b', { text: String(it.page) }), h('span', { text: it.note })));
    while (chips.length < r.frames) chips.push(h('li', { class: 'pg-chip slot', 'aria-hidden': 'true' }));
    viewList.replaceChildren(...chips);
    ruler.setAttribute('aria-valuenow', String(k));
    ruler.setAttribute('aria-valuetext', k === 0 ? 'Before step 1' : `Step ${k} of ${r.references}, page ${r.steps[k - 1].page}, ${r.steps[k - 1].hit ? 'hit' : 'fault'}`);
    log.setMoment(k);
    follow(k);
    if (!playing) announce();
  }

  const player = createPlayer({
    onFrame: (t) => {
      const T = current ? current.result.references : 1;
      fill.style.transform = `scaleX(${Math.min(1, t / T)})`;
    },
    onUnit: (k, info) => show(k, info),
    onState: (s) => showState(s),
  });
  const showState = bindTransport(stage, player, { onUserStep: announce });

  const log = createLog(root, {
    onPick: (k) => {
      player.seek(k);
      announce();
    },
  });

  // ---------- applying an input ----------
  function apply(input) {
    const full = { ...input, algorithm };
    const result = simulatePaging(full);
    current = { input: full, result };
    table = fromTree(pagingTableTree(result, { k: 0, caption: 'Step table: frames after each page reference' }));
    columns = result.steps.map(() => ({ head: [], body: [] }));
    for (const row of table.rows) {
      const body = row.parentElement.tagName === 'TBODY';
      for (let c = 1; c < row.cells.length; c++) columns[c - 1][body ? 'body' : 'head'].push(row.cells[c]);
    }
    tableK = 0;
    scroller.replaceChildren(table);
    scroller.scrollLeft = 0;
    scrollX = 0;
    totals.replaceChildren(...totalsTree(result).map(fromTree));
    more.replaceChildren(...moreTree(full).map(fromTree));
    viewLabel.textContent = pagingView(result, 0).label;
    clockTotal.textContent = String(result.references);
    ruler.setAttribute('aria-valuemax', String(result.references));
    const steps = Array.from({ length: result.references + 1 }, (_, k) => k);
    log.setMoments(steps, (k) => narratePagingStep(result, k), (k) => (k === 0 ? 'Start' : `Step ${k}`));
    shownK = -1;
    player.load(result.references);
  }

  // ---------- share links ----------
  const shareUrl = () => `${window.location.origin}${window.location.pathname}?${encodePaging(current.input)}`;
  let urlTimer = 0;
  function scheduleUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      if (!current) return;
      try {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?${encodePaging(current.input)}${window.location.hash}`);
      } catch {
        /* some embedded browsers refuse; the copy button still works */
      }
      updateLinks();
    }, URL_DEBOUNCE);
  }
  // Links to the other algorithm pages carry the current pages once the visitor has changed them.
  function updateLinks() {
    if (!changedByUser || !current) return;
    for (const a of document.querySelectorAll('[data-alg-link]')) {
      if (a.getAttribute('aria-current') === 'page') continue;
      const path = a.getAttribute('href').split('?')[0];
      a.setAttribute('href', `${path}?${encodePaging({ ...current.input, algorithm: a.dataset.algLink })}`);
    }
  }

  const inputs = createPagingInputs(root, {
    initial: decoded.input,
    onChange: (input) => {
      if (!input) return; // keep showing the last valid run
      changedByUser = true;
      apply(input);
      scheduleUrl();
    },
  });

  // ---------- algorithm selector on the overview page ----------
  if (selectable) {
    const choices = [...document.querySelectorAll('[data-alg-choice]')];
    const press = () => {
      for (const b of choices) b.setAttribute('aria-pressed', String(b.dataset.algChoice === algorithm));
    };
    press();
    for (const b of choices) {
      b.addEventListener('click', () => {
        if (b.dataset.algChoice === algorithm) return;
        algorithm = b.dataset.algChoice;
        root.dataset.alg = algorithm;
        press();
        apply(inputs.value());
        scheduleUrl();
      });
    }
  }

  bindCopy(root, shareUrl, toast);

  // ---------- the progress track: click or drag to move ----------
  ruler.addEventListener('pointerdown', (e) => {
    if (!current) return;
    const box = ruler.getBoundingClientRect();
    const at = (x) => Math.round(Math.max(0, Math.min(1, (x - box.left) / box.width)) * current.result.references);
    player.seek(at(e.clientX), { animate: false });
    const move = (ev) => player.seek(at(ev.clientX), { animate: false });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      announce();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  // ---------- keyboard ----------
  const changeSpeed = (dir) => {
    const i = SPEEDS.indexOf(player.speed);
    const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + dir))];
    player.setSpeed(next);
    toast(`Speed ${next}x`, 1000);
  };
  const user = (fn) => () => {
    fn();
    announce();
  };
  bindKeys(
    {
      toggle: () => {
        const was = player.playing;
        player.toggle();
        if (was) announce();
      },
      back: user(() => player.stepBack()),
      forward: user(() => player.stepForward()),
      home: user(() => player.seek(0)),
      end: user(() => player.seek(player.length)),
      reset: user(() => player.seek(0)),
      slower: () => changeSpeed(-1),
      faster: () => changeSpeed(1),
      theme: toggleTheme,
    },
    ruler,
  );

  // ---------- go ----------
  apply(inputs.value() || decoded.input);
  showState({ playing: false, speed: player.speed, time: 0 });
  updateLinks();
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);
  if (prefersReducedMotion()) root.classList.add('reduced');

  return { player, get current() {
    return current;
  } };
}
