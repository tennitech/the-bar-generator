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
