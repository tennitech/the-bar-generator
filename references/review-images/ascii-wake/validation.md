# Automatic ASCII wake review

Captured November 4, 2026 from this repository's local running application in
Chromium at 1280 × 800. `home.png` and `generator.png` show intermediate reveal
frames, not final artwork. Both were visually inspected, as were mobile Home and
WebKit generator frames. They use existing project assets and fonts; existing
permission/brand questions remain unchanged.

The moving wake uses the supplied Bencho source as a visual reference, without
copying its React implementation. The real semantic heading and official
vector letterforms are unchanged. No pointer movement is needed.

Checks: Chromium and WebKit desktop/mobile entrance, refresh, keyboard cancel,
resize, reduced-motion bypass, and transient-layer cleanup. The dedicated
`asciiWakeSmoke.js` checks automatic moving pixels and progressive original
clipping, unchanged semantic text, and completed animation cleanup. Unit tests
cover bounded sampling, frontier progression and stable held noise. See the PR
for any remaining limits. All 768 unit tests in 71 suites pass, and all 84 inline
scripts compile. Both focused browser scripts pass in both Chromium and WebKit
on the final runtime. Earlier concurrent checks encountered resource/process
failures; final focused checks and the full unit suite ran serially. Screenshots and software checks
do not establish physical-device testing, owner acceptance or formal brand approval.
