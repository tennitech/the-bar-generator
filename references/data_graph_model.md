# Data Graph numeric model and review

## Scope

Data Graph is available at `/generator/graph/` and in **Under Construction**.
Availability is for iteration and testing, not promotion to a main category or
Home marquee, formal RPI approval, or approval for quantitative publication.
The existing calm controls, native labels, custom select navigation, parameter
Reset/Randomize/Undo, themes, fixed logo geometry and export compositions are reused.
There is no added dependency, framework, audio, polling, or animation.

## Meaning

Each nonempty series contains 2–200 finite decimal samples, between −10¹² and
10¹², with a 2,400-character input limit. Commas, semicolons and whitespace
separate values. Decimal signs and scientific notation are accepted. Parsing
uses JavaScript double precision. Empty/incomplete/invalid values leave the bar
empty with an inline error and block export instead of inventing data. Optional
empty series are omitted; invalid active series block the complete graph.

All active series share one vertical range. **Fit values** maps the minimum and
maximum to the available height, so small differences can be exaggerated.
**Include zero** extends the shared domain to zero. A constant fit-domain is
expanded symmetrically by max(1, |value| × 0.1), and the actual range is reported.
A constant series is therefore a centered line instead of an offscreen graph.

The X domain is each series' own sample index, with uniformly spaced samples.
No timestamp spacing, units, physical calibration, interpolation measurement or
external data feed is inferred. Different sample counts cover their own full
index range, as disclosed in the controls and About. Line joins adjacent values;
Step holds the left value to the next sample; Dots places one circle per sample.
Columns always includes zero and uses signed heights from the zero baseline.
Grouped Columns requires equal sample counts, without padding or fabrication.
Zero columns have no paint. All-zero Columns exports give recovery guidance.

One to five series use the same approved ink. Overlapping line/step/dot traces
are not individually color-coded or a substitute for a labeled analytic chart.
Column groups preserve series input order. Weight controls line thickness, dot
radius or column width. Stroke centers are inset by half their width, and dots
by their radius, to contain their actual paint. The design viewport is fixed;
there are no frame-dependent fitting, boundary strips, axes or invented baselines.

## Examples and legacy migration

The default example contains sin(2πi/24), i = 0…24, rounded to three decimals.
The decay example contains exp(−i/5), i = 0…20, rounded to three decimals.
Both are explicitly mathematical examples, not measured or RPI-specific data.
Editing values changes their source label to Your values. The SVG description
retains the source disclosure, actual shared range, index mapping and plot mode.
Raster exports use that same captured SVG geometry; PNG cannot carry the SVG's
accessible description in its pixels, so keep source context when publishing.

Historical `graphText` query fields and old graph-input snapshot controls are
converted to their original UTF-16 code-unit values, capped at the original 200
units. They are visibly labeled Legacy code values, never relabeled as measured
data. Rejected legacy text produces no graph. A single old character retains its
old doubled endpoint. Historical scale exaggeration is intentionally removed,
so migration retains code values but not the old clipped appearance. Blank new
numeric values remain blank. New query fields win over old text fields.

Randomize varies only the plot type and weight, preserving entered data and
range. It avoids Columns when comparison counts differ. Reset returns to the
explicit default sine example. Undo uses the existing captured control state.

## Shared implementation and validation

`js/utils/dataGraph.js` owns strict parsing, query migration, range resolution,
primitive geometry, p5 drawing, SVG and export blockers. The interactive canvas,
offscreen canvas, header and frozen SVG/PNG export use the same model. The small
`dataGraphControls.js` module owns form synchronization and truthful feedback.
Source text never becomes SVG markup; SVG descriptions contain only known
labels and bounded numeric values.

Automated checks cover signed/constant/tiny/dense data, numeric rejection,
containment, independent expected coordinates, shared ranges, step semantics,
zero and unequal-count Columns, p5/SVG primitive equality, frozen composition
exports, legacy query/snapshot migration, profanity rejection, route availability,
Reset/Randomize and the separate promoted-Home catalog. The existing whole unit
suite is rerun against the final candidate and CI is checked for its exact SHA.

[Rendered plot review](data-graph-review/plots.svg) contains actual shared export
geometry in four modes, a comparison and a constant-value case. It was rasterized
with Inkscape and visually inspected at 1000px plot width. It contains only
project-generated shapes and mathematical examples; no personal data or new
third-party asset is included.

Local rendered browser verification is unavailable: the permitted cloud browser
reported `ERR_CONNECTION_REFUSED` for the workspace's localhost server. No denied
local-browser route was retried. Offline SVG review and unit tests do not establish
browser layout, native keyboard/touch, PNG download or physical-device behavior.
Desktop/mobile browser QA and the live deployment must be checked separately.
The pattern is entirely static and adds no reduced-motion exception. Formal
scientific/brand approval and user aesthetic acceptance remain open.
