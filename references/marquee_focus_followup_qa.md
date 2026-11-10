# Marquee selection follow-up — November 10, 2026

## Source finding and change

`bindStageFocus` originally registered callbacks for the initial ten rows once.
`syncRowVerticalLayout` can subsequently create additional rows when it fits the
field to measured hero bounds. Those rows already had their native link and
pointer handlers, so their own `is-hovered` class worked, but they could not set
the shared `has-bar-focus` state that dims neighbors. The cause is missing
selection registration, not DPR-scaled coordinates or a new clipping mask.

The same selection owner now returns a row-registration function, which is
called for every added row during initial layout and resize. Removed rows still
clear selection through existing interaction reset. Pruning a hovered repeated
link now notifies the same owner before removal instead of silently clearing
only its local pointer field. Native hit areas, clipping,
row fitting, pixel scaling and artwork geometry are unchanged.

Neighbor opacity is 0.2 for both pointer selection and visible keyboard focus.
The selected complete bar stays at 1. One cubic-bezier(0.25, 0.46, 0.45, 0.94)
transition runs for 240 ms in both directions, up from 160 ms. There is no gap
state, hold, extra delay or new animation clock. Keyboard priority, focus outline,
touch clearing, saved pause and reduced-motion bypass remain in place.

## Automated evidence and limits

`tests/marqueeResponsiveFocus.test.js` runs the actual row-fitting and pointer
selection code in a Node VM. Supplied analytic CSS-pixel bounds model the rotated
rows and hero; DOM image measurement is isolated. Cases include 1440×900/DPR1,
1920×1080/DPR2, 1230×1470/DPR2, 5120×1440/DPR2, 3840×2160/DPR2 and
7680×4320/DPR3. The tall and ultrawide fixtures grow beyond ten rows and assert
bottom-row selection/clearing. Resize coverage removes a selected extra row,
grows new rows and checks shared ownership; DPR1/2/3 with the same CSS viewport
produce identical row counts. These are code/geometry regressions, not rendered
browser or physical-display measurements.

The optional `scripts/marqueeStaticSmoke.js` now checks 20% opacity, the uniform
240 ms/zero-delay computed transition and native `elementFromPoint` targets in
bottom rows at DPR1/2. It retains keyboard, touch, static artwork and reduced
motion checks. This browser harness is **not run** here: the previously denied
browser runtime permissions remain respected. No screenshots or rendered QA
pass is claimed. The final cloud candidate on main `e19238a` passes 904 tests in 80 suites.
Final required CI and the exact release tree are recorded in the PR.

## Triangle direction inspection

The separate Triangles style already has Down right selected in native markup,
normalization, Reset and plain-query state. Explicit directions and historical
migrations remain supported. Triangle Grid has no direction control; its rows,
density, stroke and stagger are a separate lattice. Clarification is needed
before changing that lattice or adding a new orientation parameter.
