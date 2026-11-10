# GIF frame-rate benchmark — November 10, 2026

Historical 24-vs-30 fps measurements. The later [20 ms cadence follow-up](gif_cadence_benchmark.md) records the current target; this reproduction script explicitly requests 30 fps.

The previous non-LFO exporter requested 24 fps but clamped every loop to 24–72
frames. A five-second loop therefore exported at 14.4 fps, and a ten-second
Gradient at 7.2 fps. Merely changing the target to 30 would leave those slow
loops capped. Joint LFO loops already used a separate 30 fps budget.

The candidate targets 30 fps for every eligible family using one frame-count
policy, with 2–3000 frames. It rounds the complete duration to GIF centiseconds,
then rounds the target frame count for that duration. A balanced 30/40 ms schedule
uses the existing elapsed-time phase sampler: no duplicated endpoint or stretched
loop. Fast 0.625-second Ticker loops use 19 frames over 630 ms (30.16 fps), rather
than the previous forced 24 frames. Full duration error remains at most 5 ms.
The preview transport, pattern coordinates and SVG/PNG renderers are unchanged.

## Matched measurements

Black ink, the real captured export renderer, native canvas/SVG rasterization,
and the unchanged vendored gif.js codec. Each pair retains identical controls,
loop duration and full padded export dimensions. Ticker: 17 repeats, ratio 3,
width ratio 2, speed 0.4; Waveform: sine, frequency 17, 750 points, speed 0.2,
LFO off; Gradient: variant 2, speed 0.1. Baseline source was main `47a8d95`.
All other fixture values are in `tests/helpers/exportCompositionRuntime.js`.

| Style / duration | Canvas | Previous frames / fps | Previous bytes | 30 fps bytes | Previous / 30 fps encode time |
| --- | --- | --- | ---: | ---: | --- |
| Ticker / 2.5 s / logo | 1160 × 762 | 60 / 24 | 674,993 | 843,046 | 2.35 s / 2.28 s |
| Ticker / 2.5 s / logo | 2320 × 1524 | 60 / 24 | 1,589,988 | 1,987,271 | 6.99 s / 9.95 s |
| Waveform / 5 s / logo | 1160 × 762 | 72 / 14.4 | 738,683 | 1,538,325 | 3.38 s / 5.94 s |
| Waveform / 5 s / logo | 2320 × 1524 | 72 / 14.4 | 1,745,053 | 3,635,329 | 9.96 s / 21.35 s |
| Gradient / 10 s / logo | 1160 × 762 | 72 / 7.2 | 725,472 | 3,019,636 | 2.71 s / 10.75 s |
| Gradient / 10 s / logo | 2320 × 1524 | 72 / 7.2 | 1,785,886 | 7,438,304 | 9.54 s / 37.59 s |
| Waveform / 5 s / bar | 2320 × 464 | 72 / 14.4 | 693,005 | 1,443,244 | 4.39 s / 7.43 s |
| Gradient / 10 s / bar | 2320 × 464 | 72 / 7.2 | 717,883 | 2,988,307 | 3.36 s / 15.65 s |

These are decimal bytes, not MiB. Full-logo Standard is 1160 × 762, Large is
2320 × 1524; Large bar-only is 2320 × 464. The current size default remains
Large, and the composition selector is preserved. The corresponding approximate
file-size growth is 1.25× for Ticker, 2.08× for the five-second Waveform and
4.17× for the ten-second Gradient. Other controls, speeds and LFO joint periods
can change costs substantially; file size is not a universal per-second constant.

Single cloud Node 24.22.1 runs shared CPU with other tasks. The test-only codec
adapter executes tasks serially, not in native browser workers; canvas and alpha
preparation plus adapter encoding are timed, while independent decoding is
excluded. Warm-up, scheduling and shared load cause noise (including the slight
Standard Ticker inversion). These are useful file-size comparisons and workload
observations, not browser speed guarantees or peak-memory measurements.
The raw metrics are in [gif_frame_rate_benchmark.json](gif_frame_rate_benchmark.json).

## Actual encoded verification and limits

All 16 GIFs were independently parsed and decoded through all 2,052 frames.
Each retained exact dimensions, full duration, infinite NETSCAPE repeat (`0`),
disposal 2 and transparent index 0. First/last decoded coverage matches the
captured renderer at the encoded elapsed-time phase. Distinct decoded coverage
confirms actual moving frames; Gradient's folded pattern naturally repeats some
states. The final integrated default plan/limited encoder was also rerun on a
Large bar-only Waveform: 150 frames, exactly 5000 ms, 1,443,244 bytes. Every
frame decoded, with matching first/last coverage. Its paired final timing was
3.88 s at the previous budget versus 7.66 s at 30 fps.

The streaming design still transfers at most two RGBA inputs: 7,071,360 bytes
for Standard full-logo, 28,285,440 for Large full-logo, 8,611,840 for Large
bar-only. Encoder guards reject more than 3000 frames, more than 100 seconds,
more than 32 MiB of concurrent input pixels, or more than 64 MiB of encoded
chunks. They terminate workers and report recovery guidance. Encoded chunks can
cross the cap by the last in-flight chunks before cancellation. These limits
bound individual resources, not total process RSS: canvases, worker arrays,
encoded chunk capacity and Blob creation add overhead. No silent resolution,
frame-rate or duration fallback is added. Existing LFO cycle eligibility remains
owned by the separate signal-correction change.

All 12 family/size/composition combinations also produced identical phase-0
and full-recurrence raster coverage, verifying actual loop closure.
The existing native export matrix checked 264 PNG/SVG cases after the GIF
change. The integrated theme and LFO/sidebar branch passed 890 unit tests in 79 suites,
including actual codec timing, frame ordering, duration, cancellation and all
resource-limit paths. Syntax and whitespace checks passed. Rendered browser,
physical-device playback, native download activation, perceived smoothness and
formal brand acceptance remain unverified; prior browser permission denials were
respected without retry. GIF viewers can schedule short delays differently, and
30 fps cannot eliminate temporal aliasing of arbitrarily dense/fast patterns.

## Reproduce in the cloud

With optional test-only `@napi-rs/canvas` available (no application dependency
was added), run `node scripts/gifFrameRateBenchmark.js /tmp/rpi-gif-fps` from the
candidate checkout. It recreates the old budget and compares the shipping
candidate's actual default frame plan, writes actual GIFs and JSON metrics, and
checks encoded/decoded content. `RPI_GIF_BENCHMARK_FILTER=waveform:large:bar`
selects one pair. The full script also covers Ticker bar-only on reruns.
