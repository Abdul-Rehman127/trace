// Mounts the simulator on a tool page and connects inputs, engine, timeline,
// narration panel, results, share links and keyboard.

import { simulate } from '../engine/scheduling.mjs';
import { encodeScenario, decodeScenario } from '../engine/share.mjs';
import { defaultScenario } from '../engine/presets.mjs';
import { createInputs } from './inputs.mjs';
import { createTimeline } from './timeline.mjs';
import { createPlayer, bindTransport, SPEEDS } from './controls.mjs';
import { createPanel } from './panel.mjs';
import { createResults } from './results.mjs';
import { bindKeys } from './keys.mjs';
import { toggleTheme } from './theme.mjs';

const URL_DEBOUNCE = 400;

export function mountTool(root) {
  const stage = root.querySelector('[data-stage]');
  const pageAlg = root.dataset.alg;
  const selectable = root.dataset.selectable === '1';
  const clock = stage.querySelector('[data-clock]');
  const clockTotal = stage.querySelector('[data-clock-total]');
  const live = root.querySelector('[data-live]');
  const toastEl = root.querySelector('[data-toast]');
  const copyBtn = root.querySelector('[data-copy]');
  const copyFallback = root.querySelector('[data-copy-fallback]');
  const copyField = root.querySelector('[data-copy-field]');

  // ---------- starting scenario: share link or the page default ----------
  const decoded = decodeScenario(window.location.search, defaultScenario(pageAlg));
  let algorithm = selectable ? decoded.scenario.algorithm : pageAlg;
  decoded.scenario.algorithm = algorithm;
  root.dataset.alg = algorithm;

  let current = null;
  let lastText = '';
  // A share link counts as a changed scenario: links to other algorithms carry it along.
  let changedByUser = decoded.found;

  // ---------- toast ----------
  let toastTimer = 0;
  function toast(text, ms = 1800) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // ---------- screen reader announcements (steps, pauses and scrubs only) ----------
  let announceTimer = 0;
  function announce() {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      if (!current) return;
      const k = player.time >= player.length ? player.length : Math.floor(player.time + 1e-9);
      live.textContent = `Time ${k}. ${lastText}`;
    }, 300);
  }

  // ---------- parts ----------
  const results = createResults(root);
  const panel = createPanel(stage);
  const timeline = createTimeline(stage, {
    onScrubStart: () => player.pause(),
    onScrub: (t) => player.seek(t, { animate: false }),
    onScrubEnd: (t) => {
      player.seek(Math.round(t));
      announce();
    },
  });
  const ruler = timeline.ruler;

  function runningAt(k) {
    const seg = current.result.segments.find((s) => s.start <= k && k < s.end);
    return seg && seg.pid ? `${seg.pid} is running.` : k >= current.result.summary.makespan ? 'All processes are done.' : 'The CPU is idle.';
  }

  const player = createPlayer({
    onFrame: (t) => timeline.render(t),
    onUnit: (k, { prev, playing }) => {
      clock.textContent = String(k);
      timeline.unit(k, { follow: playing });
      if (playing && prev >= 0 && k > prev) {
        for (const r of current.result.rows) if (r.completion > prev && r.completion <= k) completedSince.push(r.id);
      }
      // While playing, the text panels update one frame later so a unit change never
      // does all its work in a single frame. When paused, everything updates at once.
      pendingUnit = { k, playing };
      if (!playing) flushUnit();
      else if (!unitRaf) unitRaf = requestAnimationFrame(flushUnit);
    },
    onState: (s) => {
      showState(s);
      timeline.setPlaying(s.playing, { time: s.time, speed: s.speed, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
    },
  });
  const showState = bindTransport(stage, player, { onUserStep: announce });

  let pendingUnit = null;
  let unitRaf = 0;
  const completedSince = [];
  function flushUnit() {
    if (unitRaf) cancelAnimationFrame(unitRaf);
    unitRaf = 0;
    if (!pendingUnit || !current) return;
    const { k, playing } = pendingUnit;
    pendingUnit = null;
    lastText = panel.update(k, playing, player.speed);
    ruler.setAttribute('aria-valuenow', String(k));
    ruler.setAttribute('aria-valuetext', `Time ${k} of ${current.result.summary.makespan}. ${runningAt(k)}`);
    while (completedSince.length) results.flash(completedSince.shift());
  }

  // ---------- applying a scenario ----------
  function apply(scenario, { animate }) {
    const result = simulate(scenario);
    current = { scenario, result };
    timeline.setModel(scenario, result);
    panel.setModel(scenario, result);
    results.render(result);
    clockTotal.textContent = String(result.summary.makespan);
    player.load(result.summary.makespan);
    timeline.refresh(animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  const shareQuery = (s) => encodeScenario(s);
  const shareUrl = () => `${window.location.origin}${window.location.pathname}?${shareQuery(current.scenario)}`;

  let urlTimer = 0;
  function scheduleUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      if (!current) return;
      try {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?${shareQuery(current.scenario)}${window.location.hash}`);
      } catch {
        /* some embedded browsers refuse; the copy button still works */
      }
      updateLinks();
    }, URL_DEBOUNCE);
  }

  // Links to the other algorithm pages carry the current processes once the visitor has changed them.
  function updateLinks() {
    if (!changedByUser) return;
    for (const a of document.querySelectorAll('[data-alg-link]')) {
      if (a.getAttribute('aria-current') === 'page') continue;
      const s = inputs.scenarioFor(a.dataset.algLink);
      const path = a.getAttribute('href').split('?')[0];
      a.setAttribute('href', s ? `${path}?${shareQuery(s)}` : path);
    }
  }

  const inputs = createInputs(root, {
    algorithm,
    initial: decoded.scenario,
    onChange: (s) => {
      if (!s) return; // keep showing the last valid timeline
      changedByUser = true;
      apply(s, { animate: true });
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
        inputs.setAlgorithm(algorithm);
      });
    }
  }
  // Keep the selected algorithm visible in the horizontally scrolling selector.
  const selected = document.querySelector('.algs [aria-current="page"], .algs [aria-pressed="true"]');
  const wrap = document.querySelector('.algs-wrap');
  if (selected && wrap && wrap.scrollWidth > wrap.clientWidth) {
    wrap.scrollLeft = selected.offsetLeft - (wrap.clientWidth - selected.offsetWidth) / 2;
  }

  // ---------- copy link ----------
  copyBtn.addEventListener('click', async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      copyFallback.hidden = true;
      toast('Link copied');
    } catch {
      copyField.value = url;
      copyFallback.hidden = false;
      copyField.focus();
      copyField.select();
    }
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
  apply(inputs.scenario() || decoded.scenario, { animate: false });
  showState({ playing: false, speed: player.speed, time: 0 });
  updateLinks();
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);

  return { player, timeline };
}
