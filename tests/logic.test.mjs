// Logic engine: parsing (forms, precedence, positioned errors), golden identities, the full
// adder, simplification goldens (one and two minimal forms), differential tests against a
// separate evaluator and a brute-force minimal-cover search, and circuit layout.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseExpr, truthColumn, evaluate, rowEnv, toText, subexpressions } from '../src/js/engine/logic/expr.mjs';
import { minimize, primeImplicants, termMinterms } from '../src/js/engine/logic/qm.mjs';
import { layoutCircuit, circuitOutput, levels, gateList, GATE_H } from '../src/js/engine/logic/circuit.mjs';
import { oracleEval, oracleMinCost } from './logic-oracle.mjs';
import { prng, int, pick } from './random.mjs';

const parse = (s) => {
  const r = parseExpr(s);
  assert.equal(r.error, null, `${s}: ${r.error}`);
  return r;
};
const col = (s, vars) => {
  const r = parse(s);
  return truthColumn(r.ast, vars ?? r.vars);
};
const same = (a, b) => {
  const va = parse(a).vars;
  const vb = parse(b).vars;
  const vars = [...new Set([...va, ...vb])].sort();
  assert.deepEqual(col(a, vars), col(b, vars), `${a} == ${b}`);
};
// The same sum of products, ignoring the order of its terms.
const terms = (sop) => new Set(sop.split(' + '));
const sameSop = (got, want) => assert.deepEqual(got.map(terms), want.map(terms));
const mins = (s) => {
  const r = parse(s);
  return truthColumn(r.ast, r.vars).flatMap((v, i) => (v ? [i] : []));
};

describe('parsing', () => {
  test('every operator spelling gives the same function', () => {
    for (const [a, b] of [
      ['A AND B', 'A & B'], ['A AND B', 'A && B'], ['A AND B', 'A * B'], ['A AND B', 'A·B'], ['A AND B', 'A ∧ B'], ['A AND B', 'AB'], ['A AND B', 'a and b'],
      ['A OR B', 'A | B'], ['A OR B', 'A || B'], ['A OR B', 'A + B'], ['A OR B', 'A ∨ B'],
      ['NOT A', '!A'], ['NOT A', '~A'], ['NOT A', '¬A'], ['NOT A', "A'"],
      ['A XOR B', 'A ^ B'], ['A XOR B', 'A ⊕ B'], ['A XNOR B', 'A ⊙ B'], ['A NAND B', 'A ↑ B'], ['A NOR B', 'A ↓ B'],
      ['1', 'TRUE'], ['0', 'false'],
    ]) same(a, b);
  });
  test('precedence: NOT, then AND, then XOR, then OR', () => {
    same('A OR B AND C', 'A OR (B AND C)');
    same('A XOR B AND C', 'A XOR (B AND C)');
    same('A OR B XOR C', 'A OR (B XOR C)');
    same('NOT A AND B', '(NOT A) AND B');
    same('A NAND B OR C', '(A NAND B) OR C');
    same('A(B + C)', 'A AND (B OR C)');
    same("(AB)'", 'NOT (A AND B)');
  });
  test('errors point at the position', () => {
    const e = (s) => parseExpr(s);
    assert.equal(e('A AND').pos, 6);
    assert.match(e('A AND').error, /^Position 6: expected a variable, 0, 1, NOT or "\(" after "AND"/);
    assert.equal(e('(A OR B').pos, 8);
    assert.match(e('(A OR B').error, /expected "\)" to close the "\(" at position 1/);
    assert.equal(e('A OR B)').pos, 7);
    assert.match(e('A OR B)').error, /no matching/);
    assert.equal(e('A $ B').pos, 3);
    assert.match(e('').error, /Enter an expression/);
    assert.match(e('A B C D E F G').error, /7 variables/);
    assert.match(e('AND A').error, /^Position 1:/);
  });
  test('printing round-trips', () => {
    const rand = prng(61);
    for (let n = 0; n < 500; n++) {
      const s = randomExpr(rand, 4);
      const r = parse(s);
      const back = parse(toText(r.ast));
      assert.deepEqual(truthColumn(back.ast, r.vars), truthColumn(r.ast, r.vars), `${s} -> ${toText(r.ast)}`);
    }
  });
  test('subexpressions are listed innermost first, once each', () => {
    const r = parse('(A AND B) OR NOT (A AND B)');
    assert.deepEqual(subexpressions(r.ast).map((n) => toText(n)), ['A AND B', 'NOT (A AND B)', 'A AND B OR NOT (A AND B)']);
  });
});

