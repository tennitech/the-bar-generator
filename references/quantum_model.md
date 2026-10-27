# Quantum: phase projections of a periodic wavefunction

The single visualization is a stylized graph of one analytic complex wavefunction. The curves are not particles, trajectories, probabilities or experimental measurements. The visible style is **Quantum**; `/generator/wave-quantum/` remains compatible.

## Sources and chosen construction

[David Tong, University of Cambridge, Quantum Mechanics §2.1.1, A Particle on a Circle](https://www.damtp.cam.ac.uk/user/tong/qm/qmhtml/S2.html#S2.SS1.SSS1) derives integer momentum modes, periodic boundaries and energies proportional to n². Negative integers describe momentum in the opposite direction. The bar unwraps one ring circumference L into u=x/L from 0 to 1; its ends represent the same position, not hard walls.

[MIT 22.02, Chapter 6, §§6.1.1–6.1.2, printed pages 84–85](https://ocw.mit.edu/courses/22-02-introduction-to-applied-nuclear-physics-spring-2012/b5106a499ae03e36b5a2e002355668f9_MIT22_02S12_lec_ch6.pdf) describes energy-eigenstate phase evolution and linear superposition. Applying those rules gives this app's equal-weight state:

```text
u = x/L; E1 = hbar²(2pi/L)²/(2m); tau = E1*t/hbar = 2pi*phase
N = {-4, 3, 7}
psi(u,tau) = sum[exp(i(2pi*n*u - n²*tau)), n in N]/sqrt(3)
i*dpsi/dtau = -(1/(2pi)²)*d²psi/du²
integral(|psi|² du, 0..1) = 1
```

Distinct integer modes are orthogonal; each coefficient has squared magnitude 1/3, so total norm is one at every time. As an independent internal check:

```text
rho = |psi|²
rho(u,phase) = 1 + (2/3)*[
  cos(2pi*(7u + 7phase)) +
  cos(2pi*(11u - 33phase)) +
  cos(2pi*(4u - 40phase))]
0 <= rho <= 3; physical density per unit x = rho/L
```

Density is a numerical invariant, not an offered view. The mode choices and equal weights are design choices, not a result attributed to the sources. Compared with the previous two co-propagating modes (4,7), the counter-propagating component and third energy produce multiple interference scales and richer shape evolution. All still obey linear free-particle evolution; no new force or nonlinear effect is implied.

## What is stylized

The bar draws three fixed projections Re(exp(iα)psi), α=0,π/3,2π/3. These are views of one amplitude under a chosen global phase convention, not three independent quantum states. Projections depend on that convention and are not directly observable. Their fixed theoretical bound √3 maps to the available bar height, without sampled-peak normalization or per-frame spatial fitting.

A thin vertical ribbon follows each graph: 1.35 reference units at the nominal 18-unit bar height (a modest 15.4% increase from 1.17). Fixed interior padding keeps the entire ribbon within the bar without clipping. That cosmetic line width is not uncertainty or additional probability. Exact full-domain endpoints and cap-free polygons keep real paint at both nominal horizontal edges and within caller bounds, up to the documented 1e-12 reference-unit floating tolerance. The fixed spatial sampling uses 400 intervals; linear interpolation between samples is a drawing approximation. The state is sampled once per position and then projected three times, avoiding redundant trigonometric evaluations.

Phase advances continuously from browser-frame timestamps. A complete state recurrence is 120 display seconds at speed 1.0. SPEED ranges from 0.2 to 1.0 and multiplies the same time parameter for every mode. Component frequencies at a fixed position are 16s/120, 9s/120 and 49s/120 cycles per second for multiplier s. The maximum remains 0.4083 Hz, unchanged from the previous design. REVERSE evaluates earlier times in the same reversible analytic solution; it is not a claim to reverse an experiment. Unspecified mass and circumference mean display seconds are not physical calibration. A delayed frame is capped at 50 ms, so a stalled device can play more slowly instead of catching up in a large jump.

Fine projection detail can merge at tiny sizes. Slower motion cannot by itself prevent subpixel shimmer in the header. BAR-06 owns final miniature rendering policy and actual-size checks with BAR-01 geometry; a static fallback must disclose snapshot semantics rather than claim a live same-phase view. No universal minimum pattern size, flicker-free guarantee, or formal brand approval is claimed.

## Controls and migration

The single MOTION section reuses the other bars' LOOP and REVERSE switches, SPEED slider and editable value display. PHASE uses the same native/editable slider component and pauses on seek. Static is the default. LOOP explicitly starts or pauses playback; native Space works on its checkbox, and the desktop global Space shortcut works outside editors. Hidden documents, inactive styles and the logo overlay suspend time without catch-up. A change to reduced motion pauses playback; the user may explicitly restart it.

Stable control IDs: `quantum-phase` (finite 0..1), `quantum-motion-toggle` (boolean), `quantum-reverse-toggle` (boolean, default false), `quantum-speed-slider` (0.2..1, step 0.1, default 1). Query fields are `quantumPhase`, `quantumSpeed`, `quantumReverse`. Reload/share restore is always paused. `quantumControls.values()` returns the current exact phase for main/header/SVG/PNG; no extra share runtime object is needed. After setting controls, BAR-05 must call `quantumControls.pause()` and `quantumControls.sync()`.

The density selector `quantum-view` and query `quantumView` were removed at the owner's request. Unknown legacy view fields are ignored, the phase is preserved, and the result uses the new single projection model. Share envelope v1 and the route remain unchanged; old two-mode links intentionally migrate to the new artwork rather than reproduce pixels. Fresh links omit the obsolete field. Shared restore must never auto-start even when an old snapshot captured LOOP=true.

Shared control styles follow BAR-07's touch conventions: 2.75rem target floor, 3rem control rows, comfortable switch labels and native slider/editor targets, with visible keyboard focus. These changes apply to the shared components rather than a quantum-specific button. No new framework, library, font or asset was added. SVG/PNG are static snapshots; Quantum GIF export is not offered.

## Tested guarantees and limits

Numerical tests cover norm, an independent interference formula, bounds, periodic endpoints, Fourier coefficients and their n² phase evolution, recurrence, finite-difference Schrödinger residuals, speed/reverse steps, and fixed-scale polygon bounds at 65 phases. These checks give specific evidence for this chosen finite model, not 100% certainty about all software, displays or quantum systems.

This branch starts from assigned baseline 43944b5. Its inherited general PNG/SVG placement differs; BAR-01 owns final official geometry and canonical raster integration. Quantum shapes agree at identical caller geometry; the branch alone cannot establish complete official-geometry export parity. Shared status/science changes are proposed to the coordinator separately. Physical-device, manual screen-reader, low-power/high-refresh and final combined-header acceptance remain distinct checks.
