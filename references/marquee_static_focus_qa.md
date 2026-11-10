# Static marquee selection QA — November 10, 2026

## Scope and interpretation

Base: `0654f5de56c3a5e33a6c17d573379351c4c19c3d` (`main`).
Branch: `codex/fix-marquee-static-focus`.

The popup present in this base is the startup instruction pill (“Select a bar
design below to get started”), not a per-bar tooltip. Its delay changes from
5000 ms to 450 ms. The removed button is the separate hero Enter generator link.
Bar anchors retain the displayed catalog sample's style and query parameters;
keyboard entry retains the initial skip link and generator style picker.

Other complete bar links dim to exactly 50% opacity. No row filters, image lifts,
animated preview canvases or additional preview model clocks run. The existing
scroll/drag transport and entrance remain independent. No generator runtime,
ASCII entrance, model, export or artwork asset was edited.

## Completed checks

- `npm ci --ignore-scripts --no-audit --no-fund`: passed.
- `npm test -- --runInBand`: **787 tests, 72 suites passed**, Node 24.22.1.
- `node --check` for changed runtime and smoke JavaScript: passed.
- `new Function` compilation of both changed Home inline scripts: passed.
- `git diff --check`: passed.
- Lint, typecheck and build: no configured commands; the application has no build step.

The new VM-backed unit regression creates every catalog sample anchor, checks
its exact generator destination and SVG source, rejects animated SVG markup,
and verifies no preview renderer or canvas is created. Focus lifecycle tests
hold a lane through pointer leave and resume it after blur. Existing catalog
parity, lane physics, generator and entrance regressions still pass.

## Browser blockers — no rendered pass or screenshots

`npx playwright install chromium webkit` could not install Chromium:

```text
Error: End of central directory record signature not found. Either not a zip file, or file is truncated.
Failed to install browsers
Error: Failed to download Chrome for Testing 151.0.7922.34 (playwright chromium v1234)
```

The preinstalled cloud Chromium was then used through the smoke harness:

```sh
RPI_BROWSER_EXECUTABLE=/usr/bin/chromium node scripts/marqueeStaticSmoke.js
```

It failed before loading a page:

```text
browserType.launch: Target page, context or browser has been closed
FATAL:chrome/browser/process_singleton_posix.cc:297] Check failed: . socket() failed: Operation not permitted (1)
ptrace: Operation not permitted (1)
```

The independent WebKit install downloaded successfully. Its missing libraries
are `libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libharfbuzz-icu.so.0`,
`libmanette-0.2.so.0`, `libhyphen.so.0` and `libGLESv2.so.2`.
`npx playwright install-deps webkit` attempted to switch to root, then failed:

```text
su: System error
Failed to install browser dependencies
Error: Installation process exited with code: 1
```

The separate cloud browser opened `http://127.0.0.1:8000/` and showed
`{"detail":"Missing or invalid bearer token."}` rather than this checkout.
No authentication, sandbox or network restriction was bypassed. No Mac was used.

## Ready-to-run browser regressions

Start the repository server, then run these sequentially in a cloud environment
with working browser sockets and Linux browser dependencies:

```sh
python3 scripts/test_server.py --port 8000
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/marqueeStaticSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit node scripts/marqueeStaticSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/marqueeControlsSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/marqueeDragSmoke.js
```

`RPI_BROWSER_EXECUTABLE` can select a compatible existing browser for the static
and controls checks. `RPI_MARQUEE_EVIDENCE` selects the screenshot/results folder;
the static check defaults to `/tmp/marquee-static-evidence`.

The static check verifies prompt timing, absent Enter generator button, all exact
sample links, scrolling with invariant artwork, four repeated hovers in both
lane directions, full image bounds, 50% opacity, no blur/lift/canvases, keyboard
focus priority, lane hold/resume, reduced motion, native bar and skip navigation,
history and mobile touch at 390 × 844, 320 × 568 and 844 × 390. The controls/drag
checks retain pause persistence, storage failures, keyboard motion controls,
no-script entry and captured off-row gestures. These browser scripts are
prepared but **unverified in this environment**. Owner visual acceptance and
physical-device checks remain outstanding. Keep the PR draft; do not merge or deploy.
