# Wave Quantum model and motion

The former static motif was three offset sine curves without a specified quantum system. This implementation keeps a static option and uses a stylized graph of an analytic wavefunction. It does not depict literal particles or a measured dataset.

## Scientific basis

[David Tong, University of Cambridge, Quantum Mechanics §2.1.1, A Particle on a Circle](https://www.damtp.cam.ac.uk/user/tong/qm/qmhtml/S2.html#S2.SS1.SSS1) derives periodic boundary conditions, integer momentum modes and energies proportional to n². Our bar unwraps a ring of circumference L into u=x/L from 0 to 1; its ends represent the same position. There are no hard walls. Integer modes are orthogonal over this domain.

[MIT 22.02, Chapter 6, Time Evolution in Quantum Mechanics, §§6.1.1–6.1.2, printed pages 84–85](https://ocw.mit.edu/courses/22-02-introduction-to-applied-nuclear-physics-spring-2012/b5106a499ae03e36b5a2e002355668f9_MIT22_02S12_lec_ch6.pdf) gives eigenstate phase evolution, superposition and its probability interference term. The implementation applies those rules to two ring eigenstates with equal weights:

```text
u = x/L; E1 = hbar²(2pi/L)²/(2m); tau = E1*t/hbar = 2pi*phase
psi(u,tau) = [exp(i(2pi*4u - 16tau)) + exp(i(2pi*7u - 49tau))]/sqrt(2)
rho(u,tau) = |psi|² = 1 + cos(2pi*3u - 33tau)
integral(rho du, 0..1) = 1
physical density per unit x = rho/L
```

The choices n = 4 and n = 7 are design choices, not inferred experimental values. The analytic state satisfies i∂psi/∂tau=−(1/(2pi)²)∂²psi/∂u². Unit norm is constant because each orthogonal component has squared weight 1/2. Interference changes density in position without changing the two energy probabilities. The entire state recurs after phase 1. Playback maps that recurrence to 120 display seconds; mass and circumference are unspecified, so this is not a physical time calibration.

## What is drawn

- **Phase projections**: three graphs Re(exp(iα)psi), α=0,π/3,2π/3. They are views of one complex amplitude under a fixed phase convention, not three particles, three independent states or probabilities. Such projections depend on phase convention and are not directly observable. The fixed theoretical bound√2 maps to the available bar height.
- **Probability density**: a single graph of rho, using the fixed theoretical interval 0..2. Probability of an interval is the integral under rho; vertical position is a graph coordinate, not a particle trajectory.

Both representations cover the entire fixed spatial domain. A thin, vertically thickened polygon follows each sampled graph. That cosmetic line width is not uncertainty or extra probability. Its positive thickness lets even a zero-density endpoint draw a graph line. All polygons have exact nominal left/right endpoints and stay in the caller's rectangle; no edge dots, stroke-cap overshoot, sampled-peak normalization or spatial rescaling are used. Time changes the state, never the domain. Small placements can lose fine detail; no new universal minimum logo size is claimed.

## State and accessibility

Static is the default for every user. Play is explicit; Pause freezes the exact phase. Scrubbing Time also pauses. Switching views preserves time. Hidden documents, the logo overlay and inactive styles stop phase advancement without catch-up. A change to reduced motion pauses playback; a user may explicitly play afterwards. A shared/reloaded configuration restores a static snapshot and must never auto-start.

Stable IDs: `quantum-view` (projections|density), `quantum-phase` (finite 0..1), `quantum-motion-toggle` (boolean transport state). The visible native `quantum-play-btn` reuses existing motion preview icons, dimensions and focus styles. The phase range is keyboard accessible. `quantumControls.values()` supplies the exact phase/view to the main preview, header and SVG/PNG quantum renderers. BAR-05 must call `quantumControls.pause()` and `quantumControls.sync()` after restore. No additional share runtime field is required. Query URLs store phase/view at user edits or pause; they do not update on each motion frame. Reload while playing returns to the last URL snapshot; Copy Link integration captures the current phase control.

SVG and PNG remain static snapshots. Quantum is not added to supported GIF families. The existing global p5 state pattern remains; pure analytic math is isolated in `quantumModel.js`, with controller state in `quantumControls.js`. No framework or dependency was added.

## Integration and validation limits

This branch starts from 43944b5 as assigned. Its inherited general export constants differ between PNG and SVG; BAR-01 owns correction to official geometry and the common canonical raster pipeline. The quantum helper accepts caller dimensions and does not alter letter geometry. Keep its full-domain mapping unchanged during horizontal normalization. Proposed shared science/status additions are supplied separately to BAR-00 rather than editing shared references during parallel work.

Numerical tests verify norm, density bounds, periodic endpoints, the analytic interference formula, finite-difference Schrödinger residuals, recurrence, deterministic time steps, full-domain paint and confinement at 65 phases in each view (floating-point containment tolerance 1e-12 reference units). Browser evidence and remaining manual checks are recorded in the worker handoff; these are not formal RPI approval or owner acceptance.
