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

## Checkpoint B answers applied

- Tie narration names the running process: "P1 and P2 both have 4 left. P1 is already running, so it keeps the CPU." (SRTF and preemptive Priority).
- Round Robin opens on arrivals 0, 1, 2, 3 with bursts 5, 3, 1, 4 and q=2; the golden case stays as "Classic example". Browser tests that rely on the golden numbers load it through a share link.
- Frame-time tests run each scenario three times on a fresh page and use the median. Typical load (5 processes, bursts up to 20) must pass p95 under 20 ms and max under 50 ms; the heavy case checks p95 only.
- The narration box stacks the six longest narrations of the scenario (by text length) as invisible copies under the current one, so its height fits the longest and never changes or scrolls during playback. The build renders the same sizers for each page's default scenario, so the first load does not shift. Six is a heuristic; a browser test steps through every moment of three scenarios and checks the height never changes.
- The decision log under the stage is planned for Phase 4, as asked.

## Phase 3: pages and content

- Mini timelines (home hero, worked examples, compare strips) are static HTML positioned by generated utility classes (`.s-N` start, `.l-N` length, `.b-N` slice boundary, `.T-N` length, `.cN` color), about 4 KB of CSS before compression. This keeps them complete without JavaScript and within the CSP, which forbids style attributes.
- The hero animates with Web Animations on transform and opacity only, loops with a short fade, and pauses when the tab is hidden or the hero is off screen. With reduced motion it stays on the final frame.
- Worked examples are computed at build time by the engine from the "Classic example" preset, so the numbers on each page always match the simulator. The example lists the order of execution in words as well, for screen readers and for students copying the answer.
- The compare page reuses the process editor with every option visible (quantum, tie rule, preemptive, priority direction). It always shows five rows and five timelines, so its space is fixed before the script runs. Its share link has no `alg` and carries priorities plus every option. Its default "Mixed example" (arrivals 0 to 3, bursts 8, 4, 9, 5, priorities 2, 3, 1, 4, q=3) is chosen so the five algorithms give five different results.
- The compare page marks the lowest value in each column with the word "lowest", not with color, plus a screen reader label.
- The About page does not name the analytics provider, following the brief's rule for legal and disclaimer text. The claim itself is listed under "needs verification".
- Each mistake-report line has an email subject naming the page, for example "Mistake on the SRTF page".
- `content-review.md` is generated from the built HTML by `scripts/content-review.mjs`, so it shows exactly what ships.
- The OG image and the 180 px touch icon are generated once by `scripts/og.mjs` with Playwright from small HTML pages (inline styles there are fine: those pages are never served) and committed.
- Scroll wrappers are `position: relative`, so visually hidden text inside a scrolling table cannot escape and widen the page on phones. This was found by the new 390 px overflow test.

## Checkpoint D

