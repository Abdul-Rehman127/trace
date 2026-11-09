// The AI search worker: runs one agent at a time off the main thread and reports progress
// and the result. Bundled on its own (app.worker.[hash].js); runner.mjs is the only caller.
import { AGENTS } from './engine/ai/c4.mjs';

self.onmessage = (e) => {
  const { id, key, board, options } = e.data;
  const t0 = performance.now();
  let lastPost = t0;
  const gen = AGENTS[key].make(board, options);
  for (;;) {
    const r = gen.next();
    if (r.done) {
      self.postMessage({ id, done: true, result: { ...r.value, ms: performance.now() - t0 } });
      return;
    }
    const now = performance.now();
    if (now - lastPost > 100) {
      lastPost = now;
      self.postMessage({ id, done: false, progress: r.value });
    }
  }
};
