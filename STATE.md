# State

Read first after any break: this file, `ARCHITECTURE.md`, `DECISIONS.md`, `docs/NEXT_SECTIONS_BRIEF.md`, then the current section's `sections/<name>/SPEC.md`.

## Now

- Branch: `next-2` (from `main` after section 1 was merged). Never push to `main`.
- Sections 2 (Networking), 3 (Logic) and 4 (AI) are built and pass `npm run verify:full`. Waiting for the owner's batch review.
- Reports: `sections/networking/REPORT.md`, `sections/logic/REPORT.md`, `sections/ai/REPORT.md`, and `RELEASE_NOTES_NEXT.md` at the top level.
- Screenshots: branch `review-shots`, folders `memory/`, `networking/`, `logic/`, `ai/`.

## To do on the next quiet machine

- Rerun `npm run verify:full`: the frame-time gate after the worker change was blocked by machine load (see RELEASE_NOTES_NEXT.md).

## Waiting on the owner

- Batch review of sections 2 to 4, then the owner merges `next-2` into `main`.
- The AI worker CSP changes (`worker-src 'self'`, `trusted-types trace-worker`) were approved and are in.

## Section 1 review fixes (done on `next-2`)

Wrapping, auto-growing reference field; step columns that fit 20 references at 1440 px with a scroll cue beyond; the small-screen dock only over the stage; "14 of 20 (70%)"; `verify:quick` and `verify:full`; the preview-only analytics note in the README.

## Next steps after the review

Fix anything blocking on `next-2`.
