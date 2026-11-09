# Release notes: branch `next-2`

Sections 2 to 4 (Networking, Logic, AI) plus the section 1 review fixes, ready for batch review. Nothing has been merged; the owner merges `next-2` into `main` after review.

## Your decision needed (STOP item)

**AI: approve `worker-src 'self'`.** It is one change in the CSP line of `src/static/_headers`: `worker-src 'none'` becomes `worker-src 'self'`. It would let searches run in a Web Worker. Without it the AI pages already work: every search is time-sliced on the main thread with a cancel, and the frame-time gate passes with all agents at their caps. See `sections/ai/REPORT.md`.

## What is in this branch

1. **Section 1 review fixes** (memory):
   - a wrapping, auto-growing reference field
   - 20 steps fitting at 1440 px, with a scroll cue and the playhead kept in view beyond that
   - the small-screen dock only ever over the stage
   - "14 of 20 (70%)"
   - `verify:quick` and `verify:full`
   - the README note on the preview-only analytics error
2. **Networking:** IPv4 subnet calculator, subnetting practice, VLSM planner, and a TCP handshake and teardown simulator. Report: `sections/networking/REPORT.md`.
3. **Logic:** truth table generator, logic circuit simulator, Boolean simplifier (Quine-McCluskey, Karnaugh map, every minimal answer), and equivalence checker. Report: `sections/logic/REPORT.md`.
4. **AI:** game tree explorer (Tic-tac-toe, minimax and alpha-beta), Connect Four arena (five agents, play against one, round robin), and compare agents. Report: `sections/ai/REPORT.md`.

The home page lists the five sections with icon buttons, and the About page names them. There are no landing pages for the new sections (owner's answer for memory).

## Gates (final `npm run verify:full` on everything: see the bottom of this file)

- **Engine and contrast tests:** 7 test files plus scheduling, all in the deploy gate (about 5 s in total). Golden cases from the brief are unedited. Each section has a separate oracle, property tests, validation and share-link fuzzing.
- **Content lint:** 27 pages clean.
- **Browser tests:** 370 pass on Chromium and WebKit, 4 skipped by design (WebKit tab-order cases).
- **Frame times** (median of 5, 4x CPU throttle), p95 per case:
  - scheduling typical 16.7 ms, scheduling heavy 16.8 ms
  - memory 16.7 ms, networking (TCP) 16.7 ms
  - logic (6-variable circuit) 16.8 ms, AI (all agents at depth 6 and 20,000 iterations) 16.7 ms
  - every median maximum 33.3 ms or less
- **Lighthouse mobile, every page:** see the final run below.

## Site-wide fixes found by the gates

- **Clock total:** the transport's total was rendered as 0 and changed width when the script started. It is now built from the default run.
- **Results-table height:** the scheduling table's reserved height applied to every `.table-scroll`, leaving blank space under other tables. It is now scoped to the results table.
- **Wordmark:** it has a fixed box, so the breadcrumb beside it doesn't slide when the display font arrives.
- **Example chips on phones** sit in a fixed two-column grid, so a late web font can't re-wrap them and move the content below. Lighthouse found this as CLS 0.039 on the subnet page.
- **Frame-time tests:** the median is now over 5 runs. The layout-shift browser tests block web fonts, so they measure shifts the page causes; the font swap you chose to keep is measured by Lighthouse and `fontswap.spec`.
- **AI responsiveness:** agents yield more often and start in a fresh task, and numbers are formatted without Intl. The first `toLocaleString` call cost one long frame.

## Open questions

1. `worker-src 'self'` for the AI section (above).
2. Nothing else blocks. The reports list judgement calls (the TCP model's fixed timings, the VLSM planner never using /31, the circuit drawn as a tree) for you to confirm or change.

## Needs verification (combined)

Full lists at the end of each section's `content-review.md`:

- **Memory:** "some courses count only replacements"; the sources-differ notes for the Clock bit and the Optimal tie; hardware reference bits; the cost of LRU in practice; "often close to Optimal"; the naming of Clock and second chance; the overview table's "Used as" column.
- **Networking:**
  - the octal reason for rejecting leading zeros
  - /31 router-link usage
  - the special-range descriptions, and "CIDR replaced classes"
  - the TCP model notes and the TIME_WAIT reason (TIME_WAIT also lets a lost final ACK be resent)
  - the practice level choices
- **Logic:** other precedence conventions; the gate-shape descriptions; the gate-delay simplification; "a marking scheme might expect either"; the minimality cost (some texts count gate inputs).
- **AI:**
  - the statements about real Connect Four programs
  - move ordering helping alpha-beta
  - random playouts being weak
  - "deeper search always plays better" listed as a mistake
  - the round robin wording, and time-sliced timing compared with wall-clock time

## Review material

- Screenshots on branch `review-shots`: folders `networking/`, `logic/` and `ai/` (plus `memory/` from section 1).
- Preview of this branch: https://next-2.trace-8mc.pages.dev (Cloudflare's branch alias).

## Final verify run

All 6 gates passed in 14.4 min: engine and contrast tests, build, content lint (27 pages), 370 browser tests on Chromium and WebKit (4 skipped by design), 6 frame-time cases, and Lighthouse mobile on all 26 indexable pages (Performance 97 to 100, the rest 100, CLS 0).

```
typical frame times: median p95 16.7 ms, median max 16.8 ms
heavy frame times: median p95 16.8 ms, median max 33.2 ms
memory heavy frame times: median p95 16.7 ms, median max 33.3 ms
networking heavy frame times: median p95 16.7 ms, median max 16.8 ms
logic heavy frame times: median p95 16.7 ms, median max 16.8 ms
AI heavy frame times: median p95 16.7 ms, median max 16.8 ms
100 100 100 100  CLS 0  /
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/fcfs/
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/sjf/
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/srtf/
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/priority/
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/round-robin/
100 100 100 100  CLS 0  /operating-systems/cpu-scheduling/compare/
 97 100 100 100  CLS 0  /memory/page-replacement/
100 100 100 100  CLS 0  /memory/page-replacement/fifo/
100 100 100 100  CLS 0  /memory/page-replacement/lru/
100 100 100 100  CLS 0  /memory/page-replacement/optimal/
100 100 100 100  CLS 0  /memory/page-replacement/clock/
100 100 100 100  CLS 0  /memory/page-replacement/compare/
100 100 100 100  CLS 0  /networking/subnet-calculator/
100 100 100 100  CLS 0  /networking/subnetting-practice/
100 100 100 100  CLS 0  /networking/vlsm-calculator/
100 100 100 100  CLS 0  /networking/tcp-handshake/
100 100 100 100  CLS 0  /logic/truth-table/
100 100 100 100  CLS 0  /logic/circuit/
100 100 100 100  CLS 0  /logic/simplifier/
100 100 100 100  CLS 0  /logic/equivalence/
100 100 100 100  CLS 0  /ai/game-tree/
100 100 100 100  CLS 0  /ai/connect-four/
100 100 100 100  CLS 0  /ai/compare/
100 100 100 100  CLS 0  /about/
```
