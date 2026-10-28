# Neural Network review evidence

October 28, 2026, local Playwright Chromium and WebKit on macOS; real HTTP server
on a distinct localhost port, unmodified local production scripts. All screenshots
reuse the repository's configured assets; no external artwork was introduced.

- [Desktop default](desktop-default.png): three hidden layers, three units per
  layer, dense connections, tanh, input 65%, weight set 1. Captured at 1440 × 1000,
  reduced motion, DPR 1; inspected for composition, whole rings and control state.
- [Actual-size themes](actual-size-themes.png): each SVG is exactly 250 × 18 CSS
  pixels, DPR 1. Columns are shallow (1 hidden layer / 2 units), default (3 / 3)
  and deep (5 / 5). Primary and legacy secondary foregrounds are shown. The
  complex configuration is visibly denser; tiny header size cannot communicate
  every numeric value. This does not establish a new universal minimum size or
  approval of secondary colors.
- [Phone controls](mobile-controls.png) and [model disclosure](mobile-explanation.png) are captured by the smoke script
  at 390 × 844 with actual emulated touch. Additional 320px and landscape checks
  verify control scrolling and no document-width overflow. These checks do not
  substitute for physical touch devices or native OS pickers.

`node scripts/neuralNetworkSmoke.js` and `RPI_BROWSER=webkit node
scripts/neuralNetworkSmoke.js` passed. Each engine covers 28 combinations of seven
themes and depth/width extrema, exact shared-link and plain-query SVG restoration
(including zero input), explicit legacy layers with missing new fields, native
range keyboard input, custom-select keyboard access, numeric entry, touch ranges,
Reset/Randomize, Fit/400% SVG and PNG identity, decoded PNG bounds, motion-preference
changes and 2D fallback. Local temporary evidence is in
`/tmp/neural-network-chromium` and `/tmp/neural-network-webkit`; `results.json`
records the geometry measurements. Both report x=80…1079 and zero out-of-domain
paint in a decoded 1160 × 762 PNG. WebGL and 2D generate identical SVG documents.

Header SVG and the canonical SVG-raster bar use identical primitives. Their
raster comparison includes fractional vertical placement: maximum mean alpha
difference across the tested bar was 3.6232/255 in Chromium and 3.2542/255 in
WebKit. This is reported as sampling agreement, not pixel equality. Downloaded
Fit and 400% PNG bytes are identical within each engine. No GIF is offered for
this static model.

The unit suite passes 329 tests in 34 suites. The new model tests independently
recompute incoming weighted sums and activations, check area mapping, sparse
connectedness and retained dense weights, deterministic seeds and input edits,
and 320 parameter combinations with stroke-inclusive bounds.

Manual screen-reader review, the Safari app, physical devices, low-power
performance, final-size user acceptance, asset clearance and formal RPI approval
remain unverified. No merge or deployment is included in this evidence.
