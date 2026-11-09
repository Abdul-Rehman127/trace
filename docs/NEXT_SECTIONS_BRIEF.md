# Trace: next sections brief (v2 process)

Owner: Abdul Rehman (GitHub Abdul-Rehman127). Written by the research and review chat. This file is the source of truth for the next build run. Save it in the repo as `docs/NEXT_SECTIONS_BRIEF.md` and read all of it before starting.

You already built the Operating systems section well. This run adds four more sections in one continuous run, with far fewer human checkpoints. The price of fewer checkpoints is that YOU run the checks, so the gates in part 3 are not optional.

## 1. Goal and order

Build these sections, in this order (order is chosen by risk, not importance):

1. Memory: page replacement (reuses the scheduling engine, timeline and explanation patterns; this is the calibration section)
2. Networking: subnet calculator, subnetting practice, VLSM planner, TCP handshake and teardown
3. Logic: Boolean expressions, truth tables, simplification, generated circuit diagrams
4. AI: game search ladder (random, greedy, minimax, alpha-beta, Monte Carlo tree search)

Not in this run: assembly, C memory, algorithm visualizers, Urdu tools. Do not start them. Do not add any link, button or text for unbuilt sections anywhere.

All locked decisions from the original brief still hold: Slate and Ice design, tokens, fonts, strict CSP with Trusted Types, no inline styles or scripts, no innerHTML, only `esbuild` as a dependency, no cookies, no ads, no accounts, no em dashes in any copy, avoid the words "learn" and "discover" in names and headings, do not name specific organizations, schools, courses or textbooks in copy, MIT license, commits authored as Abdul-Rehman127 with abdulrehman.emrn@gmail.com and no AI or Claude trailers.

## 2. Lessons from the scheduling build (do not repeat these)

- Reviews found real bugs late: stale animation state after reset or model change (`active = -2`), playhead drift between the rAF clock and compositor animations, background-tab desync. Rule: every animation or timer has one owner, one cancel path, and a test that resets, changes input and backgrounds the tab mid-play.
- Contrast: label colors chosen by eye failed 4.5:1. Rule: compute best text color per fill, keep the contrast test, test default, hover, selected and focus states in both themes.
- Flaky frame-time tests: use the median of several runs plus a typical-load test, and keep them out of the deploy build.
- Layout shift: text boxes that change content must be sized from the longest possible content (narration box). Check CLS 0.
- Things that look like text but are clickable (algorithm selector) or look clickable but are not (the "Next: ..." line). Rule: every interactive thing has a visible button, border or underline affordance plus hover, press and focus states; nothing that is not interactive may look interactive.
- Copy claims: every factual claim in copy is either computed by the engine at build time, a definition, a rule of Trace itself, or listed in the "Needs verification" section of that page's content review. Scope claims ("with known burst lengths and free switching"). Prefer "often" and "many courses" over absolutes. Never write "the one", "always" or "all textbooks" without proof.
- Worked examples on pages are generated at build time from the engine, never typed by hand, so numbers cannot drift from the simulator.
- The Cloudflare build now runs `node tests/run.mjs && node build.mjs`, so a failing fast test blocks deploy. Keep every correctness test in the fast suite. Browser tests stay outside it.
- Screenshots pasted into chat never reached the reviewer. Rule: commit review material to the repo (part 4).
- Tie rules and conventions are where textbooks differ. Pick one, state it on the page, offer a switch where sources split, and test both.
- Privacy: nothing the user types is sent anywhere. The analytics beacon does not log query strings (verify on the live site and report).

## 3. Quality gates (automated, run by you)

Add `npm run verify` that runs everything below and exits non-zero on any failure. Run it before every commit that touches a section. A section is not done until it passes.

