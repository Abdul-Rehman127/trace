// "Why this happened" narration and the ready queue, updated once per time unit.
import { h, sentenceNodes, prefersReducedMotion } from './dom.mjs';
import { narrationContext, narrateMoment, sentenceText, longestMoments } from '../engine/narrate.mjs';

const slotOf = (id) => Number(id.slice(1));

export function createPanel(stage) {
  const why = stage.querySelector('[data-why-text]');
  const sizers = stage.querySelector('[data-why-sizers]');
  const whyTime = stage.querySelector('[data-why-time]');
  const queueEl = stage.querySelector('[data-queue]');
  let ctx = null;
  let times = [];
  let decisions = [];
  let chips = new Map();
  let shownMoment = null;
  let lastText = '';

  function setModel(scenario, result) {
    ctx = narrationContext(scenario, result);
    decisions = result.decisions;
    times = [...ctx.byTime.keys()].sort((a, b) => a - b);
    shownMoment = null;
    // Invisible copies of the longest narrations set the panel height for this scenario.
    sizers.replaceChildren(...longestMoments(ctx).map((s) => h('p', {}, joinNodes(s))));
    queueEl.replaceChildren();
    chips = new Map();
  }

  function joinNodes(sentences) {
    const nodes = [];
    sentences.forEach((s, j) => {
      if (j) nodes.push(' ');
      nodes.push(...sentenceNodes(s));
    });
    return nodes;
  }

  /** Largest value in a sorted list that is <= k, or -1. */
  function floorIndex(list, k, key = (x) => x) {
    let lo = 0;
    let hi = list.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (key(list[mid]) <= k) {
        ans = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  }

  function chip(id) {
    return h('li', { class: 'qchip', vars: { '--c': `var(--c${slotOf(id)})`, '--on': `var(--on-c${slotOf(id)})` }, text: id });
  }

  function renderQueue(ids, playing, speed) {
    // Chips rise in at normal speed and when stepping; above 1x they simply appear.
    const reduced = prefersReducedMotion() || (playing && speed > 1);
    // FLIP needs layout reads, so it runs for steps and scrubs, not continuous play.
    const flip = !prefersReducedMotion() && !playing;
    if (!ids.length) {
      chips = new Map();
      queueEl.replaceChildren(h('li', { class: 'qchip empty', text: 'Empty' }));
      return;
    }
    // FLIP: remember where kept chips were, reorder, then animate them from there.
    const before = new Map();
    if (flip) for (const [id, el] of chips) if (ids.includes(id)) before.set(id, el.getBoundingClientRect());
    const next = new Map();
    const els = ids.map((id) => {
      let el = chips.get(id);
      if (!el) {
        el = chip(id);
        if (!reduced) el.classList.add('in');
      } else el.classList.remove('in');
      next.set(id, el);
      return el;
    });
    queueEl.replaceChildren(...els);
    chips = next;
    if (!flip) return;
    for (const [id, rect] of before) {
      const el = next.get(id);
      const now = el.getBoundingClientRect();
      const dx = rect.left - now.left;
      const dy = rect.top - now.top;
      if (dx || dy) {
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: 240,
          easing: 'cubic-bezier(.2,.8,.2,1)',
        });
      }
    }
  }

  /** Update for whole time unit k. Returns the narration text (for the live region). */
  function update(k, playing = false, speed = 1) {
    if (!ctx) return '';
    const i = floorIndex(times, k);
    const moment = i >= 0 ? times[i] : null;
    if (moment !== shownMoment) {
      shownMoment = moment;
      const sentences = moment === null ? [] : narrateMoment(ctx, moment);
      why.replaceChildren(...joinNodes(sentences));
      lastText = sentences.map(sentenceText).join(' ');
      const d = floorIndex(decisions, k, (x) => x.t);
      renderQueue(d >= 0 ? decisions[d].queue : [], playing, speed);
    }
    const label = moment === null ? '' : moment === k ? `at time ${moment}` : `since time ${moment}`;
    if (whyTime.textContent !== label) whyTime.textContent = label;
    return lastText;
  }

  return {
    setModel,
    update,
    /** The decision moment currently shown (latest at or before the playhead), or null. */
    get moment() {
      return shownMoment;
    },
  };
}
