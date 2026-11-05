# Whole-letter entrance review — November 4, 2026

Closes #127. Replaces the moving wipe with stationary whole-letter opacity
resolution. Both supplied Bencho reference attachments were inspected: their
held ASCII/halftone texture informed an original vanilla implementation, without
copying their React component or introducing a cube, pointer requirement or
third-party dependency.

## Rendered review

Recorded real Chromium and WebKit frames on desktop Home, Solid generator and
390px Home. Contact sheets were inspected, including intermediate frames rather
than only the finished page. This caught and corrected mobile text overlay scale.
Each R/P/I and the bar settles independently without a travelling edge. Generator
artwork does not disappear after its first renderer frame. Initial renderer
loading precedes the effect. Home's visible bars and red logo participate.

- [Home sequence](home.jpg), 100ms steps, left to right then next row.
- [Generator sequence](generator.jpg), 100ms steps.
- [Mobile sequence](mobile.jpg), 100ms steps after responsive-scale correction.

## Regression coverage

- 779 unit tests in 71 suites.
- 34 desktop/mobile, motion/reduced-motion entrance/navigation/control cases.
- Chromium and WebKit whole-letter, fixed boundary, independent opacity,
  continuous artwork, all-visible-bar/red-mark coverage and cleanup checks.
- Responsive letter font metrics checked against the scaled source title.
- Both engines: reduced-motion, interruption and repeat-entry cleanup scenarios.
- Both engines: Quantum initial/repeated entry, automatic playback and deliberate
  phase seek counts. Default stays default while looping; explicit seek counts.
- Saved-state browser cases cover Circles seed/density and Binary text restoring
  their stable initial counts and retaining counts on reload.

The cloud software WebKit renderer exposed 4–10 Home frames in some captures
versus about 20 generator frames; paint work stayed bounded, but these captures
do not establish physical-device frame-rate performance.

Physical devices, Safari application and owner aesthetic acceptance are not
claimed. Production deployment is verified separately after merge.
