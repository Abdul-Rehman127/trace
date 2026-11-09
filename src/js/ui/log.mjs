// The decision log: one line per decision moment, each a button that moves the
// playhead to that moment. Built only while the log is open, so long runs cost
// nothing until someone looks. Shared by every simulator: a section gives it the
// moments and a function that narrates one moment.
import { h, sentenceNodes } from './dom.mjs';
import { narrationContext, narrateMoment } from '../engine/narrate.mjs';

export function createLog(root, { onPick }) {
  const box = root.querySelector('[data-log]');
  const list = root.querySelector('[data-log-list]');
  let sentencesAt = null;
  let label = (t) => `Time ${t}`;
  let times = [];
  let items = new Map();
  let current = null;
  let built = false;

  function build() {
    items = new Map();
    const lines = times.map((t) => {
      const nodes = [];
      sentencesAt(t).forEach((s, j) => {
        if (j) nodes.push(' ');
        nodes.push(...sentenceNodes(s));
      });
      const btn = h('button', { type: 'button', class: 'log-line' }, h('span', { class: 'log-t', text: String(t) }), h('span', { class: 'log-text' }, nodes));
      btn.setAttribute('aria-label', `${label(t)}: ${btn.querySelector('.log-text').textContent}`);
      btn.addEventListener('click', () => onPick(t));
      const li = h('li', {}, btn);
      items.set(t, btn);
      return li;
    });
    list.replaceChildren(...lines);
    built = true;
    mark(current, true);
  }

  function mark(t, force = false) {
    if (!built) {
      current = t;
      return;
    }
    if (t === current && !force) return;
    const old = items.get(current);
    if (old) old.removeAttribute('aria-current');
    current = t;
    const now = items.get(t);
    if (now) now.setAttribute('aria-current', 'step');
  }

  box.addEventListener('toggle', () => {
    if (box.open && !built && sentencesAt) build();
  });

  return {
    /** Scheduling: one line per decision time. */
    setModel(scenario, result) {
      const ctx = narrationContext(scenario, result);
      this.setMoments([...ctx.byTime.keys()].sort((a, b) => a - b), (t) => narrateMoment(ctx, t));
    },
    /** Any section: the moments to list, how to narrate one, and how to name it for screen readers. */
    setMoments(moments, narrate, name) {
      times = moments;
      sentencesAt = narrate;
      if (name) label = name;
      built = false;
      list.replaceChildren();
      current = null;
      if (box.open) build();
    },
    /** Highlight the moment shown in the panel (the latest decision at or before k). */
    setMoment(t) {
      mark(t);
    },
  };
}
