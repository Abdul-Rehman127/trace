// Independent logic oracle for differential tests. Written separately from the engine:
// a tiny evaluator over a different representation (reverse Polish built by a shunting-yard
// pass over a whitelist of tokens), and a brute-force minimal-cover search that finds prime
// implicants by enumerating every cube instead of by Quine-McCluskey tabulation.

const PREC = { NOT: 4, AND: 3, NAND: 3, XOR: 2, XNOR: 2, OR: 1, NOR: 1 };
const FN = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XNOR: (a, b) => 1 - (a ^ b) };

/** Evaluate an expression written only with letters, 0, 1, the words and parentheses, spaced. */
export function oracleEval(spaced, env) {
  const tokens = spaced.trim().split(/\s+/);
  const out = [];
  const ops = [];
  for (const t of tokens) {
    if (t === '(') ops.push(t);
    else if (t === ')') {
      while (ops.at(-1) !== '(') out.push(ops.pop());
      ops.pop();
    } else if (PREC[t]) {
      // NOT is right-associative and unary; the rest are left-associative.
      while (ops.length && ops.at(-1) !== '(' && (t === 'NOT' ? PREC[ops.at(-1)] > PREC[t] : PREC[ops.at(-1)] >= PREC[t])) out.push(ops.pop());
      ops.push(t);
    } else out.push(t);
  }
  while (ops.length) out.push(ops.pop());
  const st = [];
  for (const t of out) {
    if (t === 'NOT') st.push(1 - st.pop());
    else if (FN[t]) {
      const b = st.pop();
      const a = st.pop();
      st.push(FN[t](a, b));
    } else st.push(t === '1' ? 1 : t === '0' ? 0 : env[t] ? 1 : 0);
  }
  return st[0] === 1;
}

/** Minimum (terms, literals) of a sum of products for ones (and don't-cares) over n <= 4 variables. */
export function oracleMinCost(n, ones, dcs = []) {
  if (!ones.length) return { terms: 0, literals: 0 };
  const allowed = new Set([...ones, ...dcs]);
  const cubes = [];
  // Every cube is a string over 0, 1, -; keep those whose minterms are all allowed.
  for (let code = 0; code < 3 ** n; code++) {
    let c = code;
    let term = '';
    for (let i = 0; i < n; i++) {
      term = '01-'[c % 3] + term;
      c = Math.floor(c / 3);
    }
    const ms = [];
    for (let m = 0; m < 2 ** n; m++) {
      const b = m.toString(2).padStart(n, '0');
      if ([...term].every((ch, i) => ch === '-' || ch === b[i])) ms.push(m);
    }
    if (ms.every((m) => allowed.has(m))) cubes.push({ term, ms, lits: [...term].filter((x) => x !== '-').length });
  }
  // Primes: cubes not strictly inside another allowed cube.
  const primes = cubes.filter((a) => !cubes.some((b) => b !== a && b.ms.length > a.ms.length && a.ms.every((m) => b.ms.includes(m))));
  for (let k = 1; k <= primes.length; k++) {
    let best = Infinity;
    const pick = (start, chosen) => {
      if (chosen.length === k) {
        if (ones.every((m) => chosen.some((p) => p.ms.includes(m)))) best = Math.min(best, chosen.reduce((s, p) => s + p.lits, 0));
        return;
      }
      for (let i = start; i < primes.length; i++) pick(i + 1, [...chosen, primes[i]]);
    };
    pick(0, []);
    if (best < Infinity) return { terms: k, literals: best };
  }
  return null;
}
