# Trace: content review, ai section

Generated from the built pages by scripts/section-review.mjs. Interactive parts are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content under the tool.

---

## Page: /ai/game-tree/

- Title: Minimax and Alpha-Beta Game Tree Explorer | Trace
- Description (156 characters): Step through minimax and alpha-beta on Tic-tac-toe: the position being searched, every value, the branches cut and a live count of positions examined. Free.
- Written content: 523 words

### H1: Game tree explorer

Pick a Tic-tac-toe position and step through minimax or alpha-beta: every position examined, every value, every branch cut.

[Game tree](/ai/game-tree/) / [Connect Four](/ai/connect-four/) / [Compare agents](/ai/compare/)

#### Position

Click an empty square to play the next move, or pick a starting position. Positions with up to 7 empty squares can be stepped through.

X / / / / O / / X / /

SearchMinimax looks at every move to the end of the game.
Minimax / Alpha-beta

X to win
Block or lose
Opening reply
Late game

Copy link

Copy this link

0.5x
1x
2x
4x

1x
step0of 1854

Position being looked at
XOX

Positions examined0Branches cut0
First moves and their values

- Square 2not settled yet
- Square 3not settled yet
- Square 4not settled yet
- Square 6not settled yet
- Square 8not settled yet
- Square 9not settled yet

What the search is doing

Start at the position on the board. **O** is to move and wants the best value for itself.

Alpha-beta cuts this branch: the value found so far already makes this position no better for the player choosing above it than an option checked earlier (alpha 0 ≥ beta 0). Skipped: square 5, square 7, square 8, square 9.

Alpha-beta cuts this branch: the value found so far already makes this position no better for the player choosing above it than an option checked earlier (alpha -1 ≥ beta -1). Skipped: square 6, square 8, square 9.

Alpha-beta cuts this branch: the value found so far already makes this position no better for the player choosing above it than an option checked earlier (alpha 1 ≥ beta -1). Skipped: square 6, square 8, square 9.

#### Both searches on this position

Value with best play0 (draw)Best movesquare 4Minimax examined927 positionsAlpha-beta examined189 positions

#### How minimax searches a game tree

A game like Tic-tac-toe can be drawn as a tree: the current position at the root, one branch for every legal move, and so on until each line of play ends in a win, a loss or a draw. Minimax gives every finished game a value (here +1 when X wins, 0 for a draw, &minus;1 when O wins) and works backwards. At a position where X is to move, the value is the highest value among its moves; where O is to move, it is the lowest. The value at the root says what happens if both players play perfectly, and the move that achieves it is the best move.

Counting every position in the full tree from the empty board, with play stopping at a win or a full board, gives 549,946 positions including the root. That number is computed by Trace's engine when the site is built, not copied from anywhere. Minimax from the empty board examines all of them (549,946), and finds that perfect play is a draw.

#### How alpha-beta pruning saves work

Alpha-beta finds exactly the same value and, when moves are tried in the same order, the same best move, but it stops looking at a branch as soon as it is clear the branch cannot change the decision above it. It keeps two numbers while it searches: alpha, the best value the maximizing player (X) is already sure of, and beta, the best value the minimizing player (O) is already sure of. When alpha reaches beta at some position, the remaining moves there are skipped; the explorer shows them as cut.

From the empty board alpha-beta examines 18,297 positions instead of 549,946. On the default position in the explorer, minimax examines 927 positions and alpha-beta 189. How much is saved depends on the order moves are tried in: good moves first lets alpha-beta cut more. Here moves are tried in square order, 1 to 9.

#### Reading the explorer

- The small board shows the position the search is looking at right now; highlighted squares are the moves that led there from the starting position.

- "First moves and their values" fills in as the search finishes each move from the starting position. With alpha-beta, some first moves are marked cut.

- Positions examined counts every position visited, the starting one included. Branches cut counts every move that alpha-beta skipped.

#### Common exam mistakes

- **Taking the maximum at every level.** The players alternate: maximize on your move, minimize on the opponent's.

- **Thinking alpha-beta can give a different answer.** It returns the same value as minimax; it only skips work.

- **Cutting too early.** A branch is cut only when alpha is at least beta, not when a value merely looks bad.

#### Related

- [Connect Four arena](/ai/connect-four/), where depth-limited search meets a real game

- [Compare agents](/ai/compare/) on one position

#### Spotted a mistake?

If a value or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes the position.

Email: abdul at abmans dot com

---

## Page: /ai/connect-four/

- Title: Connect Four AI Arena: Minimax, Alpha-Beta, MCTS | Trace
- Description (147 characters): Watch random, greedy, minimax, alpha-beta and Monte Carlo tree search agents play Connect Four, with every move explained. Play one yourself. Free.
- Written content: 502 words

### H1: Connect Four AI arena

Choose two agents and a seed and watch them play, with the reason for every move. Or play against one yourself.

[Game tree](/ai/game-tree/) / [Connect Four](/ai/connect-four/) / [Compare agents](/ai/compare/)

#### Players

Red (moves first)
Random / Greedy / Minimax / Alpha-beta / MCTS

Yellow
Random / Greedy / Minimax / Alpha-beta / MCTS

SeedAny whole number; the same seed replays the same game

Search depthMinimax and alpha-beta, 1 to 6 moves ahead

MCTS iterations50 to 20,000 random games per move

Play the game
Stop

Copy link

Copy this link

0.5x
1x
2x
4x

1x
move0of 0

1234567

Why this move

Choose two agents and press "Play the game". Then step through the moves; each one comes with the reason it was chosen.

Play against an agent yourself

You play Red against the Yellow agent above. Press start, then drop pieces with the buttons over the board.

Start a game against Yellow

#### Round robin

