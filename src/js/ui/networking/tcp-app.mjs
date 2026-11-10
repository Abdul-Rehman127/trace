// TCP handshake and teardown simulator on the shared player: the diagram reveals each
// segment and state at its time, the narration and states panel follow the playhead.
// One owner for motion: the player's frame loop moves the "now" line; a time change only
// toggles classes on the elements of the times that changed.
import { simulateTcp, statesAt, parseBounded } from '../../engine/networking/tcp.mjs';
import { narrateTcp, tcpSentenceText, tcpDiagramTree, tcpRowsTree, TCP_ROW, TCP_TOP } from '../../engine/networking/views.mjs';
import { encodeTcp, decodeTcp } from '../../engine/networking/share.mjs';
import { createPlayer, bindTransport, SPEEDS } from '../controls.mjs';
import { createLog } from '../log.mjs';
import { bindKeys } from '../keys.mjs';
import { toggleTheme } from '../theme.mjs';
import { fromTree, sentenceNodes, createToast, bindCopy, fieldError, replaceQuery } from '../dom.mjs';

const DEFAULT = { scenario: 'normal', isnClient: 1000, isnServer: 5000, data: 0 };
const LIMITS = { isnClient: [0, 2 ** 32 - 1, 'The client sequence number'], isnServer: [0, 2 ** 32 - 1, 'The server sequence number'], data: [0, 1460, 'The data size'] };

export function mountTcp(root) {
  const stage = root.querySelector('[data-stage]');
  const scroller = stage.querySelector('[data-tcp-scroll]');
  const ruler = stage.querySelector('[data-ruler]');
  const fill = stage.querySelector('[data-pg-fill]');
  const clock = stage.querySelector('[data-clock]');
  const clockTotal = stage.querySelector('[data-clock-total]');
  const whyText = stage.querySelector('[data-why-text]');
  const whyTime = stage.querySelector('[data-why-time]');
  const stateEls = { client: stage.querySelector('[data-state="client"]'), server: stage.querySelector('[data-state="server"]') };
  const rowsEl = root.querySelector('[data-tcp-rows]');
  const live = root.querySelector('[data-live]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const fields = [...root.querySelectorAll('[data-tcp]')];
  const chips = [...root.querySelectorAll('[data-scenario]')];

  const decoded = decodeTcp(window.location.search, DEFAULT);
  const input = { ...decoded.input };
  let current = null;
  let byTime = new Map(); // t -> elements that appear at t (diagram and table rows)
  let now = null;
  let shownK = -1;

  // Vertical follow: widths and scroll come from events, never read while playing.
  let viewW = 0;
  let viewH = 0;
  let scrollY = 0;
  scroller.addEventListener('scroll', () => (scrollY = scroller.scrollTop), { passive: true });
  new ResizeObserver((e) => {
    viewW = e[0].contentRect.width;
    viewH = e[0].contentRect.height;
  }).observe(scroller);
  function follow(t) {
    if (!viewW) return;
    const scale = Math.min(1, viewW / 600);
    const y = (TCP_TOP + t * TCP_ROW) * scale;
    if (y < scrollY + 20 || y > scrollY + viewH - 60) scroller.scrollTop = Math.max(0, y - viewH / 3);
  }

  let announceTimer = 0;
  function announce() {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (!current) return;
      const t = Math.round(player.time);
      live.textContent = `Time ${t}. ${narrateTcp(current, t).map(tcpSentenceText).join(' ')}`;
    }, 300);
  }

  function setVisible(k) {
    for (const [t, els] of byTime) {
      const fut = t > k;
      for (const el of els) el.classList.toggle('fut', fut);
    }
  }

  function show(k) {
    if (!current || k === shownK) return;
    const prev = shownK;
    shownK = k;
    // Only the times between the old and new position change.
    const lo = Math.min(prev, k) + 1;
    const hi = Math.max(prev, k);
    for (let t = Math.max(0, lo); t <= hi; t++) for (const el of byTime.get(t) || []) el.classList.toggle('fut', t > k);
    clock.textContent = String(k);
    whyTime.textContent = `at time ${k}`;
    const nodes = [];
    narrateTcp(current, k).forEach((s, j) => {
      if (j) nodes.push(' ');
      nodes.push(...sentenceNodes(s));
    });
    whyText.replaceChildren(...nodes);
    const st = statesAt(current, k);
    stateEls.client.textContent = st.client;
    stateEls.server.textContent = st.server;
    ruler.setAttribute('aria-valuenow', String(k));
    ruler.setAttribute('aria-valuetext', `Time ${k} of ${current.end}. Client ${st.client}, server ${st.server}`);
    log.setMoment(k);
    follow(k);
  }

  const player = createPlayer({
    onFrame: (t) => {
      if (!current) return;
      fill.style.transform = `scaleX(${Math.min(1, t / current.end)})`;
      if (now) now.setAttribute('transform', `translate(0 ${t * TCP_ROW})`);
    },
    onUnit: (k) => show(k),
    onState: (s) => showState(s),
  });
  const showState = bindTransport(stage, player, { onUserStep: announce });
  const log = createLog(root, {
    onPick: (k) => {
      player.seek(k);
      announce();
    },
  });

  function apply() {
    current = simulateTcp(input);
    const svg = fromTree(tcpDiagramTree(current, { k: 0 }));
    scroller.replaceChildren(svg);
    scroller.scrollTop = 0;
    scrollY = 0;
    now = svg.querySelector('[data-now]');
    rowsEl.replaceChildren(...tcpRowsTree(current).map((n) => fromTree(n)));
    byTime = new Map();
    for (const el of [...svg.querySelectorAll('[data-t]'), ...rowsEl.querySelectorAll('tr[data-t]')]) {
      const t = Number(el.dataset.t);
      if (!byTime.has(t)) byTime.set(t, []);
      byTime.get(t).push(el);
    }
    shownK = -1;
    setVisible(0);
    clockTotal.textContent = String(current.end);
    ruler.setAttribute('aria-valuemax', String(current.end));
    log.setMoments(Array.from({ length: current.end + 1 }, (_, t) => t), (t) => narrateTcp(current, t), (t) => `Time ${t}`);
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.scenario === input.scenario));
    player.load(current.end);
  }

  let urlTimer = 0;
  const scheduleUrl = () => {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => replaceQuery(encodeTcp(input)), 400);
  };

  for (const el of fields) {
    el.addEventListener('input', () => {
      const [lo, hi, label] = LIMITS[el.dataset.tcp];
      const r = parseBounded(el.value, lo, hi, label);
      fieldError(el, root.querySelector(`#${el.id}-err`), r.error);
      if (r.error) return;
      input[el.dataset.tcp] = r.value;
      apply();
      scheduleUrl();
    });
  }
  for (const c of chips) {
    c.addEventListener('click', () => {
      input.scenario = c.dataset.scenario;
      apply();
      scheduleUrl();
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${encodeTcp(input)}`, toast);

  // The progress track: click or drag to move.
  ruler.addEventListener('pointerdown', (e) => {
    if (!current) return;
    const box = ruler.getBoundingClientRect();
    const at = (x) => Math.round(Math.max(0, Math.min(1, (x - box.left) / box.width)) * current.end);
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

  for (const el of fields) el.value = String(input[el.dataset.tcp]);
  apply();
  showState({ playing: false, speed: player.speed, time: 0 });
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);
  return { player, get current() {
    return current;
  } };
}
