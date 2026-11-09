// Page replacement: the simulator, its state across reset, input changes and hidden tabs,
// share links, validation, the one-more-frame panel, the overview selector, the compare
// page, small screens, reduced motion and layout stability.
import { test, expect } from '@playwright/test';

const PR = '/memory/page-replacement/';
const PAGES = { fifo: 'fifo/', lru: 'lru/', opt: 'optimal/', clock: 'clock/' };
const CLASSIC_FAULTS = { fifo: 15, lru: 12, opt: 9, clock: 14 };

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
const k = (page) => page.locator('[data-pg-scroll] table.pg').getAttribute('data-k');
const totals = (page, label) => page.locator('[data-totals] div', { hasText: label }).locator('dd');

for (const [alg, path] of Object.entries(PAGES)) {
  test(`${alg}: the classic example ends with ${CLASSIC_FAULTS[alg]} faults and every step narrates`, async ({ page }) => {
    const done = await open(page, `${PR}${path}`);
    await expect(page.locator('[data-clock-total]')).toHaveText('20');
    await expect(totals(page, 'Page faults')).toHaveText(String(CLASSIC_FAULTS[alg]));
    expect(await k(page)).toBe('0');
    await expect(page.locator('[data-why-text]')).toContainText('All 3 frames are empty');
    const seen = new Set();
    for (let i = 1; i <= 20; i++) {
      await page.locator('[data-act="fwd"]').click();
      await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', String(i));
      const why = await page.locator('[data-why-text]').textContent();
      expect(why).toMatch(/^Page \d+ is /);
      seen.add(why);
    }
    expect(seen.size).toBeGreaterThan(10);
    await expect(page.locator('[data-view] li:not(.slot)')).toHaveCount(3);
    await done();
  });
}

test('reset, an input change and a preset mid-play leave no stale state', async ({ page }) => {
  const done = await open(page, `${PR}clock/`);
  await page.locator('[data-speed] [data-value="4"]').click();
  await page.locator('[data-act="play"]').click();
  await expect.poll(() => k(page).then(Number)).toBeGreaterThan(2);
  // Reset while playing.
  await page.locator('[data-act="reset"]').click();
  expect(await page.evaluate(() => window.__trace.player.playing)).toBe(false);
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', '0');
  await expect(page.locator('[data-why-text]')).toContainText('frames are empty');
  // Change the input while playing.
  await page.locator('[data-act="play"]').click();
  await expect.poll(() => k(page).then(Number)).toBeGreaterThan(1);
  await page.locator('#pg-refs').fill('1 2 3 4 1 2');
  await expect(page.locator('[data-clock-total]')).toHaveText('6');
  expect(await page.evaluate(() => window.__trace.player.playing)).toBe(false);
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', '0');
  await expect(page.locator('[data-pg-scroll] table.pg thead tr.pg-step th[scope="col"]')).toHaveCount(6);
  await expect(page.locator('[data-view] li.slot')).toHaveCount(3);
  // A preset mid-play, then play to the end.
  await page.locator('[data-act="play"]').click();
  await page.locator('[data-preset="belady"]').click();
  await expect(page.locator('[data-clock-total]')).toHaveText('12');
  await page.locator('[data-act="play"]').click();
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', '12', { timeout: 10000 });
  await expect(totals(page, 'Page faults')).toHaveText('9');
  await done();
});

test('backgrounding the tab freezes playback and it resumes from the same step', async ({ page }) => {
  const done = await open(page, `${PR}fifo/`);
  await page.locator('[data-act="play"]').click();
  await expect.poll(() => k(page).then(Number)).toBeGreaterThan(0);
  const setHidden = (hidden) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await setHidden(true);
  const frozen = await page.evaluate(() => window.__trace.player.time);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__trace.player.time)).toBe(frozen);
  await setHidden(false);
  await expect.poll(() => page.evaluate(() => window.__trace.player.time)).toBeGreaterThan(frozen);
  const t = await page.evaluate(() => window.__trace.player.time);
  expect(t - frozen).toBeLessThan(2.5);
  // The table always shows the player's step.
  await page.locator('[data-act="play"]').click();
  const now = await page.evaluate(() => Math.floor(window.__trace.player.time + 1e-9));
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', String(now));
  await done();
});

