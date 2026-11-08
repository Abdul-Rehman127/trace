// Engine tests: golden cases, differential test against the tick-based oracle,
// and properties that must hold for every schedule.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { simulate, fraction, fractionText } from '../src/js/engine/scheduling.mjs';
import { oracle } from './oracle.mjs';
import { prng, randomProcesses, randomQuantum, COMBOS, comboName } from './random.mjs';

const golden = JSON.parse(readFileSync(new URL('./golden-scheduling.json', import.meta.url), 'utf8'));
const CASES_PER_COMBO = 2500;

const optionsFrom = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));

describe('golden cases', () => {
  for (const c of golden.cases) {
    test(c.name, () => {
      const r = simulate({ algorithm: c.algorithm, processes: c.processes, options: optionsFrom(c.options) });
      assert.deepEqual(r.segments, c.expected.segments, 'segments');
      assert.deepEqual(
        r.rows.map(({ id, completion, turnaround, waiting, response }) => ({ id, completion, turnaround, waiting, response })),
        c.expected.rows,
        'rows',
      );
      for (const k of ['waiting', 'turnaround', 'response']) {
        assert.equal(fractionText(r.averages[k]), c.expected.averages[k], `average ${k}`);
      }
    });
  }

  test('classic average waiting times', () => {
    const avg = (name) => {
      const c = golden.cases.find((x) => x.name === name);
      const r = simulate({ algorithm: c.algorithm, processes: c.processes, options: optionsFrom(c.options) });
      return r.averages.waiting.n / r.averages.waiting.d;
    };
    assert.equal(avg('fcfs_classic'), 17);
    assert.equal(avg('sjf_classic'), 7);
    assert.equal(avg('srtf_classic'), 6.5);
    assert.equal(avg('rr_classic_q4').toFixed(2), '5.67');
    assert.equal(avg('priority_classic_nonpreemptive'), 8.2);
  });
});

// Build every random scenario once; the differential and property suites share them.
const scenarios = [];
COMBOS.forEach((combo, ci) => {
  const rand = prng(0x7ace + ci * 7919);
  for (let i = 0; i < CASES_PER_COMBO; i++) {
    const options = { ...combo.options };
    if (combo.algorithm === 'rr') options.quantum = randomQuantum(rand);
    scenarios.push({ combo: comboName(combo), scenario: { algorithm: combo.algorithm, processes: randomProcesses(rand), options } });
  }
});
const results = scenarios.map(({ scenario }) => simulate(scenario));

describe(`differential: engine equals oracle (${CASES_PER_COMBO} cases per combination)`, () => {
  for (const combo of COMBOS) {
    const name = comboName(combo);
    test(name, () => {
      let count = 0;
      scenarios.forEach((s, i) => {
        if (s.combo !== name) return;
        count++;
        const expected = oracle(s.scenario);
        const got = results[i];
        const ctx = JSON.stringify(s.scenario);
        assert.deepEqual(got.segments, expected.segments, `segments for ${ctx}`);
        assert.deepEqual(
          got.rows.map(({ id, completion, turnaround, waiting, response }) => ({ id, completion, turnaround, waiting, response })),
          expected.rows,
          `rows for ${ctx}`,
        );
      });
      assert.equal(count, CASES_PER_COMBO);
    });
  }
});