describe('golden identities (SPEC.md)', () => {
  test('De Morgan, absorption, XOR as AND-OR', () => {
    same('NOT (A AND B)', 'NOT A OR NOT B');
    same('NOT (A OR B)', 'NOT A AND NOT B');
    same('A OR (A AND B)', 'A');
    same('A AND (A OR B)', 'A');
    same('A XOR B', '(A AND NOT B) OR (NOT A AND B)');
  });
  test('full adder: sum is m(1,2,4,7), carry m(3,5,6,7) and minimal AB + AC + BC', () => {
    assert.deepEqual(mins('A XOR B XOR C'), [1, 2, 4, 7]);
    assert.deepEqual(mins('AB + AC + BC'), [3, 5, 6, 7]);
    sameSop(minimize(['A', 'B', 'C'], [3, 5, 6, 7]).sop, ['AB + AC + BC']);
  });
  test('known minimal form: m(0,2,5,7,8,10,13,15) is BD + B\'D\'', () => {
    sameSop(minimize(['A', 'B', 'C', 'D'], [0, 2, 5, 7, 8, 10, 13, 15]).sop, ["BD + B'D'"]);
  });
  test('two minimal forms: m(0,1,2,5,6,7)', () => {
    const r = minimize(['A', 'B', 'C'], [0, 1, 2, 5, 6, 7]);
    assert.equal(r.sop.length, 2);
    const got = new Set(r.sop.map((x) => [...terms(x)].sort().join(' + ')));
    assert.deepEqual(got, new Set([["A'B'", "BC'", 'AC'].sort().join(' + '), ["A'C'", "B'C", 'AB'].sort().join(' + ')]));
  });
  test('constants, one variable, tautology, contradiction', () => {
    assert.deepEqual(minimize(['A'], []).sop, ['0']);
    assert.deepEqual(minimize(['A'], [0, 1]).sop, ['1']);
    assert.deepEqual(minimize(['A'], [1]).sop, ['A']);
    assert.deepEqual(minimize(['A'], [0]).sop, ["A'"]);
    assert.deepEqual(mins('A OR NOT A'), [0, 1]);
    assert.deepEqual(mins('A AND NOT A'), []);
    assert.deepEqual(minimize(['A', 'B'], [0, 1, 2, 3]).pos, ['1']);
    assert.deepEqual(minimize(['A', 'B'], []).pos, ['0']);
  });
  test('product of sums: (A + B)(A + C) for A + BC', () => {
    assert.deepEqual(minimize(['A', 'B', 'C'], mins('A + BC')).pos, ['(A + B)(A + C)']);
  });
});

describe('differential and exhaustive checks', () => {
  test('engine evaluation equals a separate evaluator on 2,000 random expressions', () => {
    const rand = prng(62);
    for (let n = 0; n < 2000; n++) {
      const s = randomExpr(rand, int(rand, 1, 6));
      const r = parse(s);
      for (let row = 0; row < 2 ** r.vars.length; row++) {
        const env = rowEnv(r.vars, row);
        assert.equal(evaluate(r.ast, env), oracleEval(s, env), `${s} row ${row}`);
      }
    }
  });
  test('every minimal SOP and POS equals the function; QM cost equals the brute-force minimum (up to 4 variables)', () => {
    const rand = prng(63);
    for (let n = 0; n < 400; n++) {
      const nv = int(rand, 1, 4);
      const vars = ['A', 'B', 'C', 'D'].slice(0, nv);
      const all = 2 ** nv;
      const ones = [];
      const dcs = [];
      for (let m = 0; m < all; m++) {
        const x = rand();
        if (x < 0.45) ones.push(m);
        else if (x < 0.55) dcs.push(m);
      }
      const r = minimize(vars, ones, dcs);
      for (const form of [...r.sop, ...r.pos]) {
        const p = parse(form);
        const outs = truthColumn(p.ast, vars);
        for (let m = 0; m < all; m++) if (!dcs.includes(m)) assert.equal(outs[m], ones.includes(m), `${form} at ${m} (ones ${ones} dc ${dcs})`);
      }
      const o = oracleMinCost(nv, ones, dcs);
      assert.deepEqual(r.sopCost, o, `cost for ones ${ones} dc ${dcs}`);
    }
  });
  test('prime implicants cover exactly the allowed minterms', () => {
    const rand = prng(64);
    for (let n = 0; n < 300; n++) {
      const nv = int(rand, 2, 6);
      const ones = [...new Set(Array.from({ length: int(rand, 1, 2 ** nv) }, () => int(rand, 0, 2 ** nv - 1)))];
      const { primes } = primeImplicants(nv, ones);
      const covered = new Set(primes.flatMap(termMinterms));
      assert.deepEqual([...covered].sort((a, b) => a - b), [...ones].sort((a, b) => a - b));
    }
  });
});

describe('circuit', () => {
  test('the circuit computes the expression on every row', () => {
    const rand = prng(65);
    for (let n = 0; n < 500; n++) {
      const s = randomExpr(rand, int(rand, 1, 5));
      const r = parse(s);
      const lay = layoutCircuit(r.ast);
      for (let row = 0; row < 2 ** r.vars.length; row++) {
        const env = rowEnv(r.vars, row);
        assert.equal(circuitOutput(lay, env), evaluate(r.ast, env), s);
      }
      // No two nodes on the same spot; every gate is right of its inputs.
      const spots = new Set(lay.nodes.map((x) => `${x.x},${Math.round(x.y)}`));
      assert.equal(spots.size, lay.nodes.length, `overlap in ${s}`);
      for (const g of lay.nodes) for (const i of g.inputs) assert.ok(lay.nodes[i].x < g.x);
      assert.ok(lay.nodes.every((x) => x.y - GATE_H / 2 >= 0 && x.y <= lay.height));
      assert.equal(levels(lay).flat().length, lay.nodes.filter((x) => x.kind === 'gate').length);
    }
  });
  test('gate list text', () => {
    assert.deepEqual(gateList(layoutCircuit(parse('NOT (A AND B) OR C').ast)), ['G1 = A AND B', 'G2 = NOT G1', 'G3 = G2 OR C']);
  });
});

/** A random expression written with spaced words, so the oracle can read it too. */
function randomExpr(rand, nv) {
  const vars = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, nv);
  const gen = (d) => {
    const x = rand();
    if (d <= 0 || x < 0.25) return x < 0.05 ? pick(rand, ['0', '1']) : pick(rand, vars);
    if (x < 0.4) return `NOT ${gen(d - 1)}`;
    if (x < 0.55) return `( ${gen(d - 1)} )`;
    return `${gen(d - 1)} ${pick(rand, ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'])} ${gen(d - 1)}`;
  };
  return gen(int(rand, 1, 4));
}
