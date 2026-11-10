# Generator ASCII alignment repair — November 10, 2026

Candidate base: main `0654f5de56c3a5e33a6c17d573379351c4c19c3d`.
Branch: `codex/fix-generator-ascii-alignment`.
Cloud worktree: `/workspace/scratch/83f166ead34c/generator-ascii-alignment`.

## Source findings and implementation

The old generator path inferred complete-letter regions from a tiny alpha
sample. It sized/positioned layers with integer `offsetWidth`, `offsetHeight`,
`offsetLeft`, and `offsetTop`. Its source closure retained the first draw's
responsive scale while reading dimensions/control space later. The first p5
frame could precede the queued final controls-area measurement. These are
source-identified alignment risks; the original reported displacement was not
reproduced in a working browser in this environment.

The generator now has a separate preparation path. Home's existing `prepare`
function is unchanged. The three official paths supplied by
`buildHeaderPreviewSVG` form the R, P, I groups; all remaining selected-bar
markup, definitions and clips stay together. No lettering is drawn from a font,
no replacement proportions are inferred, and exports/bar models are unchanged.
The exact first-draw dimensions, controls reservation, fit, pan and zoom are
captured together. Setup completes its first workspace measurement before draw.

Temporary layers use fractional measured canvas bounds relative to the parent
padding origin. Each original vector group resolves independently, with a fixed
RPIGeistMono glyph lattice clipped by the exact source alpha. Only glyph choice
and group opacity change. There is no moving clip, scan line, positional noise,
new color, outline or shadow. Source preparation leaves the original visible;
the first texture frame is painted before concealment. Completion removes the
layers and releases the artwork hold in the same frame. Layout invalidation,
parameter events, input, navigation, visibility and reduced motion preserve the
existing cancellation contract. Decode failure and the 350 ms preparation
deadline expose the real artwork. Generator-only cache references are refreshed;
Home HTML, marquee runtime/styles, geometry assets and export code are untouched.

## Automated checks

- Full Jest suite: 790 tests in 72 suites pass.
- Generator/entrance regressions exercise fractional placement, correct whole
  path grouping, fixed overlay bounds during independent letter resolution,
  exact first-draw transform capture, same-frame hold release, decode failure,
  preparation deadline, layout cancellation, parameter-event interruption and
  late-decode/reentry prevention. Existing reduced-motion and Home tests pass.
- All 84 inline HTML scripts compile. Changed runtime and smoke scripts pass
  `node --check`. `git diff --check` passes.
- Existing vector/model/export unit tests pass. No rendered export or native
  clipboard acceptance is inferred from these tests.

## Browser attempts and blocker

`generatorEntranceSmoke.js` was attempted with both available engines against
the isolated worktree server. Neither engine reached a project page:

- System Chromium aborts at startup with
  `chrome/browser/process_singleton_posix.cc:297`:
  `socket() failed: Operation not permitted (1)`. The cloud execution sandbox
  disallows the required process socket. A single-process launch also fails at
  that same startup step.
- The pinned Chromium headless-shell download returned a 195-byte HTML response
  rather than a ZIP archive, so Playwright could not install that engine.
- WebKit is present but cannot launch without `libgtk-4.so.1`,
  `libgraphene-1.0.so.0`, `libharfbuzz-icu.so.0`, `libmanette-0.2.so.0`,
  `libhyphen.so.0`, and `libGLESv2.so.2`. System dependency installation requires
  unavailable root credentials (`su: System error`). The available apt package
  indexes cannot locate those packages for a workspace-local install.
- The separate CUA cloud browser cannot reach this execution environment's
  localhost server; it returns a bearer-token error from a different service.
  No user desktop or Mac was accessed, and no network restriction was bypassed.

There are **no new rendered screenshots or video** in this folder. Desktop,
mobile, normal-speed aesthetics, frame-by-frame pixel alignment, real browser
interruption/reentry, keyboard access and preview/export parity remain pending.
The code is an unverified visual candidate, not a release-ready alignment claim.
Owner aesthetic acceptance and formal RPI approval remain separate.

## Reproduce in a browser-capable cloud environment

Serve this worktree, not the concurrent marquee checkout:

```sh
python3 scripts/test_server.py --port 8001
RPI_SITE_URL=http://127.0.0.1:8001 RPI_EVIDENCE_DIR=/tmp/generator-ascii-alignment node scripts/generatorEntranceSmoke.js
RPI_SITE_URL=http://127.0.0.1:8001 RPI_BROWSER=webkit RPI_EVIDENCE_DIR=/tmp/generator-ascii-alignment node scripts/generatorEntranceSmoke.js
RPI_SITE_URL=http://127.0.0.1:8001 node scripts/exportSnapshotSmoke.js
RPI_SITE_URL=http://127.0.0.1:8001 node scripts/geometrySmoke.js
```

The new runner requires a real completed decode, records per-frame canvas/layer
bounds and parameter values/summaries, checks independent letter opacity,
compares live/vector alpha coverage, and exercises six responsive layouts
(1440 × 900, 901 × 700, 900 × 700, 390 × 844, 320 × 568, 844 × 390), DPR 1/2,
reload, keyboard, pointer, resize, live reduced motion, pagehide, BFCache-style
restore and reduced-motion startup. Its project-only screenshots and JSON are
written to the selected evidence directory. Inspect those frames at normal speed
and inspect screenshots before adding approved project-only evidence here.

## Integration notes

This worktree was created when concurrent marquee work switched the original
checkout to `codex/fix-marquee-static-focus`; that checkout and its unsaved files
were left untouched. The independent LFO task may also touch `js/main.js`,
`generator/index.html`, generator route cache references and
`references/project_status.md`. Preserve both changes during integration; the
entrance source snapshot and setup measurement must follow any final preview
transform. No deployment, merge, branch deletion or push was performed here.
