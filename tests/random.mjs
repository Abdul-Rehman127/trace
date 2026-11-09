// Seeded random scenario generator shared by the tests.

export { prng } from '../src/js/engine/prng.mjs';

export const int = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
export const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/**
 * A random valid process list. Ranges are drawn per scenario so that some
 * scenarios are dense with ties (all arrivals at 0, bursts 1..3) and others
 * span the full limits (arrivals and bursts up to 99, idle gaps).
 * Slots are a random subset of P1..P8, so ids need not be contiguous.
 */
export function randomProcesses(rand) {
  const count = int(rand, 1, 8);
  const slots = [1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = slots.length - 1; i > 0; i--) {
    const j = int(rand, 0, i);
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const chosen = slots.slice(0, count);
  if (rand() < 0.5) chosen.sort((a, b) => a - b);
  const maxArrival = pick(rand, [0, 3, 8, 20, 99]);
  const maxBurst = pick(rand, [1, 3, 6, 12, 99]);
  const maxPriority = pick(rand, [1, 3, 10, 99]);
  return chosen.map((slot) => ({
    id: `P${slot}`,
    arrival: int(rand, 0, maxArrival),
    burst: int(rand, 1, maxBurst),
    priority: int(rand, 1, maxPriority),
  }));
}

/** Every algorithm and option combination the differential test covers. */
export const COMBOS = [
  { algorithm: 'fcfs', options: {} },
  { algorithm: 'sjf', options: {} },
  { algorithm: 'srtf', options: {} },
  { algorithm: 'priority', options: { preemptive: false, lowerNumberIsHigherPriority: true } },
  { algorithm: 'priority', options: { preemptive: false, lowerNumberIsHigherPriority: false } },
  { algorithm: 'priority', options: { preemptive: true, lowerNumberIsHigherPriority: true } },
  { algorithm: 'priority', options: { preemptive: true, lowerNumberIsHigherPriority: false } },
  { algorithm: 'rr', options: { rrTie: 'new' } },
  { algorithm: 'rr', options: { rrTie: 'preempted' } },
];

/** Random quantum: mostly small (where slices and ties matter), sometimes large. */
export const randomQuantum = (rand) => (rand() < 0.85 ? int(rand, 1, 6) : int(rand, 7, 99));

export const comboName = ({ algorithm, options }) =>
  [algorithm, ...Object.entries(options).map(([k, v]) => `${k}=${v}`)].join(' ');
