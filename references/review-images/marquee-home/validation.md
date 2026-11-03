# Marquee, Home and selected-color intro review

October 28, 2026. Cloud Linux continuation of `codex/feat-marquee-home-secret`
from checkpoint `e0367685e6082db99eb6a5541ad7094ec71f8506`, based on published
PR #57. This branch is locally finished; publication/integration is coordinated
separately. No main mutation, merge, deployment or branch deletion is included.

## Source changes

The 21-family catalog, shared-renderer SVG captures, exact-black splash and native
Home remain intact. Cloud review fixes the compact-header gesture target (the
existing mobile Design controls heading), interrupted/mixed trigger sequences,
visible focus return, and modal clicks dismissing the inert background sidebar.
Home remains an ordinary link, including keyboard and modified-click behavior.

One captured state supplies each still/animation mount. Allowlisted selected ink
survives unavailable session storage; SVG/user text stays out of the iframe URL.
A failed lazy-controller request can recover on the next discovery. Invalid and
prototype palette keys cannot inject CSS. Frame messages require exact origin
and the current source window. Black artwork uses white; all other inks use
black. Explanatory UI text is black/white, and the focus ring/browser hint follows
the contrasting surface. No bar model, geometry or export sizing changed.

## Automated evidence

- Node 22: **425 tests in 43 suites passed** on the final source.
- Final `git diff --check` and JavaScript syntax checks passed.
- **WebKit: complete focused suite passed all 13 checks**, including desktop and
  emulated phone, all 21 decoded sources, black/no-gradient splash, bounded DOM,
  native Home/new tab/Back/Forward, false positives, movement/timeout cancellation,
  repeat secret opening, reduced-motion still/one-time play, focus return, all
  eight selected SVG/PNG foregrounds and actual opaque raster pixels, still/frame
  ink, browser-surface hints, repeated theme selection, wrong-origin/source
  messages, failed lazy-load retry and blocked-storage ink fallback.
- **Chromium: the same core behaviors passed across focused/scoped runs**, plus
  a genuine CDP held-touch gesture. Seven standard colors passed in the main
  focused run; the remaining Artemis/Mission Control and recovery checks passed
  in the explicitly scoped run after correcting a nested-SVG test locator.
  This is not described as one terminal full Chromium suite pass.
- All **21** stored samples match the current seeded shared renderer: **20 are
  byte-exact**. Neural has identical SVG structure and a maximum numeric delta of
  **1.1102230246251565e-16** reference units. The verifier allows at most **1e-10**
  absolute numeric difference and rejects structure/text/material geometry
  changes. No source asset was overwritten or renderer math adjusted.
- All 21 SVGs also parsed as XML, retained the 250 × 18 viewBox, used only
  currentColor/none paint and contained no external resource reference.

Commands use `scripts/test_server.py` and the repo's pinned Playwright dependency.
Cloud-only launch adapters select unchanged official browser executables and
rootlessly supplied system libraries; they do not alter app code or add browser
security flags. Servers and browsers were stopped after each bounded run.

### Native popup diagnostic

Chromium's driver cached `page.url()` as `about:blank` after the app's native
modified click, although the tab's actual `location.href`, `document.URL` and
baseURI were the correct root, with the complete home title, 240 images and
marquee screenshot. Source stayed on the generator, no click was prevented and
no script called window.open. A bare-link comparison and popup identity checks
isolated this driver-metadata discrepancy. The test now verifies actual document
location and the home landmark; no navigation interceptor/workaround was added.

## Visual evidence

The desktop/phone homes, black-on-white intro and all eight selected ink captures
were visually inspected. The contact sheets rescale sampled animation frames for
comparison; they are not cross-engine phase/pixel equality or normal-speed
physical-display acceptance.

Screenshots remain under `/tmp/marquee-home-evidence/`, not in the source tree:
`chromium-desktop-home.png`, `chromium-touch-home.png`,
`chromium-desktop-secret.png`, `chromium-ascii-sheet.png` and
`webkit-ascii-sheet.png`. The complete [WebKit structured results](webkitResults.json)
are retained with this record.

These are application screenshots using existing identity/font/artwork assets;
no external image, replacement artwork or font was introduced. Underlying asset
permissions and the existing gradient/club/mission approval questions remain.

## Limits and integration handoff

WebKit is not the Safari app. Phone emulation is not physical hardware. WebKit's
held gesture uses mouse hold in a coarse viewport followed by actual touch taps;
Chromium uses genuine CDP touch events. Screen-reader behavior, physical keyboards,
normal-speed/high-refresh/low-power display judgment and formal RPI/asset approval
remain separate. Standard ink contrast is at least 3:1 against its chosen surface
(the ASCII projection is decorative); explanatory text is 21:1. This is not a
claim of complete WCAG certification.

The final combined tree must rerun its aggregate checks after shared source/cache
reconciliation. The existing normal-motion `introLifecycleSmoke.js` is specifically
left to that combined-tree check, rather than claimed as rerun here. Chromium and
WebKit focused results/evidence originate in `/tmp/marquee-home-evidence`; scoped
runs identify their coverage explicitly. Owner testing is not inferred.
