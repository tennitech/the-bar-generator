# Mission Control performance investigation checkpoint — October 28, 2026

Work stops here for the owner's laptop-to-cloud handoff. **No production optimization has been implemented, merged or deployed.** Base is published PR #57 `f8ad484`; branch is `codex/fix-mission-control-performance`. BAR24 owns marquee/Home/ASCII; BAR25 owns sidebar width and control availability. Preserve their changes and all recovery branches.

## Completed evidence

Read root AGENTS.md, README.md, contributing.md, project_status.md, dated brand checklist, bar_science_notes.md, asset_licensing.md, and relevant main/drawing/themeMotion/lunar source. `.agents` is absent; `.codex/config.toml` points to canonical AGENTS.md. Read web-perf skill; Chrome DevTools MCP is unavailable, so measurements use installed Playwright Chromium/WebKit instead. No infrastructure/dependency added.

`scripts/missionControlProfile.js` reproduces the narrow baseline profile. Serve this checkout with `python3 scripts/test_server.py --port 8792`, install existing npm dependencies as needed, then run:

```sh
RPI_SITE_URL=http://127.0.0.1:8792 RPI_BROWSER=chromium node scripts/missionControlProfile.js
RPI_SITE_URL=http://127.0.0.1:8792 RPI_BROWSER=webkit node scripts/missionControlProfile.js
```

Three fresh contexts per engine at 1440 × 900, normal motion, local HTTP on macOS ARM. Each waits for the Artemis vector, then selects lunar → black → lunar → white → lunar. `baseline.json` retains per-selection function timing totals, nodes and resource timing. Browser/OS build versions were not recorded; record these on continuation. There is no throttling. Re-measure a baseline in the new cloud environment before comparing an optimized version; cross-host timings are not comparable.

- Chromium Mission Control selection-to-scan-removal: 524–589 ms; view transition ready: 45.5–56.8 ms. This includes the intended ~420 ms scan and automation overhead, not pure rendering latency.
- WebKit equivalent: 563–606 ms and 68–86 ms.
- Each ~0.65 s observation includes 38–41 Chromium draw calls totaling 30.3–44.4 ms, despite Artemis artwork being static. WebKit sees 37–41 calls totaling 46–56 ms. This is a promising runtime cause; investigate idle drawing and style/paint costs rather than claiming a multi-second stall reproduced.
- Mission Control/white source has 7,017 document nodes; black source has 2,785. `drawLunarBarPattern` already caches by dimensions, foreground and colorMode, but switches white ↔ lunar rebuild the same white source tree just to recolor it. Header caches markup. Preserve the vector zoom/export fidelity.
- `assets/images/lunar-canvas-backdrop.png` transfers 3,802,937 bytes (3,802,637 file bytes), 2048 × 2592. A temporary `cwebp -lossless -exact -m 6` trial produced 1,853,796 bytes, without changing pixel dimensions. No derived asset was added or CSS changed. If continuing this path, prove decoded pixel identity in both browsers and retain the original/source credit and unresolved permissions; do not replace artwork or imply new permission.
- Fonts are local, about 28–31 KB each and 4–6 ms locally; no evidence they dominate. Artemis asset JS is ~694 KB transfer. Actual cold/warm network throttling and image decode measurements remain to be done.
- Chromium long-task observation saw none during sampled selections. WebKit longtask entries are unsupported: its empty array does not prove absence of long tasks.
- No page errors in either engine across all three profile runs. Screenshots were captured to temporary files but **not visually reviewed**. No unit or full regression suite run yet.

## Likely bounded fixes to evaluate

1. Avoid unchanged Artemis canvas/GPU redraws and redundant SVG transform writes. `draw()` in js/main.js currently runs every p5 frame for static styles. Use a narrowly scoped invalidation/signature strategy if warranted, including zoom/pan, canvas size/density, responsive fit/control space, color/source readiness, context restoration and return from animation/page entrance; do not stop animated families or degrade export resolution. Keep the established p5 global-state convention; avoid broad refactors.
2. Preserve live SVG nodes between same-source theme recolors using inherited currentColor, rather than reparsing thousands of descendants. Benchmark before changing; include exact pixels/source/export checks.
3. `setupLunarSplashdownCounter()` starts a one-second interval for all themes and even hidden pages. Suspend outside active visible Mission Control and resume immediately with wall time; update only changed fields. Validate no duplicate listeners/intervals after repeated entry/exit, history, visibility and page lifecycle.
4. Evaluate lossless transport compression for the unchanged backdrop with permission/credit records retained. Do not optimize by flattening intended design.

## Remaining validation

Measure cold/warm entry/switching with the same setup, CPU/render/paint and allocations/timer cleanup, network/assets/font/decode, and idle cost. Actual Chromium and WebKit visual review at desktop and responsive/touch layouts; repeated enter/exit, cancellation/history, reduced motion, keyboard and emulated touch. Verify credits retained, preview/header SVG and Standard/Large PNG/GIF behavior unaffected, numeric/neural/sidebar/GPU zoom unaffected. Add meaningful regression/unit tests, run full unit suite and relevant smoke scripts. Update project_status and focused reference docs on completed implementation. Physical device/Safari application, manual screen reader and formal RPI approval remain separate.

Temporary local server on 8792 and both browser processes were stopped. Lossless conversion completed normally. No denied or uncertain mutation remains; sandbox restrictions on git/loopback/browser launch were resolved through approved escalation. No merge/deploy/branch deletion is authorized by this checkpoint.
