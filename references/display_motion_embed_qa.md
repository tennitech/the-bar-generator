# November 3 combined release QA

Application baseline: published main `152add1289fcbfad9102e7a77bb5a2820dfee69d`.
The combined candidate includes display, header, motion, natural-edge and
same-page embed changes. No official mark geometry, aspect ratio, letterforms,
viewBox, scientific domain or export dimensions were changed by integration.

## Final candidate evidence

- 533 unit tests in 47 suites passed.
- All 21 canonical marquee samples matched the shared renderer.
- Chromium: 52 first-paint and 12 shared-first-paint cases, 90 geometry-edge
  cases, all-21-style browser/export smoke, 45 header layout cases, the display
  viewport/DPR/delayed-image/retry matrix, motion/Binary/natural-edge checks,
  SVG/raster geometry, Quantum, same-page embed exports, triangle/history,
  legacy shares, 18 routed startups, export snapshot, native clipboard,
  transparent GIF and marquee/Home suites passed on the combined candidate.
- The entrance/history suite passed 34 scenarios across Chromium and WebKit.
- Focused combined WebKit: all 45 header layout cases, 15 viewport/DPR
  layouts, eight delayed-image complete-frame cases, hover/reduced motion,
  image retry and same-page iframe SVG/PNG/GIF export fixtures passed.
- After the compact Replay repair, Chromium and WebKit animation lifecycle
  checks passed: frame-by-frame opacity, control placement, focus return,
  repeated opening/closing and reduced motion.
- The broader remaining browser matrix was deliberately not repeated: the
  component branches already had extensive Chromium/WebKit coverage, and the
  release was narrowed to changed behavior plus the completed regression set.
- Syntax checks and `git diff --check` passed.

## Compact animation control repair

The header follow-up hides GitHub on small screens. Final regression caught the
secret animation Replay control still measuring that hidden anchor. It now uses
the visible export-button slot when GitHub is hidden and remeasures on resize.
A regression unit test covers both compact and desktop placement. The animation
lifecycle smoke now checks usable target sizes and the visible title focus
return rather than expecting the former hidden-title behavior.

## Direction and raster proof

A browser pixel scan compared actual Ruler canvas frames with published main.
Published default moved left 5.5 px and Reverse right 6 px. The candidate default
moved right 5.5 px and Reverse left 6.5 px. The UI therefore reverses the visible
production behavior, not just an internal phase sign.

A one-row WebKit Lunar fringe is unchanged from production: identical raster
bytes for baseline and candidate, with alpha 4/12 at two bottom-edge pixels.
The geometry smoke tolerates only matching reference alpha up to 12 in that
first bottom row; stronger or farther overflow remains a failure.

## Scope and limits

- Direct SVG/PNG/GIF exports work in permitted iframe fixtures, without popup
  grants. Production Frontify lacks iframe download and clipboard delegation;
  that host restriction remains unresolved and is not fixed by this release.
- No new-tab export prompt or escape workflow is included. A separate manual
  in-page saving prototype is outside this release.
- Local Chromium and WebKit are not physical-device/native Safari testing.
  Firefox could not launch reliably in this environment. No Firefox pass is
  claimed.
- Release CI, merge, Pages deployment and exact live-file checks are separate
  publication gates. Browser fixtures do not establish production host policy.
