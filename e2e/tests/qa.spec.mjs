// QA checklist (brief section 18): keyboard-only use with visible focus, skip link,
// worked examples reproduced in the simulator, no duplicated copy, accessibility tree.
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

const CPU = '/operating-systems/cpu-scheduling/';
const ALG = { fcfs: 'fcfs/', sjf: 'sjf/', srtf: 'srtf/', priority: 'priority/', rr: 'round-robin/' };

test('skip link is the first stop, visible on focus, and moves focus to main', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari tabs to links only with Option-Tab by default');
  await page.goto(`${CPU}round-robin/`);
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip');
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('keyboard only: every control is reachable in order and shows a focus ring', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit only tabs to form fields by default (a macOS setting), so this pass runs in Chromium');
  await page.goto(`${CPU}round-robin/`);
  await page.waitForFunction(() => !!window.__trace);
  await page.locator('[data-log] summary').evaluate((el) => el.parentElement.removeAttribute('open'));
  const seen = [];
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const name = el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30) || el.id || el.tagName;
      return {
        key: `${el.tagName.toLowerCase()}:${name}`,
        ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
        visible: r.width > 0 && r.height > 0,
        inFooter: !!el.closest('footer'),
      };
    });
    if (seen.length && info.key === seen[0].key) break;
    seen.push(info);
    if (info.inFooter) break;
  }
  const keys = seen.map((s) => s.key);
  for (const expected of [
    'a:Skip to content', 'a:Trace', 'button:Switch to', 'a:FCFS', 'input:Arrival for P1', 'input:Burst for P1', 'button:Remove P1',
    'button:Add process', 'input:opt-quantum', 'button:New arrival first', 'button:Classic example', 'button:Copy link',
    'button:Step back', 'button:Play', 'button:Step forward', 'button:Reset', 'button:1x', 'div:Timeline position',
    'summary:Decision log', 'summary:Keyboard shortcuts',
  ]) {
    expect(keys.some((k) => k.startsWith(expected)), `reachable: ${expected}`).toBe(true);
  }
  for (const s of seen) {
    expect(s.visible, `${s.key} visible`).toBe(true);
    expect(s.ring, `${s.key} has a visible focus ring`).toBe(true);
  }
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/tab-order.txt', keys.join('\n'));
});

for (const [alg, path] of Object.entries(ALG)) {
  test(`${alg}: the worked example opens in the simulator with the same numbers`, async ({ page }) => {
    await page.goto(CPU + path);
    const foot = page.locator('.example tfoot td');
    const n = await foot.count();
    const written = (await foot.allTextContents()).slice(n - 3).map((t) => t.split(' ')[0]); // turnaround, waiting, response
    const rowsWritten = await page.locator('.example tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent.trim())));
    const href = await page.locator('.open-link').getAttribute('href');
    await page.goto(href);
    await page.waitForFunction(() => !!window.__trace);
    const sim = [];
    for (const k of ['turnaround', 'waiting', 'response']) sim.push(await page.locator(`[data-avg="${k}"]`).textContent());
    expect(sim.map((v) => Number(v))).toEqual(written.map((v) => Number(v)));
    // Rows match too
    const rowsSim = await page.locator('[data-result-rows] tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent.trim())));
    for (const row of rowsSim) {
      const w = rowsWritten.find((r) => r[0] === row[0]);
      expect([w[0], ...w.slice(-4)], row[0]).toEqual([row[0], ...row.slice(-4)]);
    }
  });
}

test('no paragraph is repeated across the algorithm pages', async ({ request }) => {
  const seen = new Map();
  for (const path of Object.values(ALG)) {
    const html = await (await request.get(CPU + path)).text();
    const article = /<article class="prose">([\s\S]*?)<\/article>/.exec(html)[1];
    for (const m of article.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/g)) {
      const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text.length < 60 || text.startsWith('Email:')) continue;
      expect(seen.get(text), `"${text.slice(0, 60)}..." appears on ${seen.get(text)} and ${path}`).toBeUndefined();
      seen.set(text, path);
    }
  }
});

test('accessibility tree of the simulator has names for every control', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'snapshot recorded once, in Chromium');
  await page.goto(`${CPU}round-robin/`);
  await page.waitForFunction(() => !!window.__trace);
  const snap = await page.locator('main').ariaSnapshot();
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/aria-snapshot.yml', snap);
  for (const needle of [
    'heading "Round Robin scheduling" [level=1]',
    'slider "Timeline position"',
    'img "Timeline: P1 runs 0 to 2',
    'button "Play"',
    'button "Step back"',
    'textbox "Burst for P2"',
    'button "Remove P2"',
    'heading "Results" [level=2]',
    'heading "Worked example" [level=2]',
  ]) {
    expect(snap, needle).toContain(needle);
  }
  // No unnamed buttons or inputs anywhere in main.
  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll('main button, main input, main [role="slider"]')]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => !(el.getAttribute('aria-label') || el.textContent.trim() || (el.id && document.querySelector(`label[for="${el.id}"]`))))
      .map((el) => el.outerHTML.slice(0, 80)),
  );
  expect(unnamed).toEqual([]);
});
