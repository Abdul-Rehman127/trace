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
