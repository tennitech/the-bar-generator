# Mission Control performance continuation — October 28, 2026

## Scope

Static Artemis rendering, same-source vector reuse, the visible splashdown timer
and lossless backdrop transport were optimized without changing artwork,
geometry, credits or export renderers. Measurements below use one Linux host;
timings from a different computer or browser build are not comparable.

## Bounded implementation

- Only static Artemis (`currentShader === 24`) skips unchanged canvas/GPU
  painting. The established p5 scheduler and other families remain in place.
  Canvas size/backing pixels, renderer identity, fit/control space, zoom/pan,
  theme, source readiness and explicit updates invalidate the one-frame cache.
  Hidden/intro/entrance suspension, visibility, page lifecycle, resize and WebGL
  context restoration invalidate it too. A missing or detached overlay cannot
  cache a permanently blank frame.
- Live Artemis uses the unchanged supplied black/white vector sources. Same-source
  recolors inherit `currentColor` without rebuilding thousands of descendants;
  transform/color DOM writes occur only when changed. The header, export source,
  raster renderers, geometry, clipping, zoom resolution and color constants are
  unchanged. The cache retains at most one source tree, not one per theme.
- The wall-time splashdown counter has at most one one-second interval, only
  while Mission Control is active and the page visible/active. Entry, visibility
  and BFCache restoration refresh immediately from wall time. Unchanged digits
  and accessible descriptions are not rewritten. Existing detail controls and
  credits are retained.
- The original 3,802,637-byte backdrop PNG is retained as source and fallback;
  modern browsers select a proven-lossless 1,852,312-byte WebP through CSS
  `image-set`. This saves 1,950,325 bytes (51.3%) without changing pixels,
  dimensions or credits. Current artwork permissions remain unresolved.

## Automated checks

Node 22.23.4 on Linux x86_64: all **367 tests in 36 suites passed**, including 21
new focused cases that execute the actual draw, SVG overlay and counter functions
in a VM. Cases include 120 unchanged scheduler calls painting once, all cache
inputs, alternate families, missing/removed overlay, hidden/intro/entrance
recovery, same-source SVG object identity, transform-write exclusion, direct
raster-path bypass, repeated setup, visibility/BFCache timers, wall-time resume,
changed-only digits and accessible descriptions. These are deterministic unit
checks, not measured browser speedups or pixel evidence. JavaScript syntax and
`git diff --check` passed.

## Same-host WebKit baseline/after

Genuine Playwright WebKit 26.5, Linux 6.18.55 x86_64, Node 22.23.4,
1440×900, normal motion, real local HTTP, no network/CPU throttle; three fresh
contexts per revision, serial runs. Baseline server used unchanged 146c84e and
the exact same profiling script as the successor. Condensed per-context measurements: [comparison](cloud_comparison.json).

| Observation | Baseline | After |
| --- | ---: | ---: |
| 1.2s idle wrapped draw time, median | 172 ms | 4 ms |
| Idle canvas repaints, range | 64–69 | 0 |
| Cold artwork-ready, median | 5,840 ms | 6,338 ms |
| Warm reload artwork-ready, median | 1,306 ms | 1,261 ms |
| White selection incl. scan, median | 890 ms | 838 ms |
| Lunar selection incl. scan, median | 924 ms | 923 ms |

The clear result is avoided idle painting (~98% less wrapped draw time here),
not a proven cold-load improvement. Three serial contexts do not establish the
cause of the modest cold difference. These include software browser/renderer
startup, assets and presentation; they are not transferable to Mac/physical GPUs.
WebKit long-task observation is unsupported, so empty lists prove nothing there.

Local desktop and touch-credit screenshots were visually inspected and remain
review artifacts rather than additional repository binaries. Baseline/after desktop screenshot pixels agree exactly in
the entire artwork area x0…1139,y56…899, left header x0…399,y0…54 and sidebar
x1140…1439,y56…899; the real wall-time counter is intentionally excluded.

Focused WebKit smoke now passes all eight normal/reduced × desktop/emulated
touch × actual WebGL2/forced2D cases, including 48 actual black/white/lunar
Standard/Large SVG/PNG encodes, theme cancellation, history, lifecycle and credits.
Five cases were verified in a separate selected-case run. [Selected results](webkit_selected_results.json)
record actual `WebGL2RenderingContext`/`WebGL 2.0` versus
`CanvasRenderingContext2D`. All eight contexts produce identical PNG bytes and
SVG bytes within each theme/size ([export hashes](export_parity.json)); the
1160×762/2320×1524 PNGs were decoded and a standard export visually inspected. A fixture first attempted to focus the counter
that existing compact CSS hides; it was corrected. The counter now also avoids
its interval while CSS-hidden, with resize-based resume. Normal-path labels do not establish physical-GPU/device behavior.

## Chromium completion and export/memory limits

