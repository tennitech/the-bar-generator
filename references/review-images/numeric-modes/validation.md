# Numeric modes verification — October 28, 2026

Base: published main `ab23e3a` (PR #50), isolated `codex/fix-numeric-input-modes` worktree.

- 326 unit tests passed in 34 suites. After final utility/query cleanup, the five focused suites passed all 41 tests.
- Final `scripts/numericSmoke.js` passed in Chromium and WebKit using the real local HTTP server. Each engine checked all eight presets in both encodings, actual SVG downloads against captured source, exact pixel equality between actual PNG downloads and independently rasterized captured SVG at the documented uniform export transform, 1160 × 762 PNG dimensions, and shared-link restoration of the same SVG.
- The same run exercised source retention across mode switching, Reset/Randomize, invalid/long input rollback, transient blank/sign/point editing, long decimal text, legacy query arithmetic/invalid text, historical v1 formula shares, reload, keyboard opening/selection of source mode, existing visible custom dropdowns, and native controls in 390/320px touch-layout emulation. No page errors were recorded.
- Final label refinement shortened the longest formula names. WebKit touch-only checks passed again and regenerated the narrow screenshot. Numeric data, values and export math were unchanged by this copy refinement.
- `scripts/routedStartupSmoke.js` passed 12 Chromium HTTP startups at 320/390/1440px with normal/reduced motion, including deliberate missing-dependency failure and Retry recovery. This checks the shared bootstrap dependency and asset-version changes.

Screenshots: `values-desktop.png` (Chromium), `formula-desktop.png` (WebKit final labels), `formula-touch-320.png` (WebKit final short labels). Reviewed the full-page desktop and narrow touch-layout screenshots for readable controls and separation of source modes. Additional local images are in `/tmp/rpi-numeric-chromium` and `/tmp/rpi-numeric-webkit`.

Early harness runs completed desktop export checks but stopped at an incorrect test-only sidebar ID. The corrected script uses the actual `mobile-menu-toggle` and passed end to end. Initial sandbox browser/server startup was blocked by macOS restrictions; approved local execution enabled the checks. No denied approval was bypassed.

These are software checks on Mac Playwright engines. They do not establish physical Windows/Android/iOS, real mobile keyboard/clipboard, manual screen-reader, Safari application, color-contrast audit or formal RPI approval. No merge or deployment was performed. Temporary server is stopped after completion.
