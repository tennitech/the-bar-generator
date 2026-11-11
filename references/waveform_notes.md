# Note-based Waveform model — November 11, 2026

## Model and assumptions

The control selects the 61 chromatic notes C1–C6, MIDI 24–84. We use scientific
pitch notation (middle C is C4) and twelve-tone equal temperament with A4 =
440 Hz. These are explicit tuning conventions, not universal properties of
music, acoustic instruments, or every synthesizer's octave labels.

For MIDI note m, the target frequency is `f = 440 × 2^((m − 69) / 12)` Hz;
the fundamental period is `T = 1/f` seconds. Values come from the equation,
never from rounded chart entries. `waveformNotes.js` is the single authority.
Its immutable 61-entry table is evaluated once and used by the controls,
audio, scope, URL/share migration and decorative selector geometry.

- C1: 32.70319566257483 Hz; 30.578051463771438 ms per cycle.
- C6: 1046.5022612023945 Hz; 0.9555641082428574 ms per cycle.
- C6 is exactly 32 times C1 in the mathematical model. The slight mismatch in
  the owner's whiteboard division comes from separately rounded operands.
- 30.5 ms is an approximation, not the correct one-decimal rounding (30.6 ms).
  Using 30.5 ms as a synthesis period would raise C1 by about 4.425 cents.

## Whole-cycle horizontal window

Let `f1` be C1's unrounded target frequency. Choose `N = max(1, round(f/f1))`
and use the horizontal duration `N/f`. **Only the count N is rounded.** The
pitch is never retuned to force a fixed time window. C1 through C6's octave Cs
show 1, 2, 4, 8, 16 and 32 cycles in the same C1-duration window. C#3 shows
4 cycles in about 28.861837 ms.

Other equal-tempered semitones do not have integer frequency ratios to C1.
A fixed C1 window, every chromatic note in tune, and only whole cycles cannot
all be satisfied. The selected policy changes the time window when the note
changes and states that choice in the UI. It has deliberate count thresholds:
G1 has 1 cycle in 20.408401 ms; G#1 has 2 in 38.525931 ms. The window is not
uniformly close to 30.578 ms and must not be described as fixed. It stays fixed
within a selected note; there is no per-frame painted-bounds fitting.

The interval can start at any phase and still span N periods. The display
uses a rising crossing of the actual generated PCM as a helpful initial
trigger. Fractional crossing times are linearly interpolated between adjacent
PCM samples. Motion then sweeps one signal period at the independent selected
visual speed. It is slow sample playback, not a claim to show a physical
32–1047 Hz vibration at the screen refresh rate. Reverse affects only the
visual sweep, not audible pitch or audio time.

## Audio and sampled visualization

Sine, Sawtooth and Square are native Web Audio oscillators. Pulse is now a
native PeriodicWave oscillator, replacing the naive discontinuous pulse
worklet. The positive part occupies duty D; its unnormalized bipolar pulse
has mean `2D−1`. We remove DC and supply the first 2048 Fourier harmonics:
`a[k] = 2 sin(2πkD)/(πk)` and `b[k] = 2(1−cos(2πkD))/(πk)`, with a[0]=b[0]=0.
The default native peak normalization remains enabled. The browser removes
harmonics above its usable band. Finite harmonics, normalization and band
limiting mean Pulse is not an ideal rectangular wave and its loudness/amplitude
distribution intentionally differs from the former DC-offset pulse. The
Square→Pulse morph retains D=0.2+0.6×(type−2). Gains sum to 0.1, which is an
amplitude bound policy, not equal RMS or equal perceived loudness.

All four oscillators share one explicit future start time. Note changes step
to the new target without an unintended pitch glide, preserving carrier
phase. Shape gains use finite 50 ms ramps. A scope view of transition history
is not periodic. Therefore the UI holds the preceding settled view (clearly
marked previous settings), or displays a new offline render, until at least
0.5 seconds plus the full window and capture margin of new live samples exists.
It never calls cached/offline samples live capture. Pause freezes frame identity,
window and captured export data. Export note/type metadata follows that frame,
not newer controls.

