# Trace: content review, memory section

Generated from the built pages by scripts/section-review.mjs. Interactive parts are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content under the tool.

---

## Page: /memory/page-replacement/

- Title: Page Replacement Simulator: FIFO, LRU, Optimal, Clock | Trace
- Description (141 characters): Enter a reference string and a frame count, pick FIFO, LRU, Optimal or Clock, press play, and see every page fault and why it happened. Free.
- Written content: 604 words

### H1: Page replacement simulator

Pick an algorithm, enter the pages a program asks for, and press play. Every hit, fault and eviction comes with the reason for it.

FIFO / LRU / Optimal / Clock

[Interactive tool: see "Interface copy" at the end]

#### What page replacement decides

With virtual memory, a program's memory is split into pages, and only some of them sit in physical memory at once, each in a frame. When the program asks for a page that is not in a frame, that is a page fault: the page has to be loaded, which is slow. If every frame is already full, one page has to leave first. Page replacement is the rule that picks which one.

The simulator above takes the pages a program asks for, in order (the reference string), and the number of frames. Each column of the step table is one reference: the frame rows show what is in memory after it, the Result row shows a hit or a fault, and the Evicted row shows which page left. The four algorithms here answer "which page leaves?" in four different ways, so switch between them and watch the table change.

#### How results are measured

The main number is the count of page faults: fewer is better, because each fault means a slow load. The fault rate divides that by the number of references, so strings of different lengths can be compared. Trace counts every fault, including the first ones that only fill empty frames.

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

#### How the four algorithms differ

On the classic 20-page string with 3 frames, FIFO has 15 faults, LRU 12, Clock 14 and Optimal 9. Use this table as a starting point, then try your own strings in the [compare view](/memory/page-replacement/compare/).

| Algorithm | Evicts | Work on a hit | Belady's anomaly | Used as |

| FIFO | The page loaded first | None | Can happen | The simplest policy |

| LRU | The page unused for longest | Update the recency order | Cannot happen | A target that real systems approximate |

| Optimal | The page needed furthest ahead | None, but needs the future | Cannot happen | A benchmark, not a real policy |

| Clock | The first page without its reference bit | Set one bit | Can happen | A cheap approximation of LRU |

#### More frames, more faults?

Adding frames usually reduces faults, but not always. On the string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, FIFO has 9 faults with 3 frames and 10 with 4. This is Belady's anomaly. LRU and Optimal are stack algorithms, which means a run with more frames always keeps every page a run with fewer frames would keep, so they cannot show it: on the same string LRU goes from 10 to 8 and Optimal from 7 to 6. Every simulator page has a "With one more frame" panel that checks this for whatever string you enter.

#### Common exam mistakes

- **Mixing up LRU and Optimal.** LRU looks back (used longest ago). Optimal looks forward (needed furthest ahead).

- **Not counting the first faults.** Loading into an empty frame is a fault too, unless your course says to count only replacements.

- **Updating FIFO on a hit.** FIFO ignores hits. Only LRU and Clock react to them.

- **Moving the Clock hand on a hit.** A hit sets a bit; the hand only moves when it looks for a victim.

#### Related

- [FIFO page replacement](/memory/page-replacement/fifo/)

- [LRU page replacement](/memory/page-replacement/lru/)

- [Optimal page replacement](/memory/page-replacement/optimal/)

- [Clock page replacement](/memory/page-replacement/clock/)

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [CPU scheduling simulator](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/fifo/

- Title: FIFO Page Replacement Simulator, Step by Step | Trace
- Description (143 characters): Enter a reference string, press play, and watch FIFO evict the page that came in first, with frames, faults and every eviction explained. Free.
- Written content: 945 words

### H1: FIFO page replacement

When memory is full, the page that has been there longest goes. Press play and watch every hit and fault.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive tool: see "Interface copy" at the end]

#### How FIFO page replacement works

A program asks for pages one after another. If the page is already in a frame, that is a hit and nothing changes. If it is not, that is a page fault: the page has to be loaded, and when every frame is full, some page already in memory has to leave to make room. First In, First Out (FIFO) answers "which page leaves?" in the simplest way possible: the page that has been in memory longest.

Think of the frames as a queue. Each newly loaded page joins the back. On a fault with full memory, the page at the front leaves. A hit does not change the queue at all, because FIFO only cares about when a page arrived, not about how often or how recently it was used. That is the source of both its simplicity and its main weakness: a page that is used constantly still leaves once it is the oldest.

