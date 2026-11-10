# Trace

Free step-by-step simulators that show how computers make decisions. Version 1 covers CPU scheduling:
FCFS, SJF, SRTF, Priority and Round Robin, with a plain-English reason for every decision.

Live at https://trace.abmans.com (once deployed).

The site is a static build: plain HTML, CSS and JavaScript modules, no framework, no server code.
Everything runs in the visitor's browser and nothing they type is sent anywhere.

## Run it

```
npm i            # installs esbuild, the only dependency
npm run dev      # builds dist/ and serves it on http://localhost:8788 with the production headers
npm test         # fast Node tests: golden, differential, property, validation, share links, narration, contrast
```

## Deploy (Cloudflare Pages)

Build command: `node tests/run.mjs && node build.mjs` (also `npm run build:ci`). Output directory: `dist`. Environment variable: `NODE_VERSION=20`.

`tests/run.mjs` runs the fast Node tests (about 2 seconds) before every build, so a failing golden, differential, property, validation or share-link test stops the deploy. It needs only Node and the `esbuild` dev dependency that Pages installs from `package.json`; the browser tests in `e2e/` are not part of the deploy.

Browser tests live in `e2e/` with their own `package.json`, so the Cloudflare build never installs Playwright:

```
npm --prefix e2e i
npx --prefix e2e playwright install --only-shell chromium
npm run e2e      # all browser tests, then the frame-time test on its own
npm run shots    # screenshots of the Round Robin page into shots/
```

## Architecture

1. `src/pages.mjs` holds page metadata (slug, title, description, h1, breadcrumb, algorithm).
2. `build.mjs` renders each page from `src/templates/` into `dist/`, bundles and content-hashes CSS and JS with esbuild, and writes `sitemap.xml`, `robots.txt` and `_headers`.
3. `dev.mjs` serves `dist/` and applies `dist/_headers` exactly, so CSP problems show up locally.
4. `src/js/engine/` is pure logic with no DOM: `scheduling.mjs` (event-driven simulator), `validate.mjs`, `share.mjs` (query string links), `narrate.mjs` (sentences as data).
5. `src/js/ui/` is the DOM layer; it builds elements with DOM APIs only (no `innerHTML`), because the site runs under a strict CSP with Trusted Types.
6. `tests/oracle.mjs` is an independent tick-by-tick reference scheduler. The engine is checked against it on 22,500 random scenarios, plus 10 hand-verified golden cases.
7. Colors, type and spacing are CSS custom properties in `src/css/tokens.css`; dark mode follows the system and can be toggled.
8. Fonts are self-hosted woff2 files (Big Shoulders Display, IBM Plex Sans, IBM Plex Mono) under the SIL Open Font License.
9. Later sections (page replacement, disk scheduling, ...) add entries to `pages.mjs` and folders under `engine/`.
10. Hosting is Cloudflare Pages: build command `node tests/run.mjs && node build.mjs`, output `dist`, `NODE_VERSION=20`.

## Tie-break rules

- FCFS: earliest arrival first; a tie on arrival goes to the lower process number.
- SJF (non-preemptive): smallest burst; then earlier arrival; then lower process number.
- SRTF: smallest remaining time at every moment. The running process keeps the CPU on a tie. Other ties: earlier arrival, then lower process number.
- Priority: lower number means higher priority by default (switchable). Non-preemptive by default; when preemptive, the running process keeps the CPU on equal priority. Other ties: earlier arrival, then lower process number. No aging.
- Round Robin: FIFO queue and a fixed quantum. If a new process arrives at the exact moment a slice ends, the default puts the new arrival in the queue first; the alternative puts the preempted process first. A process that finishes exactly as its slice ends is done, not requeued.

## License

MIT, see [LICENSE](LICENSE). Fonts are under their own licenses in `src/fonts/`.

## Known: one console error on preview deployments

Preview deployments (any branch other than `main`, served on `*.trace-8mc.pages.dev`) log one Content Security Policy error per page: `Connecting to 'https://cloudflareinsights.com/cdn-cgi/rum' violates ... connect-src 'self'`. Cloudflare Pages writes its own analytics snippet into the HTML of preview builds at deploy time, and the CSP correctly blocks where it reports to. This is expected and harmless; do not change the CSP for it. Production (trace.abmans.com) does not have it.

For that reason the CSP and console checks run only against the local build (`e2e/`, through `npm run verify:quick` or `verify:full`) and against production (`node scripts/live-browser.mjs`, which defaults to https://trace.abmans.com and warns if pointed at a preview).
