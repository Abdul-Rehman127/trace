# Trace: content review, logic section

Generated from the built pages by scripts/section-review.mjs. Interactive parts are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content under the tool.

---

## Page: /logic/truth-table/

- Title: Truth Table Generator for Boolean Expressions | Trace
- Description (149 characters): Type a Boolean expression with AND, OR, NOT, XOR, NAND, NOR or XNOR and get its full truth table, every subexpression, and its canonical forms. Free.
- Written content: 513 words

### H1: Truth table generator

Type an expression and get its truth table as you type, with a column for every part of the expression.

[Truth table](/logic/truth-table/) / [Circuit](/logic/circuit/) / [Simplifier](/logic/simplifier/) / [Equivalence](/logic/equivalence/)

#### Expression

Boolean expressionFor example (A AND B) OR NOT C, or AB + C'
(A AND B) OR NOT C

Precedence: NOT, then AND, then XOR, then OR. Write AND as AND, &, * or two letters side by side; OR as OR, | or +; NOT as NOT, !, ~ or a trailing '.

De Morgan
Full adder sum
Majority
Implication

Copy link

Copy this link

#### Truth table

Read asA AND B OR NOT CVariablesA, B, C
| A | B | C | Row | A AND B | NOT C | A AND B OR NOT C |
| 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| 0 | 1 | 0 | 2 | 0 | 1 | 1 |
| 0 | 1 | 1 | 3 | 0 | 0 | 0 |
| 1 | 0 | 0 | 4 | 0 | 1 | 1 |
| 1 | 0 | 1 | 5 | 0 | 0 | 0 |
| 1 | 1 | 0 | 6 | 1 | 1 | 1 |
| 1 | 1 | 1 | 7 | 1 | 0 | 1 |Sum of mintermsΣm(0, 2, 4, 6, 7)Product of maxtermsΠM(1, 3, 5)

#### How a truth table works

A Boolean expression combines inputs that are either 0 (false) or 1 (true) with operators such as AND, OR and NOT. A truth table lists every possible combination of the inputs and the value of the expression for each one. With n variables there are 2n rows, so 3 variables give 8 rows and 6 give 64.

The table above lists the variables in alphabetical order, with the first one as the most significant bit, so the row number is the inputs read as a binary number. Between the inputs and the result it adds a column for every part of the expression, innermost first, so you can follow how the answer is built up.

#### Worked example

For `A XOR B` the output is 1 exactly when the inputs differ:

| A | B | Row | A XOR B |
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 2 | 1 |
| 1 | 1 | 3 | 0 |

The rows with output 1 are rows 1 and 2, so the sum of minterms is `Σm(1, 2)`. The rows with output 0 are rows 0 and 3, giving the product of maxterms `ΠM(0, 3)`.

#### How Trace reads an expression

- **Precedence:** NOT first, then AND (and NAND), then XOR (and XNOR), then OR (and NOR). Operators of the same level are applied left to right. Use parentheses whenever you want a different order.

- **AND** can be written AND, &, *, · or by putting two operands side by side: `AB` and `A(B + C)` both mean AND.

- **OR** can be written OR, |, + or ∨; **NOT** as NOT, !, ~, ¬ or a trailing apostrophe (`A'`).

- Variables are single letters A to Z (lowercase letters are read as capitals), up to 6 in one expression. 0, 1, TRUE and FALSE are constants.

- An error message gives the position where reading stopped and what was expected there.

Not every source uses this precedence: some give XOR the same level as OR, and some do not allow AND to be implied. When in doubt, add parentheses; the "Read as" line shows exactly how the expression was understood.

#### Canonical forms

- Sum of minterms `Σm(...)`: the rows where the output is 1

- Product of maxterms `ΠM(...)`: the rows where the output is 0

- Rows `= 2^n` for n variables

#### Common exam mistakes

- **Reading A + B C as (A + B)C.** AND comes first, so it is A + (BC).

- **Getting the row order wrong.** Count in binary with the first variable as the most significant bit.

- **Confusing XOR and OR.** They differ only when both inputs are 1: OR gives 1, XOR gives 0.

#### Related

- [Logic circuit simulator](/logic/circuit/), the same expression as gates

- [Boolean simplifier](/logic/simplifier/), the shortest form of the same function

- [Equivalence checker](/logic/equivalence/)

#### Spotted a mistake?

If a row or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes your expression.

Email: abdul at abmans dot com

---

## Page: /logic/circuit/

- Title: Logic Circuit Simulator from a Boolean Expression | Trace
- Description (151 characters): Type a Boolean expression and get its logic gate circuit. Switch the inputs and watch each change travel gate by gate, with every step explained. Free.
- Written content: 494 words

### H1: Logic circuit simulator

