# AI section: game search ladder (SPEC)

Source: `docs/NEXT_SECTIONS_BRIEF.md` section 5.4. Everything written from scratch with Trace's own board representation.

## Pages

| Path | What |
| --- | --- |
| `/ai/game-tree/` | Tic-tac-toe: step through minimax or alpha-beta on a position, with values, pruned branches and a live node counter |
| `/ai/connect-four/` | Connect Four arena: two agents and a seed play move by move with each move explained; play against any agent; a round robin with seeds shown |
| `/ai/compare/` | One Connect Four position given to every agent: chosen move, time, nodes or iterations |

No `/ai/` landing page; breadcrumb "AI" goes to `/#ai`.

## Boards

- Tic-tac-toe: an array of 9 cells (0 empty, 1 X, 2 O), index `row * 3 + col`, X moves first.
- Connect Four: 7 columns by 6 rows, an array of 42 cells (0 empty, 1 Red, 2 Yellow), index `col * 6 + row` with row 0 at the bottom, plus a height per column. Red moves first. Agents never change the board they are given; they work on copies.

## Agents (Connect Four)

1. **Random:** a uniformly random legal column, from the seeded generator.
2. **Greedy (one ply):** wins now if it can; otherwise scores each legal move by the heuristic of the resulting position and picks the best (ties: the column nearest the centre, then the lower column).
3. **Minimax:** depth-limited minimax (default depth 4, cap 6) with the heuristic at the limit. Wins score above any heuristic value and earlier wins score higher.
4. **Alpha-beta:** the same search, same depth, same heuristic and the same fixed move order (centre first: 3, 2, 4, 1, 5, 0, 6), with alpha-beta pruning.
5. **Monte Carlo tree search:** UCT with exploration constant √2, uniformly random playouts from the seeded generator; default 1,000 iterations, cap 20,000; the move with the most visits (ties: centre first).

Heuristic (simple, stated on the page): for every window of four cells in a line, +1 for two of one's own and two empty, +5 for three and one empty, minus the same for the opponent, plus 3 for each own piece in the centre column.

## Search engine (Tic-tac-toe)

- Minimax and alpha-beta to the end of the game (no depth limit needed), values +1 X wins, 0 draw, -1 O wins, from X's point of view; move order 0 to 8.
- Both return the value, the best move (first best in move order) and the number of nodes examined (every position visited, the root included). The trace records enter, leaf, return and prune events for stepping.
- The full game tree from the empty board is counted by the engine (positions including the root, play stopping at a win or a full board). Expected from the brief: 549,946 (computed, not hard-coded).

## Invariants (tests)

- Alpha-beta returns the same value as minimax at the same depth, and the same move under the fixed move order, and never examines more nodes. Checked on Tic-tac-toe positions and Connect Four positions.
- Tic-tac-toe: minimax with full depth never loses from a position it can win, and perfect play from the empty board is a draw.
- Every agent is reproducible with a fixed seed; MCTS with a fixed seed and iteration count is deterministic.
- The random agent only plays legal moves. No agent changes the board passed in.

## Performance

Search runs behind one interface, `runAgent(agent, board, options) → { cancel, promise }`, as a generator pumped in slices of at most 8 ms on the main thread, with a cancel button and hard caps (depth 6, 20,000 iterations). A Web Worker needs `worker-src 'self'` in the CSP: the owner is asked for that exact change; until then the time-sliced loop is used, and switching is a one-file change (`src/js/ui/ai/runner.mjs`).

## Copy rules

No strength ranking that was not measured: the round robin shows the measured results with their seeds. No "best" without scope. The agents use a simple evaluation function, and the pages say so.
