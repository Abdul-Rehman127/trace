// CPU scheduling engine. Pure and deterministic: no DOM, no globals.
//
// Event driven: the clock jumps straight from one decision point to the next
// (an arrival, a completion, or the end of a Round Robin slice). Nothing is
// simulated unit by unit. Rules follow section 7.3 of the brief:
//
//   FCFS      earliest arrival, then lower process number. Never preempts.
//   SJF       smallest burst, then earlier arrival, then lower number. Never preempts.
//   SRTF      smallest remaining time. The running process keeps the CPU on a tie.
//   Priority  best priority (lower number by default), then earlier arrival, then
//             lower number. Optionally preemptive; the running process keeps the CPU on a tie.
//   RR        FIFO queue, slices of `quantum`. On a tie between a new arrival and a
//             process whose slice just ended, `rrTie` decides who joins the queue first.

import { validateScenario, slotOf } from './validate.mjs';

const PICK_REASON = {
  fcfs: 'first-come',
  sjf: 'shortest-burst',
  srtf: 'shortest-remaining',
  priority: 'best-priority',
  rr: 'next-in-queue',
};

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

/** Exact reduced fraction n/d with d > 0. */
export function fraction(n, d) {
  if (d === 0) return { n: 0, d: 1 };
  const g = gcd(n, d);
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}

/** "17/3", or "17" when the denominator is 1. */
export const fractionText = ({ n, d }) => (d === 1 ? String(n) : `${n}/${d}`);

/** Decimal value of a fraction. */
export const fractionValue = ({ n, d }) => n / d;

/**
 * Run a scheduling algorithm.
 * @param {{algorithm: string, processes: Array<{id:string, arrival:number, burst:number, priority?:number}>, options?: object}} scenario
 * @returns {{segments, slices, decisions, rows, averages, summary}}
 * @throws {RangeError} when the scenario is not valid (see validate.mjs)
 */