Offline render and audible synthesis share the same graph. Offline audio uses
48 kHz; live capture uses the actual AudioContext rate. Capture retains ordered
Float32 PCM, not an ideal drawn equation. The physical interval remains `N/f`;
integer sample/group counts are storage bounds only. Both exact fractional
endpoint positions are reconstructed, instead of dropping the last sample or
rounding the interval to an eight-sample block. Linear interpolation is an
approximation, not ideal sinc reconstruction. Endpoints are **not** artificially
made equal and samples are not rescaled in amplitude to hide numerical error.

Audio Stop schedules the carrier end at the next phase boundary after at least
50 ms of release, integrating pitch changes and accounting for Float32
AudioParam frequency. The finite release reaches zero there to reduce clicks.
That release envelope is intentionally nonperiodic. Audio hardware emits
integer sample frames, so a mathematical stop instant between samples is still
sample-quantized. This does not make each finite digital recording an exact
integer-sample periodic loop.

## Accuracy contract and limits

The frequency formula, period relationship and integer-cycle domain are the
scientific model. Tests verify these with explicit floating-point tolerances.
JavaScript floating point, Float32 AudioParams/PCM, finite harmonics, native
oscillator implementations, sample clocks, interpolation, display pixels and
refresh scheduling prevent a literal “100% physically exact” guarantee.
The tool is not a calibrated measuring instrument. We do not retune notes or
hide approximation to manufacture such a claim.

Equal-tempered periods generally contain noninteger sample counts. Rounding a
one-period audio buffer then repeating it changes pitch. Do not replace the
continuous oscillator with that shortcut. A cached scope is visual data, not
a looped audio buffer. Whole-cycle spatial windows are separate from GIF time:
GIF frame delays are integer centiseconds, and player cadence can vary. Export
performs one visual phase sweep with the existing distributed-delay planner;
it does not encode or reproduce audio-rate time. A numeric seam residual can
remain in actual interpolated PCM. Static SVG/PNG and GIF reuse frozen PCM
geometry; the decorative selector sample is explicitly an ideal family icon.

## Precomputation and resource policy

Precompute the 61 descriptors, not every rendered possibility. The 0.01 morph
slider alone has 301 values: 61×301 = 18,361 note/shape settings, before phase,
sample rate, export size, color and composition. Treating arbitrary inputs as
continuous adds still more possibilities. One raw 0.63-second 48 kHz mono
Float32 render per setting would require over 2 GB; eager work would delay the
page and waste most renders.

Each scope controller keeps an eight-entry LRU of immutable, settled offline
recordings. The key is normalized note/type; the controller has one fixed
48 kHz offline renderer and synthesis implementation for its lifetime. If either
becomes configurable, include it in the cache identity. Only the post-settle PCM
copy is retained, avoiding pinning the discarded settling buffer. Recent pulse
PeriodicWave objects use a bounded 16-entry per-graph/context cache keyed by duty.
Live data is never served from those caches. Dispose clears the scope cache.
Native oscillators already have optimized synthesis; precomputation chiefly
reduces repeated offline/render work, not necessarily audible synthesis cost.

A single native-engine local run measured about 156 ms for a cold scope render
and 1.32 ms for a repeated cached setting. This is illustrative, not a browser
or hardware performance guarantee. See the reproducible QA script and results.

## Sources

- UNSW Acoustics, Joe Wolfe: [Note names, MIDI numbers and frequencies](https://newt.phys.unsw.edu.au/jw/notes.html).
  This is also the source identified on the supplied keyboard/frequency chart.
- W3C [OscillatorNode](https://www.w3.org/TR/webaudio/#oscillatornode),
  [PeriodicWave](https://www.w3.org/TR/webaudio/#PeriodicWave), and
  [AudioParam](https://www.w3.org/TR/webaudio/#AudioParam): oscillator shapes,
  band limiting, normalization and scheduled signal parameters.
- CompuServe [GIF89a specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt),
  Graphic Control Extension: frame-delay time units.

[Validation and remaining limits](waveform_notes_qa.md).
