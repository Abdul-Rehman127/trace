// Share links for the logic tools. Expressions are URI-encoded; decoding never throws.
//   Truth table, circuit:  ?e=<expression>          (circuit also &in=<bits for A, B, ...>)
//   Simplifier:            ?e=<expression>  or  ?n=4&m=0,2,5&d=1
//   Equivalence:           ?a=<expression>&b=<expression>

const MAX_QUERY = 2048;

export function readParams(search) {
  const text = typeof search === 'string' ? search : '';
  if (text.length > MAX_QUERY) return null;
  try {
    return new URLSearchParams(text.startsWith('?') ? text.slice(1) : text);
  } catch {
    return null;
  }
}

export const getParam = (p, k) => {
  if (!p) return null;
  try {
    const v = p.get(k);
    return v === null ? null : v.slice(0, 300);
  } catch {
    return null;
  }
};

export const enc = (s) => encodeURIComponent(s).replace(/%20/g, '+');

/** Parse a list of whole numbers "0, 2, 5" below a limit. Returns { list, error }. */
export function parseNumberList(raw, below, label) {
  const s = String(raw ?? '').trim();
  if (!s) return { list: [], error: null };
  const parts = s.split(/[\s,]+/).filter(Boolean);
  const list = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) >= below) return { list: null, error: `"${p}" is not a valid ${label}. Use whole numbers from 0 to ${below - 1}.` };
    list.push(Number(p));
  }
  return { list: [...new Set(list)].sort((a, b) => a - b), error: null };
}
