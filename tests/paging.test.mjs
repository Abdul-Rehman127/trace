// Page replacement engine: golden cases (from the brief and derived by hand in
// sections/memory/SPEC.md), differential tests against an independent oracle,
// properties, validation, share links and narration.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { simulatePaging, faultsByFrames, faultRate, PAGING_ALGORITHMS } from '../src/js/engine/memory/paging.mjs';
import { validatePaging, parseRefs, parseFrames } from '../src/js/engine/memory/validate.mjs';
import { encodePaging, decodePaging } from '../src/js/engine/memory/share.mjs';
import { narratePagingStep, pagingView, pagingSentenceText } from '../src/js/engine/memory/narrate.mjs';
import { defaultPaging, PAGING_PRESETS } from '../src/js/engine/memory/presets.mjs';
import { oracleFaults } from './paging-oracle.mjs';
import { prng, int, pick } from './random.mjs';

const run = (algorithm, refs, frames, newBit = 1) => simulatePaging({ algorithm, refs, frames, options: { newBit } });
const CLASSIC = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
const BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

describe('golden cases from the brief (never edit)', () => {
  const cases = [
    [CLASSIC, 3, { fifo: 15, lru: 12, opt: 9 }],
    [BELADY, 3, { fifo: 9, lru: 10, opt: 7 }],
    [BELADY, 4, { fifo: 10, lru: 8, opt: 6 }],
  ];
  for (const [refs, frames, expected] of cases) {
    for (const [alg, faults] of Object.entries(expected)) {
      test(`${alg} on ${refs.slice(0, 4).join(',')}... with ${frames} frames: ${faults} faults`, () => {
        assert.equal(run(alg, refs, frames).faults, faults);
      });
    }
  }
});

describe('edge cases derived by hand', () => {
  const cases = [
    [[1, 1, 2, 1], 1, 3],
    [[1, 2, 1, 3], 5, 3],
    [[4, 4, 4, 4], 3, 1],
    [[1, 2, 3, 4, 5, 6], 3, 6],
  ];
  for (const [refs, frames, faults] of cases) {
    for (const alg of PAGING_ALGORITHMS) {
      test(`${alg}: ${refs.join(',')} with ${frames} frames has ${faults} faults`, () => {
        assert.equal(run(alg, refs, frames).faults, faults);
      });
    }
  }
  test('Optimal tie: of pages never used again, the one in memory longest goes', () => {
    const r = run('opt', [1, 2, 3, 4], 3);
    assert.equal(r.steps[3].evicted, 1);
    assert.deepEqual(r.steps[3].frames, [4, 2, 3]);
  });
  test('frames keep their position: the new page takes the evicted page frame', () => {
    const r = run('fifo', [1, 2, 3, 4], 3);
    assert.deepEqual(r.steps[3].frames, [4, 2, 3]);
    assert.equal(r.steps[3].slot, 0);
  });
});

