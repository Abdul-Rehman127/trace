// The page replacement input panel: reference string, frame count, Clock bit, presets.
// Validates as the visitor types and reports a valid input (or null) through onChange.
import { parseRefs, parseFrames } from '../../engine/memory/validate.mjs';
import { PAGING_PRESETS } from '../../engine/memory/presets.mjs';
import { autoGrow } from '../dom.mjs';

const BIT_HINT = {
  1: 'A page gets bit 1 when it is loaded, so it starts with a second chance. Some courses start it at 0.',
  0: 'A page gets bit 0 when it is loaded, so only a later hit gives it a second chance. Some courses start it at 1.',
};

/**
 * @param {HTMLElement} root
 * @param {{ initial: { refs, frames, options }, onChange(input|null, reason: string) }} opts
 */
export function createPagingInputs(root, { initial, onChange }) {
  const refsEl = root.querySelector('[data-pg-refs]');
  const framesEl = root.querySelector('[data-pg-frames]');
  const refsErr = root.querySelector('#pg-refs-err');
  const framesErr = root.querySelector('#pg-frames-err');
  const bitButtons = [...root.querySelectorAll('[data-bit] button')];
  const bitHint = root.querySelector('[data-bit-hint]');
  const presetChips = [...root.querySelectorAll('[data-preset]')];

  let newBit = initial.options?.newBit === 0 ? 0 : 1;

  const grow = autoGrow(refsEl);
  let last = null;

  function showError(el, errEl, message) {
    if (message) {
      errEl.textContent = message;
      errEl.hidden = false;
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', `${el.id}-hint ${errEl.id}`);
    } else {
      errEl.hidden = true;
      errEl.textContent = '';
      el.removeAttribute('aria-invalid');
      el.setAttribute('aria-describedby', `${el.id}-hint`);
    }
  }

  function markPreset(refs, frames) {
    const key = PAGING_PRESETS.find((p) => p.frames === frames && p.refs.join(',') === (refs || []).join(','))?.key;
    for (const c of presetChips) c.setAttribute('aria-pressed', String(c.dataset.preset === key));
  }

  function showBit() {
    for (const b of bitButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.value) === newBit));
    if (bitHint) bitHint.textContent = BIT_HINT[newBit];
  }

  /** Read the fields; returns the input or null, and shows errors. */
  function read() {
    const r = parseRefs(refsEl.value);
    const f = parseFrames(framesEl.value);
    showError(refsEl, refsErr, r.error);
    showError(framesEl, framesErr, f.error);
    markPreset(r.refs, f.frames);
    if (r.error || f.error) return null;
    last = { refs: r.refs, frames: f.frames, options: { newBit } };
    return last;
  }

  function set(refs, frames) {
    refsEl.value = refs.join(', ');
    framesEl.value = String(frames);
  }

  refsEl.addEventListener('input', () => onChange(read(), 'edit'));
  framesEl.addEventListener('input', () => onChange(read(), 'edit'));
  for (const b of bitButtons) {
    b.addEventListener('click', () => {
      const v = Number(b.dataset.value);
      if (v === newBit) return;
      newBit = v;
      showBit();
      onChange(read(), 'option');
    });
  }
  for (const c of presetChips) {
    c.addEventListener('click', () => {
      const p = PAGING_PRESETS.find((x) => x.key === c.dataset.preset);
      set(p.refs, p.frames);
      grow();
      onChange(read(), 'preset');
    });
  }

  set(initial.refs, initial.frames);
  showBit();
  read();

  return {
    /** The current valid input, or the last valid one. */
    value: () => last,
  };
}
