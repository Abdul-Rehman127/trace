// The live timeline: ruler with playhead, a CPU lane and one lane per process.
// Geometry lives in CSS custom properties (--u unit width, --s start, --len length),
// set once per layout through the CSSOM. Per frame, only the playhead and the bars
// under it are touched, and only with transforms.

import { h } from './dom.mjs';
import { iconCheck } from './icons.mjs';
import { UNIT_MS } from './controls.mjs';
import { prefersReducedMotion } from './dom.mjs';

const MIN_U = 14;
const MAX_U = 72;
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100];
const LEAD = 12; // matches --lead in tool.css
// Bars are grouped into blocks of time so a change repaints one block, not a whole lane.
const BLOCK = 24;

/** Append to the block of `track` that covers time `t`, creating it on first use. */
function blockFor(track, t) {
  const key = Math.floor(t / BLOCK);
  if (!track._blocks) track._blocks = new Map();
  let b = track._blocks.get(key);
  if (!b) {
    b = h('div', { class: 'block' });
    track._blocks.set(key, b);
    track.append(b);
  }
  return b;
}

const slotOf = (id) => Number(id.slice(1));
const color = (id) => `var(--c${slotOf(id)})`;
const onColor = (id) => `var(--on-c${slotOf(id)})`;

export function createTimeline(stage, { onScrubStart, onScrub, onScrubEnd }) {
  const scroller = stage.querySelector('[data-scroller]');
  const lanes = stage.querySelector('[data-lanes]');
  const ruler = stage.querySelector('[data-ruler]');
  const ticks = stage.querySelector('[data-ticks]');
  const graphic = stage.querySelector('[data-graphic]');
  const head = stage.querySelector('[data-head]');
  const headLabel = stage.querySelector('[data-head-label]');
  const tip = stage.querySelector('[data-tip]');

  let model = null;
  let u = 32;
  let nameW = 96;
  let viewW = 0;
  let scrollLeft = 0;
  let step = 1;
  let shownLabel = -1;
  let lastTime = 0;
  // Fill state: segments [0, full) are complete; `active` is partly filled.
  let full = 0;
  let active = -1;

  function clear() {
    graphic.replaceChildren();
    ticks.replaceChildren();
  }

  /** Build all lane DOM for a new schedule. Called on every valid input change. */
  function setModel(scenario, result) {
    // Drop everything that belonged to the previous schedule.
    if (headAnim) headAnim.cancel();
    headAnim = null;
    cancelBarAnims();
    motion = null;
    hideTip();
    head.style.transform = '';
    const T = result.summary.makespan;
    const procs = scenario.processes;
    const segs = [];

    const cpuTrack = h('div', { class: 'track' });
    const cpuLane = h('div', { class: 'lane cpu' }, h('div', { class: 'lane-name', text: 'CPU' }), cpuTrack);
    const procTracks = new Map();
    const laneEls = procs.map((p) => {
      const track = h('div', { class: 'track' });
      procTracks.set(p.id, track);
      return h(
        'div',
        { class: 'lane' },
        h('div', { class: 'lane-name' }, h('i', { class: 'swatch', vars: { '--c': color(p.id) } }), p.id),
        track,
      );
    });

    // Slice boundaries inside one continuous run (Round Robin slices that continue alone).
    const ticksAt = new Map();
    for (let i = 1; i < result.slices.length; i++) {
      const a = result.slices[i - 1];
      const b = result.slices[i];
      if (a.pid && a.pid === b.pid && a.end === b.start) ticksAt.set(b.start, a.pid);
    }

    const makeBar = (seg, i) => {
      const lbl = h('span', { class: 'flbl', text: seg.pid });
      const fill = h('div', { class: 'fill' }, lbl);
      const el = h('div', {
        class: 'bar-seg',
        'data-label': seg.pid,
        dataset: { i: String(i) },
        vars: { '--s': seg.start, '--len': seg.end - seg.start, '--c': color(seg.pid), '--on': onColor(seg.pid) },
      });
      el.append(fill);
      for (const [b, pid] of ticksAt) {
        if (pid === seg.pid && b > seg.start && b < seg.end) el.append(h('i', { class: 'qtick', vars: { '--b': b - seg.start } }));
      }
      return { el, fill, lbl };
    };

    for (const seg of result.segments) {
      if (seg.pid === null) {
        blockFor(cpuTrack, seg.start).append(h('div', { class: 'idle-seg', vars: { '--s': seg.start, '--len': seg.end - seg.start }, text: 'idle' }));
        continue;
      }
      const i = segs.length;
      const cpuBar = makeBar(seg, i);
      const laneBar = makeBar(seg, i);
      blockFor(cpuTrack, seg.start).append(cpuBar.el);
      blockFor(procTracks.get(seg.pid), seg.start).append(laneBar.el);
      segs.push({ ...seg, views: [cpuBar, laneBar], lane: procs.findIndex((p) => p.id === seg.pid), p: 0 });
    }

    // Waiting stretches (arrived, not running) and completion marks.
    const doneMarks = [];
    for (const p of procs) {
      const own = result.segments.filter((s) => s.pid === p.id);
      const track = procTracks.get(p.id);
      let from = p.arrival;
      for (const s of own) {
        if (s.start > from) blockFor(track, from).append(h('div', { class: 'wait', vars: { '--s': from, '--len': s.start - from, '--c': color(p.id) } }));
        from = s.end;
      }
      const row = result.rows.find((r) => r.id === p.id);
      const mark = h('div', { class: 'done-mark', vars: { '--s': row.completion } }, iconCheck(16));
      blockFor(track, row.completion).append(mark);
      doneMarks.push({ el: mark, at: row.completion, shown: false });
    }

    graphic.replaceChildren(cpuLane, ...laneEls);
    graphic.setAttribute('aria-label', summaryText(result));
    scroller.dataset.n = String(procs.length);
    lanes.style.setProperty('--T', String(T));
    ruler.setAttribute('aria-valuemax', String(T));

    model = { T, segs, doneMarks, procs };
    full = 0;
    active = -1;
    shownLabel = -1;
    measure(true);
    scroller.scrollLeft = 0;
    scrollLeft = 0;
  }

  function summaryText(result) {
    const parts = result.segments.map((s) => (s.pid ? `${s.pid} runs ${s.start} to ${s.end}` : `idle ${s.start} to ${s.end}`));
    return `Timeline: ${parts.join(', ')}.`;
  }

  /** Read geometry once (on resize or new model) and derive the unit width. */
  function measure(force = false) {
    if (!model) return;
    const w = scroller.clientWidth;
    const nw = parseFloat(getComputedStyle(scroller).getPropertyValue('--name-w')) || 96;
    if (!force && w === viewW && nw === nameW) return;
    viewW = w;
    nameW = nw;
    const avail = Math.max(0, w - nameW - LEAD - 24);
    const nextU = Math.max(MIN_U, Math.min(MAX_U, Math.floor(avail / Math.max(1, model.T))));
    const nextStep = STEPS.find((s) => s * nextU >= 28) || 100;
    const changed = force || nextU !== u || nextStep !== step;
    u = nextU;
    step = nextStep;
    if (!changed) return;
    lanes.style.setProperty('--u', `${u}px`);
    lanes.style.setProperty('--step', String(step));
    buildTicks();
    for (const s of model.segs) {
      const narrow = (s.end - s.start) * u - 2 < 26;
      for (const v of s.views) v.el.classList.toggle('narrow', narrow);
    }
    for (const el of graphic.querySelectorAll('.idle-seg')) {
      el.classList.toggle('narrow', Number(el.style.getPropertyValue('--len')) * u < 40);
    }
    if (motion) setMotion(motion, lastTime);
    else placeHead(lastTime);
  }

  function buildTicks() {
    const T = model.T;
    const labels = [];
    for (let t = 0; t <= T; t += step) labels.push(t);
    if (T % step !== 0 && (T - labels[labels.length - 1]) * u >= 24) labels.push(T);
    ticks.replaceChildren(...labels.map((t) => h('span', { vars: { '--t': t }, text: String(t) })));
  }

  function placeHead(time) {
    head.style.transform = `translateX(${(time * u).toFixed(2)}px)`;
  }

  function setP(i, p) {
    const s = model.segs[i];
    if (s.p === p) return;
    const was = s.p;
    s.p = p;
    const partial = p > 0 && p < 1;
    const onChanged = (was > 0) !== (p > 0);
    const fillT = partial ? `translateX(${((p - 1) * 100).toFixed(3)}%)` : '';
    const lblT = partial ? `translateX(${((1 - p) * 100).toFixed(3)}%)` : '';
    for (const v of s.views) {
      if (onChanged) v.el.classList.toggle('on', p > 0);
      v.fill.style.transform = fillT;
      v.lbl.style.transform = lblT;
    }
  }

  // ---------- compositor-driven motion while playing ----------
  // While playing, the playhead and the growing bar are Web Animations on transform,
  // run by the compositor. Their start times come from the player's anchor on the
  // document timeline, the same anchor the clock uses, so they cannot drift from it.
  // The rAF clock in controls.mjs only handles discrete changes (a new unit, the next bar).
  let motion = null; // { speed, anchor: { ts, time } } while playing
  let headAnim = null;
  let barAnims = [];
  let animSeg = -1;
  const msPerUnit = () => UNIT_MS / motion.speed;
  /** Document-timeline time at which the clock reaches time t. */
  const tsAt = (t) => motion.anchor.ts + (t - motion.anchor.time) * msPerUnit();

  function cancelBarAnims() {
    for (const a of barAnims) a.cancel();
    barAnims = [];
    animSeg = -1;
  }

  function startBarAnim(i) {
    cancelBarAnims();
    const s = model.segs[i];
    const opts = { duration: (s.end - s.start) * msPerUnit(), easing: 'linear', fill: 'forwards' };
    for (const v of s.views) {
      const a = v.fill.animate([{ transform: 'translateX(-100%)' }, { transform: 'translateX(0%)' }], opts);
      const b = v.lbl.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0%)' }], opts);
      a.startTime = b.startTime = tsAt(s.start);
      barAnims.push(a, b);
    }
    animSeg = i;
  }

  function startHeadAnim() {
    headAnim = head.animate(
      [{ transform: 'translateX(0px)' }, { transform: `translateX(${(model.T * u).toFixed(2)}px)` }],
      { duration: model.T * msPerUnit(), easing: 'linear', fill: 'forwards' },
    );
    headAnim.startTime = tsAt(0);
  }

  /** Switch between compositor motion (playing) and direct rendering (paused, scrubbing). */
  function setMotion(next, time) {
    if (model && active >= 0) {
      setLive(active, false);
      setP(active, 0);
    }
    active = -1;
    if (headAnim) headAnim.cancel();
    headAnim = null;
    cancelBarAnims();
    motion = next && next.anchor ? next : null;
    if (!model) return;
    if (motion) startHeadAnim();
    // Re-render statically; when playing, render() starts the bar animation.
    render(time, true);
  }

  function setLive(i, on) {
    if (i < 0) return;
    for (const v of model.segs[i].views) v.el.classList.toggle('live', on);
  }

  /** Per frame: move the playhead and the fill of the bars around it. No layout reads. */
  function render(time, force = false) {
    if (!model) return;
    lastTime = time;
    if (!motion || force) placeHead(time);
    const label = Math.floor(time + 1e-9);
    if (label !== shownLabel) {
      shownLabel = label;
      headLabel.textContent = String(label);
    }
    const segs = model.segs;
    // First segment that has not ended yet.
    let lo = 0;
    let hi = segs.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (segs[mid].end <= time) lo = mid + 1;
      else hi = mid;
    }
    const nextFull = lo;
    const nextActive = lo < segs.length && segs[lo].start < time ? lo : -1;
    const from = Math.min(full, nextFull);
    const to = Math.max(full, nextFull);
    for (let i = from; i < to; i++) setP(i, i < nextFull ? 1 : 0);
    if (active !== nextActive) {
      if (active >= 0 && active !== nextActive) {
        if (animSeg === active) cancelBarAnims();
        setLive(active, false);
        setP(active, active < nextFull ? 1 : 0);
      }
      setLive(nextActive, true);
    }
    if (nextActive >= 0) {
      const s = segs[nextActive];
      if (!motion) setP(nextActive, (time - s.start) / (s.end - s.start));
      else if (animSeg !== nextActive) {
        setP(nextActive, Math.max(1e-6, (time - s.start) / (s.end - s.start)));
        startBarAnim(nextActive);
      }
    }
    full = nextFull;
    active = nextActive;
  }

  /** Once per time unit: completion marks and keeping the playhead in view. */
  function unit(k, { follow }) {
    if (!model) return;
    for (const m of model.doneMarks) {
      const show = k >= m.at;
      if (show !== m.shown) {
        m.shown = show;
        m.el.classList.toggle('show', show);
      }
    }
    // Keep the playhead in view: smooth while playing, immediate after a jump.
    const x = k * u;
    const visible = viewW - nameW - LEAD;
    if (x > scrollLeft + visible * 0.85 || x < scrollLeft) {
      const left = Math.max(0, x - visible * (follow ? 0.25 : 0.5));
      scroller.scrollTo({ left, behavior: follow && !prefersReducedMotion() ? 'smooth' : 'auto' });
      scrollLeft = left;
    }
  }

  function setPlaying(on, { time, speed, anchor, reduced }) {
    head.classList.toggle('live', on);
    setMotion(on && !reduced ? { speed, anchor } : null, time);
  }

  function refresh(animate) {
    if (animate) graphic.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  // Scrubbing on the ruler.
  let scrub = null;
  const timeAt = (clientX) => {
    const t = (clientX - scrub.left) / u;
    return Math.max(0, Math.min(model.T, t));
  };
  ruler.addEventListener('pointerdown', (e) => {
    if (!model || e.button !== 0) return;
    e.preventDefault();
    ruler.focus({ preventScroll: true });
    scrub = { left: ruler.getBoundingClientRect().left + nameW + LEAD, id: e.pointerId };
    ruler.setPointerCapture(e.pointerId);
    onScrubStart();
    onScrub(timeAt(e.clientX));
  });
  ruler.addEventListener('pointermove', (e) => {
    if (scrub && e.pointerId === scrub.id) onScrub(timeAt(e.clientX));
  });
  const endScrub = (e) => {
    if (!scrub || e.pointerId !== scrub.id) return;
    const t = timeAt(e.clientX);
    scrub = null;
    onScrubEnd(t);
  };
  ruler.addEventListener('pointerup', endScrub);
  ruler.addEventListener('pointercancel', endScrub);

  // Tooltip for bars. Mouse: shows on hover, hides on leave. Touch: a tap shows it
  // and the next tap anywhere hides it (touch fires pointerout as soon as the finger lifts).
  let tipBar = null;
  let tipJustShown = false;
  function hideTip() {
    tip.hidden = true;
    tipBar = null;
  }
  graphic.addEventListener('pointerover', (e) => {
    const bar = e.target.closest('.bar-seg');
    if (!bar || !model) return;
    const s = model.segs[Number(bar.dataset.i)];
    const len = s.end - s.start;
    tip.replaceChildren(h('b', { text: s.pid }), ` ${s.start} to ${s.end}`, h('br'), `${len} ${len === 1 ? 'unit' : 'units'}`);
    tip.hidden = false;
    // Geometry measured on hover, relative to the lanes (which scroll with the content).
    const base = lanes.getBoundingClientRect();
    const r = bar.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const minX = scroller.scrollLeft + nameW + half + 4;
    const maxX = scroller.scrollLeft + scroller.clientWidth - half - 4;
    const x = Math.max(minX, Math.min(maxX, r.left - base.left + r.width / 2));
    tip.style.transform = `translate(${x.toFixed(1)}px, ${(r.top - base.top - 6).toFixed(1)}px) translate(-50%, -100%)`;
    tipBar = bar;
    tipJustShown = e.pointerType !== 'mouse';
  });
  graphic.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.bar-seg')) hideTip();
  });
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !tipBar) return;
    if (tipJustShown) tipJustShown = false;
    else hideTip();
  }, { passive: true });
  scroller.addEventListener('scroll', () => {
    scrollLeft = scroller.scrollLeft;
    if (tipBar) hideTip();
  }, { passive: true });

  new ResizeObserver(() => measure()).observe(scroller);

  return {
    setModel,
    render,
    unit,
    setPlaying,
    refresh,
    clear,
    get length() {
      return model ? model.T : 0;
    },
    get ruler() {
      return ruler;
    },
  };
}

