// Input validation for page replacement. Pure, no DOM. Every limit has a specific
// message in the same voice as the scheduling section. Nothing is clamped silently.

import { PAGING_ALGORITHMS } from './paging.mjs';

export const PAGE_LIMITS = { page: [0, 99], refs: [1, 40], frames: [1, 8] };

const [PMIN, PMAX] = PAGE_LIMITS.page;
const [, RMAX] = PAGE_LIMITS.refs;
const [FMIN, FMAX] = PAGE_LIMITS.frames;

export const FRAMES_MESSAGE = `Frames must be a whole number from ${FMIN} to ${FMAX}.`;

/**
 * Parse a reference string typed by a person: page numbers separated by commas,
 * spaces or both. Returns { refs, error }.
 */
export function parseRefs(raw) {
  if (typeof raw !== 'string') return { refs: null, error: 'Enter at least one page number.' };
  const tokens = raw.split(/[\s,]+/).filter((t) => t !== '');
  if (tokens.length === 0) return { refs: null, error: 'Enter at least one page number.' };
  const refs = [];
  for (const t of tokens) {
    if (!/^\d{1,6}$/.test(t)) {
      const shown = t.length > 12 ? `${t.slice(0, 12)}...` : t;
      return { refs: null, error: `"${shown}" is not a page number. Use whole numbers from ${PMIN} to ${PMAX}, separated by commas or spaces.` };
    }
    const n = Number(t);
    if (n < PMIN || n > PMAX) return { refs: null, error: `Page ${n} is out of range. Use whole numbers from ${PMIN} to ${PMAX}.` };
    refs.push(n);
  }
  if (refs.length > RMAX) return { refs: null, error: `Use at most ${RMAX} page references. This string has ${refs.length}.` };
  return { refs, error: null };
}

/** Parse the frame count. Returns { frames, error }. */
export function parseFrames(raw) {
  const s = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
  if (!/^\d{1,3}$/.test(s)) return { frames: null, error: FRAMES_MESSAGE };
  const n = Number(s);
  if (n < FMIN || n > FMAX) return { frames: null, error: FRAMES_MESSAGE };
  return { frames: n, error: null };
}

/**
 * Validate a full input { algorithm, refs (string or array), frames, options }.
 * Returns { ok, errors: [{ path, message }], value }.
 */
export function validatePaging(input) {
  const errors = [];
  const algorithm = PAGING_ALGORITHMS.includes(input?.algorithm) ? input.algorithm : null;
  if (!algorithm) errors.push({ path: 'algorithm', message: 'Choose FIFO, LRU, Optimal or Clock.' });
  const r = parseRefs(Array.isArray(input?.refs) ? input.refs.join(',') : input?.refs);
  if (r.error) errors.push({ path: 'refs', message: r.error });
  const f = parseFrames(input?.frames);
  if (f.error) errors.push({ path: 'frames', message: f.error });
  const newBit = input?.options?.newBit === 0 ? 0 : 1;
  if (errors.length) return { ok: false, errors, value: null };
  return { ok: true, errors, value: { algorithm, refs: r.refs, frames: f.frames, options: { newBit } } };
}