- **CSP change, approved by Abdul at Checkpoint D (a STOP item):** the theme script is now inline in `<head>` and allowed by its `sha256` hash in `script-src`, instead of being a separate blocking file. On the live site the separate file cost about 0.5 s of render-blocking on simulated slow 4G. A hash allows exactly that one script, so nothing is relaxed: there is still no `'unsafe-inline'`, and Trusted Types are unaffected. The build computes the hash, writes it into `dist/_headers` (the source has a `{{themeHash}}` placeholder), and refuses to build if any other inline script appears or if the script's text differs from the hashed text. The `theme.[hash].js` file and its cache rule are gone.
- Startup no longer forces a synchronous layout. The timeline width and the selector's scroll position are read in ResizeObserver callbacks, which run after the browser's own layout.
- The display font fallback was split in two: Arial Narrow Bold at 86.5% (it was 84.5%) and Arial Bold at 70.9% (it previously shared the Narrow value).
- The late-font layout-shift test (`npm --prefix e2e run fontswap`) delays fonts by 1.5 s. It is excluded from the default run until Chat decides between `font-display: swap` and `optional` for body text; with swap, body paragraphs can re-wrap by a line.
- `scripts/live-*.mjs` check a deployed site: headers, console and CSP in two engines, the analytics payloads, and copy-link round trips.
- **CSP change, approved by Abdul at Checkpoint D:** `connect-src` gains exactly `https://cloudflareinsights.com`, the host named in the violation. After the second deploy, Cloudflare injected a classic Web Analytics snippet (token `4eb98…`) that posts there instead of to the same-origin `/cdn-cgi/rum`. This follows brief section 14 ("add only the exact host it names, and report it"). Nothing else in the policy changed.
- **Analytics snippet added by hand, approved by Abdul at Checkpoint D (option 2):** the abmans.com Web Analytics site uses automatic setup, so Cloudflare injected its snippet (token `4eb98…`) into trace.abmans.com too, and every report was rejected (404, no CORS header, one console error per page). Excluding a hostname needs a paid plan. Instead, HTML responses now send `Cache-Control: public, max-age=0, must-revalidate, no-transform`, which stops Cloudflare's automatic injection, and the layout carries the Pages project's own beacon (token `9ab17…`) as an external script with `send.to` set to the same-origin `/cdn-cgi/rum`. Only Cloudflare builds (`CF_PAGES=1`) include the tag, and not on the 404 page: Pages sends that response with `Cache-Control: no-store`, so Cloudflare injects the same Pages beacon there itself; `TRACE_ANALYTICS=1` adds it for local tests. The build allows exactly that tag. `connect-src` is back to `'self'`, reversing the change above. The font and `app.*` rules detach the HTML `Cache-Control` with `! Cache-Control` before setting their immutable value; `dev.mjs` and `scripts/live-check.mjs` understand the detach syntax.
- **Algorithm selector as real buttons (Checkpoint D follow-up):** `.algs` is its own pattern of separate `.alg` buttons: a 1px border, `--surface` fill, `--shadow-1`, 40px tall (44px on coarse pointers and at 640px and below, where it becomes a 3 + 2 grid). The selected option is an `--ink` fill with `--bg` text and a check mark; hover lifts 1px, strengthens the border to `--muted`, and slides in a play mark; press scales to .97. Icons hang off the label inside reserved padding, so nothing moves. The sideways-scrolling selector and its centering script are gone.
- New tokens: `--line-control` (light `#808B9A`, dark `#5A6A7F`) because `--line-strong` reaches only 1.57:1 (light) and 1.95:1 (dark) against `--bg`, below the 3:1 a control's edge needs; `--shadow-1` and `--shadow-2`. `tests/tokens.test.mjs` checks every control edge state (`--line-control`, `--muted`, `--ink`) at 3:1 on `--bg` and `--surface`. The tie-rule and priority-order segmented controls keep their pattern but their outline now uses `--line-control`.
- Cross-document view transitions: `@view-transition { navigation: auto; }`, with only the selected fill (`.alg-hl`, named `alg-current`) animating for 220ms; the page itself swaps without a cross-fade. Off under `prefers-reduced-motion`. CSS only, so the CSP is unchanged.
- Compare page: each algorithm name is a bordered link with an arrow, labelled "<name>, open in the simulator".
- **Chips, Add process and inputs get real edges (same follow-up):** preset and copy-link chips have a `--line-control` border, `--surface` fill and `--shadow-1`, with the same hover lift and .97 press as the selector. The active preset has an `--ink` border doubled by an inset ring, so it differs by more than color. Add process is now `.btn-line`, an outlined button; disabled, it drops to a `--line-strong` edge with no fill or shadow. `.btn-quiet` is gone. Number inputs and the copy-link fallback field use `--line-control`, so every input edge reaches 3:1. The row remove buttons stay plain icon buttons; the cross reads as a control on its own.
- **Home and 404 tool links are cards:** each link in `.tool-links` is a bordered card (`--line-control`, `--surface`, `--shadow-1`, `--r-control-lg`) with an arrow on the right. Hover lifts it 1px, strengthens the border and nudges the arrow; press scales to .98 (cards are large, so less than the .97 for buttons). This was missed in the first audit of text-like controls.
- **Home and 404 links are icon buttons (Abdul asked for buttons, not cards):** `src/templates/toolbuttons.mjs` builds each one: a tinted icon tile holding a tiny timeline that shows what the algorithm does (FCFS in order, SJF shortest first, SRTF interrupted, Priority by rank, Round Robin in slices, Compare as a bar chart, Home as a house), the title and line of text, and a round arrow button. The simulator link is the filled primary and spans two columns. Hover lifts the button 3px, fades in a deeper shadow, fills the arrow from the center, and draws the icon's bars in from the left one after another; keyboard focus fills the arrow too. Only transform and opacity animate, following brief section 10.4, and reduced motion turns all of it off. This departs from the brief's "hairline sections, not cards" for these links only, at Abdul's request; the simulator pages keep the quiet layout.

## Next sections run (branch `next`, docs/NEXT_SECTIONS_BRIEF.md)

### Memory: page replacement

