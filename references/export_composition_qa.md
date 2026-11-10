# Export composition implementation and QA

November 10, 2026. Local, uncommitted work on
`codex/feat-export-composition`, based on fetched `origin/main`
`0654f5de56c3a5e33a6c17d573379351c4c19c3d`.
Worktree: `/workspace/scratch/83f166ead34c/the-bar-generator-export-composition`.
Other worktrees were not edited. No commit, push, PR, merge or deployment is included.

## Behavior

Two illustrated native radio cards choose **Bar + RPI** or **Bar only**.
Their diagrams reuse the official paths, rather than redrawing the lettering.
The cards use existing theme/surface/type tokens, wrap inside the existing
scrollable responsive menu, and have checked radio, inset border, focus and
forced-color states. There is no new animation. Accessible labels and a
fieldset legend describe the choice; the diagrams are decorative.

Bar + RPI and Large remain the defaults. Selection persists for this generator
page across menu open/close and style synchronization; reload keeps the existing
default policy. Both composition controls lock with the existing job controls.
Changing a control during asynchronous preparation cannot change the frozen
requested composition, dimensions, pattern data, seed, ink or resting origin.

| Composition | SVG viewBox | Standard PNG/GIF | Large PNG/GIF |
| --- | --- | --- | --- |
| Bar + RPI | `-20 -20 290 190.4885` | 1160 × 762 | 2320 × 1524 |
| Bar only | `-20 112.4885 290 58` | 1160 × 232 | 2320 × 464 |

All outputs remain transparent, with proportional 20-reference-unit clear space.
Only the export viewport changes; the official bar, clip, scientific coordinates,
nested artwork and natural gaps do not move or stretch. SVG/PNG copies share the
same snapshot and native MIME paths as downloads. Bar-only names include
`bar-only`; complete-mark names are unchanged. Still files retain the existing
resting phase zero. Existing animated Ticker/Waveform/Gradient GIFs remain downloadable
with Bar only selected, with the same loop settings and binary transparency.
Ruler remains static and does not gain an unsupported GIF action.

## Automated and offline evidence

- `npm test -- --runInBand --no-cache`: **802 tests, 72 suites passed**.
  Log: `/tmp/rpi-export-composition-unit.log`.
- Focused export suites: **45 tests passed**. They cover repeated selection,
  mutual selection, menu/style synchronization, both sizes, job locking/recovery,
  frozen snapshots, title escaping, filenames, all 22 selectable families and
  all eight existing inks, unchanged bar fragments, encoded-input blockers,
  GIF transforms, MIME payloads and synchronous clipboard activation. Explicit
  tests confirm the GIF action stays offered for Ticker/Waveform and sends
  bar-only dimensions, filenames and payloads to the download-request handler.
- Changed JavaScript and all **81** Home/generator inline scripts compile.
  `git diff --check` passes. There are no application build, typecheck or lint
  commands in this static project.
- `node scripts/exportCompositionLocal.js /tmp/rpi-export-composition-evidence`
  runs offline native raster/codec QA. It requires the environment's optional
  test-only `@napi-rs/canvas`; it is not added to package.json or the application.
  The unchanged trusted vendored codec runs in the local Node realm to avoid
  VM per-pixel overhead. Browser DOM, URL, ImageData transfer and clipboard adapters are explicitly
  bounded to the APIs used by the production export code. No browser is launched
  and no operating-system clipboard is read or written.
- **264 actual encoded PNGs passed**: 22 families × black/white/red × both sizes
  × both compositions. Decoded pixels verify dimensions, transparent padding,
  letter/bar gap, complete lettering only for the full mark, no paint outside the
  viewport, and ink (at most one byte of native SVG rasterizer rounding).
  Bar-only pixels match an independent explicit crop viewport oracle exactly.
  `png-results.json` retains the matrix. No colored background/matte is baked in.
- **Eight complete GIFs passed**: Ticker/Waveform × both sizes × both
  compositions. All **528 frames** were independently decoded and matched their
  expected full-frame RGBA palette coverage exactly, including transparency,
  disposal and no residual lettering in bar-only. Existing nondefault controls
  were used (17 Ticker repeats, ratio 3; Waveform frequency 17). Standard example
  GIFs also change between initial/mid-loop frames in Pillow.
- **12 actual clipboard-adapter payloads passed**: SVG/PNG × both sizes × repeated
  bar/full/bar selection, changing the live selection while preparation runs.
  Native MIME, frozen SVG source, actual PNG dimensions/composition and alpha
  match the captured request. `results.json` retains all eight GIF and 12 payload
  results. These adapters do not establish browser download receipt or OS
  clipboard/paste success. The PNG matrix was retained between QA-adapter-only
  refinements; application source did not change between those checks.
- Example actual SVG/PNG exports, looping GIFs and a white-backed export contact
  sheet are under `/tmp/rpi-export-composition-evidence/`. The SVG examples parse
  as standalone XML. The contact sheet was visually inspected for correct
  lettering, bar-only composition, proportions and clear space; it is not a
  rendered menu screenshot.

## Unavailable rendered QA