1. Engine tests: hand-verified golden cases (never edit expected values to make a test pass; if one seems wrong, STOP and ask), differential tests against a deliberately different independent oracle (different algorithm, written separately, not a port of the engine), property tests of invariants, validation tests, share-link fuzz tests.
2. Content lint: no em dashes anywhere in copy; no "learn" or "discover" in names, titles or headings; title and meta description length bounds; exactly one H1 per page; heading order; every internal link resolves; every page in the sitemap; canonical tags use https://trace.abmans.com; no text that is a link without an affordance.
3. Contrast test for every token pair and every state in both themes (4.5:1 text, 3:1 borders and UI).
4. Browser tests on Chromium and WebKit: no CSP or Trusted Types violations on any page, keyboard-only path through every control with visible focus, skip link, 390 px layout without horizontal scroll, reduced motion respected, reset and input change mid-play leave no stale state, share link round trip, tab background and restore.
5. Lighthouse mobile on every page: Performance 95 or more, Accessibility, Best Practices and SEO 100, CLS 0. Report numbers, do not tune the test.
6. Frame time on the heaviest interaction of each section (median of several runs).

## 4. How to work and how to report

- Work on a branch called `next`, not `main`. Cloudflare Pages builds a preview deployment for every non-production branch, so the owner can look at it live. Never push unreviewed new sections to `main`. Small fixes the owner asked for directly may go to `main`.
- Keep the repo as your memory. Maintain `STATE.md` (current section, finished gates, next step, open questions) and update it after every milestone. At the start of every session and after any context compaction, read `STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md` and the section's `SPEC.md` before doing anything.
- For each section, first write `sections/<name>/SPEC.md` from the section brief below: exact semantics, tie rules, limits, input formats, share-link format, presets, golden cases with derivations, copy outline. This is for you, not a question to the owner. Ask the owner a question only if you are blocked on something the brief does not decide and a wrong guess would be expensive. Otherwise choose the smallest sensible option, log it in `DECISIONS.md`, and continue.
- Reuse what exists (design tokens, timeline, controls, narration, share-link code, page templates, test harness). Extract shared code instead of copying it. Do not regress the scheduling section; its tests keep running.
- Commit at each milestone with a clear message. Push `next` regularly.
- STOP and ask the owner before: adding any dependency other than `esbuild`, changing CSP or response headers (the AI section may need `worker-src 'self'`; ask with the exact change), anything in the Cloudflare dashboard, changing an expected value in a golden test, or anything that touches legal or privacy copy.
- After each section passes `npm run verify`, write `sections/<name>/REPORT.md`: what was built, gate results with numbers, deviations and why, open questions, and the "Needs verification" list (claims in copy you are not fully sure of). Commit review screenshots to a separate branch `review-shots` under `<section>/` (light and dark; 1440, 1024 and 390 px; default, hover, selected, focus, mid-play and end states for every simulator page). The reviewer reads the repo directly, so nothing needs to be pasted anywhere.
- Review cadence: after section 1 (the calibration) STOP once, tell the owner it is ready, and wait for the review result. If the review has no blocking issues, continue to sections 2, 3 and 4 without stopping, writing a REPORT.md for each. The owner will review them in one batch at the end.
- Every page needs the same written-content standard as the scheduling pages: How it works, a generated worked example, formulas or rules, strengths and weaknesses or limits, common exam mistakes, related links, a "Spotted a mistake?" block, plus a `content-review.md` generated from the real pages including the Needs verification list. Update the home hub with real cards (only for built sections), About, sitemap, JSON-LD patterns already in use, and internal links between related pages.

## 5. Section briefs

### 5.1 Memory: page replacement (/memory/page-replacement/ and one page per algorithm, plus compare)

Algorithms: FIFO, LRU, Optimal (also called MIN), Clock (second chance). Input: a reference string of 1 to 40 page numbers (integers 0 to 99, entered as comma or space separated) and a frame count of 1 to 8. Output: a step table (one column per reference) showing frame contents, hit or fault, which page was evicted, and for Clock the reference bits and pointer; totals for faults and hits, fault rate. Timeline equivalent: a stepping playhead over references using the same controls, speed, decision log and narration with reason codes (hit, fault-free-frame, fault-evict-oldest, fault-evict-least-recent, fault-evict-farthest-next-use, clock-second-chance, clock-evict). Rules to state on pages and test:

