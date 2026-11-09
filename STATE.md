# State

Read first after any break: this file, `ARCHITECTURE.md`, `DECISIONS.md`, `docs/NEXT_SECTIONS_BRIEF.md`, then the current section's `sections/<name>/SPEC.md`.

## Now

- Branch: `next-2` (from `main` after section 1 was merged). Never push to `main`.
- Sections 2 (Networking), 3 (Logic) and 4 (AI) are built and pass `npm run verify:full`. Waiting for the owner's batch review.
- Reports: `sections/networking/REPORT.md`, `sections/logic/REPORT.md`, `sections/ai/REPORT.md`, and `RELEASE_NOTES_NEXT.md` at the top level.
- Screenshots: branch `review-shots`, folders `memory/`, `networking/`, `logic/`, `ai/`.

## Waiting on the owner

- **CSP change for the AI section (STOP item):** add `worker-src 'self'` to the CSP in `src/static/_headers` so searches can run in a Web Worker. Until approved, searches run time-sliced on the main thread (`src/js/ui/ai/runner.mjs`, the only file a switch would change).
- Batch review of sections 2 to 4, then the owner merges `next-2` into `main`.

## Section 1 review fixes (done on `next-2`)

Wrapping, auto-growing reference field; step columns that fit 20 references at 1440 px with a scroll cue beyond; the small-screen dock only over the stage; "14 of 20 (70%)"; `verify:quick` and `verify:full`; the preview-only analytics note in the README.

## Next steps after the review

Fix anything blocking on `next-2`. If the worker change is approved, move `runner.mjs` to a worker and add `worker-src 'self'`.
