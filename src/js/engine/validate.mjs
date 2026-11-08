// Input validation for CPU scheduling scenarios. Pure, no DOM.
// Every limit produces a specific, human message. Nothing is clamped silently.

export const ALGORITHMS = ['fcfs', 'sjf', 'srtf', 'priority', 'rr'];
export const MAX_PROCESSES = 8;
export const LIMITS = {
  arrival: [0, 99],
  burst: [1, 99],
  priority: [1, 99],
  quantum: [1, 99],
};

const LABEL = { arrival: 'Arrival', burst: 'Burst', priority: 'Priority' };

/** The slot number (1..8) for an id like "P3", or 0 when the id is not valid. */
export function slotOf(id) {
  const m = typeof id === 'string' ? /^P([1-8])$/.exec(id) : null;
  return m ? Number(m[1]) : 0;
}

/**
 * Parse a whole number from a number or a string typed by a person.
 * Accepts surrounding spaces. Rejects signs, decimals, exponents and empty text.
 * Returns NaN when the value is not a plain whole number.
 */
export function parseWhole(raw) {
  if (typeof raw === 'number') return Number.isInteger(raw) ? raw : NaN;
  if (typeof raw !== 'string') return NaN;
  const s = raw.trim();
  if (!/^\d{1,6}$/.test(s)) return NaN;
  return Number(s);
}

const inRange = (n, [lo, hi]) => Number.isInteger(n) && n >= lo && n <= hi;

/** Message for one process field, e.g. "Burst for P2 must be a whole number from 1 to 99." */
export function fieldMessage(field, pid) {
  const [lo, hi] = LIMITS[field];
  if (field === 'quantum') return `Quantum must be a whole number from ${lo} to ${hi}.`;
  return `${LABEL[field]} for ${pid} must be a whole number from ${lo} to ${hi}.`;
}

/**
 * Check one raw input value. Returns { value, error } where error is null when valid.
 * `pid` is ignored for the quantum.
 */
export function checkField(field, raw, pid) {
  const value = parseWhole(raw);
  if (!inRange(value, LIMITS[field])) return { value: null, error: fieldMessage(field, pid) };
  return { value, error: null };
}

/**
 * Validate a full scenario { algorithm, processes, options }.
 * Returns { ok, errors: [{ path, message }], value } where value is the normalized scenario
 * (numbers parsed, defaults filled, processes in slot order) when ok is true.
 * Priority is only checked for the Priority algorithm, and the quantum only for Round Robin.
 */
export function validateScenario(scenario) {
  const errors = [];
  const add = (path, message) => errors.push({ path, message });
  const s = scenario && typeof scenario === 'object' ? scenario : {};
  const algorithm = s.algorithm;
  const options = s.options && typeof s.options === 'object' ? s.options : {};

  if (!ALGORITHMS.includes(algorithm)) {
    add('algorithm', 'Choose an algorithm: FCFS, SJF, SRTF, Priority or Round Robin.');
  }

  const list = Array.isArray(s.processes) ? s.processes : [];
  if (list.length === 0) add('processes', 'Add at least one process.');
  if (list.length > MAX_PROCESSES) add('processes', `Trace supports up to ${MAX_PROCESSES} processes.`);

  const seen = new Set();
  const processes = [];
  list.slice(0, MAX_PROCESSES).forEach((p, i) => {
    const proc = p && typeof p === 'object' ? p : {};
    const slot = slotOf(proc.id);
    if (!slot) {
      add(`processes.${i}.id`, 'Each process needs a name from P1 to P8.');
      return;
    }
    const id = proc.id;
    if (seen.has(id)) {
      add(`${id}.id`, `${id} is listed twice.`);
      return;
    }
    seen.add(id);
    const out = { id, arrival: null, burst: null, priority: 1 };
    for (const field of ['arrival', 'burst']) {
      const r = checkField(field, proc[field], id);
      if (r.error) add(`${id}.${field}`, r.error);
      else out[field] = r.value;
    }
    if (algorithm === 'priority') {
      const r = checkField('priority', proc.priority, id);
      if (r.error) add(`${id}.priority`, r.error);
      else out.priority = r.value;
    } else {
      const r = checkField('priority', proc.priority, id);
      if (!r.error) out.priority = r.value;
    }
    processes.push(out);
  });
  processes.sort((a, b) => slotOf(a.id) - slotOf(b.id));

  const opts = {
    quantum: 2,
    rrTie: 'new',
    preemptive: false,
    lowerNumberIsHigherPriority: true,
  };
  if (algorithm === 'rr') {
    const r = checkField('quantum', options.quantum ?? 2);
    if (r.error) add('quantum', r.error);
    else opts.quantum = r.value;
    const tie = options.rrTie ?? 'new';
    if (tie !== 'new' && tie !== 'preempted') {
      add('rrTie', 'Choose who goes first on a tie: the new arrival or the preempted process.');
    } else opts.rrTie = tie;
  }
  if (algorithm === 'priority') {
    const pre = options.preemptive ?? false;
    if (typeof pre !== 'boolean') add('preemptive', 'The preemptive setting must be on or off.');
    else opts.preemptive = pre;
    const low = options.lowerNumberIsHigherPriority ?? true;
    if (typeof low !== 'boolean') add('lowerNumberIsHigherPriority', 'The priority direction setting must be on or off.');
    else opts.lowerNumberIsHigherPriority = low;
  }

  if (errors.length) return { ok: false, errors, value: null };
  return { ok: true, errors, value: { algorithm, processes, options: opts } };
}
