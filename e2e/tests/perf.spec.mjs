// Frame times while playing at 4x speed under a 4x CPU throttle (headless Chromium).
// Each scenario is measured 5 times on a fresh page; the median of each metric is used.
//   Typical load (5 processes, bursts up to 20): p95 under 20 ms and no frame over 50 ms.
//   Heavy case (8 processes x 99-unit bursts, Round Robin q=2): p95 under 20 ms.
import { test, expect } from '@playwright/test';

const BASE = '/operating-systems/cpu-scheduling/round-robin/';
const TYPICAL = `${BASE}?alg=rr&q=2&tie=new&p=0:12,2:20,4:7,6:15,8:9`;
const HEAVY = `${BASE}?alg=rr&q=2&tie=new&p=0:99,1:99,2:99,3:99,4:99,5:99,6:99,7:99`;
const RUNS = 5; // median of five: one noisy run cannot decide the result
const SECONDS = 6;

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function measureOnce(browser, url) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForFunction(() => !!window.__trace);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.locator('[data-speed] [data-value="4"]').click();
  const stats = await page.evaluate(
    (seconds) =>
      new Promise((resolve) => {
        const deltas = [];
        let last = 0;
        const start = performance.now();
        window.__trace.player.play();
        function tick(ts) {
          if (last) deltas.push(ts - last);
          last = ts;
          if (ts - start < seconds * 1000 && window.__trace.player.playing) requestAnimationFrame(tick);
          else {
            window.__trace.player.pause();
            const sorted = [...deltas].sort((a, b) => a - b);
            resolve({
              frames: deltas.length,
              p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
              max: +sorted[sorted.length - 1].toFixed(1),
            });
          }
        }
        requestAnimationFrame(tick);
      }),
    SECONDS,
  );
  await context.close();
  return stats;
}

async function measure(browser, url, info, name) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await measureOnce(browser, url));
  const result = { runs, p95: median(runs.map((r) => r.p95)), max: median(runs.map((r) => r.max)) };
  console.log(`${name} frame times: ${JSON.stringify(result)}`);
  info.annotations.push({ type: `${name} frame times`, description: JSON.stringify(result) });
  return result;
}

test('typical load: median p95 under 20 ms and median max under 50 ms @perf', async ({ browser }, info) => {
  test.setTimeout(120000);
  const r = await measure(browser, TYPICAL, info, 'typical');
  expect(r.p95).toBeLessThan(20);
  expect(r.max).toBeLessThan(50);
});

test('heavy case: median p95 under 20 ms @perf', async ({ browser }, info) => {
  test.setTimeout(120000);
  const r = await measure(browser, HEAVY, info, 'heavy');
  expect(r.p95).toBeLessThan(20);
});

// Memory section, heaviest case: Clock with 8 frames and 40 two-digit references, so every
// step rewrites the narration, the eight-slot side list and scrolls the step table.
const MEMORY_HEAVY = `/memory/page-replacement/clock/?alg=clock&f=8&r=${Array.from({ length: 40 }, (_, i) => ((i * 37) % 23) + 10).join(',')}`;

test('memory heavy case: median p95 under 20 ms and median max under 50 ms @perf', async ({ browser }, info) => {
  test.setTimeout(120000);
  const r = await measure(browser, MEMORY_HEAVY, info, 'memory heavy');
  expect(r.p95).toBeLessThan(20);
  expect(r.max).toBeLessThan(50);
});

// Networking, heaviest case: the TCP simulator with data and the lost-SYN scenario (the
// longest timeline), playing at 4x.
test('networking heavy case (TCP): median p95 under 20 ms and median max under 50 ms @perf', async ({ browser }, info) => {
  test.setTimeout(120000);
  const r = await measure(browser, '/networking/tcp-handshake/?s=lost&c=4294967290&sv=4294967290&d=1460', info, 'networking heavy');
  expect(r.p95).toBeLessThan(20);
  expect(r.max).toBeLessThan(50);
});

// Logic, heaviest case: a six-variable circuit with many gates, the change travelling
// through every level at 4x.
test('logic heavy case (circuit): median p95 under 20 ms and median max under 50 ms @perf', async ({ browser }, info) => {
  test.setTimeout(180000);
  const expr = encodeURIComponent('((A XOR B) AND (C OR D)) XOR ((E NAND F) OR (A NOR C)) AND ((B XNOR E) XOR NOT (D AND F))');
  const r = await measure(browser, `/logic/circuit/?e=${expr}&in=101010`, info, 'logic heavy');
  expect(r.p95).toBeLessThan(20);
  expect(r.max).toBeLessThan(50);
});

