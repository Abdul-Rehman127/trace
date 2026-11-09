// The whole output panel of each logic tool as one node tree, from the raw input text, so
// the build (first paint) and the browser (as you type) produce exactly the same thing.
// Pure, no DOM.
import { parseExpr, toText } from './expr.mjs';
import { minimize } from './qm.mjs';
import { errorTree, truthTableTree, canonicalForms, qmRoundsTree, kmapTree, compareFunctions, equivalenceTableTree } from './views.mjs';
import { parseNumberList } from './share.mjs';

const N = (t, a, ...c) => ({ t, a: a || {}, c: c.flat().filter((x) => x !== null && x !== undefined && x !== '') });
const kv = (label, value) => N('div', null, N('dt', null, label), N('dd', null, N('span', { class: 'mono' }, value)));

/** Truth table tool. Returns { tree, ok }. */
export function truthOutput(src) {
  const p = parseExpr(src);
  if (p.error) return { ok: false, error: p, tree: errorTree(src, p.pos, p.error) };
  const c = canonicalForms(p.ast, p.vars);
  return {
    ok: true,
    tree: N(
      'div',
      null,
      N('dl', { class: 'net-rows lg-rows' }, kv('Read as', toText(p.ast)), kv('Variables', p.vars.length ? p.vars.join(', ') : 'none')),
      N('div', { class: 'table-scroll lg-scroll' }, truthTableTree(p.ast, p.vars)),
      N('dl', { class: 'net-rows lg-rows' }, kv('Sum of minterms', c.sop), kv('Product of maxterms', c.pos)),
    ),
  };
}

/**
 * Simplifier. Input { mode: 'expr', expr } or { mode: 'minterms', n, m, d }.
 * Returns { ok, tree, result }.
 */
export function simplifyOutput(input) {
  let vars;
  let ones;
  let dcs = [];
  if (input.mode === 'minterms') {
    const n = Number(input.n);
    if (!(n >= 1 && n <= 6)) return { ok: false, tree: N('p', { class: 'lg-error', role: 'alert' }, 'Choose 1 to 6 variables.') };
    vars = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, n);
    const m = parseNumberList(input.m, 2 ** n, 'minterm');
    if (m.error) return { ok: false, tree: N('p', { class: 'lg-error', role: 'alert' }, `Minterms: ${m.error}`) };
    const d = parseNumberList(input.d, 2 ** n, "don't-care");
    if (d.error) return { ok: false, tree: N('p', { class: 'lg-error', role: 'alert' }, `Don't-cares: ${d.error}`) };
    const clash = m.list.filter((x) => d.list.includes(x));
    if (clash.length) return { ok: false, tree: N('p', { class: 'lg-error', role: 'alert' }, `${clash.join(', ')} is listed as both a minterm and a don't-care.`) };
    ones = m.list;
    dcs = d.list;
  } else {
    const p = parseExpr(input.expr);
    if (p.error) return { ok: false, tree: errorTree(input.expr, p.pos, p.error) };
    vars = p.vars.length ? p.vars : ['A'];
    ones = canonicalForms(p.ast, vars).ones;
  }
  const r = minimize(vars, ones, dcs);
  const several = r.sop.length > 1;
  const kids = [
    N('dl', { class: 'net-rows lg-rows' }, kv('Variables', vars.join(', ')), kv('Sum of minterms', `Σm(${r.minterms.join(', ')})${dcs.length ? ` + d(${dcs.join(', ')})` : ''}`), kv('Product of maxterms', `ΠM(${r.maxterms.join(', ')})`)),
    N('h3', { class: 'label lg-h' }, several ? `${r.sop.length} minimal sums of products (all equally short)` : 'Minimal sum of products'),
    N('ul', { class: 'lg-answers' }, r.sop.map((s) => N('li', { class: 'mono' }, s))),
    several ? N('p', { class: 'lg-note' }, `There is more than one minimal answer: each uses ${r.sopCost.terms} terms and ${r.sopCost.literals} literals. Any of them is correct.`) : null,
    N('h3', { class: 'label lg-h' }, r.pos.length > 1 ? `${r.pos.length} minimal products of sums` : 'Minimal product of sums'),
    N('ul', { class: 'lg-answers' }, r.pos.map((s) => N('li', { class: 'mono' }, s))),
  ];
  if (vars.length >= 2 && vars.length <= 4) {
    kids.push(N('h3', { class: 'label lg-h' }, 'Karnaugh map'));
    kids.push(N('div', { class: 'table-scroll' }, kmapTree(vars, r.minterms, r.dontCares, r.sopCovers[0] || [])));
    kids.push(N('ul', { class: 'lg-groups' }, (r.sopCovers[0] || []).map((t, i) => N('li', null, N('span', { class: `gkey g${(i % 6) + 1}`, 'aria-hidden': 'true' }), `Group ${i + 1}: ${r.sop[0].split(' + ')[i] ?? t} covers ${termCells(t)}`))));
  }
  kids.push(N('h3', { class: 'label lg-h' }, 'Prime implicants'));
  kids.push(N('ul', { class: 'lg-primes' }, r.primes.map((t) => N('li', null, N('span', { class: 'mono' }, t), ` ${termAsProduct(t, vars)}${r.essentials.includes(t) ? ' (essential)' : ''}`))));
  kids.push(N('details', { class: 'lg-steps' }, N('summary', null, 'Quine-McCluskey steps'), qmRoundsTree(r.rounds)));
  return { ok: true, tree: N('div', null, kids), result: r };
}

const termCells = (t) => {
  const out = [];
  for (let m = 0; m < 2 ** t.length; m++) {
    const b = m.toString(2).padStart(t.length, '0');
    if ([...t].every((c, i) => c === '-' || c === b[i])) out.push(m);
  }
  return `cells ${out.join(', ')}`;
};
const termAsProduct = (t, vars) => [...t].map((c, i) => (c === '1' ? vars[i] : c === '0' ? `${vars[i]}'` : '')).join('') || '1';

/** Equivalence checker. Returns { ok, tree, equivalent }. */
export function equivalenceOutput(a, b) {
  const pa = parseExpr(a);
  if (pa.error) return { ok: false, tree: N('div', null, N('p', { class: 'lg-which' }, 'First expression:'), errorTree(a, pa.pos, pa.error)) };
  const pb = parseExpr(b);
  if (pb.error) return { ok: false, tree: N('div', null, N('p', { class: 'lg-which' }, 'Second expression:'), errorTree(b, pb.pos, pb.error)) };
  const vars = [...new Set([...pa.vars, ...pb.vars])].sort();
  if (vars.length > 6) return { ok: false, tree: N('p', { class: 'lg-error', role: 'alert' }, `Together the expressions use ${vars.length} variables. Trace handles up to 6.`) };
  const cmp = compareFunctions(pa.ast, pb.ast, vars);
  const verdict = cmp.equivalent
    ? N('p', { class: 'lg-verdict yes' }, `Equivalent: the two expressions agree on all ${2 ** vars.length} rows.`)
    : N('p', { class: 'lg-verdict no' }, `Not equivalent. The first row where they differ is row ${cmp.row}: ${vars.map((v) => `${v} = ${cmp.env[v] ? 1 : 0}`).join(', ')}, where the first gives ${cmp.a ? 1 : 0} and the second gives ${cmp.b ? 1 : 0}.`);
  return { ok: true, equivalent: cmp.equivalent, tree: N('div', null, verdict, N('div', { class: 'table-scroll lg-scroll' }, equivalenceTableTree(vars, cmp, 'First', 'Second'))) };
}