describe('Clock traces derived by hand (SPEC.md)', () => {
  test('A: Belady string, 3 frames, new bit 1, step by step', () => {
    const r = run('clock', BELADY, 3, 1);
    const want = [
      [[1, null, null], [1, 0, 0], 1, true],
      [[1, 2, null], [1, 1, 0], 2, true],
      [[1, 2, 3], [1, 1, 1], 0, true],
      [[4, 2, 3], [1, 0, 0], 1, true],
      [[4, 1, 3], [1, 1, 0], 2, true],
      [[4, 1, 2], [1, 1, 1], 0, true],
      [[5, 1, 2], [1, 0, 0], 1, true],
      [[5, 1, 2], [1, 1, 0], 1, false],
      [[5, 1, 2], [1, 1, 1], 1, false],
      [[5, 3, 2], [0, 1, 0], 2, true],
      [[5, 3, 4], [0, 1, 1], 0, true],
      [[5, 3, 4], [1, 1, 1], 0, false],
    ];
    want.forEach(([frames, bits, pointer, fault], i) => {
      const s = r.steps[i];
      assert.deepEqual(s.frames, frames, `frames after step ${i + 1}`);
      assert.deepEqual(s.bits, bits, `bits after step ${i + 1}`);
      assert.equal(s.pointer, pointer, `pointer after step ${i + 1}`);
      assert.equal(!s.hit, fault, `fault at step ${i + 1}`);
    });
    assert.deepEqual(r.steps[3].cleared.map((c) => c.page), [1, 2, 3]);
    assert.equal(r.steps[3].reason, 'clock-second-chance');
    assert.equal(r.steps[4].reason, 'clock-evict');
    assert.equal(r.faults, 9);
  });
  test('B: same string, new bit 0: 10 faults, final frames 3 4 5', () => {
    const r = run('clock', BELADY, 3, 0);
    assert.equal(r.faults, 10);
    assert.deepEqual(r.steps[11].frames, [3, 4, 5]);
    assert.deepEqual(r.steps[9].frames, [3, 1, 2]);
    assert.deepEqual(r.steps[9].cleared.map((c) => c.page), [1, 2]);
  });
  test('C: classic string, 3 frames, new bit 1: 14 faults, step by step', () => {
    const r = run('clock', CLASSIC, 3, 1);
    const want = [
      [7, null, null], [7, 0, null], [7, 0, 1], [2, 0, 1], [2, 0, 1], [2, 0, 3], [2, 0, 3], [4, 0, 3], [4, 2, 3], [4, 2, 3],
      [4, 2, 0], [3, 2, 0], [3, 2, 0], [3, 1, 0], [3, 1, 2], [0, 1, 2], [0, 1, 2], [0, 7, 2], [0, 7, 2], [0, 7, 1],
    ];
    const pointers = [1, 2, 0, 1, 1, 0, 0, 1, 2, 2, 0, 1, 1, 2, 0, 1, 1, 2, 2, 0];
    want.forEach((frames, i) => {
      assert.deepEqual(r.steps[i].frames, frames, `frames after step ${i + 1}`);
      assert.equal(r.steps[i].pointer, pointers[i], `pointer after step ${i + 1}`);
    });
    assert.deepEqual(r.steps[10].bits, [0, 0, 1]);
    assert.equal(r.faults, 14);
  });
  test('a hit sets the bit to 1 and leaves the pointer', () => {
    const r = run('clock', [1, 2, 1], 2, 0);
    assert.deepEqual(r.steps[2].bits, [1, 0]);
    assert.equal(r.steps[2].pointer, r.steps[1].pointer);
  });
});

describe('differential: engine against the independent oracle', () => {
  test('4,000 random strings, every algorithm, both Clock bit settings', () => {
    const rand = prng(20261108);
    for (let n = 0; n < 4000; n++) {
      const len = int(rand, 1, 40);
      const span = pick(rand, [3, 5, 8, 12, 100]);
      const refs = Array.from({ length: len }, () => int(rand, 0, span - 1));
      const frames = int(rand, 1, 8);
      for (const alg of PAGING_ALGORITHMS) {
        for (const bit of alg === 'clock' ? [1, 0] : [1]) {
          const e = run(alg, refs, frames, bit);
          const o = oracleFaults(alg, refs, frames, bit);
          const ctx = `${alg} f=${frames} bit=${bit} r=${refs.join(',')}`;
          assert.equal(e.faults, o.faults, ctx);
          const resident = e.steps.at(-1).frames.filter((x) => x !== null).sort((a, b) => a - b);
          assert.deepEqual(resident, o.resident, ctx);
          if (alg === 'clock') {
            assert.deepEqual(e.steps.at(-1).frames, o.positions, ctx);
            assert.deepEqual(e.steps.at(-1).bits.slice(0, o.bits.length), o.bits, ctx);
            assert.equal(e.steps.at(-1).pointer, o.hand, ctx);
          }
        }
      }
    }
  });
});

