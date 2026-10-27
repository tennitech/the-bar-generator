# Bar backlog coordination — October 27, 2026

## Required painted extent

The owner requires every bar artwork to reach both exact nominal horizontal edges. Merely fitting inside the bar rectangle is insufficient. For a caller rectangle x, y, width, height, the painted minimum X must equal x and painted maximum X must equal x + width, within a documented numerical tolerance used only for floating-point verification. All painted artwork, including stroke extents, must remain inside the nominal rectangle with no overflow. The official 500 × 36 px design area scales uniformly; do not change its dimensions to force edge contact. Do not introduce visible side padding. Preserve the official bar dimensions, placement, letterforms, and letter-to-bar gap.

Apply this invariant to every style and variant, including animation phases, tiny triangle changes, Circle Gradient, Quantum, and Artemis artwork. Verify painted geometry including strokes, caps, joins, clipping, and artwork transforms in the main preview, header, SVG, and PNG; include GIF where supported. A clip rectangle alone proves containment, not edge contact. Add focused assertions and inspect rendered exports.

Use the complete official logo vector as a consistent source. See bar_science_notes.md and the dated checklist in rpi_brand_guidelines.md. Current implementation values are not independent evidence of official spacing.

## Integration and validation

Use one canonical selected-state collector across main preview, header, SVG, PNG
and supported GIF exports. Preserve exact selected variants, counts, directions,
phase and seeded geometry when restoring configurations. Scientific coordinates
must not be rescaled per frame to force edge contact. Fixed reference marks must
be documented as references, not fabricated encoded data.

Triangles now uses complementary cell halves,6–28cells and four directions.
Default/order: Down right, Up right, Up left, Down left. Explicit saved directions
retain their meaning; historical up/down aliases map to Up right/Down right.
Earlier rejected compositions are superseded by the published refinement.

Reconcile function-level changes to rendering, shell wiring, shared controls and
exports without dropping sibling behavior. Keep source assumptions and known
limits in project_status.md and bar_science_notes.md. Validate actual painted
geometry, renderer content and decoded exports rather than file signatures alone.

For local test reliability, a threaded development server may need a larger
connection backlog under concurrent asset requests. A successful HTTP response
alone does not establish renderer readiness. Keep test servers temporary and
shut them down after their run.

## Toolbar and contextual visual review

Reuse the app’s existing component styles. New toolbar controls must match
measured neighboring height, vertical alignment, spacing, borders, icon sizing
and treatment. Check default, hover, focus-visible, active, open and disabled
states where applicable; standalone functionality is insufficient.

Record full-toolbar screenshots and bounding boxes, including top, bottom,
height, width and inter-control gaps. Check desktop/mobile, relevant light/dark
themes, text-to-icon collapse, visible focus and keyboard access. Compare with
the established component dimensions rather than inventing a new shared height.
Record mismatches before presenting a candidate for owner review.

Review full-page hierarchy, density, typography, spacing, icon alignment, chrome
and interaction states. Preserve the app’s conventions and task-specific
choices. Keep Share minimal and clear, including its open menu; preserve labels,
focus and recovery. Avoid unrelated redesigns or competing visual patterns.

Visual review complements functional and measured checks: inspect focal order,
label legibility, the relationship between the mark and controls, and whether
additions attract unintended attention. Automated checks and a functioning
preview do not establish owner acceptance or formal RPI approval. Report visual
concerns explicitly.
