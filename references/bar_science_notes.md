# Bar meaning and source notes

This file distinguishes encoded data from illustrative patterns. It does not grant brand approval.

## Shared mark geometry

- The complete supplied `assets/images/RPI Logo.svg` is the geometry source, uniformly scaled by 0.5. Width is 250, letter bottom is 111.4885, bar top is 132.4885, design height is 18, and the fixed gap is 21. Complete painted bounds are 250 × 150.4885. The original solid path retains its rounded source height of 17.9995.
- Except for the owner-corrected Ruler composition, every valid bar must paint both nominal horizontal edges and remain within the bar rectangle. This is the owner's October 27 requirement. Clips and empty containers do not count as paint. Static geometric artwork may use a single stroke-aware horizontal fit; scientific domains and nested artwork viewports retain their coordinates.
- Export clear space is 20 reference units at every scale. Standard PNG/GIF uses a 1000 px mark on a transparent 1160 × 762 canvas with 80 px side padding; Large uses a 2000 px mark on 2320 × 1524 with 160 px padding. SVG retains its 290 × 190.4885 viewBox. Enforce the 0.25-inch print rule at placement size.
- Ruler uses natural ticks without fixed boundary references; natural edge whitespace is accepted. Ticker retains fixed references, no wider than one ordinary tick or one reference unit. Interior coordinates and phase stay unchanged. Waveform retains its sample coordinates and adds a one-unit zero baseline. Numeric references preserve empty leading/trailing digit cells; zero-ink data blocks export with recovery guidance rather than inventing encoded paint. Neural endpoint circles are tangent to the edges.
- Clipboard SVG/PNG uses the same frozen export snapshot and coordinates. PNG retains alpha. Neither changes bar math, phase or geometry. Native SVG clipboard content uses the same standalone vector document as SVG download; unsupported browsers offer the separate download without a text or raster substitute.
- Main static preview, header, SVG and PNG use one current-control collector. Circle packing uses the shared seed in both generation and cache identity, including same-page share-history restoration. No per-frame spatial normalization is used.
- Artemis retains original vector paths and nested source clipping. Its white source maps the actual 2083.3335-unit painted width rather than the padded 2084 frame. Live preview uses one projected SVG overlay; raster exports draw paths directly. It remains supplied illustration, not telemetry; permissions and formal approval remain unresolved.

## Required painted extent

Except for Ruler, the owner requires actual painted artwork to reach both exact nominal horizontal edges of the official bar area, while all strokes and fills remain inside it. A container or clip rectangle alone proves containment, not edge contact. Preserve the official 500 × 36 proportions, fixed placement, letterforms and letter-to-bar gap; do not add visible side padding to satisfy a bounds check. Floating-point tolerance is for numerical verification only.

The owner explicitly corrected Ruler on October 27: remove forced end caps and allow natural edge whitespace. Its fixed viewport, clipping, placement and rhythm remain exact; never stretch or shift a frame to force edge contact. This narrow correction supersedes the earlier strict painted-edge interpretation for Ruler only.

Apply the remaining painted-edge requirement to every other family, variant and relevant animation phase in the main preview, header and supported SVG, PNG and GIF exports. It is an implementation requirement, not a claim of complete validation or formal RPI approval.

## Encoded and measurement-inspired styles

