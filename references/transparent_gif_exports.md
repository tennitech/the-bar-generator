# Transparent exports

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