In the step table above, each column is one reference. A filled cell marks the page that was just loaded, a ringed cell marks a hit, and the Evicted row shows which page left. The side panel lists the pages in load order, oldest first, which is exactly the order FIFO will evict them in.

#### Worked example

The reference string 1, 3, 0, 3, 5, 6, 3 with 3 frames gives 6 faults and 1 hits in 7 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Page | 1 | 3 | 0 | 3 | 5 | 6 | 3 |
| Frame 0 | 1, loaded | 1 | 1 | 1 | 5, loaded | 5 | 5 |
| Frame 1 | | 3, loaded | 3 | 3, hit | 3 | 6, loaded | 6 |
| Frame 2 | | | 0, loaded | 0 | 0 | 0 | 3, loaded |
| Result | FFault | FFault | FFault | HHit | FFault | FFault | FFault |
| Evicted | | | | | 1 | 3 | 0 |

The first eviction happens at step 5. In Trace's words: "Page 5 is not in memory, so this is a page fault. All frames are full. FIFO evicts page 1, which was loaded first, at step 1. Page 5 goes into frame 0."

Look at page 3 in the example. It is used again and again, yet FIFO does not reward that: once page 3 is the oldest page in memory, it is the next one to go, even though it is about to be needed. The frame count and the string decide the result together, so try the same string with more frames in the simulator.

#### Belady's anomaly

You would expect more frames to mean fewer faults. With FIFO that is not guaranteed. On the string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, FIFO has 9 faults with 3 frames and 10 faults with 4 frames. Adding memory made things worse. This is called Belady's anomaly, and it can happen with FIFO because the set of pages it keeps with more frames is not always a superset of the set it keeps with fewer.

Press the "Belady's anomaly" preset to load that string. The "With one more frame" panel under the results runs the same string with one more frame and shows both fault counts side by side. For this string, FIFO with 1 to 8 frames gives 12, 12, 9, 10, 5, 5, 5, 5 faults.

#### Rules Trace uses

- Frames keep their position. The new page goes into the frame of the page it replaces, so each page stays in one row of the table while it is in memory.

- While there are free frames, a fault fills the lowest-numbered free frame.

- A hit changes nothing for FIFO. Only loading a page sets its place in the queue.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 6 faults in 7 references is a fault rate of 6/7, or 85.7%. Every fault counts, including the first few that only fill empty frames. Some courses count only replacements; if yours does, subtract the number of frames that started empty.

#### Strengths and weaknesses

##### Strengths

- Very cheap: one queue, and nothing to update on a hit.

- Easy to trace by hand: the side panel order is the whole state.

- Every page eventually leaves, so stale pages do not stay forever.

##### Weaknesses

- Ignores how a page is used, so a busy page can be evicted just before it is needed again.

- Can show Belady's anomaly: more frames can mean more faults.

- Usually more faults than LRU on strings with locality, where recent pages are reused soon.

#### Common exam mistakes

- **Moving a page to the back on a hit.** That is LRU, not FIFO. In FIFO a hit leaves the queue exactly as it was.

- **Evicting from the wrong frame.** The victim is the oldest page, which is not always in frame 0. Track the load order, not the row.

- **Forgetting the first faults.** Loading a page into an empty frame is still a page fault.

- **Assuming more frames always help.** With FIFO they usually do, but Belady's anomaly shows they can hurt.

#### Related

- [LRU page replacement](/memory/page-replacement/lru/), which looks at recent use instead of arrival

- [Clock page replacement](/memory/page-replacement/clock/), FIFO with a second chance for used pages

- [Optimal page replacement](/memory/page-replacement/optimal/), the lower bound to compare against

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

- [First Come First Served scheduling](/operating-systems/cpu-scheduling/fcfs/), the same first-in rule for the CPU

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/lru/

- Title: LRU Page Replacement Simulator, Step by Step | Trace
- Description (144 characters): Enter a reference string, press play, and watch Least Recently Used evict the page unused for longest, with every fault and hit explained. Free.
- Written content: 804 words

### H1: LRU page replacement

When memory is full, the page that has gone unused the longest goes. Press play and watch every hit and fault.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive tool: see "Interface copy" at the end]

#### How LRU page replacement works

Least Recently Used (LRU) evicts the page that has gone unused for the longest time. The idea is that the recent past is a good guide to the near future: a page used a moment ago is likely to be used again soon, and a page nobody has touched for a while probably is not needed right now. Programs that loop over the same data or code behave this way, which is called locality of reference.

