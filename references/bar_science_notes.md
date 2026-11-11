# Bar meaning and source notes

## Current Waveform note model — November 11, 2026

The note redesign supersedes all earlier Waveform frequency/timebase and Pulse
sections below. MIDI 24–84 selects C1–C6 in twelve-tone equal temperament,
A4=440 Hz. Derive `f=440*2^((m−69)/12)` without decimal rounding. Choose integer
`N=round(f/fC1)` and plot the adaptive physical duration `N/f`. C1 is
30.578051463771438 ms per period; its octave Cs fit 1–32 cycles in that span.
Other notes change the window rather than detuning the pitch.

The scope retains actual synthesized Float32 PCM with fractional-sample
endpoints, finite transition settling and truthful live/offline/frozen labels.
Pulse uses a native band-limited, DC-free finite Fourier PeriodicWave. Native
oscillators start together and stop at a scheduled whole-carrier-phase boundary
after a finite release. Sample clocks, Float32 parameters, interpolation and GIF
centisecond delays remain explicitly disclosed numerical/physical limits.
The 61 descriptors and bounded recent PCM/PeriodicWave caches avoid eager
rendering of all configurations. No LFO is restored.

See [equations, phase/pulse conventions, cache policy and primary sources](waveform_notes.md)
and [tests and native export evidence](waveform_notes_qa.md). These define the
current scientific contract; historical sections are retained as change history.

## Historical LFO-removal model — superseded by the note redesign

The owner's “remove the LFO completely” direction supersedes the historical
November 4/10 modulation sections below. Waveform has no LFO controls, graph,
visual clock or saved modulation fields. The carrier graph connects its
normalized crossfade gains directly to the existing master fade/output. Sine,
Sawtooth, Square and Pulse, the C1–C5 mapping, gain scale 0.1, parameter ramps,
Pulse duty and Square fallback remain unchanged.

The scope continues to display actual generated PCM. The physical X window is
exactly four carrier periods before sample-grid quantization: `4 / f`, where
`f = 32.70 + (frequency - 10) / 90 * (523.25 - 32.70)` Hz. Its one-period
triggered sweep takes `1 / SPEED` display seconds, independently of audio pitch.
Each view uses ordered PCM with fractional-sample interpolation. The former
long modulation-envelope view is removed. One second of extrema and ordered
PCM history safely covers the longest supported window plus replay margin.

Pause holds the exact frame. Live edits retain real sample history; stale offline
renders cannot replace newer settings. Exports retain immutable captured PCM,
with the existing wrap/reset disclosure rather than an idealized reconstruction.
Legacy LFO queries/share fields are ignored. See
[current validation](waveform_lfo_removal_qa.md). Earlier sections are historical.


This file distinguishes encoded data from illustrative patterns. It does not grant brand approval.

## Shared mark geometry

- The complete supplied `assets/images/RPI Logo.svg` is the geometry source, uniformly scaled by 0.5. Width is 250, letter bottom is 111.4885, bar top is 132.4885, design height is 18, and the fixed gap is 21. Complete painted bounds are 250 × 150.4885. The original solid path retains its rounded source height of 17.9995.
- The November 3 owner clarification supersedes the earlier strict painted-edge rule. Artwork remains in the fixed bar viewport, but natural whitespace is valid. No artificial boundary paint or painted-bounds fit is added. Scientific domains and nested artwork retain their coordinates.
- Export clear space is 20 reference units at every scale. High-resolution PNG uses a 4096 px mark on a transparent 4752 × 3121 canvas (bar-only: 4752 × 951), with 327.68 px side padding and whole-pixel canvas rounding. Smaller file retains 1000 px artwork on 1160 × 762 / 1160 × 232. GIF separately retains its 2000/1000 px artwork limits. SVG retains its 290 × 190.4885 complete-mark or 290 × 58 bar-only viewport. Scientific coordinates, shape proportions and natural whitespace do not change. Enforce the 0.25-inch print rule at placement size.
- Ruler and Ticker use natural ticks without fixed boundary references. Waveform has no artificial bottom baseline. Numeric preserves empty leading/trailing digit cells without boundary strips; zero-ink data blocks receive export recovery guidance rather than invented paint. Neural endpoint circles retain their natural tangency.
- Clipboard SVG/PNG uses the same frozen export snapshot and coordinates. PNG retains alpha. Neither changes bar math, phase or geometry. Native SVG clipboard content uses the same standalone vector document as SVG download; unsupported browsers offer the separate download without a text or raster substitute.
- Main static preview, header, SVG and PNG use one current-control collector. Circle packing uses the shared seed in both generation and cache identity, including same-page share-history restoration. No per-frame spatial normalization is used.
- Circles now starts and resets with canonical seed 1, making the initial artwork and default Reset state agree. Randomize chooses a different nonzero shareable seed; explicit historical/shared seeds remain unchanged. Returning to a plain query restores seed 1 rather than inheriting a previous shared seed. This is a reproducible initial-condition choice, not a packing/model or geometry change.
- Artemis retains original vector paths and nested source clipping. Its white source maps the actual 2083.3335-unit painted width rather than the padded 2084 frame. Live preview uses one projected SVG overlay; raster exports draw paths directly. It remains supplied illustration, not telemetry; permissions and formal approval remain unresolved.

## Natural painted extent — November 3, 2026

