# Scope history/X-scale transition QA — November 10, 2026

Historical evidence: the November 11 LFO removal supersedes the modulation
behavior and old checks described here. Use [current QA](waveform_lfo_removal_qa.md).

Owner live feedback confirmed the actual-audio view works but identified a brief
sparse waveform followed by increasing density after each parameter edit. Source
inspection reproduced the mechanism: configure() cleared PCM and reallocated
the ring; tick() chose min(available, requested) seconds; geometry drew that
partial duration across the full bar. This was an X-axis presentation error,
not an audible synthesis error.

## Corrected contract

- Live PCM is one continuous post-gain recording, including actual parameter
  ramps. Edits retain its bounded history. The ring holds the maximum supported
  28.571-second view plus two replay seconds even while short views are selected.
  Only the selected window/history tail is copied for a frame.
- A selected timebase is fixed at its requested extrema-pair count. Partial
  coverage N/M occupies [1-N/M, 1]; unknown history is blank, with recorded
  seconds and the blank-area meaning shown. Added packets extend coverage on
  that same scale, with min/max bin count proportional to coverage so display
  resolution does not coarsen as more history arrives. Changing rate can select a different timebase once.
- A window spanning a requested edit says “includes parameter changes.” It does
  not claim all historical samples use the new parameters or place a
  sample-exact marker on an asynchronous edit. The label clears when the old
  portion has left the visible window.
- Silent edits retain the previous actual frame with a previous-settings label
  while the latest complete render is prepared. Stale/failing jobs do not erase
  it. Complete data replaces it once, without interpolating waveform values.
- Freeze holds exact data/timebase/export recording through edits, incoming
  samples, mute and render completion. Previous settings remain labeled. Resume
  selects current live history or the latest completed offline rendering.
- Source labels distinguish live, recorded and offline audio. SVG/PNG use the
  same actual coverage bounds; no polygon spans unknown time. GIF keeps its
  existing history minimum, selected direction, 50fps planning and encoder
  guards. Audible graph and ramp code is unchanged.

## Verification

`tests/waveformScopeTransitions.test.js` exercises partial-packet physical
spacing and blank bounds, repeated shape/depth/carrier edits, several rate
changes, on/off/zero-depth settings, preserved long history, wraparound, source
handoffs, mute, stale/failed offline work, freeze and resume. Existing
waveform signal/transport/export regressions remain in place.

`scripts/waveformScopeTransitionsLocal.js` renders the actual shared graph in a
native OfflineAudioContext and rasterizes partial-history SVG/PNG exports using
the existing native exporter adapter. Eight encoded PNGs at Standard/Large and
.0625/.25/.5/1 seconds recorded all retain a one-second X window and zero ink in
unrecorded regions. The review contact sheet crops only transparent export
margins and preserves bar proportions; it is not a browser screenshot.

Run with optional test-only node-web-audio-api and @napi-rs/canvas available:

```sh
NODE_PATH=/tmp/rpi-lfo-qa/node_modules node scripts/waveformScopeTransitionsLocal.js
```

The integrated native audio/export matrix also passes 90 exact prior/shared
PCM comparisons, 42 AM-product cases, 24 PNGs and six GIFs through all 600
decoded frames with the retained 50fps cadence and newer edge quantization.
The final full-suite and exact-head CI results are recorded in the PR and handoff. No production dependency or new audio processor was introduced.
Previous browser restrictions are respected; no denied browser escalation was
retried. Native source/raster/codec checks do not establish browser layout,
physical listening, touch, screen-reader behavior or native download acceptance.

## Live owner checklist

1. Start Audio and move carrier shape/frequency and LFO shape/depth repeatedly.
   Expect continuous history, stable spacing at the selected timebase and a
   temporary “includes parameter changes” label; no full-width sparse refill.
2. Change 2Hz to .07Hz, then toggle LFO off/on and try fast rates. The selected
   window may reframe once. After 30 seconds of live audio, long history should
   already be available. On fresh startup, missing time stays blank at the left
   while the displayed window duration remains fixed.
3. Mute and make repeated edits. Expect a labeled previous offline frame while
   rendering, then one complete replacement. Unmute: source becomes live when
   real data arrives, with fixed-axis blank coverage if history is still missing.
4. Freeze, change controls, mute/unmute and wait. The frozen shape and timebase
   stay fixed with an appropriate previous-settings/source label. SVG/PNG should
   match it. Resume should show current real data. A GIF with insufficient replay
   history should give its existing recovery message; full-history GIF playback
   should retain its current cadence and captured starting frame.
