// Build-time values for the logic templates (lg-table.html, lg-circuit.html) and the
// worked examples in src/content/logic/*.html.
import { parseExpr, toText, rowEnv } from '../js/engine/logic/expr.mjs';
import { layoutCircuit, circuitValues, gateList } from '../js/engine/logic/circuit.mjs';
import { circuitSvgTree, gateTableTree } from '../js/engine/logic/views.mjs';
import { truthOutput, simplifyOutput, equivalenceOutput } from '../js/engine/logic/outputs.mjs';
import { minimize } from '../js/engine/logic/qm.mjs';
import { narrateLevel, gateRows } from '../js/engine/logic/narrate.mjs';
import { treeToHtml } from '../js/engine/memory/table.mjs';
import { selector, transportHtml } from './parts.mjs';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const html = (nodes) => (Array.isArray(nodes) ? nodes : [nodes]).map(treeToHtml).join('');

const LG = '/logic/';
export const LOGIC_LINKS = [
  { alg: 'table', label: 'Truth table', path: `${LG}truth-table/` },
  { alg: 'circuit', label: 'Circuit', path: `${LG}circuit/` },
  { alg: 'simplify', label: 'Simplifier', path: `${LG}simplifier/` },
  { alg: 'equiv', label: 'Equivalence', path: `${LG}equivalence/` },
];

export const LOGIC_DEFAULTS = {
  table: '(A AND B) OR NOT C',
  circuit: 'A XOR B XOR C',
  simplify: "A'B'C' + A'B'C + A'BC' + AB'C + ABC' + ABC",
  equivA: 'NOT (A AND B)',
  equivB: 'NOT A OR NOT B',
};

const EXAMPLES = {
  table: [['De Morgan', 'NOT (A AND B)'], ['Full adder sum', 'A XOR B XOR C'], ['Majority', 'AB + AC + BC'], ['Implication', "A' + B"]],
  circuit: [['Full adder sum', 'A XOR B XOR C'], ['Carry', 'AB + C(A XOR B)'], ['NAND only', '(A NAND A) NAND (B NAND B)'], ['Multiplexer', "S'A + SB"]],
  simplify: [['Two answers', "A'B'C' + A'B'C + A'BC' + AB'C + ABC' + ABC"], ['BD + B’D’', "A'B'C'D' + A'B'CD' + A'BC'D + A'BCD + AB'C'D' + AB'CD' + ABC'D + ABCD"], ['Majority', 'AB + AC + BC'], ['Full adder sum', 'A XOR B XOR C']],
  equiv: [['De Morgan', 'NOT (A AND B)', 'NOT A OR NOT B'], ['Absorption', 'A OR (A AND B)', 'A'], ['XOR as AND-OR', 'A XOR B', "AB' + A'B"], ['Not equal', 'A OR B', 'A XOR B']],
};

const COPY_CHIP = `<button type="button" class="chip chip-link" data-copy>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>
              <span>Copy link</span>
            </button>`;
const COPY_FALLBACK = `<div class="copy-fallback" data-copy-fallback hidden>
            <label for="share-url">Copy this link</label>
            <input id="share-url" type="text" readonly data-copy-field>
          </div>`;

const exprField = (id, label, value, hint = 'For example (A AND B) OR NOT C, or AB + C\'') => `          <div class="field field-stack">
            <div><label for="${id}">${esc(label)}</label><small id="${id}-hint">${esc(hint)}</small></div>
            <textarea class="text-in" id="${id}" data-lg-field="${id}" rows="1" autocomplete="off" spellcheck="false" aria-describedby="${id}-hint">${esc(value)}</textarea>
          </div>`;

const sentencesHtml = (sentences) => sentences.map((parts) => parts.map((p) => (typeof p === 'string' ? esc(p) : `<strong>${esc(p.pid)}</strong>`)).join('')).join(' ');

