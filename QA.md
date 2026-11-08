# QA checklist (brief section 18)

Status before deploy. "Test" means an automated test in this repo that fails if the item breaks.

| Item | Status | Evidence |
| --- | --- | --- |
| `npm test` passes: golden, differential (2,000+ per algorithm), property, validation, share link | Pass | 87 tests in about 2 s; 2,500 random cases for each of 9 algorithm and option combinations. The Cloudflare build runs them before every build. |
| `npm run e2e` passes on Chromium, plus WebKit | Pass | 153 browser tests on Chromium and WebKit, plus 2 frame-time tests on Chromium. 4 tests skip in WebKit, each with its reason: frame times need Chromium's CPU throttling; the Trusted Types self-test (WebKit has no Trusted Types); Safari tabs to links only with Option-Tab; no clipboard permission in Playwright WebKit. |
| Zero console errors and zero CSP or Trusted Types violations on every page, both themes | Pass | Test: every page in light and dark, after a theme toggle and after every interaction test, with a `securitypolicyviolation` listener (and a self-test proving the listener catches violations). |
| Lighthouse mobile: Performance 95+, Accessibility 100, Best Practices 100, SEO 100, CLS 0 | Pass locally | All 9 pages: Performance 97 to 100, the rest 100, CLS 0 (local server with production headers and compression). Live numbers at Checkpoint D. |
| p95 frame time under 20 ms at 8 processes under 4x CPU throttle | Pass | Median of 3 runs: heavy case p95 16.8 ms. A typical load (5 processes) also holds median max under 50 ms. |
| 390 px: no horizontal page scroll; dock works; timeline scrolls inside its own container | Pass | Test: all 10 pages at 390 px keep the layout viewport at 390. The dock is fixed to the bottom with 44 px targets, and the timeline scrolls inside. Phone screenshots reviewed in both themes. |
| Keyboard-only run through every control; focus always visible; skip link works | Pass (automated) | Test: tabbing through the Round Robin page reaches every control in a logical order, each with a 2 px focus ring; the skip link is first, visible, and moves focus to main. The tab order is saved to `e2e/test-results/tab-order.txt`. All shortcuts are tested, including that they are ignored while typing. |
| Screen reader pass (NVDA or VoiceOver) | **Not done** | NVDA is not installed on this machine, and I did not install a screen reader system-wide without asking. Done instead: an accessibility-tree test (every button, input and slider has a name; headings and landmarks present), plus the live-region tests. See the NVDA checklist below; it takes about 10 minutes. |
| Reduced motion honored; JavaScript disabled still shows full written content and a static example | Pass | Tests: reduced motion steps jump, the hero stays static, and chips and fades are off. With JS disabled, all five algorithm pages show the content, formulas and the worked example (at least 600 words), with the simulator hidden and a notice. |
| Both themes inspected at three widths; contrast of muted text verified | Pass | Screenshots at 1440, 1024 and 390 px, light and dark. Test: every text token reaches 4.5:1 on every background, and every bar label reaches 4.5:1 on its fill. |
| Every golden example reproduced in the simulator and matching the written worked example | Pass | Test: for each algorithm page, "Open this example in the simulator" gives the same rows and averages as the written table. The golden numbers are also unit tested. |
| Share link round trips; hostile query strings handled | Pass | Unit tests: 3,000 random round trips and over 3,000 fuzzed or hostile strings. Browser tests: restore, links to other algorithms, compare page links, a hostile link with a notice. |
| Titles, descriptions, canonicals, JSON-LD, sitemap, robots valid; no duplicate titles | Pass | Test: unique titles; descriptions 140 to 155 characters; absolute canonicals with no query; JSON-LD parses, with no ratings; sitemap and robots; 404 is noindex with no canonical. |
| No page copies another page's text; no filler; no em dashes | Pass | Tests: no paragraph over 60 characters appears on two algorithm pages, and no em dash in any page. Content reviewed by Chat at Checkpoint C. |
| README, DECISIONS.md, LICENSE present; all commits authored as Abdul-Rehman127 | Pass | Every commit is authored `Abdul-Rehman127 <abdulrehman.emrn@gmail.com>`. |

## NVDA checklist (for Abdul, about 10 minutes)

Install NVDA from nvaccess.org, open https://trace.abmans.com/operating-systems/cpu-scheduling/round-robin/ in Chrome or Firefox, and check:

1. Press H repeatedly: you hear "Round Robin scheduling, heading level 1", then the h2 headings in order (Processes, Results, How Round Robin works, Worked example, and so on).
2. Tab to "Arrival for P1": NVDA says "Arrival for P1, edit, 0". Type 100: it announces "Arrival for P1 must be a whole number from 0 to 99." Fix it back to 0.
3. Tab to "Play" and press Space, then press Space again to pause: after the pause, NVDA reads "Time N." followed by the narration sentence.
4. Tab to "Timeline position" (a slider). Press Right Arrow: NVDA reads the new value, for example "Time 1 of 13. P1 is running.", and then the narration.
5. Press G (graphic) or browse to the timeline image: NVDA reads "Timeline: P1 runs 0 to 2, P2 runs 2 to 4, ...".
6. Open "Decision log" (Enter on the summary), Tab to a line and press Enter: the playhead moves there and NVDA reads the time and the narration.
7. Results table: press T to jump to it and use Ctrl+Alt+arrows: the headers are read with each cell, and averages read as "5.00".

Note anything that is silent, repeated or confusing, and I will fix it in Phase 4 follow-up.