test('share link round trip keeps pages, frames and the Clock bit', async ({ page }) => {
  const done = await open(page, `${PR}clock/`);
  await page.locator('#pg-refs').fill('3, 1, 4, 1, 5, 9, 2, 6, 5, 3');
  await page.locator('#pg-frames').fill('4');
  await page.locator('[data-bit] [data-value="0"]').click();
  await expect.poll(() => page.url()).toContain('alg=clock&f=4&r=3,1,4,1,5,9,2,6,5,3&bit=0');
  const faults = await totals(page, 'Page faults').textContent();
  // Other algorithm links carry the pages along.
  await expect(page.locator('[data-alg-link="lru"]')).toHaveAttribute('href', /\?alg=lru&f=4&r=3,1,4,1,5,9,2,6,5,3$/);
  await page.goto(page.url());
  await page.waitForFunction(() => !!window.__trace);
  await expect(page.locator('#pg-refs')).toHaveValue('3, 1, 4, 1, 5, 9, 2, 6, 5, 3');
  await expect(page.locator('#pg-frames')).toHaveValue('4');
  await expect(page.locator('[data-bit] [data-value="0"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(totals(page, 'Page faults')).toHaveText(faults);
  await done();
});

test('invalid input shows a specific message and keeps the last valid run', async ({ page }) => {
  const done = await open(page, `${PR}lru/`);
  await page.locator('#pg-refs').fill('1, 2, 140');
  await expect(page.locator('#pg-refs-err')).toHaveText('Page 140 is out of range. Use whole numbers from 0 to 99.');
  await expect(page.locator('#pg-refs')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-clock-total]')).toHaveText('20');
  await page.locator('#pg-frames').fill('9');
  await expect(page.locator('#pg-frames-err')).toHaveText('Frames must be a whole number from 1 to 8.');
  await page.locator('#pg-refs').fill('1, 2, 3');
  await page.locator('#pg-frames').fill('2');
  await expect(page.locator('#pg-refs-err')).toBeHidden();
  await expect(page.locator('#pg-frames-err')).toBeHidden();
  await expect(page.locator('[data-clock-total]')).toHaveText('3');
  await done();
});

test("Belady's anomaly preset shows 9 against 10 faults with careful wording", async ({ page }) => {
  const done = await open(page, `${PR}fifo/`);
  await page.locator('[data-preset="belady"]').click();
  const cards = page.locator('.pg-more-card .pg-more-head');
  await expect(cards.nth(0)).toHaveText(/3 frames\s*9 faults/);
  await expect(cards.nth(1)).toHaveText(/4 frames\s*10 faults/);
  await expect(page.locator('.pg-more-note')).toContainText("This is Belady's anomaly. FIFO and Clock can show it; LRU and Optimal cannot.");
  await expect(page.locator('[data-preset="belady"]')).toHaveAttribute('aria-pressed', 'true');
  await done();
});

test('overview: the selector switches algorithm in place and the link follows', async ({ page }) => {
  const done = await open(page, PR);
  await expect(totals(page, 'Page faults')).toHaveText('15');
  await page.locator('[data-alg-choice="lru"]').click();
  await expect(totals(page, 'Page faults')).toHaveText('12');
  await expect(page.locator('[data-view-label]')).toHaveText('Recent use, least recent first');
  await page.locator('[data-alg-choice="clock"]').click();
  await expect(page.locator('.opt-clock')).toBeVisible();
  await expect.poll(() => page.url()).toContain('alg=clock');
  await done();
});

test('compare page: four rows, links carry the pages, the frame table marks a rise', async ({ page }) => {
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto(`${PR}compare/`);
  const rows = page.locator('[data-cmp-rows] tr');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0).locator('td').first()).toHaveText('15');
  await expect(rows.nth(2).locator('td').first()).toHaveText('9 fewest');
  await expect(rows.nth(0).locator('a')).toHaveAttribute('href', /fifo\/\?alg=fifo&f=3&r=7,0,1,2/);
  await page.locator('[data-preset="belady"]').click();
  const fifoRow = page.locator('[data-byframes] tr').first();
  await expect(fifoRow.locator('td.up')).toHaveCount(1);
  await expect(fifoRow.locator('td.up')).toContainText('10');
  await expect(page.locator('[data-cmp-note]')).toContainText("Belady's anomaly");
  expect(problems).toEqual([]);
});