export function logicData(page) {
  const base = { selector: selector({ ...page, algorithm: page.tool }, LOGIC_LINKS), copyChip: COPY_CHIP, copyFallback: COPY_FALLBACK };
  const chips = (list, attrs) => list.map((x) => `<button type="button" class="chip" ${attrs(x)}>${esc(x[0])}</button>`).join('\n            ');
  if (page.tool === 'table') {
    return { ...base, toolKind: 'lg-table', inputLabel: 'Expression', outputLabel: 'Truth table', fields: exprField('lg-expr', 'Boolean expression', LOGIC_DEFAULTS.table), examples: chips(EXAMPLES.table, (x) => `data-expr="${esc(x[1])}"`), output: treeToHtml(truthOutput(LOGIC_DEFAULTS.table).tree) };
  }
  if (page.tool === 'simplify') {
    const fields = `${exprField('lg-expr', 'Expression to simplify', LOGIC_DEFAULTS.simplify)}
          <details class="lg-mterm" data-lg-mterm>
            <summary>Or enter minterms instead</summary>
            <div class="field"><div><label for="lg-n">Variables</label><small id="lg-n-hint">1 to 6, named A, B, C, ...</small></div><input class="num" id="lg-n" data-lg-n type="text" inputmode="numeric" value="4" aria-describedby="lg-n-hint"></div>
            <div class="field field-stack"><div><label for="lg-m">Minterms</label><small id="lg-m-hint">Row numbers where the output is 1, such as 0, 2, 5, 7</small></div><textarea class="text-in" id="lg-m" data-lg-m rows="1" aria-describedby="lg-m-hint"></textarea></div>
            <div class="field field-stack"><div><label for="lg-d">Don't-cares</label><small id="lg-d-hint">Optional rows that may be 0 or 1</small></div><textarea class="text-in" id="lg-d" data-lg-d rows="1" aria-describedby="lg-d-hint"></textarea></div>
            <button type="button" class="btn-line" data-lg-use-m>Simplify these minterms</button>
          </details>`;
    return { ...base, toolKind: 'lg-simplify', inputLabel: 'Function', outputLabel: 'Simplified', fields, examples: chips(EXAMPLES.simplify, (x) => `data-expr="${esc(x[1])}"`), output: treeToHtml(simplifyOutput({ mode: 'expr', expr: LOGIC_DEFAULTS.simplify }).tree) };
  }
  if (page.tool === 'equiv') {
    const fields = `${exprField('lg-a', 'First expression', LOGIC_DEFAULTS.equivA, 'For example NOT (A AND B)')}\n${exprField('lg-b', 'Second expression', LOGIC_DEFAULTS.equivB, 'For example NOT A OR NOT B')}`;
    return { ...base, toolKind: 'lg-equiv', inputLabel: 'Expressions', outputLabel: 'Result', fields, examples: chips(EXAMPLES.equiv, (x) => `data-a="${esc(x[1])}" data-b="${esc(x[2])}"`), output: treeToHtml(equivalenceOutput(LOGIC_DEFAULTS.equivA, LOGIC_DEFAULTS.equivB).tree) };
  }
  // circuit
  const p = parseExpr(LOGIC_DEFAULTS.circuit);
  const lay = layoutCircuit(p.ast);
  const env = rowEnv(p.vars, 0);
  const vals = circuitValues(lay, env);
  const sizers = [];
  for (const ex of EXAMPLES.circuit) {
    const q = parseExpr(ex[1]);
    const l = layoutCircuit(q.ast);
    const before = circuitValues(l, rowEnv(q.vars, 0));
    const after = circuitValues(l, rowEnv(q.vars, 2 ** q.vars.length - 1));
    for (let k = 0; k <= l.depth; k++) sizers.push(sentencesHtml(narrateLevel(l, before, after, k, q.vars[0])));
  }
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  return {
    ...base,
    fields: exprField('lg-expr', 'Boolean expression', LOGIC_DEFAULTS.circuit),
    switches: p.vars.map((v) => `<button type="button" class="lg-switch" data-var="${v}" aria-pressed="false"><span class="lg-sw-name">${v}</span><span class="lg-sw-val">0</span></button>`).join(''),
    examples: chips(EXAMPLES.circuit, (x) => `data-expr="${esc(x[1])}"`),
    transport: transportHtml('level', lay.depth),
    circuit: treeToHtml(circuitSvgTree(lay, vals)),
    whyText: 'Switch an input to send a change through the circuit.',
    whySizers: [...new Set(sizers)].sort((a, b) => plain(b).length - plain(a).length).slice(0, 3).map((t) => `<p>${t}</p>`).join(''),
    q: `Q = ${vals[lay.root] ? 1 : 0}`,
    gates: gateList(lay).map((g) => `<li class="mono">${esc(g)}</li>`).join(''),
    gateTable: treeToHtml(gateTableTree(gateRows(lay, vals))),
  };
}

/** Worked-example values for the content pages. */
export function logicContentData(key) {
  const out = {};
  if (key === 'logic/table') out.example = `<div class="table-scroll lg-scroll">${html(truthOutput('A XOR B').tree.c[1].c)}</div>`;
  if (key === 'logic/simplify') {
    const r = minimize(['A', 'B', 'C', 'D'], [0, 2, 5, 7, 8, 10, 13, 15]);
    out.exSop = r.sop[0];
    out.exPrimes = String(r.primes.length);
    const two = minimize(['A', 'B', 'C'], [0, 1, 2, 5, 6, 7]);
    out.exTwoA = two.sop[0];
    out.exTwoB = two.sop[1];
    out.exTwoPrimes = String(two.primes.length);
  }
  if (key === 'logic/equiv') {
    const r = equivalenceOutput('A OR B', 'A XOR B');
    out.exDiff = r.tree.c[0].c[0];
  }
  if (key === 'logic/circuit') {
    const p = parseExpr('A XOR B XOR C');
    out.exGates = gateList(layoutCircuit(p.ast)).map((g) => `<li><code>${esc(g)}</code></li>`).join('');
    out.exText = toText(p.ast);
  }
  return out;
}