| Style | Meaning and current assumption |
| --- | --- |
| Binary | Encodes up to 100 input Unicode characters as UTF-8 bytes, most-significant bit first. Offensive text is masked before encoding. |
| Morse | Uses International Morse symbols for A–Z, digits, and supported punctuation. Dots are one time unit, dashes three, element gaps one, letter gaps three, and word gaps seven. Accents are transliterated to base letters; unsupported characters are omitted. |
| Fibonacci Sequence | Segment widths follow consecutive values `34, 21, 13, 8, 5, 3, 2, 1` in descending order. Gaps separate the values visually. |
| Ruler | Evenly spaced visual ticks; a major tick occurs at each selected unit division. It is an illustrative scale, not a calibrated physical ruler. |
| Numeric | Visualizes digits supplied by the user or generated from the selected formula. It does not claim to measure an external quantity. |
| Waveform | Synthetic waveform based on the selected controls. It is not a recording or measured signal. |
| Ticker | Repeating visual ticks with configurable ratios. It is not tied to a physical time or length unit. |
| Neural Network | Untrained feedforward model with computed weighted sums, tanh/sigmoid activation and deterministic dense or local connections. Ring centers encode activation area; dashed edges indicate negative weights. See [model, sources and limits](neural_network_model.md). |
| Artemis II | The splashdown counter uses April 10, 2026, 8:07 p.m. EDT, matching [NASA's splashdown record](https://www.nasa.gov/gallery/artemis-ii-splashdown-and-recovery/). The bar artwork is a supplied project asset, not mission telemetry. |

The other selectable styles—Solid, Circles, Circles Gradient, Gradient, Grid, Lines, Point Connect, Triangle Grid, Triangles, Union, and Runway—are geometric or supplied artwork patterns. Their names describe visual motifs; they do not assert a measured dataset. Runway and Artemis II still need owner approval for the proposed lockups, as do the secondary logo colors.

## Live motion timing: October 27, 2026

Live motion advances a continuous cycle phase from browser frame timestamps. Speed changes adjust the next phase step; they do not rescale all elapsed time. Reverse changes direction without changing the current pattern position. Pause and resume keep the phase.

The p5 render ceiling is 1000 FPS so the browser's requestAnimationFrame cadence can drive the preview on displays above 120 Hz. This is a scheduling ceiling, not a claim that a device renders at 1000 FPS or sustains its display refresh rate under load. The header uses the same phase and draw callback as the preview, with persistent official SVG letters and a separate clipped bar canvas rendered through a 4× downsampling buffer. Pause/play preserves those surfaces. The full-screen ASCII overlay pauses background preview drawing and phase advancement while open.

Each live phase step is at most one quarter of the smallest repeating tick interval: one cycle divided by the ruler unit count or ticker count ratio. Waveform uses one whole temporal cycle. A slow or delayed frame can therefore reduce live speed to avoid temporal aliasing that appears as reverse motion. This is a visual sampling limit, not a measurement of a physical signal. It cannot remove every perceptual artifact from very dense patterns at small display sizes.

Waveform preview, header, and SVG output now use the same waveform function, including the sine phase origin at the lower bar edge. The former SVG sine origin differed by one quarter cycle. The GIF loop-planning algorithm is retained, with the family rate caps below; encoded frame-rate limits can still produce temporal aliasing at dense settings. Exported SVG/PNG images are static snapshots of the current phase. Native display cadence still needs checks on physical high-refresh hardware.

### Navigation artwork capture

Navigation briefly holds live phase and decorative marquee movement while the captured artwork prints. It resumes from the held position without catching up elapsed presentation time. Interaction cancels the reveal immediately. This presentation hold does not change the bar geometry, model parameters or export calculations.

### Small header sampling and display-rate limits

The tiny header keeps vector letters separate from its supersampled moving bar.
The former unresolved Ticker row-average fill is removed; selected geometry,
phase and boundary references remain shared with main/export output. There is no
per-frame spatial fitting or independent header clock. Exact letter-pixel checks
and persistent nodes are software evidence, not a physical-display flicker-free
guarantee.

Ruler speed is0.2–0.6 major repeats/display second (default0.3), Ticker is0.2–0.8
top-row repeats/display second (default0.4), and Waveform is0.2–1 temporal
cycles/display second (default0.3), all in0.1steps. At the densest controls, caps
bound local tick crossings to6/s and4/s for Ruler and Ticker. These are design
choices, not universal flash-safety thresholds. One normalizer governs native
controls, Reset/Randomize, URL/share migration, runtime and GIF planning. Only
the three known legacy speed fields are migrated before strict share validation;
unrelated invalid controls still reject. See [motion rendering](motion_rendering.md).

## Viewport-relative inspection zoom

The preview uses the complete 250 × 150.4885-unit mark bounds, including its bar, to calculate a uniform fitted scale from the actual canvas size. Padding and the zoom control area are excluded. The letterforms, bar proportions, and spacing are unchanged. There is no separate wide-screen size cap.

100% means the fitted baseline for the current viewport. 400% means four times that fitted scale. Values below 100% are not offered because this control is for inspecting detail; Fit already shows the complete mark. The same percentage can produce a different CSS-pixel width after a viewport resize. It is not a print size, DPI, export scale, or guarantee that a complex pattern is legible at its final placement size.

Button zoom keeps the bar as the inspection focus. Pointer zoom uses the pointer location, subject to the view's pan bounds. Fit recenters the full mark; touch pinch over the artwork zooms the viewer around the two-finger centroid, while native page pinch remains available outside the viewer. Browser keyboard zoom remains available. Touch panning and pinch are clamped to the same inspection bounds; cancellation, layout resize, and orientation changes clear gesture state. Preview zoom and pan do not enter the SVG, PNG, or GIF export transforms. Local SVG/PNG comparison at 100% and 400% produced identical files for Solid.

## Configurable geometric patterns: October 27, 2026

- **Triangles:** Each of 6–28 equal-width cells is split along one diagonal with a single filled half. Four orientations reflect the same cells horizontally and/or vertically, preserving count and spacing. Default: 14 cells, Down right. The October 28 selector refinement removes the redundant variant control and new variant URL/share/filename fields. Historical variant 2 state maps to the opposite direction (Down right ↔ Up left; Up right ↔ Down left), preserving its painted geometry. The low-level complementary geometry remains available for historical consumers and regression checks. Direction order is Down right, Up right, Up left, Down left. Legacy `up` and `down` mean Up right and Down right respectively. Explicit directions remain explicit in query URLs, including the default direction. The count interval is an app control range, not an official universal minimum-size rule. Parameter changes redraw immediately; there is no new animation phase or measured physical quantity.
- **Lines:** 20 or 32 equally spaced strokes sample a static standing-wave height envelope, `barHeight × (0.35 + 0.65 × abs(cos(3πt)))`. The first/last strokes paint the exact boundaries. This is an illustrative geometric system, not an observed signal.
- **Gradient:** Apparent tone uses area coverage in one foreground color. Variant 1 linearly tapers full-height stripe widths; variant 2 uses three rows with a symmetric triangular coverage envelope. There is no opacity or color interpolation. The existing Gradient name/treatment still needs owner review against the dated Pattern restriction.
- **Circles Gradient:** Variant 1 uses three rows with radius factors 1, .72, .46. Variant 2 increases circle area linearly left to right in two rows; variant 3 has symmetric triangular area coverage strongest at the center in three rows. Radii are bounded by row/cell dimensions. Every row shares the same column centers, so vertical columns remain upright; the largest endpoint circles are tangent to the exact left/right edges. Smaller endpoint dots retain their radius and sit inside those edges rather than shifting sideways. These are geometric patterns, not external datasets.

The configurable static families above paint both horizontal boundaries within the canonical bar. The combined renderer uses the complete official vector basis and one selected-control collector for header/preview/SVG/PNG across all static families, superseding the isolated four-family export bypass. Exports capture controls, color, phase, title and Standard/Large size before asynchronous work begins. PNG rasterizes that captured vector; GIF streams captured frames with true palette transparency and disposal2. GIF uses binary alpha with coverage dithering, so PNG/SVG remain the smooth-alpha alternatives. See [transparent exports](transparent_gif_exports.md) for timing, streaming memory budgets, measured benchmarks and limits.

The combined development checkout includes the revised single Quantum projection model from `ac06247`, `b4288ba`, and `c25cfa5`. It graphs three phase-convention-dependent projections of one normalized free-particle wavefunction on an ideal periodic ring, using modes −4,3,7 with equal coefficient magnitude1/√3. The fixed amplitude bound√3 maps to height; it never uses sampled-peak fitting. A recurrence takes120display seconds at1×, SPEED0.2–1 uniformly scales time, and REVERSE evaluates earlier model time. Display seconds have no physical calibration because mass/circumference are unspecified. The curves are not particles, literal trajectories, probabilities or measured data. See [model, equations, sources and limits](quantum_model.md).

Quantum uses the immediate native renderer for main preview and the same phase/polygons in header/SVG/captured PNG; preview bypasses asynchronous static snapshots. Shared restore pauses transport even for older LOOP=true state, drops obsolete density-view fields and retains phase. Same-page legacy-query restoration uses the bounded model normalizers. Phase edits preserve the explicit LOOP selection and temporarily hold model time during pointer drags or numeric editing; playback resumes from the selected phase without catch-up. Quantum GIF export is unavailable. Header rendering and navigation entrance policies are documented separately; no model or brand approval is inferred from software tests.

## Inspection snapshot bounds — October 28, 2026

Static live bars rasterize the shared clipped SVG at the requested inspection resolution, bounded by the active WebGL renderer's `MAX_TEXTURE_SIZE`. The pixel width rounds down at the hardware limit to a multiple of 125, preserving the exact 250:18 (125:9) aspect ratio with integer dimensions. The canonical geometry, stroke widths, clipping and zoom transform remain unchanged. This prevents an oversized GPU texture upload from replacing the pattern with an opaque black rectangle on large/high-DPI views. The 2D fallback, vector header, SVG and transparent PNG/GIF export resolutions are independent of that live texture bound. At extreme zoom the hardware-bounded bitmap may be less sharp than an unconstrained vector; it retains the actual pattern and negative space.

## Circle containment repair — October 28, 2026

Circles packing radii now describe the complete outer painted radius. Each generated or fallback circle is bounded geometrically before rendering. Stroke paths subtract half of their centered stroke width from that radius, equivalent to an inside stroke; tiny circles use at most their outer radius as stroke width to retain a positive path radius. When stroke width equals the outer radius, the centered stroke reaches the center; very small stroked circles can therefore appear as dots. Filled circles keep their complete outer radius. The two extreme circles are moved to exact left/right tangency, avoiding horizontal stretching, ellipses, forced boundary blocks or visibly clipped arcs. Packing may gain minor overlaps where formerly overflowing circles are moved inward. This geometric pattern does not claim physical non-overlapping disk packing.

Circles Gradient shares column centers across all rows, including variant 1's shrinking radii. This retains the vertical area progression while keeping columns straight; smaller dots no longer touch each horizontal edge independently. All variants stay inside the official 250 × 18 viewport, at the fixed official bar placement. Preview/header/SVG/PNG use the shared geometry and inspection zoom does not change exports. The outer clip remains a defensive viewport, not the means of trimming circles. Existing gradient brand-review questions remain unresolved.

## Numeric source separation — October 28, 2026

Numeric uses mutually exclusive decimal-entry and curated-formula modes. Only digits and the decimal point are encoded; an optional sign is not. Presets encode the explicitly displayed finite decimal approximation of π, e, φ, √2, √3, 2π, 1/√2 or ln(2), rather than a sampled physical signal or formula graph. The eight examples are familiar mathematical/engineering relationships, not officially endorsed RPI formulas or a popularity ranking. Empty/transient decimal edits produce no pattern instead of substituting π. Preview/header/SVG/PNG resolve one selected source, and exports retain the captured decimal. See [sources, bounds, UI and historical migration](numeric_modes.md). Existing geometry, encoding and zero-ink recovery remain unchanged.

## Neural Network redesign — October 28, 2026

The network now computes an explicit forward pass with configurable depth, width,
connectivity, activation, input mix and deterministic weight sets. Complete node
rings include stroke-aware vertical padding and retain natural horizontal edge
contact. Preview/header/static exports share one graph and visual encoding.
There is no training or animated biological-flow claim. See
[Neural Network model](neural_network_model.md) for equations and limitations.