Unlike FIFO, LRU cares about every reference, not only about loads. Each time a page is used, hit or fault, it becomes the most recently used page. On a fault with full memory, the page whose last use lies furthest in the past is evicted. The side panel in the simulator lists the pages from least to most recently used, so the first entry is always the next victim.

LRU is a stack algorithm: with one more frame it keeps every page it would have kept with fewer frames, and possibly more. Because of that it can never show Belady's anomaly, where adding frames causes more faults.

#### Worked example

The reference string 7, 0, 1, 2, 0, 3, 0, 4 with 3 frames gives 6 faults and 2 hits in 8 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Page | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 |
| Frame 0 | 7, loaded | 7 | 7 | 2, loaded | 2 | 2 | 2 | 4, loaded |
| Frame 1 | | 0, loaded | 0 | 0 | 0, hit | 0 | 0, hit | 0 |
| Frame 2 | | | 1, loaded | 1 | 1 | 3, loaded | 3 | 3 |
| Result | FFault | FFault | FFault | FFault | HHit | FFault | HHit | FFault |
| Evicted | | | | 7 | | 1 | | 2 |

The first eviction happens at step 4. In Trace's words: "Page 2 is not in memory, so this is a page fault. All frames are full. LRU evicts page 7, last used at step 1, longer ago than any other page in memory. Page 2 goes into frame 0."

Watch page 0 in the example. It is used again and again, so it keeps being the most recently used page and LRU never picks it, even though it was loaded early. FIFO would treat it as old and evict it.

#### Rules Trace uses

- Loading a page counts as using it, so a page that has just arrived is the most recently used page.

- A hit makes the page the most recently used one. Nothing else changes.

- Frames keep their position: the new page goes into the frame of the evicted page. While there are free frames, a fault fills the lowest-numbered one.

- Two pages can never have the same last use, because only one page is referenced at each step, so LRU never needs a tie rule.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 6 faults in 8 references is a fault rate of 3/4, or 75%. On the classic 20-page string with 3 frames, LRU has 12 faults, against 15 for FIFO and 9 for Optimal.

#### Strengths and weaknesses

##### Strengths

- Often close to Optimal on programs with locality, without needing to know the future.

- No Belady's anomaly: more frames never cause more faults.

- The choice is easy to explain: the page unused for longest goes.

##### Weaknesses

- Expensive to do exactly: every single reference has to update the recency order, which real hardware rarely supports directly.

- A loop slightly larger than memory defeats it: each page is evicted just before it comes round again. Try the "Loop" preset.

- Recency is only a guess about the future, so it can be wrong.

Because exact LRU is costly, many systems approximate it. The [Clock algorithm](/memory/page-replacement/clock/) is one such approximation that uses a single reference bit per page.

#### Common exam mistakes

- **Not updating on a hit.** A hit makes the page the most recently used one. Forgetting this turns LRU into FIFO.

- **Looking forward instead of back.** LRU looks at the past. Looking at when a page is needed next is Optimal.

- **Evicting the least frequently used page.** LRU is about how long ago a page was used, not how many times.

- **Losing track on long strings.** Keep a recency list beside your table, most recent at one end, like the side panel in the simulator.

#### Related

- [FIFO page replacement](/memory/page-replacement/fifo/), which ignores use completely

- [Optimal page replacement](/memory/page-replacement/optimal/), which looks forward instead of back

- [Clock page replacement](/memory/page-replacement/clock/), a cheap approximation of LRU

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/optimal/

- Title: Optimal Page Replacement Simulator, Step by Step | Trace
- Description (141 characters): Enter a reference string, press play, and watch Optimal (MIN) evict the page needed furthest in the future, with each choice explained. Free.
- Written content: 735 words

### H1: Optimal page replacement

When memory is full, the page needed furthest in the future goes. It needs to know the future, so it is a yardstick. Press play and watch.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive tool: see "Interface copy" at the end]

#### How Optimal page replacement works

Optimal page replacement, also called MIN, evicts the page that will not be needed for the longest time. On a fault with full memory it looks ahead in the reference string, finds when each page in memory will be used next, and evicts the one whose next use is furthest away. A page that is never used again is the best possible victim.

No other algorithm can produce fewer page faults on the same reference string with the same number of frames, which is why it is called optimal. The catch is that it needs to know the future. A real operating system does not know which pages a program will ask for next, so Optimal cannot be built in practice. Its job is to be a yardstick: it shows the best result that is possible, so you can see how far FIFO, LRU or Clock are from it.

