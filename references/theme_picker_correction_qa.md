# Compact theme picker correction

November 10, 2026. Base: main `78d14f16f94851cc8cee152ceb6e72d154d00421`.
Branch: `codex/fix-theme-picker-style`; prior branches are preserved.

## Inspected references and comparison

Both owner-supplied Library files were resolved, materialized through the current
Library skill, identity verified, decoded and visually inspected before changes.
No reference PNG is redistributed in the repository.

| Library reference | Local filename | Bytes / dimensions | SHA-256 |
| --- | --- | --- | --- |
| `libfile_e6fcc34d314c8191ad25fdd52a8379b0` | Screenshot 2026-11-10 at 1.03.06 PM.png | 58,595 / 664 × 656 RGBA | `5841e1885037867803d57124c7718a41b642df98a1be24d16c6fa781499b4257` |
| `libfile_a30b29ba84f8819187646db2c90596cd` | image(20261110-180425).png | 217,627 / 1000 × 649 RGB | `31b55273ed42deef471b43cee5fa72bb8a6dc3398a4681351bfbedab42461270` |

The first image shows the rejected large bold title-case labels and circular
checkmark. The second shows compact monospaced labels against their actual
foreground/background bands, with normal-text approval classifications.
Pre-redesign source `df359fd` was compared directly: compact RPIGeistMono row
font, uppercase transformation, padding, 44px minimum row height, group layout,
closed trigger and original sidebar selection check are restored. Mobile sizes
continue to inherit the existing responsive control rules. There is no new
swatch tile, type system, circular marker or new choice.

## Pairing correction

The retained brand choices are Black on White, White on Black, White on Red,
Black on Blue, Black on Gold, Black on Gray, Black on Silver and Gray on Black.
Mission Control retains its existing separate palette. Every brand pair is
shown as approved for normal text in the reference. The table’s Red on White
row remains excluded under the owner’s earlier instruction, and rows marked
“Do Not Use” are not offered. No unlisted pair is inferred from individual colors.

Exact brand hex values remain unchanged. Blue, Gray and Silver now use black
foregrounds. Unsupported Gray on Red is removed and normalizes to White on Red;
query and v1 snapshot recovery preserve other controls, names and runtime.
The prior red/red-on-white neutral recovery is retained. No additional choices
are introduced during this minimal correction.

The existing pair/export test verifies preview and SVG foreground agreement.
Every retained pair is checked against 4.5:1 normal-text contrast rather than
PR #149’s large-text threshold. Two-tone hover and active cues retain exact row
colors; the original selected checkmark uses the approved foreground. Existing
keyboard/touch handlers, ARIA state, modal content/lifecycle, compact help focus,
neutral header and shared export geometry are untouched.

## Validation and owner checks

All 926 tests in 81 suites pass, including 56 focused checks in four suites.
Changed JavaScript and all 80 inline scripts pass syntax checks; all 26 generator
entrypoints have consistent cache references. Source comparison confirms the
pre-redesign base option rules, unrelated CSS and modal are preserved. The export
freeze test now switches to retained White on Red, so its before/after ink change
remains meaningful after the pairing correction. CI and Pages exact-head
results and live-source hashes accompany the release report.

The optional browser harness now checks compact uppercase monospaced labels,
44px minimum rows, the original selected pseudo-element and absence of circular
markers, along with pair colors and hover/active states. It is syntax-checked
only. Chromium socket and missing WebKit library restrictions remain; no denied
browser route is retried. No rendered application, physical-device or screen-reader
pass is claimed.

Owner checks: compare compact text/spacing to the prior picker on desktop and
phone; inspect hover, active and selected rows; select every retained pair and
compare its preview; try older red and gray-on-red saved links; check menu
scrolling, forced-colors mode and the secondary guidance popup.
