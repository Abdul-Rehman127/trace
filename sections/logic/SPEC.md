# Logic section (SPEC)

Source: `docs/NEXT_SECTIONS_BRIEF.md` section 5.3.

## Pages

| Path | What |
| --- | --- |
| `/logic/truth-table/` | Expression in, truth table out (every subexpression as a column), canonical forms |
| `/logic/circuit/` | Expression in, gate diagram out; toggle inputs and watch the change travel gate by gate (shared player) |
| `/logic/simplifier/` | Minterms, maxterms, Quine-McCluskey steps, prime implicants, Karnaugh map (2 to 4 variables), every minimal sum of products, minimal product of sums |
| `/logic/equivalence/` | Two expressions: equivalent, or the first row where they differ |

No `/logic/` landing page; breadcrumb "Logic" goes to `/#logic`.

## Expressions

- Variables: single letters A to Z; lowercase letters are read as capitals. At most 6 distinct variables.
- Constants: `0`, `1`, `TRUE`, `FALSE`.
- Operators, by precedence, highest first (stated on every page): NOT; AND and NAND; XOR and XNOR; OR and NOR. Binary operators are left-associative. Parentheses group.
  - NOT: `NOT`, `!`, `~`, `¬`, or a postfix `'` (A').
  - AND: `AND`, `&`, `&&`, `*`, `·`, `∧`, or two operands side by side (`AB`, `A(B+C)`).
  - OR: `OR`, `|`, `||`, `+`, `∨`.
  - XOR: `XOR`, `^`, `⊕`. XNOR: `XNOR`, `⊙`. NAND: `NAND`, `↑`. NOR: `NOR`, `↓`.
  - Words are case-insensitive.
- Errors point to a 1-based character position and say what was expected, for example `Position 5: expected a variable, 0, 1, NOT or "(" after "AND".`
- Truth table rows: variables in alphabetical order, the first variable is the most significant bit, rows 0 to 2^n - 1. Minterm i is the row with value i.

## Circuit

- Built from the parsed expression tree. Each gate is one operator; each leaf is an input terminal labelled with its variable (a variable used twice gets two terminals, stated on the page). NOT is a triangle with a bubble; NAND, NOR and XNOR add the output bubble; XOR adds the extra input curve.
- Layout: columns by depth from the inputs, rows by leaf order (depth-first), each gate centred on its inputs; wires are orthogonal. Pure function, tested for no overlapping gates.
- Propagation: changing an input re-evaluates the circuit level by level. Level k is the set of gates whose longest path from an input has length k. The shared player steps through the levels (one unit per level); narration names each gate's inputs and output at that level. Reduced motion jumps to the end.
- Text equivalent: an ordered list of gates (`G3 = G1 OR C`), and a table of every gate's output for the current inputs.

## Simplifier

- Input: an expression, or minterms as `m(1, 3, 5)` with optional don't-cares `d(2)` and a variable count; up to 6 variables (K-map only up to 4).
- Canonical sum of products `Σm(...)` and product of sums `ΠM(...)`.
- Quine-McCluskey: group minterms (and don't-cares) by number of ones; combine terms differing in one bit, round by round, marking used terms; unused terms are prime implicants. Steps shown per round.
- Cover: essential prime implicants first, then Petrick's method for the rest. **Minimal** means fewest terms, then fewest literals. All minimal covers are listed; when there is more than one, the page says so.
- Minimal POS: the same method on the zeros (maxterms), written as a product of sums.
- K-map (2 to 4 variables): Gray-code order (rows and columns 00, 01, 11, 10); each prime implicant in the first minimal cover is shown as a group, including groups that wrap around the edges. A text list names each group and its cells.
- Constants: all zeros gives `0`, all ones gives `1`.

## Equivalence

Union of the variables of both expressions (at most 6). Equivalent when every row agrees; otherwise the first differing row, both values, and the row as an assignment.

## Golden cases (by hand)

- De Morgan: `NOT(A AND B)` equals `NOT A OR NOT B`; `NOT(A OR B)` equals `NOT A AND NOT B`.
- Absorption: `A OR (A AND B)` equals `A`; `A AND (A OR B)` equals `A`.
- XOR: `A XOR B` equals `(A AND NOT B) OR (NOT A AND B)`.
- Full adder: sum `A XOR B XOR C` is Σm(1, 2, 4, 7); carry `AB + AC + BC` is Σm(3, 5, 6, 7) and simplifies to `AB + AC + BC`.
- Known minimal form: Σm(0, 2, 5, 7, 8, 10, 13, 15) over A B C D simplifies to `BD + B'D'`.
- Two minimal forms: Σm(0, 1, 2, 5, 6, 7) over A B C gives `A'B' + BC' + AC` and `A'C' + B'C + AB` (the classic cyclic chart).
- Constants and one variable: `0`, `1`, `A`, `NOT A`.
- Tautology `A OR NOT A` gives 1; contradiction `A AND NOT A` gives 0.

## Oracle

Brute-force truth tables (a separate evaluator in `tests/logic-oracle.mjs`); every simplified result is checked equivalent on every row; for up to 4 variables an exhaustive search over all sets of implicants finds the true minimum (terms, then literals) and must match the QM result's cost.
