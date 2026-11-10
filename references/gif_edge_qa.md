# GIF straight-edge diagnosis and verification

The owner’s Library screenshot is a magnified black Waveform animation over a
light/blue background. Its otherwise vertical edges have repeated teeth;
several other edges remain straight. A still screenshot cannot establish motion
cadence; the original GIF and viewer zoom are not available. The image was
materialized through the current Library helper,
readable bytes verified, and its actual pixels inspected. It is not republished.

The shared waveform geometry already emits exact one-sided discontinuities.
The GIF exporter then replaced partial alpha using a 4 × 4 ordered coverage
mask. At fractional-pixel edges, identical source coverage becomes alternating
opaque/transparent pixels along the edge. Magnification exposes the same teeth
as the supplied screenshot. Native raster/codec comparisons reproduce this
spatial failure independently of browser frame timing or audio.

The default now uses a uniform half-coverage cut. GIF retains one exact ink,
one transparent palette entry, disposal 2 and no matte. Raster edges round at
half coverage, with at most half-pixel boundary displacement; curved/diagonal
edges still have binary-alpha pixel steps. SVG and PNG retain their existing
smooth coverage. Scientific coordinates, official bar geometry, audio and LFO
math, frame planning, cancellation and worker streaming are unchanged.

## Evidence

![Native rendered and encoded before/after edge comparison](review-images/gif-edges-before-after.png)

This generated sheet is an enlarged nearest-neighbor crop of actual decoded
GIF pixels from the repository’s captured export renderer and vendored codec.
It contains original primitive bar geometry and labels, no user screenshot,
external image, replacement identity asset or bundled font. Existing underlying
brand-asset questions are unchanged. The light-blue comparison background is
added only to this review image, never to exports.

Run `node scripts/gifEdgeEvidence.js /tmp/rpi-gif-edge-evidence` in an environment
with optional test-only `@napi-rs/canvas`. No application dependency is added.
It exercises eight phases per case to inspect edges, not full-speed cadence.

- 20 actual GIFs / 160 decoded frames: old and corrected conversion for Waveform
  square and square/pulse, Standard and Large, Bar only and Bar + RPI; plus
  Ticker and Gradient Standard bar-only controls.
- All frames match their prepared renderer pixels after actual codec decoding;
  dimensions, exact palette, transparency, disposal 2 and 40 ms sample delays
  are checked. These sample sequences are not a benchmark of export loop speed.
- Straight plateau interiors in all 64 original Waveform source frames have
  zero row-to-row alpha changes. The ordered conversion adds 21,440 differences
  across those bands; the corrected 64 encoded frames add zero.
- `tests/transparentGif.test.js` uses an independent area-coverage rectangle
  oracle at eight translating fractional positions, encodes/decodes three exact
  foreground colors, and verifies every pixel plus disposal/transparency/timing.
- Full suite after preserving PR #141 and #142 at main `97d70f4`: 888 tests /
  79 suites pass (initial baseline: 875 / 78). Syntax and whitespace checks pass.
  No native browser, physical viewer, clipboard or audio playback validation
  is claimed; existing browser denials are respected.

`review-images/gif-edges-results.json` preserves per-case measurements. The
current 50 fps cadence and encoder limits remain intact; the separate actual-audio
LFO task owns PCM capture, scope history and replay changes. Retain both when reconciling overlapping files.

## Current-main reconciliation and browser baseline

The continuation retains main `492fec2` (#143–#153), including 50 fps / 20 ms
planning, all encoder guards, newer controls and themes. `main.js`, `drawing.js`,
`barPattern.js`, `loopingGif.js` and the stylesheet are byte-identical to that
base. Only GIF alpha quantization and its utility cache key change runtime
behavior. The full suite now passes 928 tests in 81 suites; syntax, whitespace
and the repeated native 20-file/160-frame comparison pass. Its image and
measurements remain byte-identical to the original evidence.

The parent independently confirmed jagged live-browser GIF edges versus the
antialiased PNG. A supported cloud-browser path is now available; no denied
local-browser call was retried. This continuation also downloaded a real public
production GIF through the visible export menu: Waveform Pulse, frequency 10,
LFO off, default SPEED, Standard, Bar only, Black on White. Independent decoding
checks all 166 frames, dimensions 1160 × 232, 3330 ms duration, 20/30 ms delays,
exact black ink, transparent palette, disposal 2 and fixed bar bounds. The
455,925-byte baseline has 43,140 row differences in its straight interior bands
(maximum 520 in one frame). Deployed corrected-GIF verification follows merge
and is recorded in the PR release evidence. No native-audio or physical-viewer
perceptual pass is implied.

## Actual-audio scope integration

PR #154 landed during reconciliation and is retained at main `ffbd569`. Audio,
LFO, actual PCM scope, geometry, rendering, 50 fps planning and control/style
source files remain byte-identical to that base. The final suite passes 939
tests in 83 suites. With corrected alpha, `waveformSignalLocal.js` also passes
90 original/shared audible-graph PCM parity cases, 42 AM-product comparisons,
exact silent side-tap capture, 24 PNGs and six actual-scope GIFs through all
600 decoded frames. This explicitly covers the new production scope renderer.
The earlier 20-file edge comparison uses the retained historical geometry
fixture to isolate straight discontinuities; it does not substitute that
geometry for the current actual-audio scope. The original screenshot baseline
was downloaded before #154 deployed; it records the original edge defect.
