// Worked examples for the written content. Computed with the real engine at build
// time, so the numbers on the page always match the simulator.
import { simulate, fractionText, fractionValue } from '../js/engine/scheduling.mjs';
import { validateScenario } from '../js/engine/validate.mjs';
import { presetsFor } from '../js/engine/presets.mjs';
import { encodeScenario } from '../js/engine/share.mjs';
import { miniHtml } from './mini.mjs';

const PATHS = {
  fcfs: '/operating-systems/cpu-scheduling/fcfs/',
  sjf: '/operating-systems/cpu-scheduling/sjf/',
  srtf: '/operating-systems/cpu-scheduling/srtf/',
  priority: '/operating-systems/cpu-scheduling/priority/',
  rr: '/operating-systems/cpu-scheduling/round-robin/',
};
const NAMES = { fcfs: 'FCFS', sjf: 'SJF', srtf: 'SRTF', priority: 'Priority', rr: 'Round Robin' };

const avg = (f) => (f.d === 1 ? `${f.n}` : `${fractionValue(f).toFixed(2)} (${fractionText(f)})`);

export function classicScenario(alg) {
  const p = presetsFor(alg).find((x) => x.key === 'classic');
  return validateScenario({ algorithm: alg, processes: p.processes, options: p.options }).value;
}

/** HTML for the "Worked example" section body of an algorithm page. */
export function workedExampleHtml(alg) {
  const s = classicScenario(alg);
  const r = simulate(s);
  const prio = alg === 'priority';
  const head = ['Process', 'Arrival', 'Burst', ...(prio ? ['Priority'] : []), 'Finished', 'Turnaround', 'Waiting', 'Response'];
  const rows = r.rows.map((row) => {
    const p = s.processes.find((x) => x.id === row.id);
    const cells = [row.arrival, row.burst, ...(prio ? [p.priority] : []), row.completion, row.turnaround, row.waiting, row.response];
    return `<tr><th scope="row">${row.id}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  });
  const blanks = prio ? 4 : 3;
  const avgRow = `<tr class="avg"><th scope="row">Average</th>${'<td></td>'.repeat(blanks)}<td>${avg(r.averages.turnaround)}</td><td>${avg(r.averages.waiting)}</td><td>${avg(r.averages.response)}</td></tr>`;
  const order = r.slices
    .filter((x) => x.pid)
    .map((x) => `${x.pid} ${x.start} to ${x.end}`)
    .join(', ');
  const options = alg === 'rr' ? ` with a time quantum of ${s.options.quantum}` : prio ? ' (non-preemptive, lower number means higher priority)' : '';
  return `<div class="example">
  <p class="example-lede">${NAMES[alg]}${options}. Order of execution: ${order}.</p>
  <div class="mini-scroll example-mini">${miniHtml(s, r, { label: `${NAMES[alg]} worked example` })}</div>
  <div class="table-scroll"><table class="data">
    <caption class="sr-only">${NAMES[alg]} worked example results</caption>
    <thead><tr>${head.map((h, i) => `<th scope="col"${i ? '' : ' class="l"'}>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.join('')}</tbody>
    <tfoot>${avgRow}</tfoot>
  </table></div>
  <p><a class="open-link" href="${PATHS[alg]}?${encodeScenario(s)}">Open this example in the simulator</a></p>
</div>`;
}

export { PATHS, NAMES };