Every agent plays every other agent twice, once as Red and once as Yellow, with the seeds shown. These are measured results for these settings, not a general ranking.

Run the round robin / Stop

#### Five ways to choose a move

Connect Four is far too big to search to the end the way the Tic-tac-toe explorer does, so every agent here takes a shortcut. They form a ladder, each one using more information than the last:

- **Random** picks any legal column. It is the baseline.

- **Greedy** looks one move ahead: it wins at once if it can, and otherwise picks the move whose resulting position scores best on a simple heuristic.

- **Minimax** searches a fixed number of moves ahead (the depth), assumes both sides choose their best moves by the same heuristic, and backs the values up the tree.

- **Alpha-beta** runs the same search to the same depth with the same move order and gets the same answer, while skipping branches that cannot change it, so it can look at fewer positions.

- **Monte Carlo tree search** does not use the heuristic at all. It plays many quick random games from the current position, steering more of them toward moves that keep winning, and plays the move it tried most.

#### The heuristic, and its limits

These agents use a deliberately simple evaluation. For every line of four cells it adds a point when one side has two pieces and two empty cells, five when it has three and one empty, and takes away the same for the opponent; each piece in the centre column adds three. A real Connect Four program would use a much stronger evaluation and deeper search. The point here is to see how the methods differ, not to build the strongest player.

#### Reading a game

- After "Play the game", step through the moves with the usual controls. Each move shows why it was chosen: the value of every column for the searching agents, or how often each column was tried and how often it won for MCTS.

- The seed fixes every random choice, so the same agents, seed, depth and iterations always replay the same game. Change the seed to see another game.

- The round robin plays every pair of agents twice, swapping colours, and lists every game with its seed. Its table shows what happened with these settings; with other depths, iteration counts or seeds the results can differ.

#### Common exam mistakes

- **Saying a deeper search always plays better.** It sees more, but with a weak heuristic it can still misjudge positions.

- **Treating MCTS win rates as probabilities of winning the real game.** They come from random playouts, which play much worse than either player.

- **Expecting alpha-beta to choose differently from minimax.** At the same depth with the same move order it chooses the same move.

#### Related

- [Game tree explorer](/ai/game-tree/), minimax and alpha-beta step by step on Tic-tac-toe

- [Compare agents](/ai/compare/) on one position

#### Spotted a mistake?

If a move explanation or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes the agents and the seed.

Email: abdul at abmans dot com

---

## Page: /ai/compare/

- Title: Compare Game AI Agents on One Position | Trace
- Description (154 characters): Give one Connect Four position to random, greedy, minimax, alpha-beta and MCTS agents and compare their moves, times and how much work each one did. Free.
- Written content: 259 words

### H1: Compare game AI agents

Give one position to every agent and see what each one chooses, how long it takes and how much it looks at.

[Game tree](/ai/game-tree/) / [Connect Four](/ai/connect-four/) / [Compare agents](/ai/compare/)

#### Position

Moves so farColumn numbers 1 to 7 in the order played, Red first, such as 4435
44433523

Search depth1 to 6

MCTS iterations50 to 20,000

Opening
Threat to block
Midgame
Win available

Copy link

Copy this link

Ask every agent / Stop

#### The position

1234567YellowRedRedYellowRedYellowRedYellow

#### What each agent chooses

| Agent | Column | Time | Work |

| Random | | | |
| Greedy | | | |
| Minimax | | | |
| Alpha-beta | | | |
| MCTS | | | |

#### One position, five agents

This page gives the same Connect Four position to every agent and shows what each one chooses, how long it took in your browser, and how much work it did: the number of positions examined for the searching agents, or the number of random games for Monte Carlo tree search. The agents run one after another without freezing the page, and you can stop them at any time.

#### What to look for

On the default position, at depth 4, minimax examines 2,798 positions and alpha-beta 225, and they choose the same column. That is the point of alpha-beta: the same answer for less work. Raise the depth and both counts grow quickly, which is why real programs combine pruning with good move ordering and a strong evaluation.

Times depend on your device and on what else it is doing, so they vary between runs. The work counts do not: they are the same every time for the same position and settings.

#### Limits

- Depth is capped at 6 and MCTS at 20,000 iterations so a search always finishes in reasonable time on a phone.

- The agents use a simple evaluation function. Their choices show how the methods work, not how strong a carefully built player could be.

#### Related

- [Connect Four arena](/ai/connect-four/)

- [Game tree explorer](/ai/game-tree/)

#### Spotted a mistake?

If a result or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes the position and the settings.

Email: abdul at abmans dot com

---

## Needs verification (AI section)

Every figure on these pages is computed by running the engine at build time (the 549,946 positions, the node counts for both searches, the compare page's counts). Backed by tests in `tests/ai.test.mjs`: the tree count, perfect play drawing, alpha-beta matching minimax in value and move and never examining more nodes (Tic-tac-toe and Connect Four), minimax keeping a won position, reproducible agents, deterministic MCTS, legal random moves, no agent changing the board, and searching agents taking a win in one and blocking a loss in one.

Open:

1. **"A real Connect Four program would use a much stronger evaluation and deeper search"** (arena page). A general statement about practice.
2. **"Good moves first lets alpha-beta cut more"** (game tree page): true in general; not measured here for other orders.
3. **"MCTS win rates ... come from random playouts, which play much worse than either player"** (arena mistakes): a judgement about random playouts.
4. **"Saying a deeper search always plays better"** marked as a mistake (arena): the page does not measure depth against results; the round robin lets a visitor try it.
5. **Round robin wording**: "These are measured results for these settings, not a general ranking" (arena). No ranking is stated anywhere.
6. **Time-sliced search**: the compare page reports computing time with slices summed; it can differ from wall-clock time while the page stays responsive.
