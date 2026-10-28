# Motion, information cards and zoom integration

October 28, 2026. Base: published `3814997`. Integration branch:
`codex/fix-motion-cards-integration`. Shared main and all source branches are
preserved. No PR, merge, push or deployment is included.

## Inputs and integration repairs

- Motion preference / one-time ASCII playback: `9a04c97`.
- Quantum phase seeking preserves transport: `1578adf`.
- Information cards for all selectable styles: `607ba0b`.
- GPU-bounded inspection snapshots: `b37196c`.

Shell, stylesheet, bootstrap, main, Quantum and drawing cache references include
the combined changes. The card utility is loaded during routed preparation and
updates the detached shell before insertion. A delayed-main probe reproduced
an empty Solid card on the Quantum route before this repair; selected Quantum
copy now exists before the canvas does.

Repeating Ruler/Ticker/Waveform loops also pause on a new OS reduced-motion
request during the session. Relaxing that preference does not restart them;
explicit Loop remains available. Quantum already has the corresponding pause
listener. One-time intro playback remains explicit and resets on reopening.

## Startup diagnosis

The earlier Chromium mobile missing-global failure did not reproduce with
successful real-HTTP requests. A controlled connection reset of
`generatorInitialState.js` produced the exact `GeneratorInitialState is not
defined` error, and the existing visible Retry recovered after the request was
restored. Normal startup runs recorded no failed requests, HTTP error responses
or page errors. This establishes the missing-dependency mechanism; the original
failed request trace was unavailable, so its exact network cause is unconfirmed.

The card smoke no longer substitutes local file responses. The reusable
standard-library `scripts/test_server.py` serves the checkout on loopback with a
128-connection backlog for parallel browser requests. This avoids older Python
servers' small default queue. No production framework, library or speculative
runtime retry policy was added.

The user's separate all-motion-off/still-logo report matches the deliberate
reduced-motion branch, which formerly hid Replay. That branch was reproduced
against the published controller. It is distinct from the test's missing-script
failure. After this release, the owner confirmed that the affected phone limits
animations and the Windows browser is a very old Chrome version. The exact
Chrome version and failing feature were not supplied. See the later
[confirmed-incident audit](motion_rendering.md#confirmed-incident-audit-october-28-2026).

## Verification

All browser checks used actual HTTP loading of the isolated checkout on port
8893, except the explicitly labeled missing-module fault injection.

| Check | Result |
| --- | --- |
| Unit suite | 321 tests, 33 suites passed |
| Quantum integration, Chromium and WebKit | Running/paused phase seeks, keyboard, pointer, 320/390px touch layouts, reverse, paused legacy shares, query history, reduced motion, deterministic SVG/PNG and stable header passed |
| Information cards, both engines | All 21 styles, 4 themes, 320/390/768px layouts, direct Quantum route and credit focus passed without file fulfillment |
| Motion preference, both engines | 32 cases each: desktop/emulated touch, normal/reduced preference, WebGL/forced 2D, explicit playback, pause/background resume, real changing ASCII frames, focus and reopening passed |
| Changed OS preference, both engines | Loops pause; relaxing preference retains pause; explicit restart works |
| Embedded intro, both engines | Same-origin iframe preference inheritance and nested ASCII playback passed |
| Final routed startup, both engines | 12 starts each at 320/390/1440px and both motion preferences; first-paint card and missing-module Retry checks passed |
| Zoom, both engines | 129 pixel cases each across 20 styles and 7 themes, constrained GPU limit, repeated zoom/Fit, buttons, percentage, wheel, mobile inspection and 2D fallback passed |
| Zoom export parity, both engines | At DPR 3, Triangle Grid Fit/400% header SVG and actual SVG/PNG downloads are identical; PNG is 1160 × 762 |

Zoom checks dispatch Chromium touch through CDP; WebKit's mobile zoom check sets
the same viewer state programmatically. These are not physical-device tests.
The maximum normalized pixel differences were 0.031609 in Chromium and 0.033418
in WebKit, within the script's 0.08 tolerance. Header/export equality is separate
from that renderer sampling tolerance.

Commands are available in README. Focused scripts:
`quantumIntegrationSmoke.js`, `barInformationSmoke.js`,
`motionPreferenceSmoke.js` (including `--preference-change-only`),
`routedStartupSmoke.js`, and `zoomSmoke.js` (including `--exports-only`).

JSON and screenshot evidence: `/tmp/rpi-motion-cards-integration-evidence`.
Card screenshots: `/tmp/rpi-bar-information-chromium` and
`/tmp/rpi-bar-information-webkit`. Desktop zoom/card composition, 320px Mission
Control card, and desktop/touch motion opt-in screenshots were visually inspected.

## Limits

No physical Windows/Android, Safari application, actual Frontify environment,
manual screen reader or formal RPI/asset approval was verified. Same-origin
iframe checks do not establish actual Frontify behavior. Actual exported files
were checked for SVG/PNG; GIF codec unit coverage passed, but the full GIF smoke
was not rerun for this integration. The selected live texture bound leaves export
planning and vector/scientific coordinates unchanged.

If motion still fails on an affected device, record browser/version, whether
`matchMedia('(prefers-reduced-motion: reduce)').matches` is true, the one-time Play
result, an explicit Loop result and the first console error. No browser-family
or user-agent workaround was introduced.
