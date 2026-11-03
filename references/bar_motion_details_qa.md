# Motion, Ruler and natural-edge verification

Implemented November 3, 2026, on `codex/fix-bar-motion-details`, based on the preserved integration commit `395ce422`. No push, merge or deployment is included. This is software evidence, not owner testing or formal RPI approval.

## Interpretation and scope

The owner's clarification allows natural edge gaps and rejects added paint or constraints whose only purpose is forced edge contact. The correction removes Ticker side strips, Waveform's bottom baseline, Numeric side marks and the generic static painted-bounds fit. It retains the official viewport and clipping, letterforms, fixed spacing, intrinsic Grid lines, natural circle tangency and scientific coordinates. It does not redesign every pattern to reach the edges.

Ruler's old UNITS label confused the number of subdivisions with the number of major units. REPEATS now spans exactly that many major intervals in the fixed width, with DIVISIONS equal subdivisions per interval. Centered ticks are clipped naturally. Major, half, quarter/third/fifth and finer tick heights use a consistent fractional hierarchy. Static and zero-phase animated geometry are identical and animated major ticks are not duplicated. The existing `rulerUnits` query/share field remains compatible; this is a visual dimensionless ruler, not inches or centimeters on a screen.

Ruler, Ticker, Waveform and Quantum invert their former unchecked-REVERSE direction. Deliberate style-menu selection starts Loop, except under reduced motion. Fresh Quantum routes follow the same default. Paused shared Ruler/Ticker/Waveform states remain paused; Quantum shared states remain paused even for historical LOOP=true snapshots. A change to reduced motion pauses playback, and explicit Loop remains available. History restoration consults the current preference rather than the preference captured at page load.

Binary's cap is ten Unicode code points, preserving complete surrogate pairs, across input, queries, shared state and UTF-8 encoding. Combined emoji/accent sequences can contain multiple code points. Historical valid Binary shares are truncated to the first ten points without dropping other controls. The input remains editable when cleared. The Binary audio UI, entry points and scheduler are removed; other audio families remain intact.

Ticker SPEED is correctly labeled bottom-row repeats/s, matching its recurrence width. No physical time calibration is claimed.

## Automated checks

- 508 unit tests in 46 suites pass. New coverage checks exact major domains, all five subdivision settings, fractional heights, unique moving ticks, live/GIF direction parity, Unicode cap, shared migration, removed artificial paint and preference-aware restoration.
- Full Chromium and WebKit smoke passes: all 21 styles and SVG exports, PNG, five widths, text safety, reduced motion, forced 2D fallback and renderer recovery.
- Focused Chromium and WebKit checks pass eight motion selection/reselection/direction/pause cases per engine, covering all four motion families with normal and reduced motion. Binary query/input/Unicode/legacy-share/moderation/no-audio checks and four natural-edge render paths pass.
- Chromium rendered geometry and actual SVG/PNG download parity passes 30 family/variant states and two mobile/tablet layouts. Every state stays within the fixed viewport without edge fitting; natural insets are accepted. Downloaded PNG and selected header SVG rasterize identically.
- All six Chromium GIF family/size combinations pass: Ruler/Ticker/Waveform at Standard and Large, totaling 188 decoded frames. Per-frame coverage hashes, alpha/disposal, overflow, timing and native first/last-frame decoding pass, alongside accompanying SVG/PNG exports.
- Chromium Quantum integration passes native loop/reverse, exact SVG/PNG phase-seek restoration, persistent header letters, legacy paused shares, history restoration, reduced-motion changes and 320/390px touch seek behavior.

The test harness uses existing pinned official browser builds and the existing cloud-only launch adapter. An initial concurrent Chromium process crash occurred before application assertions; serialized reruns succeeded. No application error was reported in the passing runs.

## Visual checks and remaining limits

Desktop screenshots of Ruler, Ticker, Waveform and Numeric, plus exported Ruler/Waveform transparency composites, were inspected in Chromium. Tick hierarchy and the removed artificial strips are visible without changing official logo placement. Current software checks do not establish physical-device rendering, native mobile picker behavior, screen-reader announcements, high-refresh/low-power performance, a universal flicker-free guarantee, final-size visual acceptance or formal RPI approval.

Landing marquee samples need regeneration from the integrated renderer, and the integration owner must consolidate cache-version bumps before publication. This branch leaves those shared integration concerns untouched.
