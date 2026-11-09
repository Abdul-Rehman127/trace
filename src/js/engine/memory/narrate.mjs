// Narration for page replacement: short English sentences for each step, built
// from the engine's step records. Pure, no DOM. A sentence is an array of parts:
// strings and { pid } objects (shown in bold), the same shape as scheduling narration.

const B = (text) => ({ pid: String(text) });
const pageList = (pages) => {
  const out = [];
  pages.forEach((p, i) => {
    if (i > 0) out.push(i === pages.length - 1 ? ' and ' : ', ');
    out.push(B(p));
  });
  return out;
};
const plural = (n, one, many) => (n === 1 ? one : many);

/** Plain text of one sentence. */
export const pagingSentenceText = (parts) => parts.map((p) => (typeof p === 'string' ? p : p.pid)).join('');

/** What the step at position k (1-based) means, as a list of sentences. k = 0 is the start. */
export function narratePagingStep(result, k) {
  if (k <= 0) {
    const empty = result.frames === 1 ? 'The frame is empty.' : `All ${result.frames} frames are empty.`;
    return [[`${empty} Press play or step forward to bring in the first page.`]];
  }
  const s = result.steps[k - 1];
  const alg = result.algorithm;
  const out = [];
  const pageName = ['Page ', B(s.page)];

  if (s.hit) {
    out.push([...pageName, ` is already in frame ${s.slot}, so this is a hit. Nothing is replaced.`]);
    if (alg === 'lru') out.push(['It is now the most recently used page.']);
    if (alg === 'clock') out.push([`Its reference bit is set to 1. The pointer stays at frame ${s.pointer}.`]);
    return out;
  }

  out.push([...pageName, ' is not in memory, so this is a page fault.']);
  if (s.reason === 'fault-free-frame') {
    const tail = alg === 'clock' ? ` Its reference bit starts at ${s.bits[s.slot]} and the pointer moves to frame ${s.pointer}.` : '';
    out.push([`Frame ${s.slot} is free, so the page goes there.${tail}`]);
    return out;
  }

  const victim = s.evicted;
  const into = [' Page ', B(s.page), ` goes into frame ${s.slot}.`];
  if (s.reason === 'fault-evict-oldest') {
    out.push(['All frames are full. FIFO evicts page ', B(victim), `, which was loaded first, at step ${s.before.loadedAt[s.slot] + 1}.`, ...into]);
  } else if (s.reason === 'fault-evict-least-recent') {
    out.push(['All frames are full. LRU evicts page ', B(victim), `, last used at step ${s.before.lastUsed[s.slot] + 1}, longer ago than any other page in memory.`, ...into]);
  } else if (s.reason === 'fault-evict-farthest-next-use') {
    const never = s.before.frames.filter((p, idx) => s.nextUse[idx] === Infinity);
    if (s.nextUse[s.slot] !== Infinity) {
      out.push(['All frames are full. Optimal looks ahead: page ', B(victim), ` is next needed at step ${s.nextUse[s.slot] + 1}, later than any other page in memory, so it is evicted.`, ...into]);
    } else if (never.length === 1) {
      out.push(['All frames are full. Optimal looks ahead: page ', B(victim), ' is never used again, so it is evicted.', ...into]);
    } else {
      out.push([
        'All frames are full. Optimal looks ahead: pages ',
        ...pageList(never),
        ' are never used again. Of those, page ',
        B(victim),
        ' has been in memory longest, so it is evicted.',
        ...into,
      ]);
    }
  } else if (s.reason === 'clock-evict') {
    out.push([`All frames are full. The pointer is at frame ${s.slot}, where page `, B(victim), ' has reference bit 0, so it is evicted.', ...into]);
    out.push([`The new page's bit is ${s.bits[s.slot]} and the pointer moves to frame ${s.pointer}.`]);
  } else if (s.reason === 'clock-second-chance') {
    const cleared = s.cleared.map((c) => c.page);
    out.push([
      'All frames are full. The pointer passes ',
      ...plural(cleared.length, ['page '], ['pages ']),
      ...pageList(cleared),
      `, which ${plural(cleared.length, 'has', 'have')} reference bit 1, and clears ${plural(cleared.length, 'it', 'each one')}: a second chance.`,
    ]);
    out.push([`At frame ${s.slot}, page `, B(victim), ' now has bit 0, so it is evicted.', ...into]);
    out.push([`The new page's bit is ${s.bits[s.slot]} and the pointer moves to frame ${s.pointer}.`]);
  }
  return out;
}

/**
 * What the algorithm looks at after step k, for the side panel.
 * Returns { label, items: [{ page, note }] } with items in the order the algorithm uses them.
 */
export function pagingView(result, k) {
  const alg = result.algorithm;
  const label = {
    fifo: 'Load order, oldest first',
    lru: 'Recent use, least recent first',
    opt: 'Next use after this step',
    clock: 'Reference bits, from the pointer',
  }[alg];
  if (k <= 0) return { label, items: [] };
  const s = result.steps[k - 1];
  const live = s.frames.map((page, slot) => ({ page, slot })).filter((x) => x.page !== null);
  if (alg === 'fifo') {
    return { label, items: live.sort((a, b) => s.loadedAt[a.slot] - s.loadedAt[b.slot]).map((x) => ({ page: x.page, note: `loaded at step ${s.loadedAt[x.slot] + 1}` })) };
  }
  if (alg === 'lru') {
    return { label, items: live.sort((a, b) => s.lastUsed[a.slot] - s.lastUsed[b.slot]).map((x) => ({ page: x.page, note: `used at step ${s.lastUsed[x.slot] + 1}` })) };
  }
  if (alg === 'opt') {
    const refs = result.refs;
    const next = (p) => {
      for (let j = k; j < refs.length; j++) if (refs[j] === p) return j;
      return Infinity;
    };
    return {
      label,
      items: live
        .map((x) => ({ ...x, n: next(x.page) }))
        .sort((a, b) => b.n - a.n || s.loadedAt[a.slot] - s.loadedAt[b.slot])
        .map((x) => ({ page: x.page, note: x.n === Infinity ? 'never again' : `step ${x.n + 1}` })),
    };
  }
  const n = result.frames;
  const items = [];
  for (let d = 0; d < n; d++) {
    const slot = (s.pointer + d) % n;
    if (s.frames[slot] === null) continue;
    items.push({ page: s.frames[slot], note: `bit ${s.bits[slot]}${d === 0 ? ', pointer here' : ''}` });
  }
  return { label, items };
}
