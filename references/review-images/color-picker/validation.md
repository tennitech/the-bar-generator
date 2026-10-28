# Color picker review — October 28, 2026

Implemented on `codex/feat-color-availability` from clean current main (same tree as fetched origin/main). Earlier clipboard work remains preserved on its branch. No asset or renderer changes.

## Checks

- `npm test -- --runInBand`: 299 tests, 30 suites passed.
- `RPI_SITE_URL=http://127.0.0.1:8000 node scripts/browserSmoke.js`: passed in Chromium and WebKit.
- `node scripts/colorPickerSmoke.js` and `RPI_BROWSER=webkit node scripts/colorPickerSmoke.js`: passed. Checks cover physical pointer clicks against disabled rows, arrow-key discovery and Enter/Space guards, repeated primary selection, native touch availability labels, guidance and Escape dismissal, query/shared legacy Blue plus actual SVG color, Artemis Mission Control and 320/390px touch layout. Default evidence path is `/tmp/rpi-color-picker`; override `RPI_EVIDENCE_DIR` to retain additional images.
- Source review: group headings match bar styles; secondary choices remain in the state schema for old links; no mathematical/export changes; no added animation. Existing reduced-motion coverage passes.
- The Color link is the official destination recorded in `references/rpi_brand_guidelines.md`, verified there October 27. No invented URL or Frontify account changes.

## Visually inspected images

[Primary and Secondary](chromium-primary-secondary.png), [dark theme hover](chromium-dark-colors.png), [guidance disclosure](chromium-guidance.png), [unfinished styles](chromium-styles.png), [320px touch disclosure](chromium-touch-320.png).

Native OS-picker taps are outside Playwright's rendered page; automated checks verify native select visibility, disabled flags and labels, primary selection, touch disclosure and overflow. Physical mobile devices, actual screen-reader announcements and formal owner/brand approval are not established by these checks. Temporary test servers are stopped after verification. No merge or deployment performed.
