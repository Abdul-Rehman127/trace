// Page replacement engine: FIFO, LRU, Optimal (MIN) and Clock (second chance).
// Pure, no DOM. Rules are fixed in sections/memory/SPEC.md:
// - frames keep their position; a fault with a free frame fills the lowest free frame
// - Optimal tie: among pages never used again, evict the one loaded earliest
// - Clock: pointer starts at frame 0; a hit sets the bit to 1 and leaves the pointer;
//   a fault clears bits until it finds a 0, evicts there, loads, then moves on one frame

export const PAGING_ALGORITHMS = ['fifo', 'lru', 'opt', 'clock'];

const NEVER = Infinity;

/** Position of the next use of `page` after index i, or Infinity. */
function nextUseAfter(refs, i, page) {
  for (let j = i + 1; j < refs.length; j++) if (refs[j] === page) return j;
  return NEVER;
}

/**
 * Run one algorithm.
 * @param {{ algorithm: 'fifo'|'lru'|'opt'|'clock', refs: number[], frames: number, options?: { newBit?: 0|1 } }} input
 *   validated input (see validate.mjs in this folder)
 * @returns {{ steps: object[], faults: number, hits: number, references: number }}
 */
export function simulatePaging({ algorithm, refs, frames: n, options = {} }) {
  const newBit = options.newBit === 0 ? 0 : 1;
  const frame = new Array(n).fill(null); // page in each frame
  const loadedAt = new Array(n).fill(-1); // step index when the page was loaded
  const lastUsed = new Array(n).fill(-1); // step index of the last reference (load counts)
  const bits = new Array(n).fill(0);
  let pointer = 0;
  let faults = 0;
  const steps = [];

  refs.forEach((page, i) => {
    const before = {
      frames: frame.slice(),
      loadedAt: loadedAt.slice(),
      lastUsed: lastUsed.slice(),
      bits: bits.slice(),
      pointer,
    };
    const at = frame.indexOf(page);
    const step = { i, page, hit: at >= 0, slot: at, evicted: null, reason: 'hit', cleared: [], pointerBefore: pointer, before };

    if (at >= 0) {
      lastUsed[at] = i;
      if (algorithm === 'clock') bits[at] = 1;
    } else {
      faults++;
      let slot;
      if (algorithm === 'clock') {
        while (frame[pointer] !== null && bits[pointer] === 1) {
          bits[pointer] = 0;
          step.cleared.push({ slot: pointer, page: frame[pointer] });
          pointer = (pointer + 1) % n;
        }
        slot = pointer;
        if (frame[slot] === null) step.reason = 'fault-free-frame';
        else step.reason = step.cleared.length ? 'clock-second-chance' : 'clock-evict';
        pointer = (pointer + 1) % n;
      } else {
        slot = frame.indexOf(null);
        if (slot >= 0) {
          step.reason = 'fault-free-frame';
        } else if (algorithm === 'fifo') {
          slot = argMin(loadedAt);
          step.reason = 'fault-evict-oldest';
        } else if (algorithm === 'lru') {
          slot = argMin(lastUsed);
          step.reason = 'fault-evict-least-recent';
        } else {
          const next = frame.map((p) => nextUseAfter(refs, i, p));
          step.nextUse = next;
          slot = 0;
          for (let s = 1; s < n; s++) {
            const farther = next[s] > next[slot];
            const tieNever = next[s] === NEVER && next[slot] === NEVER && loadedAt[s] < loadedAt[slot];
            if (farther || tieNever) slot = s;
          }
          step.reason = 'fault-evict-farthest-next-use';
        }
      }
      step.slot = slot;
      step.evicted = frame[slot];
      frame[slot] = page;
      loadedAt[slot] = i;
      lastUsed[slot] = i;
      if (algorithm === 'clock') bits[slot] = newBit;
    }

    step.frames = frame.slice();
    step.bits = bits.slice();
    step.pointer = pointer;
    step.loadedAt = loadedAt.slice();
    step.lastUsed = lastUsed.slice();
    step.faults = faults;
    steps.push(step);
  });

  return { algorithm, frames: n, refs: refs.slice(), options: { newBit }, steps, faults, hits: refs.length - faults, references: refs.length };
}

function argMin(arr) {
  let best = 0;
  for (let k = 1; k < arr.length; k++) if (arr[k] < arr[best]) best = k;
  return best;
}

/** Faults for the same string with 1..maxFrames frames. */
export function faultsByFrames(algorithm, refs, options = {}, maxFrames = 8) {
  const out = [];
  for (let f = 1; f <= maxFrames; f++) out.push(simulatePaging({ algorithm, refs, frames: f, options }).faults);
  return out;
}

/** Greatest common divisor, for exact fault-rate fractions. */
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Fault rate as { num, den, percent } where percent has one decimal. */
export function faultRate(faults, references) {
  const g = gcd(faults, references) || 1;
  return { num: faults / g, den: references / g, percent: Math.round((faults / references) * 1000) / 10 };
}