- Optimal tie: if several pages are never used again, evict the one that has been in memory longest.
- Clock: the pointer starts at frame 0 and moves in frame order. Default: a newly loaded page gets reference bit 1; a "New page starts with bit 0" switch is offered because sources differ. A hit sets the bit to 1 and does not move the pointer. State the rule used.
- Limits and validation messages in the same style as scheduling.

Golden cases (verified by independent computation, never edit):

- Reference string 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 with 3 frames: FIFO 15 faults, LRU 12, Optimal 9.
- Reference string 1,2,3,4,1,2,5,1,2,3,4,5: FIFO has 9 faults with 3 frames and 10 with 4 frames (Belady's anomaly). LRU: 10 with 3 frames, 8 with 4. Optimal: 7 with 3, 6 with 4.
- Add edge cases: 1 frame, frames greater than distinct pages, repeated page only, all distinct pages, Clock traces you derive by hand and document in the spec.

Properties: faults at least the number of distinct pages; Optimal never worse than any other algorithm on any input; LRU and Optimal never show Belady's anomaly (frames n to n+1 never increase faults, test over random inputs); FIFO is allowed to. Oracle: simulate with a different data structure (for example Optimal by recomputing next-use from scratch each fault, LRU by timestamps, FIFO by queue, Clock by explicit circular array), not shared code. Special feature: a Belady's anomaly preset that shows the 3-frame and 4-frame FIFO runs side by side with the fault counts, with careful wording ("can", not "will").

### 5.2 Networking (/networking/ with tool pages)

Tools:

1. Subnet calculator: input an IPv4 address with CIDR prefix or mask. Show network address, broadcast, subnet mask, wildcard mask, first and last usable host, usable host count, binary view with the network and host bits coloured and labelled by text as well as colour, address class note only as history, private or special range note (RFC 1918, loopback, link-local). Rules: /31 follows point-to-point usage and /32 is a single host; state both. Reject leading zeros, octets above 255, prefix above 32. If host bits are set, accept and show the network address they belong to.
2. Subnetting practice: generated questions (find network, broadcast, host range, number of hosts, which subnet mask, is host in same subnet, how many subnets), difficulty levels, seeded random so a question can be shared by link, instant check with a step-by-step solution. No accounts, no storage except an optional streak count in localStorage if you can justify it (log the decision).
3. VLSM planner: input a parent network and a list of required host counts; allocate largest first, show each subnet, wasted space, and a bar visualisation of the address space. Detect "does not fit".
4. TCP handshake and teardown simulator: client and server timelines with sequence and acknowledgement numbers, flags, and states (CLOSED, LISTEN, SYN_SENT, SYN_RECEIVED, ESTABLISHED, FIN_WAIT_1, FIN_WAIT_2, CLOSE_WAIT, LAST_ACK, TIME_WAIT). Same controls, narration and decision log as the other simulators. Options: initial sequence numbers entered by the user, simultaneous close as a preset, one lost packet with retransmission as a preset. State which model of retransmission timing is used (fixed, labelled as simplified).

Golden cases: 192.168.1.130/26 gives network 192.168.1.128, broadcast 192.168.1.191, 62 usable hosts, range .129 to .190; 172.16.5.10/20 gives network 172.16.0.0, broadcast 172.16.15.255, 4094 usable; 10.0.0.0/8 gives 16,777,214 usable; add /30, /31, /32, /0, 255.255.255.255, and a VLSM case you verify by hand. Oracle: engine uses bit operations on 32-bit unsigned integers; oracle uses a different method (string and per-octet arithmetic or BigInt), and both are tested against Node's behaviour where possible without adding dependencies. Do not invent TCP behaviour; keep it to the standard state machine and say the model is simplified where it is.

### 5.3 Logic (/logic/ with tool pages)

Tools:

1. Expression to truth table: input Boolean expressions using AND, OR, NOT, XOR, NAND, NOR, XNOR written as words or symbols (& | ! ^ ~ and the usual math symbols), with parentheses and a stated precedence (NOT, then AND, then XOR, then OR). Up to 6 variables (single letters A to Z). Clear parse errors that point to the position.
2. Circuit diagram: auto-laid-out SVG built from the expression with standard gate shapes, with input toggles and animated signal propagation (a value change travels gate by gate, with narration). Must be accessible: text equivalent of the circuit and a table of gate outputs.
3. Simplifier: canonical sum of products and product of sums (minterms and maxterms), Quine-McCluskey steps with prime implicants, a Karnaugh map for 2 to 4 variables with groupings, minimal expression(s). When several minimal answers exist, show all of them and say so.
4. Equivalence checker: two expressions, same truth table or show the first differing row.

Golden cases: standard identities (De Morgan, absorption, XOR as AND-OR), a full adder sum and carry, a 4-variable function with a known minimal form and with two minimal forms, constants, single variable, tautology and contradiction. Oracle: brute-force truth table evaluation; simplification checked by equivalence to the original on every input, plus an exhaustive search for minimal literal count on up to 4 variables. Performance: 6 variables is 64 rows, so everything is instant; keep the SVG small and avoid layout reads during animation.

### 5.4 AI (/ai/ with tool pages)

Purpose: show how game-playing search works and how the algorithms differ, as a ladder from weakest to strongest. Games: Tic-tac-toe for the explainable game tree (small enough to see), and Connect Four (7 columns, 6 rows) for the ladder where the weaker and stronger agents actually play. Write everything from scratch with your own board representation. Do not use or resemble any course assignment code. Algorithms: random, greedy (one-ply heuristic), minimax with depth limit, alpha-beta with the same depth limit, Monte Carlo tree search with a visible iteration count.

Tools:

1. Game tree explorer on Tic-tac-toe: step through minimax and alpha-beta with values, pruned branches shown clearly, and a live counter of nodes examined. Compute every figure shown by running the engine (for example the full game tree from the empty board has 549,946 positions including the root; confirm this by running it, do not hard-code it).
2. Ladder arena on Connect Four: choose two agents and a seed, watch them play move by move with the evaluation or statistics for each move explained in plain language; play against any agent yourself; a round robin summary with seeds shown.
3. Compare page: the same position given to every agent with the chosen move, the time taken, nodes or iterations examined.

Key invariants to test: alpha-beta returns exactly the same value (and the same move under a fixed move ordering) as minimax at the same depth and never examines more nodes; minimax never loses a won position at sufficient depth in Tic-tac-toe, and perfect play ends in a draw; with a fixed seed every agent is fully reproducible; MCTS with a fixed seed and iteration count is deterministic; the random agent only plays legal moves; no agent mutates the shared board state. Performance: run the search in a Web Worker so the interface never blocks, with a cancel button and a hard cap on depth and iterations. This requires `worker-src 'self'` in the CSP, so STOP and ask for that exact change before using a worker. Until approved, build with a cooperative time-sliced loop on the main thread behind the same interface so switching later is a one-file change. Copy rules: do not claim strength rankings you have not measured; show measured results from the engine. Do not call any algorithm "best" without scope. Mention honestly that these agents use simple evaluation functions.

## 6. Finish

When all four sections pass `npm run verify`, merge nothing yourself. Write a top-level `RELEASE_NOTES_NEXT.md` summarising the four sections, the gate numbers, the open questions and the full combined "Needs verification" list, then tell the owner in one short message that `next` is ready for batch review. The owner will merge to `main` after review.
