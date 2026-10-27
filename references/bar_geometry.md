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

Every valid bar must actually paint both nominal horizontal edges, while keeping all paint and stroke extents inside the fixed design rectangle. A correctly sized clip rectangle alone does not establish edge contact. Internal negative space remains part of the design; unintended outer side padding does not. Check every family, variant and supported control range in preview/header/SVG/PNG, and GIF where supported.

Static geometric artwork can use stroke-inclusive primitive bounds to fit its painted extent. Definitions, clipping containers and empty SVG viewports do not count as paint. Encoded data, measurement domains, Quantum projections, Neural nodes and nested Artemis artwork retain their own fixed domains. Moving frames are never independently rescaled to fit their instantaneous extent.

Ruler and Ticker preserve their original interior tick coordinates, spacing and phase, with fixed boundary references no wider than one reference unit or one normal tick. Waveform retains its synthetic signal and adds a fixed zero baseline. Numeric reference marks define the domain without moving or changing digit cells, including zero cells. Neural endpoint circles are tangent to the edges. Unsupported or zero-ink encodings cannot silently export a mark with no bar; the UI explains the recovery action.

Static preview snapshots, header SVG and exports use the same current-control collector. Quantum keeps its native phase renderer and fixed scientific domain; Artemis retains its visible SVG layer and nested source viewport. Tiny moving headers preserve the accepted persistent letter layer and 4× bar sampling without freezing rows to a mean fill.

`scripts/geometrySmoke.js` checks actual paint, spacing, live placement and downloads, including the SVG overlay's visible state and real CSS transform. `scripts/geometryEdgesSmoke.js` exercises additional edge/control cases. Pattern tests exclude unpainted definitions when counting geometry. Raster comparisons render SVG into the same whole-pixel viewport at the same uniform reference scale, preserving exact pixel-equality checks.
