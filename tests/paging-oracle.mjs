// Independent page replacement oracle for differential tests. Written separately from
// src/js/engine/memory/paging.mjs with different data structures on purpose:
// FIFO as a queue of pages, LRU as a recency list (most recent at the end), Optimal by
// rescanning the rest of the string on every fault, Clock as a ring of { page, bit }.
// It shares no code with the engine.

export function oracleFaults(algorithm, refs, frames, newBit = 1) {
  if (algorithm === 'fifo') return fifo(refs, frames);
  if (algorithm === 'lru') return lru(refs, frames);
  if (algorithm === 'opt') return opt(refs, frames);
  return clock(refs, frames, newBit);
}

function fifo(refs, frames) {
  const queue = [];
  let faults = 0;
  for (const p of refs) {
    if (queue.includes(p)) continue;
    faults++;
    if (queue.length === frames) queue.shift();
    queue.push(p);
  }
  return { faults, resident: [...queue].sort((a, b) => a - b) };
}

function lru(refs, frames) {
  const recency = []; // least recent first
  let faults = 0;
  for (const p of refs) {
    const at = recency.indexOf(p);
    if (at >= 0) {
      recency.splice(at, 1);
    } else {
      faults++;
      if (recency.length === frames) recency.shift();
    }
    recency.push(p);
  }
  return { faults, resident: [...recency].sort((a, b) => a - b) };
}

function opt(refs, frames) {
  // Each resident entry remembers when it came in, for the "never used again" tie.
  let resident = [];
  let faults = 0;
  refs.forEach((p, i) => {
    if (resident.some((r) => r.page === p)) return;
    faults++;
    if (resident.length < frames) {
      resident.push({ page: p, since: i });
      return;
    }
    const rest = refs.slice(i + 1);
    const scored = resident.map((r) => {
      const ahead = rest.indexOf(r.page);
      return { ...r, ahead: ahead === -1 ? Number.MAX_SAFE_INTEGER : ahead };
    });
    scored.sort((a, b) => b.ahead - a.ahead || a.since - b.since);
    const victim = scored[0].page;
    resident = resident.filter((r) => r.page !== victim);
    resident.push({ page: p, since: i });
  });
  return { faults, resident: resident.map((r) => r.page).sort((a, b) => a - b) };
}

function clock(refs, frames, newBit) {
  const ring = Array.from({ length: frames }, () => ({ page: null, bit: 0 }));
  let hand = 0;
  let faults = 0;
  for (const p of refs) {
    const hit = ring.find((c) => c.page === p);
    if (hit) {
      hit.bit = 1;
      continue;
    }
    faults++;
    for (;;) {
      const cell = ring[hand];
      if (cell.page === null || cell.bit === 0) {
        cell.page = p;
        cell.bit = newBit;
        hand = (hand + 1) % frames;
        break;
      }
      cell.bit = 0;
      hand = (hand + 1) % frames;
    }
  }
  return { faults, resident: ring.map((c) => c.page).filter((x) => x !== null).sort((a, b) => a - b), positions: ring.map((c) => c.page), bits: ring.map((c) => c.bit), hand };
}
