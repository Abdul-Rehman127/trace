// Node trees ({ t, a, c }) for the logic tools, shared by the build and the browser.
// Pure, no DOM.
import { truthColumn, rowEnv, toText, subexpressions, evaluate } from './expr.mjs';
import { termMinterms, kmapLayout } from './qm.mjs';
import { GATE_W, GATE_H } from './circuit.mjs';

const N = (t, a, ...c) => ({ t, a: a || {}, c: c.flat().filter((x) => x !== null && x !== undefined && x !== '') });
const B = (v) => (v ? '1' : '0');

/** The input with a marker under the error position (monospace, so columns line up). */
export function errorTree(src, pos, message) {
  const line = src.replace(/\n/g, ' ');
  return N(
    'div',
    { class: 'lg-error', role: 'alert' },
    N('p', null, message),
    N('pre', { class: 'lg-caret', 'aria-hidden': 'true' }, `${line}\n${' '.repeat(Math.max(0, pos - 1))}^`),
  );
}

/** Truth table: variables, every subexpression, and the output (the last column). */
export function truthTableTree(ast, vars) {
  const subs = subexpressions(ast);
  const cols = subs.map((n) => ({ label: toText(n), node: n }));
  const head = N('tr', null, ...vars.map((v) => N('th', { scope: 'col', class: 'v' }, v)), N('th', { scope: 'col', class: 'm' }, 'Row'), ...cols.map((c, i) => N('th', { scope: 'col', class: i === cols.length - 1 ? 'out' : 'sub' }, c.label)));
  const rows = [];
  for (let r = 0; r < 2 ** vars.length; r++) {
    const env = rowEnv(vars, r);
    rows.push(
      N(
        'tr',
        null,
        ...vars.map((v) => N('td', { class: 'v' }, B(env[v]))),
        N('td', { class: 'm' }, String(r)),
        ...cols.map((c, i) => {
          const v = evaluate(c.node, env);
          return N('td', { class: `${i === cols.length - 1 ? 'out' : 'sub'} ${v ? 'is1' : 'is0'}` }, B(v));
        }),
      ),
    );
  }
  return N('table', { class: 'lg-table' }, N('caption', { class: 'sr-only' }, `Truth table of ${toText(ast)}, with every part of the expression as a column`), N('thead', null, head), N('tbody', null, rows));
}

/** Canonical forms as text: { sop: 'Σm(1, 3)', pos: 'ΠM(0, 2)', ones, zeros }. */
export function canonicalForms(ast, vars) {
  const out = truthColumn(ast, vars);
  const ones = out.flatMap((v, i) => (v ? [i] : []));
  const zeros = out.flatMap((v, i) => (v ? [] : [i]));
  return { ones, zeros, sop: `Σm(${ones.join(', ')})`, pos: `ΠM(${zeros.join(', ')})` };
}

// ---------- circuit ----------

function gateShape(op, x, y) {
  const w = GATE_W;
  const h = GATE_H;
  const top = y - h / 2;
  const bot = y + h / 2;
  const bubble = ['NAND', 'NOR', 'XNOR', 'NOT'].includes(op);
  const bw = bubble ? w - 8 : w; // body width before the bubble
  const parts = [];
  if (op === 'AND' || op === 'NAND') parts.push(N('path', { d: `M${x} ${top}H${x + bw / 2}A${h / 2} ${h / 2} 0 0 1 ${x + bw / 2} ${bot}H${x}Z`, class: 'g-body' }));
  if (op === 'OR' || op === 'NOR' || op === 'XOR' || op === 'XNOR') {
    parts.push(N('path', { d: `M${x} ${top}Q${x + bw * 0.35} ${y} ${x} ${bot}Q${x + bw * 0.65} ${bot} ${x + bw} ${y}Q${x + bw * 0.65} ${top} ${x} ${top}Z`, class: 'g-body' }));
    if (op === 'XOR' || op === 'XNOR') parts.push(N('path', { d: `M${x - 7} ${top}Q${x - 7 + bw * 0.35} ${y} ${x - 7} ${bot}`, class: 'g-line' }));
  }
  if (op === 'NOT') parts.push(N('path', { d: `M${x} ${top + 4}L${x + bw} ${y}L${x} ${bot - 4}Z`, class: 'g-body' }));
  if (bubble) parts.push(N('circle', { cx: String(x + bw + 4), cy: String(y), r: '4', class: 'g-body' }));
  return parts;
}

/**
 * The circuit as an SVG tree. `values` are the node values to show; elements carry
 * data-node so the app can change a value's look without rebuilding.
 */
export function circuitSvgTree(layout, values) {
  const kids = [];
  layout.wires.forEach((w) => kids.push(N('path', { d: w.d, class: `wire ${values[w.from] ? 'on' : 'off'}`, 'data-from': String(w.from) })));
  for (const n of layout.nodes) {
    const v = values[n.id];
    if (n.kind === 'gate') {
      kids.push(N('g', { class: `gate ${v ? 'on' : 'off'}`, 'data-node': String(n.id) }, ...gateShape(n.op, n.x, n.y), N('text', { x: String(n.x + GATE_W / 2 - 6), y: String(n.y - GATE_H / 2 - 4), class: 'g-name', 'text-anchor': 'middle' }, n.name), N('text', { x: String(n.x + GATE_W + 10), y: String(n.y - 6), class: 'g-val' }, B(v))));
    } else {
      const label = n.kind === 'input' ? n.name : B(n.v);
      kids.push(N('g', { class: `term ${v ? 'on' : 'off'}`, 'data-node': String(n.id) }, N('text', { x: String(n.x), y: String(n.y + 5), class: 'g-in' }, label), N('circle', { cx: String(n.x + 26), cy: String(n.y), r: '4', class: 'g-pin' }), N('text', { x: String(n.x + 12), y: String(n.y - 10), class: 'g-val' }, B(v))));
    }
  }
  const out = values[layout.root];
  kids.push(N('g', { class: `term out ${out ? 'on' : 'off'}`, 'data-node': 'out' }, N('circle', { cx: String(layout.outX - 4), cy: String(layout.nodes[layout.root].y), r: '5', class: 'g-pin' }), N('text', { x: String(layout.outX + 6), y: String(layout.nodes[layout.root].y + 5), class: 'g-out' }, `Q = ${B(out)}`)));
  return N('svg', { class: 'circuit', viewBox: `0 0 ${layout.width} ${layout.height}`, width: String(layout.width), height: String(layout.height), role: 'img', 'aria-label': 'Circuit diagram; the gate list and the table of gate outputs below describe the same circuit.' }, kids);
}

