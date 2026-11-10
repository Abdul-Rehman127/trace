// mulberry32: a small, fast, deterministic PRNG. Returns floats in [0, 1).
// Shared by seeded features (practice questions, game agents) and the tests.
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
