// Runs an agent without blocking the page: the agent is a generator, pumped in slices of about
// 5 ms with a yield to the browser in between. One interface for the whole section:
//   runAgent(key, board, options, onProgress) -> { promise, cancel }
// The promise resolves with the agent's result plus `ms` (the time spent computing, slices
// summed). A Web Worker needs `worker-src 'self'` in the CSP, which is waiting for the
// owner's approval; switching to one later only changes this file.
import { AGENTS } from '../../engine/ai/c4.mjs';

const SLICE_MS = 5;
// A macrotask that is not clamped like setTimeout: one message per slice.
const channel = new MessageChannel();
const queue = [];
channel.port1.onmessage = () => queue.shift()?.();
const nextTick = () => new Promise((resolve) => {
  queue.push(resolve);
  channel.port2.postMessage(0);
});

export function runAgent(key, board, options = {}, onProgress = () => {}) {
  let cancelled = false;
  const gen = AGENTS[key].make(board, options);
  const promise = (async () => {
    // Start in a fresh task, so agents run one after another never share a frame.
    await nextTick();
    let ms = 0;
    for (;;) {
      if (cancelled) return null;
      const t0 = performance.now();
      let r;
      do r = gen.next();
      while (!r.done && performance.now() - t0 < SLICE_MS);
      ms += performance.now() - t0;
      if (r.done) return { ...r.value, ms };
      onProgress(r.value);
      await nextTick();
    }
  })();
  return {
    promise,
    cancel() {
      cancelled = true;
    },
  };
}

/**
 * Run every agent once on a tiny search while the page is idle, so the browser has compiled
 * the search code before the first real request (the first search otherwise pays for it
 * with one long frame).
 */
export function warmUp(board) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  idle(() => {
    for (const key of Object.keys(AGENTS)) runAgent(key, board, { depth: 2, iterations: 50, seed: 1 });
  });
}