The side panel in the simulator lists the pages in memory with the step at which each is needed next, furthest first, so the first entry is the page Optimal would evict on the next fault.

#### Worked example

The reference string 7, 0, 1, 2, 0, 3, 0, 4, 2, 3 with 3 frames gives 6 faults and 4 hits in 10 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| Page | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 | 2 | 3 |
| Frame 0 | 7, loaded | 7 | 7 | 2, loaded | 2 | 2 | 2 | 2 | 2, hit | 2 |
| Frame 1 | | 0, loaded | 0 | 0 | 0, hit | 0 | 0, hit | 4, loaded | 4 | 4 |
| Frame 2 | | | 1, loaded | 1 | 1 | 3, loaded | 3 | 3 | 3 | 3, hit |
| Result | FFault | FFault | FFault | FFault | HHit | FFault | HHit | FFault | HHit | HHit |
| Evicted | | | | 7 | | 1 | | 0 | | |

The first eviction happens at step 4. In Trace's words: "Page 2 is not in memory, so this is a page fault. All frames are full. Optimal looks ahead: pages 7 and 1 are never used again. Of those, page 7 has been in memory longest, so it is evicted. Page 2 goes into frame 0."

On the classic 20-page string with 3 frames, Optimal has 9 faults. LRU has 12 and FIFO 15 on the same string, so the gap to the best possible result is easy to see.

#### Rules Trace uses

- **Tie rule.** If several pages in memory are never used again, Trace evicts the one that has been in memory longest. Sources differ here; any choice among never-used pages gives the same number of faults, but the frame contents can differ, so check which rule your course uses.

- Pages with a later use always have different next-use steps, so no other tie can happen.

- Frames keep their position: the new page goes into the frame of the evicted page. While there are free frames, a fault fills the lowest-numbered one.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 6 faults in 10 references is a fault rate of 3/5, or 60%.

#### Strengths and weaknesses

##### Strengths

- The fewest faults of any algorithm on a given string and frame count.

- A fixed point of comparison for every other algorithm.

- No Belady's anomaly: more frames never cause more faults.

##### Weaknesses

- Needs the whole future reference string, which a running system does not have.

- So it cannot be used as a real page replacement policy, only to measure others.

#### Common exam mistakes

- **Looking back instead of forward.** "Used longest ago" is LRU. Optimal asks "needed furthest in the future".

- **Counting from the wrong place.** Look ahead from the step after the fault, not from the start of the string.

- **Missing pages that are never used again.** They are the first choice. If there are several, say which tie rule you used.

- **Calling Optimal a real algorithm.** It is a benchmark, because it needs future knowledge.

#### Related

- [LRU page replacement](/memory/page-replacement/lru/), which uses the past as a guess about the future

- [FIFO page replacement](/memory/page-replacement/fifo/)

- [Clock page replacement](/memory/page-replacement/clock/)

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/clock/

- Title: Clock Page Replacement Simulator (Second Chance) | Trace
- Description (143 characters): Enter a reference string, press play, and watch the Clock pointer sweep the frames, clear reference bits and pick a victim, step by step. Free.
- Written content: 931 words

### H1: Clock page replacement

A pointer sweeps the frames. A page with its reference bit set gets a second chance; the first page without one goes. Press play and watch.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive tool: see "Interface copy" at the end]

#### How Clock page replacement works

Clock, also called second chance, keeps one reference bit for every frame and a pointer, the clock hand, that moves around the frames in a circle. When a page is used, its reference bit is set to 1. When a fault needs a victim, the hand looks at the frame it points to. If that page's bit is 1, the page has been used recently: the hand clears the bit to 0, giving the page a second chance, and moves on to the next frame. The first page it finds with bit 0 is evicted, the new page goes into that frame, and the hand moves one frame further.

The result sits between FIFO and LRU. Without any hits, Clock behaves like FIFO, because the hand simply goes round in load order. With hits, recently used pages survive a sweep, which approximates LRU at a fraction of the cost: a hit only sets one bit, and the hand does the rest when memory is full.

In the step table, the small number next to each page is its reference bit after that step, and the Pointer row shows where the hand points. The side panel lists the pages starting from the hand, which is the order it will check them.

#### Worked example