- **Frame model:** frames keep their position (the new page takes the evicted page's frame) and a fault with free frames fills the lowest free frame. Matches the usual exam table. Full rules and hand-derived Clock traces in `sections/memory/SPEC.md`.
- **Clock with free frames:** the page goes where the hand points and the hand moves on. Frames only fill in order 0, 1, 2, so this equals "lowest free frame". The hand ends the fill phase back at frame 0.
- **Optimal tie:** among pages never used again, evict the one loaded earliest (brief). Tested that any tie choice gives the same fault count; the page says the frame contents can differ.
- **Reference string input:** one text field, commas or spaces, leading zeros accepted ("07" is page 7, page numbers are not addresses). 0 to 99, 1 to 40 references, 1 to 8 frames. Specific messages; the last valid run stays on screen while input is invalid.
- **Belady feature, generalized:** instead of a one-off preset view, every algorithm page has a "With one more frame" panel that runs the same string with n and n+1 frames (7 and 8 at the top). The "Belady's anomaly" preset loads the brief's string, so on FIFO it shows 9 against 10. The compare page adds a 1 to 8 frames table that marks any rise in text and with a triangle.
- **Side panel:** "what the algorithm looks at" (load order, recency, next use, or bits from the hand), one fixed slot per frame so its height never changes while playing.
- **No `/memory/` page**, same reasoning as Operating systems in v1 (one tool family would make it thin). Breadcrumb "Memory" links to `/#memory`.
- **Step table reveal:** classes on the cells that change (`fut`, `now`), not an attribute on the table matched by generated `nth-child` rules. The first version (one `data-k` write plus 160 generated rules) cost about 1 s of style recalculation per 3 s of play under 4x CPU throttle and failed the frame-time gate (p95 67 ms); per-cell classes brought it to 16.8 ms.
- **Cell text in a child element** so a not-yet-reached cell hides its text from screen readers too (`visibility: hidden` on the child), instead of transparent text.
- **New token `--pg-now`** for the current step column (light `#E1E9F3`, dark `#1E2A3B`), chosen so `--ink`, `--ink-2` and `--muted` all reach 4.5:1 on it; covered by `tests/tokens.test.mjs`. Static worked-example tables mark no current column.

### Shared code extracted for every section

- `src/templates/transport.html` (the transport bar, with the clock label as a parameter), `selector(page, links)`, `createLog(...).setMoments(...)`, and `fromTree`, `createToast`, `bindCopy` in `ui/dom.mjs`. The scheduling app still has its own toast and copy code; it works and is covered by tests, so it was left as is rather than rewired.
- The home page sections come from `HUB_SECTIONS` in `toolbuttons.mjs`. The "Next: page replacement, AI search, networking" line is gone: the brief allows no text about unbuilt sections. The About page section list was updated the same way; its privacy and disclaimer copy was not touched.

### Site-wide fixes found by the new gates

- **Fallback font vertical metrics:** the CLS test under parallel load caught text moving 3 to 7 px when the web fonts arrived (wordmark, H1, lede). The fallback faces matched widths but not ascent and descent. They now carry `ascent-override` and `descent-override` measured from the real fonts (Big Shoulders 98/21, Plex 103/28 per 100 px), divided by each face's `size-adjust`. Measured afterwards: every fallback matches its web font exactly. The separate 1.5 s late-font test still shows body text re-wrapping on the home page; that is the open `font-display` question from Checkpoint D.
- **Breadcrumb links are underlined** (muted underline, full color on hover). The new link-affordance test requires an underline or a border on every visible link; the wordmark is the one exception.

### Gates and tooling

- `npm run verify` runs every gate in order and stops at the first failure. Playwright runs through Node directly (no shell), because a Windows shell reads the `|` in the grep pattern as a pipe.
- **Lighthouse is run through `npx -y lighthouse@12.8.2`, pinned, not added to any package.json.** It is a test tool fetched on demand like Playwright's browsers, not a site dependency. Open question for the owner in the memory report: whether this counts as adding a dependency.
- The content lint (`scripts/content-lint.mjs`) checks the built pages; title 20 to 65 characters, description 110 to 160 (the existing pages were 141 to 153).
- Section content reviews are generated by `scripts/section-review.mjs <name>` into `sections/<name>/content-review.md`.
- **Analytics beacon on production only:** the first `next` preview logged a 404 on every page because `*.pages.dev` has no `/cdn-cgi/rum`. The build now adds the beacon only when `CF_PAGES_BRANCH` is `main`, which also keeps preview visits out of the counts.
