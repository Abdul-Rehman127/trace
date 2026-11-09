// npm run verify: every quality gate from docs/NEXT_SECTIONS_BRIEF.md part 3, in order.
// Stops at the first failing gate and exits non-zero.
//   1. Engine tests (golden, differential, property, validation, share fuzz) and token contrast
//   2. Build, then content lint over the built pages
//   3. Browser tests on Chromium and WebKit (CSP, keyboard, 390 px, reduced motion, stale
//      state, share links, background tabs, link affordance)
//   4. Frame times on the heaviest interaction of each section (median of 3 runs)
//   5. Lighthouse mobile on every page
// --quick runs gates 1 to 3 only (tests, build, lint, browser tests): npm run verify:quick.
// The full run (npm run verify:full) adds frame times and Lighthouse; run it once per
// section before writing the report.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
// Playwright's CLI is run through Node directly, so no shell reads the "|" in a grep pattern.
const PW = join(ROOT, 'e2e', 'node_modules', 'playwright', 'cli.js');
const quick = process.argv.includes('--quick');

const gates = [
  ['Engine and contrast tests', node, ['tests/run.mjs'], ROOT],
  ['Build', node, ['build.mjs'], ROOT],
  ['Content lint', node, ['scripts/content-lint.mjs'], ROOT],
  ['Browser tests (Chromium and WebKit)', node, [PW, 'test', '--grep-invert', '@perf|@fontswap'], join(ROOT, 'e2e')],
];
if (!quick) {
  gates.push(['Frame times', node, [PW, 'test', '--project=chromium', '--grep', '@perf', '--workers=1'], join(ROOT, 'e2e')]);
  gates.push(['Lighthouse mobile, every page', node, ['scripts/lighthouse.mjs'], ROOT]);
}

const started = Date.now();
for (const [name, cmd, args, cwd] of gates) {
  console.log(`\n=== ${name} ===`);
  const t = Date.now();
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  const s = ((Date.now() - t) / 1000).toFixed(0);
  if (r.status !== 0) {
    console.error(`\nverify: FAILED at "${name}" after ${s} s.`);
    process.exit(r.status || 1);
  }
  console.log(`--- ${name}: passed in ${s} s`);
}
console.log(`\nverify: all ${gates.length} gates passed in ${((Date.now() - started) / 60000).toFixed(1)} min.`);
