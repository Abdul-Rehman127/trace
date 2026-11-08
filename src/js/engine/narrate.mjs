// Narration: turns engine decisions into short English sentences.
// Pure, no DOM. A sentence is an array of parts: plain strings and { pid } objects.
// The UI turns { pid } into a <strong> element; nothing here builds HTML.

const unit = (n) => (n === 1 ? '1 unit' : `${n} units`);
const P = (pid) => ({ pid });

/** ["P1"] -> P1; ["P1","P2"] -> P1 and P2; ["P1","P2","P3"] -> P1, P2 and P3 (with optional suffix per name). */
function names(ids, suffix = () => '') {
  const out = [];
  ids.forEach((id, i) => {
    if (i > 0) out.push(i === ids.length - 1 ? ' and ' : ', ');
    out.push(P(id));
    const s = suffix(id);
    if (s) out.push(s);
  });
  return out;
}

/** Plain text of a sentence, for live regions and tests. */
export const sentenceText = (parts) => parts.map((p) => (typeof p === 'string' ? p : p.pid)).join('');

/**
 * Build the narration context once per simulation.
 * @param {{algorithm, processes, options}} scenario  validated scenario
 * @param {{decisions}} result  from simulate()
 */
export function narrationContext(scenario, result) {
  const procs = new Map(scenario.processes.map((p) => [p.id, p]));
  const byTime = new Map();
  for (const d of result.decisions) {
    if (!byTime.has(d.t)) byTime.set(d.t, []);
    byTime.get(d.t).push(d);
  }
  return {
    algorithm: scenario.algorithm,
    options: { quantum: 2, rrTie: 'new', lowerNumberIsHigherPriority: true, ...scenario.options },
    procs,
    byTime,
  };
}

const prio = (ctx, id) => ctx.procs.get(id).priority;
const arrival = (ctx, id) => ctx.procs.get(id).arrival;
const burst = (ctx, id) => ctx.procs.get(id).burst;

/** The one-line tie-break explanation between a winner and a runner-up that tie on the main rule. */
function tieBreak(ctx, winner, runnerUp) {
  if (arrival(ctx, winner) < arrival(ctx, runnerUp)) return [P(winner), ' arrived earlier, so it runs next.'];
  return [P(winner), ' has the lower process number, so it runs next.'];
}

function pickSentence(d, ctx) {
  const id = d.pid;
  const others = d.queue;
  if (d.reason === 'next-in-queue') {
    const q = ctx.options.quantum;
    const left = d.remaining[id];
    if (left <= q) {
      return [P(id), ` is next in line and needs ${left === 1 ? 'only 1 unit' : `only ${left} units`}, so it can finish within its ${q}-unit slice.`];
    }
    return [P(id), ` is next in line, so it runs for up to ${unit(q)}.`];
  }
  if (others.length === 0) return [P(id), ' is the only process ready, so it runs.'];
  const rival = others[0];

  if (d.reason === 'first-come') {
    if (arrival(ctx, rival) === arrival(ctx, id)) {
      return [P(id), ' and ', P(rival), ' arrived at the same time. ', P(id), ' has the lower process number, so it runs first.'];
    }
    return [P(id), ' has waited the longest, so it runs next.'];
  }

  if (d.reason === 'shortest-burst' || d.reason === 'shortest-remaining') {
    const value = d.reason === 'shortest-burst' ? (x) => burst(ctx, x) : (x) => d.remaining[x];
    const v = value(id);
    if (value(rival) === v) {
      const what = d.reason === 'shortest-burst' ? `a burst of ${v}` : `${v} left`;
      const lead = [P(id), ' and ', P(rival), ` both have ${what}`];
      if (arrival(ctx, rival) === arrival(ctx, id)) {
        return [...lead, ' and arrived together. ', P(id), ' has the lower process number, so it runs next.'];
      }
      return [...lead, '. ', ...tieBreak(ctx, id, rival)];
    }
    const label = (x) => ` (${value(x)})`;
    if (d.reason === 'shortest-burst') {
      if (others.length === 1) return [P(id), ` has a shorter burst (${v}) than `, ...names(others, label), ', so it runs next.'];
      return [P(id), ` has the shortest burst (${v}) among `, ...names(others, label), ', so it runs next.'];
    }
    if (others.length === 1) return [P(id), ` has less time left (${v}) than `, ...names(others, label), ', so it runs next.'];
    return [P(id), ` has the least time left (${v}) among `, ...names(others, label), ', so it runs next.'];
  }

  // best-priority
  const v = prio(ctx, id);
  if (prio(ctx, rival) === v) {
    const lead = [P(id), ' and ', P(rival), ` share the best priority (${v}). `];
    if (arrival(ctx, rival) === arrival(ctx, id)) {
      return [...lead, P(id), ' has the lower process number, so it runs next.'];
    }
    return [...lead, ...tieBreak(ctx, id, rival)];
  }
  return [P(id), ` has the best priority (${v}), so it runs next.`];
}

function tookOverAt(ctx, t, pid) {
  return (ctx.byTime.get(t) || []).some((x) => (x.kind === 'preempt' || x.kind === 'pick') && x.pid === pid);
}

