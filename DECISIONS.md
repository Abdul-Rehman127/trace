# Decisions

Judgment calls the brief did not specify, one line of reasoning each. Newest at the bottom of each section.

## Setup

- Repo lives in its own folder (`trace/`), separate from the kit; only the fonts and `golden-scheduling.json` were copied in, so the design reference and screenshots stay out of the public repo.
- Repo created locally and pushed with `gh repo create --source`, so the first commit (including LICENSE) is authored as Abdul-Rehman127 rather than by GitHub's web flow.
- esbuild is pinned to an exact version (0.28.2) so builds are reproducible.
- `npm test` lists the test files explicitly instead of a glob, because Node 20 (the Cloudflare build version) does not expand globs in `node --test`.
- Playwright lives only in `e2e/package.json`; "esbuild is the only dependency" is read as applying to the root package that Cloudflare installs. Browser tests use the Chromium headless shell.
- Templates that are not written yet (hub, tool, about, notfound) fall back to `src/templates/stub.html`, so every v1 URL builds from Phase 0 on.
- The build refuses to write any page containing `style=`, `<style>` or a `<script>` other than the module script and JSON-LD, so CSP-forbidden markup cannot ship by accident.
- The 404 page is `noindex` and has no canonical link; every other page has an absolute canonical without a query string.
- JSON-LD `offers` includes `priceCurrency: "USD"` because schema.org validators expect a currency next to `price: "0"`.
- The theme toggle is in the static HTML but `hidden` until the module script runs, so it never appears as a dead button without JavaScript.
- A saved theme choice is applied by the module script, since the CSP forbids the usual inline head script. Visitors whose saved choice differs from their system setting can see one frame of the system theme on load (color only, no layout shift). Open question for review.
- The dev server binds to 127.0.0.1 only and redirects `/about` to `/about/` with 308, as Pages does.

## Engine

- Process identity is the slot number from the id (P3 is slot 3), not the position in the input array; "lower process number" in tie-breaks means lower slot. Processes may be passed in any order and rows come back in slot order.
- Priority is validated (1 to 99) only for the Priority algorithm and ignored otherwise; the golden cases pass priority 0 for other algorithms.
- The engine validates its input with `validate.mjs` and throws a `RangeError` carrying the same human messages, rather than guessing.
- Order of events at one instant: completion first; then for Round Robin the slice end and arrivals in the order the tie rule dictates; then arrivals; then a preemption; then a pick or idle.
- A preemption needs a strictly better value. When several processes arrive at once, the best of all ready processes is compared with the running one.
- A preempted process keeps its original arrival time for tie-breaks (it does not "re-arrive").
- In Round Robin, a process that arrives during a slice joins the queue at its arrival time, ahead of the process whose slice is running; the tie rule only matters when an arrival and a slice end happen at the same instant.
- When a slice ends with nobody waiting, the engine records a `quantum` decision with reason `continues-alone` and starts a new entry in `slices`, but the segment stays one bar.
- `arrive` decisions: `reason` is `null` for a plain arrival. In SRTF and preemptive Priority, an arrival that does not take the CPU gets `shortest-remaining`, `best-priority` or `kept-on-tie`, with `other` set to the process holding the CPU after that instant. An arrival that does take the CPU has `reason: null` and is followed by a `preempt` decision.
- `idle` decisions set `other` to the next process to arrive (lowest slot if several arrive together).
- `queue` for non-RR algorithms is sorted by that algorithm's full key (SRTF uses the current remaining time); for RR it is the FIFO order.
- `slices` include idle stretches (`pid: null`) so they cover the timeline exactly like `segments`.

## Validation and share links

- Typed numbers accept surrounding spaces and leading zeros ("007" is 7); signs, decimals, exponents and empty text are errors. Nothing is clamped.
- Share links write the priority number only for the Priority algorithm; decoding fills priority 1 when it is missing.
- `pre=0` and `hi=0` are accepted as the default settings; anything other than 0 or 1 is ignored with a notice.
- Query strings longer than 2,048 characters are ignored with a notice; when a parameter repeats, the first value wins.
- A link whose process list has no readable entries falls back to the page's default example, with a notice.

## Narration

- Narration returns sentences as arrays of strings and `{ pid }` parts; the UI turns `{ pid }` into `<strong>`. No HTML strings exist anywhere.
- A plain arrival is not narrated separately when the same instant also has a pick, a preemption or a slice end, because that sentence already covers it (the ready queue panel still shows the arrival).
- Simultaneous plain arrivals share one sentence ("P2 and P3 arrive and wait, because P1 runs until it finishes.").
- When the main rule ties, the sentence names the tie-break that decided ("P2 arrived earlier", "has the lower process number").
- Round Robin picks that can finish inside the slice say so ("needs only 1 unit, so it can finish within its 2-unit slice").
- When a slice end and an arrival coincide, the slice sentence explains the active tie rule in one extra sentence.

