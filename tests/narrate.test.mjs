import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../src/js/engine/scheduling.mjs';
import { validateScenario } from '../src/js/engine/validate.mjs';
import { narrationContext, narrateMoment, narrateDecision, sentenceText } from '../src/js/engine/narrate.mjs';
import { prng, randomProcesses, randomQuantum, COMBOS } from './random.mjs';

const REASONS = [
  'first-come', 'shortest-burst', 'shortest-remaining', 'kept-on-tie', 'preempted-by-shorter', 'best-priority',
  'preempted-by-priority', 'next-in-queue', 'quantum-expired', 'continues-alone', 'finished', 'idle-until-arrival',
];

function setup(scenario) {
  const v = validateScenario(scenario).value;
  const result = simulate(v);
  return { result, ctx: narrationContext(v, result) };
}
const momentText = (scenario, t) => {
  const { ctx } = setup(scenario);
  return narrateMoment(ctx, t).map(sentenceText);
};
const P = (...rows) => rows.map(([arrival, burst, priority = 1], i) => ({ id: `P${i + 1}`, arrival, burst, priority }));

describe('narration matches the brief examples', () => {
  test('FCFS', () => {
    assert.deepEqual(momentText({ algorithm: 'fcfs', processes: P([0, 3], [1, 2], [2, 2]) }, 3), ['P1 finishes at time 3.', 'P2 has waited the longest, so it runs next.']);
  });
  test('SJF', () => {
    assert.deepEqual(momentText({ algorithm: 'sjf', processes: P([0, 6], [0, 8], [0, 7], [0, 3]) }, 0), [
      'P4 has the shortest burst (3) among P1 (6), P3 (7) and P2 (8), so it runs next.',
    ]);
  });
  test('SRTF keep and preempt', () => {
    const s = { algorithm: 'srtf', processes: P([0, 8], [1, 4], [2, 9], [3, 5]) };
    assert.deepEqual(momentText(s, 1), ['P2 arrives needing 4, less than the 7 P1 has left, so P2 takes over.']);
    assert.deepEqual(momentText(s, 2), ['P3 arrives with 9 left. P2 has 3 left, which is less, so P2 keeps the CPU.']);
  });
  test('SRTF tie', () => {
    assert.deepEqual(momentText({ algorithm: 'srtf', processes: P([0, 5], [1, 4]) }, 1), [
      'P1 and P2 both have 4 left. The running process keeps the CPU on a tie.',
    ]);
  });
  test('Priority', () => {
    assert.deepEqual(momentText({ algorithm: 'priority', processes: P([0, 10, 3], [0, 1, 1], [0, 2, 4]) }, 0), [
      'P2 has the best priority (1), so it runs next.',
    ]);
  });
  test('Round Robin', () => {
    const s = { algorithm: 'rr', processes: P([0, 5], [0, 3]), options: { quantum: 2 } };
    assert.deepEqual(momentText(s, 0), ['P1 is next in line, so it runs for up to 2 units.']);
    assert.deepEqual(momentText(s, 2), [
      'P1 used its 2-unit slice and goes to the back of the queue.',
      'P2 is next in line, so it runs for up to 2 units.',
    ]);
  });
});

