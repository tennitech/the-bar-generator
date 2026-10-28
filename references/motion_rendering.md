# Header motion and speed limits

October 27, 2026. Display motion is illustrative, not a calibrated physical measurement.

## Tiny header

The former header kept one canvas during playback, but cleared and repainted its letters every frame. A 45-frame Chromium probe found identical letter pixels for Ruler, Ticker, and Waveform; it did not reproduce a blank-letter frame. Pause/play did replace the whole mark between SVG and canvas. The dense default Ticker also used a constant row-average fill, so its tiny bar could become stationary. High speed and subpixel stripes are separate sources of perceived shimmer; persistent DOM alone does not prove a physical display is flicker-free.

The new header keeps the official path data in a persistent SVG letter layer. Only a separate, clipped bar canvas updates. The bar shares the main preview's phase and geometry, remains present while paused, and uses a 4× buffer before downsampling to the actual device-pixel footprint. Canvas rounding changes bitmap resolution only: its CSS position and dimensions retain the same uniform vector transform. There is no phase-dependent fitting, independent header clock, or mean-fill freeze. Geometry/export owners must preserve natural Ruler ticks without forced end marks, the existing Ticker boundary references, and the canonical quantum domain when combining renderer branches.

## Repeat-rate policy

| Family | Meaning of SPEED | Minimum | Default | Maximum | Fastest visible local repeat at maximum |
| --- | --- | --- | --- | --- | --- |
| Ruler | Major-pattern recurrences per display second | 0.2 | 0.3 | 0.6 | Up to 10 minor divisions × 0.6 = 6 crossings/s |
| Ticker | Top-row tick recurrences per display second | 0.2 | 0.4 | 0.8 | Up to 5 bottom ticks × 0.8 = 4 crossings/s |
| Waveform | Temporal waveform cycles per display second | 0.2 | 0.3 | 1.0 | One full temporal cycle/s at each fixed position |

At the default 24-frame/s GIF plan, the maximum Ruler rate moves the densest minor tick by one quarter interval per frame; Ticker stays below one sixth, and Waveform gets 24 samples per cycle. Other capture settings and encoded frame-delay rounding can affect sampling.

The earlier common maximum was 5, allowing 50 minor Ruler crossings/s, 25 Ticker bottom crossings/s, or 5 waveform cycles/s. The new limits favor legible motion over rapid texture turnover. These are design choices, not universal sampling or flash-safety thresholds. Spatial density, waveform shape, display refresh and device-pixel ratio still affect perception. The existing slow minimum is preserved. Defaults are explicit rather than relying on the former Number(null) → 0 → minimum behavior when a URL omitted SPEED.

`loopingGifUtils.normalizeLoopSpeed` owns finite-value validation, family bounds, 0.1 step rounding and defaults. UI ranges, Reset, Randomize, URL restore, runtime values, SVG/PNG snapshots and GIF planning use the same values. Missing, empty, boolean, malformed and nonfinite values select the family default; finite excessive values clamp; valid slow values remain. Speed changes preserve phase. A delayed frame can still slow live progression through the pre-existing temporal sampling guard; it does not change the requested GIF rate.

The combined Share validator uses `loopingGifUtils.normalizeMotionSpeedControls(value.controls)` before strict manifest validation to migrate old v1 snapshots with excessive speeds. The helper changes only the three known speed IDs and leaves all unrelated fields to existing validation. The narrow supplied adapter is applied in the integration checkout; unrelated invalid controls still reject.

Quantum is separate. The Quantum model uses one common 0.2×–1× multiplier, default/max 1×, against a 120-display-second recurrence, preserving all relative n² frequencies and fixed spatial/vertical scales. Its highest component rate remains 49/120 ≈ 0.4083 cycles/s at 1×. SPEED must not be relabeled as a single quantum cycles/s value. Header rendering does not change the model, modes, controls, static default, reverse behavior, or paused share restoration. See quantum_model.md for the final assumptions and mappings.

## Intro transition lifecycle

Entrance duration/easing and exit duration/easing are centralized CSS tokens. Scrim, projection and controls inherit one active pair. Controls remain disabled until the actual entrance transition begins. They become disabled again during closing; the overlay keeps background content inert and waits on its actual CSS transition promises before hiding, removing the frame and restoring focus. Reopening invalidates old completion callbacks. There is no guessed exit timeout. Reduced motion completes immediately through the same lifecycle.

The shared status/science references in the integration checkout now describe this policy. Final combined and physical-device acceptance remain separate.

## Review evidence

[Desktop](review-images/motion-desktop.png) and [mobile Quantum](review-images/motion-mobile.png) screenshots were generated locally from this app for review. They show existing repository-provided logo/font assets within the software UI; no third-party image, font or brand asset was added or relicensed. The outstanding underlying permission records in [asset licensing](asset_licensing.md) remain unchanged. These images are visual evidence, not formal brand approval.

## Cross-platform motion preference: October 28, 2026

