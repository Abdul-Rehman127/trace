// Runs an agent without blocking the page. One interface for the whole section:
//   runAgent(key, board, options, onProgress) -> { promise, cancel }
// The promise resolves with the agent's result plus `ms` (the time spent computing), or
// null when cancelled.
//
// Normally the search runs in a Web Worker (app.worker.[hash].js), allowed by
// `worker-src 'self'`. Creating a worker is a Trusted Types sink, so a single named policy,
// `trace-worker` (the only one the CSP allows), turns exactly that one URL into a
// TrustedScriptURL and refuses every other. Cancelling terminates the worker; a fresh one
// starts on the next request. If a worker cannot be created, the same generators run on the
// main thread in slices of about 5 ms instead.
import { AGENTS } from '../../engine/ai/c4.mjs';

/* global __AI_WORKER_URL__ */
const WORKER_URL = typeof __AI_WORKER_URL__ === 'string' ? __AI_WORKER_URL__ : null;

let policy;
function workerScriptURL() {
  if (!window.trustedTypes) return WORKER_URL;
  if (policy === undefined) {
    try {
      policy = window.trustedTypes.createPolicy('trace-worker', {
        createScriptURL: (url) => {
          if (url !== WORKER_URL) throw new TypeError('Only the Trace AI worker may be loaded.');
          return url;
        },
      });
    } catch {
      policy = null;
    }
  }
  return policy ? policy.createScriptURL(WORKER_URL) : null;
}

let worker = null;
let workerFailed = false;
let nextId = 1;
const pending = new Map(); // id -> { resolve, onProgress }

function getWorker() {
  if (worker || workerFailed || !WORKER_URL || typeof Worker === 'undefined') return worker;
  try {
    const url = workerScriptURL();
    if (!url) throw new Error('no trusted URL');
    worker = new Worker(url);
    worker.onmessage = (e) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      if (e.data.done) {
        pending.delete(e.data.id);
        job.resolve(e.data.result);
      } else job.onProgress(e.data.progress);
    };
    worker.onerror = () => {
      // A broken worker: finish anything waiting with null and fall back to the main thread.
      workerFailed = true;
      stopWorker();
    };
  } catch {
    workerFailed = true;
    worker = null;
  }
  return worker;
}

function stopWorker() {
  if (worker) worker.terminate();
  worker = null;
  for (const job of pending.values()) job.resolve(null);
  pending.clear();
}

/** Which way searches run, for the tests: 'worker' or 'main thread'. */
export const runnerMode = () => (getWorker() ? 'worker' : 'main thread');

export function runAgent(key, board, options = {}, onProgress = () => {}) {
  const w = getWorker();
  if (w) {
    const id = nextId++;
    const promise = new Promise((resolve) => pending.set(id, { resolve, onProgress }));
    w.postMessage({ id, key, board: JSON.parse(JSON.stringify(board)), options });
    return {
      promise,
      cancel() {
        // A search cannot be interrupted inside the worker, so the worker is replaced.
        if (pending.has(id)) stopWorker();
      },
    };
  }
  return runSliced(key, board, options, onProgress);
}

// ---------- fallback: time-sliced on the main thread ----------

const SLICE_MS = 5;
// A macrotask that is not clamped like setTimeout: one message per slice.
const channel = new MessageChannel();
const queue = [];
channel.port1.onmessage = () => queue.shift()?.();
const nextTick = () =>
  new Promise((resolve) => {
    queue.push(resolve);
    channel.port2.postMessage(0);
  });

function runSliced(key, board, options, onProgress) {
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

/** Start the worker (or warm the main-thread code) while the page is idle. */
export function warmUp(board) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  idle(() => {
    for (const key of Object.keys(AGENTS)) runAgent(key, board, { depth: 2, iterations: 50, seed: 1 });
  });
}
