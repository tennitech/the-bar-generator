# Ring short-loop QA — November 11, 2026

## Decision

Use a disclosed scrolling-coordinate projection of the same analytic state:
`psi(u + 3q/28, q/28)`. Keep the three ribbons, fixed spatial/amplitude scales,
400 intervals, official colors, transparent edges and supplied logo geometry.
The projection now repeats in 4.28 display seconds at 1×, with matching preview
and export. Phase-zero still images are identical; older nonzero phase values
intentionally select the new view. This is not merely a cropped old animation.

Choose 50 fps over 25/30 fps for the requested smoothness. At 1× it produces 214
uniform 20 ms frames. 25 fps halves file size but doubles each motion step;
30 fps alternates 30/40 ms. SPEED remains selectable: 4× produces a shorter
1.07 s loop but changes its visible pace. There is no universal shortest or
smallest GIF independent of desired motion, dimensions and frame rate.

The 4.28 s mapping is 0.133% faster than 120/28 s, selected to fit exact uniform
centisecond GIF cadence. Display time is not a physical mass/length calibration.
No browser can be promised to present every frame on every device.

## Measured native raster and independently decoded GIFs

Run `scripts/quantumGifEvidence.js` with QA-only `@napi-rs/canvas` available in
NODE_PATH. `RPI_RING_GIF_FPS` accepts comparison cadence. This uses actual app
geometry, native Canvas rasterization and the unchanged vendored GIF encoder,
then independently decodes the result. It does not simulate a browser.

At 1×, Standard bar-only (1160×232), starting phase .37123456789, white ink:

- 25 fps: 107 frames, 305,052 bytes, uniform 40 ms.
- 30 fps: 128 frames, 364,707 bytes, 30/40 ms.
- 50 fps: 214 frames, 609,299 bytes, uniform 20 ms.

Standard full logo (1160×762), reverse, phase .9999, white ink:

- 25 fps: 107 frames, 953,402 bytes.
- 30 fps: 128 frames, 1,140,287 bytes.
- 50 fps: 214 frames, 1,906,031 bytes.

All these GIFs have exact cycle pixel closure, distinct frames, infinite repeat,
transparent disposal and 64 sampled decoded-frame hashes matching source pixels.
The terminal frame is not duplicated. Each final delay completes an ordinary
step back to the first frame. Prior measured default full logo was 32,041,719
bytes for 120 seconds; matched Standard dimensions now use about 94% fewer bytes.

`scripts/ringLoopComparison.js` compares the previous fixed-coordinate view
against the new moving view at five times, and measures every motion step at
25/30/50 fps. At a 1000×72 mark, 1× 50 fps has RMS displacement 0.3263 px,
including the seam. 25 fps has 0.6525 px including the seam; 30 fps alternates
roughly 0.4894/0.6525 px. These are shape-displacement measurements, not claims
of human perceptual equivalence. Native comparison/decoded contact sheets were
visually inspected: continuous three-ribbon detail is retained, and the new
view returns to its initial arrangement rather than cutting the prior view.

## Validation limits

The local cloud preview URL was not reachable from the separate cloud browser
(connection refused). Native pixel/codec checks and numerical/unit tests are
not a substitute for physical-device/browser motion or screen-reader testing.
The earlier full native theme/size matrix run hit the container memory limit;
completed individual cases are reported above, not claimed as a complete matrix.
No formal RPI brand or external scientific review is implied.

The [native comparison sheet](review-images/ring-short-loop/comparison.png) and
[step measurements](review-images/ring-short-loop/comparison.json) are preserved
for review. The complete unit run passed 1092 tests in 94 suites; the five
focused suites passed 93 tests again after preserving unrelated loop rounding.
Large bar-only (2320×464), red ink, 50 fps: 1,492,963 bytes, 214 distinct frames,
64 matching source-pixel references, exact loop closure and uniform 20 ms delays.
Large full logo (2320×1524), red ink, reverse at phase .9999, 50 fps:
4,503,360 bytes, 214 distinct independently decoded frames, 64 matching pixel
references, exact cycle closure and uniform 20 ms delays. Large remains selected
and is no longer silently rendered at Standard for the default loop.
