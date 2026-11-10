# Logic section: report

Branch `next-2`. Not reviewed yet (batch review of sections 2 to 4).

## What was built

- **Truth table generator** (`/logic/truth-table/`): expression in, full table out with a column for every subexpression, plus the canonical sum of minterms and product of maxterms.
  - It takes every operator spelling the brief lists, plus implied AND (`AB`) and a postfix NOT (`A'`).
  - Precedence is NOT, then AND, then XOR, then OR, stated on every page.
  - Errors give the position and show a caret under it.
- **Logic circuit simulator** (`/logic/circuit/`): an auto-laid-out SVG with standard gate shapes, one gate per operator. Switching an input sends the change through the gates one level at a time on the shared player, with narration and a decision log. A text equivalent sits below: the gate list and a table of every gate's output.
- **Boolean simplifier** (`/logic/simplifier/`):
  - Takes an expression, or minterms with don't-cares.
  - Shows the canonical forms, every minimal sum of products (with a sentence when there are several), the minimal product of sums, a Karnaugh map for 2 to 4 variables with groups (wrap-around included) and a text list of them, the prime implicants with essentials marked, and the Quine-McCluskey rounds.
- **Equivalence checker** (`/logic/equivalence/`): two expressions are compared over all their variables, and if they differ the first differing row is given as a counterexample.
- **Written content** for each page: 513, 494, 550 and 394 words. Every example is computed at build time.

## Gates (`npm run verify:full`, all 6 passed, 12.8 min, with Networking)

| Gate | Result |
| --- | --- |
| Engine tests | 16 logic tests pass, including:<br>- every operator spelling, the precedence, and the positioned errors<br>- De Morgan, absorption, XOR as AND-OR and the full adder<br>- BD + B'D', the two-answer function, constants, tautology and contradiction<br>- 2,000 random expressions against a separate shunting-yard evaluator<br>- 400 random functions with don't-cares, every minimal SOP and POS checked on every row, and the QM cost equal to a brute-force minimum over every cube (up to 4 variables)<br>- prime implicants covering exactly the allowed minterms, and the circuit computing the expression on every row with no overlapping gates |
| Content lint | 24 pages clean |
| Browser tests | All pass (site total 341). The logic ones cover:<br>- live tables, positioned errors and link round trips; both minimal answers listed; minterm input and K-map groups; the first differing row<br>- circuit propagation, and a new expression mid-change leaving no stale state<br>- reduced motion, 390 px, and CLS 0 with fonts blocked |
| Lighthouse mobile | All four logic pages 100 / 100 / 100 / 100, CLS 0 |
| Frame time | Six-variable circuit with 11 gates, a change travelling every level at 4x: p95 16.7 ms, max 16.8 ms |

## Deviations and why

- **The circuit is drawn from the expression as written,** one terminal per variable occurrence: a tree with no crossing wires. Shared input wires would need a general graph layout. The page states it.
- **Term order in answers is a fixed display rule:** fewer literals first, then by variable, plain before complemented. Tests compare terms as sets.
- **Layout-shift browser tests now block web fonts,** so they measure shifts the page itself causes. Font-swap shifts stay measured by Lighthouse and `fontswap.spec`. This followed the owner's choice to keep `font-display: swap`; see DECISIONS.md.

## Open questions

- None that block.

## Needs verification

See the end of `sections/logic/content-review.md` (source `src/content/logic/needs-verification.md`): the note on other precedence conventions, the gate-shape descriptions, the gate-delay simplification, and the minimality cost.

## Review material

Screenshots: branch `review-shots`, folder `logic/`. That's 108 JPEGs: 4 pages, light and dark, 1440, 1024 and 390 px, in default, hover, selected and focus states, plus mid-play and end for the circuit.
