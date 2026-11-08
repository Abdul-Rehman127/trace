import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateScenario, checkField, parseWhole, slotOf, fieldMessage } from '../src/js/engine/validate.mjs';

const ok = (s) => validateScenario(s).ok;
const messages = (s) => validateScenario(s).errors.map((e) => e.message);
const one = (overrides = {}, algorithm = 'fcfs', options = {}) => ({
  algorithm,
  processes: [{ id: 'P1', arrival: 0, burst: 3, priority: 1, ...overrides }],
  options,
});

describe('parseWhole', () => {
  test('accepts plain whole numbers, as numbers or typed text', () => {
    assert.equal(parseWhole(0), 0);
    assert.equal(parseWhole(42), 42);
    assert.equal(parseWhole('7'), 7);
    assert.equal(parseWhole(' 12 '), 12);
    assert.equal(parseWhole('007'), 7);
  });
  test('rejects everything else', () => {
    for (const v of ['', ' ', '1.5', '1.0', '-1', '+1', '1e2', '0x10', 'abc', '1 2', '٣', null, undefined, NaN, Infinity, 1.5, true, [], {}, '9999999']) {
      assert.ok(Number.isNaN(parseWhole(v)), `should reject ${JSON.stringify(v)}`);
    }
  });
});

describe('field limits and messages', () => {
  const cases = [
    ['arrival', 0, 99, 'Arrival for P2 must be a whole number from 0 to 99.'],
    ['burst', 1, 99, 'Burst for P2 must be a whole number from 1 to 99.'],
    ['priority', 1, 99, 'Priority for P2 must be a whole number from 1 to 99.'],
    ['quantum', 1, 99, 'Quantum must be a whole number from 1 to 99.'],
  ];
  for (const [field, lo, hi, message] of cases) {
    test(`${field}: ${lo} and ${hi} pass, ${lo - 1} and ${hi + 1} fail with the exact message`, () => {
      assert.equal(fieldMessage(field, 'P2'), message);
      assert.deepEqual(checkField(field, lo, 'P2'), { value: lo, error: null });
      assert.deepEqual(checkField(field, hi, 'P2'), { value: hi, error: null });
      assert.deepEqual(checkField(field, String(hi), 'P2'), { value: hi, error: null });
      assert.equal(checkField(field, lo - 1, 'P2').error, message);
      assert.equal(checkField(field, hi + 1, 'P2').error, message);
      assert.equal(checkField(field, '', 'P2').error, message);
      assert.equal(checkField(field, '2.5', 'P2').error, message);
    });
  }
});

