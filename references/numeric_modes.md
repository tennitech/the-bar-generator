# Numeric digit sources — October 28, 2026

Numeric now separates **Enter values** and **Select a formula** with the same dropdown controls used elsewhere. Only one source drives the pattern. Switching sources preserves the inactive decimal value and formula choice. Reset restores decimal entry with the existing long π default and Dot Matrix; Randomize selects a curated formula and an encoding. No new library or runtime framework is introduced. `main.js` retains the existing p5 global-state structure; validation, fixed presets and historical migration live in `js/utils/numericControls.js`.

## Values

The text field uses a decimal mobile keyboard and accepts ASCII decimal digits, one point, and an optional leading sign, up to 200 characters. Keeping it as text preserves leading zeros and long decimal precision; a native number field would admit exponent letters and coerce data. The sign is explicitly not encoded. Arbitrary letters, exponent notation, commas, extra points, NaN and Infinity reject the complete edit instead of silently deleting characters and inventing a different value. The input event covers typing and inserted/pasted text. Normal temporary states such as an empty field, `-`, or `.` remain editable and render no digit pattern. Leaving an incomplete value shows recovery guidance. A valid edit clears that guidance.

The existing two visualization methods, decimal-point mapping, zero-ink recovery and boundary references remain unchanged. The old fallback from an empty field to π is removed, so preview and exports cannot silently substitute a different value. Existing profanity protections for text encoders and names remain intact.

## Presets and sources

These are recognizable math/engineering examples, not a ranked popularity survey or official RPI formula list. Each produces the digits of a fixed decimal approximation, not a graph, a parameter solver, measured data or a physical quantity with units. The exact encoded decimal is shown below the formula description. Runtime constants use JavaScript's finite double-precision approximation (normally 16–17 significant digits), distinct from the existing manually entered long π default.

| Choice | Rule and interpretation |
| --- | --- |
| Pi | `Math.PI`, circumference/diameter |
| Euler's number | `Math.E`, natural-logarithm base |
| Golden ratio | `(1 + sqrt(5)) / 2`, positive root of `x² = x + 1` |
| Square root of 2 | `Math.SQRT2`, square diagonal/side |
| Square root of 3 | `sqrt(3)`, equilateral-triangle height/half-base |
| Full turn | `2 * Math.PI`, radians per full turn |
| Sine RMS ratio | `Math.SQRT1_2`, RMS/peak for a sine wave |
| Decay half-life ratio | `Math.LN2`, half-life/time constant for exponential decay |

Primary references checked October 28, 2026:

- [ECMAScript Math constants and functions](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-properties-of-the-math-object) defines π, e, ln(2), √2, √(1/2) and the built-in computations. The golden-ratio and simple triangle identities follow directly from the displayed equations and the Pythagorean theorem.
- [OpenStax, Power in an AC Circuit](https://openstax.org/books/university-physics-volume-2/pages/15-4-power-in-an-ac-circuit) derives the sinusoidal RMS-to-peak factor.
- [OpenStax, RC Circuits](https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits) gives exponential discharge with time constant τ. Setting its ratio to 1/2 yields `t / τ = ln(2)`; that is a derivation from the source equation, not a separate measured result.

## State and historical links

`numeric-source-select` (`values`/`formula`) and `numeric-formula-select` (stable preset IDs) join the existing v1 share manifest. `numeric-input` and `numeric-mode-select` remain stable. New query keys are `numericSource` and `numericFormula`; `numericValue` preserves the inactive draft too. All renderers consume the current resolved digit source through the existing collector. SVG and PNG snapshot capture freezes that source before asynchronous work.

Historical v1 shares without a source control and old query links migrate explicitly: decimal strings keep Values; known constants/formulas map to presets; supported finite arithmetic is converted once to decimal Values. A small bounded arithmetic parser supports numeric literals, PI/E, parentheses, +/−/×/÷/powers and the former named Math operations. It never compiles or executes text, accesses arbitrary object properties, calls unknown functions, or exposes a new formula editor. Unsupported expressions, nonfinite results and results beyond the new decimal bounds become an empty value with recovery guidance; they are not reinterpreted by stripping out letters. New shares with explicit source controls reject invalid decimal text and unavailable preset IDs before application. The old unrestricted Function-constructor evaluator is removed.

## Validation

See `scripts/numericSmoke.js` and the Numeric tests. Browser evidence and limitations are recorded in project status when the feature checks complete. No physical-device, screen-reader or formal RPI approval is implied.
