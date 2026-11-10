# Brand color context — source and QA record

Date: November 10, 2026. Base: `0654f5d` (`origin/main` when this isolated
worktree was created). Branch: `codex/feat-brand-color-context`.

## November 10 owner correction: preview-only color and text helper

This correction supersedes the earlier description of brand-colored headers.
It starts from main `05655f6`, preserving the released six-feature batch and
PR #134's exact brand palette, secondary-only visibility and native modal.

The supplied reference `libfile_da87fca16404819181f7ed4ee89bbf16` resolved to
`Screenshot 2026-11-10 at 11.25.03 AM.png` (U+202F before AM in the actual
filename). Current Library materialization was used; the local file's Library
identity was applied and verified. The PNG decoded as 2048 × 1592 RGBA, and its
actual pixels were visually inspected before image-dependent changes. Both the
header pixel at (1000, 50) and preview pixel at (1000, 170) were
RGBA (214, 0, 28, 255), showing the red composition filling both regions.
SHA-256: `7a4091bdc73c8d2fac39af95ab8525950ffe987fec52221ebd62d2d403d4583a`.
The screenshot remains local reference evidence and is not redistributed.

The owner explicitly requests matching header/sidebar surfaces and restricting
the composition background to the preview. The theme helper clears former
inline app/header overrides; CSS uses the sidebar surface for every header
layout, with neutral header ink on touch as well as desktop. Palette definitions,
preview ink/background, geometry, export behavior and other features are retained.

The helper is now underlined red sentence-case “How to use”, without an icon,
background or border. It retains native button semantics because it opens a
modal rather than navigating. Its touch area is transparent. Secondary-only
visibility and all modal content/behavior are unchanged.

All 833 tests in 77 suites pass. Source comparison confirms the palette and
complete modal markup are unchanged; 26 entrypoints and 80 inline scripts pass
cache/syntax verification. Focused checks exercise theme restoration clearing stale header colors, exact
palette and export preservation, and the existing modal lifecycle. The existing
browser harness now checks header/sidebar equality at desktop/touch widths and
the helper's label, underline, color, transparent background and lack of icons.
It is syntax-checked; rendered browser QA remains blocked by the previously
recorded Chromium socket restrictions and missing WebKit libraries. No denied
browser command, dependency installation or sandbox bypass is attempted.

Owner test items after publication:

- At desktop and phone widths, switch among primary and secondary choices:
  the preview keeps each documented pairing while header and sidebar match.
- Open and close the phone controls sheet; verify neutral header ink and surface.
- Verify “How to use” appears only for secondary choices as underlined red text,
  with no icon or visible background, and opens the existing modal.
- Check Tab focus, Escape/Close/backdrop dismissal, narrow-screen scrolling and
  reopening, then confirm normal theme switching and exports still behave.

