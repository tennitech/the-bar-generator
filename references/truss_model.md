# Truss geometry study

## November 11, 2026 scope

Truss is a live, selectable study under **Under Construction**, with its direct
`generator/truss/` route restored. It is not promoted to Dynamic, Static or the
Home marquee. Category promotion and aesthetic acceptance await the owner.

The former disabled renderer offered thirteen roof silhouettes. Most ignored
Segments, while others silently capped it. This replacement uses four explicit,
full-span, parallel-chord geometric rules. It does not calculate loads, support
reactions, stress, deflection, material properties, joint behavior or safety.
There is no structural certification or construction guidance.

## Sources and naming

Reviewed November 11, 2026:

- [Steel Construction Institute / Steel for Life: Trusses](https://steelconstruction.info/topics/design/trusses/)
  describes interconnected straight members, chords and diagonal webs, including
  Pratt and Warren arrangements. Its discussion of forces and member design is
  not implemented here.
- [Federal Highway Administration: Engineering for Structural Stability in Bridge Construction](https://www.fhwa.dot.gov/bridge/pubs/nhi15044.pdf),
  Figure 9-4, illustrates Warren, Howe, Pratt and lattice arrangements.
- [Alberta Transportation: Bridge Inspection and Maintenance, Level 1, version 4](https://open.alberta.ca/dataset/07eed41e-c6b2-43ce-a4be-edd781667cbe/resource/326af6e1-70a1-44e8-994e-b213209c137f/download/trans-bim-level-1-inspection-manual-version-4.0.pdf),
  chapter 7, identifies Howe diagonals rising toward midspan and Pratt diagonals
  descending toward it.

Only the connectivity motifs are adapted. Warren zigzag is named explicitly:
the fixed, shallow bar and adjustable panel/depth ratio do not enforce equilateral
triangles. X-braced describes crossing diagonals without assigning a historical
lattice subtype or asserting that crossings are physical joints. End posts and
top/bottom chords are members of the drawing, not extra decoration added to force
painted bounds. No force-sign encoding or relative strength claim is made.

## Exact model and controls

All calculations use the existing official 250 × 18 vector bar, equivalent to the
500 × 36 design area. Official RPI letter paths, letter spacing, bar placement,
clear space, color combinations and complete-mark proportions are unchanged.

- **Bracing:** Warren zigzag, Pratt, Howe, or X-braced. Default Warren zigzag.
- **Panels:** 4–32 in steps of 2, default 16. Every setting changes every family.
  A panel is one equal horizontal bay, not a count of complete Warren triangles.
  Even counts make the left/right halves meet symmetrically.
- **Depth:** 50–100% of bar height in steps of 5%, default 100%. The drawing is
  vertically centered; horizontal extent stays fixed. Lower depth leaves natural
  vertical whitespace and changes diagonal angles, not the logo's proportions.
- **Stroke weight:** 0.5–2 in steps of 0.25, default 1.25, in canonical 250-unit
  vector coordinates (twice these values in the official 500-unit design area).
  This is drawing weight, not a physical member size. The bounds retain useful
  negative space at dense/shallow settings; dense patterns still require a larger
  final placement. There is no universal minimum-size claim.

For viewport width W, height H, panel count n, depth fraction d, and vector weight
s, the painted height is H d and stroke width is s W / 250. The top/bottom
centerlines are inset by half the stroke from that centered height; endpoint X
positions are inset by the same radius. The model defensively bounds the stroke
for noncanonical caller aspect ratios. Round caps contain complete strokes while
naturally reaching the horizontal bounds. Fixed clipping remains a final guard.

The two chords connect the endpoints. Both ends have a vertical post. Pratt and
Howe also have an internal post at each bay division. Warren alternates rising
and falling diagonals. Pratt descends toward midspan; Howe reverses that rule.
X-braced draws both diagonals per bay without internal vertical posts. Crossings
are plain line intersections. No support symbols, arrows, labels or additional
claim of analysis appear in the exported bar.

## Integration and saved state

`normalizeTrussSettings` is the shared bounded/stepped normalizer for query parsing
and geometry. The native select/sliders retain the existing accessible dropdown,
keyboard numeric editor, limit feedback, Reset, Randomize, Undo, changed-state
feedback, theme and export-composition systems. Randomize uses restrained values
and guarantees a different panel count. The style picker has a matching static
sample from the same renderer. No extra animation or GIF is introduced: reduced
motion produces the same static bar, with existing global UI motion preferences.

Header, canonical main preview, SVG and captured PNG all use the shared model.
Fallback p5 drawing uses the same coordinates and round caps. Export snapshots
capture family, panel count, depth, stroke, color, composition and size before
asynchronous work. Both Bar only and Bar + RPI retain the existing transparent
SVG/PNG and clipboard paths. Zoom never enters exported geometry.

The legacy query keys `trussFamily`, `trussSegments` and `trussThickness` remain;
`trussDepth` is added to both route query registries. `flat` and `queen-post` map
to Pratt; the old Howe value now selects the documented parallel-chord Howe.
Other retired roof motifs fall back to Warren zigzag. `lattice` maps to X-braced.
These are intentional replacements, not preservation of the old roof drawing.

Historical version-1 shares captured **all** dormant controls, even when another
style was selected. Absence of depth identifies the old Truss control schema.
Only known old families and valid old numeric ranges/steps migrate, then values
are clamped/snapped to the new controls and depth defaults to 100%. Modern
snapshots continue to reject malformed/out-of-range settings. This prevents old
Solid, Circles and other saved configurations from failing because of hidden
Truss defaults. The new state round-trips without migration.

## Validation and limits

- Model tests cover all four rules, every even panel count, no duplicate members,
  named diagonal orientations, nonfinite input, precise steps, stroke-aware bounds,
  depth and weight extremes, fixed horizontal span, and proportional scaling.
- SVG commands equal the model coordinates exactly; time/phase do not change the
  bar. Export-composition tests include Truss in every configured color pairing.
- Native action tests exercise Reset/Randomize/Undo through the shared system.
  Legacy migration and modern strict validation have dedicated regressions.
- `scripts/trussRenderLocal.js` rasterized and decoded 16 real SVG-to-PNG exports:
  all four families, both compositions, and Standard/Large sizes. Dimensions,
  painted pixels, transparent outer corners and PNG signatures passed.
- The [geometry review](review-images/truss/geometry-review.png) shows four defaults
  on white/black and shallow/dense/weight studies. The
  [default complete mark](review-images/truss/default-logo.png) uses unchanged
  official paths. These are native offline rasterizations, not browser screenshots.
  Only project artwork and original geometric primitives are included; no external
  asset or font is added. Existing identity/font permission questions stay open.
- Cloud CUA navigation to the local preview returned `net::ERR_CONNECTION_REFUSED`.
  No denied local browser launch was retried. Local rendered UI responsiveness,
  actual keyboard/touch input, clipboard acceptance and screen-reader behavior
  remain unverified by that attempt. Existing shared UI is reused without new CSS.
  Exact full-suite, CI and production results are recorded in the PR.

Passing software checks does not establish structural, brand or owner approval.
