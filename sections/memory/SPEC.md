# Memory section: page replacement (SPEC)

Source: `docs/NEXT_SECTIONS_BRIEF.md` section 5.1. This file fixes every rule the code and tests follow.

## Pages

| Path | Template | What |
| --- | --- | --- |
| `/memory/page-replacement/` | `paging` | Overview simulator with an algorithm selector (FIFO default), how to choose |
| `/memory/page-replacement/fifo/` | `paging` | FIFO |
| `/memory/page-replacement/lru/` | `paging` | LRU |
| `/memory/page-replacement/optimal/` | `paging` | Optimal (MIN) |
| `/memory/page-replacement/clock/` | `paging` | Clock (second chance) |
| `/memory/page-replacement/compare/` | `paging-compare` | All four on the same input, plus faults for 1 to 8 frames |

Breadcrumbs: Memory (`/#memory`), Page replacement, then the page. There is no `/memory/` page (one tool family, it would be thin), same as Operating systems in v1.

## Input

- Reference string: 1 to 40 page numbers, each a whole number 0 to 99, separated by commas, spaces or both. Leading and trailing separators are ignored. Leading zeros are accepted for page numbers ("07" is page 7) because page numbers are not addresses; this is a Trace rule, stated nowhere in copy since it never matters.
- Frames: whole number 1 to 8.
- Clock only: new page reference bit, 1 (default) or 0.

Validation messages (same voice as scheduling):
- Empty: "Enter at least one page number."
- Bad token: "\"x\" is not a page number. Use whole numbers from 0 to 99, separated by commas or spaces." (first bad token only)
- Out of range: "Page 140 is out of range. Use whole numbers from 0 to 99."
- Too many: "Use at most 40 page references. This string has 41."
- Frames: "Frames must be a whole number from 1 to 8."

Nothing is clamped silently. While input is invalid the simulator keeps showing the last valid run.

## Frame model

Frames are numbered 0 to n-1 and keep their position: a page stays in the frame it was loaded into until it is evicted, and the new page takes the evicted page's frame. This matches the usual exam table layout.

A fault with a free frame fills the lowest-numbered free frame. Frames only ever fill in order 0, 1, 2, ... because nothing frees a frame, so "lowest free" and "next free" are the same.

## Algorithms and tie rules

- **FIFO:** evict the page loaded earliest (smallest load time). Load times are distinct, so no tie.
- **LRU:** evict the page used least recently (smallest last-use time, where loading counts as a use). Distinct, no tie.
- **Optimal (MIN):** evict the page whose next use is farthest in the future. Pages never used again count as infinitely far. **Tie rule:** if several pages are never used again, evict the one that has been in memory longest (smallest load time). Pages with a future use have distinct next-use positions, so no other tie exists.
- **Clock (second chance):** a pointer starts at frame 0. On a fault:
  1. If the frame at the pointer is empty, load the page there.
  2. Otherwise, while the page at the pointer has reference bit 1: set the bit to 0 (its second chance) and move the pointer to the next frame (wrapping to 0).
  3. Evict the page at the pointer (bit 0) and load the new page there.
  After loading, the new page's bit is set to the new-page bit (default 1, switch to 0), and the pointer moves to the next frame.
  On a hit, the page's bit is set to 1 and the pointer does not move.

## Reason codes (one per step)

`hit`, `fault-free-frame`, `fault-evict-oldest` (FIFO), `fault-evict-least-recent` (LRU), `fault-evict-farthest-next-use` (Optimal), `clock-evict` (Clock eviction with no bit cleared), `clock-second-chance` (Clock eviction after clearing one or more bits; the step lists which pages lost their bit).

## Output per step

`{ i, page, hit, slot, evicted, reason, frames[], loadedAt[], lastUsed[], nextUse[] (Optimal, before the decision), bits[] and pointer (Clock, after), pointerBefore, cleared[] (Clock: pages whose bit was cleared, in order) }`, plus totals: faults, hits, fault rate as an exact fraction and a percentage to one decimal.

