// Truth table, simplifier and equivalence: the output panel updates as the visitor types.
// The engine builds the whole panel as one tree (src/js/engine/logic/outputs.mjs).
import { truthOutput, simplifyOutput, equivalenceOutput } from '../../engine/logic/outputs.mjs';
import { readParams, getParam, enc } from '../../engine/logic/share.mjs';
import { fromTree, createToast, bindCopy, autoGrow, replaceQuery } from '../dom.mjs';

const DEFAULTS = {
  'lg-table': { e: '(A AND B) OR NOT C' },
  'lg-simplify': { e: "A'B'C' + A'B'C + A'BC' + AB'C + ABC' + ABC" },
  'lg-equiv': { a: 'NOT (A AND B)', b: 'NOT A OR NOT B' },
};

export function mountLogic(root) {
  const kind = root.dataset.tool;
  const out = root.querySelector('[data-lg-out]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const field = (id) => root.querySelector(`[data-lg-field="${id}"]`);
  const fields = kind === 'lg-equiv' ? { a: field('lg-a'), b: field('lg-b') } : { e: field('lg-expr') };
  const grows = Object.fromEntries(Object.entries(fields).map(([k, el]) => [k, autoGrow(el)]));
  const params = readParams(window.location.search);
  let mode = 'expr';
  let lastQuery = '';
  let result = null;

  // Minterm mode (simplifier only).
  const mEls = { n: root.querySelector('[data-lg-n]'), m: root.querySelector('[data-lg-m]'), d: root.querySelector('[data-lg-d]') };
  if (mEls.m) {
    autoGrow(mEls.m);
    autoGrow(mEls.d);
  }

  function query() {
    if (kind === 'lg-equiv') return `a=${enc(fields.a.value.trim())}&b=${enc(fields.b.value.trim())}`;
    if (mode === 'minterms') return `n=${enc(mEls.n.value.trim())}&m=${enc(mEls.m.value.trim())}${mEls.d.value.trim() ? `&d=${enc(mEls.d.value.trim())}` : ''}`;
    return `e=${enc(fields.e.value.trim())}`;
  }

  let urlTimer = 0;
  function render({ fromUser }) {
    if (kind === 'lg-table') result = truthOutput(fields.e.value);
    else if (kind === 'lg-equiv') result = equivalenceOutput(fields.a.value, fields.b.value);
    else result = mode === 'minterms' ? simplifyOutput({ mode, n: mEls.n.value, m: mEls.m.value, d: mEls.d.value }) : simplifyOutput({ mode: 'expr', expr: fields.e.value });
    for (const el of Object.values(fields)) el.setAttribute('aria-invalid', String(!result.ok && mode === 'expr'));
    out.replaceChildren(fromTree(result.tree));
    if (fromUser) {
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => {
        lastQuery = query();
        replaceQuery(lastQuery);
      }, 400);
    }
  }

  for (const el of Object.values(fields)) {
    el.addEventListener('input', () => {
      mode = 'expr';
      render({ fromUser: true });
    });
  }
  if (mEls.m) {
    root.querySelector('[data-lg-use-m]').addEventListener('click', () => {
      mode = 'minterms';
      render({ fromUser: true });
    });
    for (const el of Object.values(mEls)) el.addEventListener('input', () => mode === 'minterms' && render({ fromUser: true }));
  }
  for (const chip of root.querySelectorAll('[data-expr], [data-a]')) {
    chip.addEventListener('click', () => {
      mode = 'expr';
      if (kind === 'lg-equiv') {
        fields.a.value = chip.dataset.a;
        fields.b.value = chip.dataset.b;
      } else fields.e.value = chip.dataset.expr;
      for (const g of Object.values(grows)) g();
      render({ fromUser: true });
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${query()}`, toast);

  // Starting values: the link, else the page default.
  const def = DEFAULTS[kind];
  if (kind === 'lg-equiv') {
    fields.a.value = getParam(params, 'a') ?? def.a;
    fields.b.value = getParam(params, 'b') ?? def.b;
  } else if (kind === 'lg-simplify' && getParam(params, 'm') !== null) {
    mode = 'minterms';
    mEls.n.value = getParam(params, 'n') ?? '4';
    mEls.m.value = getParam(params, 'm') ?? '';
    mEls.d.value = getParam(params, 'd') ?? '';
    root.querySelector('[data-lg-mterm]').open = true;
  } else fields.e.value = getParam(params, 'e') ?? def.e;
  for (const g of Object.values(grows)) g();
  render({ fromUser: false });
  return { get result() {
    return result;
  }, get mode() {
    return mode;
  }, get query() {
    return lastQuery;
  } };
}
