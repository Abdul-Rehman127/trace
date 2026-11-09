// Share links for page replacement: ?alg=fifo&f=3&r=7,0,1,2 (and bit=0 for Clock
// when a new page starts with reference bit 0). Decoding never throws: unreadable
// parts fall back to the page default and are reported as notices.

import { PAGING_ALGORITHMS } from './paging.mjs';
import { parseRefs, parseFrames } from './validate.mjs';

const MAX_QUERY = 2048;

/** Query string (without "?") for a validated input. */
export function encodePaging({ algorithm, refs, frames, options = {} }) {
  const params = [`alg=${algorithm}`, `f=${frames}`, `r=${refs.join(',')}`];
  if (algorithm === 'clock' && options.newBit === 0) params.push('bit=0');
  return params.join('&');
}

/**
 * @param {string} search  location.search, with or without "?"
 * @param {{ algorithm, refs, frames, options }} fallback
 * @returns {{ input, notices: string[], found: boolean }}
 */
export function decodePaging(search, fallback) {
  const input = { algorithm: fallback.algorithm, refs: fallback.refs.slice(), frames: fallback.frames, options: { newBit: 1, ...fallback.options } };
  const notices = [];
  let params;
  try {
    const text = typeof search === 'string' ? search : '';
    if (text.length > MAX_QUERY) return { input, notices: ['This link is too long to read, so the default example is shown.'], found: false };
    params = new URLSearchParams(text.startsWith('?') ? text.slice(1) : text);
  } catch {
    return { input, notices: ['This link could not be read, so the default example is shown.'], found: false };
  }
  const get = (k) => {
    try {
      return params.get(k);
    } catch {
      return null;
    }
  };
  let found = false;

  const alg = get('alg');
  if (alg !== null) {
    if (PAGING_ALGORITHMS.includes(alg)) {
      input.algorithm = alg;
      found = true;
    } else notices.push('The algorithm in this link is not known, so the page default is used.');
  }
  const r = get('r');
  if (r !== null) {
    const parsed = parseRefs(r);
    if (parsed.error) notices.push(`The page references in this link could not be used: ${parsed.error}`);
    else {
      input.refs = parsed.refs;
      found = true;
    }
  }
  const f = get('f');
  if (f !== null) {
    const parsed = parseFrames(f);
    if (parsed.error) notices.push(`The frame count in this link could not be used: ${parsed.error}`);
    else {
      input.frames = parsed.frames;
      found = true;
    }
  }
  const bit = get('bit');
  if (bit !== null) {
    if (bit === '0' || bit === '1') {
      input.options.newBit = Number(bit);
      found = true;
    } else notices.push('The reference bit setting in this link is not 0 or 1, so 1 is used.');
  }
  return { input, notices, found };
}