Type an expression to draw its circuit, then switch an input and watch the change travel through the gates one level at a time.

[Truth table](/logic/truth-table/) / [Circuit](/logic/circuit/) / [Simplifier](/logic/simplifier/) / [Equivalence](/logic/equivalence/)

#### Expression

Boolean expressionFor example (A AND B) OR NOT C, or AB + C'
A XOR B XOR C

Precedence: NOT, then AND, then XOR, then OR.

InputsSwitch an input and watch the change travel through the gates
A0 / B0 / C0

Full adder sum
Carry
NAND only
Multiplexer

Copy link

Copy this link

0.5x
1x
2x
4x

1x
level0of 2

What changed

Switch an input to send a change through the circuit.

**G1** (NAND) now gets A = 1 and A = 1, so its output changes from 1 to 0. **G2** (NAND) now gets B = 1 and B = 1, so its output changes from 1 to 0.

**G1** (NOT) now gets S = 1, so its output changes from 1 to 0. **G3** (AND) now gets S = 1 and B = 1, so its output changes from 0 to 1.

**G3** (NAND) now gets G1 = 0 and G2 = 0, so its output changes from 0 to 1. The output Q is 1, changed from 0.

Output

Q = 0

Decision log

One line per level of gates. Choose a line to move there.

#### The circuit in words

- G1 = A XOR B
- G2 = G1 XOR C

| Gate | Kind | Inputs | Output |
| G1 | XOR | A = 0, B = 0 | 0 |
| G2 | XOR | G1 = 0, C = 0 | 0 |

#### How the circuit is built

Every operator in the expression becomes one logic gate, and every variable becomes an input on the left. Gates are placed in columns by how far they are from the inputs, so signals flow from left to right and the last gate on the right drives the output Q. A wire carrying 1 is drawn thicker and in color, a wire carrying 0 is thin and grey, and every gate shows its current output value next to it.

When you switch an input, the change does not reach the output at once: it passes through the gates one level at a time. The simulator steps through those levels with the same play, step and speed controls as the other simulators, and says which gates change at each level and why.

#### Worked example

The default circuit is the sum bit of a full adder, `A XOR B XOR C`. Read left to right it has two gates:

- `G1 = A XOR B`
- `G2 = G1 XOR C`

Switch A from 0 to 1 with B and C at 0. At level 1, G1 sees A = 1 and B = 0, so its output changes to 1. At level 2, G2 sees G1 = 1 and C = 0, so the output Q changes to 1.

#### The gates

- **AND** (flat back, round front): 1 only when both inputs are 1. **NAND** adds a small circle on the output, which inverts it.

- **OR** (curved back, pointed front): 1 when at least one input is 1. **NOR** adds the inverting circle.

- **XOR** (an OR with an extra curve at the back): 1 when the inputs differ. **XNOR** adds the circle: 1 when they are equal.

- **NOT** (a triangle with a circle): inverts its single input.

#### How the drawing is made

- The circuit follows the expression exactly as written, one gate per operator; it is not simplified first. Use the [simplifier](/logic/simplifier/) to find a smaller circuit.

- A variable used more than once gets its own input terminal each time, so the drawing stays a tree with no crossing wires. In real hardware those would be the same wire.

- Gate delays are shown as equal steps, one per level. Real gates have different, small delays.

#### Common exam mistakes

- **Drawing NAND as AND followed by a separate NOT gate.** That is correct logic but counts as two gates; NAND is one.

- **Missing the inverting circle.** The small circle is what turns AND into NAND and OR into NOR.

- **Reading the output before the change has passed through every level.** On paper this is instant; in hardware it takes one delay per level.

#### Related

- [Truth table generator](/logic/truth-table/)

- [Boolean simplifier](/logic/simplifier/)

- [Equivalence checker](/logic/equivalence/)

#### Spotted a mistake?

If a gate or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes your expression and inputs.

Email: abdul at abmans dot com

---

## Page: /logic/simplifier/

- Title: Boolean Simplifier with K-Map and Quine-McCluskey | Trace
- Description (148 characters): Simplify a Boolean expression or a list of minterms. See every minimal sum of products, the Karnaugh map groups and the Quine-McCluskey steps. Free.
- Written content: 550 words

### H1: Boolean expression simplifier

Enter an expression or minterms and get every shortest sum of products, the product of sums, the Karnaugh map and the steps.

[Truth table](/logic/truth-table/) / [Circuit](/logic/circuit/) / [Simplifier](/logic/simplifier/) / [Equivalence](/logic/equivalence/)

#### Function

Expression to simplifyFor example (A AND B) OR NOT C, or AB + C'
A'B'C' + A'B'C + A'BC' + AB'C + ABC' + ABC

