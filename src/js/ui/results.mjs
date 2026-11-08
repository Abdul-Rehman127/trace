// Results table, averages with exact fractions, and the utilization line.
import { h } from './dom.mjs';
import { fractionText, fractionValue } from '../engine/scheduling.mjs';

const slotOf = (id) => Number(id.slice(1));

function exact(f) {
  const v = fractionValue(f).toFixed(2);
  if (f.d === 1) return document.createTextNode(v);
  const frac = fractionText(f);
  return h('span', { class: 'exact', tabindex: '0', title: `Exactly ${frac}`, 'aria-label': `${v}, exactly ${frac}`, text: v });
}

export function createResults(root) {
  const body = root.querySelector('[data-result-rows]');
  const wrap = root.querySelector('[data-rtable]');
  const summary = root.querySelector('[data-summary]');
  const avgCells = Object.fromEntries([...root.querySelectorAll('[data-avg]')].map((el) => [el.dataset.avg, el]));
  let rowsById = new Map();

  function render(result) {
    rowsById = new Map();
    const trs = result.rows.map((r) => {
      const tr = h(
        'tr',
        {},
        h('td', {}, h('span', { class: 'pname' }, h('i', { class: 'swatch', vars: { '--c': `var(--c${slotOf(r.id)})` } }), r.id)),
        h('td', { text: String(r.arrival) }),
        h('td', { text: String(r.burst) }),
        h('td', { text: String(r.completion) }),
        h('td', { text: String(r.turnaround) }),
        h('td', { text: String(r.waiting) }),
        h('td', { text: String(r.response) }),
      );
      rowsById.set(r.id, tr);
      return tr;
    });
    body.replaceChildren(...trs);
    wrap.dataset.rows = String(result.rows.length);
    for (const k of ['turnaround', 'waiting', 'response']) avgCells[k].replaceChildren(exact(result.averages[k]));

    const { busy, makespan, utilization, throughput } = result.summary;
    const pct = (fractionValue(utilization) * 100).toFixed(1).replace(/\.0$/, '');
    summary.replaceChildren(
      'CPU utilization ',
      h('b', { text: `${pct}%` }),
      ` (busy ${busy} of ${makespan} units). Throughput `,
      h('b', { text: fractionValue(throughput).toFixed(2) }),
      ` processes per time unit (${result.rows.length} in ${makespan}).`,
    );
  }

  function flash(id) {
    const tr = rowsById.get(id);
    if (!tr) return;
    tr.classList.remove('flash');
    // Restart the CSS animation without a forced layout: next frame re-adds the class.
    requestAnimationFrame(() => tr.classList.add('flash'));
  }

  return { render, flash };
}
