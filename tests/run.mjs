// Runs the fast Node tests (golden, differential, property, validation, share links,
// narration, color contrast). Used by `npm test` and by the Cloudflare build command
// `node tests/run.mjs && node build.mjs`, so a failing test stops a deploy.
// Needs only Node 20+; no browser, no Playwright. Exits non-zero on any failure.

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const FILES = ['engine', 'validate', 'share', 'narrate', 'tokens', 'paging', 'networking', 'logic'].map((n) => join(DIR, `${n}.test.mjs`));

const started = Date.now();
const result = spawnSync(process.execPath, ['--test', '--test-reporter=dot', ...FILES], { stdio: 'inherit' });
const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (result.status !== 0) {
  console.error(`\nTests failed (${seconds} s). The build was not started.`);
  process.exit(result.status || 1);
}
console.log(`\nAll fast tests passed in ${seconds} s.`);