[Chromium summary](chromium_smoke_summary.json) combines five confirmed first-run
cases with the [three-case terminal resume](chromium_selected_results.json): all
eight normal/reduced × desktop/emulated-touch × normal WebGL2/forced-2D cases
passed. The first run exposed a fixture precondition: reduced-motion theme
commits are immediate, but the existing URL writer is bounded at 200 ms. The
fixture now waits for serialization before navigating and testing Back/Forward;
no application URL contract or behavior changed. Per-case checkpoint files now
preserve results on interruption. Real touch taps opened/closed controls and
credits in the Chromium matrix.

Chromium live 400% zoom and pan changed both vector/canvas presentation and
restored exact Fit canvas pixels/transform. Screenshots across both matrices
were visually reviewed, including desktop, compact, reduced motion and forced
2D. [Export evidence](export_parity.json) covers 96 encoded PNGs and 96 captured
SVG files across both engines: each theme/size produces identical bytes across
its eight contexts. Decoded PNG dimensions are 1160 × 762 / 2320 × 1524, with
transparent padding, both bar edges painted and no paint outside its horizontal
domain. Black/white opaque RGB is exact; native compositing of overlapping lunar
paths rounds a few opaque channels by at most 1/255, with unchanged SVG color
constants and output stability. Mission Control's credits UI was not replaced
by download controls; encoding uses the actual production snapshot/raster path.

Two Chromium 40-recolor rounds retained the same source object and passed
unchanged post-GC DOM-node/listener assertions. Raw numeric counters/heap readings
were not saved before the later fixture failure, so no numeric heap or zero-leak
claim is made. Timer cleanup/visibility/compact/BFCache checks passed throughout.
Artemis remains non-GIF; GIF unit suites passed, but this worker did not rerun
actual looping GIF downloads or the complete 21-family browser suite. Those
remain combined-release regression gates where applicable.

## Lossless backdrop transport

[Derivation](backdrop_derivation.json) records Pillow 12.3/libwebp 1.6, exact
lossless settings, original/derived SHA256 and identical decoded RGBA hashes.
Genuine [Chromium 151](chromium_backdrop.json) and [WebKit 26.5](webkit_backdrop.json)
each decoded three alternating pairs, comparing every RGBA channel at 2048 × 2592:
zero differences. Actual CSS selected WebP alone on route entry; the complete
request list is exactly one CSS WebP, six deliberate diagnostic fetches and one
explicit PNG comparison override, not double-downloading the fallback.

The [composition check](backdrop_composition.json) found byte-identical
`.logo-container` screenshots for PNG/WebP within each engine, not merely similar
source hashes. Existing backdrop source/fallback and Maeve Marshall/BOROMIR
credits remain; no artwork/permission claim changed.

Fetch body, decode and raster-read durations are separate. On loopback Chromium's
explicit fresh-Blob median decode was 70.5 ms WebP versus 55.4 ms PNG; WebKit 85 ms
versus 89 ms. Thus the proven benefit is 51.3% less image payload, not faster decoding
or a claim that the entire cold-start issue is solved. Causal startup/network experiments were deferred to finish the verified release;
no overall cold-load latency improvement is claimed. Image timing and browser
startup numbers are not comparable to Mac hardware.

## Reproducible browser evidence

`scripts/missionControlProfile.js` records three fresh contexts, cold Mission
Control route entry and warm reload, five theme selections and a 1.2-second idle
window, at 1440 × 900. Output includes exact browser/OS/Node metadata, long-task
support, function counts/totals, overlay/counter mutation counts, document nodes,
resource transfer/duration and Chromium renderer metrics when available. Selection
time includes the intentional theme scan and automation overhead. The script is
usable against both baseline and successor servers for a same-host comparison.

`scripts/missionControlSmoke.js` prepares normal/reduced motion × desktop/emulated
touch × WebGL/forced-2D cases, covering cold/warm entry, same-source identity,
repeated/interrupted/canceled theme changes, hidden/page lifecycle timer cleanup,
shared state and Back/Forward, keyboard details, credits, actual screenshots,
SVG parse and Standard/Large PNG encoding, with export SVG equality at Fit/400%.

Cross-engine/compact/reduced-motion core checks are complete. Physical
hardware/Safari app, manual screen readers and formal RPI/asset approval are
separate; browser automation does not establish owner acceptance. The combined release uses refreshed shell/main/drawing/CSS cache references;
see the [integration record](../../bar24_26_integration_qa.md) for final checks.

## Running the focused checks

Serve the checkout over real HTTP using the existing test server, then run the
installed Playwright browser selected by `RPI_BROWSER`:

```sh
python3 scripts/test_server.py --port 8792
RPI_SITE_URL=http://127.0.0.1:8792 RPI_BROWSER=chromium node scripts/missionControlSmoke.js
RPI_SITE_URL=http://127.0.0.1:8792 RPI_BROWSER=webkit node scripts/missionControlSmoke.js
RPI_SITE_URL=http://127.0.0.1:8792 RPI_BROWSER=chromium node scripts/missionBackdropSmoke.js
RPI_SITE_URL=http://127.0.0.1:8792 RPI_BROWSER=webkit node scripts/missionBackdropSmoke.js
```

No overall startup-latency improvement is claimed.
