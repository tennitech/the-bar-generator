# Transparent exports

## Current composition choices — November 10, 2026

The illustrated **Bar + RPI** / **Bar only** selector applies to all downloads
and image copying. Bar + RPI and Large remain the current defaults (superseding
the historical Standard default recorded below). The historical complete-mark
sizes remain unchanged. Bar-only retains a 1000/2000 px nominal bar width on a
1160 × 232 / 2320 × 464 canvas, including 80/160 px transparent padding per
side. Its SVG viewBox is `-20 112.4885 290 58`; artwork coordinates are unchanged.

Current GIF availability is Ticker, Waveform and Gradient; Ruler is static.
Each supported loop uses the captured crop consistently on every frame. The
same binary-alpha palette, full-frame disposal, streaming, cancellation and
loop plan remain in use. Bar-only filenames add `bar-only`; complete-mark names
are unchanged. No theme-colored matte is added. See [composition QA](export_composition_qa.md).

October 27, 2026. This document records export behavior and local validation; it does not establish formal RPI approval.

## Sizes and placement

| Choice | Nominal logo width | Complete PNG / GIF canvas | Transparent padding per side |
| --- | --- | --- | --- |
| Standard | 1000 px | 1160 × 762 px | 80 px |
| Large | 2000 px | 2320 × 1524 px | 160 px |
| SVG | Scalable vector | Default viewport 290 × 190.4885 units | 20 reference units |

PNG and GIF use the same selector. Clipboard actions and their explicit fallbacks are documented in [clipboard exports](clipboard_exports.md). Standard is the default. The official 250 × 18 reference bar scales uniformly from the supplied 500 × 36 design area; see [shared bar geometry](bar_geometry.md). Raster heights round upward to whole pixels without stretching the artwork. PNG renders vector paths directly at the selected resolution. SVG retains paths and its vector viewBox; the raster size choice does not reduce its resolution.

There is no application-defined print DPI or physical print size. The person placing the mark must preserve the official minimum size and clear space at the final display or print size. Embedded padding scales with the mark; it does not universally establish the required 0.25-inch print clearance. Complex bars need a legibility check at their actual placement size. See the dated source record in [RPI brand guidelines](rpi_brand_guidelines.md).

## GIF transparency and timing

GIF is offered for the existing Ruler, Ticker, and Waveform loops. It supports binary transparency, not PNG's smooth partial alpha. The encoder uses one exact foreground color and a different reserved transparent palette entry. A fixed 4 × 4 ordered coverage mask converts antialiased edge coverage into spatially anchored opaque or transparent pixels. No white, black, or theme-colored matte is baked into the edge. This preserves average coverage but can show fine stippling or jaggedness at high magnification. Use PNG for smooth static transparency or SVG for scalable static geometry.

Every frame uses the same global palette and transparent index. Disposal mode 2 clears the preceding full frame to its transparent background before the next one is composed. The implementation uses the existing pinned, MIT-licensed gif.js worker codec. No new runtime dependency or format is added.

Frame counts and the requested loop period still come from `loopingGifUtils`. Delays distribute the period across GIF's 10 ms clock, with a minimum 20 ms per frame. The complete loop differs from the requested duration by at most 5 ms. Preview speed controls are unchanged. This does not remove temporal aliasing at dense, fast settings or guarantee that every viewer honors short GIF delays.

Two worker tasks stream transferred RGBA buffers. The live input-frame budget is at most two frames: about 7.1 MB Standard or 28.3 MB Large. This is not a total process-memory bound: canvas backing stores, worker internals, encoded chunks, and browser overhead also consume memory. The old strategy would retain roughly 1.02 GB of Large RGBA data for 72 frames.

### Measured export cost

One Chromium browser encoded a dense, enveloped Waveform with 72 frames and a five-second loop. Measurements were taken on the development MacBook Air while other BAR tasks could run concurrently; they are observations under that workload, not isolated performance guarantees. Both downloaded files were independently decoded through all 72 frames and checked for transparency and disposal.

| Choice | Encoding and download-initiation time | File size | Sampled peak Chrome process RSS | Increase from case baseline | Largest 50 ms heartbeat gap |
| --- | --- | --- | --- | --- | --- |
| Standard | 1.46 s | 729,836 bytes | 880 MB | 272 MB | 95 ms |
| Large | 3.12 s | 1,947,362 bytes | 992 MB | 251 MB | 87 ms |

RSS sums the test browser's reported processes, including its page, rendering and worker overhead. The two cases shared one browser, so their baselines differ; the smaller Large increase does not mean Large requires less total memory. Sampling at 250 ms can miss short peaks. Both sizes were practical in this test. Standard remains the default; Large is explicit and gives finer binary-alpha edges at a higher encoding/memory cost. There is no silent resolution fallback.

## Download state and names

One export runs at a time. The popover shows real prepared and encoded frame counts for GIF and an indeterminate preparation state for PNG/SVG. Cancel aborts future work, terminates GIF workers, and suppresses download initiation. Native PNG encoding already in progress cannot itself be interrupted; its result is discarded after cancellation. Errors re-enable the controls for retry. Completion says “download started,” since the page cannot observe the user's file-save completion.

Exports capture the selected controls, color, phase, optional title, and size before asynchronous work begins. The optional title reads the existing Share name field when available; this feature adds no second name field. SVG stores the escaped title in a non-rendered `<title>` element. It does not add a visible name lockup or dump source text into metadata.

