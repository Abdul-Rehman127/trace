# Trace architecture

Read with `STATE.md` (where the work stands), `DECISIONS.md` (why things are the way they are) and the current section's `sections/<name>/SPEC.md`.

## Build and serving

- `build.mjs` is the static site generator. One page per entry in `src/pages.mjs`. Templates in `src/templates/*.html` use `{{x}}` (escaped) and `{{{x}}}` (trusted build-time HTML). CSS files (in `CSS_ORDER`) are concatenated and minified; `src/js/main.mjs` is bundled by esbuild. Both get a content hash. `dist/_headers` carries the CSP with the inline theme script's hash.
- The build refuses any inline style, any script other than the module, JSON-LD and the hashed theme script, and any inline event handler (`checkCsp`).
- `dev.mjs` serves `dist/` with the real headers. `--allow-http` strips `upgrade-insecure-requests` for local WebKit.
- Cloudflare Pages runs `node tests/run.mjs && node build.mjs`. Production builds (`CF_PAGES=1`) add the analytics beacon tag.

## Source layout

```
src/pages.mjs                  page list: slug, template, section, title, description, h1, key
src/templates/                 layout, per-template HTML, build-time data modules
  parts.mjs                    scheduling tool data; shared selector(page, links), transportHtml(), fill()
  memory.mjs                   page replacement template data and worked examples
  toolbuttons.mjs              home and 404 icon buttons; HUB_SECTIONS lists the built sections
  pagedata.mjs                 per-page values (email subject, examples, numbers quoted in copy)
src/content/<key>.html         written content under each tool; numbers come from pagedata
src/content/<section>/needs-verification.md
src/js/engine/                 pure logic, no DOM, tested in Node
  scheduling.mjs ...           CPU scheduling (section 1)
  memory/                      page replacement: paging, validate, share, presets, narrate,
                               table (step table node tree), views (results and compare trees)
src/js/ui/                     browser code
  controls.mjs                 the shared player (one rAF clock, glide, hidden-tab freeze) and transport
  keys.mjs, log.mjs, theme.mjs, dom.mjs   shared by every simulator
  app.mjs, timeline.mjs, ...   CPU scheduling UI
  memory/                      page replacement UI: paging-app, paging-inputs, paging-compare
src/css/                       tokens, base, components, tool, content, memory
tests/                         fast Node tests (the deploy gate): run.mjs lists the files
e2e/                           Playwright, its own package; never installed by Cloudflare
scripts/                       verify, content-lint, lighthouse, section-review, live checks
sections/<name>/               SPEC.md, REPORT.md, content-review.md per section
```

## Shared patterns a new section reuses

- **Engine first.** Pure modules under `src/js/engine/<section>/` with golden cases, a separate oracle in `tests/`, property tests, validation and share-link fuzz tests. Add the test file to `tests/run.mjs`.
- **Node trees.** Anything drawn both at build time and in the browser is built once as a `{ t, a, c }` tree in the engine (`memory/table.mjs`, `memory/views.mjs`). The build serializes it with `treeToHtml`; the browser uses `fromTree` from `ui/dom.mjs`. No innerHTML anywhere.
- **Player.** `createPlayer` from `ui/controls.mjs` owns all motion: one requestAnimationFrame loop, glides, speed, and freezing when the tab is hidden. A section reacts in `onUnit(k)` and, if it needs per-frame drawing, `onFrame(t)`. Loading new input goes through `player.load()`, which stops playback and resets to 0.
- **Transport and keys.** `transportHtml(label)` in templates, `bindTransport` and `bindKeys` in the browser.
- **Decision log.** `createLog(root, { onPick }).setMoments(moments, narrate, label)`.
- **Narration.** Sentences are arrays of strings and `{ pid }` parts (bold). The narration box is sized at build time by invisible sizers holding the longest possible text.
- **Selector.** `selector(page, links)` renders the algorithm buttons (overview, in place) or links (other pages).
- **Share links.** Query string, decoded without throwing, with notices for anything dropped.
- **Hub.** Add the section to `HUB_SECTIONS` and its buttons to `TOOL_BUTTONS` in `toolbuttons.mjs`. Only built sections appear.

## Quality gates

`npm run verify` (scripts/verify.mjs): fast tests and contrast, build, content lint, browser tests on Chromium and WebKit, frame times, Lighthouse mobile on every page. See `docs/NEXT_SECTIONS_BRIEF.md` part 3.
