# Variant control audit — October 28, 2026

Audited published main `3814997` after PR #42. Scope: remove a generic Variant
control when the same style already has other meaningful design parameters;
retain it when it is the style's only actual configurability.

## Result

No additional style currently meets the removal condition. Triangles already has
Direction and Triangles/count, with its former redundant Variant removed in PR
#42. Six other styles retain Variant as their only design parameter. No runtime,
geometry, query, shared-state, filename, or export code changes are needed for
this audit. Existing links and generated artwork retain their exact behavior.

Global color theme, export size, title, preview zoom, and audio/transport actions
do not replace a style-specific design parameter. Reset and Randomize operate on
existing parameters and are not additional independent configurability. The
runtime-generated slider value editor edits the same value rather than adding a
second parameter.

## Remaining Variant controls

| Style | Range; default | Other design parameters | Decision |
| --- | --- | --- | --- |
| Circles Gradient | 1–3; 1 | None | Keep: chooses the circle coverage arrangement. |
| Gradient | 1–2; 1 | None | Keep: chooses the one-color area-coverage arrangement. |
| Grid | 1–3; 1 | None | Keep: chooses the reference grid arrangement. |
| Lines | 1–2; 2 (MD) | None | Keep: LG/MD selects the 20/32-stroke arrangement. |
| Point Connect | 1–2; 1 | None | Keep: chooses the reference connection arrangement. |
| Triangle Grid | 1–3; 2 | None | Keep: chooses the reference triangle-grid arrangement. |

These controls live in `generator/index.html` and feed the existing common
geometry in `js/utils/barPattern.js` through `js/main.js`. Their distinct
arrangements cannot all be represented by another existing parameter, because
no such parameter is exposed. Removing them would discard the style's sole
configurability and require hidden compatibility state without satisfying the
requested condition.

## Styles without a generic Variant control

| Style | Current design or motion parameters |
| --- | --- |
| Solid | None |
| Ruler | Repeats, Units; Loop, Reverse, Speed |
| Ticker | Repeats, ratios; Loop, Reverse, Speed |
| Binary | Text |
| Morse Code | Text |
| Waveform | Wave type, Frequency, envelope shape/waves/center/bipolar; Loop, Reverse, Speed |
| Circles | Density, Size Variation, Fill Style |
| Numeric | Number/text, encoding mode |
| Neural Network | Hidden Layers |
| Triangles | Direction, Triangles/count; former Variant already removed |
| Fibonacci Sequence | None |
| Union | None |
| Quantum | Phase; Loop, Reverse, Speed (BAR-16 separately owns motion changes) |
| Runway – RPI Flying Club | None |
| Artemis II | None; audio/source presentation is separate |

The three disabled Under Construction entries also have no generic Variant:
Truss has Family, Segments, and Thickness; Music has note input, instrument,
note-head shape, tempo, and audio effects; Data Graph has text streams and scale.
Those semantic selectors describe actual model/encoding inputs rather than a
redundant numbered Variant control, so this audit leaves them intact.

## Verification and limits

Source inspection covers all 24 style choices, native parameter groups,
runtime-generated parameter actions/value editors, the six geometry families,
and query/shared-state/export collectors. Chromium and WebKit runtime audits
cover all 21 selectable styles and confirm that each of the six remaining
Variant styles exposes exactly one native design field. All 15 supported retained
variant values are checked for exact SVG equality after shared-link restore.
The existing unit suite remains passing: 305 tests across 30 suites. No new behavior was introduced, so no
new UI screenshot or formal RPI approval is implied by this audit.

The audit is isolated in `codex/chore-variant-control-audit`. It does not modify
shared main, merge/deploy a change, or alter the separate BAR-16/17/18 worktrees.
