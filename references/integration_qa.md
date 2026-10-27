# Integration verification

Updated October 27, 2026. This records software verification, not formal RPI
approval, owner acceptance or complete accessibility/physical-device testing.

## Integrated behavior

The combined application retains published Artemis(PR25), mobile(PR26/32),
Quantum(PR27), entrances(PR28), motion(PR29), patterns(PR30), sharing(PR31) and
geometry/transparent exports(PR33). One selected-state collector preserves
variants, triangle count/direction, phase and packing seed across preview,
header and exports. Official geometry and scientific domains remain fixed.

UI glyphs use 19 exact licensed Feather 4.29.2 sources, including the export busy
indicator. Native export-size controls use 16px text and explicit 44px touch
height. WebKit Cancel activation restores focus to the visible Download trigger.
See [icon provenance](icon_provenance.md) and [review images](review-images/integration-validation.md).

Query and fragment writes share a 200ms scheduler. Copy link captures current
controls immediately. Navigation cancels stale edits; a validated same-origin
session handoff preserves a pending edit on immediate reload. Consumed or empty
handoffs are cleared, including back/forward-cache return. The lifecycle
regression simulates cache callbacks and then performs a real reload.

## Passed checks

- 290 unit tests in 28 suites; exact Feather source hashes and static glyph geometry.
- Complete Chromium sweep: 23 suites. Complete WebKit sweep: 16 suites. Release
  packaging/lifecycle follow-ups:11 Chromium and4 WebKit suites, all passing.
- 52 startup/load/error cases,12 shared first-paint cases and34 entrance/navigation
  scenarios, including delayed assets, Retry focus, no-JavaScript and reduced motion.
- 31 family/variant geometry cases in both engines, actual downloaded SVG/PNG
  content comparisons, exact painted edges, confinement and fixed 21-unit gap.
  86 rendered control/phase boundary cases passed in Chromium.
- 50 selected pattern states per engine, both inks and triangle count endpoints,
  exact selected SVG/header geometry, PNG pixels/interiors/masks and live preview.
  WebKit references use the same default canvas backend; tolerances were not relaxed.
- All 21 families share/restore actual SVG content in both engines; eight themes,
  history, legacy links, Unicode, malformed recovery, clipboard fallback and text safety.
  Four triangle directions, two variants and historical aliases/omissions retain meaning.
- Native Quantum reverse/seek, deterministic SVG/PNG, paused restored transport,
  legacy query history, phase/speed editing and reduced motion.
- Four moving header families at DPR 1/2/3: unchanged letter pixels, persistent
  nodes and moving bars. Three loop families retained 45/45 header/preview cadence
  after the intentional entrance hold, with speed/reverse/pause continuity.
- Portrait/landscape/mobile layouts, native pickers, keyboard focus, simulated
  keyboard viewport, orientation, menu/theme surfaces and editor focus. Chromium
  touch emulation exercised real two-finger viewer pinch and page pinch outside it.
- Three GIF families at both sizes in both engines: every frame independently
  decoded, alpha/palette/disposal/edges/timing checked. Chromium native decoding
  checked first/last frames; WebKit native bitmap decoding checked the first.
  GIF has binary alpha; PNG retains smooth partial alpha.
- Triangles and Quantum retained exact request-time PNG bytes, size, name, ink,
  phase and variants while controls changed during held decoding; SVG also froze
  its captured state. Progress, duplicate prevention, cancel/retry and focus passed.
- 24 icon theme/viewport cases per engine, labels/focus and full-toolbar context.
  Neighbor top alignment matched; established gaps were 8px mobile/10px desktop.

Temporary test browsers and servers are closed after each run. The pull request
records exact-head CI and the subsequent merge/deployment verification.

## Limits and human checklist

Physical Safari, real software keyboards, screen readers, high-refresh/low-power
hardware and continuous real-time motion judgment remain separate. Screenshots,
automated checks and source review do not establish institutional asset rights.

- Reopen shared triangles at counts 6/28 in all directions and compare downloads.
- Inspect Artemis at Fit/400% in Black, White and Mission Control; switch away/back.
- Seek Quantum to the same phase and compare exports; restored transport stays paused.
- Inspect GIFs on light, dark and checkerboard backgrounds; compare Standard/Large.
- Try phone rotation, viewer pinch, keyboard editing, Share/Escape and intro controls.
- Check final placement clear space and fine-pattern legibility independently.
