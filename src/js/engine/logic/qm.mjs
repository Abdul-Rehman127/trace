// Two-level minimization: Quine-McCluskey for prime implicants, essential prime implicants,
// then Petrick's method for every minimal cover (fewest terms, then fewest literals).
// Terms are strings over '0', '1', '-' with the first variable first. Pure, no DOM.

const ones = (s) => [...s].filter((c) => c === '1').length;
const literals = (term) => [...term].filter((c) => c !== '-').length;
const bits = (m, n) => m.toString(2).padStart(n, '0');

/** Does term cover minterm m (over n variables)? */
export const covers = (term, m) => {
  const b = bits(m, term.length);
  for (let i = 0; i < term.length; i++) if (term[i] !== '-' && term[i] !== b[i]) return false;
  return true;
};

/** Minterms a term covers, ascending. */
export const termMinterms = (term) => {
  const out = [];
  for (let m = 0; m < 2 ** term.length; m++) if (covers(term, m)) out.push(m);
  return out;
};

/**
 * Quine-McCluskey. Returns { rounds, primes } where each round lists its groups of
 * { term, from: [minterms], used } and primes are the terms never combined further.
 */
export function primeImplicants(n, minterms, dontCares = []) {
  let current = [...new Set([...minterms, ...dontCares])].sort((a, b) => a - b).map((m) => ({ term: bits(m, n), from: [m], used: false }));
  const rounds = [];
  const primes = [];
  while (current.length) {
    const groups = new Map();
    for (const t of current) {
      const k = ones(t.term);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(t);
    }
    const next = new Map();
    const keys = [...groups.keys()].sort((a, b) => a - b);
    for (const k of keys) {
      for (const a of groups.get(k)) {
        for (const b of groups.get(k + 1) || []) {
          let diff = -1;
          let count = 0;
          for (let i = 0; i < n; i++) {
            if (a.term[i] !== b.term[i]) {
              count++;
              diff = i;
            }
          }
          if (count === 1 && a.term[diff] !== '-' && b.term[diff] !== '-') {
            const term = `${a.term.slice(0, diff)}-${a.term.slice(diff + 1)}`;
            a.used = true;
            b.used = true;
            if (!next.has(term)) next.set(term, { term, from: [...new Set([...a.from, ...b.from])].sort((x, y) => x - y), used: false });
          }
        }
      }
    }
    rounds.push(keys.map((k) => ({ ones: k, terms: groups.get(k).map((t) => ({ term: t.term, from: t.from, used: t.used })) })));
    for (const t of current) if (!t.used && !primes.includes(t.term)) primes.push(t.term);
    current = [...next.values()];
  }
  return { rounds, primes };
}

/**
 * Every minimal cover of the minterms by prime implicants. Don't-cares need not be covered.
 * Returns { essentials, covers: [[terms]], cost: { terms, literals } }.
 */
export function minimalCovers(primes, minterms) {
  if (minterms.length === 0) return { essentials: [], covers: [[]], cost: { terms: 0, literals: 0 } };
  const chart = new Map(minterms.map((m) => [m, primes.filter((p) => covers(p, m))]));
  const essentials = [];
  for (const [, ps] of chart) if (ps.length === 1 && !essentials.includes(ps[0])) essentials.push(ps[0]);
  const left = minterms.filter((m) => !essentials.some((e) => covers(e, m)));
  const others = primes.filter((p) => !essentials.includes(p));

  // Petrick's method: a product of sums over the remaining minterms, expanded with absorption.
  // Each product term is a set of prime indexes, kept as a BigInt bitmask.
  let products = [0n];
  for (const m of left) {
    const options = others.map((p, i) => (covers(p, m) ? 1n << BigInt(i) : 0n)).filter((x) => x !== 0n);
    const next = new Set();
    for (const prod of products) for (const o of options) next.add(prod | o);
    // Absorption: drop any product that contains another.
    const list = [...next];
    products = list.filter((a) => !list.some((b) => b !== a && (a & b) === b));
  }
  const termsOf = (mask) => others.filter((_, i) => (mask >> BigInt(i)) & 1n);
  const scored = products.map((mask) => {
    const terms = [...essentials, ...termsOf(mask)];
    return { terms, cost: { terms: terms.length, literals: terms.reduce((s, t) => s + literals(t), 0) } };
  });
  const best = scored.reduce((b, s) => (s.cost.terms < b.terms || (s.cost.terms === b.terms && s.cost.literals < b.literals) ? s.cost : b), { terms: Infinity, literals: Infinity });
  const coversOut = scored
    .filter((s) => s.cost.terms === best.terms && s.cost.literals === best.literals)
    .map((s) => sortTerms(s.terms));
  // Distinct covers only, in a stable order.
  const uniq = [...new Map(coversOut.map((c) => [c.join('|'), c])).values()].sort((a, b) => a.join('|').localeCompare(b.join('|')));
  return { essentials: sortTerms(essentials), covers: uniq, cost: best };
}