Fault rate = faults / references.

## Share link

`?alg=fifo&f=3&r=7,0,1,2` with `bit=0` only for Clock when the new-page bit is 0. Decoding never throws; unreadable parts fall back to the page default and produce a notice, as in scheduling. The query is capped at 2048 characters.

## Presets

1. Classic example: 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 with 3 frames (default on every page).
2. Belady's anomaly: 1,2,3,4,1,2,5,1,2,3,4,5 with 3 frames. The "one more frame" panel shows 3 and 4 frames side by side; under FIFO that is 9 against 10 faults.
3. Loop: 1,2,3,4,1,2,3,4,1,2,3,4 with 3 frames (FIFO and LRU fault on every reference; Optimal does far better).
4. Locality: 1,2,1,3,1,2,1,4,1,2,1,3 with 3 frames.

## One more frame panel

Every algorithm page shows the same reference string at n and n+1 frames (n at most 7) side by side with both fault counts. If n+1 frames gives more faults the panel says "Adding a frame caused more faults here. This is Belady's anomaly." Copy says FIFO and Clock can show it, LRU and Optimal cannot (both are stack algorithms; tested as a property).

## Golden cases

Brief cases (never edit):

| String | Frames | FIFO | LRU | Optimal |
| --- | --- | --- | --- | --- |
| 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 | 3 | 15 | 12 | 9 |
| 1,2,3,4,1,2,5,1,2,3,4,5 | 3 | 9 | 10 | 7 |
| 1,2,3,4,1,2,5,1,2,3,4,5 | 4 | 10 | 8 | 6 |

Edge cases (derived by hand, same for every algorithm):

| String | Frames | Faults | Why |
| --- | --- | --- | --- |
| 1,1,2,1 | 1 | 3 | 1 F, 1 H, 2 F (evicts 1), 1 F |
| 1,2,1,3 | 5 | 3 | more frames than distinct pages: one fault per distinct page |
| 4,4,4,4 | 3 | 1 | one page repeated |
| 1,2,3,4,5,6 | 3 | 6 | all distinct |

Optimal tie: 1,2,3,4 with 3 frames. At page 4, pages 1, 2 and 3 are never used again; page 1 has been in memory longest, so it is evicted. Final frames [4, 2, 3].

### Clock traces (derived by hand)

Notation: frames [f0, f1, f2], bits [b0, b1, b2], p = pointer after the step.

**A. 1,2,3,4,1,2,5,1,2,3,4,5, 3 frames, new bit 1: 9 faults.**

| # | Page | Result | Frames | Bits | p | Cleared |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | fault, free | 1 . . | 1 . . | 1 | |
| 2 | 2 | fault, free | 1 2 . | 1 1 . | 2 | |
| 3 | 3 | fault, free | 1 2 3 | 1 1 1 | 0 | |
| 4 | 4 | fault, evict 1 | 4 2 3 | 1 0 0 | 1 | 1, 2, 3 |
| 5 | 1 | fault, evict 2 | 4 1 3 | 1 1 0 | 2 | |
| 6 | 2 | fault, evict 3 | 4 1 2 | 1 1 1 | 0 | |
| 7 | 5 | fault, evict 4 | 5 1 2 | 1 0 0 | 1 | 4, 1, 2 |
| 8 | 1 | hit | 5 1 2 | 1 1 0 | 1 | |
| 9 | 2 | hit | 5 1 2 | 1 1 1 | 1 | |
| 10 | 3 | fault, evict 1 | 5 3 2 | 0 1 0 | 2 | 1, 2, 5 |
| 11 | 4 | fault, evict 2 | 5 3 4 | 0 1 1 | 0 | |
| 12 | 5 | hit | 5 3 4 | 1 1 1 | 0 | |