describe('validateScenario', () => {
  test('a valid scenario is normalized: numbers parsed, slots ordered, defaults filled', () => {
    const r = validateScenario({
      algorithm: 'rr',
      processes: [{ id: 'P3', arrival: '2', burst: '4' }, { id: 'P1', arrival: 0, burst: 5 }],
      options: { quantum: '3' },
    });
    assert.ok(r.ok);
    assert.deepEqual(r.value.processes.map((p) => p.id), ['P1', 'P3']);
    assert.equal(r.value.processes[1].arrival, 2);
    assert.deepEqual(r.value.options, { quantum: 3, rrTie: 'new', preemptive: false, lowerNumberIsHigherPriority: true });
  });

  test('process count: 1 to 8', () => {
    assert.deepEqual(messages({ algorithm: 'fcfs', processes: [] }), ['Add at least one process.']);
    const eight = Array.from({ length: 8 }, (_, i) => ({ id: `P${i + 1}`, arrival: 0, burst: 1 }));
    assert.ok(ok({ algorithm: 'fcfs', processes: eight }));
    const nine = [...eight, { id: 'P8', arrival: 0, burst: 1 }];
    assert.ok(messages({ algorithm: 'fcfs', processes: nine }).includes('Trace supports up to 8 processes.'));
  });

  test('ids must be P1..P8 and unique', () => {
    for (const id of ['P0', 'P9', 'p1', 'P01', 'X', '', undefined, 3]) {
      assert.deepEqual(messages(one({ id })), ['Each process needs a name from P1 to P8.'], `id ${id}`);
    }
    assert.deepEqual(
      messages({ algorithm: 'fcfs', processes: [{ id: 'P2', arrival: 0, burst: 1 }, { id: 'P2', arrival: 1, burst: 1 }] }),
      ['P2 is listed twice.'],
    );
  });

  test('arrival and burst boundaries', () => {
    assert.ok(ok(one({ arrival: 0 })));
    assert.ok(ok(one({ arrival: 99 })));
    assert.deepEqual(messages(one({ arrival: 100 })), ['Arrival for P1 must be a whole number from 0 to 99.']);
    assert.deepEqual(messages(one({ arrival: -1 })), ['Arrival for P1 must be a whole number from 0 to 99.']);
    assert.ok(ok(one({ burst: 1 })));
    assert.ok(ok(one({ burst: 99 })));
    assert.deepEqual(messages(one({ burst: 0 })), ['Burst for P1 must be a whole number from 1 to 99.']);
    assert.deepEqual(messages(one({ burst: 100 })), ['Burst for P1 must be a whole number from 1 to 99.']);
  });

  test('priority is checked only for the Priority algorithm', () => {
    assert.ok(ok(one({ priority: 0 }, 'fcfs')));
    assert.ok(ok(one({ priority: undefined }, 'sjf')));
    assert.deepEqual(messages(one({ priority: 0 }, 'priority')), ['Priority for P1 must be a whole number from 1 to 99.']);
    assert.deepEqual(messages(one({ priority: 100 }, 'priority')), ['Priority for P1 must be a whole number from 1 to 99.']);
    assert.ok(ok(one({ priority: 1 }, 'priority')));
    assert.ok(ok(one({ priority: 99 }, 'priority')));
  });

  test('quantum is checked only for Round Robin', () => {
    assert.ok(ok(one({}, 'fcfs', { quantum: 0 })));
    assert.ok(ok(one({}, 'rr', { quantum: 1 })));
    assert.ok(ok(one({}, 'rr', { quantum: 99 })));
    assert.deepEqual(messages(one({}, 'rr', { quantum: 0 })), ['Quantum must be a whole number from 1 to 99.']);
    assert.deepEqual(messages(one({}, 'rr', { quantum: 100 })), ['Quantum must be a whole number from 1 to 99.']);
  });

  test('options and algorithm', () => {
    assert.deepEqual(messages(one({}, 'lottery')), ['Choose an algorithm: FCFS, SJF, SRTF, Priority or Round Robin.']);
    assert.deepEqual(messages(one({}, 'rr', { rrTie: 'oldest' })), ['Choose who goes first on a tie: the new arrival or the preempted process.']);
    assert.deepEqual(messages(one({}, 'priority', { preemptive: 'yes' })), ['The preemptive setting must be on or off.']);
    assert.deepEqual(messages(one({}, 'priority', { lowerNumberIsHigherPriority: 1 })), ['The priority direction setting must be on or off.']);
  });

  test('every error is reported, not only the first', () => {
    const r = validateScenario({
      algorithm: 'priority',
      processes: [{ id: 'P1', arrival: 100, burst: 0, priority: 0 }],
    });
    assert.deepEqual(r.errors.map((e) => e.path), ['P1.arrival', 'P1.burst', 'P1.priority']);
  });

  test('garbage never throws', () => {
    for (const s of [null, undefined, 1, 'x', [], {}, { processes: 'x' }, { processes: [null, 1, 'P1'] }]) {
      assert.equal(validateScenario(s).ok, false);
    }
  });

  test('slotOf', () => {
    assert.equal(slotOf('P1'), 1);
    assert.equal(slotOf('P8'), 8);
    assert.equal(slotOf('P9'), 0);
    assert.equal(slotOf(null), 0);
  });
});
