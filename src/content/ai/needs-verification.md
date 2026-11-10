## Needs verification (AI section)

Every figure on these pages is computed by running the engine at build time (the 549,946 positions, the node counts for both searches, the compare page's counts). Backed by tests in `tests/ai.test.mjs`: the tree count, perfect play drawing, alpha-beta matching minimax in value and move and never examining more nodes (Tic-tac-toe and Connect Four), minimax keeping a won position, reproducible agents, deterministic MCTS, legal random moves, no agent changing the board, and searching agents taking a win in one and blocking a loss in one.

Open:

1. **"A real Connect Four program would use a much stronger evaluation and deeper search"** (arena page). A general statement about practice.
2. **"Good moves first lets alpha-beta cut more"** (game tree page): true in general; not measured here for other orders.
3. **"MCTS win rates ... come from random playouts, which play much worse than either player"** (arena mistakes): a judgement about random playouts.
4. **"Saying a deeper search always plays better"** marked as a mistake (arena): the page does not measure depth against results; the round robin lets a visitor try it.
5. **Round robin wording**: "These are measured results for these settings, not a general ranking" (arena). No ranking is stated anywhere.
6. **Time-sliced search**: the compare page reports computing time with slices summed; it can differ from wall-clock time while the page stays responsive.