The owner clarified that the fixed viewport is a containment boundary, not a demand to paint every edge. Natural edge contact is retained where the pattern supports it. Natural gaps, including brief gaps during animation, are acceptable and will be reviewed individually. The former forced Ticker sides, Waveform baseline, Numeric sides and generic static edge-fitting pass are removed from preview, header and supported exports.

## Numeric Data Graph — November 11, 2026

Under Construction now includes an available Data Graph experiment. It plots
finite user-entered numbers at equal sample-index spacing, with a shared Y range,
Line/Step/Dots or signed zero-baseline Columns. The supplied sine and exponential
decay values are explicitly rounded mathematical examples, never telemetry.
Constants, invalid input, unequal comparison counts and zero columns have
explicit handling shared by preview and still exports. Historical character-code
links migrate with a legacy disclosure and without old vertical exaggeration.
See [exact mapping, bounds, provenance and review limits](data_graph_model.md).

## Encoded and measurement-inspired styles

| Style | Meaning and current assumption |
| --- | --- |
| Binary | Encodes up to 10 input Unicode code points as UTF-8 bytes, most-significant bit first. Rejected text stays editable but produces no encoded bar in preview or export; shared/query text is masked. |
| Morse | Encodes up to 10 input Unicode code points. Rejected text produces no bar. Uses International Morse symbols for A–Z, digits, and supported punctuation. Dots are one time unit, dashes three, element gaps one, letter gaps three, and word gaps seven. Accents are transliterated to base letters; unsupported characters are omitted. |
| Fibonacci Sequence | Segment widths follow consecutive values `34, 21, 13, 8, 5, 3, 2, 1` in descending order. Gaps separate the values visually. |
| Ruler | REPEATS counts major intervals across the fixed width; DIVISIONS counts equal subdivisions of each interval. Major ticks are full-height, halves 3/4-height, thirds/quarters/fifths 1/2-height, and finer fractions 1/4-height. It is a dimensionless illustrative scale, not a calibrated physical ruler. |
| Numeric | Visualizes digits supplied by the user or generated from the selected formula. It does not claim to measure an external quantity. |
| Waveform | Note-selected synthesized PCM over an adaptive whole-cycle window; A4=440 Hz, 12-TET, C1–C6. Fractional samples are interpolated; this is not an external measurement. |
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
phase and natural tick coordinates remain shared with main/export output. There is no
per-frame spatial fitting or independent header clock. Exact letter-pixel checks
and persistent nodes are software evidence, not a physical-display flicker-free
guarantee.

Ruler speed is0.2–0.6 major repeats/display second (default0.3), Ticker is0.2–0.8
bottom-row repeats/display second (default0.4), and Waveform is0.2–1 temporal
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
- **Circles Gradient:** Variant 1 preserves all 86 circles from `assets/bar references/Style=Circles Gradient 1.svg`: 29 large, 28 staggered medium and 29 small dots, with source radii 8, 6 and 4.5 and the original small coordinate offsets. Its 509 × 36 source frame is uniformly scaled and centered within the caller viewport, retaining complete circles and natural whitespace. Variant 2 increases circle area linearly left to right in two rows; variant 3 has symmetric triangular area coverage strongest at the center in three rows. Radii are bounded by row/cell dimensions. Variants 2 and 3 share the same column centers, so their vertical columns remain upright; the largest endpoint circles are tangent to the exact left/right edges. Smaller endpoint dots retain their radius and sit inside those edges rather than shifting sideways. These are geometric patterns, not external datasets.

The configurable static families retain their natural composition within the canonical viewport. The combined renderer uses the complete official vector basis and one selected-control collector for header/preview/SVG/PNG across all static families, superseding the isolated four-family export bypass. Exports capture controls, color, phase, title and Standard/Large size before asynchronous work begins. PNG rasterizes that captured vector; GIF streams captured frames with true palette transparency and disposal2. GIF uses binary alpha with a uniform half-coverage threshold, so PNG/SVG remain the smooth-alpha alternatives. See [transparent exports](transparent_gif_exports.md) for timing, streaming memory budgets, measured benchmarks and limits.

The combined development checkout includes the revised single Quantum projection model from `ac06247`, `b4288ba`, and `c25cfa5`. It graphs three phase-convention-dependent projections of one normalized free-particle wavefunction on an ideal periodic ring, using modes −4,3,7 with equal coefficient magnitude1/√3. The fixed amplitude bound√3 maps to height; it never uses sampled-peak fitting. A recurrence takes120display seconds at1×, SPEED0.2–4 uniformly scales time. Current main advances model phase by default; REVERSE decreases it. The GIF matches that exact current-model direction. Display seconds have no physical calibration because mass/circumference are unspecified. The curves are not particles, literal trajectories, probabilities or measured data. See [model, equations, sources and limits](quantum_model.md).