describe('properties on every random schedule', () => {
  const each = (fn) => () =>
    scenarios.forEach((s, i) => {
      try {
        fn(s.scenario, results[i]);
      } catch (err) {
        err.message += `\n  scenario: ${JSON.stringify(s.scenario)}`;
        throw err;
      }
    });
  const procMap = (sc) => new Map(sc.processes.map((p) => [p.id, p]));

  test('total busy time equals the sum of bursts', each((sc, r) => {
    const busy = r.segments.filter((g) => g.pid).reduce((s, g) => s + g.end - g.start, 0);
    assert.equal(busy, sc.processes.reduce((s, p) => s + p.burst, 0));
    assert.equal(r.summary.busy, busy);
  }));

  test('each process runs for exactly its burst', each((sc, r) => {
    for (const p of sc.processes) {
      const ran = r.segments.filter((g) => g.pid === p.id).reduce((s, g) => s + g.end - g.start, 0);
      assert.equal(ran, p.burst, p.id);
    }
  }));

  test('nothing runs before its arrival', each((sc, r) => {
    const m = procMap(sc);
    for (const g of r.segments) if (g.pid) assert.ok(g.start >= m.get(g.pid).arrival, `${g.pid} at ${g.start}`);
  }));

  test('segments are sorted, contiguous from 0, non-overlapping and merged', each((sc, r) => {
    let t = 0;
    let prev = undefined;
    for (const g of r.segments) {
      assert.equal(g.start, t);
      assert.ok(g.end > g.start);
      assert.notEqual(g.pid, prev, 'adjacent segments must have different pids');
      t = g.end;
      prev = g.pid;
    }
    assert.equal(t, r.summary.makespan);
  }));

  test('no idle time while a process is ready', each((sc, r) => {
    for (const g of r.segments) {
      if (g.pid !== null) continue;
      for (const p of sc.processes) {
        const doneBy = r.rows.find((x) => x.id === p.id).completion;
        const readyDuringIdle = p.arrival < g.end && p.arrival <= g.start && doneBy > g.start;
        assert.ok(!readyDuringIdle, `${p.id} ready during idle ${g.start}-${g.end}`);
        // A process that arrives inside an idle gap must end that gap.
        assert.ok(!(p.arrival > g.start && p.arrival < g.end), `${p.id} arrives inside idle ${g.start}-${g.end}`);
      }
    }
  }));

  test('every process completes, and figures follow the definitions', each((sc, r) => {
    const m = procMap(sc);
    assert.equal(r.rows.length, sc.processes.length);
    for (const row of r.rows) {
      const p = m.get(row.id);
      const last = r.segments.filter((g) => g.pid === row.id).at(-1);
      const first = r.segments.find((g) => g.pid === row.id);
      assert.equal(row.completion, last.end);
      assert.equal(row.turnaround, row.completion - p.arrival);
      assert.equal(row.waiting, row.turnaround - p.burst);
      assert.equal(row.response, first.start - p.arrival);
    }
  }));

  test('waiting and response are never negative, and response <= waiting', each((sc, r) => {
    for (const row of r.rows) {
      assert.ok(row.waiting >= 0);
      assert.ok(row.response >= 0);
      assert.ok(row.response <= row.waiting);
    }
  }));

  test('non-preemptive algorithms never split a process', each((sc, r) => {
    const nonPre = ['fcfs', 'sjf'].includes(sc.algorithm) || (sc.algorithm === 'priority' && !sc.options.preemptive);
    if (!nonPre) return;
    for (const p of sc.processes) assert.equal(r.segments.filter((g) => g.pid === p.id).length, 1, p.id);
  }));

  test('averages and summary are exact reduced fractions', each((sc, r) => {
    const n = sc.processes.length;
    for (const k of ['waiting', 'turnaround', 'response']) {
      const sum = r.rows.reduce((s, x) => s + x[k], 0);
      assert.deepEqual(r.averages[k], fraction(sum, n));
    }
    assert.deepEqual(r.summary.utilization, fraction(r.summary.busy, r.summary.makespan));
    assert.deepEqual(r.summary.throughput, fraction(n, r.summary.makespan));
  }));

  test('slices cover the segments exactly; RR slices never exceed the quantum', each((sc, r) => {
    const merged = [];
    for (const s of r.slices) {
      const last = merged.at(-1);
      if (last && last.pid === s.pid && last.end === s.start) last.end = s.end;
      else merged.push({ ...s });
    }
    assert.deepEqual(merged, r.segments);
    if (sc.algorithm === 'rr') for (const s of r.slices) if (s.pid) assert.ok(s.end - s.start <= sc.options.quantum);
  }));

  test('decisions are in time order and the queue never holds the running process', each((sc, r) => {
    let t = 0;
    for (const d of r.decisions) {
      assert.ok(d.t >= t);
      t = d.t;
      if (d.kind === 'pick' || d.kind === 'preempt') assert.ok(!d.queue.includes(d.pid));
      assert.equal(new Set(d.queue).size, d.queue.length);
    }
    const completes = r.decisions.filter((d) => d.kind === 'complete');
    assert.equal(completes.length, sc.processes.length);
  }));
});