The reference string 1, 2, 3, 4, 1, 2, 5, 1 with 3 frames, new pages starting with bit 1, gives 7 faults and 1 hits in 8 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Page | 1 | 2 | 3 | 4 | 1 | 2 | 5 | 1 |
| Frame 0 | 1, bit 1, loaded | 1, bit 1 | 1, bit 1 | 4, bit 1, loaded | 4, bit 1 | 4, bit 1 | 5, bit 1, loaded | 5, bit 1 |
| Frame 1 | | 2, bit 1, loaded | 2, bit 1 | 2, bit 0 | 1, bit 1, loaded | 1, bit 1 | 1, bit 0 | 1, bit 1, hit |
| Frame 2 | | | 3, bit 1, loaded | 3, bit 0 | 3, bit 0 | 2, bit 1, loaded | 2, bit 0 | 2, bit 0 |
| Result | FFault | FFault | FFault | FFault | FFault | FFault | FFault | HHit |
| Evicted | | | | 1 | 2 | 3 | 4 | |
| Pointer | 1 | 2 | 0 | 1 | 2 | 0 | 1 | 1 |

The first second chance happens at step 4. In Trace's words: "Page 4 is not in memory, so this is a page fault. All frames are full. The pointer passes pages 1, 2 and 3, which have reference bit 1, and clears each one: a second chance. At frame 0, page 1 now has bit 0, so it is evicted. Page 4 goes into frame 0. The new page's bit is 1 and the pointer moves to frame 1."

Notice that a full sweep can clear every bit and come back to where it started. When every page has bit 1, the hand evicts the page it started on, exactly as FIFO would.

#### Rules Trace uses

- The hand starts at frame 0 and moves in frame order, wrapping from the last frame back to frame 0.

- While frames are free, a fault loads the page at the hand and moves the hand on. Frames fill in order 0, 1, 2 and so on.

- A hit sets the page's bit to 1 and does not move the hand.

- **The bit of a newly loaded page.** Sources differ. Trace sets it to 1 by default, so a new page starts with a second chance, and offers a switch to start it at 0. The choice can change the result: on the string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 with 3 frames, Clock has 9 faults when new pages start at 1 and 10 when they start at 0.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 7 faults in 8 references is a fault rate of 7/8, or 87.5%. On the classic 20-page string with 3 frames, Clock has 14 faults, between LRU with 12 and FIFO with 15.

#### Strengths and weaknesses

##### Strengths

- Cheap: a hit sets one bit, and only a fault moves the hand.

- Protects recently used pages, which plain FIFO does not.

- Simple hardware support: many processors set a reference bit when a page is accessed.

##### Weaknesses

- Only an approximation of LRU: one bit cannot tell "used a moment ago" from "used a while ago".

- When every bit is set, a fault has to sweep all the frames before it finds a victim.

- It can show Belady's anomaly. On the string above it has 9 faults with 3 frames and 10 with 4.

#### Common exam mistakes

- **Moving the hand on a hit.** A hit only sets the bit. The hand moves only while looking for a victim.

- **Forgetting to clear bits.** Every page the hand passes with bit 1 loses its bit, even if it is not evicted.

- **Leaving the hand on the new page.** After loading, the hand moves on to the next frame.

- **Mixing up the new-page bit.** State whether new pages start at 1 or 0. The two give different tables.

#### Related

- [FIFO page replacement](/memory/page-replacement/fifo/), which Clock becomes when no page is reused

- [LRU page replacement](/memory/page-replacement/lru/), which Clock approximates

- [Optimal page replacement](/memory/page-replacement/optimal/)

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string, frame count and bit setting you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/compare/

- Title: Compare Page Replacement Algorithms | Trace
- Description (142 characters): Run FIFO, LRU, Optimal and Clock on the same reference string and compare page faults, hit rates and how faults change with more frames. Free.
- Written content: 303 words

### H1: Compare page replacement algorithms

Run all four algorithms on the same pages and compare their faults side by side. Change the pages or frames on the left and every row updates at once.

[Interactive tool: see "Interface copy" at the end]

#### How to read this page

The first table runs FIFO, LRU, Optimal and Clock on the same reference string with the same number of frames and counts their faults. The fewest faults are marked. Each algorithm name opens its own simulator with the same pages, so you can step through how it got its number.

The strips show every reference as F for a fault or H for a hit, one row per algorithm, so you can see where the algorithms part ways. The last table runs every algorithm with 1 to 8 frames. A number marked with a triangle is higher than the one to its left: one more frame caused more faults. That is Belady's anomaly, and with the "Belady's anomaly" preset it shows up for FIFO.

