// Test oracle: a line-by-line JavaScript port of reference/ref_sched.py.
// Tick based (decides who runs for [t, t+1) at every integer t), deliberately unlike
// the event-driven engine, so the two can cross-check each other.
//
// One addition: the Python reference only knows "lower number is higher priority".
// For lowerNumberIsHigherPriority=false we negate the priority before the key,
// which is the whole meaning of that toggle.

/**
 * @param {Array<{id:string, a:number, b:number, p:number}>} procs  in slot order
 * @param {'fcfs'|'sjf'|'srtf'|'prio'|'rr'} algo
 */
export function run(procs, algo, { q = null, preemptive = false, rrNewFirst = true, lowerIsHigher = true } = {}) {
  const n = procs.length;
  const idx = new Map(procs.map((p, i) => [p.id, i]));
  const pr = (p) => (lowerIsHigher ? p.p : -p.p);
  const rem = new Map(procs.map((p) => [p.id, p.b]));
  const first = new Map();
  const done = new Map();
  let t = 0;
  const timeline = [];
  let current = null;
  const rrQueue = [];
  let rrSlice = 0;
  const seenArrival = new Set();

  const arrived = (t) => procs.filter((p) => p.a <= t && rem.get(p.id) > 0);
  const addArrivalsRr = (t) => {
    for (const p of procs) {
      if (p.a === t && !seenArrival.has(p.id)) {
        seenArrival.add(p.id);
        rrQueue.push(p.id);
      }
    }
  };
  const cmp = (x, y) => {
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  };
  const minBy = (list, key) => list.reduce((best, p) => (cmp(key(p), key(best)) < 0 ? p : best));

  let guard = 0;
  while (done.size < n) {
    guard += 1;
    if (guard >= 10000) throw new Error('oracle guard');
    let pick = null;
    if (algo === 'rr') {
      if (rrNewFirst) addArrivalsRr(t);
      if (current !== null && rrSlice === q && rem.get(current) > 0) {
        if (!rrNewFirst) {
          rrQueue.push(current);
          addArrivalsRr(t);
        } else {
          rrQueue.push(current);
        }
        current = null;
        rrSlice = 0;
      } else if (!rrNewFirst) {
        addArrivalsRr(t);
      }
      if (current === null && rrQueue.length) {
        current = rrQueue.shift();
        rrSlice = 0;
      }
      pick = current;
    } else {
      const av = arrived(t);
      if (!av.length) {
        pick = null;
      } else {
        const key = (p) => {
          const pid = p.id;
          if (algo === 'fcfs') return [p.a, idx.get(pid)];
          if (algo === 'sjf') return [p.b, p.a, idx.get(pid)];
          if (algo === 'srtf') return [rem.get(pid), pid === current ? 0 : 1, p.a, idx.get(pid)];
          return [pr(p), p.a, idx.get(pid)];
        };
        if (algo === 'fcfs' || algo === 'sjf' || (algo === 'prio' && !preemptive)) {
          if (current !== null && rem.get(current) > 0) pick = current;
          else pick = minBy(av, key).id;
        } else if (algo === 'srtf') {
          pick = minBy(av, key).id;
        } else {
          const k2 = (p) => [pr(p), p.id === current ? 0 : 1, p.a, idx.get(p.id)];
          pick = minBy(av, k2).id;
        }
      }
    }
    if (pick === null) {
      timeline.push(null);
      current = null;
      t += 1;
      continue;
    }
    if (!first.has(pick)) first.set(pick, t);
    timeline.push(pick);
    rem.set(pick, rem.get(pick) - 1);
    current = pick;
    if (algo === 'rr') rrSlice += 1;
    if (rem.get(pick) === 0) {
      done.set(pick, t + 1);
      current = null;
      if (algo === 'rr') rrSlice = 0;
    }
    t += 1;
  }

  const segments = [];
  timeline.forEach((pid, i) => {
    const last = segments[segments.length - 1];
    if (last && last.pid === pid && last.end === i) last.end = i + 1;
    else segments.push({ pid, start: i, end: i + 1 });
  });
  const rows = procs.map((p) => {
    const c = done.get(p.id);
    const tat = c - p.a;
    return { id: p.id, completion: c, turnaround: tat, waiting: tat - p.b, response: first.get(p.id) - p.a };
  });
  return { segments, rows };
}

/** Adapter from the engine's scenario shape to the oracle. */
export function oracle({ algorithm, processes, options = {} }) {
  const procs = processes
    .map((p) => ({ id: p.id, a: p.arrival, b: p.burst, p: p.priority ?? 1 }))
    .sort((x, y) => Number(x.id.slice(1)) - Number(y.id.slice(1)));
  const algo = algorithm === 'priority' ? 'prio' : algorithm;
  return run(procs, algo, {
    q: options.quantum ?? 2,
    preemptive: !!options.preemptive,
    rrNewFirst: (options.rrTie ?? 'new') === 'new',
    lowerIsHigher: options.lowerNumberIsHigherPriority ?? true,
  });
}