// Display order: fewer literals first, then variable by variable with a plain literal before a
// complemented one, so AB + AC + BC and BD + B'D' read the usual way.
const RANK = { 1: 0, 0: 1, '-': 2 };
const termKey = (t) => [...t].map((c) => RANK[c]).join('');
const sortTerms = (terms) => [...terms].sort((a, b) => literals(a) - literals(b) || termKey(a).localeCompare(termKey(b)));

/** A term as a product of literals: "AB'", or "1" for the empty product. */
export function termToProduct(term, vars) {
  const parts = [];
  [...term].forEach((c, i) => {
    if (c === '1') parts.push(vars[i]);
    if (c === '0') parts.push(`${vars[i]}'`);
  });
  return parts.length ? parts.join('') : '1';
}

/** A term over the zeros as a sum: "(A + B')" from term '01' (maxterm convention). */
export function termToSum(term, vars) {
  const parts = [];
  [...term].forEach((c, i) => {
    if (c === '0') parts.push(vars[i]);
    if (c === '1') parts.push(`${vars[i]}'`);
  });
  return parts.length === 1 ? parts[0] : `(${parts.join(' + ')})`;
}

/**
 * Full minimization of a function given by its ones and don't-cares over vars.
 * Returns canonical lists, QM rounds, primes, minimal SOPs and minimal POS forms.
 */
export function minimize(vars, onesList, dontCares = []) {
  const n = vars.length;
  const all = 2 ** n;
  const zeros = [];
  for (let m = 0; m < all; m++) if (!onesList.includes(m) && !dontCares.includes(m)) zeros.push(m);
  const sopQm = primeImplicants(n, onesList, dontCares);
  const sop = minimalCovers(sopQm.primes, onesList);
  const posQm = primeImplicants(n, zeros, dontCares);
  const pos = minimalCovers(posQm.primes, zeros);
  const sopText = (cover) => (onesList.length === 0 ? '0' : cover.length === 1 && !cover[0].replace(/-/g, '') ? '1' : cover.map((t) => termToProduct(t, vars)).join(' + '));
  const posText = (cover) => (zeros.length === 0 ? '1' : cover.length === 1 && !cover[0].replace(/-/g, '') ? '0' : cover.map((t) => termToSum(t, vars)).join(''));
  return {
    vars,
    minterms: [...onesList].sort((a, b) => a - b),
    maxterms: zeros,
    dontCares: [...dontCares].sort((a, b) => a - b),
    rounds: sopQm.rounds,
    primes: sortTerms(sopQm.primes),
    essentials: sop.essentials,
    sopCovers: sop.covers,
    sopCost: sop.cost,
    sop: sop.covers.map(sopText),
    posCovers: pos.covers,
    pos: pos.covers.map(posText),
  };
}

/** Karnaugh map layout for 2 to 4 variables: Gray-code row and column labels and the minterm in each cell. */
export function kmapLayout(n) {
  const gray = (k) => (k === 1 ? ['0', '1'] : ['00', '01', '11', '10']);
  const rowBits = n === 4 ? 2 : 1;
  const colBits = n - rowBits;
  const rows = gray(rowBits);
  const cols = gray(colBits);
  const cells = rows.map((r) => cols.map((c) => parseInt(r + c, 2)));
  return { rowBits, colBits, rows, cols, cells };
}
