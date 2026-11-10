# Shared bar geometry

The complete supplied `assets/images/RPI Logo.svg` defines the lettering, solid bar and their relative placement. `js/utils/logoGeometry.js` retains its paths at a uniform half scale. Separate wordmark assets have different origins and proportions and must not be mixed into this complete mark.

| Reference measurement | Value |
| --- | --- |
| Bar design width × height | 250 × 18 units, proportional to the official 500 × 36 area |
| Lettering bottom | 111.4885 |
| Bar top | 132.4885 |
| Letter-to-bar gap | 21 |
| Complete design height | 150.4885 |
| Export padding | 20 units per side, scaled with the mark |

The supplied solid path has rounded source coordinates and ends at 150.488 rather than the design rectangle's 150.4885. Its actual vector is retained instead of redrawing or distorting it. Placement must still satisfy the dated [brand guidance](rpi_brand_guidelines.md), including clear space and legibility at the final size.

The owner clarified on November 3 that containment means the fixed design viewport, not forced painted contact at every edge or animation phase. Natural edge contact remains valid. Natural whitespace is also valid and is reviewed case by case. Never add side strips, bottom baselines, outlines or a painted-bounds fit merely to satisfy a boundary check.

Ruler, Ticker, Waveform and Numeric now preserve their own tick/sample/cell coordinates without artificial reference paint. The generic static horizontal edge-fit pass is removed. Intrinsic Grid lines, natural endpoint circles, source artwork and fixed scientific domains remain intact; this is not a redesign of every pattern. Moving frames are never independently rescaled. The fixed clip prevents overflow without inventing paint.

Ruler has exactly REPEATS major intervals across the domain, each split into DIVISIONS equal intervals. Marks are centered at those coordinates and clipped naturally at the viewport. The zero-offset still and animated geometry are identical. Unsupported or zero-ink encodings still cannot silently export a mark with no bar; the UI explains the recovery action.

Static preview snapshots, header SVG and exports use the same current-control collector. Quantum keeps its native phase renderer and fixed scientific domain; Artemis retains its visible SVG layer and nested source viewport. Tiny moving headers preserve the accepted persistent letter layer and 4× bar sampling without freezing rows to a mean fill.

`scripts/geometrySmoke.js` checks actual paint, spacing, live placement and downloads, including the SVG overlay's visible state and real CSS transform. `scripts/geometryEdgesSmoke.js` exercises additional edge/control cases. Pattern tests exclude unpainted definitions when counting geometry. Raster comparisons render SVG into the same whole-pixel viewport at the same uniform reference scale, preserving exact pixel-equality checks.


## Export composition — November 10, 2026

The export-only **Bar + RPI** / **Bar only** choice defaults to the complete
mark. Bar-only SVG omits the official letter paths and uses the fixed
`-20 112.4885 290 58` viewBox around the same 250 × 18 bar coordinates. It does
not crop to painted bounds, force edge contact, rescale a frame, or modify the
preview/header. The complete mark retains `-20 -20 290 190.4885`.

Raster output uses the captured viewport at a uniform 4× or 8× scale. Bar-only
PNG/GIF is 1160 × 232 or 2320 × 464, with 80 or 160 px clear space per side.
Complete-mark dimensions and the existing Large default remain unchanged.
Clipboard formats use the same captured composition. Both compositions retain
transparent backgrounds. Print clear space and final-size legibility still
require placement review.
