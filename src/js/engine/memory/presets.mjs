// Preset reference strings for page replacement (see sections/memory/SPEC.md).

const CLASSIC = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

export const PAGING_PRESETS = [
  { key: 'classic', label: 'Classic example', refs: CLASSIC, frames: 3 },
  { key: 'belady', label: "Belady's anomaly", refs: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], frames: 3 },
  { key: 'loop', label: 'Loop', refs: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4], frames: 3 },
  { key: 'locality', label: 'Locality', refs: [1, 2, 1, 3, 1, 2, 1, 4, 1, 2, 1, 3], frames: 3 },
];

/** The default input for a page (the classic example). */
export function defaultPaging(algorithm) {
  return { algorithm, refs: CLASSIC.slice(), frames: 3, options: { newBit: 1 } };
}

export const ALG_NAMES = { fifo: 'FIFO', lru: 'LRU', opt: 'Optimal', clock: 'Clock' };