The reported combination (all decorative motion absent and the header logo opening
a still logo) matches the explicit `prefers-reduced-motion: reduce` branch. This
is a browser-reported operating-system preference, not a Windows/Android user-agent
check. It suppresses marquee motion, page/theme reveals, default continuous bar
loops and the ASCII intro. The intro's former branch also hid Replay, leaving no
way to deliberately play it. Browser simulation reproduces that behavior. The owner subsequently confirmed
that the affected phone limits animations and the Windows browser runs a very old
Chrome version. Those reported causes are now known; the exact Chrome version
and its failing feature were not supplied, and no physical-device run is claimed.

The still intro now explains the preference and offers **Play animation once**.
That button starts one ASCII sequence and keeps focus within the dialog. While
reduced motion is still requested, reopening returns to the still view; no
override is stored or applied to other motion. If the system now permits motion,
normal autoplay behavior applies. A later reduced-motion request stops playback and restores the still view.
Relaxing that request preserves an already playing sequence instead of restarting it.
Normal playback keeps the existing Replay and close/completion behavior.
Ruler/Ticker/Waveform already allow deliberate Loop selection under reduced
motion. Their geometry, phase and export planning are unchanged. Quantum phase
and transport are owned by the separate Quantum repair. The existing p5 global
state architecture in main.js is retained; its only change here versions the
lazily loaded intro controller.

Sources: [Chrome's motion preference guide](https://web.dev/articles/prefers-reduced-motion)
describes the OS preference and Android Remove animations setting;
[MDN's preference reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
records Windows Animation Effects and Android Remove animations mappings.
Do not disable these accessibility settings globally to work around the report.

For a remaining physical-device failure, capture the browser/version and the
value of `matchMedia('(prefers-reduced-motion: reduce)').matches`, then test the
new one-time Play button and an explicit bar Loop toggle. If the preference is
false or deliberate playback remains stopped, collect the first console error
and renderer/context state; that would be a different failure from this branch.

Verification: 307 unit tests in 30 suites; `scripts/motionPreferenceSmoke.js`
passed 32 cases per Chromium/WebKit engine for normal/reduced preferences,
desktop/emulated touch, WebGL/forced 2D, explicit Loop, pause, hidden/resume,
keyboard one-time play, changed ASCII content, focus return and reopen reset.
Its `--iframe-only` check passed in both engines for preference inheritance and
nested ASCII playback in a same-origin iframe. This is not actual Frontify or
physical Windows/Android validation. WebKit `introLifecycleSmoke.js` passed.
Desktop and emulated-touch screenshots in `/tmp/rpi-motion-choice-evidence` were
visually inspected. The application stack, bar geometry and export code remain
unchanged; only the lazy intro-controller version changed in p5 global main.js.

The integrated runtime also pauses Ruler/Ticker/Waveform when the OS newly
requests reduced motion while the page is open. Relaxing that preference does
not restart paused loops; explicit Loop remains available. The focused
`motionPreferenceSmoke.js --preference-change-only` checks passed in Chromium
and WebKit, including embedded playback after the preference checks.

## Confirmed-incident audit — October 28, 2026

PR #50 introduced no Windows/Android user-agent detection, automatic-motion
override, legacy-browser shim or animation-engine replacement. The retained
changes are an accessibility choice (one explicit ASCII sequence with no saved
override) and pausing loops when reduced motion is newly requested. Marquee,
page/theme reveals and automatic loop defaults continue to honor the system.
Quantum, information cards and GPU-bounded zoom are independent fixes.

The audit reproduced two preference-change edges in the opt-in flow: relaxing
reduced motion restarted an explicitly running frame; replacing the focused
Play control could leave focus on body. The local repair preserves that running
frame and keeps focus in the dialog when preference changes replace or hide a
focused control. The new Play control now also follows the existing entrance
and exit disabling of Replay/Close. Normal playback, deliberate Replay,
completion, reopening and explicit loop selection retain their behavior.

Compatibility inspection compared PR #50 with `3814997`. The motion additions
do not raise the existing API/syntax requirement: MediaQueryList change
listeners were already used without a legacy fallback in page entrance, theme
motion and Quantum setup; optional chaining and Object.hasOwn were already in
the runtime. [V8 documents optional chaining in Chrome 80 and later](https://v8.dev/features/optional-chaining);
that is an example of an existing requirement, not a complete supported-version
floor. [MDN explains older MediaQueryList/EventTarget differences](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/addListener).
Without the actual old version, no exact failure mechanism or expanded legacy
support is asserted. No broad polyfill or user-agent exception was introduced.

Audit validation: 324 unit tests in 33 suites passed, including three new
controller regressions for retained one-run frame identity, focus after
replacement, and Play entrance/exit disabling. Chromium and WebKit each passed
`motionAuditSmoke.js`: reduced loop/page/theme defaults, focus and Tab cycle,
actual full ASCII completion exactly once, preserved frame on preference
relaxation, reopening reset, no intro opt-in leaking to bar loops, normal
autoplay/completion/loop resume, and landing marquee preference changes. The
existing 32-case motion preference matrix passed in each engine, including
forced 2D, desktop/emulated touch, hidden/resume and same-origin iframe playback.
Evidence: `/tmp/rpi-motion-audit-evidence`. These are current Mac Playwright
engines (Chromium 151.0.7922.34 / WebKit 26.5), not the unspecified old Chrome
or physical phone. The audit branch is local only and has not been deployed.
