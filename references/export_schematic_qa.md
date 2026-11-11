# Export composition schematic QA

## November 11 letter-and-dash refinement

Final reconciliation preserves trackpad release #181 and Ring release #182
(current main `ae61c62530f43dae6a90439300fbd9819a8fe3cb`).

The current owner reference `libfile_02418cf7d0348191b26f25349e005d79` was
materialized through the current Library skill, identity verified and its actual
pixels inspected before edits. Screenshot 2026-11-11 at 10.20.33 AM.png is
646 × 468 RGBA, 52,035 bytes, SHA-256
`1891599c7eb599408b19df16cf2013320d60617ed2a47a844ca35b95399df940`.
It shows the two Export composition cards: solid RPI letters above a dashed bar
in Bar + RPI, and a dashed strip in Bar only. The follow-up request asks for an
intentional dash treatment rather than mechanical symmetry.

The letters now use the same diagram-only outline treatment as the bar. Candidate
A used equal 3/3 butt-ended dashes; B uses 4.5/2.5 rounded dashes, a 1.25 phase
shift and 0.9 non-scaling width; C uses a busier 5/2.5/1/2.5 long-short rhythm.
B was selected after inspecting light/dark 108 × 68 and narrower 88 × 68 diagrams:
it retains the letter shapes with fewer choppy interruptions and avoids forced
per-letter symmetry. The same chosen attributes are shared by letter and bar
paths, keeping the two cards coherent.

`review-images/export-schematic/letter-dash-comparison.png` records the three
source-path candidates at actual small pixel sizes plus enlarged detail. The
native SVG rasterizer did not reproduce non-scaling stroke behavior faithfully,
so the comparison uses the existing optional native Canvas renderer with the
official paths and inverse-scale stroke/dash values. This explicitly models
screen-space non-scaling guides; it is not a browser screenshot or a claim of
native SVG/browser parity. Only project vectors and generic labels are present.
No font file, external graphic, new runtime asset or dependency is introduced.

Actual initializer output is checked for unchanged path data/viewports, three
letter paths only in the complete-mark schematic, and one bar path in each card.
The official geometry, real export renderer/options, CSS and radio markup are
compared unchanged. All 53 focused export/radio/cache checks pass in four suites. The complete
initial-base suite passes 1,093 tests in 94 suites with the established 768 MB
Node heap. JavaScript and all 81 inline scripts parse; exact source comparisons
confirm real geometry/artwork/export/clipboard/GIF, CSS and radio markup are
unchanged. After preserving #181/#182, 97 focused combined checks pass in seven suites.
No unit-test count expansion is added for this reversible change.

The exact target is `export-composition-preview-logo`, with the bar guide in
`export-composition-preview-bar` sharing the refined rhythm. Real live/header
logos and SVG/PNG/GIF/clipboard artwork keep their original filled letter paths.
The schematic wrappers stay aria-hidden and native radio keyboard/checked/disabled
behavior, focus styles, captions and export dimensions are preserved.

The reference PNG remains local evidence. Browser/native interaction, responsive
card appearance, forced colors and screen-reader behavior remain unverified under
the established restrictions. No denied browser/live-network route is retried.
CI, tested/merged tree and Pages deployment are verified independently.

The older record and comparison below describe the earlier bar-only correction.


November 10, 2026. Isolated branch `codex/fix-export-composition-schematic`
starts at main `0bb131dee9c383d769d0bf5ff3fe396ce3d79bca` (includes #167).
No duplicate open PR existed at the start. Existing feature worktrees are retained.

Only the decorative bar path in each choice card changes: no fill, a one-pixel
non-scaling currentColor stroke, and a three-pixel dash/gap. Official letter paths,
viewport, layout, radio inputs, focus/checked styles, labels and descriptions
remain unchanged. Control ink comes from the existing neutral surface/text
tokens rather than the selected artwork ink or background. No live preview,
new runtime asset, export renderer, export options or captured artwork changes.

Cache references for exportUi, the shell and 25 routed generator pages advance
together. The original brand source record and unresolved permissions remain
in `rpi_brand_guidelines.md` and `asset_licensing.md`; this schematic is a UI
composition guide, not a new outlined logo or a brand approval claim.

## Checks

- Focused existing export suites: 51 tests pass in three suites.
- Both changed JavaScript files and all 84 HTML inline scripts parse.
- Whitespace checks pass. CSS, radio markup, export renderer, options and
  official geometry have no source diff.
- Full regression: **1,049 tests pass in 91 suites** with a 768 MB Node heap:
  `node --max-old-space-size=768 ../the-bar-generator/node_modules/jest/bin/jest.js --runInBand --no-cache`.
  Log: `/tmp/export-schematic-unit.log`. An earlier run caught the missing Home
  prefetch reference (corrected); a subsequent unbounded-heap run was killed
  by the environment. The final complete run passes.
- No tests were added for this reversible decorative-only change. Existing
  composition, export and shell-cache regression coverage was exercised.


## Review image and limits

`review-images/export-schematic/diagram-comparison.png` is an original offline
rendering of the actual old/new initializer output at a small diagram size,
using the environment's pre-existing optional @napi-rs/canvas renderer. It shows
both compositions on light/dark surfaces and was visually inspected. It contains
only existing project vectors and generic before/after labels. No external image,
new font or runtime asset is introduced; existing identity permission questions
remain open.

This is a source-derived diagram comparison, **not a screenshot of the full
card UI**. It cannot prove browser support for non-scaling strokes, responsive
layout, native keyboard focus, forced colors or screen-reader behavior. Existing
radio behavior and composition/export regression checks remain automated proof
only. Prior browser-launch restrictions were respected; no denied browser action
was repeated. Physical-device and native assistive-technology acceptance remain
unverified. No new motion was added.