Or enter minterms instead
Variables1 to 6, named A, B, C, ...
MintermsRow numbers where the output is 1, such as 0, 2, 5, 7
Don't-caresOptional rows that may be 0 or 1
Simplify these minterms

Precedence: NOT, then AND, then XOR, then OR. Write AND as AND, &, * or two letters side by side; OR as OR, | or +; NOT as NOT, !, ~ or a trailing '.

Two answers
BD + B’D’
Majority
Full adder sum

Copy link

Copy this link

#### Simplified

VariablesA, B, CSum of mintermsΣm(0, 1, 2, 5, 6, 7)Product of maxtermsΠM(3, 4)
##### 2 minimal sums of products (all equally short)

- AC + A'B' + BC'
- AB + A'C' + B'C
There is more than one minimal answer: each uses 3 terms and 6 literals. Any of them is correct.

##### Minimal product of sums

- (A' + B + C)(A + B' + C')
##### Karnaugh map

| A \ BC | 00 | 01 | 11 | 10 |
| 0 | 10 | 11 | 03 | 12 |
| 1 | 04 | 15 | 17 | 16 |
- Group 1: AC covers cells 5, 7
- Group 2: A'B' covers cells 0, 1
- Group 3: BC' covers cells 2, 6
##### Prime implicants

- 11- AB
- 1-1 AC
- 00- A'B'
- 0-0 A'C'
- -10 BC'
- -01 B'CQuine-McCluskey steps
##### Round 1: minterms grouped by number of ones

| Ones | Term | Covers | Combined |
| 0 | 000 | 0 | yes |
| 1 | 001 | 1 | yes |
| | 010 | 2 | yes |
| 2 | 101 | 5 | yes |
| | 110 | 6 | yes |
| 3 | 111 | 7 | yes |
##### Round 2: pairs from round 1 that differ in one bit

| Ones | Term | Covers | Combined |
| 0 | 00- | 0, 1 | no, a prime implicant |
| | 0-0 | 0, 2 | no, a prime implicant |
| 1 | -01 | 1, 5 | no, a prime implicant |
| | -10 | 2, 6 | no, a prime implicant |
| 2 | 1-1 | 5, 7 | no, a prime implicant |
| | 11- | 6, 7 | no, a prime implicant |

#### How Boolean simplification works

Many different expressions describe the same function. Simplifying means finding one that uses as few terms and literals as possible, which in hardware means fewer gates and fewer gate inputs. The simplifier above works on sums of products (terms ANDed together, then ORed), and also gives the matching product of sums.

It uses the Quine-McCluskey method. First it lists the minterms, the rows where the function is 1. It groups them by how many ones they have, and combines any two terms that differ in exactly one bit, replacing that bit with a dash. It repeats this round after round. Terms that never combine further are the **prime implicants**. Finally it picks a set of prime implicants that covers every minterm: the **essential** ones first (the only prime implicant covering some minterm), then the cheapest way to cover the rest.

#### Worked example

The function Σm(0, 2, 5, 7, 8, 10, 13, 15) over A, B, C and D has 2 prime implicants, and the minimal sum of products is `BD + B'D'`. On the Karnaugh map, one group is the four corners (B'D': B = 0 and D = 0), which wrap around both edges; the other is the middle square (BD).

Some functions have more than one minimal answer. Σm(0, 1, 2, 5, 6, 7) over A, B and C has 6 prime implicants arranged in a cycle, and two different covers are equally short: `AC + A'B' + BC'` and `AB + A'C' + B'C`. The simplifier lists every minimal answer and says so when there is more than one, because a marking scheme might expect either.

#### Rules Trace uses

- **Minimal** means the fewest terms first, then the fewest literals.

- Don't-cares (rows that may be either value) are used when they help a group grow, and never have to be covered.

- The Karnaugh map is drawn for 2 to 4 variables, in Gray code order (00, 01, 11, 10), so neighbouring cells differ in one variable. Groups can wrap from one edge to the opposite edge. The map shows the first minimal answer.

- Up to 6 variables are simplified; above 4 the map is left out and the Quine-McCluskey steps carry the explanation.

#### Notation

- `A'` means NOT A; `AB` means A AND B; `+` means OR

- A term like `1-0-` means A = 1 and C = 0, with B and D free

- A group of 2k cells removes k variables from its term

#### Common exam mistakes

- **Missing wrap-around groups.** The left and right edges are neighbours, and so are the top and bottom.

- **Making groups that are not a power of two.** Groups have 1, 2, 4, 8 or 16 cells.

- **Stopping at a cover that is not minimal.** A prime implicant whose cells are all covered by essential ones can be dropped.

- **Thinking there is one right answer.** Some functions have several equally short forms.

#### Related

- [Truth table generator](/logic/truth-table/)

- [Equivalence checker](/logic/equivalence/), to check your own simplification

- [Logic circuit simulator](/logic/circuit/)

#### Spotted a mistake?

If an answer or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes your function.

Email: abdul at abmans dot com

---

## Page: /logic/equivalence/

- Title: Boolean Expression Equivalence Checker | Trace
- Description (146 characters): Check whether two Boolean expressions are equivalent. If they are not, see the first input row where they give different outputs. Free, no signup.
- Written content: 394 words

### H1: Boolean equivalence checker

Type two expressions. Trace compares them on every row and shows the first row where they differ.

[Truth table](/logic/truth-table/) / [Circuit](/logic/circuit/) / [Simplifier](/logic/simplifier/) / [Equivalence](/logic/equivalence/)

#### Expressions

First expressionFor example NOT (A AND B)
NOT (A AND B)

Second expressionFor example NOT A OR NOT B
NOT A OR NOT B

Precedence: NOT, then AND, then XOR, then OR. Write AND as AND, &, * or two letters side by side; OR as OR, | or +; NOT as NOT, !, ~ or a trailing '.

De Morgan
Absorption
XOR as AND-OR
Not equal

Copy link

Copy this link

#### Result

Equivalent: the two expressions agree on all 4 rows.

| A | B | First | Second | Same? |
| 0 | 0 | 1 | 1 | yes |
| 0 | 1 | 1 | 1 | yes |
| 1 | 0 | 1 | 1 | yes |
| 1 | 1 | 0 | 0 | yes |

#### How the equivalence check works

Two Boolean expressions are equivalent when they give the same output for every possible input. The checker takes all the variables used in either expression, works out both outputs on every row of the combined truth table, and compares them. With at most 6 variables that is at most 64 rows, so the answer is exact, not a guess from a few samples.

If any row differs, the first such row is shown with the input values and both outputs. That row is a counterexample: a concrete input that proves the two expressions are different.

#### Worked example

Are `A OR B` and `A XOR B` the same? No. Not equivalent. The first row where they differ is row 3: A = 1, B = 1, where the first gives 1 and the second gives 0. Every other row agrees, which is why the two are easy to confuse.

The default example checks De Morgan's law: `NOT (A AND B)` and `NOT A OR NOT B` agree on all 4 rows, so they are equivalent.

#### Identities worth checking

- De Morgan: `NOT (A AND B) = NOT A OR NOT B` and `NOT (A OR B) = NOT A AND NOT B`

- Absorption: `A OR (A AND B) = A` and `A AND (A OR B) = A`

- XOR as AND and OR: `A XOR B = AB' + A'B`

- Distribution: `A AND (B OR C) = AB + AC`, and also `A OR BC = (A + B)(A + C)`

#### Rules Trace uses

- An expression that does not use a variable simply ignores it: `A` and `A OR (B AND NOT B)` are compared over A and B, and are equivalent.

- Both expressions are read with the same precedence: NOT, then AND, then XOR, then OR.

#### Common exam mistakes

- **Checking only a few rows.** Two expressions can agree on most rows and still differ, as OR and XOR do.

- **Applying De Morgan without flipping the operator.** NOT (A AND B) is NOT A OR NOT B, not NOT A AND NOT B.

#### Related

- [Boolean simplifier](/logic/simplifier/)

- [Truth table generator](/logic/truth-table/)

- [Logic circuit simulator](/logic/circuit/)

#### Spotted a mistake?

If a result or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes both expressions.

Email: abdul at abmans dot com

---

## Needs verification (logic section)

Every table, form and answer on these pages is computed by the engine. Backed by tests in `tests/logic.test.mjs`: every operator spelling, the stated precedence, the positioned error messages, De Morgan, absorption, XOR as AND-OR, the full adder, the known minimal form BD + B'D', the two-answer function, constants, tautology and contradiction, every minimal SOP and POS equal to its function on every row, the QM cost equal to a brute-force minimum (up to 4 variables, 400 random functions with don't-cares), and the circuit computing the expression on every row.

Open:

1. **Precedence "Not every source uses this precedence: some give XOR the same level as OR, and some do not allow AND to be implied"** (truth table page). Trace's order is fixed by the brief; the sentence describes other conventions.
2. **Gate shapes** (circuit page): the descriptions follow the common distinctive-shape symbols; other symbol standards (rectangular) exist and are not mentioned.
3. **"Real gates have different, small delays"** and "in hardware it takes one delay per level" (circuit page): simplifications, stated as such.
4. **"A marking scheme might expect either"** (simplifier): a claim about assessment practice.
5. **Minimality definition** (fewest terms, then fewest literals): the usual two-level cost; some texts count gate inputs instead, which can rank covers differently.