test('390 px: no sideways page scroll on any memory page, and the table scrolls inside its box', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['', 'fifo/', 'lru/', 'optimal/', 'clock/', 'compare/']) {
    await page.goto(`${PR}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBe(390);
  }
  await page.goto(`${PR}fifo/`);
  await page.waitForFunction(() => !!window.__trace);
  const s = await page.locator('[data-pg-scroll]').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
  expect(s.sw).toBeGreaterThan(s.cw);
});

test('reduced motion: stepping animates nothing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${PR}fifo/`);
  await page.waitForFunction(() => !!window.__trace);
  for (let i = 0; i < 4; i++) await page.locator('[data-act="fwd"]').click();
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
});

test('no layout shift while loading and while playing to the end @chromium-only', async ({ page }) => {
  // Web fonts are blocked here so a shift can only come from the page itself; the font swap
  // (kept by the owner, with metric overrides) is measured by Lighthouse and fontswap.spec.
  await page.route('**/*.woff2', (r) => r.abort());
  await page.addInitScript(() => {
    window.__cls = 0;
    window.__clsSources = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__cls += e.value;
        for (const s of e.sources) window.__clsSources.push(`${s.node ? (s.node.className || s.node.nodeName) + " [" + (s.node.textContent || "").trim().slice(0, 30) + "]" : "?"} x ${s.previousRect.x}->${s.currentRect.x} w ${s.previousRect.width}->${s.currentRect.width} y ${s.previousRect.y}->${s.currentRect.y} h${s.previousRect.height}->${s.currentRect.height} at ${Math.round(e.startTime)}ms`);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const path of ['fifo/', 'clock/']) {
    await page.goto(`${PR}${path}`);
    await page.waitForFunction(() => !!window.__trace);
    await page.evaluate(() => {
      window.__trace.player.setSpeed(4);
      window.__trace.player.play();
    });
    await page.waitForFunction(() => !window.__trace.player.playing, null, { timeout: 15000 });
    expect(await page.evaluate(() => window.__cls), `${path} ${await page.evaluate(() => window.__clsSources.join(' | '))}`).toBe(0);
  }
});

test('keyboard only on a memory page: every control is reachable with a focus ring @chromium-only', async ({ page }) => {
  await page.goto(`${PR}clock/`);
  await page.waitForFunction(() => !!window.__trace);
  const seen = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return {
        key: `${el.tagName.toLowerCase()}:${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30) || el.id}`,
        ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
        footer: !!el.closest('footer'),
      };
    });
    seen.push(info);
    if (info.footer) break;
  }
  const keys = seen.map((s) => s.key);
  for (const expected of ['a:Skip to content', 'a:FIFO', 'textarea:', 'input:pg-frames', 'button:Starts at 1', 'button:Classic example', 'button:Copy link', 'button:Play', 'button:Reset', 'div:Step table', 'div:Step', 'summary:Decision log']) {
    expect(keys.some((x) => x.startsWith(expected)), `reachable: ${expected}`).toBe(true);
  }
  for (const s of seen) expect(s.ring, `${s.key} has a focus ring`).toBe(true);
  // Keys move the step when the slider has focus.
  await page.locator('[data-ruler]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', '1');
  await page.keyboard.press('End');
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', '20');
});

test('the decision log lists every step and jumps there', async ({ page }) => {
  const done = await open(page, `${PR}optimal/`);
  await page.locator('[data-log] summary').click();
  await expect(page.locator('.log-line')).toHaveCount(21);
  await page.locator('.log-line').nth(5).click();
  await expect(page.locator('[data-pg-scroll] table.pg')).toHaveAttribute('data-k', '5');
  await expect(page.locator('.log-line').nth(5)).toHaveAttribute('aria-current', 'step');
  await done();
});

// ---------- fixes from the section 1 review ----------

const FORTY = Array.from({ length: 40 }, (_, i) => ((i * 37) % 89) + 10).join(',');
const refsOf = (n) => FORTY.split(',').slice(0, n).join(',');

