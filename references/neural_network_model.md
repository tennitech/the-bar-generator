# Neural Network bar model

October 28, 2026. The bar now computes a small, untrained artificial feedforward
network rather than drawing a decorative schematic. It is a static forward pass;
changing a control recomputes the pass. There is no training, dataset, biological
simulation, classifier, probability claim, or animated propagation delay.

## Computation and controls

The architecture is `3 → h × L → 2`: three inputs, 1–5 hidden layers of 2–5 units
each, and two output units. The new default has three hidden layers of three
units. Explicit legacy hidden-layer settings still select the same layer count;
legacy links without that parameter use the new default. Other new controls
fall back to three units, dense connections, tanh, input mix 65%, and weight set 1.
The former illustration's exact picture is intentionally replaced.

Input mix `t` runs from 0 to 1 and sets the input vector to `[t, 1−t, 2t−1]`.
Every subsequent unit computes `z_j = Σ_i W_ji a_i`, then either
`tanh(z_j)` or `1 / (1 + exp(−z_j))`. Biases are fixed at zero. The same selected
activation is used in the hidden and output layers. Outputs are numeric model
values, not trained predictions or calibrated probabilities.

Weight sets 1–16 choose deterministic LCG seeds (multiplier 1664525, increment
1013904223, modulo 2³²). Dense weights use independent pseudorandom samples from
`U(−sqrt(6/(fan_in+fan_out)), +sqrt(6/(fan_in+fan_out)))`. Changing the input or
activation retains the weights. Changing architecture regenerates appropriately
sized matrices. These are illustrative initializations, not learned weights.

Local neighbors masks the same dense matrices. Each target keeps the nearest
source in normalized vertical position and its immediate source neighbors. Each
source also keeps its nearest target, so no node becomes isolated when layer
widths differ. This sparse ablation is a project design choice, not a claim of
variance-preserving sparse initialization. Dense and local settings consume the
same complete pseudorandom matrix, making retained edge weights comparable.

## Visual encoding and official geometry

- Layers advance left to right. Only adjacent layers connect; there are no
  recurrence, skipped layers, within-layer links, or directed biological synapses.
- Outer rings represent units. Filled-center **area** is linear in activation,
  with a fixed −1…+1 scale for tanh and inputs and 0…1 for sigmoid. Zero tanh
  activation is half of the available center area; an empty center means −1.
  The empty gutter between center and ring keeps both readable.
- Edge thickness encodes absolute weight relative to its layer's initialization
  bound; dashed links are negative and solid links are positive. Width does not
  encode activation, contribution, confidence, or learning. Crossings are not
  junctions. The model explanation and numeric output readout accompany the bar.
- All marks use the selected existing foreground color; sign never depends on
  hue. No new theme, asset or font is introduced.
- The official 250 × 18 domain and 132.4885 bar offset remain fixed. Complete
  endpoint rings (including half their stroke) are tangent to the horizontal
  boundaries, preserving the existing painted-edge rule. Top/bottom centers use
  radius + half-stroke + 0.63 units of inner padding at the reference height.
  Node radii decrease with the maximum layer width, preventing overlap/cutoff.
  Edges trim outside rings. There is no added end cap or dynamic geometry fit.

A shared pure helper computes the graph, values and primitives. Canonical SVG
feeds the live preview, header and frozen SVG/PNG exports; legacy immediate p5
branches consume the same values and dash lengths. No GIF or motion controls are
added because this bar has no time evolution. Existing app entrances remain
subject to the app's motion preferences. Fit/400% changes inspection only.

All six controls use native labeled inputs/selects and existing custom dropdown,
slider value editor, Reset, Randomize and share capture infrastructure. The weight
set is an explicit control rather than hidden entropy, so both plain query URLs
and shared links reproduce it. Legacy shared states omit new controls and receive
the same deterministic defaults. A disclosure explains the model and links to
its educational reference. The output readout is not an intrusive live region.

## Sources and interpretation

- [Stanford CS231n: neural networks](https://cs231n.github.io/neural-networks-1/),
  checked October 28, 2026: weighted sums, biases, tanh/sigmoid, acyclic layered
  architectures and feedforward computation. This supports the model equations;
  the tiny architecture and input vector are this tool's explicit choices.
- [Glorot and Bengio, 2010](https://proceedings.mlr.press/v9/glorot10a.html),
  *Understanding the difficulty of training deep feedforward neural networks*:
  the dense initialization basis and the importance of activation/initialization.
  Using an initialization from this paper does not imply that the bar trains a
  model or demonstrates its empirical results.

Formal RPI approval, final-size deployment acceptance, physical-device and
screen-reader review remain separate from implementation and browser tests.
