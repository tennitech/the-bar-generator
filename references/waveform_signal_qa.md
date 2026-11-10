# Actual audio scope QA — November 10, 2026

The owner supplied a hand-drawn carrier/envelope example and a VCO → VCA / LFO
→ VCA diagram, then requested a direct scope of actual audio with sensible x
scaling. Both original images were locally inspected; neither private image is
republished. The implementation records/renders the actual shared audio graph,
not an idealized carrier multiplied by a drawn envelope.

## Evidence and reproduction

- `tests/waveformAudioGraph.test.js` compares every oscillator, gain ramp, pulse
  message and connection event against the independent pre-refactor reference
  frozen from main `44f8992`, including 21 carrier frequency/morph combinations
  and an additional update per combination.
- `tests/waveformSignal.test.js` validates physical timebase endpoints, signed
  min/max reduction, exact live-worklet extrema, zero output, long-history
  resize/filling state, freeze identity, no-data/API-failure behavior and frozen
  SVG/PNG/GIF recording semantics. Existing transport and geometry tests remain.
- `scripts/waveformSignalLocal.js` runs the same graph in a test-only native
  OfflineAudioContext. It compares native Sine/Sawtooth/Square morph PCM to the prior graph, verifies
  actual capture-worklet output and unchanged audible samples, then rasterizes
  real exported SVG/PNG and decodes all GIF frames against independent expected
  palette/alpha data. Run with optional test-only `node-web-audio-api` and
  `@napi-rs/canvas` available via NODE_PATH; neither is a production dependency.
- The contact sheet in `review-images/waveform-scope/` is a native raster of real
  offline audio exports, clearly labeled with physical seconds and LFO rate.
  It is not a browser UI screenshot. Source signals use the actual browser-style
  graph and Pulse worklet, including real phase, pulse duty and band limiting.

Final native offline results: 90 pre-refactor/shared graph PCM comparisons have
maximum absolute error **0**. Forty-two post-gain AM-product comparisons span
.07/2/1300Hz, seven LFO folds and 25/100% depth, with maximum error
**3.7253e-9**. The native capture worklet returns **2816 exact extrema pairs**
and adds no audible output. Pulse mean is .0599667 and RMS .1 at its expected
80% duty. All **24 actual PNGs** and **six GIFs / 360 decoded frames** pass;
all GIF frame pixels match independent palette/alpha references. These are
native test-engine results, not browser/hardware listening claims.

The full suite, exact published tree/head, required CI and merge/deploy status
are recorded in the repair PR and handoff after reconciliation. The original
idealized candidate remains only in preserved local checkpoint commits and is
superseded by this actual-audio architecture.

## State and limits

Offline signals have a .25s startup settling prefix and retain two seconds beyond
the visible window for replay. At .07Hz the 28.571s physical view contains two
real envelopes. Eight-sample extrema compression at 48kHz stores 6000 min/max
pairs per second, about 1.47MB for the longest offline signal. Live storage is
similarly bounded by actual context sample rate and requested time/history.
The final 1024 bins aggregate extrema, so dense carrier cycles become their
actual amplitude band, without losing peaks by averaging. Fixed .1 gain scale
matches current audio; there is no frame-by-frame auto-normalization.

Only one offline render per controller runs at a time; requests are debounced and
stale results discarded. The main render scheduler owns playback; no extra
animation timer is introduced. Live ports post a batch about every 42.7ms at
48kHz, and unchanged history need not be rebuilt. A pending/error signal draws
no invented waveform. Offline context/Pulse support is reported; fallback to the
existing Square carrier is labeled when it affects the signal.

Pause/reduced motion holds the last actual frame and recording. Audio can keep
playing explicitly; resuming scope playback selects current real history.
SVG/PNG/clipboard freeze the displayed frame. GIF replays immutable recorded
history from the displayed phase in the selected direction, with a possible
reset when the history wraps; it is not a
promise of a seamless short common period for arbitrary Hz. Insufficient live
replay history requests more recording or SVG/PNG instead of inventing data.

Browser launching/escalation was previously denied and was not retried. Rendered
responsive UI, real touch/keyboard interaction, audio permissions/autoplay policy,
physical listening, native downloads/paste, screen-reader behavior and physical
Safari/iOS remain unverified. Native offline tests validate DSP and exports in
the test engine, not browser-engine equivalence or formal RPI approval.
