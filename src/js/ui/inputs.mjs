// Process editor, algorithm options and presets.
// Raw typed text is kept as is; nothing is clamped. Each field shows its exact error
// under the row, and the simulation only updates when every field is valid.

import { h } from './dom.mjs';
import { iconClose } from './icons.mjs';
import { checkField, validateScenario, MAX_PROCESSES } from '../engine/validate.mjs';
import { presetsFor } from '../engine/presets.mjs';

const TIE_HINT = {
  new: 'A process that arrives just as a slice ends joins the queue before the preempted process.',
  preempted: 'The preempted process rejoins the queue before a process that arrives at the same moment.',
};
const PREEMPT_HINT = {
  true: 'A better priority arrival interrupts the running process.',
  false: 'The running process always finishes first.',
};
const ORDER_HINT = { low: '1 is the highest priority.', high: '99 is the highest priority.' };
const FIELDS = ['arrival', 'burst', 'priority'];
const LABEL = { arrival: 'Arrival', burst: 'Burst', priority: 'Priority' };

const toRaw = (p) => ({ arrival: String(p.arrival), burst: String(p.burst), priority: String(p.priority ?? 1) });

export function createInputs(root, { algorithm, initial, onChange }) {
  const tbody = root.querySelector('[data-proc-rows]');
  const ptable = root.querySelector('[data-ptable]');
  const addBtn = root.querySelector('[data-add]');
  const addNote = root.querySelector('[data-add-note]');
  const quantum = root.querySelector('[data-opt="quantum"]');
  const quantumErr = root.querySelector('[data-err-for="opt-quantum"]');
  const tieSeg = root.querySelector('[data-tie]');
  const tieHint = root.querySelector('[data-tie-hint]');
  const preempt = root.querySelector('[data-opt="preemptive"]');
  const preemptHint = root.querySelector('[data-preempt-hint]');
  const orderSeg = root.querySelector('[data-order]');
  const orderHint = root.querySelector('[data-order-hint]');
  const presetChips = [...root.querySelectorAll('[data-preset]')];

  let alg = algorithm;
  const slots = new Array(MAX_PROCESSES).fill(null);
  const options = { quantum: '2', rrTie: 'new', preemptive: false, lower: true };
  let rowEls = new Map(); // slot -> { tr, inputs, errRow }
  let activePreset = null;

  function load(s) {
    slots.fill(null);
    for (const p of s.processes) slots[Number(p.id.slice(1)) - 1] = toRaw(p);
    const o = s.options || {};
    options.quantum = String(o.quantum ?? 2);
    options.rrTie = o.rrTie === 'preempted' ? 'preempted' : 'new';
    options.preemptive = !!o.preemptive;
    options.lower = o.lowerNumberIsHigherPriority !== false;
    renderRows();
    renderOptions();
  }

  // ---------- rows ----------

  function numInput(slot, field, value) {
    const id = `p${slot}-${field}`;
    const input = h('input', {
      class: 'num',
      id,
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      spellcheck: 'false',
      value,
      'aria-label': `${LABEL[field]} for P${slot}`,
      dataset: { slot: String(slot), field },
    });
    input.addEventListener('input', () => {
      slots[slot - 1][field] = input.value;
      activePreset = null;
      syncPresets();
      validateRow(slot);
      emit();
    });
    return input;
  }

  function renderRows() {
    rowEls = new Map();
    const trs = [];
    slots.forEach((raw, i) => {
      if (!raw) return;
      const slot = i + 1;
      const id = `P${slot}`;
      const inputs = Object.fromEntries(FIELDS.map((f) => [f, numInput(slot, f, raw[f])]));
      const remove = h('button', { type: 'button', class: 'remove', 'aria-label': `Remove ${id}` }, iconClose(18));
      remove.addEventListener('click', () => removeSlot(slot));
      const tr = h(
        'tr',
        { dataset: { slot: String(slot) } },
        h('td', {}, h('span', { class: 'pname' }, h('i', { class: 'swatch', vars: { '--c': `var(--c${slot})` } }), id)),
        h('td', { class: 'num-cell' }, inputs.arrival),
        h('td', { class: 'num-cell' }, inputs.burst),
        h('td', { class: 'num-cell col-prio' }, inputs.priority),
        h('td', { class: 'remove-cell' }, remove),
      );
      const errP = h('p', { class: 'err', id: `p${slot}-err`, role: 'alert' });
      const errRow = h('tr', { class: 'row-err', hidden: true }, h('td', { colspan: '5' }, errP));
      rowEls.set(slot, { tr, inputs, remove, errRow, errP });
      trs.push(tr, errRow);
    });
    tbody.replaceChildren(...trs);
    for (const slot of rowEls.keys()) validateRow(slot);
    syncRowControls();
  }

  function count() {
    return slots.filter(Boolean).length;
  }

  function syncRowControls() {
    const n = count();
    ptable.dataset.rows = String(n);
    const full = n >= MAX_PROCESSES;
    addBtn.disabled = full;
    addNote.textContent = full ? 'Trace supports up to 8 processes, one color each.' : '';
    for (const { remove } of rowEls.values()) {
      remove.disabled = n <= 1;
      remove.title = n <= 1 ? 'At least one process is needed' : '';
    }
  }

  function fieldsFor() {
    return alg === 'priority' ? FIELDS : ['arrival', 'burst'];
  }

  function validateRow(slot) {
    const row = rowEls.get(slot);
    if (!row) return true;
    const raw = slots[slot - 1];
    const messages = [];
    for (const f of FIELDS) {
      const input = row.inputs[f];
      const checked = fieldsFor().includes(f);
      const err = checked ? checkField(f, raw[f], `P${slot}`).error : null;
      if (err) {
        messages.push(err);
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', row.errP.id);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
    const text = messages.join(' ');
    if (row.errP.textContent !== text) row.errP.textContent = text;
    row.errRow.hidden = !text;
    return !text;
  }

  function addSlot() {
    const i = slots.indexOf(null);
    if (i < 0) return;
    const arrivals = slots.filter(Boolean).map((r) => Number(r.arrival)).filter(Number.isInteger);
    const last = arrivals.length ? Math.max(...arrivals) : -1;
    slots[i] = { arrival: String(Math.min(99, last + 1)), burst: '3', priority: '1' };
    activePreset = null;
    syncPresets();
    renderRows();
    rowEls.get(i + 1).inputs.arrival.focus();
    emit();
  }

  function removeSlot(slot) {
    if (count() <= 1) return;
    const order = [...rowEls.keys()];
    const pos = order.indexOf(slot);
    slots[slot - 1] = null;
    activePreset = null;
    syncPresets();
    renderRows();
    // Keep focus nearby: the next row's remove button, else the previous, else Add.
    const keys = [...rowEls.keys()];
    const target = rowEls.get(keys[Math.min(pos, keys.length - 1)]);
    (target ? target.remove : addBtn).focus();
    emit();
  }

  addBtn.addEventListener('click', addSlot);

  // ---------- options ----------

  function pressSeg(seg, value) {
    if (!seg) return;
    for (const b of seg.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.value === value));
  }

  function validateQuantum() {
    if (!quantum) return true;
    const err = alg === 'rr' ? checkField('quantum', options.quantum).error : null;
    if (err) {
      quantum.setAttribute('aria-invalid', 'true');
      quantum.setAttribute('aria-describedby', 'opt-quantum-hint opt-quantum-err');
      quantumErr.textContent = err;
      quantumErr.setAttribute('role', 'alert');
      quantumErr.hidden = false;
    } else {
      quantum.removeAttribute('aria-invalid');
      quantum.setAttribute('aria-describedby', 'opt-quantum-hint');
      quantumErr.textContent = '';
      quantumErr.hidden = true;
    }
    return !err;
  }

  function renderOptions() {
    if (quantum && quantum.value !== options.quantum) quantum.value = options.quantum;
    validateQuantum();
    pressSeg(tieSeg, options.rrTie);
    if (tieHint) tieHint.textContent = TIE_HINT[options.rrTie];
    if (preempt) preempt.checked = options.preemptive;
    if (preemptHint) preemptHint.textContent = PREEMPT_HINT[options.preemptive];
    pressSeg(orderSeg, options.lower ? 'low' : 'high');
    if (orderHint) orderHint.textContent = ORDER_HINT[options.lower ? 'low' : 'high'];
  }

  if (quantum) {
    quantum.addEventListener('input', () => {
      options.quantum = quantum.value;
      activePreset = null;
      syncPresets();
      validateQuantum();
      emit();
    });
  }
  const segHandler = (seg, apply) => {
    if (!seg) return;
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      apply(b.dataset.value);
      renderOptions();
      emit();
    });
  };
  segHandler(tieSeg, (v) => (options.rrTie = v));
  segHandler(orderSeg, (v) => (options.lower = v === 'low'));
  if (preempt) {
    preempt.addEventListener('change', () => {
      options.preemptive = preempt.checked;
      renderOptions();
      emit();
    });
  }

  // ---------- presets ----------

  function syncPresets() {
    for (const c of presetChips) c.setAttribute('aria-pressed', String(c.dataset.preset === activePreset));
  }
  for (const c of presetChips) {
    c.addEventListener('click', () => {
      const preset = presetsFor(alg).find((p) => p.key === c.dataset.preset);
      if (!preset) return;
      load({
        processes: preset.processes,
        options: {
          quantum: preset.options.quantum ?? options.quantum,
          rrTie: preset.options.rrTie ?? options.rrTie,
          preemptive: preset.options.preemptive ?? options.preemptive,
          lowerNumberIsHigherPriority: options.lower,
        },
      });
      activePreset = preset.key;
      syncPresets();
      emit();
    });
  }

  // ---------- output ----------

  /** The current scenario if every field is valid, else null. */
  function scenario() {
    const processes = [];
    slots.forEach((raw, i) => {
      if (raw) processes.push({ id: `P${i + 1}`, arrival: raw.arrival, burst: raw.burst, priority: raw.priority });
    });
    const s = {
      algorithm: alg,
      processes,
      options: {
        quantum: options.quantum,
        rrTie: options.rrTie,
        preemptive: options.preemptive,
        lowerNumberIsHigherPriority: options.lower,
      },
    };
    const v = validateScenario(s);
    return v.ok ? v.value : null;
  }

  /** The scenario for another algorithm, for links between pages (null if invalid). */
  function scenarioFor(target) {
    const keep = alg;
    alg = target;
    const s = scenario();
    alg = keep;
    return s;
  }

  function emit() {
    onChange(scenario());
  }

  function setAlgorithm(next) {
    alg = next;
    for (const slot of rowEls.keys()) validateRow(slot);
    validateQuantum();
    emit();
  }

  load(initial);
  syncPresets();

  return { scenario, scenarioFor, setAlgorithm, load };
}
