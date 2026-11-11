# Quantum studies: Well Modes and Rabi

## November 11, 2026 implementation

Both are working, selectable entries under **Under Construction**, with direct
routes `/generator/well-modes/` and `/generator/rabi/`. They are deliberately
absent from the promoted Home marquee. Future bars being iterated should use
this same accessible category, not disabled placeholders; move them into a
regular category only after the owner explicitly approves that move. The separately implemented Music composer remains in the same experimental
category. Data Graph and Truss placeholders are not implemented by this change.

The existing Ring Wavefunction remains separate and unchanged. These are ideal
mathematical models, not measured RPI experiments, hardware simulations, or
institutionally approved logo-library additions.

## Well Modes

Let u=x/L lie in [0,1], with orthonormal infinite-square-well modes
phi_n=sqrt(2) sin(n*pi*u). Two distinct modes n1,n2 from 1 through 6 use weights
sqrt(1-p), sqrt(p), with p in [0,1]. The density is

`rho=(1-p)*phi_n1^2+p*phi_n2^2+2*sqrt(p*(1-p))*phi_n1*phi_n2*cos(2*pi*phase)`.

The complex modulus is evaluated before drawing, avoiding negative roundoff
at destructive interference. Integration over u is one. Endpoints, internal
nodes and interference zeros remain zeros. Populations 0 and 1 are stationary.
The density is bounded by four for this two-mode family, so the fixed thickness
mapping is 36*rho/4 in the 500 by 36 design rectangle. Mirroring about the bar
center is a drawing convention, not another spatial coordinate. No per-frame
normalization, endpoint pedestal, forced contact, particle track or fabricated
probability floor is added. Equal mode selections visibly adjust the other
mode; historical snapshots with equal modes are normalized consistently.

Motion advances the relative phase through one beat in eight display seconds
at 1x. Physical beat frequency depends on the chosen energies, mass and well
width; display seconds are not laboratory time. Changing the modes retains this
illustrative display period rather than claiming a common physical period.

## Rabi

For an initial ground state under a constant ideal two-level drive, use the
rotating-wave approximation with d=Delta/Omega and tau=Omega*t:

`Pe=sin(sqrt(1+d*d)*tau/2)^2/(1+d*d)` and `Pg=1-Pe`.

Detuning d ranges from 0 to 3. The horizontal duration span ranges from 2*pi
to 8*pi. The visible start time is phase times the population period
`2*pi/sqrt(1+d*d)`. The horizontal axis is pulse duration across repeated
experimental settings, not spatial position. Animation is a sliding duration
window, not particle motion or a single evolving spatial probability field.
Detuning changes both peak transfer and oscillation rate. No relaxation,
dephasing, noise, counter-rotating term or arbitrary drive-phase shape effect
is modeled. A nonzero start setting can therefore show nonzero Pe at the left
edge without changing the initial-ground-state assumption.

The lower solid region's height equals Pe; the complementary upper region's
height equals Pg. Diagonal hatching distinguishes the latter in one color.
Hatch ink coverage is texture, not a second probability measure. Both regions
use the whole design domain, with no fake baseline. Hatches are clipped filled
polygons, shared by the live canvas, header, SVG and GIF renderers.

## Controls, access and exports

Native labelled sliders support pointer, keyboard and editable values. Well
exposes both modes and population. Rabi exposes detuning and duration span.
Both expose loop, reverse playback, 0.2–4x speed and cycle position. Pause keeps
the visible frame; seeking and numeric editing hold playback until finished.
Backgrounding suspends elapsed-time accumulation. Reduced-motion preferences
start paused and pause again on preference changes; explicit playback opt-in
remains available. Automatic phase changes are not counted as parameter edits.
Reset, Randomize, local Undo, legacy query parameters and snapshot restoration
use the same authored fields. Inactive panels remain hidden.

PNG and SVG capture the currently visible phase, unlike the older Ring still
convention. SVG contains scientific model metadata. GIF captures the selected
phase, speed and direction before asynchronous work, and uses the same polygon
geometry. A complete loop takes 2–40 seconds, with up to 50 frames/s and at most
2,000 frames, inside the existing encoder's 3,000-frame/100-second budget.
Centisecond timing has at most 5 ms total-duration rounding error. The final
frame is not a duplicate of the first. Existing memory, file-size, cancellation
and transparency guards are retained. Raster files contain no claim of physical
units or measurement provenance.

## Brand and verification scope

The official letters, their alignment, letter-to-bar gap, 500:36 bar ratio,
export padding and existing approved theme choices are reused unchanged. The
new bars use one foreground color and primitive vector geometry. Default
proofs at three phases in black-on-white, white-on-black and white-on-red were
rendered offline and inspected at 250-pixel mark width. Rabi's fine hatching and
Well's narrow nodes require careful small-format review; this is not a claim
that either works at the solid-logo minimum size. No new fonts or licensed
assets were added. Formal sponsor/brand approval remains separate.

Automated tests cover normalized probability, exact zeros, stationary limits,
independent Rabi benchmarks, model sanitization, viewport bounds, hatch clipping,
identical SVG/GIF polygons, loop seams and budgets, frozen export snapshots,
controller playback and editing, reduced-motion/hidden-tab behavior, reset and
mode constraints. Routing tests distinguish working studies from promoted Home
styles. An independent read-only review caught and fixed missing immediate
main/header render paths before release.

The cloud-browser inventory request timed out before navigation. No live
browser, touch, download-activation or mobile-layout smoke result is claimed.
Offline rendered evidence and unit/controller tests do not replace that QA.

## Sources

- [OpenStax: particle in a box](https://openstax.org/books/university-physics-volume-3/pages/7-4-the-quantum-particle-in-a-box)
- [MIT 6.728: two-level dynamics](https://ocw.mit.edu/courses/6-728-applied-quantum-and-statistical-physics-fall-2006/16029f7c397abce618505381ec3a82dc_twolevel04.pdf)
- [RPI: The Bar](https://brand.rpi.edu/d/pfJS6BKVKBeq/brand-guidelines#/-/the-bar)
- Existing source/asset checks: [brand guidelines](rpi_brand_guidelines.md),
  [asset rights](asset_licensing.md), [export geometry](export_composition_qa.md).
