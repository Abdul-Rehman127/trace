# AI section: report

Branch `next-2`. Not reviewed yet (batch review of sections 2 to 4).

## STOP item: one CSP change needs your approval

The brief asks for the search to run in a Web Worker. That needs this exact change to the `Content-Security-Policy` line in `src/static/_headers`:

```
worker-src 'none';   ->   worker-src 'self';
```

Nothing else changes. I have not made this change. Until you approve it, every search runs on the main thread in 5 ms slices with a cancel button (`src/js/ui/ai/runner.mjs`), and the frame-time gate shows the page stays smooth while all five agents think at the hard caps. Switching to a worker would change only `runner.mjs`.

## What was built

- **Game tree explorer** (`/ai/game-tree/`): Tic-tac-toe with minimax or alpha-beta, step by step on the shared player.
  - Each step shows the position being examined, a live count of positions, the branches cut, and the value of each first move as the search settles it.
  - Narration and a summary compare both searches on the same position.
  - Click a square to play a move; four starting positions.
  - The full game tree from the empty board, 549,946 positions including the root, is counted by the engine at build time.
- **Connect Four arena** (`/ai/connect-four/`): random, greedy (one ply), minimax, alpha-beta and MCTS.
  - Two agents and a seed play a reproducible game, computed without blocking the page and then replayed move by move with the reason for each: per-column values, or MCTS visits and win rates.
  - You can play Red against any agent.
  - The round robin plays every pair twice, swapping colours, lists every game with its seed, and labels the totals as results for those settings.
- **Compare agents** (`/ai/compare/`): one position given to all five agents in turn, showing the chosen column, the computing time and the work done. A long run can be stopped.
- **Written content:** 523, 502 and 259 words. Every figure is computed at build time. The pages say the agents use a simple evaluation function and rank nothing that wasn't measured.

## Gates

| Gate | Result |
| --- | --- |
| Engine tests | 12 AI tests pass in about 1 s:<br>- the 549,946 count, and perfect play drawing<br>- alpha-beta matching minimax in value and move and never examining more positions, on 800 Tic-tac-toe positions and 40 Connect Four positions at depths 1 to 3<br>- minimax keeping a won position<br>- every agent reproducible with a fixed seed, MCTS deterministic, random only legal, and no agent changing the board<br>- the searching agents taking a win in one and blocking a loss in one, and games reproducible from their seed |
| Content lint | 27 pages clean |
| Browser tests | All pass, including:<br>- tree counts, and alpha-beta examining fewer positions with branches cut<br>- a seeded arena game replaying identically, with every move explained<br>- playing against an agent<br>- compare: alpha-beta matching minimax with no more work, and the stop button<br>- 390 px, and CLS 0 with fonts blocked |
| Lighthouse mobile | See `RELEASE_NOTES_NEXT.md` for the final run |
| Frame time | All five agents thinking, depth 6 and 20,000 MCTS iterations, 4x CPU throttle, median of 5: p95 16.8 ms. See the release notes for the final maximum. |

## Deviations and why

- **No Web Worker yet:** see the STOP item above.
- **Tic-tac-toe step-through is limited to positions with up to 7 empty squares,** a few thousand steps at most. The empty board still shows its totals and the 549,946 count.
- **Fixed centre-first move order** for both searches, so "same move as minimax" is well defined (the brief's invariant).
- **Two performance fixes found by the frame-time gate:** smaller agent chunks with each agent starting in a fresh task, and integer formatting without Intl. The first `toLocaleString` call cost one long frame mid-search.

## Open questions

1. Approve `worker-src 'self'` (above)?

## Needs verification

See the end of `sections/ai/content-review.md` (source `src/content/ai/needs-verification.md`): the statements about real programs, move ordering, random playouts, depth not always helping, and the round robin wording.

## Review material

Screenshots: branch `review-shots`, folder `ai/`, 3 pages, light and dark, at 1440, 1024 and 390 px. States: default, hover, selected and focus, plus mid-play and end for the game tree.