describe('properties over random inputs', () => {
  const rand = prng(7);
  const samples = Array.from({ length: 1500 }, () => {
    const len = int(rand, 1, 40);
    const span = pick(rand, [2, 4, 6, 10, 30]);
    return Array.from({ length: len }, () => int(rand, 0, span - 1));
  });

  test('faults + hits = references; distinct <= faults <= references; frames stay consistent', () => {
    for (const refs of samples) {
      const distinct = new Set(refs).size;
      for (const alg of PAGING_ALGORITHMS) {
        for (let f = 1; f <= 8; f++) {
          const r = run(alg, refs, f);
          assert.equal(r.faults + r.hits, refs.length);
          assert.ok(r.faults >= distinct && r.faults <= refs.length);
          if (f >= distinct) assert.equal(r.faults, distinct);
          for (const s of r.steps) {
            const live = s.frames.filter((x) => x !== null);
            assert.equal(new Set(live).size, live.length, 'no page in two frames');
            assert.ok(s.frames.includes(s.page), 'the referenced page is resident');
            assert.equal(s.frames.length, f);
          }
        }
      }
    }
  });

  test('Optimal is never worse than any other algorithm', () => {
    for (const refs of samples) {
      for (let f = 1; f <= 8; f++) {
        const best = run('opt', refs, f).faults;
        for (const alg of ['fifo', 'lru', 'clock']) {
          assert.ok(best <= run(alg, refs, f).faults, `${alg} beat optimal on f=${f} r=${refs.join(',')}`);
          assert.ok(best <= run(alg, refs, f, 0).faults);
        }
      }
    }
  });

  test('LRU and Optimal never fault more with one more frame', () => {
    for (const refs of samples) {
      for (const alg of ['lru', 'opt']) {
        const byF = faultsByFrames(alg, refs);
        for (let f = 1; f < byF.length; f++) assert.ok(byF[f] <= byF[f - 1], `${alg} r=${refs.join(',')}`);
      }
    }
  });

  test('FIFO is allowed to (Belady)', () => {
    const byF = faultsByFrames('fifo', BELADY);
    assert.ok(byF[3] > byF[2]);
  });

  test('the engine does not change its input', () => {
    const refs = CLASSIC.slice();
    run('opt', refs, 3);
    assert.deepEqual(refs, CLASSIC);
  });
});

describe('fault rate', () => {
  test('exact fraction and one-decimal percent', () => {
    assert.deepEqual(faultRate(15, 20), { num: 3, den: 4, percent: 75 });
    assert.deepEqual(faultRate(9, 12), { num: 3, den: 4, percent: 75 });
    assert.deepEqual(faultRate(1, 3), { num: 1, den: 3, percent: 33.3 });
  });
});

describe('validation', () => {
  test('accepts commas, spaces and both, and ignores stray separators', () => {
    assert.deepEqual(parseRefs(' 7, 0 1,,2 ').refs, [7, 0, 1, 2]);
    assert.deepEqual(parseRefs('07').refs, [7]);
  });
  test('rejects with specific messages', () => {
    assert.equal(parseRefs('').error, 'Enter at least one page number.');
    assert.equal(parseRefs(' , ').error, 'Enter at least one page number.');
    assert.equal(parseRefs('1, x, 3').error, '"x" is not a page number. Use whole numbers from 0 to 99, separated by commas or spaces.');
    assert.equal(parseRefs('1 -2').error, '"-2" is not a page number. Use whole numbers from 0 to 99, separated by commas or spaces.');
    assert.equal(parseRefs('1.5').error, '"1.5" is not a page number. Use whole numbers from 0 to 99, separated by commas or spaces.');
    assert.equal(parseRefs('140').error, 'Page 140 is out of range. Use whole numbers from 0 to 99.');
    assert.equal(parseRefs(Array(41).fill(1).join(',')).error, 'Use at most 40 page references. This string has 41.');
    assert.equal(parseRefs(Array(40).fill(1).join(',')).error, null);
  });
  test('frames from 1 to 8', () => {
    assert.equal(parseFrames('1').frames, 1);
    assert.equal(parseFrames(' 8 ').frames, 8);
    for (const bad of ['0', '9', '', 'a', '2.5', '-1', null]) assert.equal(parseFrames(bad).error, 'Frames must be a whole number from 1 to 8.');
  });
  test('validatePaging collects every error and normalizes', () => {
    const bad = validatePaging({ algorithm: 'mru', refs: '', frames: '0' });
    assert.equal(bad.ok, false);
    assert.deepEqual(bad.errors.map((e) => e.path), ['algorithm', 'refs', 'frames']);
    const ok = validatePaging({ algorithm: 'clock', refs: '1 2', frames: '2', options: { newBit: 0 } });
    assert.deepEqual(ok.value, { algorithm: 'clock', refs: [1, 2], frames: 2, options: { newBit: 0 } });
  });
});