Quantum uses the immediate native renderer for main preview and the same phase/polygons in header/SVG/captured PNG; preview bypasses asynchronous static snapshots. Fresh routes and menu selection default to Loop unless reduced motion is requested. Shared restore pauses transport even for older LOOP=true state, drops obsolete density-view fields and retains phase. Same-page legacy-query restoration uses the bounded model normalizers. Phase edits preserve the explicit LOOP selection and temporarily hold model time during pointer drags or numeric editing; playback resumes from the selected phase without catch-up. Particle on a Ring GIF export now captures the exact live phase and model at the natural `120 / SPEED` recurrence with 30 fps centisecond timing. The default 1× natural recurrence is supported with a ring-only 120-second/3600-frame budget and unchanged memory/file guards. Full-logo loops longer than one minute disclose Standard resolution; bar-only retains the selected size. Slower-than-1× loops report the duration limit without altering controls. See [the model and GIF policy](quantum_model.md). Header rendering and navigation entrance policies are documented separately; no model or brand approval is inferred from software tests.

## Inspection snapshot bounds — October 28, 2026

Static live bars rasterize the shared clipped SVG at the requested inspection resolution, bounded by the active WebGL renderer's `MAX_TEXTURE_SIZE`. The pixel width rounds down at the hardware limit to a multiple of 125, preserving the exact 250:18 (125:9) aspect ratio with integer dimensions. The canonical geometry, stroke widths, clipping and zoom transform remain unchanged. This prevents an oversized GPU texture upload from replacing the pattern with an opaque black rectangle on large/high-DPI views. The 2D fallback, vector header, SVG and transparent PNG/GIF export resolutions are independent of that live texture bound. At extreme zoom the hardware-bounded bitmap may be less sharp than an unconstrained vector; it retains the actual pattern and negative space.

## Circle containment repair — October 28, 2026

Circles packing radii now describe the complete outer painted radius. Each generated or fallback circle is bounded geometrically before rendering. Stroke paths subtract half of their centered stroke width from that radius, equivalent to an inside stroke; tiny circles use at most their outer radius as stroke width to retain a positive path radius. When stroke width equals the outer radius, the centered stroke reaches the center; very small stroked circles can therefore appear as dots. Filled circles keep their complete outer radius. The two extreme circles are moved to exact left/right tangency, avoiding horizontal stretching, ellipses, forced boundary blocks or visibly clipped arcs. Packing may gain minor overlaps where formerly overflowing circles are moved inward. This geometric pattern does not claim physical non-overlapping disk packing.

The October 28 repair shared Circles Gradient column centers across all rows. The November 4 issue #56 correction supersedes that arrangement for variant 1, restoring the supplied staggered reference with uniform containment. Variants 2 and 3 still share column centers. This retains the vertical area progression while keeping columns straight; smaller dots no longer touch each horizontal edge independently. All variants stay inside the official 250 × 18 viewport, at the fixed official bar placement. Preview/header/SVG/PNG use the shared geometry and inspection zoom does not change exports. The outer clip remains a defensive viewport, not the means of trimming circles. Existing gradient brand-review questions remain unresolved.

## Numeric source separation — October 28, 2026

Numeric uses mutually exclusive decimal-entry and curated-formula modes. Only digits and the decimal point are encoded; an optional sign is not. Presets encode the explicitly displayed finite decimal approximation of π, e, φ, √2, √3, 2π, 1/√2 or ln(2), rather than a sampled physical signal or formula graph. The eight examples are familiar mathematical/engineering relationships, not officially endorsed RPI formulas or a popularity ranking. Empty/transient decimal edits produce no pattern instead of substituting π. Preview/header/SVG/PNG resolve one selected source, and exports retain the captured decimal. See [sources, bounds, UI and historical migration](numeric_modes.md). Existing geometry, encoding and zero-ink recovery remain unchanged.

## Neural Network redesign — October 28, 2026

The network now computes an explicit forward pass with configurable depth, width,
connectivity, activation, input mix and deterministic weight sets. Complete node
rings include stroke-aware vertical padding and retain natural horizontal edge
contact. Preview/header/static exports share one graph and visual encoding.
There is no training or animated biological-flow claim. See
[Neural Network model](neural_network_model.md) for equations and limitations.

## Binary input and motion defaults — November 3, 2026

Binary no longer offers audio. Its input, query parser, shared-state migration and UTF-8 encoder use the same ten-code-point cap. UTF-16 surrogate pairs remain intact; a combined emoji or combining accent can contain multiple code points and is not promised to count as one grapheme. Historical valid Binary shares longer than ten points retain their first ten; other controls are unchanged. Profanity filtering runs on the bounded text before encoding. The native field allows twenty UTF-16 code units so ten supplementary characters can be entered; the application enforces the ten-point cap on input.

Unchecked REVERSE now inverts each family's previous direction, including Quantum. This changes presentation direction, not the scientific model. Ruler moves toward increasing screen x; Ticker and Waveform move toward decreasing screen x. Quantum's default traverses decreasing model phase, with no claim of one physical left/right direction for all its modes. Reverse changes the direction without jumping the current phase. Selecting an animated family, including selecting it again after another style, starts Loop unless reduced motion is requested. Explicit paused shared snapshots remain paused; new reduced-motion requests still pause playback and explicit Loop remains available.

## Embedded exports — November 3, 2026

Public sharing controls are removed, while historical snapshot restoration
retains the same validated model controls, seed and phase. Embedded exports
stay on the current page. Names from historical snapshots remain export metadata.
Download feedback and clipboard policy checks do not change scientific
assumptions, geometry, SVG/PNG/GIF renderers or raster sizing. See
[embedded export compatibility](frontify_exports.md).

## Complete preview frames — November 3, 2026

