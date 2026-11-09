// AI: the game tree explorer steps through searches with the right counts, the arena plays
// a reproducible game and explains each move, the compare page asks every agent, a search
// can be stopped, and nothing blocks the page.
import { test, expect } from '@playwright/test';

const AI = '/ai/';

async function open(page, path) {
  const problems = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto(path);
  await page.waitForFunction(() => !!window.__trace);
  return async () => {
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    expect(problems).toEqual([]);
  };
}

test('game tree: stepping to the end shows the final node count; alpha-beta examines fewer and cuts branches', async ({ page }) => {
  const done = await open(page, `${AI}game-tree/`);
  await page.evaluate(() => window.__trace.player.seek(window.__trace.player.length, { animate: false }));
  await expect(page.locator('[data-ai-nodes]')).not.toHaveText('0');
  const mm = Number((await page.locator('[data-ai-nodes]').textContent()).replace(/,/g, ''));
  await expect(page.locator('[data-ai-pruned]')).toHaveText('0');
  await page.locator('[data-ai-alg] [data-value="alphabeta"]').click();
  await page.evaluate(() => window.__trace.player.seek(window.__trace.player.length, { animate: false }));
  await expect(page.locator('[data-ai-pruned]')).not.toHaveText('0');
  const ab = Number((await page.locator('[data-ai-nodes]').textContent()).replace(/,/g, ''));
  expect(ab).toBeLessThanOrEqual(mm);
  expect(Number(await page.locator('[data-ai-pruned]').textContent())).toBeGreaterThan(0);
  await expect(page.locator('[data-ai-summary]')).toContainText(`${mm.toLocaleString('en-US')} positions`);
  // Playing a square changes the position and the link.
  await page.locator('[data-ai-board] [data-sq="1"]').click();
  await expect.poll(() => page.url()).toContain('b=XO..O.X..');
  await done();
});

test('arena: a seeded game is reproducible and every move is explained', async ({ page }) => {
  test.setTimeout(90000);
  const done = await open(page, `${AI}connect-four/?red=greedy&yellow=alphabeta&seed=3&depth=2&it=200`);
  await page.locator('[data-ai-run]').click();
  await expect(page.locator('[data-ai-status]')).toContainText(/wins|Draw/, { timeout: 60000 });
  const first = await page.evaluate(() => window.__trace.record.map((r) => r.col).join(''));
  await page.locator('[data-act="reset"]').click();
  await page.locator('[data-act="fwd"]').click();
  await expect(page.locator('[data-why-explain]')).toContainText('Greedy (Red) plays column');
  await page.locator('[data-act="fwd"]').click();
  await expect(page.locator('[data-why-explain] .c4-scores tr.chosen')).toHaveCount(1);
  await page.locator('[data-ai-run]').click();
  await expect.poll(() => page.evaluate(() => window.__trace.record.map((r) => r.col).join('')), { timeout: 60000 }).toBe(first);
  await done();
});

test('arena: you can play against an agent', async ({ page }) => {
  const done = await open(page, `${AI}connect-four/?red=random&yellow=greedy&seed=1`);
  await page.locator('[data-ai-human] summary').click();
  await page.locator('[data-ai-human-start]').click();
  await page.locator('[data-drop="3"]').click();
  await expect.poll(() => page.evaluate(() => window.__trace.record.length), { timeout: 10000 }).toBe(2);
  await expect(page.locator('[data-ai-status]')).toContainText('Your move');
  await done();
});

test('compare: every agent answers, alpha-beta matches minimax with no more work, and a stop works', async ({ page }) => {
  test.setTimeout(90000);
  const done = await open(page, `${AI}compare/?m=44433523&depth=3&it=300`);
  await page.locator('[data-cmp-run]').click();
  await expect(page.locator('[data-cmp-status]')).toContainText('Every agent answered', { timeout: 60000 });
  const r = await page.evaluate(() => window.__trace.results);
  expect(r.alphabeta.move).toBe(r.minimax.move);
  expect(r.alphabeta.nodes).toBeLessThanOrEqual(r.minimax.nodes);
  await expect(page.locator('[data-cmp-rows] tr')).toHaveCount(5);
  // Stop a long search.
  await page.locator('#ai-depth').fill('6');
  await page.locator('#ai-it').fill('20000');
  await page.locator('[data-cmp-run]').click();
  await page.locator('[data-cmp-cancel]').click();
  await expect(page.locator('[data-cmp-status]')).toHaveText('Stopped.', { timeout: 10000 });
  await done();
});

test('390 px: no sideways page scroll on any AI page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['game-tree/', 'connect-four/', 'compare/']) {
    await page.goto(`${AI}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBe(390);
  }
});

test('no layout shift while loading the AI pages @chromium-only', async ({ page }) => {
  await page.route('**/*.woff2', (r) => r.abort());
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const path of ['game-tree/', 'connect-four/', 'compare/']) {
    await page.goto(`${AI}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__cls), path).toBe(0);
  }
});

test('searches run in a Web Worker allowed by the CSP, and Trusted Types still block anything else', async ({ page, browserName }) => {
  const done = await open(page, `${AI}compare/?m=44433523&depth=3&it=200`);
  expect(await page.evaluate(() => window.__trace.runnerMode())).toBe('worker');
  await page.locator('[data-cmp-run]').click();
  await expect(page.locator('[data-cmp-status]')).toContainText('Every agent answered', { timeout: 60000 });
  const csp = await page.evaluate(async () => (await fetch(location.href)).headers.get('content-security-policy'));
  expect(csp).toContain("worker-src 'self'");
  expect(csp).toContain('trusted-types trace-worker');
  // The app itself caused no violation while running every agent in the worker.
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  if (browserName === 'chromium') {
    // No other policy can be made, and a worker from any other URL is refused.
    const checks = await page.evaluate(() => {
      const out = {};
      try {
        trustedTypes.createPolicy('other', { createScriptURL: (u) => u });
        out.policy = 'allowed';
      } catch {
        out.policy = 'blocked';
      }
      try {
        new Worker('/favicon.svg');
        out.worker = 'allowed';
      } catch {
        out.worker = 'blocked';
      }
      return out;
    });
    expect(checks).toEqual({ policy: 'blocked', worker: 'blocked' });
    return;
  }
  await done();
});
