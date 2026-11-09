# Memory section (page replacement): report

Branch `next`. Calibration section: per the brief, work stops here until the owner's review.

## What was built

- Six pages under `/memory/page-replacement/`: an overview with an in-place algorithm selector, FIFO, LRU, Optimal, Clock, and a compare page. The home page lists the section with icon buttons, and the About page names it.
- **Engine** (`src/js/engine/memory/`): FIFO, LRU, Optimal (MIN) and Clock with the rules in `SPEC.md`, validation with specific messages, share links (`?alg=fifo&f=3&r=7,0,1,2`, plus `bit=0` for Clock), presets (classic, Belady's anomaly, loop, locality), narration with the seven reason codes from the brief, and node trees for the step table and the results views. The trees are shared by the build and the browser.
- **Simulator:**
  - The shared player, transport, keys and decision log drive a step table with one column per reference. It shows frame contents, loaded and hit cells, Result (F or H, in text as well as color), Evicted, and for Clock the bits and the Pointer row.
  - "Why this happened" narrates each step. A side list shows what the algorithm looks at: load order, recency, next use, or bits from the hand.
  - Results show faults, hits, fault rate (exact fraction and percent) and references.
- **Belady feature:** every simulator page has a "With one more frame" panel that runs the same string with n and n+1 frames side by side. The "Belady's anomaly" preset shows 9 against 10 on FIFO, with the wording "can", never "will".
- **Compare page:** faults, hits and fault rate for all four, with open-in-simulator links that carry the input. It also shows F and H strips per algorithm, and a 1 to 8 frames table that marks any rise.
- **Written content:** six pages with a worked example and every quoted number generated at build time, rules (including the Optimal tie and Clock bit), formulas, strengths and weaknesses, exam mistakes, related links and "Spotted a mistake?". Written content runs 604 words (overview), 945 (FIFO), 804 (LRU), 735 (Optimal), 931 (Clock) and 303 (compare). FIFO and Clock are slightly over the 900 the scheduling brief aimed at, because of the Belady section and the bit-setting rule.
- **Content review:** `sections/memory/content-review.md`, generated from the built pages, ending with the Needs verification list.

## Gates (`npm run verify`, all 6 passed in 8.1 min)

| Gate | Result |
| --- | --- |
| 1. Engine tests | 57 page replacement tests pass. They cover the brief's golden cases (FIFO 15, LRU 12, Optimal 9 on the classic string; 9/10, 10/8 and 7/6 on Belady's string), three hand-derived Clock traces checked step by step, 4,000 differential runs against a separate oracle, properties (Optimal never worse, no anomaly for LRU and Optimal, frame invariants), validation, 3,000-input share round trip, 3,000 fuzzed queries, narration of every step, and the copy claims. All scheduling tests still pass. |
| 2. Content lint | 16 pages clean. It checks em and en dashes, "learn" and "discover" in names, title 20 to 65 and description 110 to 160 characters, one H1, heading order, every internal link and anchor, sitemap, and canonicals. A planted-error check showed it catches each kind. |
| 3. Contrast | Token tests cover every text token on every background and on the new `--pg-now`, control edges at 3:1 in every state, and the focus ring, in both themes. |
| 4. Browser tests | 246 pass on Chromium and WebKit, 4 skipped (WebKit tab-order cases, by design). They cover zero CSP or Trusted Types violations on every page in both themes, the keyboard path with focus rings, the skip link, 390 px without sideways scroll, reduced motion, and reset, input change and preset mid-play. They also cover hidden tab freeze and resume, the share-link round trip, validation, the Belady panel, the overview selector, the compare page, the decision log, CLS 0 during load and play, and a link affordance on every visible link. |
| 5. Lighthouse mobile | 15 of 15 pages pass: Performance 98 to 100, Accessibility 100, Best Practices 100, SEO 100, CLS 0. The memory pages score 98, 98, 98, 98, 99 and 98. |
| 6. Frame time | The memory heavy case (Clock, 8 frames, 40 references, 4x speed, 4x CPU throttle, median of 3) has p95 16.8 ms and max 16.8 ms. Scheduling typical: p95 16.8, max 33.4. Scheduling heavy: p95 16.8. |

## Deviations and fixes found on the way

- **Frame-time gate failed first** (p95 67 ms). The step table revealed columns with one attribute on the table and 160 generated `nth-child` rules, which cost about a third of each second in style recalculation under throttle. Per-cell classes on only the cells that change fixed it.
- **CLS under load (site-wide):** with tests running in parallel, the web fonts arrived late and text moved 3 to 7 px. The fallback faces matched widths but not ascent and descent. They now carry measured `ascent-override` and `descent-override`. This also fixes the scheduling pages.
- **Home page Accessibility was 96 on some runs:** a hero bar label was measured against the faint bar track while its fill swept in. The label now repeats the fill color behind itself, with no visible change. This was the open item from Checkpoint D.
- **Link affordance:** breadcrumb links had no underline and now have a muted one.
- **Brief rule on unbuilt sections:** the home page's "Next: page replacement, AI search, networking" line and the same sentence on About were removed.
- **Belady feature generalized:** it is a panel on every page, not a single preset view (see DECISIONS.md).

## Open questions for the owner

1. **Lighthouse via `npx -y lighthouse@12.8.2`.** It is pinned and not in any package.json, and is used only by `npm run verify`. Does this count as adding a dependency? If yes, the alternative is to keep it out of verify and run it by hand.
2. **`font-display` for body text** (carried over from Checkpoint D): the 1.5 s late-font test still shows body text re-wrapping on the home page (`swap`). `optional` would remove that. The vertical shift is fixed either way.
3. **No `/memory/` page:** same reasoning as `/operating-systems/` in v1. Say if you want section pages once Networking lands.

## Needs verification

See the end of `sections/memory/content-review.md` (source: `src/content/memory/needs-verification.md`). In short:
- **Backed by tests** (listed so the wording can be checked): Belady for FIFO and Clock, no anomaly for LRU and Optimal, Optimal optimality against the other three, the tie-rule claim, Clock equalling FIFO with no hits, and each worked-example statement.
- **Open:** "some courses count only replacements", the Clock bit and Optimal tie "sources differ" notes, hardware reference bits, LRU cost in practice, the "often close to Optimal" and "usually more faults than LRU" hedges, the Clock and second chance naming, and the overview table's "Used as" column.

## Review material

- Screenshots: branch `review-shots`, folder `memory/`. That's 204 JPEGs: 6 pages, light and dark, 1440, 1024 and 390 px, in default, hover, selected, focus, mid-play and end (the compare page has no playback). `memory/index.md` lists them.
- Preview deployment of `next`: https://next.trace-8mc.pages.dev (Cloudflare's branch alias for the Pages project).