describe('share links', () => {
  const fallback = defaultPaging('fifo');
  test('round trip for 3,000 random inputs', () => {
    const rand = prng(99);
    for (let n = 0; n < 3000; n++) {
      const input = {
        algorithm: pick(rand, PAGING_ALGORITHMS),
        refs: Array.from({ length: int(rand, 1, 40) }, () => int(rand, 0, 99)),
        frames: int(rand, 1, 8),
        options: { newBit: pick(rand, [0, 1]) },
      };
      if (input.algorithm !== 'clock') input.options.newBit = 1;
      const back = decodePaging(`?${encodePaging(input)}`, fallback);
      assert.deepEqual(back.input, input);
      assert.equal(back.notices.length, 0);
      assert.equal(back.found, true);
    }
  });
  test('bit=0 is written only for Clock', () => {
    assert.equal(encodePaging({ algorithm: 'clock', refs: [1], frames: 1, options: { newBit: 0 } }), 'alg=clock&f=1&r=1&bit=0');
    assert.equal(encodePaging({ algorithm: 'lru', refs: [1], frames: 1, options: { newBit: 0 } }), 'alg=lru&f=1&r=1');
  });
  test('bad parts fall back with a notice, good parts are kept', () => {
    const d = decodePaging('?alg=lru&f=12&r=1,2,3', fallback);
    assert.equal(d.input.algorithm, 'lru');
    assert.equal(d.input.frames, 3);
    assert.deepEqual(d.input.refs, [1, 2, 3]);
    assert.equal(d.notices.length, 1);
  });
  test('hostile or garbage query strings never throw and always give valid input', () => {
    const rand = prng(5);
    const chars = 'abfr=&,%0123456789?#;x_ -.'.split('');
    const fuzz = Array.from({ length: 3000 }, () => Array.from({ length: int(rand, 0, 60) }, () => pick(rand, chars)).join(''));
    const fixed = ['?r=%', '?f=%E0%A4%A', '?' + 'r=1,'.repeat(800), '?alg=__proto__&r=1', '?r=999', '?f=-1&r=1e3', '?bit=2'];
    for (const q of [...fixed, ...fuzz, null, undefined, 42, {}]) {
      const d = decodePaging(q, fallback);
      assert.equal(validatePaging(d.input).ok, true, String(q));
    }
  });
});

describe('narration', () => {
  test('every step of every algorithm narrates with no gaps', () => {
    const rand = prng(3);
    const inputs = [CLASSIC, BELADY, [1, 2, 3, 4], ...Array.from({ length: 200 }, () => Array.from({ length: int(rand, 1, 40) }, () => int(rand, 0, 9)))];
    for (const refs of inputs) {
      for (const alg of PAGING_ALGORITHMS) {
        for (const f of [1, 3, 8]) {
          for (const bit of [1, 0]) {
            const r = run(alg, refs, f, bit);
            for (let k = 0; k <= refs.length; k++) {
              const text = narratePagingStep(r, k).map(pagingSentenceText).join(' ');
              assert.ok(text.length > 20);
              assert.doesNotMatch(text, /undefined|null|NaN|Infinity|—/);
              const view = pagingView(r, k);
              assert.ok(view.label);
              for (const item of view.items) assert.doesNotMatch(item.note, /undefined|NaN|Infinity/);
            }
          }
        }
      }
    }
  });
  test('reason codes cover the brief list', () => {
    const seen = new Set();
    for (const alg of PAGING_ALGORITHMS) for (const refs of [CLASSIC, BELADY]) for (const s of run(alg, refs, 3).steps) seen.add(s.reason);
    for (const code of ['hit', 'fault-free-frame', 'fault-evict-oldest', 'fault-evict-least-recent', 'fault-evict-farthest-next-use', 'clock-second-chance', 'clock-evict']) {
      assert.ok(seen.has(code), code);
    }
  });
  test('specific sentences', () => {
    const r = run('opt', [1, 2, 3, 4], 3);
    assert.equal(
      narratePagingStep(r, 4).map(pagingSentenceText).join(' '),
      'Page 4 is not in memory, so this is a page fault. All frames are full. Optimal looks ahead: pages 1, 2 and 3 are never used again. Of those, page 1 has been in memory longest, so it is evicted. Page 4 goes into frame 0.',
    );
    const f = run('fifo', CLASSIC, 3);
    assert.equal(narratePagingStep(f, 0).map(pagingSentenceText).join(' '), 'All 3 frames are empty. Press play or step forward to bring in the first page.');
    assert.match(narratePagingStep(f, 4).map(pagingSentenceText).join(' '), /FIFO evicts page 7, which was loaded first, at step 1\./);
  });
  test('presets are valid inputs', () => {
    for (const p of PAGING_PRESETS) assert.equal(validatePaging({ algorithm: 'fifo', refs: p.refs, frames: p.frames }).ok, true, p.key);
  });
});

