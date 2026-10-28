# Circle, controls and Neural integration — October 28, 2026

This batch is saved locally on `codex/fix-circle-controls-integration`, based on
published main `ab23e3a`. This record does not claim publication, owner testing or
formal RPI approval. Shared main and all source branches remain preserved.

## Included changes

- Motion preference audit (`dcb292f`): automatic motion still respects reduced
  motion; explicit Play animation once does not save an override. Preference
  changes retain an already playing iframe, and remounts preserve usable focus.
  The reported phone had animation limiting enabled; the reported Windows
  browser was old Chrome. No platform sniffing or broad legacy-browser workaround
  was introduced, and its exact Chrome version remains unknown.
- Bounded Circles and upright Gradient columns (`efc88c0`), including inset stroke
  geometry and shared preview/export coordinates. Moving formerly overflowing
  circles inward can cause minor overlaps. Tiny stroked circles may reach their
  center; a positive path radius does not guarantee a visible inner opening.
- Separate Numeric Values/Formula sources and eight curated constants/ratios
  (`10eeea9`), with non-executing historical expression migration. Integration
  additionally rejects inherited alias names such as `constructor` and
  `__proto__`, recovering to empty Values rather than silently substituting Pi.
- Sticky grouped selector headings (`36bccad`) and short-window sidebar footer
  flow (`d70aa53`), preserving previews, keyboard navigation and card/report access.
- Quantum appears once in Dynamic after Waveform; its route/share identity remains
  `wave-quantum`.
- Configurable untrained Neural Network (`40eb9d2`): six controls, actual weighted
  forward computation, deterministic weights, activation-area and signed-weight
  encoding, complete node bounds, shared links and consistent SVG/PNG exports.

Conflicts retained both Numeric and Neural parameter/state paths and their tests.
The Numeric utility remains first in the early bootstrap dependency list. All
changed shell/runtime resource URLs use the unpublished
`20261028-circle-controls-integration` cache key; structural URL-prefix matching
remains generic. No framework or runtime dependency was added.

## Verification

- Final combined unit suite: **346 tests in 35 suites, all passed**.
- Final combined Neural HTTP/browser suite: **28 theme/extrema/header-raster cases
  per engine**, Chromium and WebKit; query/share, zero input, controls, touch,
  Reset/Randomize, zoom/export stability and fallback also passed.
- Final combined routed startup: **18 starts per engine**, normal/reduced motion
  at 320/390/1440px, Numeric inactive-value restoration, Quantum category,
  delayed-main first paint and deliberately missing-module Retry recovery.
- Before the late Neural addition, the combined tree passed Circles' 22 selected
  geometry/export states per engine, full Numeric preset/encoding/export/share
  suites, full selector suites (serial), sticky heading/theme checks and five
  styles at three short-window sizes in both engines. Neural's scoped CSS and
  model integration preserve those existing code paths.
- Final targeted `crossFeatureSmoke.js` passed in both engines: Numeric → Circles
  → Neural switching; byte-identical restored SVGs and Numeric PNG; zero Neural
  input restoration; all 21 previews; unique Quantum Dynamic placement; explicit
  intro playback and frame retention while relaxing reduced motion. No page errors.
- Final Neural short-window checks passed in both engines at 1024×360, 1280×500
  and 320×568: theme/style pointer and keyboard interaction, two-way sidebar
  scrolling, intact information card and report action without interception.
  The final Chromium narrow card screenshot was visually inspected.
- `git diff --check` passed. A temporary HTTP-server interruption was recovered
  by restarting the owned server and rerunning affected checks; no application
  startup defect remained.

Local evidence: `/tmp/rpi-circle-controls-final-evidence` (startup, Neural,
selectors, sticky, short layouts and Circles), `/tmp/rpi-numeric-chromium`,
`/tmp/rpi-numeric-webkit`, and final result logs `/tmp/rpi-cross-{chromium,webkit}.log`
and `/tmp/rpi-short-final-{chromium,webkit}.log`. These are local review artifacts,
not shipped assets.

Physical Windows/Android/iOS devices, the Safari application, the Frontify host,
manual screen-reader testing and formal brand approval were not exercised by
this integration. Browser mobile/touch emulation does not establish those checks.
No unresolved functional integration blocker was found.
