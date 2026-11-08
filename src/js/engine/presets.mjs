// Preset scenarios. Pure data, shared by the build (static markup and worked examples)
// and the browser. The "classic" sets are the golden test cases for each algorithm.

const P = (...rows) => rows.map(([arrival, burst, priority = 1], i) => ({ id: `P${i + 1}`, arrival, burst, priority }));

const CLASSIC = {
  fcfs: { processes: P([0, 24], [0, 3], [0, 3]), options: {} },
  sjf: { processes: P([0, 6], [0, 8], [0, 7], [0, 3]), options: {} },
  srtf: { processes: P([0, 8], [1, 4], [2, 9], [3, 5]), options: {} },
  priority: { processes: P([0, 10, 3], [0, 1, 1], [0, 2, 4], [0, 1, 5], [0, 5, 2]), options: { preemptive: false } },
  rr: { processes: P([0, 24], [0, 3], [0, 3]), options: { quantum: 4, rrTie: 'new' } },
};

const IDLE_GAP = P([0, 3, 2], [1, 2, 1], [9, 4, 3], [10, 2, 1]);
const HEAVY = P([0, 7, 3], [1, 4, 1], [2, 9, 4], [3, 2, 2], [5, 6, 5], [6, 3, 1], [8, 5, 3], [9, 1, 2]);
const TIE_TRAP = P([0, 5], [2, 3], [4, 2]);

/** Preset list for an algorithm: [{ key, label, processes, options }]. */
export function presetsFor(algorithm) {
  const base = CLASSIC[algorithm];
  const list = [
    { key: 'classic', label: 'Classic example', processes: base.processes, options: base.options },
    { key: 'idle', label: 'Idle gap', processes: IDLE_GAP, options: {} },
    { key: 'heavy', label: 'Heavy load', processes: HEAVY, options: {} },
  ];
  if (algorithm === 'rr') list.push({ key: 'tie', label: 'Tie trap', processes: TIE_TRAP, options: { quantum: 2 } });
  return list.map((p) => ({ ...p, processes: p.processes.map((x) => ({ ...x })) }));
}

/** The scenario a page shows before anyone changes anything. */
export function defaultScenario(algorithm) {
  const c = CLASSIC[algorithm];
  return {
    algorithm,
    processes: c.processes.map((x) => ({ ...x })),
    options: { quantum: 2, rrTie: 'new', preemptive: false, lowerNumberIsHigherPriority: true, ...c.options },
  };
}