export function simulate(scenario) {
  const checked = validateScenario(scenario);
  if (!checked.ok) {
    const err = new RangeError(checked.errors.map((e) => e.message).join(' '));
    err.errors = checked.errors;
    throw err;
  }
  const { algorithm, options } = checked.value;
  const procs = checked.value.processes.map((p) => ({ ...p, slot: slotOf(p.id) }));
  const n = procs.length;
  const rr = algorithm === 'rr';
  const preemptive = algorithm === 'srtf' || (algorithm === 'priority' && options.preemptive);
  const q = options.quantum;

  const remaining = new Map(procs.map((p) => [p.id, p.burst]));
  const firstStart = new Map();
  const completion = new Map();

  // Primary selection value for the algorithm; smaller is better.
  const primary = (p) => {
    switch (algorithm) {
      case 'fcfs':
        return p.arrival;
      case 'sjf':
        return p.burst;
      case 'srtf':
        return remaining.get(p.id);
      case 'priority':
        return options.lowerNumberIsHigherPriority ? p.priority : -p.priority;
      default:
        return 0;
    }
  };
  // Full ordering among ready processes: primary, then earlier arrival, then lower number.
  const order = (a, b) => primary(a) - primary(b) || a.arrival - b.arrival || a.slot - b.slot;

  const upcoming = [...procs].sort((a, b) => a.arrival - b.arrival || a.slot - b.slot);
  let nextArrival = 0;

  let ready = []; // process objects; FIFO for RR, unordered otherwise
  let running = null;
  let sliceStart = 0;
  let t = 0;

  const slices = [];
  let open = null; // the slice currently being drawn: { pid, start }
  const decisions = [];

  const queueSnapshot = () => (rr ? ready : [...ready].sort(order)).map((p) => p.id);
  const remainingSnapshot = () => {
    const out = {};
    for (const p of procs) out[p.id] = remaining.get(p.id);
    return out;
  };
  const emit = (kind, pid, other, reason) => {
    decisions.push({ t, kind, pid, other, reason, queue: queueSnapshot(), remaining: remainingSnapshot() });
  };
  const closeSlice = () => {
    if (open && t > open.start) slices.push({ pid: open.pid, start: open.start, end: t });
    open = null;
  };
  const openSlice = (pid) => {
    closeSlice();
    open = { pid, start: t };
  };
  const run = (p) => {
    running = p;
    if (!firstStart.has(p.id)) firstStart.set(p.id, t);
    sliceStart = t;
    openSlice(p.id);
  };
  const takeBest = () => {
    let best = 0;
    for (let i = 1; i < ready.length; i++) if (order(ready[i], ready[best]) < 0) best = i;
    return ready.splice(best, 1)[0];
  };

  for (let guard = 0; guard < 10000; guard++) {
    // 1. The running process may have just finished.
    if (running && remaining.get(running.id) === 0) {
      completion.set(running.id, t);
      const done = running;
      running = null;
      closeSlice();
      emit('complete', done.id, null, 'finished');
    }
    if (completion.size === n) break;

    // 2. Arrivals at this moment.
    const arrivals = [];
    while (nextArrival < upcoming.length && upcoming[nextArrival].arrival <= t) {
      arrivals.push(upcoming[nextArrival++]);
    }

    if (rr) {
      const admit = () => {
        for (const p of arrivals) {
          ready.push(p);
          emit('arrive', p.id, running ? running.id : null, null);
        }
      };
      const expired = running && t - sliceStart === q;
      if (!expired) {
        admit();
      } else if (ready.length === 0 && arrivals.length === 0) {
        // Nobody else is waiting: a new slice starts, the bar continues.
        emit('quantum', running.id, null, 'continues-alone');
        sliceStart = t;
        openSlice(running.id);
      } else {
        const done = running;
        if (options.rrTie === 'new') {
          admit();
          ready.push(done);
          running = null;
          closeSlice();
          emit('quantum', done.id, null, 'quantum-expired');
        } else {
          ready.push(done);
          running = null;
          closeSlice();
          emit('quantum', done.id, null, 'quantum-expired');
          admit();
        }
      }
    } else {
      for (const p of arrivals) ready.push(p);

      // Work out whether an arrival takes the CPU before reporting the arrivals.
      let challenger = null;
      if (running && preemptive && ready.length) {
        let best = ready[0];
        for (const p of ready) if (order(p, best) < 0) best = p;
        if (primary(best) < primary(running)) challenger = best;
      }
      const holder = challenger || running;
      for (const p of arrivals) {
        if (!holder || p === challenger) {
          emit('arrive', p.id, null, null);
        } else if (preemptive) {
          const tie = primary(p) === primary(holder);
          const reason = tie ? 'kept-on-tie' : algorithm === 'srtf' ? 'shortest-remaining' : 'best-priority';
          emit('arrive', p.id, holder.id, reason);
        } else {
          emit('arrive', p.id, holder.id, null);
        }
      }
      if (challenger) {
        const old = running;
        ready.splice(ready.indexOf(challenger), 1);
        ready.push(old);
        run(challenger);
        emit('preempt', challenger.id, old.id, algorithm === 'srtf' ? 'preempted-by-shorter' : 'preempted-by-priority');
      }
    }

    // 3. A free CPU picks the next process, or goes idle until the next arrival.
    if (!running) {
      if (ready.length) {
        const p = rr ? ready.shift() : takeBest();
        run(p);
        emit('pick', p.id, null, PICK_REASON[algorithm]);
      } else {
        const next = upcoming[nextArrival];
        openSlice(null);
        emit('idle', null, next ? next.id : null, 'idle-until-arrival');
      }
    }

    // 4. Jump to the next decision point.
    let until = Infinity;
    if (nextArrival < upcoming.length) until = upcoming[nextArrival].arrival;
    if (running) {
      until = Math.min(until, t + remaining.get(running.id));
      if (rr) until = Math.min(until, sliceStart + q);
      remaining.set(running.id, remaining.get(running.id) - (until - t));
    }
    if (!Number.isFinite(until) || until <= t) throw new Error('Scheduler made no progress');
    t = until;
  }
  if (completion.size !== n) throw new Error('Scheduler did not finish');
  closeSlice();

  // Segments: merge contiguous slices of the same process (RR slice boundaries stay in `slices`).
  const segments = [];
  for (const s of slices) {
    const last = segments[segments.length - 1];
    if (last && last.pid === s.pid && last.end === s.start) last.end = s.end;
    else segments.push({ ...s });
  }

  const rows = procs.map((p) => {
    const c = completion.get(p.id);
    const turnaround = c - p.arrival;
    return {
      id: p.id,
      arrival: p.arrival,
      burst: p.burst,
      completion: c,
      turnaround,
      waiting: turnaround - p.burst,
      response: firstStart.get(p.id) - p.arrival,
    };
  });
  const avg = (key) => fraction(rows.reduce((s, r) => s + r[key], 0), n);
  const makespan = Math.max(...rows.map((r) => r.completion));
  const busy = procs.reduce((s, p) => s + p.burst, 0);

  return {
    segments,
    slices,
    decisions,
    rows,
    averages: { waiting: avg('waiting'), turnaround: avg('turnaround'), response: avg('response') },
    summary: { makespan, busy, utilization: fraction(busy, makespan), throughput: fraction(n, makespan) },
  };
}
