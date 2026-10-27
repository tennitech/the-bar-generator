# Bar meaning and source notes

This file distinguishes encoded data from illustrative patterns. It does not grant brand approval.

## Shared mark geometry

- The three letter paths in `js/main.js` exactly match `assets/images/RPI Wordmark 250px 2.svg` in the repository. The generated bar occupies the shared 250-unit width and 18-unit height below those letters.
- PNG and GIF exports include 20 pixels of transparent or background clear space on each side. SVG exports now include 20 viewBox units on each side. At other print sizes, the person placing the mark must still enforce the 0.25-inch print clear-space rule.

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
| Neural Network | Schematic node-and-edge diagram. It does not represent a trained model or measured network topology. |
| Artemis II | The splashdown counter uses April 10, 2026, 8:07 p.m. EDT, matching [NASA's splashdown record](https://www.nasa.gov/gallery/artemis-ii-splashdown-and-recovery/). The bar artwork is a supplied project asset, not mission telemetry. |

The other selectable styles—Solid, Circles, Circles Gradient, Gradient, Grid, Lines, Point Connect, Triangle Grid, Triangles, Union, Wave Quantum, and Runway—are geometric or supplied artwork patterns. Their names describe visual motifs; they do not assert a measured dataset. Runway and Artemis II still need owner approval for the proposed lockups, as do the secondary logo colors.

## Live motion timing: October 27, 2026

Live motion advances a continuous cycle phase from browser frame timestamps. Speed changes adjust the next phase step; they do not rescale all elapsed time. Reverse changes direction without changing the current pattern position. Pause and resume keep the phase.

The p5 render ceiling is 1000 FPS so the browser's requestAnimationFrame cadence can drive the preview on displays above 120 Hz. This is a scheduling ceiling, not a claim that a device renders at 1000 FPS or sustains its display refresh rate under load. The header mark uses the same phase and draw callback as the preview, with a reused 2D canvas and official letter paths. The full-screen ASCII overlay pauses background preview drawing and phase advancement while open.

Each live phase step is at most one quarter of the smallest repeating tick interval: one cycle divided by the ruler unit count or ticker count ratio. Waveform uses one whole temporal cycle. A slow or delayed frame can therefore reduce live speed to avoid temporal aliasing that appears as reverse motion. This is a visual sampling limit, not a measurement of a physical signal. It cannot remove every perceptual artifact from very dense patterns at small display sizes.

Waveform preview, header, and SVG output now use the same waveform function, including the sine phase origin at the lower bar edge. The former SVG sine origin differed by one quarter cycle. GIF loop planning and requested export speed remain unchanged; GIF frame-rate limits can still produce temporal aliasing at dense, fast settings. Exported SVG/PNG images are static snapshots of the current phase. Native display cadence still needs checks on physical high-refresh hardware.

### Small header ticker sampling

The header and main ticker use the same phase, direction, and geometry. The header can still show spatial aliasing when a row has fewer than three device pixels per repeat. Only that unresolved header row is drawn at its exact mean coverage: one half for the top row, and min(1, width ratio / (2 × count ratio)) for the bottom row. Resolved rows keep the original moving geometry. This prevents a false reverse pattern at the small display size; a dense row can therefore look stationary. It does not change the main preview, selected repeat counts, or exports. The threshold uses CSS width × device pixel ratio and is recalculated on resize or pixel-ratio changes.

## Viewport-relative inspection zoom

The preview uses the complete 250 × 150.911-unit mark bounds, including its bar, to calculate a uniform fitted scale from the actual canvas size. Padding and the zoom control area are excluded. The letterforms, bar proportions, and spacing are unchanged. There is no separate wide-screen size cap.

100% means the fitted baseline for the current viewport. 400% means four times that fitted scale. Values below 100% are not offered because this control is for inspecting detail; Fit already shows the complete mark. The same percentage can produce a different CSS-pixel width after a viewport resize. It is not a print size, DPI, export scale, or guarantee that a complex pattern is legible at its final placement size.

Button zoom keeps the bar as the inspection focus. Pointer zoom uses the pointer location, subject to the view's pan bounds. Fit recenters the full mark; native touch pinch and browser keyboard zoom remain separate from preview zoom. Preview zoom and pan do not enter the SVG, PNG, or GIF export transforms. Local SVG/PNG comparison at 100% and 400% produced identical files for Solid.
