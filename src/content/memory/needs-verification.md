## Needs verification (memory section)

Every number on these pages is computed by the engine at build time, and each sentence below that is not a number is either a definition, a rule of Trace, a claim backed by a test (named), or listed here as open.

Backed by tests in `tests/paging.test.mjs` (listed so a reviewer can check the wording matches what is tested):

- "FIFO and Clock can show it" (Belady's anomaly): golden case FIFO 9 then 10 faults; test "Clock can show Belady anomaly" (Clock 9 then 10 on the same string).
- "LRU and Optimal cannot" / "more frames never cause more faults": property test over 1,500 random strings and 1 to 8 frames. This is also a known theorem (both are stack algorithms); the test is evidence, not a proof.
- "No other algorithm can produce fewer page faults" (Optimal): property test against FIFO, LRU and Clock only. The general statement is the known optimality result for demand paging; not proven here for every possible algorithm.
- "any choice among never-used pages gives the same number of faults" (Optimal tie rule): test against an alternative tie rule on 2,000 random strings.
- "Without any hits, Clock behaves like FIFO": test that Clock's eviction order equals FIFO's whenever Clock has no hits.
- FIFO example (page 3 evicted at step 6, needed at step 7), LRU example (page 0 never evicted, FIFO evicts it), Loop preset (FIFO and LRU fault on every reference), classic string (Clock between LRU and FIFO): one test each.

Open (wording claims about sources or practice, not checked by code):

1. **"Some courses count only replacements"** (FIFO formulas, overview mistakes). Trace counts every fault, including the ones that fill empty frames; the sentence says some courses differ.
2. **Clock new-page bit "Some courses start it at 0"** (Clock option hint and rules). Trace defaults to 1 and offers 0.
3. **Optimal tie rule "Sources differ here"** (Optimal rules). Trace evicts the page in memory longest among those never used again.
4. **"Many processors set a reference bit when a page is accessed"** (Clock strengths).
5. **"Exact LRU ... which real hardware rarely supports directly" and "many systems approximate it"** (LRU weaknesses and note).
6. **"Often close to Optimal on programs with locality"** (LRU strengths) and **"LRU and Clock often stay close to Optimal"** (compare page). Hedged with "often"; true on the presets here, not measured on real workloads.
7. **"Usually more faults than LRU on strings with locality"** (FIFO weaknesses). Hedged with "usually".
8. **"Clock, also called second chance"** (Clock page). Some sources describe Second Chance as a FIFO list that moves a page to the back, and Clock as the same policy on a circular list; they choose the same victims.
9. **Overview table "Used as" column**: "A target that real systems approximate" (LRU), "A cheap approximation of LRU" (Clock), "A benchmark, not a real policy" (Optimal).
