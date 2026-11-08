// Share links: the scenario lives in the query string.
//   ?alg=rr&q=2&tie=new&p=0:5,1:3,2:1,3:4
// `p` lists arrival:burst per slot (P1, P2, ...), with an optional third number for
// priority. An empty entry means that slot is unused. `pre=1` makes Priority preemptive,
// `hi=1` makes a higher number mean higher priority.
// Decoding never throws: bad parts are dropped and reported as notices.

import { ALGORITHMS, MAX_PROCESSES, checkField } from './validate.mjs';

const MAX_QUERY = 2048;

/**
 * Encode a scenario as a query string (without the leading "?").
 * Only options that matter for the algorithm are written. Priority numbers are
 * written only for the Priority algorithm.
 */
export function encodeScenario({ algorithm, processes, options = {} }) {
  const params = [`alg=${algorithm}`];
  if (algorithm === 'rr') {
    params.push(`q=${options.quantum ?? 2}`);
    params.push(`tie=${options.rrTie === 'preempted' ? 'preempted' : 'new'}`);
  }
  if (algorithm === 'priority') {
    if (options.preemptive) params.push('pre=1');
    if (options.lowerNumberIsHigherPriority === false) params.push('hi=1');
  }
  const slots = new Array(MAX_PROCESSES).fill('');
  let last = 0;
  for (const p of processes) {
    const slot = Number(String(p.id).slice(1));
    if (!(slot >= 1 && slot <= MAX_PROCESSES)) continue;
    slots[slot - 1] =
      algorithm === 'priority' ? `${p.arrival}:${p.burst}:${p.priority ?? 1}` : `${p.arrival}:${p.burst}`;
    last = Math.max(last, slot);
  }
  params.push(`p=${slots.slice(0, last).join(',')}`);
  return params.join('&');
}

/**
 * Decode a query string into a scenario. Never throws.
 * @param {string} search  e.g. location.search (with or without "?")
 * @param {{algorithm: string, processes: Array, options?: object}} fallback  used for anything missing or unreadable
 * @returns {{ scenario, notices: string[], found: boolean }}  found is true when the link carried any scenario data
 */
export function decodeScenario(search, fallback) {
  const notices = [];
  const base = {
    algorithm: fallback.algorithm,
    processes: fallback.processes.map((p) => ({ ...p })),
    options: { quantum: 2, rrTie: 'new', preemptive: false, lowerNumberIsHigherPriority: true, ...fallback.options },
  };
  let params;
  try {
    const text = typeof search === 'string' ? search : '';
    if (text.length > MAX_QUERY) {
      return { scenario: base, notices: ['This link is too long to read, so the default example is shown.'], found: false };
    }
    params = new URLSearchParams(text.startsWith('?') ? text.slice(1) : text);
  } catch {
    return { scenario: base, notices: ['This link could not be read, so the default example is shown.'], found: false };
  }

  const get = (k) => {
    try {
      return params.get(k);
    } catch {
      return null;
    }
  };
  const keys = ['alg', 'q', 'tie', 'pre', 'hi', 'p'];
  const found = keys.some((k) => get(k) !== null);
  const scenario = base;

  const alg = get('alg');
  if (alg !== null) {
    if (ALGORITHMS.includes(alg)) scenario.algorithm = alg;
    else notices.push('The algorithm in this link is not one Trace knows, so it was ignored.');
  }

  const q = get('q');
  if (q !== null) {
    const r = checkField('quantum', q);
    if (r.error) notices.push(`The quantum in this link was ignored. ${r.error}`);
    else scenario.options.quantum = r.value;
  }

  const tie = get('tie');
  if (tie !== null) {
    if (tie === 'new' || tie === 'preempted') scenario.options.rrTie = tie;
    else notices.push('The tie rule in this link was ignored.');
  }

  for (const [key, opt, onValue] of [
    ['pre', 'preemptive', true],
    ['hi', 'lowerNumberIsHigherPriority', false],
  ]) {
    const v = get(key);
    if (v === null) continue;
    if (v === '1') scenario.options[opt] = onValue;
    else if (v === '0') scenario.options[opt] = !onValue;
    else notices.push(`The ${key === 'pre' ? 'preemptive' : 'priority direction'} setting in this link was ignored.`);
  }

  const p = get('p');
  if (p !== null) {
    const entries = p.split(',');
    if (entries.length > MAX_PROCESSES) {
      notices.push(`Trace supports up to ${MAX_PROCESSES} processes, so the extra ones in this link were left out.`);
    }
    const processes = [];
    const skipped = [];
    entries.slice(0, MAX_PROCESSES).forEach((entry, i) => {
      const id = `P${i + 1}`;
      if (entry.trim() === '') return;
      const parts = entry.split(':');
      if (parts.length < 2 || parts.length > 3) {
        skipped.push(id);
        return;
      }
      const arrival = checkField('arrival', parts[0], id);
      const burst = checkField('burst', parts[1], id);
      let priority = 1;
      if (parts.length === 3) {
        const r = checkField('priority', parts[2], id);
        if (r.error) {
          skipped.push(id);
          return;
        }
        priority = r.value;
      }
      if (arrival.error || burst.error) {
        skipped.push(id);
        return;
      }
      processes.push({ id, arrival: arrival.value, burst: burst.value, priority });
    });
    if (skipped.length) {
      const list = skipped.length === 1 ? skipped[0] : `${skipped.slice(0, -1).join(', ')} and ${skipped[skipped.length - 1]}`;
      notices.push(`${list} in this link could not be read, so ${skipped.length === 1 ? 'it was' : 'they were'} left out.`);
    }
    if (processes.length) scenario.processes = processes;
    else notices.push('This link had no readable processes, so the default example is shown.');
  }

  return { scenario, notices, found };
}