describe('engine details', () => {
  test('idle at the start is a null segment and counts toward the makespan', () => {
    const r = simulate({ algorithm: 'fcfs', processes: [{ id: 'P1', arrival: 3, burst: 2 }] });
    assert.deepEqual(r.segments, [{ pid: null, start: 0, end: 3 }, { pid: 'P1', start: 3, end: 5 }]);
    assert.deepEqual(r.summary.utilization, { n: 2, d: 5 });
    assert.equal(r.decisions[0].kind, 'idle');
    assert.equal(r.decisions[0].reason, 'idle-until-arrival');
    assert.equal(r.decisions[0].other, 'P1');
  });

  test('RR: a lone process keeps running across slice boundaries in one segment', () => {
    const r = simulate({ algorithm: 'rr', processes: [{ id: 'P1', arrival: 0, burst: 5 }], options: { quantum: 2 } });
    assert.deepEqual(r.segments, [{ pid: 'P1', start: 0, end: 5 }]);
    assert.deepEqual(r.slices.map((s) => [s.start, s.end]), [[0, 2], [2, 4], [4, 5]]);
    assert.deepEqual(r.decisions.filter((d) => d.kind === 'quantum').map((d) => [d.t, d.reason]), [[2, 'continues-alone'], [4, 'continues-alone']]);
  });

  test('RR: finishing exactly at the end of a slice is completion, not requeue', () => {
    const r = simulate({ algorithm: 'rr', processes: [{ id: 'P1', arrival: 0, burst: 2 }, { id: 'P2', arrival: 0, burst: 2 }], options: { quantum: 2 } });
    assert.equal(r.decisions.filter((d) => d.kind === 'quantum').length, 0);
    assert.deepEqual(r.segments.map((s) => s.pid), ['P1', 'P2']);
  });

  test('RR: tie rule decides queue order when an arrival meets a slice end', () => {
    const procs = [{ id: 'P1', arrival: 0, burst: 4 }, { id: 'P2', arrival: 0, burst: 4 }, { id: 'P3', arrival: 2, burst: 1 }];
    const order = (tie) => simulate({ algorithm: 'rr', processes: procs, options: { quantum: 2, rrTie: tie } })
      .decisions.find((d) => d.t === 2 && d.kind === 'pick').queue;
    assert.deepEqual(order('new'), ['P3', 'P1']);
    assert.deepEqual(order('preempted'), ['P1', 'P3']);
  });

  test('SRTF reason codes: preempt, keep on less, keep on tie', () => {
    const r = simulate({ algorithm: 'srtf', processes: [
      { id: 'P1', arrival: 0, burst: 8 }, { id: 'P2', arrival: 1, burst: 4 }, { id: 'P3', arrival: 2, burst: 9 }, { id: 'P4', arrival: 3, burst: 2 },
    ] });
    const at = (t) => r.decisions.filter((d) => d.t === t).map((d) => [d.kind, d.pid, d.other, d.reason]);
    assert.deepEqual(at(1), [['arrive', 'P2', null, null], ['preempt', 'P2', 'P1', 'preempted-by-shorter']]);
    assert.deepEqual(at(2), [['arrive', 'P3', 'P2', 'shortest-remaining']]);
    // P2 has 2 left at t=3 and P4 arrives needing 2: tie, P2 keeps the CPU.
    assert.deepEqual(at(3), [['arrive', 'P4', 'P2', 'kept-on-tie']]);
  });

  test('priority direction toggle flips the order', () => {
    const procs = [{ id: 'P1', arrival: 0, burst: 2, priority: 1 }, { id: 'P2', arrival: 0, burst: 2, priority: 5 }];
    const first = (low) => simulate({ algorithm: 'priority', processes: procs, options: { lowerNumberIsHigherPriority: low } }).segments[0].pid;
    assert.equal(first(true), 'P1');
    assert.equal(first(false), 'P2');
  });

  test('queue snapshots are ordered by the selection key', () => {
    const r = simulate({ algorithm: 'sjf', processes: [
      { id: 'P1', arrival: 0, burst: 6 }, { id: 'P2', arrival: 0, burst: 8 }, { id: 'P3', arrival: 0, burst: 7 }, { id: 'P4', arrival: 0, burst: 3 },
    ] });
    const pickAt0 = r.decisions.find((d) => d.kind === 'pick');
    assert.equal(pickAt0.pid, 'P4');
    assert.deepEqual(pickAt0.queue, ['P1', 'P3', 'P2']);
    assert.equal(pickAt0.reason, 'shortest-burst');
  });

  test('rejects invalid input with the validator messages', () => {
    assert.throws(
      () => simulate({ algorithm: 'fcfs', processes: [{ id: 'P2', arrival: 0, burst: 0 }] }),
      { name: 'RangeError', message: 'Burst for P2 must be a whole number from 1 to 99.' },
    );
  });

  test('the largest input simulates well under 5 ms', () => {
    const processes = Array.from({ length: 8 }, (_, i) => ({ id: `P${i + 1}`, arrival: i, burst: 99, priority: 8 - i }));
    const all = [
      { algorithm: 'rr', processes, options: { quantum: 1 } },
      { algorithm: 'srtf', processes },
      { algorithm: 'priority', processes, options: { preemptive: true } },
    ];
    for (const s of all) simulate(s); // warm up
    const runs = 50;
    for (const s of all) {
      const start = performance.now();
      for (let i = 0; i < runs; i++) simulate(s);
      const each = (performance.now() - start) / runs;
      assert.ok(each < 5, `${s.algorithm} took ${each.toFixed(2)} ms`);
    }
  });
});