describe('claims made in the page copy (src/content/memory)', () => {
  test('FIFO example: page 3 is evicted at step 6 and needed again at step 7', () => {
    const r = run('fifo', [1, 3, 0, 3, 5, 6, 3], 3);
    assert.equal(r.steps[5].evicted, 3);
    assert.equal(r.steps[6].page, 3);
    assert.equal(r.steps[6].hit, false);
  });
  test('LRU example: page 0 is never evicted, while FIFO evicts it', () => {
    const refs = [7, 0, 1, 2, 0, 3, 0, 4];
    assert.ok(run('lru', refs, 3).steps.every((s) => s.evicted !== 0));
    assert.ok(run('fifo', refs, 3).steps.some((s) => s.evicted === 0));
  });
  test('Optimal: any choice among never-used pages gives the same number of faults', () => {
    // An alternative tie rule (evict the newest never-used page) written inline.
    const altOpt = (refs, frames) => {
      let mem = [];
      let faults = 0;
      refs.forEach((p, i) => {
        if (mem.some((m) => m.page === p)) return;
        faults++;
        if (mem.length < frames) return mem.push({ page: p, at: i });
        const next = (q) => {
          const j = refs.indexOf(q, i + 1);
          return j === -1 ? Infinity : j;
        };
        mem.sort((a, b) => next(b.page) - next(a.page) || b.at - a.at);
        mem[0] = { page: p, at: i };
      });
      return faults;
    };
    const rand = prng(11);
    for (let n = 0; n < 2000; n++) {
      const refs = Array.from({ length: int(rand, 1, 40) }, () => int(rand, 0, int(rand, 1, 12)));
      const f = int(rand, 1, 8);
      assert.equal(run('opt', refs, f).faults, altOpt(refs, f), refs.join(','));
    }
  });
  test('Clock with no hits evicts in exactly FIFO order', () => {
    const rand = prng(12);
    let checked = 0;
    for (let n = 0; n < 3000; n++) {
      const refs = Array.from({ length: int(rand, 1, 40) }, () => int(rand, 0, 30));
      const f = int(rand, 1, 8);
      for (const bit of [1, 0]) {
        const c = run('clock', refs, f, bit);
        if (c.hits) continue;
        checked++;
        assert.deepEqual(c.steps.map((s) => s.evicted), run('fifo', refs, f).steps.map((s) => s.evicted));
      }
    }
    assert.ok(checked > 500);
  });
  test('Loop preset: FIFO and LRU fault on every reference, Optimal on at most half', () => {
    const loop = PAGING_PRESETS.find((p) => p.key === 'loop');
    assert.equal(run('fifo', loop.refs, loop.frames).faults, loop.refs.length);
    assert.equal(run('lru', loop.refs, loop.frames).faults, loop.refs.length);
    assert.ok(run('opt', loop.refs, loop.frames).faults <= loop.refs.length / 2);
  });
  test('Clock can show Belady anomaly (FIFO and Clock "can", copy says)', () => {
    assert.ok(run('clock', BELADY, 4).faults > run('clock', BELADY, 3).faults);
  });
  test('classic string: Clock lies between LRU and FIFO, as the Clock page says', () => {
    const [l, c, f] = ['lru', 'clock', 'fifo'].map((a) => run(a, CLASSIC, 3).faults);
    assert.ok(l <= c && c <= f);
  });
});