for (const width of [1440, 390]) {
  test(`the reference field shows all 40 references at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${PR}fifo/?alg=fifo&f=3&r=${FORTY}`);
    await page.waitForFunction(() => !!window.__trace);
    const field = page.locator('#pg-refs');
    await expect(field).toHaveValue(FORTY.split(',').join(', '));
    await expect.poll(() => field.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    expect(await field.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    // Typing more keeps it fully visible too.
    await field.fill(`${FORTY.split(',').slice(0, 30).join(', ')}, 1, 2`);
    await expect.poll(() => field.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  });
}

for (const width of [1440, 1024, 390]) {
  for (const n of [20, 30, 40]) {
    test(`step table at ${width} px with ${n} references: every column reachable, playhead in view @chromium-only`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${PR}clock/?alg=clock&f=4&r=${refsOf(n)}`);
      await page.waitForFunction(() => !!window.__trace);
      const scroller = page.locator('[data-pg-scroll]');
      const fits = await scroller.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      if (width === 1440 && n === 20) expect(fits, '20 steps fit at 1440 without scrolling').toBe(true);
      // A cue shows exactly when columns are hidden to the right.
      await expect(page.locator('[data-pg-cue]')).toBeVisible({ visible: !fits });
      // Jump to the end: the last column is inside the visible part of the table.
      await page.evaluate(() => window.__trace.player.seek(window.__trace.player.length, { animate: false }));
      const inView = async (col) =>
        page.evaluate((c) => {
          const box = document.querySelector('[data-pg-scroll]').getBoundingClientRect();
          const cell = document.querySelector(`[data-pg-scroll] tr.pg-step th:nth-child(${c + 1})`).getBoundingClientRect();
          const label = document.querySelector('[data-pg-scroll] tr.pg-step th:first-child').getBoundingClientRect();
          return cell.left >= label.right - 1 && cell.right <= box.right + 1;
        }, col);
      await expect.poll(() => inView(n)).toBe(true);
      if (!fits) await expect(page.locator('[data-pg-cue]')).toBeHidden();
      // Stepping back from the end keeps the playhead column in view too.
      for (let i = 0; i < 3; i++) await page.locator('[data-act="back"]').click();
      await expect.poll(() => inView(n - 3)).toBe(true);
      await page.evaluate(() => window.__trace.player.seek(1, { animate: false }));
      await expect.poll(() => inView(1)).toBe(true);
    });
  }
}

for (const path of [`${PR}clock/`, '/operating-systems/cpu-scheduling/round-robin/']) {
  test(`390 px, real scrolling on ${path}: the docked transport only ever covers the stage`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.waitForFunction(() => !!window.__trace);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let docked = 0;
    for (let y = 0; y < total; y += 120) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        const stage = document.querySelector('[data-stage]');
        const bar = document.querySelector('[data-transport]');
        if (getComputedStyle(bar).position !== 'fixed') return { docked: false };
        const b = bar.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        const hit = (e) => {
          const x = e.getBoundingClientRect();
          return x.width > 0 && x.height > 0 && x.bottom > b.top && x.top < b.bottom && x.right > b.left && x.left < b.right;
        };
        const covered = [...document.querySelectorAll('a, button, input, textarea, summary, [tabindex="0"]')]
          .filter((e) => !stage.contains(e) && hit(e))
          .map((e) => e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30) || e.id);
        return { docked: true, inside: b.top >= s.top - 1 && b.bottom <= s.bottom + 1, covered };
      });
      if (!r.docked) continue;
      docked++;
      expect(r.covered, `at scroll ${y}`).toEqual([]);
      expect(r.inside, `dock inside the stage at scroll ${y}`).toBe(true);
    }
    expect(docked, 'the dock was used at some scroll position').toBeGreaterThan(0);
  });
}

test('results show the fault rate as counts and percent, with the fraction secondary', async ({ page }) => {
  await page.goto(`${PR}clock/`);
  await page.waitForFunction(() => !!window.__trace);
  const dd = page.locator('[data-totals] div', { hasText: 'Fault rate' }).locator('dd');
  await expect(dd).toContainText('14 of 20 (70%)');
  await expect(dd.locator('.pg-frac')).toHaveText('= 7/10');
});
