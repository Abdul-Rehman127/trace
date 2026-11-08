import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { encodeScenario, decodeScenario } from '../src/js/engine/share.mjs';
import { validateScenario } from '../src/js/engine/validate.mjs';
import { prng, randomProcesses, randomQuantum, COMBOS, int } from './random.mjs';

const FALLBACK = {
  algorithm: 'fcfs',
  processes: [{ id: 'P1', arrival: 0, burst: 5, priority: 1 }],
  options: {},
};

/** The normalized form a share link is expected to preserve. */
function normalize(s) {
  const v = validateScenario(s).value;
  const options = { quantum: 2, rrTie: 'new', preemptive: false, lowerNumberIsHigherPriority: true };
  if (v.algorithm === 'rr') Object.assign(options, { quantum: v.options.quantum, rrTie: v.options.rrTie });
  if (v.algorithm === 'priority') {
    Object.assign(options, { preemptive: v.options.preemptive, lowerNumberIsHigherPriority: v.options.lowerNumberIsHigherPriority });
  }
  return {
    algorithm: v.algorithm,
    processes: v.processes.map((p) => ({ ...p, priority: v.algorithm === 'priority' ? p.priority : 1 })),
    options,
  };
}

describe('share links', () => {
  test('the documented example decodes', () => {
    const { scenario, notices, found } = decodeScenario('?alg=rr&q=2&tie=new&p=0:5,1:3,2:1,3:4', FALLBACK);
    assert.ok(found);
    assert.deepEqual(notices, []);
    assert.equal(scenario.algorithm, 'rr');
    assert.equal(scenario.options.quantum, 2);
    assert.deepEqual(scenario.processes.map((p) => [p.id, p.arrival, p.burst]), [['P1', 0, 5], ['P2', 1, 3], ['P3', 2, 1], ['P4', 3, 4]]);
  });

  test('encode writes only what the algorithm uses, with empty slots kept', () => {
    assert.equal(
      encodeScenario({
        algorithm: 'priority',
        processes: [{ id: 'P1', arrival: 0, burst: 5, priority: 2 }, { id: 'P3', arrival: 4, burst: 1, priority: 1 }],
        options: { preemptive: true, lowerNumberIsHigherPriority: false, quantum: 9 },
      }),
      'alg=priority&pre=1&hi=1&p=0:5:2,,4:1:1',
    );
    assert.equal(
      encodeScenario({ algorithm: 'rr', processes: [{ id: 'P2', arrival: 1, burst: 2 }], options: { quantum: 3, rrTie: 'preempted' } }),
      'alg=rr&q=3&tie=preempted&p=,1:2',
    );
    assert.equal(encodeScenario({ algorithm: 'sjf', processes: [{ id: 'P1', arrival: 0, burst: 4, priority: 7 }] }), 'alg=sjf&p=0:4');
  });

  test('round trip: decode(encode(s)) equals s for 3,000 random scenarios', () => {
    const rand = prng(20261108);
    for (let i = 0; i < 3000; i++) {
      const combo = COMBOS[i % COMBOS.length];
      const options = { ...combo.options };
      if (combo.algorithm === 'rr') options.quantum = randomQuantum(rand);
      const s = { algorithm: combo.algorithm, processes: randomProcesses(rand), options };
      const q = encodeScenario(s);
      const { scenario, notices } = decodeScenario(`?${q}`, FALLBACK);
      assert.deepEqual(notices, [], q);
      assert.deepEqual(normalize(scenario), normalize(s), q);
    }
  });

  test('missing parameters fall back without notices', () => {
    const r = decodeScenario('', FALLBACK);
    assert.equal(r.found, false);
    assert.deepEqual(r.notices, []);
    assert.deepEqual(r.scenario.processes, FALLBACK.processes);
    assert.equal(decodeScenario('?utm_source=x', FALLBACK).found, false);
  });

  test('bad parts are dropped with a notice, good parts are kept', () => {
    const r = decodeScenario('?alg=rr&q=0&tie=sideways&p=0:5,x:1,2:100,3:4', FALLBACK);
    assert.equal(r.scenario.algorithm, 'rr');
    assert.equal(r.scenario.options.quantum, 2);
    assert.equal(r.scenario.options.rrTie, 'new');
    assert.deepEqual(r.scenario.processes.map((p) => p.id), ['P1', 'P4']);
    assert.deepEqual(r.notices, [
      'The quantum in this link was ignored. Quantum must be a whole number from 1 to 99.',
      'The tie rule in this link was ignored.',
      'P2 and P3 in this link could not be read, so they were left out.',
    ]);
  });

  test('too many processes keeps the first 8', () => {
    const r = decodeScenario(`?p=${Array(12).fill('0:1').join(',')}`, FALLBACK);
    assert.equal(r.scenario.processes.length, 8);
    assert.equal(r.notices.length, 1);
  });

  test('a link with no readable processes shows the default example', () => {
    const r = decodeScenario('?alg=sjf&p=,,,', FALLBACK);
    assert.equal(r.scenario.algorithm, 'sjf');
    assert.deepEqual(r.scenario.processes, FALLBACK.processes);
    assert.equal(r.notices.length, 1);
  });

  test('hostile or garbage query strings never throw and always yield a valid scenario', () => {
    const fixed = [
      '?', '??', '&&&', '?alg', '?alg=', '?p', '?p=', '?p=:', '?p=::::', '?p=0:1:2:3', '?p=-1:5', '?p=1e1:5', '?p=0x1:5',
      '?p=%', '?p=%E0%A4%A', '?alg=%00', '?alg=__proto__', '?__proto__=1&constructor=2', '?alg=constructor',
      '?p=' + ','.repeat(10000), '?q=' + '9'.repeat(5000), '?p=0:5&p=junk', '?alg=rr&alg=fcfs', '?pre=2&hi=yes',
      '?p=٣:٣', '?p=0:5;1:3', '?p=0%3A5', '?p= 0 : 5 ', '?p=0:5,,,,,,,0:3', '#p=0:5', 'p=0:5', '?p=0:5:', '?p=0:99:99,99:99:99',
    ];
    const rand = prng(99);
    const chars = 'pq=&,:%0123456789alg?tie#preh\u0000￿\uD800 ';
    const fuzz = Array.from({ length: 3000 }, () => {
      const len = int(rand, 0, 60);
      let s = '';
      for (let i = 0; i < len; i++) s += chars[int(rand, 0, chars.length - 1)];
      return s;
    });
    for (const q of [...fixed, ...fuzz, null, undefined, 42, {}]) {
      let r;
      assert.doesNotThrow(() => {
        r = decodeScenario(q, FALLBACK);
      }, String(q).slice(0, 40));
      assert.ok(validateScenario(r.scenario).ok, `decoded scenario must be valid for ${String(q).slice(0, 40)}`);
      assert.ok(Array.isArray(r.notices));
    }
  });
});