[PR #137](https://github.com/tennitech/the-bar-generator/pull/137), its required
checks and Pages deployment carry the release state. A fresh Git fetch confirms
main 05655f6 is the functional candidate's direct parent (zero commits behind);
there are no file conflicts to resolve. The candidate is reviewed and the full
suite is rerun before the PR synchronization update.
Live-file hash verification establishes deployed source, not rendered appearance
or native device behavior. Existing branches remain preserved.

## Supplied references

All five user-provided PNGs were materialized into this executor through the
current Library skill, their Library identity attributes were applied and
verified, and readable pixels from every file were visually inspected before
image-dependent changes:

| Library reference | Resolved filename | Evidence used |
| --- | --- | --- |
| `libfile_ff0a24112c38819187bbb6ca1b295c78` | Screenshot 2026-11-10 at 10.20.10 AM.png | Three primary composition examples |
| `libfile_6ce10e982fcc81918ef52b7175f07654` | Screenshot 2026-11-10 at 10.20.33 AM.png | Primary RGB/hex values |
| `libfile_514370d4a97081918f94ac1e00433ff5` | Screenshot 2026-11-10 at 10.20.41 AM.png | Six secondary foreground/background examples |
| `libfile_c0c59754a7c08191af4115aa0d9915ae` | Screenshot 2026-11-10 at 10.20.51 AM.png | Secondary RGB/hex values and exact usage copy |
| `libfile_9dd234767da88191b80a69201e2bcf99` | Screenshot 2026-11-10 at 10.39.58 AM.png | Accessibility guidance and color contrast table |

Filenames above show an ordinary space before AM for legibility; Library's
resolved filenames use U+202F there. The reference PNGs remain local evidence;
they are not added as application assets or redistributed in this patch.
Existing official logo geometry, fonts, asset notices, and outstanding permission
records are unchanged.

The [requested Brand Hub page](https://brand.rpi.edu/d/pfJS6BKVKBeq/brand-guidelines#/-/color/secondary-colors)
was attempted through web retrieval but returned an internal/accessibility error.
No fresh live-page review is claimed. The supplied pixels and repository's
October 27 brand record ground this change.

## Composition mapping and compatibility

| Share key | Visible name | Foreground | Background |
| --- | --- | --- | --- |
| `black` | Black on White | `#000000` | `#FFFFFF` |
| `white` | White on Black | `#FFFFFF` | `#000000` |
| `white-on-red` | White on Red | `#FFFFFF` | `#D6001C` |
| `red` | Red on White (limited use) | `#D6001C` | `#FFFFFF` |
| `gray-on-red` | Gray on Red | `#B9CCD8` | `#D6001C` |
| `blue` | Silver on Blue | `#E1EDF5` | `#0081CE` |
| `gold` | Black on Gold | `#000000` | `#CDAC38` |
| `gray` | Red on Gray | `#D6001C` | `#B9CCD8` |
| `silver` | Blue on Silver | `#0081CE` | `#E1EDF5` |
| `gray-on-black` | Gray on Black | `#B9CCD8` | `#000000` |

Mission Control remains its existing separate illustrated environment. Link Blue
is not offered as an invented logo composition. Red on White remains explicitly
limited per the repository's brand record and supplied accessibility example.
Large-logo example colors are not reused for small UI text; header text uses
black or white with adequate contrast. Secondary usage guidance applies to all
six secondary choices, including the ones with red or black backgrounds.

Historical one-word secondary keys remain valid but now select the documented
composition, rather than an isolated colored mark on an approximate neutral.
The formerly misleading `white-on-red` legacy alias now resolves literally to
White on Red. Existing Black on White / White on Black / Red on White aliases
remain accepted. The primary white-on-red and two additional gray compositions
have explicit new keys. The native select, restored state, keyboard color cycle,
and runtime share keys use the expanded common mode list.

Preview and header backgrounds use the selected composition's exact published
hex values. Existing transparent mark-only SVG/PNG/GIF and clipboard behavior is
preserved; only the actual ink and its filename color change with the theme.
This patch does not implement or replace the separately developed composition
export feature. It does not change bar geometry, pattern math, or animation.

## Executed checks

- The original candidate passes 784 unit tests in 72 suites in cloud Node
  24.22.1. After preserving the PR #132 Home release, all 789 combined tests
  pass in 73 suites.
- Focused palette verification drives the real export snapshot function and
  checks SVG ink, dimensions, and filename ink against the composition.
- Modal controller regression coverage checks all contextual choices, one-time
  setup, open, title focus, Close, cancel, backdrop dismissal, drag rejection,
  restored primary selection, scroll reset, queued-close/reopen focus safety,
  and keyboard propagation isolation. Existing sidebar regression coverage also
  checks that native modal clicks cannot dismiss the mobile editor behind it.
- Modified JavaScript and generator inline scripts pass syntax checks.
- All route stubs load matching shared utilities and the current shell version.
- Exact supplied modal bullets and link match the requested text.
- `git diff --check` passes.

The mocked controller tests do not prove native browser focus trapping, inert
background behavior, layout, responsive overflow, touch dismissal, rendered
contrast, or raster appearance. Browser QA was already blocked by Chromium's
`socket() failed: Operation not permitted (1)` and missing WebKit Linux libraries;
no denied launch, dependency installation, sandbox bypass, or local-browser
fallback was retried for this branch. No application review PNG was produced.
Reduced-motion and physical-device rendered checks remain unverified.

The updated existing smoke script is ready for a working browser environment:

```sh
RPI_SITE_URL=http://127.0.0.1:8140 RPI_BROWSER=chromium \
  RPI_EVIDENCE_DIR=/tmp/bar-brand-color-evidence node scripts/neutralThemeSmoke.js
```

Run against this checkout's server at desktop and 375px phone width. The script
checks native modal state, focus containment, Escape, close, backdrop dismissal,
reopening, scrolling, contextual theme changes, exact preview/header colors,
neutral UI contrast, screenshots, and transparent PNG corners. It has been
syntax-checked, not executed here.

## Release coordination

The full change package is code, route cache updates, the two focused regression
checks, this QA/source record, the dated brand-reference supplement, and the
additive project-status section. There are no new brand assets or screenshots.

The owner subsequently authorized this change as its own reviewed PR to main,
without waiting for the initial six-feature batch. The parent reports an
independent review with 30 focused tests passing. The first release fetch still placed main at the
candidate's original base. Main then advanced to `69488d7` (PR #132) during
publication. That static Home release was merged into this candidate; the only
conflict was additive project-status documentation, resolved by preserving both
complete sections. Its Home code, styles, tests and cache URLs remain intact.

Integration may overlap
`js/main.js`, `js/drawing.js`, `css/style.css`, `generator/index.html`, route
cache keys, and additive project-status documentation. Preserve the other release
work when applying this patch, especially composition-export behavior and
up-to-date cache URLs. Unit checks are rerun for the separate publication, and
review images remain outstanding until browser QA is available. The PR and merge
record carry the publication result. Deployed-source verification confirms
served files only; it does not establish native browser behavior or visual
acceptance. Existing branches remain preserved.
