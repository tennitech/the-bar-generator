# Official secondary composition audit

Audited November 10, 2026. Initial base: main
`096410ff932a0c97163551aa6072c56e52398f6a` (transparent GIF edges, following audio scope and GIF cadence releases).
Branch: `codex/fix-official-secondary-pairs`. Earlier branches remain preserved.

## Current official authority

The [official Secondary Colors page](https://brand.rpi.edu/d/pfJS6BKVKBeq/brand-guidelines#/-/color/secondary-colors)
was opened and visually inspected in the permitted cloud browser. The visible
six-panel logo graphic, its explicit descriptive alt text and the adjacent color
value table agree. The page reports last modified October 29, 2026 at 10:29 AM.
The verified graphic URL is
[the official six-panel SVG](https://media.ffycdn.net/us/rensselaer-polytechnic-institute-rpi/4aTzPsNnjwRTMzTjooCk.svg?width=900).

The generic web reader could not access this dynamic page and a focused search
returned no results. The requested direct visual inspection succeeded in the
cloud browser. No blocked generator browser or live-file network route was used.

| Allowed secondary option | Logo foreground | Composition background | Filename ink |
| --- | --- | --- | --- |
| Gray on Red | `#b9ccd8` | `#d6001c` | gray |
| Silver on Blue | `#e1edf5` | `#0081ce` | silver |
| Black on Gold | `#000000` | `#cdac38` | black |
| Red on Gray | `#d6001c` | `#b9ccd8` | red |
| Blue on Silver | `#0081ce` | `#e1edf5` | blue |
| Gray on Black | `#b9ccd8` | `#000000` | gray |

These are the complete secondary choices shown in that graphic, not additional
combinations inferred from individual palette colors or the separate contrast
table. Link Blue is a listed color value but is not one of these logo pairings.
The three existing primary examples remain unchanged; Red on White stays removed
under the owner's earlier instruction. Mission Control is an existing separate
mission treatment and is not classified as a secondary brand choice.

## Independent screenshot check

Both original user-supplied screenshots were materialized through the current
Library skill, their identity applied and verified, readable bytes decoded and
actual pixels inspected before implementation. They agree with the current page.
No reference image is redistributed as a repository asset.

The raster example contains small RGB differences from the written color values,
and its Silver/Blue tile samples a gray-looking foreground. Exact app hex values
therefore follow the explicitly named pairing and the current official HEX table,
not sampled raster colors. The current page identifies that pair as Silver/Blue
and defines Silver as `#E1EDF5`. This distinction is retained as source evidence.

| Library reference | Resolved filename | Bytes / dimensions | SHA-256 |
| --- | --- | --- | --- |
| `libfile_514370d4a97081918f94ac1e00433ff5` | Screenshot 2026-11-10 at 10.20.41 AM.png | 395,475 / 1928 × 1482 RGBA | `04a6bca49fd1678d6b4d8cfb8ae140456c82d38068eace39ab4200869b10e0a6` |
| `libfile_c0c59754a7c08191af4115aa0d9915ae` | Screenshot 2026-11-10 at 10.20.51 AM.png | 546,868 / 1966 × 1408 RGBA | `7d881d1dea62b65920b39ccbcdb7bfff25bce7de9dbefe6729f27ff06d352d45` |

## Corrections and saved-state behavior

PR #150 incorrectly treated the contrast table as permission for secondary logo
compositions. Correct Black on Blue to Silver on Blue, Black on Gray to Red on
Gray, and Black on Silver to Blue on Silver. Restore the wrongly removed Gray on
Red choice. Black on Gold and Gray on Black remain unchanged. No brand hex value
is changed, no additional pair is inferred, and no primary/mission option is removed.

The existing stable keys `blue`, `gray`, `silver` continue to load, now with the
correct official logo/background pair. Existing snapshots retain names, other
controls and runtime. `gray-on-red` is once again directly accepted by startup,
runtime and v1 snapshots; its mistaken migration to White on Red is removed.
Retired `red`/`red-on-white` still recover to Black on White. Unknown query modes
use the existing default; unknown snapshot choices still reject rather than
silently altering unrelated data. Default composition remains Black on White.

## Picker, preview and export audit

`themeModeUtils.COLOR_SCHEMES` remains the single composition source. The native
secondary optgroup is tested against exactly the six metadata entries above.
`applyColorScheme` sets the preview foreground/background; main and drawing
routines read that same map. No color-specific replacement map is introduced.

Idle picker rows stay neutral. Hover, selection and keyboard-active rows reveal
the actual background plus a small border-free ink mark in the exact logo
foreground. The mark is decorative and hidden from assistive technology; option
names and selected ARIA state remain unchanged. It is hidden on idle rows.
Compact labels/checkmarks and the single focus outline use black or white UI
text chosen for normal-text contrast. The mark has at least 3:1 non-text contrast;
the UI label has at least 4.5:1. UI text color is not used as the logo/export ink.
This follows the usage guidance to keep typography legible without inventing a
new logo pairing or enlarging labels. No nested tile, new font, asset or focus stop.

Still/GIF/clipboard export snapshots derive actual foreground and RGB from the
composition map; filename ink is derived from that captured foreground. Tests
exercise actual SVG capture and filename construction for every brand pair.
Files remain transparent under the existing export contract; composition
backgrounds are contextual preview surfaces, not newly painted export fills.
The animation payload carries the same actual foreground explicitly; its
existing resolver honors that captured ink. Export geometry, GIF cadence/edge
logic and actual-audio waveform capture are unchanged.

## Validation and release limits

All 939 tests in 83 suites pass, including 76 focused checks in six suites.
JavaScript, inline syntax, cache and source-preservation checks are completed
before publication. Regression coverage checks exact six-choice allowlisting, native
labels, preview/SVG foreground agreement, actual filename ink, saved-state
preservation, mark versus label contrast and existing modal behavior. No new
unit-test count expansion is necessary. The optional browser harness checks the
actual ink mark separately from UI text in selected, hover, keyboard and idle
states, and is syntax-checked only.

The official guideline page was actually rendered and inspected. Application
rendering, native keyboard/touch/device and screen-reader behavior remain
unverified under the known browser restrictions. The previously cancelled/403
live-file verification route is not retried. CI, exact tested/merged Git-tree
identity and Pages deployment are independently verified through authorized
GitHub tools; those do not establish served-file hashes or application rendering.

Owner checks after deployment: compare all six logo previews to the official
six-panel graphic; inspect ink marks on hover/selection/keyboard focus; load old
blue/gray/silver and Gray on Red links; check exported foregrounds and filenames,
modal guidance, touch selection and neutral idle rows.