Static preview images still use the canonical clipped SVG and hardware-bounded
125:9 raster sizes. The canvas now paints the letters and bar together after the
requested image is available, retaining a previous complete frame during decode.
An entrance capture cannot run before that first complete draw. This changes
presentation readiness only: official 250-unit geometry, fixed bar gap, model
parameters and exported SVG/PNG/GIF content are unchanged.

## Numeric circle threshold — November 3, 2026

Numeric values are capped at 100 characters, the exact Dot Matrix circle threshold: dot width is `250 / encoded columns - 1` and height is 1.5 reference units. At 100 encoded columns the rounded dots are circles; 101 would compress them horizontally. Shorter values retain the existing stretched dots. A decimal point is encoded; a leading sign counts toward the text limit but is not encoded. Controls, query/share validation and export digit parsing use this same bound, without changing the renderer or official geometry. See [Numeric modes](numeric_modes.md#circle-threshold--november-3-2026).

## Nucleotide encoding — November 3, 2026

Nucleotide adds the two supplied tooth/backbone variants, using a custom shape
key for canonical A–T/U and C–G pairs. Only ATCGU is accepted. Versioned short
human INS/HBB transcript excerpts have explicit accession/coordinate provenance;
no custom input is claimed to identify a gene. See [encoding and source record](nucleotide_bar.md).

## Numeric height raster continuity — November 4, 2026

Height Encoding preserves the existing `(digit + 1) / 10` height mapping, including
10% height for zero. Each decimal occupies one empty cell. Adjacent digit cells
are represented by a joined polygon with their original exact coordinates, so
raster antialiasing cannot reveal internal seams. Separate runs on either side
of a decimal remain separate; no baseline or side reference is added. Dot Matrix
remains a count encoding: zero dots for zero, one bottom dot for a decimal.

## Ticker audio removal — November 4, 2026

Ticker is visual-only. The former arbitrary four-second polyrhythmic audio
mapping is removed; repeat counts, motion timing and exported geometry are
unchanged. Morse, Music and Waveform retain their independent audio previews.

## Waveform envelope retirement — November 4, 2026

The envelope control was a spatial-only amplitude mask, not an audible LFO.
Issue #49 explicitly offered removal as an alternative to introducing audio
modulation. The generator now exposes only waveform type and frequency, plus
independent motion/audio transport. Old envelope query/share fields are ignored
while the remaining settings restore normally; new exports use the unmasked
waveform. Historical low-level envelope geometry helpers remain available to
existing renderer consumers and retain their tests, but are not active controls.

## Parametric Triangle Grid — November 4, 2026

Triangle Grid preserves its three prior layouts as Wide, Balanced and Fine
presets (two, three and four rows). Rows now range from one to six. Density
scales the near-equilateral baseline column count by 50–150%, capped at 96
columns. Stroke weight is 40–160% of the preset stroke; column topology does
not change solely because the stroke changes. Row offset shifts alternate rows
between aligned and a full cell offset, with 50% retaining the original lattice.
Two adjacent connections per vertex preserve triangulation without an all-pairs
search; output stays below 1200 segments.

The fixed viewport clip, reference frame lines and stroke treatment are retained.
The model has no time animation, simulation or measured-data claim. Dynamic
means adjustable here. Preview, header and SVG/PNG share the same settings.
Historical URLs and snapshots recover original preset defaults; custom values
round-trip through reload, history, Reset, Randomize and Undo.

## Parametric Circles Gradient — November 4, 2026

Circles Gradient is adjustable rather than time-animated. Its three starting
presets preserve the shipped Reference rows (including all 86 supplied circles),
Left to right area ramp and Center peak exactly. Columns (8–48), Rows (1–5),
Dot size (25–100%), Size contrast (0–100%), Row offset (0–100%) and Reverse
produce deterministic new compositions, bounded to 240 circles. A customized
row/column count samples the same vertical, directional or symmetric size rule
on a regular lattice. Unchanged reference counts retain the source offsets.

Dot size scales radii. Contrast interpolates radii toward a common cell-safe
radius; zero creates equal-size dots. Row offset shifts alternate rows by up to
a half-cell relative to the preset; complete-circle geometric bounds contain
the result before the defensive clip. Reverse reflects the vertical reference
profile or horizontal ramp/peak. No opacity interpolation, measured dataset,
new motion clock or per-frame fitting is introduced. Preview/header/SVG/PNG use
the same model; URL, historical share, Reset, Randomize and Undo retain settings.

Nucleotide completion update (November 4): 30 actual bases are required for
export, with up to 50 allowed. These are tool limits, not biological requirements.
The length selector is retired. Preview slots represent the 30-base minimum;
ready sequences contain only actual bases. Tooth width uses the current pitch,
width / max(30, count), minus the fixed gap width / 30 × 0.16. At reference
width 250, teeth are 7 units wide through 30 bases and shrink to 3.67 at 50;
gaps stay at 1.33 units without overlap or a
change to official mark geometry. This spacing is a visual density convention, not a molecular
measurement. Green/red controls and dashed placeholders never enter exports.
INS/HBB presets retain their recorded versioned CDS prefixes. See nucleotide_bar.md.

## Audible Waveform LFO — November 4, 2026

The owner asked to implement LFO behavior instead of removing the old envelope.
The new audio-only sine LFO is amplitude modulation (tremolo), not pitch modulation:
`gain(t) = 1 - depth/2 + (depth/2) sin(2π rate t)`, with depth normalized to 0–1.
Rate is in real audio-clock hertz; gain stays between 1-depth and 1. The modulator
feeds a GainNode AudioParam after the carrier mix and before the existing fade.
It does not increase the carrier's peak gain. Toggle/parameter changes use a
15 ms time constant; audio transport remains explicitly user initiated.
Visual motion speed is independent, and exports show the unmodulated carrier.
The UI calls this Volume pulse so it does not imply a spatial mask, measured
signal, pitch vibrato or an audio-bearing export. Legacy spatial-envelope fields
remain retired; new LFO settings use separate bounded query/share controls.


## Export composition — November 10, 2026

Bar-only export omits the official lettering and crops the export viewport to
the unchanged canonical 250 × 18 bar plus 20 reference units of clear space.
The complete-mark option remains the default. Both choices use the same current
pattern fragment, selected data, seed, model parameters, color and captured
settings. Existing still-export resting phase zero is preserved; supported GIFs
retain the existing captured-origin loop plan. No model, coordinate, natural
gap, artwork clip, timing or motion-availability rule is changed. See
[geometry](bar_geometry.md#export-composition--november-10-2026) and
[verification](export_composition_qa.md).

## Animated Gradient — November 10, 2026 (local candidate)

Gradient retains its two original single-ink stripe patterns at phase zero.
Coverage changes through the bounded coordinate warp
`t' = t + 0.28 sin(2π phase) sin(πt)`, followed by the existing linear taper or
triangular center-coverage rule. The 24 column centers and row coordinates stay
fixed; no spatial fitting, opacity, added color or measured-data claim is involved.
The endpoint widths are fixed, all rectangles remain within the 250 × 18 viewport,
and the cycle is continuous at its wrap. Default speed is 0.1 cycles/s (10 seconds),
with 0.2–4× default speed (0.02–0.4 cycles/s), Loop and Reverse controls using the existing shared clock.
Pause holds the current coverage; speed/reverse changes retain phase. Reduced
motion starts paused, permits explicit playback, and pauses an active loop when
newly requested. Removing the preference does not restart it.

Live main/header rendering and GIF use the same geometry. SVG/PNG and clipboard
exports keep the existing resting-phase policy, preserving the original variant
artwork regardless of preview time. GIF exports one full phase cycle with the
existing transparent encoder. Historical variants restore with default motion
settings; paused snapshots retain their recorded phase. Home marquee samples
receive no gradient phase and remain static; Gradient is deliberately absent
from the marquee animation allowlist. Existing gradient brand-review questions
remain open. This records local engineering work, not publication or approval.


## November 10 normalized SPEED controls

SPEED displays a multiplier of each original default: Ticker 0.4 bottom-row
repeats/display second, Waveform 0.3 temporal cycles/display second, Gradient
0.1 coverage cycles/display second, and Quantum 1× model time. Every control
spans 0.2–4×, starts at 1×, and supports direct multiplier entry. Arrow keys
change 0.05×; Page keys change 0.25×; Home/End select the bounds. Dragging uses
fine native range steps, with a narrow 0.025× attraction window at 0.5×, 1× and
2×. This pointer-only assistance changes the same physical rate as the slider;
typed values and keyboard increments bypass it. Tick positions use the linear
0.2–4× scale. LFO RATE remains a separate logarithmic Hz control.

URLs and v1 snapshots retain actual rates, never the displayed multiplier.
The stored ranges are Ticker 0.08–1.6, Waveform 0.06–1.2, Gradient 0.02–0.4,
and Quantum 0.2–4. Stored repeating-family precision is 0.001, preserving all
previous valid rates/defaults and avoiding a coarse 0.1 rounding jump. Reset,
Randomize, Undo and numeric editing share this mapping. Ruler remains static.

At 4× Quantum's nominal recurrence is 30 display seconds and all n² mode
ratios remain fixed. Live tick sampling guards and GIF delay quantization
remain in force; a delayed frame can reduce live speed. These are illustrative
display rates, not calibrated physical frequencies or a flash-safety guarantee.
See [the integration review](combined_generator_validation.md) for checks and
remaining browser limitations. Earlier rate tables below are historical.

## Visual Waveform LFO — November 10, 2026

The new LFO control supersedes the November 4 audio-only scope. The label is
simply **LFO**. Its waveform slider folds continuously between Sine, Sawtooth,
Square and Pulse, using the carrier's interpolation and 20% pulse duty cycle.
The sine retains the prior audio phase origin; the other shapes use the same
quarter-cycle offset. This is generated amplitude modulation, not measured
sound or pitch vibrato.

Rate covers **0.07–1300 Hz**, the panel range in the primary
[Moog Grandmother manual v2](https://cdn.inmusicbrands.com/Moog/Grandmother/Grandmother_Manual_Version_2.pdf),
Modulation RATE, printed page 23 (PDF page index 22). This borrows a documented
control range, not a claim to emulate the instrument. A logarithmic native
slider spans the range; the existing numerical editor accepts Hz to hundredths.
Depth stays 0–100%, with 2 Hz, 60% depth and Sine as defaults.

`gain = 1 - depth + depth × shape(phase)` stays in `[1-depth, 1]`.
Visual height is multiplied uniformly from the fixed lower edge; x coordinates,
carrier frequency/travel, official letters, gap and bar viewport stay fixed.
There is no painted baseline, fitting pass, opacity effect or spatial envelope.
The preview and header consume the same frame value and shared geometry.

The native audio oscillator preserves phase and uses band-limited PeriodicWave
coefficients, a constant pulse-DC offset and a limiter for Fourier edge ringing.
Rate/depth retain 15 ms exponential ramps. An analytic clock integrates those
same rate ramps. Silent playback uses the existing render scheduler; starting
and stopping audio hands off the current phase. No sound starts automatically.
Loop pause and reduced motion hold visual modulation while explicitly requested
audio can continue. Hidden pages stop audio under the existing policy; artwork
holds and style changes stop advancing the visual clock without elapsed-time
catch-up. Reset clears LFO state; query/share/Undo retain all four controls. New snapshots also retain the LFO
phase; historical snapshots start it at phase zero.

A screen cannot show 1300 cycles/s. The visual amplitude blends to the correct
cycle mean between 60% and 100% of a limit of `min(10 Hz, frame rate / 6)`.
Thus a regular 60 Hz display blends from 6 to 10 Hz; at 30 Hz it blends from
3 to 5 Hz. Rates above the limit remain steady, including Pulse's lower mean.
Audio still uses the requested full rate. Frame stalls use the existing 50 ms
visual delta cap, and visual timing is illustrative rather than physical time.

Static SVG/PNG/clipboard retain the existing reproducible resting carrier/LFO
phase policy, including the selected depth/waveform and high-rate mean rule.
Waveform GIFs below 5 Hz close both carrier and LFO clocks at their exact common
period (hundredth-Hz rates, maximum 100 seconds / 3000 frames at 30 fps).
At 5 Hz and above GIF uses the carrier loop and averaged amplitude, avoiding
alias beats at its lower frame cadence. Streaming still retains at most two
input RGBA frames, but long common periods take more encoding time; Cancel
remains available. GIF timing remains quantized to centiseconds and carries no
audio. Disabled LFO retains the old carrier geometry and frame plan.

Local unit tests cover waveform math, synthesized coefficient output, bounded
height, transport ramps/handoffs, pause/suspension/reset and exact joint periods.
Native audio, rendered responsive layouts and real downloads still need browser
QA: this cloud sandbox blocks Chromium's Unix sockets, WebKit lacks libraries,
and the managed browser cannot reach its isolated localhost server. The browser
harness is present; no browser or physical-device pass is claimed.

## Actual audio Waveform scope — November 10, 2026

The owner clarified the goal with a VCO → VCA / LFO → VCA reference and a
hand-drawn envelope/carrier example, then explicitly requested a direct scope
of actual audio with sensible horizontal scaling. This supersedes the uniform
bar pulse, fast-rate average, resting-phase export policy and idealized visual
carrier described above. The runtime never substitutes a mathematical drawing
for missing recorded audio.

The inspected audio graph sums the normalized carrier oscillator crossfades
into a GainNode. The bipolar LFO and bias sum into its gain AudioParam, and that
GainNode multiplies the actual carrier samples: AM/tremolo. No LFO connects to
carrier frequency or phase. Additive carrier/LFO mixing would be a different
signal; FM integrates varying frequency into phase, and PM varies phase itself.
The new `waveformAudio.js` extracts the existing audible builder and parameter
update code without changing oscillator types, starts, C1–C5 pitch mapping,
Pulse worklet/fallback, pulse duty, normalized crossfades, coefficients, 15ms LFO
ramps, 50ms master fade or carrier ramps. A frozen independent pre-refactor
reference verifies event scheduling and native offline PCM equivalence.

When Audio is on, a separate silent AudioWorklet branch taps the existing master
gain output after LFO, carrier gains and fade. It emits **zero** audio and posts
minimum/maximum values for every eight actual PCM samples. A bounded ring holds
the requested view plus two seconds of history; it is not limited by an
AnalyserNode's 32768-frame window. The physical window is
`T = max(4/f, 2/r)` for enabled nonzero-depth LFO, and `4/f` otherwise. Here
`f = 32.70 + (frequency-10)/90*(523.25-32.70)` Hz and `r` is the LFO rate.
Thus 2Hz spans one second with about 109 carrier cycles at the default pitch;
.07Hz spans 28.571 seconds with two real envelopes. High-rate modulation keeps
at least four carrier cycles and its actual texture. Live history starts with
available samples and is labeled “filling history” until the full window exists.

With Audio off, the same shared graph runs in OfflineAudioContext, including
the real Pulse worklet when supported, without rendering to audio hardware or
resuming the audible context. It discards .25 seconds of startup settling and
stores the actual rendered PCM extrema. A Square fallback is labeled when the
browser cannot run the Pulse worklet and that carrier is in use. This is a
separately generated audio signal, explicitly labeled “Offline audio render”;
it is not called a live recording. Unsupported APIs/render failures display an
error and empty scope, with no ideal-wave fallback. Rendering is debounced,
serialized and generation-checked so stale settings cannot replace newer data.

The 1024 horizontal bins retain actual signed extrema, not an amplitude average
or sampled LFO equation. Fixed gain scale .1 matches the existing carrier volume;
zero is the bar center, and lobes fill to zero without a painted baseline.
Main/header/SVG/PNG/GIF use this same PCM geometry. The time axis is physical
seconds; silent replay/GIF speed follows the existing 0.2–4× SPEED control.
Live capture follows actual audio timing. Loop pause and reduced motion retain
the exact displayed frame/recording even while explicitly started audio
continues; hidden/style transitions retain the existing audio-stop policy.

SVG, PNG and clipboard freeze the displayed frame at request time, including
live PCM, rather than switching to an unrelated resting phase. GIF freezes the
same recording and starts on the displayed frozen frame and replays up to two seconds of its
captured history in the selected direction. It repeats that finite recording,
with a possible reset when the history wraps; there is no claim that arbitrary audio pitches and LFO rates
share a seamless short period. A still-filling live buffer without .1 seconds of
replay history gives an actionable GIF error while SVG/PNG remain available.
No settings changed during asynchronous encoding can change the captured data.

Primary source: [W3C Web Audio specification](https://www.w3.org/TR/webaudio/),
AudioParam, GainNode, OscillatorNode, OfflineAudioContext, AnalyserNode and
AudioWorkletProcessor. OfflineAudioContext renders to an AudioBuffer rather
than audio hardware; AnalyserNode time-domain history is capped at 32768 frames.
This architecture follows those APIs and the app's inspected connections.
See [scope QA](waveform_signal_qa.md) for actual evidence, performance bounds,
source distinction and browser/audio limitations.

## GIF time sampling — November 10, 2026

Ticker, Waveform and Gradient exports target approximately 30 frames per second
across the selected full loop. Frame count follows the encoded centisecond
duration, with 30/40 ms delays; each geometry sample uses its actual elapsed
time. No endpoint frame is duplicated. The 72-frame ceiling and 24-frame floor
no longer undersample slow loops or oversample short ones. Up to 3000 frames
and 100 seconds are bounded without changing the loop's mathematical period,
preview motion, geometry, captured composition or static export coordinates.
See [measurements and sampling limits](gif_frame_rate_benchmark.md); increased
temporal samples do not change the pattern's scientific meaning or remove all
aliasing at dense/fast settings.

## GIF temporal cadence — November 10, 2026

The 30/40 ms GIF sampling cadence is replaced by a 50 fps target on the existing
elapsed-time sampler. Exact 20 ms holds reduce temporal step size; an odd total
centisecond requires one 30 ms hold. Full encoded duration and periodic geometry
closure are preserved, without a duplicated endpoint. The unchanged 3000-frame
budget can limit longer loops below this target. No scientific coordinates,
preview clock, SVG/PNG, alpha-conversion source or recorded-audio history contract
is altered. See [timing measurements, format and resource limits](gif_cadence_benchmark.md).


## Scope history and fixed physical X coverage — November 10, 2026

Owner live QA exposed a presentation error in the actual PCM scope: configure()
cleared its ring on each edit, and tick() passed the available duration instead
of the requested duration to geometry. Stretching that progressively longer
recording over the full width made the displayed frequency appear to grow.

The X window now always spans the requested physical duration, quantized once
to an integer extrema-pair count. For N available pairs in a target window of M
pairs, live coverage is `[1-N/M, 1]`. Bins and the closing polygon stay inside
that known region. The unknown prefix receives no paint or extrapolated samples;
its duration is reported as unrecorded. Each added packet advances the visible
history on the same X scale instead of rescaling a shorter signal to full width.
The min/max bin count is proportional to coverage, keeping the display’s time
resolution consistent during filling instead of initially allocating the whole
1024-bin budget to a short recording.

The live ring retains the longest supported window plus two replay seconds,
including while shorter or disabled-LFO views are selected. Parameter edits
retain the actual continuous post-gain samples and their real audible ramps.
A view containing the latest edit boundary is labeled as including parameter
changes. The caption does not claim all retained samples match current controls
or place a sample-exact marker on an asynchronously requested edit. Once older
history has left the visible window, the mixed-history label clears.

Offline work retains the prior actual frame while the replacement is pending,
with an explicit previous-settings label. Successful latest renders replace it
once as complete data; stale or failed jobs do not erase it. No interpolation of
old/new waveform values is used. Freeze pins the exact frame, timebase and
export recording through parameter changes and background completion. Resume
selects current live history or the latest complete silent render. Source labels
remain live, recorded or offline as appropriate. The existing actual-audio graph,
LFO/carrier ramps and output route are unchanged.

Native/silent contexts may have different sample rates; their physical durations
round by at most one extrema pair, rather than changing while history fills.
SVG/PNG freeze these same coverage bounds. Insufficient replay history still
gives the existing actionable GIF error; recorded GIFs retain their fixed
coverage and current 50fps planning/guard behavior. See
[transition regression and native raster QA](waveform_scope_transitions_qa.md).

## GIF edge quantization — November 10, 2026

Straight waveform discontinuities already use exact one-sided vertices in the
shared geometry. The reported repeating teeth arise after rasterization: the
former 4 × 4 ordered transparency mask varies coverage along a straight edge.
GIF now thresholds coverage uniformly at one half. This rounds raster boundaries
without changing scientific coordinates, duty cycles, official viewport or SVG/PNG
geometry. Curves and diagonals retain GIF’s binary-alpha pixel steps. Carrier,
LFO and audio math are untouched. See [encoded evidence](gif_edge_qa.md).


## Actual-sample sweep playback — November 10, 2026

A physical X timebase is independent from playback speed. Advancing a .037s
window at one recorded second per display second makes the roughly 109Hz
carrier race and alias visually. The corrected display scans at most
`1 / max(carrierHz, activeLfoHz)` recorded seconds during one visual cycle,
which takes `1 / SPEED` display seconds. Disabled/zero-depth LFOs do not set the
scan rate. X still spans four carrier periods or two active LFO periods,
whichever is longer; it is never rescaled to this slower playback duration.

Actual extrema pairs determine rising-zero-crossing triggers. No oscillator is
reconstructed and no sample values are interpolated. Live capture continues
independently; immutable triggered snapshots refresh between visual sweeps,
after parameter edits, while filling, and once mixed history has left the
selected window. The explicitly labeled slowed replay keeps SPEED/reverse
consistent across live capture, silent renders and GIF. Static formats and
freeze retain the exact shown frame. An arbitrary carrier/LFO ratio need not
close at a short sweep boundary, and refreshed live snapshots may show a
different envelope; this is an actual recorded scope, not a claim of periodic
physical playback. Existing gain modulation, audio ramps and output are intact.

## Ordered PCM, dense peak contours and LFO timebase — November 10, 2026

The earlier same-X max/min zigzag is replaced. Short/sparse views draw ordered
actual PCM. A fractional source offset linearly interpolates only adjacent PCM
samples; it does not evaluate an ideal carrier or gain function. The final
sample's X is its true time, one source interval before the window endpoint.
Dense slow-LFO views (more than16carrier cycles and LFO below carrierHz/8) show
measured peak envelopes, not an instantaneous carrier trace. Bins span roughly
one carrier period, capped at1024. Their upper/lower contours are independent;
monotone cubic interpolation stays within adjacent measured values and creates
no new extrema. Captions distinguish peak envelope from PCM trace. High-rate
modulation retains ordered PCM rather than assuming a slow envelope.

With active nonzero-depth modulation the physical sweep is1/LFOHz, rather than
1/fastestHz. One sweep takes1/SPEED display seconds, while X still spans two
LFO periods or four carrier periods, whichever is longer. A quarter-sweep
therefore moves a two-envelope view by an eighth of its width. Playback may be
slower or faster than physical recording time and is labeled sample playback.
Actual envelope-level crossings trigger dense captures; sparse views use real
rising PCM crossings. Triggers select recorded windows, not synthesized phases.

Two sweep periods of actual extra history provide trigger/playback margin.
Long extrema storage is bounded at4/.07 seconds; a one-second PCM ring covers
every supported sparse window and its margin, avoiding full-rate long-history
storage. Dense offline rendering keeps measured extrema after releasing PCM.
Audio graph/gain ramps/output and physical partial-history bounds are unchanged.
SVG/PNG freeze the exact representation; GIF follows its actual captured data,
selected direction and visual speed. Noncommensurate source ratios may reset
at the replay boundary, and live snapshot refresh can change the measured
outline. The display does not claim real-time scrolling or an exact analytic
envelope between measured bin peaks.

## Ring scrolling-coordinate display — November 11

Ring Wavefunction retains the analytic normalized free-particle state with modes
-4, 3, 7, but draws `psi(u + 3q/28, q/28)` so the complete displayed complex
state repeats in one cycle. This is a coordinate view, not a new potential or
a Galilean-transformed quantum state. Preview and export share it. Display
phase q now traverses a 4.28-second cycle at 1×; nonzero old phase links migrate
to that new view, while phase-zero still images are unchanged. See
[model and limits](quantum_model.md) and [measured GIF QA](ring_short_loop_qa.md).


## November 11 Well Modes and Rabi studies

Two working Under Construction families now expose ideal, dimensionless quantum
models without promoting them into Home's approved categories. Well Modes draws
normalized two-mode infinite-well probability density with fixed gain and real
zeros. Rabi draws complementary populations from the initial-ground-state RWA
solution over a pulse-duration scan. Its apparent translation is parameter
scanning, not motion in physical space. Both use an illustrative eight-second
default cycle. See [complete formulas, restrictions, sources and export QA](quantum_studies.md).

## Music piano roll — November 11, 2026

The dormant notation is superseded by a chromatic piano-roll model. A bounded
monophonic phrase contains notes C4–C5 or rests, with durations in quarter-note
beats (0.25, 0.5, 1, 2), at most 16 beats. C4 and C5 occupy distinct fixed end
lanes, with all intervening sharps represented individually. Position is onset;
shape bounding width is duration divided by total phrase duration. Rests leave
gaps. Pitch centers remain fixed when notes are added or removed. Shape choice
has no effect on pitch or duration; geometric shapes are not notation symbols.

Audio uses `440 * 2^((MIDI - 69)/12)` with A4 = 440 Hz, and beat duration is
60/BPM seconds. Synthesized voices/effects affect sound only. Artwork is static,
with no tempo-derived movement. SVG/PNG remain silent. Preview, graphics, SVG,
audio and persistence share validation and score geometry. No staff baseline,
ledger lines, added side strips, or forced painted-edge scaling remain.

Authoritative coordinate/tuning sources and exact drawing conventions are in
[music_bar.md](music_bar.md). These are original short exercise patterns, not
borrowed compositions, recordings or measured musical data.