function arriveSentence(d, ctx) {
  const id = d.pid;
  const holder = d.other;
  const fresh = holder && tookOverAt(ctx, d.t, holder);
  const outcome = fresh ? [', so ', P(holder), ' runs first.'] : [', so ', P(holder), ' keeps the CPU.'];
  switch (d.reason) {
    case 'shortest-remaining':
      return [P(id), ` arrives with ${d.remaining[id]} left. `, P(holder), ` has ${d.remaining[holder]} left, which is less`, ...outcome];
    case 'best-priority':
      return [P(id), ` arrives with priority ${prio(ctx, id)}. `, P(holder), ` has a better priority (${prio(ctx, holder)})`, ...outcome];
    case 'kept-on-tie': {
      const what = ctx.algorithm === 'srtf' ? `${d.remaining[id]} left` : `priority ${prio(ctx, id)}`;
      if (fresh) {
        return [P(holder), ' and ', P(id), ` both have ${what}. `, P(holder), ' has the lower process number, so it runs first.'];
      }
      return [P(holder), ' and ', P(id), ` both have ${what}. `, P(holder), ' is already running, so it keeps the CPU.'];
    }
    default:
      if (ctx.algorithm === 'rr') return [P(id), ' arrives and joins the back of the queue.'];
      if (holder) return [P(id), ' arrives and waits, because ', P(holder), ' runs until it finishes.'];
      return [P(id), ' arrives.'];
  }
}

function quantumSentence(d, ctx) {
  const q = ctx.options.quantum;
  if (d.reason === 'continues-alone') {
    return [P(d.pid), ` used its ${q}-unit slice, but no other process is waiting, so it keeps running.`];
  }
  const out = [P(d.pid), ` used its ${q}-unit slice and goes to the back of the queue.`];
  const newcomers = (ctx.byTime.get(d.t) || []).filter((x) => x.kind === 'arrive').map((x) => x.pid);
  if (newcomers.length) {
    const many = newcomers.length > 1;
    out.push(' ', ...names(newcomers), ` ${many ? 'arrive' : 'arrives'} at the same moment. `);
    if (ctx.options.rrTie === 'new') {
      out.push(`New arrivals join first, so ${many ? 'they are' : 'it is'} ahead of `, P(d.pid), '.');
    } else {
      out.push('The preempted process joins first, so ', P(d.pid), ` is ahead of ${many ? 'them' : 'it'}.`);
    }
  }
  return out;
}

/** One sentence for one decision. */
export function narrateDecision(d, ctx) {
  switch (d.kind) {
    case 'pick':
      return pickSentence(d, ctx);
    case 'preempt':
      if (d.reason === 'preempted-by-shorter') {
        return [P(d.pid), ` arrives needing ${d.remaining[d.pid]}, less than the ${d.remaining[d.other]} `, P(d.other), ' has left, so ', P(d.pid), ' takes over.'];
      }
      return [P(d.pid), ` arrives with priority ${prio(ctx, d.pid)}, better than `, P(d.other), `'s ${prio(ctx, d.other)}, so `, P(d.pid), ' takes over.'];
    case 'arrive':
      return arriveSentence(d, ctx);
    case 'quantum':
      return quantumSentence(d, ctx);
    case 'complete':
      return [P(d.pid), ` finishes at time ${d.t}.`];
    case 'idle': {
      if (!d.other) return ['Nothing is ready, so the CPU is idle.'];
      const at = arrival(ctx, d.other);
      const coming = [...ctx.procs.values()].filter((p) => p.arrival === at).map((p) => p.id);
      return ['Nothing is ready, so the CPU is idle until ', ...names(coming), ` ${coming.length > 1 ? 'arrive' : 'arrives'} at time ${at}.`];
    }
    default:
      return null;
  }
}

/**
 * Sentences for everything decided at time t, in order, without repeating what
 * another sentence already says.
 */
export function narrateMoment(ctx, t) {
  const list = ctx.byTime.get(t) || [];
  const picked = list.some((d) => d.kind === 'pick');
  const expired = list.some((d) => d.kind === 'quantum' && d.reason === 'quantum-expired');
  const out = [];
  let group = null; // consecutive plain arrivals that share one sentence
  const flush = () => {
    if (!group) return;
    if (group.ids.length === 1) out.push(arriveSentence(group.first, ctx));
    else if (ctx.algorithm === 'rr') out.push([...names(group.ids), ' arrive and join the back of the queue.']);
    else if (group.holder) out.push([...names(group.ids), ' arrive and wait, because ', P(group.holder), ' runs until it finishes.']);
    else out.push([...names(group.ids), ' arrive.']);
    group = null;
  };
  for (const d of list) {
    if (d.kind === 'arrive' && d.reason === null) {
      const covered = tookOverAt(ctx, t, d.pid) || picked || expired;
      if (covered) continue;
      if (group && group.holder === d.other) group.ids.push(d.pid);
      else {
        flush();
        group = { ids: [d.pid], holder: d.other, first: d };
      }
      continue;
    }
    flush();
    const s = narrateDecision(d, ctx);
    if (s) out.push(s);
  }
  flush();
  return out;
}

/**
 * The n longest moments of a schedule (by text length). The panel stacks them
 * invisibly under the current sentence so its height fits the longest narration
 * of this scenario and never changes during playback.
 */
export function longestMoments(ctx, n = 6) {
  return [...ctx.byTime.keys()]
    .map((t) => narrateMoment(ctx, t))
    .map((sentences) => ({ sentences, len: sentences.map(sentenceText).join(' ').length }))
    .sort((a, b) => b.len - a.len)
    .slice(0, n)
    .map((x) => x.sentences);
}
