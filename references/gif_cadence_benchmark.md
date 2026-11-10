# GIF motion cadence — November 10, 2026

The canvas preview advances with display-driven rendering. The 30 fps GIF plan
already sampled the correct elapsed time and closed its periodic geometry;
there was no duplicated terminal frame or per-frame duration drift. Its encoded
30/40 ms holds nevertheless step more coarsely and unevenly than display refresh.
Native raster/codec evidence separates that temporal difference from alpha edges.

The candidate targets 50 fps, using exact 20 ms GIF delays for even-centisecond
loops. It keeps the encoded full duration rounded to the nearest 10 ms. An odd
centisecond total needs one 30 ms delay (a 0.625 s loop becomes 630 ms, with thirty
20 ms frames and one 30 ms frame). Existing elapsed-time phases sample the actual
hold boundaries. Requested-duration error remains at most 5 ms; no endpoint is
added. This is approximately 50 fps, not a promise of 60 fps GIF playback.

## Encoded measurements and interpretation

| Style / duration / composition | Canvas | Alpha | 30 fps bytes | 50 fps bytes | 30 / 50 fps encoding |
| --- | --- | --- | ---: | ---: | --- |
| Ticker / 2.5 s / logo | 1160 × 762 | ordered | 843,046 | 1,404,379 | 2.68 / 4.16 s |
| Ticker / 2.5 s / logo | 2320 × 1524 | ordered | 1,987,271 | 3,311,893 | 9.15 / 15.44 s |
| Waveform / 5 s / logo | 1160 × 762 | ordered | 1,538,325 | 2,562,317 | 6.22 / 11.29 s |
| Waveform / 5 s / logo | 2320 × 1524 | ordered | 3,635,329 | 6,057,584 | 22.23 / 40.38 s |
| Gradient / 10 s / logo | 1160 × 762 | ordered | 3,019,636 | 5,032,238 | 13.83 / 18.22 s |
| Gradient / 10 s / logo | 2320 × 1524 | ordered | 7,438,304 | 12,396,326 | 45.32 / 67.69 s |
| Waveform / 5 s / bar | 2320 × 464 | ordered | 1,443,244 | 2,404,496 | 7.58 / 12.67 s |
| Ticker / 2.5 s / bar | 2320 × 464 | threshold | 917,785 | 1,528,580 | 3.55 / 6.32 s |

Each pair holds style controls, ink, full padded dimensions, loop duration,
renderer and alpha conversion identical. Ticker uses 17 repeats, ratio 3,
width ratio 2, speed 0.4. Waveform uses sine, frequency 17, 750 points, speed 0.2,
LFO off. Gradient uses variant 2, speed 0.1. Ink is black. Main at `78d14f1`
provided the baseline; #150 and #151 do not change this fixed-input renderer,
codec or frame planner. A final candidate rerun reproduces Ticker's exact bytes.
The Waveform examples describe the then-live periodic renderer, not the separate
pending actual-PCM scope export. Its waveform/source changes must be measured
separately when integrated; cadence work does not replace their source contract.

File bytes grow about 1.67× in these cases. Timing is one cloud Node 24 run with
optional native canvas and serial test codec adapters, with shared CPU load.
Encoding time includes rendering, alpha preparation, yields and encoding;
independent decoding is excluded. These are observations, not native browser
worker timings, peak-memory measurements or playback smoothness guarantees.
The 20 ms plan's time-weighted average held-sample age is 10 ms versus 17 ms
for the measured 30/40 ms plan; maximum encoded hold is 20 versus 40 ms and delay
standard deviation is 0 versus 4.714 ms. These are calculated from decoded
frame delays, not measurements of a browser's presentation clock.

Sixteen actual GIFs were independently decoded through all 3400 frames, verifying
frame count, exact encoded duration, infinite repeat, transparency and disposal 2.
First/last decoded coverage matches the actual captured renderer at elapsed-time
phases. All twelve periodic family/size/composition combinations also have exact
phase-0/full-recurrence raster closure. Distinct-frame counts in the
[raw metrics](gif_cadence_benchmark.json) show real moving samples; Gradient's
symmetric fold naturally revisits states and binary alpha can repeat pixel states.
927 tests in 81 suites pass after reconciling #151, including actual codec tests
at both 30 and 50 fps, odd-centisecond timing, frame ordering and encoder cleanup.
SVG/PNG renderer and composition policies are unchanged. No browser or physical
viewer was launched, and prior browser denials were not retried.

## Resource and integration policy

Only default/maximum capture rate changes in `loopingGif.js`: 30 to 50. Its
3000-frame budget and encoder's 100-second, 32 MiB concurrent-input and 64 MiB
encoded-output guards are unchanged. At most two input frames remain in flight.
Long loops over 60 seconds can therefore use fewer samples per second; no duration
is truncated and no resolution is silently changed. These guards bound individual
resources, not total process RSS or the GIF viewer's decoding cache. Standard
reduces file/decode work; the explicit Large and both composition choices remain.

PR #144 independently changes ordered alpha to a half-coverage threshold. The
cadence repair does not modify `transparentGif.js` or overwrite that fix. The
threshold Ticker pair explicitly exercises its conversion without mixing alpha
modes between rates. Existing palette transparency has one exact ink and one
clear index: it cannot retain the canvas's partially transparent antialiasing.
Higher rate does not remove spatial teeth or diagonal pixel steps. Preserve
#144's source and tests when integrating the separate edge repair.

The actual-audio scope task owns PCM history, frozen-frame data, replay windows,
reverse, and the honest reset at recorded-history boundaries. Cadence work does
not invent a seamless mathematical cycle for nonperiodic recorded data. Future
integration must retain that contract and use the common bounded frame planner.
A separately approved Quantum duration/frame policy must also be retained;
long model cycles must not inherit an unbounded 50 fps frame count that exceeds
their policy or silently breaks their default export.

## Format limits and alternatives

GIF89a stores delay in hundredths of a second; Firefox's current normalization
maps delays at or below 10 ms to 100 ms while leaving 20 ms untouched. Thus a
nominal 60 fps schedule involving 10 ms frames can play unexpectedly slowly.
20 ms is a practical minimum target, not a universal viewer guarantee. A 50 fps
GIF still has different presentation timing from a 60/120/144 Hz canvas, and
large frames may miss deadlines on slower viewers.

For closer canvas-quality raster animation, a separate APNG export is a suitable
next option: PNG supports partial alpha, and APNG encodes rational frame delays
(such as 1/60 second), rather than GIF's fixed 10 ms increments. Actual placement
and viewer support would still need validation. No format is silently substituted
and no new export format or application dependency is introduced here.

Primary sources checked November 10, 2026:
- [GIF89a delay and transparency specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt).
- [Firefox frame-time normalization source](https://raw.githubusercontent.com/mozilla-firefox/firefox/main/image/FrameTimeout.h).
- [Display-driven animation callbacks](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- [PNG alpha and APNG rational delay specification](https://www.w3.org/TR/png-3/).

## Reproduce

Run `node scripts/gifCadenceBenchmark.js /tmp/rpi-gif-cadence` with optional
test-only `@napi-rs/canvas`. The small entry point shares the historical benchmark's
native renderer/codec adapters, actual default 50 fps planner, independent decoder
and metrics. `RPI_GIF_BENCHMARK_FILTER=ticker:large:bar` selects one pair;
`RPI_GIF_ALPHA_MODE=threshold` holds the edge fix's conversion identical in both.
The default comparison uses explicit ordered alpha to reproduce the live baseline.
The historical 24-vs-30 entry point now requests 30 fps explicitly and remains
available. New full reruns also include all three Large bar-only families.