#### What to look for

Optimal is a lower bound: no algorithm can have fewer faults on the same string and frame count, because Optimal uses knowledge of the future. The interesting question is how close the others get. On strings where recently used pages come back soon, LRU and Clock often stay close to Optimal. On a loop just larger than memory, like the "Loop" preset, FIFO and LRU fault on every reference while Optimal does much better.

The Clock row uses the bit setting from the panel on the left, so you can see whether starting new pages at 0 or 1 changes its count for your string.

#### Related

- [Page replacement overview](/memory/page-replacement/)

- [FIFO page replacement](/memory/page-replacement/fifo/)

- [LRU page replacement](/memory/page-replacement/lru/)

- [Optimal page replacement](/memory/page-replacement/optimal/)

- [Clock page replacement](/memory/page-replacement/clock/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Interface copy (/memory/page-replacement/)

## Pages

Reference stringPage numbers from 0 to 99, separated by commas or spaces. Up to 40.

FramesHow many pages fit in memory, 1 to 8

New page reference bitA page gets bit 1 when it is loaded, so it starts with a second chance. Some courses start it at 0.
Starts at 1 / Starts at 0

Classic example
Belady's anomaly
Loop
Locality

Copy link

Copy this link

0.5x
1x
2x
4x

1x
step0of 0

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
| Page | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 | 2 | 3 | 0 | 3 | 2 | 1 | 2 | 0 | 1 | 7 | 0 | 1 |
| Frame 0 | 7, loaded | 7 | 7 | 2, loaded | 2 | 2 | 2 | 4, loaded | 4 | 4 | 0, loaded | 0 | 0 | 0 | 0 | 0, hit | 0 | 7, loaded | 7 | 7 |
| Frame 1 | | 0, loaded | 0 | 0 | 0, hit | 3, loaded | 3 | 3 | 2, loaded | 2 | 2 | 2 | 2, hit | 1, loaded | 1 | 1 | 1, hit | 1 | 0, loaded | 0 |
| Frame 2 | | | 1, loaded | 1 | 1 | 1 | 0, loaded | 0 | 0 | 3, loaded | 3 | 3, hit | 3 | 3 | 2, loaded | 2 | 2 | 2 | 2 | 1, loaded |
| Result | FFault | FFault | FFault | FFault | HHit | FFault | FFault | FFault | FFault | FFault | FFault | HHit | HHit | FFault | FFault | HHit | HHit | FFault | FFault | FFault |
| Evicted | | | | 7 | | 0 | 1 | 2 | 3 | 0 | 4 | | | 2 | 3 | | | 0 | 1 | 2 |

Why this happened

All 3 frames are empty. Press play or step forward to bring in the first page.

Page **18** is not in memory, so this is a page fault. All frames are full. The pointer passes pages **10**, **11**, **12**, **13**, **14**, **15**, **16** and **17**, which have reference bit 1, and clears each one: a second chance. At frame 0, page **10** now has bit 0, so it is evicted. Page **18** goes into frame 0. The new page's bit is 1 and the pointer moves to frame 1.

Page **17** is not in memory, so this is a page fault. All frames are full. The pointer passes pages **18**, **10**, **11**, **12**, **13**, **14**, **15** and **16**, which have reference bit 1, and clears each one: a second chance. At frame 0, page **18** now has bit 0, so it is evicted. Page **17** goes into frame 0. The new page's bit is 1 and the pointer moves to frame 1.

Page **29** is not in memory, so this is a page fault. All frames are full. The pointer passes pages **21**, **22**, **23**, **24**, **25**, **26**, **27** and **28**, which have reference bit 1, and clears each one: a second chance. At frame 0, page **21** now has bit 0, so it is evicted. Page **29** goes into frame 0. The new page's bit is 1 and the pointer moves to frame 1.

Load order, oldest first

-
-
-

Decision log

One line per step. Choose a line to move to that step.

Keyboard shortcuts

SpacePlay or pause
Left RightStep back or forward
Home EndJump to the start or the end
RReset
[ ]Slower or faster
TSwitch light or dark theme

Shortcuts are off while you type in a field.

## Results

Page faults15Hits5Fault rate3/4 (75%)References20

Fault rate is `faults / references`. Hit rate is `hits / references`.

### With one more frame

3 frames15 faults
FFFFHFFFFFFHHFFHHFFF
4 frames10 faults
FFFFHFHFHHFHHFFHHFHH
One more frame saves 5 faults on this string.

---

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