// ---------- simplifier ----------

/** The Quine-McCluskey rounds as tables: one table per round, rows grouped by number of ones. */
export function qmRoundsTree(rounds) {
  return rounds.map((round, i) =>
    N(
      'div',
      { class: 'qm-round' },
      N('h3', { class: 'label' }, i === 0 ? 'Round 1: minterms grouped by number of ones' : `Round ${i + 1}: pairs from round ${i} that differ in one bit`),
      N(
        'table',
        { class: 'data qm-table' },
        N('thead', null, N('tr', null, N('th', { scope: 'col' }, 'Ones'), N('th', { scope: 'col' }, 'Term'), N('th', { scope: 'col' }, 'Covers'), N('th', { scope: 'col' }, 'Combined'))),
        N('tbody', null, round.flatMap((g) => g.terms.map((t, j) => N('tr', { class: j === 0 ? 'grp' : null }, N('td', null, j === 0 ? String(g.ones) : ''), N('td', { class: 'mono' }, t.term), N('td', null, t.from.join(', ')), N('td', null, t.used ? 'yes' : 'no, a prime implicant'))))),
      ),
    ),
  );
}

/** Karnaugh map for 2 to 4 variables, with each term of the cover drawn as a group. */
export function kmapTree(vars, ones, dcs, cover) {
  const n = vars.length;
  const { rowBits, rows, cols, cells } = kmapLayout(n);
  const rowVars = vars.slice(0, rowBits).join('');
  const colVars = vars.slice(rowBits).join('');
  const groups = cover.map((term) => new Set(termMinterms(term)));
  const head = N('tr', null, N('th', { scope: 'col', class: 'corner' }, `${rowVars} \\ ${colVars}`), ...cols.map((c) => N('th', { scope: 'col' }, c)));
  const body = rows.map((r, ri) =>
    N(
      'tr',
      null,
      N('th', { scope: 'row' }, r),
      ...cols.map((c, ci) => {
        const m = cells[ri][ci];
        const v = ones.includes(m) ? '1' : dcs.includes(m) ? 'X' : '0';
        const marks = groups.flatMap((g, gi) => (g.has(m) ? [N('span', { class: `gm g${(gi % 6) + 1}`, 'aria-hidden': 'true' })] : []));
        return N('td', { class: `k${v}` }, ...marks, N('span', { class: 'kv' }, v), N('span', { class: 'km' }, String(m)));
      }),
    ),
  );
  return N('table', { class: 'kmap' }, N('caption', { class: 'sr-only' }, `Karnaugh map, rows ${rowVars}, columns ${colVars}, in Gray code order`), N('thead', null, head), N('tbody', null, body));
}

// ---------- equivalence ----------

/** Compare two functions over the union of their variables. */
export function compareFunctions(a, b, vars) {
  const ca = truthColumn(a, vars);
  const cb = truthColumn(b, vars);
  const diff = ca.findIndex((v, i) => v !== cb[i]);
  return { equivalent: diff === -1, row: diff, a: diff >= 0 ? ca[diff] : null, b: diff >= 0 ? cb[diff] : null, env: diff >= 0 ? rowEnv(vars, diff) : null, ca, cb };
}

export function equivalenceTableTree(vars, cmp, labelA, labelB) {
  const head = N('tr', null, ...vars.map((v) => N('th', { scope: 'col', class: 'v' }, v)), N('th', { scope: 'col' }, labelA), N('th', { scope: 'col' }, labelB), N('th', { scope: 'col' }, 'Same?'));
  const rows = cmp.ca.map((va, r) => {
    const env = rowEnv(vars, r);
    const same = va === cmp.cb[r];
    return N('tr', { class: same ? null : 'differs' }, ...vars.map((v) => N('td', { class: 'v' }, B(env[v]))), N('td', null, B(va)), N('td', null, B(cmp.cb[r])), N('td', null, same ? 'yes' : 'no'));
  });
  return N('table', { class: 'lg-table' }, N('caption', { class: 'sr-only' }, 'Both expressions on every row'), N('thead', null, head), N('tbody', null, rows));
}

/** Every gate's inputs and output as a table (the text equivalent of the diagram). */
export function gateTableTree(rows) {
  return N(
    'table',
    { class: 'data lg-gate-table' },
    N('caption', { class: 'sr-only' }, 'Each gate with its inputs and output for the current input values'),
    N('thead', null, N('tr', null, N('th', { scope: 'col' }, 'Gate'), N('th', { scope: 'col' }, 'Kind'), N('th', { scope: 'col' }, 'Inputs'), N('th', { scope: 'col' }, 'Output'))),
    N('tbody', null, rows.map((r) => N('tr', null, N('th', { scope: 'row' }, r.name), N('td', null, r.op), N('td', { class: 'mono' }, r.ins), N('td', { class: 'mono' }, r.out)))),
  );
}
