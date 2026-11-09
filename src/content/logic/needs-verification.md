## Needs verification (logic section)

Every table, form and answer on these pages is computed by the engine. Backed by tests in `tests/logic.test.mjs`: every operator spelling, the stated precedence, the positioned error messages, De Morgan, absorption, XOR as AND-OR, the full adder, the known minimal form BD + B'D', the two-answer function, constants, tautology and contradiction, every minimal SOP and POS equal to its function on every row, the QM cost equal to a brute-force minimum (up to 4 variables, 400 random functions with don't-cares), and the circuit computing the expression on every row.

Open:

1. **Precedence "Not every source uses this precedence: some give XOR the same level as OR, and some do not allow AND to be implied"** (truth table page). Trace's order is fixed by the brief; the sentence describes other conventions.
2. **Gate shapes** (circuit page): the descriptions follow the common distinctive-shape symbols; other symbol standards (rectangular) exist and are not mentioned.
3. **"Real gates have different, small delays"** and "in hardware it takes one delay per level" (circuit page): simplifications, stated as such.
4. **"A marking scheme might expect either"** (simplifier): a claim about assessment practice.
5. **Minimality definition** (fewest terms, then fewest literals): the usual two-level cost; some texts count gate inputs instead, which can rank covers differently.
