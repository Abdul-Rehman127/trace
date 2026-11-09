# State

Read first after any break: this file, `ARCHITECTURE.md`, `DECISIONS.md`, `docs/NEXT_SECTIONS_BRIEF.md`, then the current section's `sections/<name>/SPEC.md`.

## Now

- Branch: `next` (never push unreviewed sections to `main`).
- Current section: **1. Memory (page replacement), done, waiting for the owner's review.** The brief says to stop after this calibration section until the review result comes back.
- Report: `sections/memory/REPORT.md`. Screenshots: branch `review-shots`, folder `memory/`.

## Gates for the memory section (last full `npm run verify`: all 6 passed, 8.1 min)

- [x] Engine tests (golden, oracle, properties, validation, share fuzz, narration, copy claims)
- [x] Content lint
- [x] Contrast (tokens test, both themes, every state)
- [x] Browser tests, Chromium and WebKit (246 pass)
- [x] Lighthouse mobile, 15 of 15 pages
- [x] Frame time (memory heavy p95 16.8 ms)

## Next steps

1. Wait for the review of the memory section. Fix blocking issues on `next`.
2. If there is nothing blocking: Networking (5.2). Write `sections/networking/SPEC.md` first, with the subnet goldens from the brief and a hand-verified VLSM case.
3. Then Logic (5.3), then AI (5.4). AI needs `worker-src 'self'`: STOP and ask with the exact CSP change before using a worker; build behind a time-sliced main-thread loop until then.
4. At the end: `RELEASE_NOTES_NEXT.md`, one short message to the owner.

## Open questions (owner)

- Lighthouse via pinned `npx` in verify: dependency or not?
- `font-display` swap or optional for body text (from Checkpoint D).
- Section landing pages (`/memory/`, `/networking/`) once there are two or more tool families?
- Preview-only CSP console error from Cloudflare's own injected analytics snippet on `*.pages.dev`: leave it, or allow the host?
