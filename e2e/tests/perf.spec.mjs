// Frame times while playing at 4x speed under a 4x CPU throttle (headless Chromium).
// Each scenario is measured 3 times on a fresh page; the median of each metric is used.
//   Typical load (5 processes, bursts up to 20): p95 under 20 ms and no frame over 50 ms.
//   Heavy case (8 processes x 99-unit bursts, Round Robin q=2): p95 under 20 ms.
import { test, expect } from '@playwright/test';

const BASE = '/operating-systems/cpu-scheduling/round-robin/';
const TYPICAL = `${BASE}?alg=rr&q=2&tie=new&p=0:12,2:20,4:7,6:15,8:9`;
const HEAVY = `${BASE}?alg=rr&q=2&tie=new&p=0:99,1:99,2:99,3:99,4:99,5:99,6:99,7:99`;
const RUNS = 3;
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