## Design tokens

- Light `--muted` changed from `#707B8A` to `#5F6976`: the original is 3.79:1 on `--bg` and 3.55:1 on `--sunk`, under AA; the new value is 4.91, 5.42 and 4.60:1 on bg, surface and sunk. The brief asks for exactly this adjustment.
- Process colors and their text colors are unchanged (locked). Six of the sixteen bar-text pairs are between 3:1 and 4.5:1 (light c1, c8; dark c1, c2, c3, c5). A test pins this list so any change is deliberate. Open question for review, since bar labels are small text.

## Checkpoint A answers applied

- Bar label text colors set per fill as Chat specified; all 16 pairs now reach 4.5:1 (lowest 4.76:1). The test now pins the locked fill colors and requires 4.5:1 for every label.
- `theme-init.js` is the one classic blocking script in `<head>` (167 bytes minified, content hashed, immutable cache). It also adds a `js` class to `<html>` so the simulator shell can be hidden without JavaScript, with no layout shift. The build allows exactly this one extra script tag.
- The mistake-report address is assembled in `email.mjs` and filled into every `[data-email]` element, including inside `<template>` content. The HTML fallback is the plain text "Email: abdul at abmans dot com".

## Phase 2: simulator UI

- On the five algorithm pages, the algorithm selector is a set of links to the other pages (real pages for search). Once the visitor has changed the processes, or arrived from a share link, the links carry the scenario in the query string. On the overview page, the selector switches the algorithm in place.
- A share link's `alg` is only honored on the overview page. On an algorithm page, the page's own algorithm wins and the rest of the link still applies.
- The tool shell is static HTML, with space reserved by fixed row heights and `data-rows` / `data-n` attributes, so the script fills in content without moving anything (CLS 0).
- Font swaps cannot move the layout: local fallback faces are scaled with `size-adjust` (ratios measured against the real fonts on the actual UI strings), both tables use fixed layout, and lines that mix fonts have pixel line heights. Plex Sans 500 (the weight used on every button and label) is preloaded in addition to the two fonts the brief lists, because without it the selector buttons shifted by about 0.005 when it arrived.
- Bars are not tab stops; the brief asks for no long tab sequence inside the timeline. Keyboard users get the same information from the slider (`aria-valuetext` names who is running), the timeline's text summary and the results table. Bar tooltips appear on hover and tap.
- The narration panel shows the decisions of the latest decision moment at or before the playhead, labelled "at time k" or "since time k".
- The narration panel and ready queue have fixed heights and scroll internally if a long narration does not fit, so changing text never moves the page during playback.
- While playing, the playhead and the growing bar are Web Animations on `transform` (run by the compositor). The single rAF loop is still the clock: it handles unit changes, the next bar, the end of playback and visibility. Paused, stepping, gliding and scrubbing render directly. This was needed to meet the frame-time budget at 4x CPU throttle.
- Bars are two elements each (the bar is the ghost and carries a generated-content label, plus the fill with its label). They are grouped into `contain: strict` blocks of 24 time units, and only the bar under the playhead clips or animates. This brought the heavy case from about 9,500 to about 3,100 elements, and a state change repaints one block instead of a whole lane.
- While playing, text panels (narration, queue, slider text, results highlight) update one frame after the clock and timeline, so a unit change never does all its work in one frame. Queue reordering uses FLIP when stepping, and plain replacement during continuous play; chips rise in at 1x and when stepping, and simply appear above 1x.
- Minimum unit width is 14 px. Ruler labels step by 1, 2, 5, 10, 20, 25, 50 or 100 so labels stay at least 28 px apart. A 12 px lead keeps the "0" label from being cut by the sticky lane names.
- New process defaults: arrival is the largest current arrival plus 1 (at most 99), burst 3, priority 1. Removing the last process is disabled.
- The quantum keeps its typed value when switching presets unless the preset sets one (Classic example sets 4 for Round Robin, Tie trap sets 2).
- A notice about an unreadable share link is shown as a toast (fixed position, 7 seconds) rather than an inline banner, so it never shifts the page.
- `dev.mjs` now compresses responses with brotli or gzip, like Cloudflare, so local Lighthouse numbers are comparable to production.
- The frame-time test runs alone (`--workers=1`) after the other browser tests, because parallel workers share the CPU and distort frame timings.
- `window.__trace` exposes the player and timeline for the browser tests and the screenshot script. It holds no visitor data.