**B. Same string, new bit 0: 10 faults.** After filling: [1 2 3], bits [0 0 0], p 0. 4 evicts 1 (p 1), 1 evicts 2 (p 2), 2 evicts 3 (p 0), 5 evicts 4 (p 1): frames [5 1 2], bits [0 0 0]. Hits on 1 and 2 set bits [0 1 1]. 3: clears 1 and 2, evicts 5 at frame 0, p 1, frames [3 1 2], bits [0 0 0]. 4 evicts 1 (p 2), 5 evicts 2 (p 0). Final [3 4 5], 10 faults.

**C. 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1, 3 frames, new bit 1: 14 faults.**

| # | Page | Result | Frames | Bits | p |
| --- | --- | --- | --- | --- | --- |
| 1 | 7 | fault, free | 7 . . | 1 . . | 1 |
| 2 | 0 | fault, free | 7 0 . | 1 1 . | 2 |
| 3 | 1 | fault, free | 7 0 1 | 1 1 1 | 0 |
| 4 | 2 | fault, clears 7 0 1, evict 7 | 2 0 1 | 1 0 0 | 1 |
| 5 | 0 | hit | 2 0 1 | 1 1 0 | 1 |
| 6 | 3 | fault, clears 0, evict 1 | 2 0 3 | 1 0 1 | 0 |
| 7 | 0 | hit | 2 0 3 | 1 1 1 | 0 |
| 8 | 4 | fault, clears 2 0 3, evict 2 | 4 0 3 | 1 0 0 | 1 |
| 9 | 2 | fault, evict 0 | 4 2 3 | 1 1 0 | 2 |
| 10 | 3 | hit | 4 2 3 | 1 1 1 | 2 |
| 11 | 0 | fault, clears 3 4 2, evict 3 | 4 2 0 | 0 0 1 | 0 |
| 12 | 3 | fault, evict 4 | 3 2 0 | 1 0 1 | 1 |
| 13 | 2 | hit | 3 2 0 | 1 1 1 | 1 |
| 14 | 1 | fault, clears 2 0 3, evict 2 | 3 1 0 | 0 1 0 | 2 |
| 15 | 2 | fault, evict 0 | 3 1 2 | 0 1 1 | 0 |
| 16 | 0 | fault, evict 3 | 0 1 2 | 1 1 1 | 1 |
| 17 | 1 | hit | 0 1 2 | 1 1 1 | 1 |
| 18 | 7 | fault, clears 1 2 0, evict 1 | 0 7 2 | 0 1 0 | 2 |
| 19 | 0 | hit | 0 7 2 | 1 1 0 | 2 |
| 20 | 1 | fault, evict 2 | 0 7 1 | 1 1 1 | 0 |

## Properties (tested over random inputs)

- Faults + hits = references; faults at least the number of distinct pages; at most the number of references.
- Optimal faults at most every other algorithm's, on every input.
- LRU and Optimal: faults with n+1 frames never exceed faults with n frames.
- FIFO is allowed to break that (the golden case shows it does).
- After every step, frames hold distinct pages, at most n of them, and the referenced page is in a frame.
- With frames at least the number of distinct pages, faults equal the number of distinct pages.

## Oracle

`tests/paging-oracle.mjs`, written separately with different data structures: FIFO as an explicit queue array of pages, LRU as a recency list (move to front), Optimal by scanning the remaining string from scratch on every fault, Clock as an array of `{page, bit}` objects walked with a modulo index. It reports only fault counts and the final frame set (as a sorted list, so frame positions do not matter), and Clock's final frames by position.

## Copy outline per algorithm page

How it works, worked example (generated step table at build time), rule used and tie rule, formulas (fault rate, hit rate), strengths and weaknesses, common exam mistakes, related links, "Spotted a mistake?". Overview page: how to choose, a comparison table (needs future knowledge, can show Belady's anomaly, cost per reference, used in practice as). Compare page: short how to read it.
