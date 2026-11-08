// Frame times while playing the heaviest scenario: 8 processes with 99-unit bursts,
// Round Robin q=2, at 4x, under a 4x CPU throttle. Budget: p95 under 20 ms, no frame over 50 ms.
import { test, expect } from '@playwright/test';

const HEAVY = '/operating-systems/cpu-scheduling/round-robin/?alg=rr&q=2&tie=new&p=0:99,1:99,2:99,3:99,4:99,5:99,6:99,7:99';

test('p95 frame time under 20 ms, no frame over 50 ms (4x CPU throttle) @perf', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.goto(HEAVY);
  await page.waitForFunction(() => !!window.__trace);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.locator('[data-speed] [data-value="4"]').click();
  const stats = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const deltas = [];
        let last = 0;
        const start = performance.now();
        window.__trace.player.play();
        function tick(ts) {
          if (last) deltas.push(ts - last);
          last = ts;
          if (ts - start < 6000) requestAnimationFrame(tick);
          else {
            window.__trace.player.pause();
            const sorted = [...deltas].sort((a, b) => a - b);
            resolve({
              frames: deltas.length,
              p50: sorted[Math.floor(sorted.length * 0.5)],
              p95: sorted[Math.floor(sorted.length * 0.95)],
              max: sorted[sorted.length - 1],
              elements: document.querySelectorAll('[data-graphic] *').length,
            });
          }
        }
        requestAnimationFrame(tick);
      }),
  );
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log(`frame times: ${JSON.stringify(stats)}`);
  info.annotations.push({ type: 'frame-times', description: JSON.stringify(stats) });
  expect(stats.p95).toBeLessThan(20);
  expect(stats.max).toBeLessThan(50);
});
