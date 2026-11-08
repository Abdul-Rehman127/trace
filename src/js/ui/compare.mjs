// The compare page: runs all five algorithms on the same processes and shows
// their averages and timelines side by side.
import { simulate, fractionText, fractionValue } from '../engine/scheduling.mjs';
import { encodeScenario, decodeScenario } from '../engine/share.mjs';
import { defaultScenario } from '../engine/presets.mjs';
import { createInputs } from './inputs.mjs';
import { h } from './dom.mjs';

const ALGS = [
  { alg: 'fcfs', name: 'FCFS', path: '/operating-systems/cpu-scheduling/fcfs/' },
  { alg: 'sjf', name: 'SJF', path: '/operating-systems/cpu-scheduling/sjf/' },
  { alg: 'srtf', name: 'SRTF', path: '/operating-systems/cpu-scheduling/srtf/' },
  { alg: 'priority', name: 'Priority', path: '/operating-systems/cpu-scheduling/priority/' },
  { alg: 'rr', name: 'Round Robin', path: '/operating-systems/cpu-scheduling/round-robin/' },
];
const METRICS = ['waiting', 'turnaround', 'response'];
const slotOf = (id) => Number(id.slice(1));
const STEPS = [1, 2, 5, 10, 20, 50, 100];

/** Share query for the compare page: processes with priorities, plus every option. */
function compareQuery(s) {
  const q = encodeScenario({ ...s, algorithm: 'priority' }).replace(/^alg=priority&?/, '');
  return `q=${s.options.quantum}&tie=${s.options.rrTie}&${q}`;
}

function cell(f, best) {
  const v = fractionValue(f).toFixed(2);
  const kids = [];
  if (f.d === 1) kids.push(v);
  else kids.push(h('span', { class: 'exact', tabindex: '0', title: `Exactly ${fractionText(f)}`, 'aria-label': `${v}, exactly ${fractionText(f)}`, text: v }));
  if (best) kids.push(h('span', { class: 'sr-only', text: ' (lowest)' }));
  return h('td', { class: best ? 'best' : null }, kids);
}

export function mountCompare(root) {
  const rowsEl = root.querySelector('[data-cmp-rows]');
  const strips = root.querySelector('[data-cmp-strips]');
  const note = root.querySelector('[data-cmp-note]');
  const toastEl = root.querySelector('[data-toast]');
  const copyBtn = root.querySelector('[data-copy]');
  const copyFallback = root.querySelector('[data-copy-fallback]');
  const copyField = root.querySelector('[data-copy-field]');

  const decoded = decodeScenario(window.location.search, defaultScenario('compare'));
  let current = null;

  let toastTimer = 0;
  const toast = (text, ms = 1800) => {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  };

  function render(s) {
    const results = ALGS.map((a) => ({ ...a, scenario: { algorithm: a.alg, processes: s.processes, options: s.options } }))
      .map((a) => ({ ...a, result: simulate(a.scenario) }));
    const best = Object.fromEntries(METRICS.map((m) => [m, Math.min(...results.map((r) => fractionValue(r.result.averages[m])))]));

    rowsEl.replaceChildren(
      ...results.map((r) =>
        h(
          'tr',
          {},
          h('th', { scope: 'row' }, h('a', { href: `${r.path}?${encodeScenario(r.scenario)}`, text: r.name })),
          ...METRICS.map((m) => cell(r.result.averages[m], fractionValue(r.result.averages[m]) === best[m])),
          h('td', { text: String(r.result.summary.makespan) }),
        ),
      ),
    );

    // All five are work-conserving, so they finish at the same time; one ruler serves all.
    const T = Math.max(...results.map((r) => r.result.summary.makespan));
    const step = STEPS.find((x) => (x / T) * 480 >= 28) || 100;
    const ticks = [];
    for (let t = 0; t <= T; t += step) ticks.push(h('span', { vars: { '--s': t }, text: String(t) }));
    const lanes = results.map((r) => {
      const bars = r.result.segments.map((seg) => {
        const len = seg.end - seg.start;
        if (!seg.pid) return h('div', { class: 'mi', vars: { '--s': seg.start, '--len': len } }, h('span', { text: 'idle' }));
        const n = slotOf(seg.pid);
        return h(
          'div',
          {
            class: len / T < 0.05 ? 'mb narrow' : 'mb',
            'data-label': seg.pid,
            vars: { '--s': seg.start, '--len': len, '--c': `var(--c${n})`, '--on': `var(--on-c${n})` },
          },
          h('div', { class: 'mf' }, h('span', { class: 'mfl', text: seg.pid })),
        );
      });
      return h('div', { class: 'mini-lane cpu' }, h('span', { class: 'mini-name', text: r.name }), h('div', { class: 'mini-track' }, bars));
    });
    const summary = results
      .map((r) => `${r.name}: ${r.result.segments.map((g) => (g.pid ? `${g.pid} ${g.start} to ${g.end}` : `idle ${g.start} to ${g.end}`)).join(', ')}`)
      .join('. ');
    strips.replaceChildren(
      h(
        'div',
        { class: 'mini', role: 'img', 'aria-label': `Timelines. ${summary}.`, vars: { '--T': T } },
        h('div', { class: 'mini-ruler', 'aria-hidden': 'true' }, h('span', { class: 'mini-name' }), h('div', { class: 'mini-ticks' }, ticks)),
        lanes,
      ),
    );
    note.textContent = `Round Robin uses a quantum of ${s.options.quantum}. Priority is ${s.options.preemptive ? 'preemptive' : 'non-preemptive'}, and ${
      s.options.lowerNumberIsHigherPriority ? 'a lower number means a higher priority' : 'a higher number means a higher priority'
    }. Ties follow the rules on each algorithm's page.`;
    current = { scenario: s, results };
  }

  let urlTimer = 0;
  const inputs = createInputs(root, {
    algorithm: 'compare',
    initial: decoded.scenario,
    onChange: (s) => {
      if (!s) return;
      render(s);
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => {
        try {
          window.history.replaceState(window.history.state, '', `${window.location.pathname}?${compareQuery(s)}`);
        } catch {
          /* ignore */
        }
      }, 400);
    },
  });

  copyBtn.addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}?${compareQuery(current.scenario)}`;
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

  render(inputs.scenario() || decoded.scenario);
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);
  return {
    get results() {
      return current.results.map((r) => ({ alg: r.alg, averages: r.result.averages, makespan: r.result.summary.makespan }));
    },
  };
}
