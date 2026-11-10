# Brand color context — source and QA record

Date: November 10, 2026. Base: `0654f5d` (`origin/main` when this isolated
worktree was created). Branch: `codex/feat-brand-color-context`.

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

- All 784 unit tests pass in 72 suites, using cloud Node 24.22.1.
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
independent review with 30 focused tests passing. A fresh fetch still places
main at the candidate's original base, so no code reconciliation is needed.

Integration may overlap
`js/main.js`, `js/drawing.js`, `css/style.css`, `generator/index.html`, route
cache keys, and additive project-status documentation. Preserve the other release
work when applying this patch, especially composition-export behavior and
up-to-date cache URLs. Unit checks are rerun for the separate publication, and
review images remain outstanding until browser QA is available. The PR and merge
record carry the publication result. Deployed-source verification confirms
served files only; it does not establish native browser behavior or visual
acceptance. Existing branches remain preserved.