Browser launch/socket escalation had already been rejected in this cloud
environment. It was not retried, bypassed or replaced with another browser
launch. Rendered menu/theme/responsive layout, real keyboard/arrow/touch behavior,
manual screen readers, browser downloads, browser clipboard writes and native
paste acceptance remain **unverified**. Source semantics and offline native
raster evidence do not substitute for those checks. No physical-device, owner
acceptance, asset-permission clearance or formal RPI approval is claimed.

## Integration with concurrent work

Apply the focused diff onto the combined candidate and reconcile shared chunks;
do not replace entire files from this worktree. In particular:

- `js/utils/exportOptions.js`: add composition normalization, label and viewport
  helpers; retain the optional third `dimensions(size, geometry, composition)`
  argument and unchanged complete-mark defaults. Preserve concurrent filename
  improvements while retaining the bar-only identifier.
- `js/drawing.js`: preserve `composition` and frozen `viewport` in the snapshot;
  omit letters only for bar-only; use viewport origin for PNG and GIF. Keep any
  concurrent animation/current-settings fixes in the collector and frame renderer.
  The change does not alter `js/main.js` or motion math.
- `js/utils/exportUi.js` and `js/utils/logoClipboard.js`: retain composition radio
  listeners, busy locking, selected-size dimensions, clipboard dimensions,
  accessible action labels and captured-result descriptions. Preserve concurrent
  export progress/recovery work.
- `generator/index.html`: insert the fieldset inside `export-settings` before
  Image size. `css/style.css`: the additive `export_composition*` block sits with
  existing export settings. Sidebar changes elsewhere in this file are independent.
- Reconcile all shell/runtime cache keys to a single final integration version.
  This candidate uses `20261110-export-composition` for the shared shell, CSS,
  changed export utilities, drawing.js and generatorBootstrap.js. The root
  `index.html` prefetch and bootstrap fallback point to the same shared shell.
- Keep additive documentation in README, project_status, bar_geometry,
  bar_science_notes, clipboard_exports and transparent_gif_exports. New tests are
  `tests/exportComposition.test.js`, `tests/helpers/exportCompositionRuntime.js`
  and additions to exportOptions/exportUi tests; the optional offline harness is
  `scripts/exportCompositionLocal.js`.

The following style route files have cache-reference-only edits (the shared
composition markup lives only in `generator/index.html`):

`generator/binary/index.html`, `generator/circles/index.html`, `generator/circles-gradient/index.html`, `generator/fibonacci-sequence/index.html`, `generator/gradient/index.html`, `generator/graph/index.html`, `generator/grid/index.html`, `generator/lines/index.html`, `generator/lunar/index.html`, `generator/morse/index.html`, `generator/music/index.html`, `generator/neural-network/index.html`, `generator/nucleotide/index.html`, `generator/numeric/index.html`, `generator/point-connect/index.html`, `generator/ruler/index.html`, `generator/runway/index.html`, `generator/solid/index.html`, `generator/ticker/index.html`, `generator/triangle-grid/index.html`, `generator/triangles/index.html`, `generator/truss/index.html`, `generator/union/index.html`, `generator/wave-quantum/index.html`, `generator/waveform/index.html`

## Incremental main release reconciliation — November 10

The isolated release starts at main `04194d6a4f96aeb67d0d679a24ffad758ba6610e`
and preserves the published brand color sources, exact color menu and native
guidance dialog. Drawing keeps the expanded brand ink filename mapping. The
new fixture loads the actual shared theme palette and covers all its schemes.

- Full regression: 809 tests in 74 suites pass, without Jest cache.
- Offline integrated verification: 264 actual PNGs, eight complete GIFs / 528
  independently decoded frames, and 12 clipboard-adapter requests pass.
- Ten changed JavaScript files and all 84 inline scripts parse. Whitespace passes.
- Logs: `/tmp/export-release-jest.log`, `/tmp/export-release-raster.log`; raster
  evidence: `/tmp/rpi-export-release-evidence/`.
- Browser/OS validation limits above still apply. No denied browser action was
  repeated. PR 133 and all original candidates remain untouched.

## Final reconciliation with published motion release

PR 133 was independently merged as main `05655f68e7a94d31a6c2188b914b3513e6ad0178`
while this PR was being prepared. Its exact main, pattern, loop planner, LFO,
brand palette, ASCII and marquee sources are preserved. Export changes in
drawing.js are confined to composition capture, letter omission and viewport
translation. The Gradient renderer fixture now supplies its captured viewport.

Final verification: **854 tests in 78 suites pass**; **264 actual PNGs**,
**12 complete GIFs / 816 decoded frames** (Ticker, Waveform and Gradient at both
sizes and compositions), and **12 clipboard-adapter requests** pass. Eleven
changed JavaScript files and all 84 inline scripts parse. Cache references agree;
whitespace passes. The brand menu and guidance dialog match published main.
Logs: `/tmp/export-release-r2-jest.log`, `/tmp/export-release-r2-raster.log`;
evidence: `/tmp/rpi-export-release-r2-evidence/`. Browser and native OS limits
above remain unchanged. Original source candidates are retained.
