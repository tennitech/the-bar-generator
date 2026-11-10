# Export composition schematic QA

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