describe('narration for every reason code', () => {
  test('quantum tie rule is explained in both directions', () => {
    const procs = P([0, 5], [2, 3], [4, 2]);
    assert.deepEqual(momentText({ algorithm: 'rr', processes: procs, options: { quantum: 2, rrTie: 'new' } }, 2), [
      'P1 used its 2-unit slice and goes to the back of the queue. P2 arrives at the same moment. New arrivals join first, so it is ahead of P1.',
      'P2 is next in line, so it runs for up to 2 units.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'rr', processes: procs, options: { quantum: 2, rrTie: 'preempted' } }, 2), [
      'P1 used its 2-unit slice and goes to the back of the queue. P2 arrives at the same moment. The preempted process joins first, so P1 is ahead of it.',
      'P1 is next in line, so it runs for up to 2 units.',
    ]);
  });

  test('continues alone, idle, finishing within a slice', () => {
    assert.deepEqual(momentText({ algorithm: 'rr', processes: P([0, 5]), options: { quantum: 2 } }, 2), [
      'P1 used its 2-unit slice, but no other process is waiting, so it keeps running.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'rr', processes: P([0, 1]), options: { quantum: 1 } }, 0), [
      'P1 is next in line and needs only 1 unit, so it can finish within its 1-unit slice.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'fcfs', processes: P([2, 3], [10, 2], [10, 1]) }, 5), [
      'P1 finishes at time 5.',
      'Nothing is ready, so the CPU is idle until P2 and P3 arrive at time 10.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'fcfs', processes: P([4, 1]) }, 0), ['Nothing is ready, so the CPU is idle until P1 arrives at time 4.']);
  });

  test('preempted by priority and kept on priority', () => {
    const s = { algorithm: 'priority', processes: P([0, 7, 3], [2, 4, 1], [3, 2, 2]), options: { preemptive: true } };
    assert.deepEqual(momentText(s, 2), ["P2 arrives with priority 1, better than P1's 3, so P2 takes over."]);
    assert.deepEqual(momentText(s, 3), ['P3 arrives with priority 2. P2 has a better priority (1), so P2 keeps the CPU.']);
    const tie = { algorithm: 'priority', processes: P([0, 7, 2], [2, 4, 2]), options: { preemptive: true } };
    assert.deepEqual(momentText(tie, 2), ['P1 and P2 both have priority 2. The running process keeps the CPU on a tie.']);
  });

  test('ties on the main rule name the tie-break', () => {
    assert.deepEqual(momentText({ algorithm: 'fcfs', processes: P([0, 2], [0, 2]) }, 0), [
      'P1 and P2 arrived at the same time. P1 has the lower process number, so it runs first.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'sjf', processes: P([0, 4], [1, 3], [2, 3]) }, 4), [
      'P1 finishes at time 4.',
      'P2 and P3 both have a burst of 3. P2 arrived earlier, so it runs next.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'priority', processes: P([0, 2, 1], [0, 2, 1]) }, 0), [
      'P1 and P2 share the best priority (1). P1 has the lower process number, so it runs next.',
    ]);
  });

  test('plain arrivals while the CPU is busy are grouped', () => {
    assert.deepEqual(momentText({ algorithm: 'fcfs', processes: P([0, 5], [2, 1], [2, 1]) }, 2), [
      'P2 and P3 arrive and wait, because P1 runs until it finishes.',
    ]);
    assert.deepEqual(momentText({ algorithm: 'rr', processes: P([0, 5], [1, 1]), options: { quantum: 3 } }, 1), [
      'P2 arrives and joins the back of the queue.',
    ]);
  });

  test('random schedules: every reason code is narrated in complete, clean sentences', () => {
    const seen = new Set();
    const rand = prng(4242);
    for (let i = 0; i < 4000; i++) {
      const combo = COMBOS[i % COMBOS.length];
      const options = { ...combo.options };
      if (combo.algorithm === 'rr') options.quantum = randomQuantum(rand);
      const { result, ctx } = setup({ algorithm: combo.algorithm, processes: randomProcesses(rand), options });
      for (const d of result.decisions) {
        if (d.reason) seen.add(d.reason);
        const s = narrateDecision(d, ctx);
        assert.ok(Array.isArray(s) && s.length, `${d.kind}/${d.reason}`);
        for (const part of s) assert.ok(typeof part === 'string' || (part && /^P[1-8]$/.test(part.pid)), 'parts are strings or pids');
        const text = sentenceText(s);
        assert.match(text, /^[A-Z].*\.$/, text);
        assert.doesNotMatch(text, /undefined|null|NaN|\u2014|  |\.\./, text);
        assert.doesNotMatch(text, /\b1 units\b|\b(?:[02-9]|\d\d+) unit\b/, text);
      }
      const times = [...ctx.byTime.keys()];
      for (const t of times) assert.ok(narrateMoment(ctx, t).length > 0, `moment ${t} has narration`);
    }
    assert.deepEqual([...seen].sort(), [...REASONS].sort());
  });
});
