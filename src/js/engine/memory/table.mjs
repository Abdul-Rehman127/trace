// The page replacement step table as a plain node tree: { t: tag, a: attrs, c: children }
// with strings as text. The build serializes it to HTML (worked examples, first paint)
// and the browser turns it into DOM with createElement, so both always match.
// Pure, no DOM.

const N = (t, a, ...c) => ({ t, a: a || {}, c: c.flat().filter((x) => x !== null && x !== undefined && x !== '') });
const SR = (text) => N('span', { class: 'sr-only' }, text);

/**
 * @param {object} result  from simulatePaging()
 * @param {{ id?: string, k?: number, caption?: string }} opts  k: steps shown (all when omitted)
 */
export function pagingTableTree(result, { id = '', k, caption } = {}) {
  const n = result.frames;
  const steps = result.steps;
  const clock = result.algorithm === 'clock';
  const shown = k === undefined ? steps.length : k;
  // Column state classes: "fut" hides a body cell not yet reached, "now" marks the current step.
  // A static table (k omitted, as in worked examples) shows every column and marks none as current.
  const live = k !== undefined;
  const state = (col, body) => [body && col >= shown ? 'fut' : '', live && col === shown - 1 ? 'now' : ''].filter(Boolean);
  const withState = (col, body, extra) => {
    const cls = [...(extra ? [extra] : []), ...state(col, body)].join(' ');
    return cls ? { class: cls } : null;
  };

  const head = N(
    'thead',
    null,
    N('tr', { class: 'pg-step' }, N('th', { scope: 'row' }, 'Step'), steps.map((s, c) => N('th', { scope: 'col', ...withState(c, false) }, String(s.i + 1)))),
    N('tr', { class: 'pg-ref' }, N('th', { scope: 'row' }, 'Page'), steps.map((s, c) => N('td', withState(c, false), String(s.page)))),
  );

  const frameRows = [];
  for (let f = 0; f < n; f++) {
    frameRows.push(
      N(
        'tr',
        { class: 'pg-frame' },
        N('th', { scope: 'row' }, `Frame ${f}`),
        steps.map((s, c) => {
          const page = s.frames[f];
          if (page === null) return N('td', withState(c, true));
          const loaded = !s.hit && s.slot === f;
          const hit = s.hit && s.slot === f;
          const cls = loaded ? 'new' : hit ? 'hit' : null;
          return N(
            'td',
            withState(c, true, cls),
            N('span', null, String(page)),
            clock ? N('span', { class: 'bit' }, SR(', bit '), String(s.bits[f])) : null,
            loaded ? SR(', loaded') : hit ? SR(', hit') : null,
          );
        }),
      ),
    );
  }

  const result_ = N(
    'tr',
    { class: 'pg-res' },
    N('th', { scope: 'row' }, 'Result'),
    steps.map((s, c) => N('td', withState(c, true, s.hit ? 'h' : 'f'), N('span', { 'aria-hidden': 'true' }, s.hit ? 'H' : 'F'), SR(s.hit ? 'Hit' : 'Fault'))),
  );
  const evicted = N(
    'tr',
    { class: 'pg-ev' },
    N('th', { scope: 'row' }, 'Evicted'),
    steps.map((s, c) => N('td', withState(c, true), s.evicted === null ? null : N('span', null, String(s.evicted)))),
  );
  const rows = [...frameRows, result_, evicted];
  if (clock) {
    rows.push(N('tr', { class: 'pg-ptr' }, N('th', { scope: 'row' }, 'Pointer'), steps.map((s, c) => N('td', withState(c, true), N('span', null, String(s.pointer))))));
  }

  const attrs = { class: `pg${clock ? ' pg-clock' : ''}`, 'data-k': String(shown), 'data-cols': String(steps.length) };
  if (id) attrs.id = id;
  return N('table', attrs, caption ? N('caption', { class: 'sr-only' }, caption) : null, head, N('tbody', null, rows));
}

/** Serialize a node tree to HTML (for the build). Escapes all text and attributes. */
export function treeToHtml(node) {
  if (typeof node === 'string') return esc(node);
  const attrs = Object.entries(node.a).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  return `<${node.t}${attrs}>${node.c.map(treeToHtml).join('')}</${node.t}>`;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
