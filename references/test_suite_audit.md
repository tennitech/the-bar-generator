# Test suite audit — November 11, 2026

## Scope and current baseline

Reconciles the isolated November 10 audit (`48052e8`) onto published main
`a85b2b1491bb94ec632104a942d52bb0b7760fbd`. The old candidate and branch remain
preserved. Only tests and this audit/status documentation change: no application
code, dependency, asset, browser smoke script, workflow or merge requirement is
changed. Newer actual-audio scope, Ring GIF, input-limit, larger-controls, picker
lifecycle, theme, export and motion regressions remain intact.

The earlier lightweight-checks changes removed automatic browser CI execution
and duplicate post-merge unit runs. They did not remove unit test cases. The
current required gate remains **Unit tests**, on ready PRs targeting main, using
Node 22, the public-repository guard, pinned actions, read-only permissions,
standard runner, five-minute timeout, and no cache or artifact uploads.

Current main has 1,074 tests in 93 suites. The original audit's 830-case candidate
is historical, not the release baseline. A suite is one Jest file; loops inside
a case do not increase Jest's reported case count.

## Necessary coverage retained

| Area | Cases before → after | Redundancy removed and retained proof |
| --- | --- | --- |
| Triangle share state | 41 → 25 | Replace 24 Cartesian round trips with eight combinations. Every variant/direction pair and min/default/max count remains represented. With the legacy variant control present, the validator handles these fields independently. Invalid limits/steps/options, every historical direction migration, every variant-free opposite-corner mapping, and polygon equality for all supported counts remain exhaustive. |
| Bar motion details | 13 → 6 | Move the unique Ruler assertions into the existing `rulerScale` matrix and remove six duplicate cases. All subdivisions retain repeat-width/fraction formulas, major counts, unique coordinates, complete equal-width endpoints and the exact eighth-height hierarchy. Remove one source-name blacklist for artificial edge paint; actual geometry, fixed-viewport and SVG clipping tests remain. Binary Unicode/migration and Ticker/transport behavior remain. |
| Marquee UI | 40 → 39 | Remove a duplicate synthetic 21-family case. `marqueeRowPatterns` retains that catalog, all-family coverage, uniqueness, deterministic regeneration, ten lanes and exact seven-slot rows. Preserve reversed-input-order sensitivity in the focused catalog suite. |
| Waveform envelope retirement | 2 → 1 | Remove an HTML/JS/copy spelling blacklist. Keep executable historical-share field retirement and legacy envelope geometry tests. |

The net change is **25 fewer cases**, without deleting any suite, skipping tests,
relaxing tolerances, weakening CI or removing a feature regression.

Additional iteration/assertion reductions do not affect the case count:

- `rulerEdges` tests all 27 size/settings combinations once instead of eight
  times with ignored offsets. Its dedicated stationary regression checks zero,
  fractional, negative and multi-cycle historical offsets. `loopingGif` still
  proves Ruler cannot animate or create a GIF.
- `rulerScale` drops repeated equivalent-phase loops for this static style.
  Its subdivision/unit/thickness/endpoint matrix remains complete.
- `barMotionDetails` drops a Binary-audio source-name blacklist. The unchanged
  `audioAvailability` test executes dispatch and startup for both Binary and
  Ticker, verifies no active audio, and checks their buttons are absent.
- `waveformGeometry` drops exact helper-call source-string counts. It still
  compares the actual SVG path with the generated polygon and tests exact ink
  areas, continuous jump-edge motion, fixed envelopes and painted forward/reverse
  coordinates. Source-string counts did not prove runtime renderer parity.
  All newer post-gain PCM, offline/live capture, trace/envelope geometry, sweep,
  history, freezing, cancellation and export tests remain unchanged.
- `marqueeStatic` no longer repeats the exact Space-key help sentence. The
  unchanged `marqueeMotionPreference` suite checks that sentence and accessible
  shortcut metadata for both Home entry points, plus executable Space-key
  activation and ignored-target/modifier/repeat cases. Static sample creation
  still verifies accessible links, still SVGs, no canvas/live controller, and
  no live-preview script on either Home page.

The expensive waveform, Quantum and neural suites are retained because they
check analytic references, mathematical invariants, real regression boundaries
and exact coordinates. Cost alone does not make them redundant. Profanity,
input validation, prototype-key safety, official logo geometry, accessibility,
focus, reduced motion, migrations, export and cancellation coverage remain.

## Verification

A complete before/after comparison runs the locked Jest installation with
`--runInBand --json` in the isolated cloud checkout. The local runtime is
Node 24.22.1; required CI is separately verified on Node 22 for the exact PR head.
The baseline run on `a85b2b1` passes **1,074 tests / 93 suites**; the reduced
suite passes **1,049 tests / 93 suites**, both with no failures, skips or snapshots.
Observed single-run Jest times were 44.362 s before and 39.778 s after. These are
not controlled benchmarks or a stable speedup claim: cache and shared-host load
vary. Final release reconciliation and exact-head CI are recorded in the PR.

No rendered-browser check is claimed or needed for unchanged application files.
This audit does not convert existing browser/device/owner-review limitations
into passes. Production code and required CI remain byte-identical to the base;
release reconciliation must retain any newer keyboard work before merging.