Names follow `rpi-bar-{family}-{variant/key-controls}-{ink}-clear-{1000w|2000w|vector}[-loop][--custom-title].{format}`. The suffix is optional. Titles use NFC Unicode normalization, remove controls and bidi overrides, preserve letters/numbers/marks, collapse unsafe punctuation into hyphens, avoid reserved device names, and truncate on grapheme boundaries within a UTF-8 byte budget. The filename is descriptive, not a complete reproducible share-state record.

## Verification

Unit tests decode the actual vendored codec output, checking palette indices, transparency, disposal, moved-pixel cleanup, timing, streamed frame order, buffer transfer, cancellation, and worker-error cleanup. Focus tests model native blur when a focused button is hidden or disabled, including actual Cancel activation.

`scripts/transparentGifSmoke.js` passed on the export branch for all three GIF families at both sizes: independent full-frame coverage hashes, Chromium native first/last-frame decoding, exact painted horizontal edges, PNG partial alpha and dimensions, SVG vectors, duplicate prevention, cancellation/retry, focus, and reduced-motion state. The decoded GIF opaque colors exactly matched the selected ink on every frame. White/black/checkerboard composites were visually inspected at both sizes: no matte-colored halos were visible, while Standard showed the expected fine binary-coverage stippling. A separate five-second, 72-frame benchmark produced the measurements above. The existing Chromium browser and motion scripts also passed. Checks after reconciling subsequent main changes are recorded with the pull request; this branch-local run does not by itself validate every future integration.

GIF cannot preserve smooth partial transparency or overcome every viewer's timing behavior. No physical Safari, assistive-technology, high-refresh-display or low-memory-device validation is claimed by these automated Chromium checks.

## Ruler edge correction — October 27, 2026

The owner corrected the earlier strict painted-edge interpretation for Ruler. Its natural tick rhythm may leave edge whitespace inside the unchanged 250 × 18 viewport; fixed end caps are removed across preview, header, SVG, PNG and GIF. The frame is never stretched or shifted to force contact. GIF checks retain exact dimensions, full-frame coverage parity, transparency, disposal and no overflow; only Ruler is exempt from mandatory edge-column paint.


## Gradient loop — November 10, 2026 (local candidate)

Gradient joins Ticker and Waveform as a GIF-capable family; Ruler is stationary.
Its 0.02–0.4 cycles/s coverage sweep exports one exact phase cycle in either
direction, using the same primitive geometry as the live preview/header. It
inherits transparent-palette, disposal, frame budgeting, size and cancellation
behavior. SVG/PNG/clipboard use phase zero, preserving each original static stripe
variant. The default 10-second GIF contains 72 frames; frame-delay quantization
retains the existing loop timing policy. No gradient-specific browser export
validation is claimed here because the local browser runtime is blocked; see the
project status and `scripts/gradientMotionSmoke.js` for the remaining check.


## Waveform LFO — November 10 local candidate

Enabled visible LFO adds its selected amplitude waveform to GIF frames. Below
5 Hz, capture uses an exact joint carrier/LFO period at 30 fps, up to 100 seconds
and 3000 frames. Fine SPEED values can require longer joint cycles; those
configurations use the LFO cycle mean with one carrier cycle instead. Input streaming remains bounded
to two frames; total encoding time and encoded data can grow substantially for
long periods. Cancel still stops work. At 5 Hz and above, the GIF bar uses the
LFO cycle mean and the existing carrier period to prevent alias beats at capture
cadence; audio is never included. See [the visual sampling policy](bar_science_notes.md#visual-waveform-lfo--november-10-2026).
Disabled LFO preserves the existing frame plan. Unit checks cover joint-cycle
closure; browser download/decoder and cost validation remain blocked by the
current cloud sandbox and must be completed before publication.

## Approximately 30 fps — November 10, 2026

The non-LFO 24–72-frame budget is replaced by a duration-based 30 fps target,
using the existing balanced centisecond delays and actual elapsed-time phases.
All eligible Ticker, Waveform and Gradient loops now share the bounded frame
policy, including short/fast loops and existing joint LFO plans. Up to 3000
frames/100 seconds are accepted; two concurrent input frames stay within 32 MiB
and encoded chunks within 64 MiB before cleanup. These are individual resource
limits, not a total browser-memory guarantee. SVG/PNG, current Large default,
transparent padding, captured controls and composition choices are unchanged.

Matched real renderer/codec measurements show roughly 25% more bytes for a
2.5-second Ticker, 108% more for a five-second Waveform and 317% more for a
ten-second Gradient. Large full-logo examples at 30 fps are 1,987,271, 3,635,329
and 7,438,304 bytes respectively. See [complete measurements, actual decoded
checks, timings and caveats](gif_frame_rate_benchmark.md). Viewer timing and
dense/fast temporal aliasing still limit perceived smoothness.

## 20 ms temporal cadence — November 10, 2026

The default target is now approximately 50 fps. Even-centisecond periodic loops
use 20 ms holds; odd totals add one 30 ms hold while retaining the encoded full
duration within 5 ms of the request. The existing 3000-frame and independent
encoder limits remain, so long loops may sample below 50 fps. Transparency,
SVG/PNG and composition/size choices are unchanged. PR #144 remains responsible
for the separate edge-quantization repair. See [actual matched 30-vs-50 exports,
encoding cost and viewer limits](gif_cadence_benchmark.md).
