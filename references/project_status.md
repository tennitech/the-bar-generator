# RPI Logo Generator - Project Status & Master Documentation

**Last Updated:** 2026-11-11
**Current Phase:** Phase 3 (Advanced Features & Refinement)

## November 11 continuous marquee emphasis

Rapid hover reversals no longer restart a CSS opacity transition with a shortened
reverse duration. A critically damped brightness response retains current value
and velocity when the target changes. Every bar uses the same response, with
brisk settling and no opacity overshoot or bounce. Gap exit immediately targets
full brightness; no timer, debounce, or retained dim state is introduced.

One inherited field opacity and only recent highlighted bars are updated, rather
than writing every repeated bar on each frame. The selected bar stays bright on
exit into a gap. Keyboard focus still wins over a parked pointer. At rest the
selected bar is 100% and neighbors are 20%; reduced motion settles immediately.
Hidden/page-exit handling cancels pending frames. Static artwork, drag spring,
trackpad input, route behavior and exports remain unchanged. Both Home CSS/JS
keys advance. Tests cover reversal velocity, prompt gap release, cleanup,
keyboard precedence, reduced motion and refresh-rate consistency. Release and
rendered checks are recorded in the PR.

## November 11 separated dice with varied rolls

The owner's latest refinement separates Randomize's two complete thin die faces.
Each makes one full independent roll with a restrained 3–7 degree recoil, then
returns to its unchanged resting orientation. Every activation samples its own
direction, 0.6–1.2 viewBox-unit outward travel and duration (rear 560–660ms,
front 600–700ms). Sampled smooth acceleration/deceleration avoids pauses between
poses. These bounded decorative choices do not enter control values or exports.

The fixed 18px slot, labels, hover/focus and immediate native Randomize callback
remain. Rapid activation starts from each face's computed displayed pose and
cancels the previous pair; stale completion, reduced motion, hidden state and
page-exit cleanup remain. The CSS, menu, bar models, audio and exports are
unchanged. Cache keys advance through the routes, fetched shell and fallback.

Focused tests cover full rotation/recoil and travel/duration bounds at random
extrema, independent variation, minimum separation under rotation, transform-only
motion, continuity, cleanup, labels and keyboard-generated clicks. Source-driven
18px light/dark previews were inspected and padding checked offline. Native
browser motion/input remains unverified under the existing restriction. See
[the evidence and limits](dice_roll_qa.md); final full-suite/CI/live evidence is
recorded in the PR. Current main's copy/menu and export changes are preserved;
the concurrent Truss release is kept separate and reconciled before shipping.

## November 11 concise, source-checked UI copy

Audited Home, all 22 selectable About descriptions, control hints, dialogs,
errors/status, accessibility instructions, route/fallback and animation copy.
The live RPI Voice & Tone and Color pages inform the edits. About text drops
from 967 to 609 whitespace-counted words, removing repeated exploration prompts
while retaining actual encodings, model limits, provenance and approval caveats.
The shortcut guide, Home prompt and selected helpers are shorter. Exact
owner-supplied official color guidance stays verbatim.
Useful error recovery, input limits, accessible names and state announcements,
report metadata disclosure, scientific detail disclosures and source links stay.

Only copy and delivery cache keys change; no model, filtering, renderer, control
behavior, dependencies or logo assets change. Export-card cleanup is coordinated
separately. [Audit record](ui_copy_audit.md) distinguishes code/tests, rendered
checks and formal approval. Fresh route and fallback keys load the updated shell.

## November 11 clearer left/right dice shake

The owner's follow-up rejected the first subtle tilt. Each die now makes six
clearly alternating lateral swings, with progressively smaller travel/rotation
and smooth per-leg cubic easing at each reversal. The back settles over 460ms;
the front over 520ms, with different amplitudes and opposite angular tilts. The
small final excursion eases into exact rest. The unchanged 18px icon slot, thin
SVG, labels and button dimensions remain fixed; no geometry/layout animation.

The existing per-face current-pose replacement, stale-completion guard, natural
cleanup, immediate Randomize callback and native keyboard/click path remain.
Reduced motion, page exit and hidden state still cancel both. Undo/Reset keep
their existing easing and label responses. The refinement changes no menu,
scientific model, export, palette or accessibility behavior.

Focused tests require repeated left/right reversals, monotonically shrinking
extrema, smooth turnarounds, exact rest and bounded duration, alongside rapid
activation/cleanup and reduced-motion coverage. An offline source-keyframe
preview and 12 chronological 18px button-context samples were rendered in
light/dark, visually inspected and checked within the existing padding/gap
envelope. This is reconstructed SVG motion, not native browser animation proof.
Full-suite, exact-head CI and production evidence are recorded in the PR.
Actual browser timing, physical keyboard/touch and aesthetic acceptance remain
unverified; no prior denied browser route is retried. This release is independent of approval-held PRs #184 and #187. Export-copy
#186 and export-state #188 are preserved; neither held PR is merged here.

## November 11 uniform export choice states

Export composition and image size now share one bordered choice style, native
radio semantics/glyph, neutral hover, menu-token selected fill and bold selected
labels. Bold layout footprints are reserved with inaccessible copies; borders
stay 1px in every state. Choices, Download/Copy and Cancel share an outside
keyboard focus ring, and pressed action icons inherit the text color. Disabled
hover is suppressed; forced colors restores system selection and native radios.

The public baseline was visually and keyboard inspected. Candidate rendered QA
remains unverified because the available browser environment could not open it;
an optional multi-width/theme/editor-size regression script is included. All 1,130 tests across 96 suites pass, including source,
contrast and existing export/interaction checks.
See [QA evidence and limits](export_choice_states_qa.md). Cache keys advance
through route first paint and fetched shell together. This export-only change
does not include the pending #184 three-dot menu/dialog work, or any real artwork,
renderer, export dimensions, palette, scientific model or motion changes.

## November 11 export-composition copy cleanup

The composition choices retain their visible names, Bar + RPI and Bar only, and
the Export composition legend. The redundant Complete mark and Pattern strip
captions and the sentence “Your current pattern, with or without the lettering.”
are removed. The fieldset’s aria-describedby reference to the removed sentence
is removed too, leaving clear native radio accessible names without a stale ID.

No radio IDs/values/defaults, schematic markup, selection/keyboard behavior,
export controls/dimensions, CSS or rendering/clipboard/GIF code changes. Routed
shell/bootstrap/fallback and Home prefetch versions advance together so the
markup cleanup reaches warm routes. This cleanup is separate from pending #184;
publication follows release coordination rather than merging that presentation PR.
All 53 focused export/radio/cache checks pass in four suites. Accessible-name
inspection confirms exactly the two retained choices and no stale description
reference; 81 inline scripts and cache/source checks pass.

## November 11 refined dashed export-composition guides

The owner’s screenshot identifies the decorative Export composition cards.
The Bar + RPI diagram now outlines its RPI letters with dashes as requested;
both diagrams use a calmer unequal 4.5px dash/2.5px gap rhythm, a 1.25px phase
shift, rounded caps/joins and a thin 0.9px non-scaling stroke. Three alternatives
were compared at 108 × 68 and 88 × 68 display sizes on light/dark surfaces using
native rendering of the unchanged official paths. The longer rounded rhythm
was chosen over equal dashes and a busier long-short pattern.

This is a diagram-only UI treatment. Official path data, viewports, dimensions,
radio labels/semantics, selected/hover/focus/disabled states and real preview or
export artwork remain unchanged. No CSS, logo asset or export renderer changes.
The exportUi and routed shell/bootstrap/fallback/Home prefetch versions advance
together. The initial full suite passes 1,093 tests in 94 suites; 128 focused
combined checks pass after preserving #181–183. See
[schematic evidence and limits](export_schematic_qa.md).

## November 11 independent Randomize dice motion

Randomize's two existing SVG dice now move around their own fill-box centers.
The rear die lifts with a small clockwise tilt and settles over 240ms; the front
die counter-tilts and settles over 280ms, each with a gentle recoil. The icon
geometry, thin stroke, fixed 18px slot, button dimensions, labels and Randomize
callback remain unchanged. Transforms do not affect document layout; bounded
visible overflow avoids clipping the tiny excursions.

Repeated clicks cancel/replace each die's response from its current computed
pose, keeping only one active animation per die. Completion callbacks cannot
clear a newer response. Natural finish leaves no persistent transform. Page
exit, backgrounding or a live reduced-motion preference cancel both; reduced
motion and unavailable SVG animation keep a static icon. Keyboard-generated
native clicks use the same immediate Randomize action and feedback path.
Undo/Reset retain their existing label response. No bar model/export changes.

Tests cover distinct transforms/timing, rapid repetition and continuity, stale
completion, normal cleanup, reduced motion, page interruption, unsupported
animation and native-click/controller semantics. Eight light/dark 18px key-pose
reconstructions were inspected within the existing button context and bounded
overflow envelope. This is offline SVG evidence, not browser motion QA. Full
suite, exact-head required CI and production evidence are recorded in the PR.
Actual native keyboard/touch, browser animation timing and aesthetic acceptance
remain unverified; no prior denied browser route is retried.

## November 11 Ring route cache recovery

Post-release inspection caught existing route stubs reusing the older fetched
generator-shell cache key. All style routes and the bootstrap fallback now
request the short-ring shell version, ensuring updated scripts and export
labels reach returning visitors. No model or other behavior changes.

## November 11 horizontal trackpad row control

A horizontal-dominant wheel gesture over a marquee row now moves that row in
native scroll direction. The listener is attached once per row, including its
gaps, rather than to every repeated bar. Fractional pixel deltas are preserved;
line/page wheel modes and Shift-wheel are normalized. OS momentum is applied
once with no additional spring/fling, and any previous release spring is caught.

Vertical-dominant/equal diagonal gestures, pinch zoom (Ctrl), other modified or
already handled events, noncancelable events, and active pointer drags remain
native. Direct scrolling stays available during keyboard pause or reduced motion,
without restarting autoplay or creating synthetic inertia. Bar hover/focus,
static artwork, touch gestures and click semantics remain unchanged. Both Home
JS keys advance. Regression coverage and release verification are in the PR.

## November 11 short Ring Wavefunction cycle

The Ring view now plots the same analytic state in scrolling coordinates,
`psi(u + 3q/28, q/28)`, with exact complete display recurrence in 4.28 seconds
at 1×. Preview/header/export use the same geometry and the About explanation
discloses the viewpoint. Phase-zero stills are unchanged; older nonzero phases
intentionally map to the new view. GIF uses up to 50 fps: 214 uniform 20 ms
frames at 1×. Every speed now fits the existing limits without downscaling.
Native raster/codec and independent decoded-frame results are documented in
[short-loop QA](ring_short_loop_qa.md). No formal scientific or brand approval
or universal minimum-size claim is made. Browser verification remains separate
from native raster checks.

## November 11 elastic marquee drag release

Dragging remains directly attached to the pointer. On a deliberate throw, each
lane now launches into a bounded underdamped spring rather than a friction-only
glide. The resting point is projected 0.28 seconds from sampled hand velocity;
a 10 rad/s spring at damping ratio 0.6 gives a visible controlled overshoot and
small recoil before settling. Exact closed-form integration keeps the trajectory
consistent across frame rates without an additional scheduler or DOM nodes.

A new press, keyboard focus, deliberate hover catch, cancellation, hidden page,
scroll pause, or reduced motion clears both velocity and spring offset. Held
drags still settle without a throw; touch scrolling, click suppression, lane
projection, layout and bar artwork are unchanged. Subpixel rest thresholds stop
the tail. Tests cover both directions, bounded overshoot/recoil, exact rest,
30–240 Hz agreement and interaction interruption. Both Home JS keys advance.
Final suite, CI and production evidence are recorded in the PR; no export or
logo geometry changes are included.

## November 11 brisk, soft-start Home focus fade

Follow-up feedback asked for faster entry and exit without the flash when the
pointer returns to another bar. The shared fade is now 300 ms with a (0.4, 0,
0.2, 1) curve: a gentle initial change during brief gap crossings, then a faster
settle than the preceding 480 ms symmetric fade. Both directions still use the
same rule. Gap state clears immediately; there is no retained dim or timer.
20% dimming, keyboard focus, reduced motion, and lane interaction are unchanged.
Both Home CSS cache keys advance together. Release verification is in the PR.

## November 11 smoother Home bar handoff

The shared whole-bar opacity transition now uses 480 ms ease-in-out rather than
240 ms ease-out. Its gentler initial slope reduces the brightness flash during
quick reversals between neighboring bars, with one identical transition for
entry and exit across every sample. No delayed hover clearing, gap hold, blur,
extra animation layer, or changed 20% resting dim level is introduced. Pointer,
keyboard, drag, reduced-motion behavior, and static artwork remain unchanged.
Both Home documents refresh the CSS cache key. Production inspection confirmed
the previous 240 ms computed transition; final tests and release verification
are recorded in the PR. No generator or export changes are included.

## November 11 marquee pause-state and fade recovery

The removed Home pause button left its persisted `rpi-marquee-motion` value
active after the control disappeared. Production cloud-browser inspection
reproduced a saved pause with entry mode `bypass` and computed hover transition
`none`; Space Resume restored the 240 ms fade, and a fresh load completed the
640 ms ASCII entrance. The old state is now retired, without deleting it. New
Space-key choices persist under `rpi-marquee-scroll-v2`, so the first visit after
this repair starts scrolling unless device reduced motion is enabled.

Scrolling pause now holds lane travel and inertia only. It no longer disables
all Home CSS transitions or cancels a fresh one-time entrance. Hover/keyboard
opacity feedback remains at 20% with the existing 240 ms curve, and static bar
artwork stays static. Device reduced motion still suppresses transitions and
entrance motion; keyboard and cross-tab pause remain supported. Both Home entry
points refresh the three affected asset keys. No generator geometry, parameters,
export rendering, dependencies or workflow settings change.

Regression coverage checks orphaned state recovery, new keyboard persistence,
startup lane/inertia hold, reduced-motion cancellation, and normal ASCII/plain
fade completion with saved scrolling pause. Final test and production checks are
recorded in the release PR. Local rendered browser QA remains unavailable under
the established execution restrictions; production inspection uses the supported
cloud browser. Physical-device and formal brand acceptance are not inferred.

## November 11 essential-test consolidation

Reconciled the previously isolated audit onto current main without changing
application code or required CI. Remove 25 redundant cases: sixteen triangle
round trips, six repeated Ruler cases, a source-name edge-paint blacklist,
a duplicate marquee case and a retired-envelope spelling blacklist. Unique
Ruler assertions and exact seven-slot/reversed-order marquee coverage move
into the focused suites. Static Ruler offset repetition and brittle helper-call
counts are also removed; executable behavior and all newer regressions remain.
After keyboard-shortcut PR #175, the complete baseline passes 1,111 cases in
94 suites. The reduced suite passes 1,086 cases in the same 94 suites, with
all keyboard tests unchanged, no skips and no relaxed tolerances.
See [the audit and retained-coverage map](test_suite_audit.md) for details and
validation limits. Required Node 22 CI remains the release gate; exact final
PR/merge/deployment evidence is recorded in the PR.

## November 10 picker exit-focus follow-up

Production browser QA confirmed #172's pointer selection and focus return,
and Escape cancellation without changing the selected theme. Chromium's native
Tab navigation exposed another exit case: a scrollable popup can remain a Tab
stop during the 150 ms visibility fade, even with aria-hidden already true.

Closed listboxes are now inert immediately, including during the visual exit.
Opening restores normal interaction before setting the active option. The fade
and pointer-press protection remain; Tab retains its native default navigation
and cannot enter the fading list. Reduced motion keeps its existing zero timing.
A regression checks synchronous inert cleanup before native Tab movement; all
95 focused tests in nine suites pass. The 12 lifecycle cases cover every dismissal
and pointer commit. Shell, route, bootstrap and picker keys advance together.
Final cloud-browser focus and production deployment evidence is in the PR.

## November 10 picker pointer-selection follow-up

Production cloud-browser QA after #170 found that a nonfocusable option row
can move focus to the sidebar scroll container on pointerdown. The new outside-
focus dismissal then removed the popup before its click could commit. This
was reproduced in a controller regression before applying the repair.

An in-picker pointer press now protects that default focus transfer until
pointerup/cancel. The option click still commits through the existing native
select/change path and returns focus without scrolling. Outside presses still
dismiss immediately; keyboard, synthetic-click and programmatic-focus dismissal
remain. Window/page interruptions clear the press protection and close pickers.
No pointer default is prevented, so native scrolling and touch gestures remain.
Motion, colors, layout, artwork and #169's larger-controls feature are unchanged.
The 11 lifecycle tests include pointer/focus ordering and release/cancel cleanup;
all 94 focused picker, shell, guidance, theme, export, ring and accessibility
checks pass before required CI. Shell, route, bootstrap and picker cache keys
advance together; the unchanged base stylesheet retains its existing key.
Final production browser and deployment evidence is recorded in the follow-up PR.

## November 10 picker interruption and dismissal polish

Custom pickers now use the same cleanup when switching directly between
pickers, pressing outside, moving focus to another control, leaving the window,
hiding the page or navigating away. A closed picker clears its active row and
`aria-activedescendant`, reports `aria-expanded=false`, and hides its listbox
from accessibility APIs immediately. Dismissal preserves the new focus target
and the current selected value. Selection still returns focus to the trigger,
now without scrolling the page.

The existing 150 ms opacity fade applies in both directions, with visibility
held only for the exit fade. Height and position settle immediately when the
popup fits or flips; interrupted fades reverse through CSS with no cleanup
timer. Existing reduced-motion rules remove duration and delay. No picker
colors, typography, options, control layout, artwork, audio or exports change.

Eight controller regressions cover switching/reopening, outside pointer capture,
synthetic clicks, programmatic focus, blur/page lifecycle, draft cancellation,
Escape/Tab and selection focus return. Routed shell and asset cache keys advance
together. The live cloud browser loaded the generator and Export menu during
inspection, then lost its tab; one fresh recovery tab failed with
`Protocol error (Page.enable): Target crashed`. Patched desktop/phone rendering,
visual motion and touch validation therefore remain blocked, not passed. No
screenshots, physical-device validation, owner acceptance or formal brand
approval are claimed. Exact unit/CI results are recorded in the pull request.

PR #170's serialized release reconciles with main `631e40f`, retaining #169's
optional larger-controls feature, early sizing restoration, stylesheet/helper
cache keys and QA record. Schematic export and Ring Wavefunction naming also
remain intact. Shared shell, route, bootstrap, base CSS and picker references
use `20261110-picker-serialized-release`; newer independent helper keys remain.
Focused picker, shell, guidance, theme, export, ring and larger-controls tests
are rerun before required CI. Browser verification is limited to what the cloud
browser permits; final CI, deployment and production evidence is in the PR.

## November 10 optional larger editor controls release candidate

The generator's three-dot menu offers **Larger controls and text**, a native
button with switch semantics, a stable accessible name and an explicit On/Off
indicator. It starts off and stores only the editor sizing preference locally.
Restoration precedes first paint; cross-tab changes synchronize without focus
changes, and restricted storage leaves a usable page-session preference.
The fetched route shell binds once when inserted.

The opt-in stylesheet uses 0.875rem labels, 1rem field text and 3rem primary
control targets, a wider sidebar and wrapping actions. It includes the current
section disclosures, help/limit copy and export-composition labels. Integration
preserves current main's pinned footer, independently scrollable About region,
sidebar fade, theme palettes/states, rendering and export code. Artwork/share
parameters and font assets are unchanged; preview fit can respond to editor width.

The original candidate `07beffe` remains saved. The release is reconciled with
`e8c0ec9` (including schematic export cards #168 and Ring Wavefunction #171) on
`codex/feat-larger-editor-controls-release`, with a separate sibling
menu item reserved for the ongoing keyboard-shortcuts release. Focused tests,
JavaScript/80 inline-script syntax and whitespace checks pass. All **1,062 tests
in 92 suites pass** across four sequential shards after correcting the shared
shell cache references. Test interruptions and rendering limitations are recorded in [the QA record](editor_accessibility_qa.md).
Earlier denied browser routes are not retried; no screenshot, physical-device,
screen-reader, owner-acceptance or formal brand-approval result is claimed.
The release coordinator granted the exclusive merge slot after #168. Required
Unit tests must pass on the integrated PR head before normal merge, followed by
Pages deployment and production file verification.

## November 10 Ring Wavefunction naming correction

The owner-selected visible name is now **Ring Wavefunction** across Home catalogs,
the style picker, About heading and accessible controls/editors. This describes
the plotted wavefunction; the scientific source/model name remains free particle
on a ring. The explanation of its three wavefunction phase projections is intact.
Legacy `wave-quantum` routes/IDs, saved configurations, model geometry, timing and
GIF behavior are unchanged. Updated catalog, helper and routed-shell cache keys
make the correction available to returning sessions. Historical QA images keep
the labels used when captured; no export is re-rendered for this copy correction.

## November 10 schematic export composition cards

The Bar only and Bar + RPI choice cards now show the bar area as a thin,
unfilled dashed outline in the existing neutral control ink. The official
letter paths, card layout, typography, native radio behavior and selection
accessibility are unchanged. This is a composition illustration for every bar
style and background pairing; it does not preview or alter exported artwork.
The shared shell and route cache references are advanced together.

Validation and rendered-review limits are recorded in
[the QA record](export_schematic_qa.md). No new external assets, export geometry,
rendering logic or formal brand approval are introduced.

## November 10 scope contours and useful LFO motion

The owner's screenshot is frozen at 400% zoom with LFO off, frequency10 and a
.122s window. The sine teeth were geometry: every extrema bin appended max/min
at the same X and joined the resulting zigzag to the baseline. Separately,
#163's fastest-detail sweep barely moved a long LFO envelope. Both presentation
rules are superseded by this repair; the correct audible graph is preserved.

Sparse views now use ordered actual PCM, with linear interpolation between
adjacent source samples for fractional playback offsets. Dense slow-LFO views
use a clearly labeled peak envelope: measured min/max bins, upper contour
forward and lower backward, with monotone interpolation bounded by measured
values. No oscillator/envelope formula generates the displayed signal. Physical
X, fixed gain, continuous history, parameter-change labels and freeze persist.
An enabled nonzero-depth LFO scans one actual LFO cycle per visual cycle;
otherwise the carrier sets the span. SPEED/reverse still determine display
playback and matching GIF timing. A two-envelope view therefore travels half
its width each default3.333s rather than barely shifting one carrier cycle.

The silent tap now transfers exact ordered PCM beside extrema. All sparse
windows plus trigger/playback margins fit within one second, so live full PCM
uses a one-second ring; long envelope history retains extrema only, bounded
at4/.07 seconds. At48kHz live storage is roughly2.8MiB; silent dense recordings
release full PCM after extrema reduction. No new audio-output path or dependency.

Final Jest1049tests/91suites, syntax/cache/whitespace checks pass. Native exact
checks:90original/shared audio comparisons error0;42AM-product cases maximum
3.7253e-9;2816extrema pairs and22528ordered PCM samples exact; tap output unchanged.
24realPNG exports and8GIFs/1328decoded frames match expected pixels. All166frames
are unique in each .07/2Hz motion case; high-rate1300Hz has at most one duplicate.
Actual400% before/after native crops were inspected, including LFO-off sine and
.07/2Hz peak envelopes. Browser reload and one ordinary tab recovery timed out;
patched live browser/hardware listening/Safari/iOS remain unverified here. No
previously denied browser escalation was retried. See [QA](waveform_scope_contours_qa.md).

## November 10 attempted input-limit feedback

Text fields with explicit limits now receive a brief red border and 2px shake
only after an attempted overflow. Binary/Morse use their existing ten-code-point
limit; Numeric uses its existing 100-character limit, and report fields retain
native limits. Nucleotide keeps its normalized-base insertion and 30–50-base
export rules while sharing the same visual feedback. An exact boundary value is
valid and does not trigger feedback by itself.

Inline slider editors report out-of-range drafts and retain the existing
clamp/round/commit behavior, including SPEED's 0.2–4 multiplier and Ticker's
last-token width ratio. Zoom reports attempted values outside 100–400 percent.
Feedback does not set aria-invalid, change focus, or create a toast. A nearby
polite status message explains the limit, keeps existing descriptions, and
expires after four seconds. Repeated attempts renew the visual cue without
re-announcing unchanged text. Reduced motion removes the shake and retains
static red feedback. Independent CSS translation preserves editor positioning.
No pattern, profanity, audio, geometry or export calculation changes.

Focused event/validation regressions cover boundary values, Unicode selection,
paste before native truncation, repeated attempts, timers, Numeric length,
ratio/multiplier parsing, editor disposal and the reduced-motion CSS rule.
The permitted cloud browser cannot reach the isolated localhost server
(ERR_CONNECTION_REFUSED); local rendered/mobile/motion QA is not claimed.
Live verification is recorded with the PR after deployment. No formal brand
approval is implied.

## November 10 About disclosure chevron consistency

Every About [style] footer now uses the exact same thin SVG as Parameters and
the other section disclosures, inside the shared 1rem centered icon box. It sits
beside the label with the same 0.5rem gap. The shared expanded orientation points
down at 90°; native closed details and collapsed sections point right at 0°.
The former footer-only heavy down-chevron and 180° override are removed.

Native details/summary behavior, collapsed default, keyboard activation and
accessible state, existing focus/touch target, style-specific content, preserved
open/closed state across selection and scroll-cue behavior remain. No footer
controller, parameter values, sidebar geometry, motion/audio or exports change.
The icon adds no animation, including under reduced motion.

Focused regressions cover exact SVG/style parity, all style descriptions in both
native states and every routed generator's shared shell. Actual icon raster bytes
match Parameters in 16/24px, open/closed and light/dark cases; both 16px states
were inspected in an offline label reconstruction. This is native SVG/font QA,
not rendered browser/application evidence. Full suite and exact-head CI results
are recorded in the PR. Actual browser keyboard/touch/screen-reader behavior and
responsive appearance remain unverified under the existing restrictions; no
denied browser route is retried. No active footer PR was found during inspection.

## November 10 scope playback speed repair

Live owner QA exposed a second scope presentation defect: a roughly .037s
unmodulated view was advanced at one recorded second per wall second, racing
through about 109 carrier cycles/s. Live capture also ignored the selected
SPEED, reverse and visual phase and always selected the newest packet.

The scope now presents immutable actual-sample sweeps. One visual cycle scans
at most one cycle of the fastest carrier/active LFO detail, over 1/SPEED display
seconds (3.333s at default). Physical X duration, min/max values, fixed gain,
continuous capture and the correct audible graph are unchanged. Actual rising
crossings trigger the window where available. Live snapshots refresh between
visual sweeps, immediately after edits or while filling/clearing mixed history;
packet delivery cannot independently race the trace. The caption explicitly
labels live capture versus offline rendering and slowed sample playback. This
is a recorded scope presentation, not a real-time scrolling oscilloscope.

Freeze holds the exact frame/recording. Reverse and SPEED apply to actual sample
playback in both sources, with the same default 3.333s GIF duration. SVG/PNG
still freeze the displayed samples. GIF uses the existing 50fps target and
2–3000 frame, 100s and encoder guards; a complete fastest-detail cycle is
required beyond the window. Replay can reset at the boundary for arbitrary
noncommensurate signals, and a new live capture can change its envelope at the
next sweep. Neither interpolation nor fabricated history is used.

All 956 unit tests in 87 suites pass. Native checks cover 90 exact original/shared
audio comparisons (maximum error 0), 42 post-gain AM comparisons (3.7253e-9),
2816 exact silent-tap extrema pairs, 24 real PNG exports and six slowed GIFs /
996 decoded frames with exact expected pixels. The permitted cloud browser
confirmed the production default .037s offline/live window and audio start/stop;
it did not verify this candidate after deployment. No previously denied browser
escalation was retried. See [scope motion QA](waveform_scope_motion_qa.md).


## November 10 Color Theme visual scrollbar correction

The Color Theme picker’s thin right-edge scrollbar is hidden using scoped
standard/WebKit scrollbar rules. Its automatic vertical overflow and native
wheel, trackpad, touch and keyboard/scroll-into-view paths remain. Existing
pointer-transparent top/bottom overflow fades are restored as the default menu’s
scroll affordance, without adding another right-edge line. Other dropdowns and
the sidebar scrollbar are unchanged.

The separate horizontal ink mark, selected checkmark, independent focus outline,
exact hover/selected/active text pairings and neutral idle rows are preserved.
No controller or palette changes. CSS, route shell/bootstrap/fallback and Home
prefetch versions advance together. All 20 focused tests in five suites,
JavaScript/80 inline-script syntax and 26 cache/source checks pass after preserving
#160. All 953 tests in 86 suites also pass after preserving #159. See
[scrollbar correction QA](theme_scrollbar_qa.md).
Browser/served-file checks remain restricted; no blocked route is retried.

## November 10 quiet Undo

Successful Undo restores the previous variation without a visible notification.
The existing persistent, visually hidden status region still announces the
restoration; native disabled state, accessible labels, keyboard activation and
focus return to Randomize are retained. Repeated successful cycles can announce
the same outcome again. Exhausted history remains disabled and produces no
notification. Restoration errors retain their visible error toast and alert
region, with the previous variation available for retry. Randomize history,
edit invalidation, artwork and exports are unchanged.

The shell/bootstrap and changed script cache references advance together for
warm routed pages. Focused regression tests cover quiet live announcements and
the real Undo callback's success/error routing; the existing browser Undo and
control-feedback checks now assert that successful restoration creates no toast.
All 953 unit tests in 86 suites pass, along with changed-script syntax, all 81
inline scripts and whitespace checks. The cloud browser confirmed the previous
visible toast on production; it cannot reach the isolated localhost server
(`ERR_CONNECTION_REFUSED`). Post-release browser evidence is recorded with the
pull request; no local rendered pass is claimed.

## November 10 exact brand text in interactive theme rows

By explicit owner direction, hovered, selected and keyboard-active Color Theme
row text now uses the same exact official foreground as the logo/ink mark against
its composition background. Idle rows retain the default neutral surface/text.
The six approved secondary pairs, primary/mission palettes, compact typography,
selected checkmark, native keyboard/touch handlers, old-save recovery and exports
are unchanged. A separate contrasting 2px focus outline and the checkmark remain
as non-color cues; no text foreground is silently substituted or enlarged.

Four literal secondary pairs are below 4.5:1 ordinary small-text contrast:
Gray on Red and Red on Gray are approximately 3.274:1; Silver on Blue and Blue on
Silver are approximately 3.505:1. This is the owner's requested exact-color
exception and is documented, not a claim of small-text WCAG AA compliance.

CSS/theme-module versions and route shell/bootstrap/Home prefetch cache references
advance together, preserving the recent routed-cache repair. All 950 tests in
85 suites, JavaScript/80 inline-script syntax, cache and source-preservation checks
pass. See
[exact-text QA and contrast limits](theme_text_ink_qa.md) for checks and owner QA.
Application rendering and served-file verification remain limited by existing
restrictions; no blocked route is retried.

## November 10 hidden controls marker repair

The owner's iPhone screenshot shows a small isolated square below the complete
Waveform mark. Changed-setting indicators are 0.25rem squares; their explicit
`visibility: visible` overrode the closed touch sheet's inherited
`visibility: hidden`. Changed indicators now inherit label/sheet visibility.
They remain visible when the controls reopen, while default indicators retain
their hidden state. This is a CSS-only runtime repair; audio, waveform geometry,
zoom transforms and the scope-history transition remain unchanged.

All routed stylesheet/shell/bootstrap references and Home prefetch advance
together. The concurrent #158 exact theme-text release is retained. The mobile
smoke script now asserts changed-marker visibility through close/reopen at each
existing phone/tablet viewport. All 950 unit tests pass on the reconciled tree;
changed scripts compile and whitespace checks pass. The mobile browser script
was added/syntax-checked, not executed: local browser restrictions remain in
force, the cloud browser cannot reach the localhost candidate and responsive
DevTools are blocked. Production cloud desktop checks and deployment evidence
are reported separately; no physical iPhone Safari pass is claimed. The
owner screenshot remains private and is not added to the public repository.

## November 10 scope transition and X-scale correction

Owner live testing confirmed the actual-audio scope works, then identified a
frequency/density ramp after parameter edits. The controller cleared the live
ring on every edit and stretched the growing partial buffer across the full
bar. It now retains a bounded continuous recording through shape/depth/rate
and enabled/disabled edits. Changing a timebase reframes actual retained history
once; later packets keep that fixed physical X scale. Missing history stays
blank on the left, with recorded seconds and unrecorded space explicitly labeled.

Views spanning an edit say they include parameter changes. Silent rendering
holds its previous actual frame with a previous-settings label while the latest
replacement renders; stale completions cannot replace it. Frozen frames and
recordings remain exact through edits, mute, incoming data and background render
completion until playback resumes. Audio graph/ramp behavior, fixed gain scale,
current 50fps GIF cadence and encoder guards are unchanged. Partial-history
preview, header, SVG and PNG share the same bounded coverage geometry.

See [transition QA and owner checklist](waveform_scope_transitions_qa.md).
Source, numerical/controller and native raster checks are distinct from browser
verification. Existing browser restrictions remain respected; owner live
feedback is the supplied rendered evidence, and no new browser pass is claimed.



## November 10 routed shell cache follow-up

Live verification of merged #144 found a warm browser could keep the old fetched
generator shell and its ordered-alpha GIF helper after a normal route reload.
The helper URL was updated, but every style route and the bootstrap fallback
still requested the unchanged `20261110-waveform-scope` shell URL. Route shell
and bootstrap URLs plus Home prefetch now advance together. Actual-audio scope,
50 fps timing, encoder source/guards, controls and all geometry are unchanged.
The concurrent #155 official secondary-color release is preserved. Its route
shell advance is retained in a coordinated new version alongside fallback,
bootstrap URLs and Home prefetch. A warm-cache regression executes the actual
loader and confirms it
requests a fresh shell and loads the corrected helper; all route/fallback/Home
cache references are checked together. All 941 tests in 84 suites pass; route
inline scripts, bootstrap syntax and whitespace checks pass. Deployed browser
GIF/PNG verification
follows the protected follow-up merge. No cache disabling or hard-refresh
workaround is required from the user.

## November 10 official secondary composition audit

The current official Brand Hub Secondary Colors page was opened in the permitted
cloud browser, visually inspected and compared with both original owner screenshots.
Its six logo examples explicitly show Gray on Red, Silver on Blue, Black on Gold,
Red on Gray, Blue on Silver and Gray on Black. These govern permitted secondary
compositions; the Color Accessibility table is not a brand-combination allowlist.

This corrects PR #150: Black on Blue becomes Silver on Blue, Black on Gray becomes
Red on Gray, Black on Silver becomes Blue on Silver, and Gray on Red is restored.
Exact official hex values, primary options, Mission Control and default Black on
White remain. Existing blue/gray/silver saves retain their keys and load the
correct official composition. Gray on Red query/snapshot values retain that pair;
the mistaken White on Red migration is removed. Red on White stays removed with
its existing neutral recovery under the owner's separate instruction.

Idle menu rows remain neutral. Hover/selected/keyboard rows show the composition
background and a small border-free mark in its actual logo ink. Compact names,
checkmarks and the single focus outline use accessible black/white UI text,
following the official typography guidance; no low-contrast label is enlarged or
mistaken for an alternative permitted logo ink. The native control, modal, layout,
export transparency and all intervening audio/GIF features remain intact.

All 939 tests in 83 suites pass, including 76 focused preview/export/save checks.
Source evidence, exact pairs, audit coverage and verification limits are recorded
in [the official pairing audit](secondary_pair_audit.md) and its standalone PR.

## November 10 straight GIF edge repair

The supplied animation screenshot was materialized with its Library identity,
verified as a readable 223,213-byte PNG and inspected before diagnosis. Its
repeating teeth on straight Waveform edges reproduce in GIF alpha conversion:
the source raster has straight edges, while the former ordered 4 × 4 coverage
mask varies them across rows. GIF now defaults to uniform half-coverage alpha
quantization. Palette colors, transparency, disposal, dimensions, geometry,
SVG/PNG output, audio, LFO and frame timing remain intact. The current 50 fps cadence
and actual-audio scope behavior remain intact.

Final reconciliation at main `ffbd569` retains #143–#154, including 50 fps /
20 ms timing, encoder guards and actual post-gain PCM scope: 939 tests in
83 suites pass. Initial baseline
was 875 tests in 78 suites. Native raster/actual vendored
codec comparisons decode 20 historical-geometry fixture files / 160 sampled
frames across Waveform square
and square/pulse shapes at both sizes and compositions, plus Ticker and Gradient.
Straight source edges have zero row variation; old encoded edges add 21,440
row differences in the measured interior bands; corrected encoded edges add
zero. The preserved actual-audio pipeline also passes 90 exact PCM parity
cases, the exact silent tap, 24 PNGs and six GIFs / 600 decoded frames with
the new alpha mode. Focused regressions also check translating subpixel edges in three exact
ink colors through the actual codec, including transparency and disposal.
The supported cloud browser now reaches production and produced a real baseline
GIF: 166 frames / 3330 ms / 455,925 bytes, with 43,140 edge-row differences in
measured straight bands. Post-deployment GIF verification follows the protected
merge. Prior denied local-browser calls were not retried. Native audio, physical
viewer perception and formal RPI approval are separate from these checks. See [GIF edge QA](gif_edge_qa.md) and its generated review image.

## November 10 actual audio Waveform scope

Following the owner's VCO/VCA examples and explicit request for a direct scope,
Waveform now displays extrema from the actual post-gain audio signal. A silent
side-tap worklet records live audio; with Audio off, OfflineAudioContext runs
the same shared graph without sound. The view fits two LFO periods or at least
four carrier periods, including 28.571 seconds at .07Hz. Source, time window,
filling history and fallback/error state are visible. No mathematical waveform
or high-rate average substitutes for actual data.

The audible oscillator graph and ramps are extracted intact into a shared
module and checked against an independent pre-refactor reference. The scope's
silent output cannot duplicate the audible signal. Ring history is bounded,
render jobs are debounced/serialized, stale results are discarded, and frozen
frames remain fixed while explicit audio may continue. Main/header/SVG/PNG/GIF
share PCM geometry. Still files capture the displayed frame; GIF replays frozen
recorded history from that frame and can reset when history wraps. The combined
candidate preserves #153’s 50fps/20ms GIF cadence and encoder guards. It passes
938 unit tests in 83 suites; native QA includes 90 exact PCM parity cases,
42 AM-product cases, 24 PNGs and six GIFs through all 600 decoded frames.

See [model and source distinction](bar_science_notes.md#actual-audio-waveform-scope--november-10-2026)
and [scope QA](waveform_signal_qa.md). No browser escalation was retried.
Native offline graph/data/codec checks do not establish rendered browser UI,
physical listening, native downloads, screen-reader output or formal RPI approval.

## November 10 Particle on a Ring GIF export

The former Quantum label becomes **Particle on a Ring**, the established model
name. Its card identifies the three convention-dependent wavefunction phase
projections of equal-weight modes −4, 3, 7. The model, artwork, legacy URLs,
control IDs, queries and saved links remain unchanged; the creative Phase Weave
candidate stays separate. [Scientific basis](quantum_model.md).

Default 1× exports the complete seamless 120-second cycle at 30 fps, with exact
live phase, speed/direction, ink and composition captured before asynchronous
work. Ring-only limits are 120 seconds/3600 frames; other families retain
100 seconds/3000 frames. The 32 MiB two-input-frame and 64 MiB encoded guards
remain. SPEED below 1× gets an actionable limit message without changing speed.

Full-logo GIFs longer than one minute use Standard resolution to stay practical
within the file budget. The GIF action discloses this and its actual dimensions
before export; the captured filename/progress use those same dimensions. Bar-only
retains the selected Standard/Large size, as do full-logo GIFs up to one minute.
PNG/SVG/clipboard and their selected size remain unchanged. There is no frame-rate
reduction, truncation, matte or artificial speed change.

Current main's compact theme picker/reference pairs, disclosures, Randomize die
and responsive marquee follow-ups are preserved. The later 50 fps defaults for translating families are also retained; this bar explicitly keeps its measured 30 fps budget. All 1029 tests in 89 suites pass; all 84 inline scripts compile. Three default-speed GIFs decode through all 10,800 frames with verified motion/timing/seam and 192 exact source-pixel references. With the released alpha correction, default full-logo GIF is 32.04 MB; prior ordered-alpha bar-only measurements are 11.30/27.41 MB at Standard/Large. [GIF QA](quantum_gif_qa.md) records evidence and limits. Completed export status/statistics reset on style, theme, size/composition, parameter edits and credits-context changes. Captured in-flight exports remain cancellable and name their source style; late results do not appear under a new context. Browser restrictions remain
respected; native codec evidence does not establish browser download/playback.


## November 10 GIF cadence closer to display-driven motion

The GIF planner now targets approximately 50 fps with 20 ms holds, replacing
30/40 ms cadence while preserving full duration within 5 ms and the same
elapsed-time phase samples. Odd centisecond durations need one 30 ms hold.
Existing 3000-frame, 100-second, two-input-frame/32 MiB and encoded-output/64 MiB
limits remain. Long loops may therefore have a lower cadence. SVG/PNG, palette,
current size choices and captured composition are unchanged.

Sixteen matched actual GIFs were independently decoded through all 3400 frames.
Full-logo Standard Ticker/Waveform/Gradient examples grow from 843046/1538325/
3019636 bytes to 1404379/2562317/5032238 bytes respectively (2.5/5/10 seconds).
The measured maximum encoded hold halves from 40 to 20 ms; average held-sample
age drops from 17 to 10 ms. These are encoded timing metrics, not native browser
playback proof. All 12 periodic raster recurrence cases close exactly, and 927
unit tests in 81 suites pass after #151 reconciliation.

The separate PR #144 owns straight-edge alpha quantization; no encoder-alpha
source is changed here. Its explicit threshold mode also passed a matched
cadence comparison. The pending actual-PCM waveform task retains its recorded
history and honest boundary-reset contract; this repair does not synthesize a
seamless period for recorded audio. Preserve separately approved Quantum limits.
See [bytes, encoding times, source evidence and format caveats](gif_cadence_benchmark.md).
GIF retains binary alpha and viewer-dependent presentation. A separate APNG
option is recommended for partial alpha and finer frame timing; GIF is not
silently replaced. Publication/deployment evidence is recorded with the PR.

## November 10 neutral theme rows with contextual pair previews

Color Theme now matches the default neutral dropdown until a row is hovered,
selected or keyboard-active. Those states show the unchanged exact brand pair;
selection retains the existing checkmark. Keyboard navigation gets the same pair
preview plus one 2px inset outline using its contrasting foreground. Stacked
black/white keylines and hover shadows are removed. Color changes are immediate
to avoid unreadable intermediate blends; the menu border and thin scroll boundary
remain. Compact typography, geometry, grouping, palette and old-save recovery
are unchanged. No runtime controller or export implementation changes.

The latest owner PNG was materialized, identity verified and actually inspected
before editing. All 926 tests in 81 suites pass after preserving PR #151, plus
JavaScript/80 inline-script syntax, 26 cache and exact source-preservation checks.
Tests, release status and owner checks are
recorded in the PR and [state QA record](theme_row_states_qa.md). Existing browser
restrictions remain; blocked live-network requests are not retried without permission.

## November 10 Randomize dice legibility correction

The first two supplied image IDs resolved to a color picker and contrast table,
not the Randomize control. Both were materialized, verified and viewed. The
subsequent authoritative 512 × 512 PNG reference was also materialized and
viewed: 34,497 bytes, SHA-256
`246935c79ffd58d665e9f8a4748a1d8779fd7ab7d2c68d2de4f091ad308ab655`.
It shows overlapping dice with three diagonal pips on the front. The owner's
later refinement retains that recognizable composition with the generator's
lighter outlined aesthetic rather than the reference's heavier filled styling.

Randomize now uses thin paired outlines, a tilted rear face, three diagonal
front pips and larger circular pip centers. The icon stays at the existing
18 px size and inherits currentColor; button dimensions, accessible/visible
labels, hover/focus treatment, action callbacks and reduced-motion-aware
feedback remain unchanged. No theme, disclosure, motion, model or export UI is
changed. The supplied raster is not published or embedded.

The actual previous/new SVGs were compared beside the existing 10 px RPI Geist
Mono Randomize label at 18 px icon size in native 32/44 px button reconstructions,
including light/dark, hover and focus treatments. Native-size 16/18/20/24 px
raster checks confirm individually visible front-pip centers. This is offline
SVG/font context evidence, not rendered browser/application proof. Full-suite
and exact-head CI results are recorded in the PR; native browser, touch,
screen-reader and physical-device appearance remain unverified under the
existing browser restriction. No denied browser route is retried.

## November 10 compact theme picker correction

The owner rejected the enlarged bold theme rows. Color Theme again uses its
previous compact RPIGeistMono typography, uppercase text, padding, row height,
group headings and existing sidebar checkmark. The full-row pairing colors,
two-tone hover/focus cues and unobscured scrolling remain; the added circular
checkmark and oversized type are removed. No new picker design or choices are added.

The supplied accessibility table now governs the existing composition choices:
Blue, Gray and Silver use black foregrounds on their exact brand backgrounds.
Gray on Red is retired because it is absent from the normal-text-approved table;
old query/snapshot values recover to White on Red while keeping other settings.
Red on White remains removed with its existing Black on White recovery. The
remaining pairs all meet 4.5:1 normal-text contrast without enlarging the labels.
The header, popup/help, native interaction logic and export geometry are preserved.

Both new Library PNGs were materialized and their actual pixels inspected.
All 926 tests in 81 suites, JavaScript/inline syntax, 26 entrypoint cache and
source-preservation checks pass. Validation and release evidence are recorded in the correction PR and
[focused QA record](theme_picker_correction_qa.md). Browser rendering and native
device/screen-reader behavior remain unverified under the existing restrictions.

## November 10 full-color theme rows

Color Theme now presents each retained foreground/background pair as a full-width
row, matching the owner's accessibility-table reference. Nested swatches are
removed from rows and the neutral closed trigger. Names stay readable and
accessible; selected rows have a separate, decorative black/white checkmark.

Row labels use the existing bold RPI Geist face at 20px by default with a 19px
minimum. All ten pairs meet the 3:1 large-text threshold without changing their
palette values. Hover uses a two-tone underline; keyboard-active rows use a
two-tone inset frame. A thin scrollbar keeps rows unobscured by fading overlays,
and forced-colors mode retains a system-color focus outline. Keyboard, touch,
selection, legacy-red recovery, header/help/modal and export behavior remain.

Validation: all 926 tests in 81 suites pass after preserving PRs #146 and #147, including pair contrast and state-cue
checks. JavaScript, source/cache and whitespace checks pass. The optional browser
script now checks all row colors, hover/active/selected states and touch selection.
Actual browser rendering and physical-device behavior remain unverified under
the established restrictions; no denied browser action is retried.
See [row layout evidence and QA](theme_rows_qa.md) for sources and owner checks.

## November 10 screenshot-directed control presentation correction

The owner's 702 × 542 PNG was materialized from the specified Library ID into
this executor, verified as 32,271 readable bytes with SHA-256
`c810985df5b3298300da4ae1d7c5e8ce77da1da8c5022857190b55a2ffd2e8a7`, and
visually inspected before edits. Its visible text is “0.2–4× default speed”;
that helper line is now screen-reader-only for Ticker, Waveform, Gradient and
Quantum, preserving the range/snap description without its visible spacing.

All sidebar section chevrons use a thin SVG stroke, centered in a fixed flex
box beside the heading. Collapsed points right; expanded points down, a 90°
rotation. Native button semantics, aria-expanded/controls, focus safety, mounted
values, independent sections, scroll-cue notifications and the About footer stay
intact. No transition or new animation is added.

Randomize uses one original outlined five-pip die in the existing icon language,
replacing shuffle across every parameter group. Existing visible and accessible
Randomize labels, hit targets, currentColor hover/focus treatment and bounded
reduced-motion-aware action feedback remain. The Feather registry is unchanged.

Source/controller tests cover every section heading and both disclosure states,
focus retention, speed descriptions and all generated Randomize buttons. Actual
SVGs were rasterized and inspected at 12, 16, 18 and 24 px, including both
chevron orientations; this is isolated icon QA, not rendered application QA. Full
suite and exact-head CI results are recorded in the PR. Rendered desktop/mobile
layout, native keyboard/touch, screen-reader output and visual acceptance remain
unverified under the existing browser restriction; no denied route is retried.

## November 10 secondary-color popup corners and compact help focus

The Secondary Color Usage popup now uses the same `--control-radius` token
as Export and the other editor controls (currently 2px), overriding only its
inherited 8px report-dialog radius. The existing outer `overflow: hidden`
already clips its contents; the inner panel retains its border-free structure,
so no additional border or clipping layer is added.

How to use retains its transparent 44px minimum touch target, while a label span
receives a tight red keyboard-focus outline around the underlined sentence-case
text. The full button no longer paints the oversized black focus rectangle.
Secondary-only visibility, modal content, dismissal, scroll limits and
responsive sizing are unchanged. The existing optional browser smoke script now compares the popup
and Export radii and checks outer clipping and the absence of an inner border.
Validation: 8 focused tests in 3 suites pass, along with JavaScript syntax,
26 entrypoint/80 inline-script cache checks, unchanged modal source and whitespace.
The optional browser check also verifies the compact label focus and retained
touch target. Rendered corner/focus appearance remains unverified under the known browser
restrictions; no denied browser action is retried.

The release also preserves PR #143's GIF frame-rate implementation and cache URLs.

## November 10 marquee focus across responsive rows

Nonselected complete bars now dim to 20% opacity, with a uniform 240 ms ease-out
for both directions and no gap-specific hold or delay. The selection manager
registers every row added during responsive fitting, repairing lower rows that
previously had pointer handlers but no stage-wide dimming callback. This applies
during initial layout and later resize; pruning a hovered link also clears the
shared owner immediately. DPR does not multiply CSS coordinates.
Keyboard priority, visible focus, static artwork, drag behavior and reduced
motion remain intact. Both Home URLs refresh only the affected runtime/CSS keys.

The final combined candidate on main `e19238a` passes all 904 tests in 80 suites.
Responsive Node VM regressions cover portrait, ultrawide, 4K and 8K CSS viewports,
DPR1/2/3 and row removal/recreation. They exercise supplied analytic bounds and
actual fitting/selection code; no rendered or physical-display pass is claimed.
The optional browser harness now includes native bottom-row hit tests and the
new opacity/timing expectations. Existing browser permission restrictions are
respected. See [source finding and QA limits](marquee_focus_followup_qa.md).


## November 10 GIF sampling and resource limits

Eligible GIF loops now target approximately 30 fps over their complete duration,
replacing the old 24 fps request capped to 72 frames. Balanced 30/40 ms GIF delays
preserve full duration within 5 ms and sample actual elapsed phases. Counts range
from 2 to 3000; guards bound 100 seconds, two input frames to 32 MiB and encoded
chunks to 64 MiB, with cleanup and explicit recovery guidance. Preview motion,
SVG/PNG and captured composition/size remain intact.

Matched cloud exports measured 1.25× bytes for a 2.5-second Ticker, 2.08× for a
five-second Waveform and 4.17× for a ten-second Gradient. Sixteen real GIFs were
independently decoded through all 2052 frames, with exact duration/repeat/disposal
and first/last renderer coverage checked. A final Large bar-only Waveform also
passed on the integrated default plan/limited encoder. All 12 combinations of
family, size and composition have identical phase-0/full-recurrence raster
coverage. The existing native matrix checked 264 PNG/SVG cases.

All 890 tests in 79 suites pass after reconciling theme #140 and LFO/sidebar #141;
syntax and whitespace checks pass. See [exact bytes, encoding times, limits and
verification caveats](gif_frame_rate_benchmark.md). Rendered browser/native
playback and perceived smoothness remain unverified because prior browser
execution denials were respected. No formal brand acceptance is claimed.
Publication and serial integration with the separate visual LFO signal repair
await the ready PR's required checks. Existing branches are retained.

## November 10 LFO, speed landmarks and sidebar disclosures

LFO now sits with the Waveform parameters, above Motion and Preview. Its help
icon opens explanatory text on keyboard focus, hover or deliberate touch/click;
Escape, blur and outside press dismiss it. LFO waveform, Hz rate and depth keep
explicit labels. The 0.07–1300 Hz logarithmic range, continuous folding, audio
and visual transport, snapshots, URLs and export behavior are unchanged.

Ticker, Waveform, Gradient and Quantum share subtle 0.5×, 1× and 2× ticks.
Pointer input snaps within 0.025× of these landmarks before persistence/render
listeners run. Leaving that narrow window restores granular native range input.
Keyboard adjustments and direct numeric entry bypass snapping. Stored values
remain physical rates with the existing precision; LFO Hz has no speed ticks.

Parameters, Motion, Preview and Comms headings become independent native-button
disclosures after parameter action setup. All default open; collapsing keeps
controls mounted and values intact, retains focus on the button, updates
aria-expanded and signals the existing scroll-cue controller. Choices survive
style switches for the current page. Randomize/Undo/Reset remain separate header
actions. The separately published compact About footer remains intact.

The full local suite and exact-head CI results are recorded in the PR. The
combined candidate preserves published Why not and compact About footer changes. Rendered desktop/mobile layout, actual touch,
screen-reader output, native keyboard behavior and audible output remain
unverified under the existing browser restriction; no denied browser execution
was retried or bypassed. No screenshots or formal brand-approval claim is made.

## November 10 paired theme swatches and retired Red on White

Each color theme choice and the selected trigger now show a compact background
tile containing a mark in the actual foreground color. Full pairing names
remain visible and accessible; decorative swatches are hidden from assistive
technology. The existing visual-menu enhancement is also used for touch color
selection, with the same keyboard navigation, focus, selected state and scroll
fades. Labels can wrap while the paired tile keeps its compact dimensions.

Red on White is removed from available themes. Older red/red-on-white query
values and saved version-1 snapshots recover as Black on White, retaining other
saved settings. The remaining Brand Hub pairs, neutral header/sidebar, underlined
secondary-only How to use control, modal and export-composition feature remain
intact. Red-ink export fixtures now use the retained Red on Gray pairing.

All 874 tests in 78 suites pass after preserving PR #135, PR #139 and PR #138. Source/unit
validation and the existing optional browser harness cover the change. Rendered desktop/touch layout, native interactions and owner acceptance
remain unverified under the documented browser restrictions. No new asset,
dependency or denied browser action is introduced.
See [picker QA and compatibility](theme_picker_qa.md) for checks and user test items.

## November 10 slightly longer Home ASCII entrance

Only the Home ASCII reveal is extended: first visits use 640 ms instead of
580 ms (+60 ms), and repeat visits use 440 ms instead of 400 ms (+40 ms).
The existing reveal curve, sampling, letter layout, artwork and cleanup margins
are retained. Plain-fade fallback stays at 580/400 ms; generator ASCII stays at
580 ms. Reduced motion, saved pause, navigation restoration and user-input
cancellation still bypass or cancel the entrance. Both Home URLs use the new
pageEntrance cache key; generator URLs and unrelated transitions are untouched.

After preserving theme release #140 and controls release #141 at main
`44f8992`, the final cloud candidate passes all 887 tests in 79 suites.
Regression checks exercise first/repeat Home ASCII timing and cleanup, unchanged
fade fallback after missing/failed ASCII preparation, unchanged generator timing,
and reduced-motion/pause/navigation bypass. Final checks and the tested tree
are recorded in the release PR. Rendered browser QA remains unverified under the
existing browser permission restrictions; no browser retry or bypass is attempted.

## November 10 optional generator keyboard shortcuts

The three-dot menu now includes a Keyboard shortcuts guide beside Why not… .
The native modal uses the current theme and contains focus, supports Escape,
and restores focus to the menu summary. N randomizes current parameters, U
undoes the last randomize, E opens download options, and ? opens the guide.
Existing Space playback, +/= and − zoom, 0 Fit, Shift+Space quick styles and
Shift+Up/Down color modes use one shared guard. Unsupported actions do nothing.

Shortcuts ignore text entry, selects, editable content and interactive widgets;
open menus/dialogs, composition, held-key repeat and Ctrl/Command/Alt/AltGraph
combinations are excluded. External keyboards on touch devices work as well.
The guide offers a saved switch disabling every listed shortcut; its menu
button and native control navigation remain available. Restricted storage uses
an in-page preference. The hidden rpi1824 sequence remains separate; N avoids
changing parameters while entering it. Rendering, exports and brand colors
are unchanged.

Validation and manual checks are recorded in [keyboard shortcut QA](keyboard_shortcuts_qa.md).
No browser
launch is retried after the existing permission denial; rendered desktop/mobile,
light/dark, focus and reduced-motion review remains pending manual verification.

## November 10 optional intro retry repair

The three-dot menu's Why not... action retains its selected-bar ASCII overlay,
reduced-motion still view and explicit one-run playback. The optional script
loader now verifies the controller API after download. An evaluation failure
previously left a resolved loader promise and unusable script tag cached, so
subsequent activations could never retry. Unusable tags are now removed and
failed loads evicted. Palette values, themes, geometry and exports are unchanged.

Cloud verification: 787 unit tests in 71 suites pass. Focused coverage exercises
actual loader caching, failed download/evaluation recovery, concurrent/repeated
activation, default overlay creation, Escape/Close/iframe cancellation, Tab and
Shift-Tab focus and exact existing colors. JavaScript syntax and whitespace
checks pass. Browser launching remains sandbox-blocked; no launch bypass was
attempted. The original live incident, rendered menu hit targets and physical
keyboard/touch behavior remain unverified. See [intro QA and integration notes](why_not_intro_qa.md).

## November 10 header and secondary-help presentation correction

Following the owner's screenshot review, the header uses the same surface token
as the sidebar at desktop and touch widths. The selected brand composition's
background is confined to the logo preview; the header mark returns to its
neutral chrome ink. Applying or restoring a theme clears the former inline
header/app overrides. All exact brand pairings and export ink remain unchanged.

The secondary-only helper now reads “How to use” in sentence case as underlined
RPI-red text, with no icon, border or background. It remains a native button for
the modal action, with a transparent touch target and visible keyboard focus.
The existing modal copy, descriptive link, focus return, Escape/backdrop/Close
dismissal, overflow behavior and reopening controller are preserved.

The new user screenshot was materialized, its identity verified and its pixels
inspected before editing. After preserving PR #136, all 854 unit tests in 78 suites pass, including the focused theme,
mobile-browser and modal checks. Required PR checks run before publication. The existing
browser smoke script now checks header/sidebar equality and the text helper.
Rendered desktop/mobile appearance and native interactions remain unverified
under the documented browser restrictions; no denied browser action is retried.
The standalone release is tracked by [PR #137](https://github.com/tennitech/the-bar-generator/pull/137).
See [source and QA evidence](brand_color_context_qa.md) for user test items.

## November 10 export composition choice

The export menu adds two illustrated native radio cards, **Bar + RPI** and
**Bar only**, using existing official vector paths and theme tokens. The complete
mark and Large raster size remain the defaults. Selection has visible radio,
border and keyboard-focus states; labels and descriptions remain accessible.
It persists across menu/style synchronization and locks during export/copy jobs.

One frozen snapshot carries composition and viewport through SVG, PNG, eligible
Ticker/Waveform/Gradient GIFs and native SVG/PNG clipboard payloads. Bar-only omits letter
paths and crops to the canonical bar plus proportional clear space, producing
1160 × 232 / 2320 × 464 rasters. Pattern coordinates, current data/seed/settings,
transparent backgrounds, resting still phase and existing loop plans remain
unchanged. No runtime dependency, new asset or replacement logo is added.

Validation and integration guidance are recorded in
[export composition QA](export_composition_qa.md). Source/unit and offline native
raster/codec checks are separate from rendered browser QA. Browser launch/socket
escalation was already rejected in this environment; it was not retried or
bypassed. Rendered menu layout, real keyboard/touch behavior, screen readers and
native clipboard/paste remain unverified. The incremental release preserves the published brand composition and PR 133
motion changes. The reconciled tree passes 854 unit tests, 264 PNG cases,
12 GIFs / 816 decoded frames and 12 clipboard-adapter requests.
Engineering validation does not establish owner acceptance or formal brand approval.

## November 10 compact pinned sidebar footer

The boxed About card is replaced by a native disclosure labeled **About [current
style]**, collapsed on initial load. Existing explanations and Artemis credits
remain available. Style changes update its label and copy without changing the
chosen open/closed state; a different style starts its explanation at the top.

Controls now scroll separately above the pinned footer, with one subtle,
full-width divider. Report a Problem and the three-dot menu remain below About.
Expanded information has a bounded keyboard-scrollable reading region so the
footer actions and controls remain reachable in short windows and touch sheets.
The passive gradient/More below cue still appears only for offscreen controls;
its resize and toggle observers follow disclosure height changes.

The branch starts at `05655f6` and incorporates export-composition release #136
at `fed8e88`, brand header repair #137 at `d55bdc1`, and Why not retry
repair #138 at `dfcc987`; their source and tests are retained. Other active
release worktrees and branches remain untouched. Validation and remaining
rendered/browser limitations are recorded in [sidebar footer QA](sidebar_footer_qa.md).
The reconciled candidate passes **863 unit tests in 78 suites**. Browser
restrictions remain respected; no rendered validation or new screenshots are claimed.

## November 10 six-feature and brand release reconciliation

PR #133 is reconciled with published PR #134 at `04194d6a4f96aeb67d0d679a24ffad758ba6610e`.
All contextual brand compositions, the How to Use modal, native dialog handling,
actual-ink filenames and brand source records remain intact. Cache conflicts
are resolved consistently across shell, route stubs and both Home URLs; status
sections are additive. Non-Waveform still exports no longer read LFO settings.
The combined required suite passes **833 tests in 77 suites**; rendered browser,
native audio and real download QA remain blocked as recorded below. The parent
thread coordinates merging after the final-head Checks run. No protection or
workflow requirement was changed.

## November 10 contextual brand compositions and secondary color guidance

The color menu now names foreground and background together. Primary choices
include Black on White, White on Black, White on Red, and the explicitly limited
Red on White treatment. Secondary choices reproduce the six combinations in the
owner's Brand Hub screenshots: Gray on Red, Silver on Blue, Black on Gold, Red
on Gray, Blue on Silver, and Gray on Black. Exact published hex values are shared
by first paint, the preview, the header mark, and the runtime export ink; control
chrome and small header text retain accessible neutral colors.

The former coming-soon disclosure is replaced by a red How to Use button that
appears only for secondary compositions. It opens a native modal dialog with a
dimmed background, the four supplied Secondary Color Usage bullets, and the
descriptive Brand Hub link. The controller handles contextual visibility, Close,
Escape cancellation, deliberate backdrop clicks, scroll reset, focus return,
and reopening. Modal interactions preserve the mobile sidebar behind the dialog,
and generator shortcuts stay inactive within it. Native dialog behavior supplies focus containment and an inert
background.

Validation: the original candidate passes all 784 unit tests in 72 suites in
cloud Node 24.22.1. The main reconciliation also preserves PR #132's static
Home release. The combined suite passes all 789 tests in 73 suites before
publication.
The two focused new checks exercise exact palette propagation into preview and
export snapshots, filenames, and the modal controller's lifecycle. JavaScript
syntax, inline generator scripts, entrypoint consistency, exact guidance copy,
and whitespace checks pass. Rendered browser QA, actual native focus trapping,
responsive layout/scrolling, touch behavior, and raster download appearance remain
unverified in this environment. Known Chromium socket sandbox and missing WebKit
library blockers were respected; no browser bypass or new browser screenshots
were attempted. The existing neutral-theme smoke script now checks the new
compositions and modal when a working browser is available.

This change is separate from the six-feature release candidate. The owner has
authorized its own reviewed PR to main without waiting for the other features.
Publication is recorded by that PR; rendered browser QA and formal RPI approval
remain separate from source and unit-test verification.
See [brand color sources and QA](brand_color_context_qa.md) for the evidence,
compatibility notes, rerun command, and integration concerns.

## November 10 uniform marquee easing and motion button removal

All complete Home bar links now use one 160 ms opacity transition in both
directions, with `cubic-bezier(0.25, 0.46, 0.45, 0.94)` replacing `ease`.
The curve responds earlier and settles gently within the existing duration.
There is no gap-specific state, timing or dim hold: pointer leave still clears
selection synchronously. Hover and visible keyboard focus retain exact 50%
neighbor dimming, keyboard priority and the original focus outline. Static SVG
artwork, row physics, generator rendering and exports are unchanged; reduced
motion still disables transitions.

Both Home URLs remove the play/pause button and its reserved layout space.
Space now pauses or resumes all rows, including from the generator skip link;
modified keys, repeated keys, editable controls and dialogs are ignored. The
Home region advertises the shortcut and its status through assistive-technology
guidance. Saved pause, cross-tab pause and system reduced motion keep their
existing behavior; Space cannot override reduced motion. No replacement visible
button is added. Both stylesheet and runtime cache keys agree on both URLs.

The original main `04194d6` candidate passes all 797 tests in 73 suites.
The final reconciliation builds on merged PR #133 / main `05655f6` and passes
all 841 tests in 77 suites. Its exact tested tree is recorded in PR #135.
After export-composition PR #136 advanced main to `fed8e88`, a second clean
reconciliation preserves its complete export tree and Home prefetch key. The
combined candidate passes all 862 tests in 78 suites.
The subsequent clean reconciliation with preview-background PR #137 / main
`d55bdc1` also passes all 862 tests in 78 suites, retaining its theme, preview
and export files byte for byte.
The clean combined tree with Why not repair PR #138 / main `dfcc987` passes
all 867 tests in 78 suites. Its generator repair and updated Home prefetch are
retained, and required CI is rerun after synchronizing this release branch.
After sidebar-footer PR #139 / main `ecec2e1`, the clean synchronized candidate
passes all 871 tests in 78 suites and retains its footer and cache references.
The new adjacent-bar lifecycle regression verifies immediate clearing in a gap,
selection on the next bar and protection from a stale leave event. Existing
static-artwork, keyboard, reduced-motion, drag and export regressions pass.
Analytical curve evaluation at 16 ms gives 18.7% transition progress instead of
9.5%; at 40 ms the difference narrows to 45.3% versus 40.9%, with both finishing
at 160 ms. These are calculated curve values, not rendered frame measurements.
The shortcut regressions exercise pause/resume, reduced-motion priority and
noninterference with typing and modified keys. Updated browser smoke scripts
cover the removed control and keyboard alternative but remain unexecuted.
JavaScript parsing, both Home inline scripts and whitespace checks pass.

Rendered browser QA remains blocked by the previously recorded and explicitly
denied browser runtime permissions; no browser retry, bypass, screenshots or
visual acceptance is claimed. PR #133 is already merged. Its generator changes,
Home dependency references and documentation are retained; all earlier branches
and worktrees are preserved.

## November 10 combined generator refinement

The isolated combined candidate includes the 450ms Home prompt, removed separate
Enter button, static individual marquee bars with 50% neighboring opacity and no
lift/splitting; canonical aligned generator ASCII entry; a bounded taller sidebar
overflow fade; dynamic Gradient controls/GIF with static Home previews; normalized
0.2–4× SPEED controls; a clearer existing shuffle icon; and Waveform audio/visual
LFO with continuous waveform folding and a separate logarithmic 0.07–1300Hz rate.

Original default motion rates, prior valid query/share values, official geometry,
profanity filtering and reduced-motion handling remain. Gradient and LFO changes
share the existing preview/header phase and export geometry. Joint LFO GIF loops
are limited to 100 seconds/3000 frames, with mean amplitude for longer cycles or
fast LFO. Retained Waveform settings cannot change other styles' GIF plans.

Validation: **831 tests in 76 suites pass**. Browser/native-audio/download visual
QA is blocked by the previously established Chromium socket restriction, missing
WebKit libraries and unreachable managed-browser localhost. The explicitly denied
browser escalation was not retried. No rendered/device/owner or formal brand
approval claim is made. The user has authorized publication and plans to test the
live batch. Export-composition choice and Easter egg repairs remain separate.

Exact source provenance, integration decisions, checks, limits and the owner test
list are in [combined generator validation](combined_generator_validation.md).
All original worktrees and branches are preserved. The combined worktree is
`the-bar-generator-integration`, branch `codex/feat-combined-generator-candidate`.

## November 6 outstanding-report verification

Rechecked the current release `0d86266` without changing application behavior.
Reports #43 and #53 no longer reproduce at their original URLs and 1489 × 974
viewport: Ticker contains only its natural ticks, and Waveform contains its
single signal polygon with no added baseline rectangle. Chromium and WebKit
also pass at 390 × 844, including shared preview/export source, real SVG/PNG
downloads, no horizontal overflow and no page errors. Desktop Chromium and
mobile WebKit screenshots were visually inspected. The new reproducible check
is `scripts/outstandingReportsSmoke.js`; `RPI_SITE_URL`, `RPI_BROWSER` and
`RPI_EVIDENCE_DIR` select the server, engine and local evidence destination.

Binary is silent (#47), and Ruler is stationary even with historical motion
settings (#45). Both engines pass `audioAvailabilitySmoke.js` and the repaired
`rulerScaleSmoke.js` (45 geometry combinations, keyboard editing, reload,
legacy state, exports and mobile controls). The Ruler harness now selects Reset
by its action attribute instead of a class also used by Undo. All 782 unit tests
in 71 suites pass. This is test maintenance, not another application fix.

Issue #14's original URL also loads and exports in both engines at its original
1600 × 789 size and phone width, but its missing symptom prevents a completion
claim. Issue #13 still needs clarification of which additional fields and limits
are wanted beyond the existing Binary/Morse, Numeric and Nucleotide limits.
The four verified historical reports remain separate from tracker cleanup.

No physical Windows/Android/iOS device or live production interaction was tested
in this pass. Native iOS browser chrome and owner acceptance of ASCII motion
remain unverified. Production Frontify needs administrator-managed download and
clipboard delegation as described in `frontify_exports.md`; application changes
cannot supply those permissions. Existing branches and prior work are retained.

## November 5 iOS Safari top-surface repair

Issue #128 separates the browser's top/header tint from the bottom controls
surface. Opening Design controls keeps the top hint and root background matched
to the active header, while the body continues matching the controls below.
Theme changes and the full-screen intro retain their corresponding colors.

Regression coverage checks independent top/bottom colors, repeated open/close,
and theme changes. Native iOS Safari chrome remains controlled by Safari;
browser-engine checks do not substitute for physical-device verification.
The independent, unpublished ASCII revision is not included in this repair.

## November 4 whole-letter entrance and stable startup

Issue #127 supersedes the travelling ASCII wipe. Complete heading and generator
letters now blend independently from a held halftone/glyph texture into the
original artwork in place. All visible Home bars, the red RPI mark, credits and
controls participate automatically. Responsive title metrics follow the hero's
scale. Original content stays present behind the transition; its geometry and
semantic text never change. Fixed letter windows only change opacity, not their
boundaries. Cached glyph atlases and bounded sampling avoid per-frame font work.

Startup summaries preserve restored values until runtime restoration completes.
Quantum's automatic playback phase no longer counts as a user edit; intentional
phase seeks still do. Circle seed changes remain represented. No model, export,
canonical logo, hover-pause behavior or dependency changed. The existing p5 global
state bridges in main.js only notify the modular controls after restoration.

Validation and rendered-frame evidence are in
[the review record](review-images/ascii-letter-resolve/validation.md).
Owner aesthetic acceptance, physical devices and formal brand approval remain
separate from automated and visual engineering checks.

## November 4 per-preview hover pause release

Issue #111 holds the last rendered frame of an individually hovered or pressed
animated Home sample. Other samples continue on the shared phase; leaving or
releasing rejoins that phase without another timer or model. Global pause,
reduced motion and touch cancellation remain intact.

This additive change is based on merged PR #125's exact tree. Its redesigned
entrance, all generator controls, style separation, Home physics and prior work
remain unchanged. Both Home pages update only the marqueeAnimation cache key.
Validation: 71 focused tests pass. Chromium verifies native hover, hold, leave,
interruption, global pause, reduced motion and emulated touch cancellation.
All prior branches remain preserved. Software checks do not establish owner
acceptance or formal brand approval.

## November 4 automatic ASCII wake refinement

Issue #124 replaces the static full-frame ASCII crossfade with a travelling
terminal-density wake. The actual heading letter silhouettes and canonical
generator artwork are sampled; held glyph shimmer and halftone dots resolve left to right
into the unchanged live originals through complementary clips. No mouseover,
React, dependency, replacement logo, or export change is involved. Home controls
and credits stay still; gallery bars are not resampled. Glyph sprites are rasterized
once and reused so the loop avoids repeated font shaping. The 580 ms first entrance / 400 ms repeat Home timing,
preparation deadline, reduced-motion bypass, saved pause and interruption cleanup
remain intact. All sampling and display canvases are bounded; the short render
loop ends with the entrance and does not become an idle effect.

The supplied Bencho ASCII wake source was read as a visual reference for density,
held shimmer and dots. This implementation is original vanilla JavaScript, not
an imported copy of the React cube or pointer/heat simulation. Existing font,
logo and brand-approval questions remain open. No new external assets are added.
See `review-images/ascii-wake/validation.md` for checks and image provenance.

## November 4 independent neighboring-style separation

Issue #113 partitions selected Home style families into disjoint palettes for
neighboring rows. Each circular row uses distinct families, including its repeat
seam; configurations of one family remain grouped. All selected families remain
represented, with at most seven slots per row and no new per-frame work.
The algorithm is byte-identical to the earlier tested neighbor candidate.

This independent release builds on the final playful Home/ASCII/parameter tree
`5477832`. It does not include per-preview hover pause. Preview animation,
playful drag, hover focus, ASCII entrance, generator controls and exports are
unchanged. Both Home pages change only the marqueeUi script cache reference.

Validation: 144 focused tests in six suites pass, including 100 deterministic
random selections, circular seams, disjoint adjacent-row families, variant
catalogs, small catalogs and bounded row sizes. The prior neighbor browser
evidence is reused for the identical algorithm; no browser matrix is repeated.
Original branches are preserved. Software verification does not establish owner
acceptance, physical-device testing or formal brand approval.

## November 4 final playful Home release reconciliation

The verified PR109 candidate `f814077` is applied additively onto ASCII candidate
`a1144f3` (tree `5255c33f613d63e4ac5441075941a402f4881d40`), which already includes
parameter feedback and the published Home hover/off-row fixes. Home runtime and
CSS remain byte-identical to the verified PR109 candidate; ASCII, generator,
parameter, preview-animation and catalog runtime remain byte-identical to the
ASCII base. Both Home HTML files preserve ASCII entrance references and load
the new Home controls. Documentation sections are additive. Per-preview hover
pause and neighbor ordering are not included.

Validation: 194 focused tests in nine suites pass, all 84 inline scripts compile,
and the diff passes whitespace validation. The previously checked Chromium and
WebKit drag/control flows apply to the unchanged Home runtime. Browser matrices
were not repeated for this cache/document-only reconciliation. This is not
owner acceptance, physical-device certification or formal brand approval.

## November 4 playful Home controls integration

PR109's Home feature is isolated onto the published hover/off-row fix tree:
exponential glide uses gentler friction, a brief release grace period prevents
pointer jitter from catching a throw, and delayed releases taper naturally.
Perpendicular off-row movement still preserves velocity; holds, interruptions,
reduced motion and global pause still stop momentum. Home now has an accessible
icon-only play/pause control and a native Enter generator link. Both Home pages
load updated control assets without changing their animation/catalog references.

This integration does not include the pending per-preview hover-pause or
neighbor-ordering changes. Current generator controls and routing are unchanged.
Original feature and cumulative integration branches remain preserved.

## November 4 final ASCII, parameter feedback and Home integration

The verified ASCII candidate `cfecad2` is combined with parameter-feedback/Home
candidate `ffecb15` (tree `be381ee10be5826578a35c816c4ae2c30c73fbdc`, matching PR
#121 head `38b89741`). ASCII runtime, entrance CSS, generator runtime and both
review screenshots remain byte-identical to the checked ASCII candidate.
Parameter-feedback and Home hover runtime, styling, model and history files
remain byte-identical to the checked combined candidate. Only HTML/bootstrap
cache references and additive status sections needed integration; the shared
ASCII/shell key is `20261104-ascii-release`. Current parameter and Home asset
cache keys remain intact.

All 165 focused tests in ten suites pass, all 84 inline scripts compile, and the
diff passes whitespace validation. The preceding Chromium/WebKit entrance,
export, parameter and Home evidence applies to these unchanged runtime files;
those browser matrices were not repeated for this cache/document-only merge.
No owner testing or formal RPI approval is inferred.

## November 4 ASCII release integration recovery

The bounded ASCII entrance is integrated with the parametric Triangle Grid and
Circles Gradient release (deployed main `635e4de7`, identical local base tree
`879e029e5c7d368fcfdd3acb53abd3e33bb2e2a0`). Its models and controls are unchanged.
Shell, bootstrap, Home prefetch and entrance cache keys use
`20261104-ascii-parametric`; other current-main cache references are preserved.

Validation: 732 tests in 69 suites pass, and all 84 inline scripts compile.
Chromium and WebKit pass desktop/mobile ASCII cleanup, interruption, resize and
reduced-motion checks, all 34 entrance/navigation/control scenarios, and exact
SVG/PNG snapshot regressions for Triangles and Wave Quantum. Initial browser
runs hit process crashes while the temporary filesystem was 97% full; the
unchanged checks passed serially with browser temporary files on workspace disk.
The original two approved review screenshots and their source record are retained;
fresh Chromium captures were also visually inspected. This is implementation
verification, not physical-device acceptance or formal RPI approval.

## November 4 bounded ASCII entrance

Issue #101 adds a one-time sampled ASCII reveal. Home samples visible
bars once and places temporary symbol text over the existing semantic labels.
The generator samples a low-resolution rendering of its canonical vector mark,
then resolves into the real canvas. It does not sample the GPU canvas, alter
logo geometry or exports, or change parameter values. Artwork animation remains
held only during the entrance, through the existing PageEntrance contract.

The reveal is 580 ms on first load, shorter on repeated Home loads. Samples
are bounded to 100 by 64 cells, cached by source and size, and prepared in short
yielding tasks. A 180 ms preparation budget falls back to the normal reveal if
the device cannot keep up. There is no continuing ASCII render loop. Reduced
motion, saved Home pause, Back/Forward restore, input, visibility and navigation
cancel or bypass the entrance. Visual layers have no pointer events and are
hidden from assistive technology; actual text is never scrambled in the DOM.

Initial Linux headless measurements: Chromium generator source plus sampling
was roughly 3–4 ms normally and 12–13 ms at 4x CPU slowdown. Home preparation
was roughly 13–30 ms total, divided over tasks; slower runs can skip. WebKit
generator preparation was about 4–5 ms, while its Home scheduling sometimes
exceeded the budget and correctly fell back. These are not phone battery or
physical-device measurements. An early GPU capture prototype stalled for about
90–106 ms and was replaced rather than accepted as negligible overhead.

After integration with #118, #117 and LFO #102 (main 4af090b), 720 unit tests pass.
Chromium and WebKit desktop/390 px checks cover normal
completion or deadline fallback, refresh, keyboard interruption, reduced motion,
layer cleanup and page errors. Screenshots were inspected. Both engines pass
34 combined entrance/navigation/control scenarios and exact SVG/PNG snapshot
regressions for Triangles and Wave Quantum during asynchronous export. Cache
keys are aligned. The existing Home entry hooks remain compatible with pending
Home interaction releases; those changes are not included in this feature.
Additional Chromium checks
passed Gradient, Nucleotide, Lunar, Circles, Waveform, Neural Network, Triangle
Grid and Wave Quantum with live reduced-motion cancellation and no page errors.
Their measured source-plus-sampling work ranged from about 4 to 15 ms. No claim of formal brand approval
or owner acceptance is made.

## November 4 parameter feedback and Home release integration

The parameter-feedback candidate `25b6232` is combined with Home hover candidate
`0cab095`. Only the two additive project-status sections conflicted. All parameter
runtime, CSS, routed HTML and test files are byte-identical to the fully checked
feedback candidate; Home runtime, CSS, mirror HTML and tests are byte-identical
to the checked hover candidate. The primary Home HTML retains both hover cache
references plus the newer generator-shell prefetch key. No browser matrix is
repeated for unchanged runtime files; focused units and inline compilation are
rerun for this combined tree: all 129 focused tests in eight suites pass, and
all 84 inline scripts compile.

## November 4 parameter feedback recovery

The original action-feedback branch remains preserved at `5b02024`. Its feature
commit is integrated additively on the tested `e58f86c` tree, equivalent to deployed
main `635e4de`. Triangle Grid, Circles Gradient, Waveform LFO, Nucleotide and the
initial disabled Undo control are retained. Only appended CSS and status sections
needed conflict resolution; no bar algorithm or export renderer was replaced.
Changed assets, routed shells and bootstrap references use
`20261104-parameter-action-recovery`; unrelated runtime cache keys are unchanged.

The shuffle SVG and retained MIT license match the official Feather v4.29.2
GitHub blobs `116e2d42104d2ddc3998190087e8f3db5b5f3cd9` and
`1f4f4336baff1185dc78ae9e78cac46628dcc869` respectively. The 20-icon notice and
provenance table now include Randomize. Source/hash tests cover the registry.

Validation: 735 unit tests in 69 suites pass; all 84 inline scripts compile.
Chromium and WebKit pass the expanded 12-case Waveform/Triangle Grid/Circles
Gradient feedback matrix: 1280/320 px, full/reduced motion, repeated actions,
exact-artwork Undo/Reset, stable hit targets and live preference changes.
Both also pass six delayed-start/refresh cases at 1280/375/320 px, including
keyboard Undo and preserved startup positions. Unit coverage additionally checks
background/page-exit cancellation. Desktop and 320 px action rows were visually
inspected. These are local software checks, not owner testing or brand approval.
Both engines also pass complete Triangle Grid and Circles Gradient preset,
custom-query, legacy/current snapshot, keyboard/mobile, control/history, zoom,
header and 2320 × 1524 PNG integration checks. Initial Chromium screenshot and
WebKit broad checks crashed/stalled amid concurrent browsers and a 97%-full
`/tmp` tmpfs. The unchanged Chromium retry and serialized WebKit runs with an
invocation-scoped disk-backed temporary directory passed. No application code
or browser security setting was changed to obtain those passes.
## November 4 Home hover focus and off-row inertia

Captured pointer travel perpendicular to a marquee row retains a naturally decaying
throw rather than cancelling it. Hover lifts the artwork within its fixed hit area
and softly blurs other samples; touch, keyboard focus and reduced motion remain
crisp. This release preserves existing Home button text and inertia policy; the
playful controls and preview hover-pause remain separate work.

The runtime and focused browser harnesses are unchanged from the prior tested
PR110 candidate. Integrated with the parametric Gradient/Triangle main tree,
83 focused unit tests pass. Existing Chromium/WebKit off-row, focus, cancellation
and touch checks passed on these exact runtime files. Current-main navigation
into both parameter families and Back/Forward also passed in the cumulative Home
candidate. No artwork, export, dependency, workflow or file deletion.

## November 4 parametric-controls integration recovery

The preserved Triangle Grid and Circles Gradient branches are combined with main
`4af090b`, retaining Waveform LFO, Nucleotide completion and variable-length
Randomize, stable Undo startup, sidebar overflow cues and existing export feedback.
Both parameterized styles remain alphabetical in Dynamic. Shared shell/runtime
cache keys advance together to `20261104-parametric-lfo-recovery`.

Validation: all 730 unit tests in 68 suites pass; all 84 inline JavaScript blocks
compile. Both Chromium and WebKit pass Triangle Grid and Circles Gradient preset,
custom URL, new/legacy snapshot, keyboard/mobile, Reset/Randomize/Undo, zoom,
header and 2320 × 1524 PNG checks. Both also pass Waveform LFO audio/interaction
checks. Chromium passes Nucleotide's 30–50-base input, export, Randomize/Undo/Reset
and responsive checks. Chromium also passes four sidebar overflow layouts and
six delayed-start/refresh cases with stable Undo positions. Desktop and mobile
screenshots for both parameterized styles were visually inspected. An initial concurrent Chromium PNG check crashed;
the unchanged test passed in the serial final run. This is local verification,
not owner acceptance, physical-device testing, formal brand approval or deployment.

## November 4 parametric Triangle Grid

Issue #103 makes Triangle Grid adjustable with Wide/Balanced/Fine starting
presets, rows, density, stroke weight and row offset. Its prior preset line
geometry is preserved and regression-tested against the shipped SVG samples.
Shared preview/export geometry uses bounded control ranges and direct-neighbor
construction, capped below 1200 line segments. Historical state migration,
custom URLs, Reset/Randomize/Undo and mobile/keyboard flows are covered by
targeted tests. Triangle Grid moves to Dynamic; alphabetical ordering within
each group is retained. No automatic animation is added.
Validation on the text-validation baseline: all 696 unit tests pass. Chromium
and WebKit pass preset/custom-state, legacy/new snapshot, keyboard, mobile
reopen/pointer, Reset/Randomize/Undo and PNG/header checks. Physical devices,
owner acceptance and formal brand approval remain separate.

## November 4 parametric Circles Gradient

Issue #104 alphabetizes the style picker within its existing Dynamic and Static
groups, without changing the Home sample order. Issue #96 adds parameter-driven Circles Gradient with three named starting
presets and controls for columns, rows, dot size, size contrast, row offset and
Reverse. Existing preset geometry remains identical, including the supplied
reference restored in #89. Custom compositions are bounded to 240 complete
circles and use the shared preview/header/SVG/PNG renderer. The style moves to
Dynamic because its parameters are adjustable; it does not add time animation.
URL restoration, old/new snapshots, Reset, Randomize and Undo preserve the
controls. See the scientific notes and circleGradientControlsSmoke.js for the
model and reproducible browser checks.
Validation after integrating the text-validation release: all 698 unit tests
pass. Chromium and WebKit pass focused preset/custom URL, new and legacy
snapshot, keyboard, Reset/Randomize/Undo, mobile reopen and PNG/header checks.
Browser emulation does not establish physical-device or owner acceptance.

## November 4 parameter overflow cue and icon consistency

A passive “More below” chevron appears in the sidebar's existing bottom fade only
when parameter content remains below its visible boundary. It accounts for the
sticky About card, short viewports, resized content, and scroll position. The
cue takes no pointer events or focus; native wheel/touch scrolling is unchanged.
The scroll region itself supports keyboard focus and Home/End scrolling. There
is no bouncing, timer, or continuous animation loop. A floating button was not
chosen because it could obscure controls or suggest a second scrolling model.

The cue reuses the pinned Feather v4.29.2 chevron. Toast dismissal and selected
option checks now also use the pinned Feather shapes rather than a typographic
× or a CSS-drawn check. This is consistency with the project's existing icon
system, not a claim that Feather is an officially mandated RPI icon library.
See [covered surfaces and audit record](icon_consistency.md).

After integration with #118 (378c2cf), 716 unit tests pass. The new Nucleotide
minimum/cap behavior, renderer, catalog and controls remain unchanged. Chromium and WebKit pass desktop, 390 px,
320 px and landscape checks for overflow/end states, keyboard/touch-compatible
scrolling, resize/style/detail changes, no pointer interception, and toast
recovery. Visual review confirms the cue sits in the fade without layout shifts.
These checks do not establish owner acceptance or physical-device certification.
## November 4 parameter action feedback

Randomize now has the pinned Feather shuffle icon and one brief response after
an action succeeds. Undo's label moves back by 2 px, and Reset's label settles
back to full opacity. Button hit targets, labels and row layout remain fixed.
This feedback is tied to completed synchronous actions, never an idle loop or
a simulated progress indicator. Repeated presses replace the current animation.
Reduced motion, backgrounding, and page exit cancel or skip the feedback.

The added shuffle SVG comes unchanged from Feather v4.29.2 with its source hash
recorded alongside the existing MIT subset. No second icon family or runtime
library was introduced. Nucleotide generation/target rules and all parameter
algorithms are unchanged. Existing preview play/pause transitions were retained
rather than adding another layer of motion.

Validation: 707 unit tests pass, including replacement/cancellation and preference
checks. Chromium and WebKit pass desktop/320 px normal/reduced-motion cases,
repeated Randomize, exact SVG restoration with Undo and Reset, stable button
geometry, accessible glyphs, and live preference changes. No formal RPI approval,
owner testing, physical-device or assistive-technology certification is implied.

## November 4 stable Undo startup

The parameter shell now creates the disabled Undo button alongside Randomize and
Reset before renderer setup. History initialization binds that existing control
instead of inserting it later, preventing the refresh-time action-row shift in
issue #105. Undo availability, one-step history, keyboard focus and exact artwork
restoration are unchanged. Generator routes and the Home prefetch use aligned
`20261104-undo-startup` cache keys for the affected shell and control scripts.

Validation: 63 focused control, history, startup and routing tests pass. A delayed
renderer-start regression fails against the previous main because Undo is absent
from the initial action row, and passes six fresh-load/refresh cases in each of
Chromium and WebKit at 1280, 375 and 320 px. Button positions stay identical across
initialization, repeated preparation adds no duplicates, reload clears available
history, keyboard Undo restores exact SVG artwork, and narrow layouts stay within
the viewport. These checks do not establish physical-device or screen-reader
behavior, owner acceptance, or formal brand approval.

## November 4 audible Waveform LFO

The owner's correction supersedes the envelope-retirement choice below. Waveform
now offers an actual sine amplitude LFO (tremolo): one Volume pulse toggle,
Rate in Hz and Depth in percent. The two settings appear only when enabled;
keyboard controls, numeric editing, Reset/Randomize, Undo and query/share restore
use the existing control system. Rate is 0.2–8 Hz and Depth is 0–100%.
Audio modulation remains independent of visual carrier motion and static/GIF
geometry. No autoplay is introduced; reduced motion still pauses visual travel.
Audio changes ramp smoothly; stop/restart and style changes dispose the old LFO.
The browser smoke renders actual OfflineAudioContext samples to verify audible
amplitude modulation, rather than relying on UI changes or a connection mock. Both Chromium and WebKit
measure RMS 0.7069 at the LFO peak and 0.00029 at its trough (2 Hz, 100% depth),
while bypass stays 0.7071. The integrated candidate on main 378c2cf passes 713 unit tests. Chromium and WebKit
pass the LFO audio/interaction smoke, including Undo and inline numeric editing.

## November 4 encoded-text validation

Binary and Morse now keep text drafts editable while suppressing rejected text
in their shared preview/export encoders and show a persistent inline recovery message. Masked query values also
stay blocked after reload, and entering clean text restores the bar. Both fields
use the same ten-code-point limit before encoding, including URL restoration and
migration of older share snapshots. Benign “hello” remains accepted by the existing
whole-word filter. Issue #12 was a joke and #13 needs owner clarification; no new broad
numeric restrictions or unrelated field limits are included. Updated text assets
and every generator source route use `20261104-text-validation` cache keys.

Validation on main 0dd693a: 691 unit tests in 62 suites pass. Chromium desktop (1440 × 900)
and phone-sized (390 × 844) checks pass for both fields: initial blocked URLs,
sequential typing of hello, ten-character limits, repeated key handling, reload,
and shared preview/export geometry. WebKit execution is blocked by missing host
libraries; physical-device and screen-reader behavior were not verified.

## November 4 Numeric release cache refresh

Generator route shells, Numeric rendering dependencies, and the Home dependency
loader now use `20261104-numeric-seams` cache keys so returning sessions fetch
the released seam repair instead of a previously cached renderer. Encoding and
geometry are unchanged.

## November 4 Numeric height seams

Numeric Height Encoding now joins neighboring digit cells into one silhouette
per uninterrupted run. This removes fractional-pixel antialiasing seams (#52)
without widening cells, rounding their coordinates, adding a baseline, or
changing the digit-to-height mapping. Decimal cells remain empty. The canonical
preview/header/SVG/PNG geometry and native fallback use the same polygons.

Regression review also confirms the earlier removal of artificial Numeric side
strips (#34 and the boundary portion of #54). Zero remains a valid digit: 10%
height in Height Encoding, and an empty cell in Dot Matrix; a decimal is an empty
height cell or a bottom dot respectively (#10 and the distinction in #54).
All-zero Dot Matrix exports retain the existing zero-ink recovery guidance.

Validation: 59 unit suites / 683 tests pass. Focused Chromium checks at 1489,
913 and 390 px verify a seam-free 99-cell fractional-width raster, zero input,
actual SVG snapshot equality and pixel-identical PNG/vector output. Desktop
screenshots were inspected. These checks do not establish physical-device,
screen-reader, formal brand approval, or owner testing.

## November 4 restrained interaction feedback

Export actions now have a fine vertical divider, small uppercase section labels,
and the existing Feather download/copy glyph inside each format button. Pointer
hover and keyboard focus move only the arrow or rear sheet by 1–1.5 px; disabled
actions stay still. Status messages gain neutral working, ready, error and cancel
icons while retaining their authoritative text and live-region behavior. Success
notices draw their check once, and selected dropdown markers fade in place.
Nothing moves the official artwork or changes export payloads.

Reduced motion removes all new movement, including pseudo-elements. The same
rule closes the older switch-thumb/audio-indicator pseudo-element exception.
The Marked status-menu still informed selection and state cues, not its rounded
visual styling; no new animation library or idle decorative motion was added.
See [scope, reference and verification](interaction_feedback.md).
Validation: 691 unit tests pass on the integrated text-validation release.
Chromium and WebKit pass grouped layout, three-theme contrast, compact screens,
keyboard and reduced-motion feedback, repeated outcomes, real PNG downloads and
clipboard payload/recovery checks. Shell/bootstrap/CSS cache keys are advanced
together across direct and routed entry points.
These checks do not establish owner testing or physical-device certification.

## November 4 Circles Gradient reference repair

Issue #56 remained reproducible after the October 28 alignment repair: variant 1
used a generic upright 28 × 3 grid rather than the supplied reference. It now
preserves the source's 29/28/29 staggered dots, original radii and small coordinate
offsets. Uniform containment of the 509 × 36 source frame keeps complete circular
primitives inside the official viewport without stretching or forced edge paint.
Variants 2 and 3 are unchanged. Preview, header, SVG and PNG share this geometry;
the Home sample is regenerated from that renderer.

The targeted source-oracle regression compares every circle with the supplied
SVG at three sizes, including a nonstandard aspect ratio. Existing complete
Circles stroke and Neural Network ring-bounds regressions also pass, confirming
that issues #51 and #55 were already repaired in merged PR #57. Browser/export
verification is recorded in the associated pull request. No formal RPI approval,
physical-device testing or owner acceptance is inferred.

## November 4 Ticker audio removal

Ticker no longer offers audio, as requested in issue #44. Its audio button,
dispatch and polyrhythmic synthesizer are removed. Ticker motion, visual ratios
and exports are unchanged. Binary remains silent following the earlier #47 fix.
Regression coverage verifies unsupported audio cannot start and supported styles
remain available. See `scripts/audioAvailabilitySmoke.js` for the focused
browser check of navigation, Ticker motion and phone-width layout.

## November 4 Waveform envelope retirement

Removed the spatial-only envelope controls under issue #49's removal option.
They never affected the audio preview. Type, frequency, Loop/Reverse, speed and
audio remain available. Old envelope query/share fields no longer apply; other
historical settings restore normally. Preview/header/export use the same unmasked
waveform. Low-level historical geometry helpers remain tested for compatibility.
The About text and marquee preset no longer advertise the removed feature.
Focused browser checks cover legacy-query/export parity, Randomize/Reset and
responsive layouts. This does not establish owner or physical-device testing.

## November 4 nucleotide minimum and maximum

Nucleotide uses a fixed 30-base minimum for export and a 50-base maximum. The
length dropdown is removed. Input remains editable after 30, and exports stay
available through 50. The progress display marks 30 minimum and 50 maximum;
controls are red below 30 and green at or above it. A brief green cue marks the
first ready state. Dashed preview slots appear only for missing bases below 30.

The gap stays equal to the accepted 30-base gap for all counts. At reference
width 250, this is 1.33 units. Teeth remain 7 units wide through 30 bases, then
shrink to 3.67 units at 50 so extra bases fit the fixed official bar viewport.
The renderer uses only entered
bases. Placeholders and control feedback never enter exports. A rejected edit
above 50 gives a brief red input outline and shake with a polite inline notice.
The notice returns to normal text color with the outline and clears after four
seconds, an accepted edit or blur. A neutral “Maximum reached” count remains at
50; the sequence stays exportable. Reduced motion removes the shake
and animation while retaining the red feedback and text.

Typing, formatted/overlong paste, selected-text replacement and composition
commit use the same 50-base cap. Randomize chooses an actual sequence of 30–50
bases; Undo restores the previous sequence and export lock. Old target-length
query/share fields are ignored without shortening valid input. The Home samples
are regenerated from the shared renderer. Validation passes 711 unit tests,
focused Chromium/WebKit edit/export and emulated-touch flows, and exact Home
sample parity. Desktop, limit and phone states were visually inspected. See
[source and checks](nucleotide_bar.md).

The spacing correction remains on `codex/fix-nucleotide-completion` for owner
review. Merge requires the owner's explicit approval.

## November 3 compact export actions

Download and Copy now sit side by side, with distinct tray and overlapping-sheet
icons and outlined format buttons. The columns retain 44 px minimum targets,
full action names for assistive technology, and the Large/Standard picker.
Unavailable copy actions use a short visible reason plus the full explanation
in the accessible name and tooltip, avoiding duplicate paragraphs. Export
payloads, host permissions, dimensions and geometry are unchanged.

The Color-page guidance also omits the visible “opens in a new tab” suffix,
while keeping the external link behavior and screen-reader warning.

Validation: all 641 unit tests pass after integrating the preceding animation
spacing and footer-dropdown releases. Chromium and WebKit cover side-by-side
layout, three themes and contrast, 320 px/375 px/landscape viewports, keyboard
focus, unavailable-copy explanations, real PNG downloads, and copy recovery.
Chromium verifies native PNG/SVG clipboard payloads; WebKit uses the existing
clipboard adapter. The picker still exports both PNG sizes and supports touch,
arrow keys and reopening. These checks do not establish physical-device or
screen-reader certification, host permission repair, or owner testing.

## November 3 custom image-size picker

The export menu now presents custom-styled Large and Standard choices instead
of opening the browser's native select popup. Native radio semantics preserve
arrow-key selection and one Tab stop, with visible focus and 44 px touch rows.
Large remains recommended and selected by default. Both choices lock during
export and recover afterward. Existing PNG/GIF dimensions, transparent clear
space, and SVG geometry are unchanged. The hidden select remains an internal
compatibility state for existing export integrations.

Validation: all 636 unit tests pass. Focused Chromium checks cover three themes and compact layouts. Chromium and
WebKit both pass keyboard, touch emulation, repeated opening and both actual PNG
sizes at desktop, 390 px and 320 px widths. The existing Chromium export suite
also verifies Large GIF dimensions, progress and completion. Browser automation
is not physical-device or screen-reader certification.

## November 3 animation action spacing

Replay and Close now form one compact pair with the overlay's existing 10 px
gap. Previously they copied the GitHub and menu button positions, leaving
the hidden wide Download action's space between them. Both retain the menu
button's dimensions and follow its position after resizing; compact layouts
no longer stretch Replay to the export control's width.

Validation: all 635 unit tests pass. Focused WebKit checks pass at 1800, 1440,
768, 390 and 320 px, including resize, Replay, Escape, reopen and reduced
motion. Chromium's initial 1440 px geometry assertion passed, but renderer
crashes during the particle animation prevented a complete Chromium run.
This is automated browser coverage, not owner or physical-device testing.

## November 3 nucleotide bar

Adds Nucleotide with separate-base and connected-backbone variants from the two
user references. ATCGU-only input, 60-base bound, explicit design-shape legend,
versioned human INS/HBB excerpts, Randomize/Reset and shared static export geometry.
See [scientific conventions, sequence provenance and limits](nucleotide_bar.md).
Validation: all 647 unit tests pass after integration with export #84. Chromium and WebKit both pass the focused
sequence/control, keyboard, restore, SVG/PNG export and mobile-width checks.
See the linked validation record for scope; tests do not imply formal RPI
approval or owner acceptance.

## November 3 combined release validation

The combined candidate includes responsive display and complete first-frame
rendering, the full bold product title and aligned export controls, corrected
Ruler/default motion, natural pattern edges, ten-character Binary input, and
same-page embedded export behavior. All production route/cache references share
`20261103-display-motion-embed`; marquee samples were regenerated from the shared
renderer. See [combined release evidence](display_motion_embed_qa.md) for exact
coverage and remaining environment limits.

The production Frontify frame was inspected separately and lacks download and
clipboard delegation. This application release does not fix those host
permissions. A separate manual-save prototype is not included in this release.

## November 3 header title and export alignment

The header now preserves the complete product name in full-contrast RPIGeist
Bold, with a deliberate two-line phone layout instead of ellipsis or hiding.
Legacy document names remain secondary and cannot crowd the product name.
Download/Learn and its menu now share both edges with desktop sidebar fields;
compact headers retain their smaller accessible actions. Header startup and
runtime use the same fit logic. Official mark geometry and exports are unchanged.
All 531 unit tests pass, and Chromium/WebKit each pass 45 focused responsive,
alignment and startup cases. See [header validation and limits](header_layout_qa.md).
This component is included in the combined candidate described above.

## November 3 motion, Ruler and natural-edge corrections

Implemented locally on `codex/fix-bar-motion-details`, based on the preserved integration commit `395ce422`; no push, merge or deployment is included. The owner clarified that natural edge gaps are valid. Removed artificial Ticker sides, Waveform bottom baseline, Numeric side marks and the generic horizontal fit pass, while preserving the official viewport, clipping, letterforms, spacing, scientific domains and intrinsic pattern geometry.

Ruler now spans exactly the selected REPEATS in major units; the former UNITS control is DIVISIONS per repeat. Centered ticks have a consistent fractional hierarchy and are drawn once, eliminating doubled major ticks in animated frames. All four animated families reverse their prior default direction, and menu selection defaults Loop on except under reduced motion. Shared paused transport remains respected. Binary is limited to ten Unicode code points throughout input/query/share/encoding and no longer offers audio.

Validation and remaining limits are recorded in [motion details QA](bar_motion_details_qa.md). Automated checks do not establish owner testing, final-size visual acceptance, physical-device behavior or formal RPI approval.

## November 3 embedded export compatibility

The public Share controls are removed for the Frontify workflow. Historical
snapshot links still restore their model and document title. Embedded exports
stay in the current page: the rejected new-tab link and guidance are removed.
The menu explains explicit clipboard-policy denials and reports downloads as
requested rather than confirmed. No geometry, model math, raster sizing or
native-image MIME changes were made. Host permissions are never changed or
bypassed.

The cross-origin fixtures reproduce silent sandbox download blocking and
Chromium clipboard-policy denial. Permitted hosts support direct SVG/PNG/GIF
downloads and supported image copying without popup permissions. This is not
an authenticated test of RPI's production Frontify embed. Separate production inspection confirmed missing iframe download and
clipboard delegation. Host-side permission repair remains unresolved. A private SDK wrapper is an extension option to validate, not a
verified production fix. See [behavior, host requirements and verification
limits](frontify_exports.md).

## November 3 display and first-frame repair

The landing composition now scales bars, gaps, heading and credits together from
CSS viewport dimensions. DPR does not independently enlarge the layout. Row
spacing is bounded by bar height, with extra lanes on unusually tall viewports.
The startup prompt uses bounded intrinsic width and compact wrapping rather than
an absolutely positioned auto width that could wrap into an oversized bubble.
Marquee speed is lower and a hovered or pressed link pauses its lane immediately;
leaving resumes smoothly. Reduced motion remains still.

Static generator previews wait for the selected SVG image before painting a
complete mark. The entrance capture waits for that complete first frame rather
than canvas insertion. Async updates retain the prior complete canvas, and a
failed image exposes Retry. Geometry, selected patterns, export sizes, and model
math are unchanged. See [display verification and limits](display_scaling_qa.md).
This component is included in the combined candidate described above.

## October 28 feature integration

The marquee now uses all 21 implemented families captured from the shared
renderer, with exact-black supporting surfaces. The header mark is a native Home
link. A deliberate hidden heading/keyboard gesture opens the selected-color
ASCII intro with contrasting surfaces, reduced-motion choice, modal focus and
background isolation, retry and storage recovery. Official geometry, model math
and raster sizing are unchanged.

The wider sidebar and bounded export/credits panels share usable desktop widths
while retaining compact portrait/landscape layouts. All 16 configurable families
have logical Randomize/Reset; five fixed-artwork families have neither. Defaults,
Circles' canonical seed 1, Numeric inactive data and running/paused Quantum stay
consistent through controls and sharing. Explicit shared seeds remain supported.

Mission Control skips unchanged Artemis canvas painting, reuses same-source SVG
nodes and runs its wall-time counter only when relevant and visible. Same-host
idle wrapped draw work was 172 → 4 ms per 1.2 seconds; this is not an overall CPU
or startup claim. A pixel-identical WebP is 51.3% smaller than the unchanged PNG
source/fallback. Credits and unresolved asset permissions are retained.

Combined source passes 494 unit tests in 45 suites and all ten bounded final
Chromium/WebKit integration checks, including both normal-motion lifecycles and
the complete WebKit action/layout matrix. Precise scope and remaining limits
are recorded in [integration QA](bar24_26_integration_qa.md).
Software verification does not establish physical-device, screen-reader,
final-size owner or formal RPI/asset approval.

## Earlier integration verification — October 28, 2026

The motion audit, circle bounds/alignment, Numeric modes, sticky grouped headings
and short-window footer, Quantum Dynamic category and Neural Network redesign
are combined on `codex/fix-circle-controls-integration` from published `ab23e3a`.
Final combined checks pass 346 unit tests in 35 suites, 28 Neural browser cases
and 18 routed starts per engine, plus targeted cross-feature share/export and
short-window checks in Chromium and WebKit. The integration also rejects inherited
Numeric migration aliases and retains the early Numeric startup dependency.
See [combined QA and limits](circle_controls_integration_qa.md). This batch is
local and ready for release coordination; it has not been pushed, merged or
deployed. Shared main and all source branches remain preserved.

## 1. Project Overview
A web-based **Design Tool** intended for RPI's central Brand Hub. It lets students and faculty explore RPI bar patterns using configured brand assets and geometry. Secondary colors and proposed club or mission lockups still need owner approval before being described as brand-compliant.

## 2. Architecture & Tech Stack
*   **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+).
*   **Rendering:** p5.js 1.7.0 for the live canvas, using WebGL when available and 2D canvas otherwise, served from `third_party/p5/`.
*   **Startup:** Shared initial-state, canonical query, dropdown and parameter utilities prepare theme and control chrome before the generator shell paints. Restored control labels and any legacy snapshot title occupy their final layout before renderer setup; public Share controls are removed. Font preloads and explicit control line metrics limit fallback-font layout movement. Startup errors retain visible recovery. When shared-state startup is present, its motion normalizer loads before validation. The existing p5.js global runtime reuses these utilities, including one compact-layout decision for early and runtime sidebar state.
*   **URL state:** Query and shared-fragment edits use one bounded 200ms writer. Navigation cancels stale pending writes; a validated same-origin session handoff retains the final pending edit on immediate reload before initial controls paint. WebKit rapid-edit/reload tests cover this behavior.
*   **Navigation:** One native artwork print pass, including Artemis’s vector bar, keeps identity and controls fixed; reduced motion, history restoration and unsupported browsers bypass it. Captured artwork motion holds briefly and resumes without catching up presentation time.
*   **Integration:** Designed to embed within the **Frontify** ecosystem.
*   **Shaders:** `assets/shaders/` contains prototype GLSL files; the production generator no longer fetches or compiles them at startup.
*   **Audio:** Web Audio API with AudioWorklet (`pulse-worklet.js`) for audio-reactive features.
*   **Fonts:** Official `RPIGeist` family (WOFF2) served locally.

### File Structure
*   `assets/` - Static resources (fonts, images, shaders).
*   `css/` - Stylesheets (`style.css`).
*   `js/` - Logic (`main.js`, `drawing.js`, `pulse-worklet.js`).
    *   `utils/` - Helper modules (`profanityFilter.js`).
*   `references/` - Documentation and guidelines.
*   `scripts/` - Browser smoke regression script.
*   `third_party/` - Local licensed browser dependencies.

Toolbar and visual review follow the [project acceptance record](bar_coordination.md): measured neighbor consistency, full-toolbar bounding boxes and screenshots, complete-page hierarchy and interaction states, and a minimal Share menu. Functional checks do not establish owner or institutional approval.

## Integration status — October 27, 2026

The combined application retains published Artemis(PR25), mobile(PR26/32),
Quantum(PR27), entrances(PR28), motion(PR29), patterns(PR30), sharing(PR31) and
geometry/transparent exports(PR33). The complete official vector basis fixes
width 250, bar top 132.4885, height 18 and gap 21. Preview/header/export collection
preserves selected variants, count, direction, phase and seeded packing without
per-frame spatial fitting. See [science notes](bar_science_notes.md) and
[geometry](bar_geometry.md).

The final consistency work uses 19 exact licensed Feather 4.29.2 glyphs throughout
UI action and busy states. Coarse native export-size controls use 16px text and
44px height; explicit WebKit Cancel focus and delayed sidebar-editor focus are
preserved. Query/fragment edits use a bounded 200ms writer, with navigation
cancellation and same-origin reload recovery. Consumed cache handoffs are cleared.

Verification passed 290 unit tests in 28 suites, 23 Chromium and 16 WebKit complete-tree
suites, then 11 Chromium/4 WebKit release/lifecycle follow-ups. Coverage includes
52 startup cases,12 shared first-paint cases,34 entrance scenarios,31 geometry
variants,50 pattern states per engine,86 edge/control cases, all 21 share families,
header DPR 1/2/3, actual mobile/pinch interaction, all six family/size transparent
GIF exports per engine and request-time PNG/SVG capture under changing controls.
See [verification](integration_qa.md), [transparent exports](transparent_gif_exports.md),
[icon sources](icon_provenance.md) and [review images](review-images/integration-validation.md).

Physical Safari/keyboards, screen readers, continuous-motion judgment,
high-refresh/low-power performance and formal RPI/asset approval remain separate
limitations. Automated software checks do not establish manual owner acceptance.

## Ruler natural edges — October 27, 2026

The owner corrected the earlier painted-edge interpretation for Ruler: remove the artificial fixed end marks and accept natural whitespace inside its unchanged 250 × 18 viewport. Ruler now uses its original clipped tick geometry in preview, header, SVG, PNG and GIF. Placement remains y = 132.4885 with the fixed 21-unit gap; no phase-dependent stretching or shifting is introduced. Other bar families and the calm speed limits are unchanged. The canonical policy, geometry/science notes and narrow edge checks record this explicit Ruler exception. The ruler control hint now describes ticks moving through a fixed frame.

Verification passed 302 unit tests in 30 suites, 86 Chromium geometry/control-range cases, 31 Chromium rendered family/variant and actual SVG/PNG parity cases, and 1,296 Ruler phase/reverse/speed/theme/viewport cases each in Chromium and WebKit. Focused live Ruler header checks passed at DPR 1/2/3 with stable letter pixels and pause/play DOM. Standard/Large Ruler GIFs passed 40 decoded-frame coverage hashes per size and engine, transparency/disposal/overflow checks, PNG alpha and SVG checks. Native Chromium first/last-frame decoding and WebKit first-frame decoding are separate evidence. Desktop/mobile/theme and sampled-phase screenshots were visually inspected; see [review evidence](review-images/ruler-natural-edges/validation.md). This does not establish owner testing, physical-display motion judgment, native Safari behavior or formal RPI approval.

Reconciled with published BAR11 (`1a5e59a`), preserving JPEG removal and the then-current clipboard implementation. Final combined verification passed 298 unit tests in 30 suites, the Chromium clipboard regression and 1,296 Ruler control/phase/theme/viewport cases. Route shell and drawing-script versions now refresh the corrected Ruler code for returning visitors.

## Clipboard actions — October 27, 2026

The existing asset menu now offers capability-detected SVG/PNG copy actions using the same frozen state, official vector geometry and Standard/Large raster renderer as downloads. Unsupported native SVG now reports an unavailable state with a separate SVG download. PNG keeps smooth transparency. Clipboard writes start inside user activation with promise-backed ClipboardItem data; dispatched platform writes have no misleading Cancel control. Busy exclusion, accessible status, keyboard/touch controls and retry reuse the export UI. No runtime dependency, persistent permission request, or clipboard read is added.

Local verification passed 298 unit tests in 29 suites, Chromium/WebKit complete browser smoke and aggregate integration, request-time PNG/SVG snapshot checks, and all six transparent GIF family/size cases per engine. Clipboard-specific tests checked native Chromium MIME/content, frozen pixel hashes, encoding failures, denial/retry and touch/keyboard behavior. See [clipboard validation and browser limits](clipboard_exports.md) and [review images](review-images/clipboard-validation.md). Chromium real clipboard MIME/content readback and WebKit adapter checks are distinct; physical Safari, mobile hardware, native-app paste acceptance and formal approval remain unverified.

## Native SVG clipboard correction — October 27, 2026

Copy SVG now writes only native `image/svg+xml`. Source-text fallback and destination-specific picker wording are removed. Unsupported actions are visibly disabled with separate Download SVG available; export completion reapplies capability state and error focus avoids disabled controls. No text, HTML, proprietary format or PNG is substituted for SVG. SVG/PNG copies, transparent raster exports, GIF downloads and JPEG removal are retained. Ruler natural edges, all official geometry and frozen export state remain unchanged.

Reviewed the frozen recovery edits in `/tmp/bar-generator-figma-copy` (`codex/fix-figma-svg-copy`) and applied only relevant changes on `codex/fix-native-svg-clipboard`, based on published `6a20ef4`. Original uncommitted recovery files and local documentation ancestry are preserved. No concrete malformed exported-SVG issue was found; valid standalone XML and vector geometry are retained, without speculative preamble normalization. Chromium's macOS source maps SVG to `public.svg-image`; isolated browser payload readback is separate from destination-app acceptance. No Figma operation or native-app paste acceptance is claimed. The user will test after deployment.

Verification passed 299 unit tests in 30 suites, full Chromium/WebKit browser smoke (21 styles, SVG exports, PNG, five widths, text safety, reduced motion, 2D fallback and renderer recovery), genuine isolated Chromium SVG/PNG clipboard payload and receiving-browser paste checks, WebKit clipboard adapter checks, frozen SVG/PNG request snapshots, and all six Chromium transparent GIF family/size cases. Desktop/mobile menu screenshots were visually inspected. An initial local preview connection-reset failure was resolved by increasing the temporary server backlog; the complete reruns passed. See [clipboard behavior and limits](clipboard_exports.md) and [review evidence](review-images/native-svg-clipboard/validation.md).

## Color picker availability — October 28, 2026

The color picker now groups Black, White and Red under Primary, and Blue, Gold, Silver and Gray under Secondary using the existing bar-style headings. Secondary choices are disabled for new selection. Existing query/shared states still restore those themes and retain their original export colors; Mission Control remains available for Artemis II. Rendering, export math, color values and text safety are unchanged.

Secondary colors and the three existing Under Construction styles expose Coming soon on pointer hover and keyboard active-descendant navigation. Enter/Space and pointer clicks cannot commit those rows. Native touch pickers retain disabled options and include Coming soon in their labels. An optional Using secondary colors disclosure links to the recorded official [Color page](https://brand.rpi.edu/document/4#/-/color); Escape/outside click dismisses it, and opening a picker closes it. It uses an inline layout on touch to keep the link reachable within the controls sheet. Cache versions are refreshed across route stubs.

Verification: 299 unit tests in 30 suites; full Chromium and WebKit browser smoke (21 styles/SVG exports, PNG, five widths, text safety, reduced motion, 2D fallback and renderer recovery); focused Chromium/WebKit picker checks covering repeated selection, hover, keyboard disabled-state guards, disclosure dismissal, legacy query/shared-color SVG export, Artemis theme and 320/390px emulated touch layouts. Light/dark menus, guidance, unfinished styles and small-screen screenshots were visually inspected. See [review evidence](review-images/color-picker/validation.md). Physical OS-picker interaction, screen-reader output and owner/RPI approval remain unverified. This is implemented on a feature branch; no merge or production deployment is included.

## Cross-platform animation investigation — October 28, 2026

The reported all-motion-off/still-logo behavior matches the browser's reduced-motion path. The intro previously hid Replay in that path, so deliberate playback was unavailable. Its still view now explains the device preference and offers a keyboard-accessible **Play animation once** action. That choice lasts for one intro opening; later preference changes and reopening respect the system setting. Default marquee/page/theme motion remains reduced, and existing explicit Ruler/Ticker/Waveform Loop choices still work. No geometry, export timing, scientific model or runtime dependency changes. See [diagnosis and follow-up](motion_rendering.md#cross-platform-motion-preference-october-28-2026).

Validation: 307 unit tests in 30 suites; 32 preference/playback/intro cases each in Chromium and WebKit, covering desktop/emulated touch, normal/reduced motion, WebGL/forced 2D, explicit Loop, pause, background resume, keyboard one-time Play, real changing ASCII frames, close focus and consent reset. Same-origin embedded reduced-motion opt-in and nested ASCII playback passed in both engines; this is distinct from a Frontify test. WebKit intro lifecycle checks passed for transition synchronization, rapid reopen and focus. Desktop and touch still-view screenshots were visually inspected. The owner subsequently confirmed that the affected phone limits animations and the Windows browser runs a very old Chrome version. No physical Windows/Android or actual Frontify validation was performed; the exact old Chrome version and its failing feature remain unspecified.

## Motion, Quantum and card integration — October 28, 2026

Combined the preserved motion-preference, Quantum-seek and information-card branches in an isolated integration checkout based on published `3814997`. Generator shell, CSS, bootstrap, main runtime and Quantum controller cache references are consolidated for the combined changes. The card utility now prepares the selected style’s copy on the detached routed shell before it is inserted; a delayed-renderer check reproduced and repaired the brief empty Solid card on Quantum routes.

The earlier Chromium mobile `GeneratorInitialState is not defined` failure did not recur during successful real-HTTP loading. Intentionally resetting that module request reproduced the exact missing-global failure and the existing Retry recovered after the connection was restored. This establishes a missing-dependency failure mechanism, not a Chromium platform/API incompatibility; the original request trace was unavailable. The previous copy-test file-fulfillment fixture is removed. The optional standard-library `scripts/test_server.py` uses a larger connection backlog for concurrent browser asset requests instead of older Python servers’ small default queue. No production framework, network retry policy or new dependency was introduced.

Final integration includes the preserved zoom repair as well. Verification passed 321 unit tests in 33 suites, 129 zoom pixel cases per engine, actual Fit/400% SVG/PNG and header equality, 12 real-HTTP startup cases per engine including 320/390px, complete Quantum and card checks, and motion preference/playback checks in Chromium and WebKit. See the [combined verification record](motion_cards_integration_qa.md), [motion rendering](motion_rendering.md) and [bar information cards](bar_information_cards.md) for exact coverage and remaining physical-device limits. Source feature branches and shared main remain intact; no merge or deployment is included. A new reduced-motion request now pauses Ruler/Ticker/Waveform during an open session, matching Quantum; relaxing it does not silently restart playback. Focused Chromium/WebKit preference-change and explicit-restart checks passed.

## Confirmed motion incident audit — October 28, 2026

The owner confirmed the phone’s animation-limiting setting and the Windows browser’s very old Chrome version. PR #50 added no platform sniffing or global preference bypass. Its explicit one-time intro choice and pause-on-new-reduced-motion behavior are independent accessibility improvements and are retained. Existing runtime syntax/API assumptions predate this release; no expanded legacy-browser support is inferred without an actual version.

The audit found and locally repaired preference-change edge cases: relaxing reduced motion no longer restarts an already playing explicit intro; replacing or hiding a focused intro control keeps focus in the dialog. The new Play control is disabled during the same entrance/exit states as Replay and Close. Quantum, cards, zoom, circle geometry, sticky-header and Numeric work are untouched. Details and compatibility evidence: [motion audit](motion_rendering.md#confirmed-incident-audit-october-28-2026). Validation passed 324 unit tests in 33 suites, the full one-run/preference/focus/marquee audit in Chromium and WebKit, and the existing 32-case motion matrix per engine including forced 2D, touch layouts and same-origin embeds. Exact old-Chrome and physical-device validation remain outside this audit. This audit branch is local only and has not been deployed.

## 3. Completed Milestones

- **[2026-10-27] Header and intro motion polish**:
    - Kept official header letters in one persistent SVG and repaint only a supersampled moving bar. Pause/play retains the surfaces; explicit theme changes keep vector and raster colors aligned.
    - Limited Ruler/Ticker/Waveform to 0.6/0.8/1.0 recurrences per display second, with family-specific units and calmer 0.3/0.4/0.3 defaults. Existing slow settings remain available. Controls, Reset/Randomize, legacy URL imports and export planning share finite-value, bound and step normalization. Quantum retains its own uniform 0.2×–1× time multiplier and static default.
    - Logo-triggered intro controls keep the accepted GitHub/menu alignment and share the scrim/projection entrance and exit lifecycle, with disabled invisible/closing controls, CSS completion, interruption-safe focus and immediate reduced motion. User theme changes use one short ordered ASCII reveal; startup theme restoration stays immediate.
    - `references/motion_rendering.md` records the rendering and rate rationale. Local scripts cover actual-size header stability, imported speeds, themes, frame-by-frame intro lifecycle and export regression. Physical-device, manual assistive-technology and formal brand approval remain separate checks. Fragment sharing uses the exposed speed migration helper before strict manifest validation.

- **[2026-10-27] Configurable geometric bar refinements**:
    - Refined Lines, Gradient, Circles Gradient, and Triangles with deterministic primitive geometry and exact painted horizontal extents. Lines uses a sampled standing-wave envelope; the two Gradient treatments and three Circles Gradient treatments use distinct area/size progressions. These are geometric illustrations, not measured datasets.
    - Triangle variants are complementary halves of the same cells. Added four diagonal directions and a count control from 6 to 28 (default 14). Direction defaults to Down right; choices are Down right, Up right, Up left, Down left. Preserved explicit saved directions and mapped legacy up/down values to Up right/Down right. Removed only this family's Randomize/Reset actions; reconfiguration redraws without perpetual motion.
    - The header collector includes current triangle variant, direction, and count. These four static families now derive both SVG and transparent 4× PNG downloads from the same selected-state vector, fixing omitted variants and missing PNG bars. PNG uses the same 20-reference-unit clear space as SVG (80 pixels at 4×).
    - Added focused regression coverage for bounded/complementary geometry, native defaults/order, legacy direction migration, and real header/preview/SVG/PNG selected-state parity. Unit suite: 142 tests passed; Chromium: 50 selected states passed; WebKit: 22 targeted states passed (WebKit compares identical interiors and >99.9% masks while retaining edge antialiasing). Integer export viewport dimensions prevent WebKit outer-edge insets; the final Chromium viewport rerun follows the shared test lease. Existing stack, typography, colors, filtering, and other export dispatchers are retained. Gradient naming/treatment still requires owner review against the dated brand restriction; user publication approval is not institutional brand approval.


- **[2026-10-27] Feature branch lifecycle policy**:
    - New feature requests use new branches. Before switching features, agents report unfinished or user-unconfirmed work and its saved branch. Only an explicit user statement establishes user testing.
    - Branch deletion needs an explicit user request and a fresh ahead/behind, merge, pull request, and unsaved-work report. Automatic deletion of merged branches is disabled. Contribution and handoff guides now match AGENTS.md.

- **[2026-10-27] PR-only fast checks**:
    - Unit tests now run only on ready pull requests into main. Drafts skip execution, marking ready starts the check, and replaced runs are cancelled. Removed duplicate test execution after merge.
    - Retained the required Unit tests status, strict main protection, Node.js 22, pinned actions, public-repo guard, read-only token, and no cache or artifact uploads. npm prefers any runner-local cached packages without adding a stored Actions cache. Pages deployment after merge is unchanged.

- **[2026-10-27] Viewport-relative inspection zoom**:
    - Added shared fit, percentage-step, pointer-anchor, and pan-bound calculations in js/utils/viewportZoom.js. The full official mark fits the actual canvas and control reservation, with no fixed large-screen scale cap.
    - Made 100% the fitted baseline and 400% the inspection limit. Buttons use 100, 125, 150, 200, 250, 300, and 400 percent. The compact control shows one percentage and a separate Fit action. Percentages are relative to the viewport, not export dimensions.
    - Added smooth bar-focused button zoom, pointer-focused scroll/desktop pinch zoom, direct bounded dragging while enlarged, keyboard controls, and reduced-motion behavior. Fit resets zoom and pan. Resize keeps the selected relative scale; the canvas tracks sidebar transitions.
    - Replaced the old zoom hold loop, fixed 1.2 multiplier, size caps, and inertial pan model. Kept native touch pinch and browser keyboard zoom available. Safe-area inset contributes to the control reservation.
    - Validation: local Chromium/WebKit checks covered five viewports, typed limits, bar anchoring, direct dragging, Fit recovery, and Lunar resize. SVG/PNG downloads matched byte-for-byte at Fit and 400%. Physical touch-device checks remain open.


- **[2026-10-27] Small header ticker direction repair**:
    - Confirmed equal ticker geometry and phase in both previews. The tiny header could still show an apparent reverse direction because dense rows exceeded its spatial sampling limit.
    - The original repair averaged unresolved rows. The later motion-polish entry supersedes that stationary header treatment with a supersampled moving bar and persistent vector letters. Main preview and export geometry remain unchanged by header sampling.


- **[2026-10-27] Lightweight checks policy**:
    - At the owner's request, the fast unit suite is the only automated merge check. Removed browser installation and browser/motion execution from CI and removed Browser tests from main protection.
    - Kept the optional local browser and motion scripts. Contributors and reviewers perform the relevant UI, accessibility, motion, and export checks. The unit job has a five-minute limit and retains public-repo, read-only, no-cache, and no-artifact controls.


- **[2026-10-27] Live motion timing repair**:
    - Replaced the 120 FPS ceiling with a browser-frame-driven render target. The header mark now reuses a canvas and draws with the preview on each frame instead of replacing SVG markup at about 8 FPS.
    - Added continuous live phase integration for speed, direction, pause, and resume changes. Limited phase advance at dense/fast settings and after stalls to reduce apparent reversal. Reset frame timestamps after visibility changes and pause background rendering during the ASCII overlay.
    - Cached fixed SVG letter commands and shared the waveform function between live preview, header, and exports, correcting a quarter-cycle SVG phase mismatch. Export loop planning is unchanged.
    - Added unit and browser regression checks for cadence, header reuse, phase continuity, dense motion, and overlay recovery. See references/bar_science_notes.md for sampling limits. Physical high-refresh display checks remain open; synthetic frame-rate checks do not establish hardware performance.


- **[2026-10-27] Audit integration and development conventions**:
    - Integrated the September audit with the existing main-branch contribution setup. Kept both sets of status records and the verified billing restriction.
    - Added a development README, issue forms, branch and commit naming guidance, Node.js version metadata, and reproducible Playwright test commands with a locked test dependency. Root AGENTS.md now gives a required reading path, actionable brand intent, solid-bar size qualifications, and completion checks.
    - Consolidated unit and three-engine browser checks into one public-repo-only workflow. Removed the older duplicate workflow. Browser execution skips documentation-only changes; both check names remain available for main protection.
    - Branches use feat/, fix/, docs/, test/, or chore/ with a lowercase hyphenated description; Codex branches retain codex/<type>-<description>. Normal changes use short-lived branches and pull requests into main.


- **[2026-10-27] Contribution and maintenance setup**:
    - Added a public-repository-only unit-test workflow for pull requests into main and pushes to main, with read-only permissions, no cache or artifacts, a ten-minute timeout, and cancellation of replaced runs.
    - Added contribution, conduct, private security reporting, asset permission, and December 2026 handoff guides. Aligned package license metadata with the existing MIT LICENSE; no copyright ownership transfer was made.
    - Configured main to require pull requests, passing Unit tests, and resolved conversations, with force pushes and deletion blocked. No second approval is required during primary development. Enabled merged-branch cleanup and private vulnerability reports.
    - Open items: RPI successor organization and maintainers, software licensing authority, bundled asset permissions, and billing controls after any payment-method or ownership change. GitHub billing has no valid payment method and rejected a $0 budget on October 27; paid Actions overages are blocked under current GitHub rules. No payment method was added. Audit fixes are included in the October integration pull request.


- **[2026-09-30] Audit Follow-up: Faster Startup, Text Safety, and Export Accuracy**:
    - Replaced the p5 CDN script with a locally licensed copy and added retry states for missing renderer files. Removed unused serial shader loading, allowed generator dependencies to download concurrently in execution order, and delayed the large Artemis II artwork script until that style is selected.
    - Added Unicode-aware, best-effort profanity and hateful-slur filtering across live Binary/Morse rendering, URL sharing, and exports. Binary now encodes UTF-8, and Morse spacing/comma handling is corrected.
    - Corrected Fibonacci segment values, added SVG clear space, improved ultrawide preview scale, and preserved native mobile pinch zoom. The header animation becomes a static mark under reduced motion.
    - Added a 2D canvas fallback when a browser cannot create a WebGL context, preserving the generator rather than leaving it blank.
    - Added a browser smoke script and CI workflow for style routes, exports, responsive layouts, text safety, reduced motion, 2D fallback, and renderer recovery. Local Chromium/WebKit and Linux CI Chromium/Firefox/WebKit sweeps passed. See `references/site_audit_2026-09-29.md` and `references/bar_science_notes.md`.

- **[2026-09-29] Full Site Audit and Accessibility/Navigation Repairs**:
    - Audited the current `main` intro, all generator route shells, all 21 selectable bar styles, exports, responsive layouts, and automated accessibility states on a separate audit branch. Detailed evidence and remaining work are in `references/site_audit_2026-09-29.md`.
    - Corrected intro bar links so the visible bar family opens its matching generator style, improved the first paint and short-phone layout, and updated production metadata and repository links.
    - Restored browser zoom, added a generator heading and preview name, improved header contrast and logo minimum size, made custom selectors keyboard accessible, and kept the closed mobile sidebar out of the focus order.
    - Honored reduced-motion preferences for the intro and the default state of animated Ruler, Ticker, and Waveform bars.

- **[2026-04-28] Header Logo Animation Now Uses The Active Bar Design In An Overlay**:
    - Reworked the generator header logo trigger so it passes the current bar-only SVG and full RPI lockup SVG into the existing full-screen ASCII animation overlay through same-origin session storage.
    - Simplified the ASCII animation sequence to use only the active selected bar as the opening ASCII art, transition to `THE BAR GENERATOR`, then resolve into the RPI mark with that same bar beneath it.
    - Added a completion message from the iframe back to the overlay controller so the animation dismisses itself without changing or navigating away from the generator page.
    - Changed the overlay entrance and exit to transition smoothly, letting the ASCII animation begin over the live generator interface before the black scrim finishes fading in and fade back out before teardown.
    - Tuned the motion so the opening black scrim fades more slowly with gentler easing while the closing black scrim and red ASCII layer fade out together, avoiding a lingering final ASCII frame.

- **[2026-04-24] Header Logo Now Lazily Launches A Full-Screen Animation Overlay**:
    - Kept generator boot unchanged and avoided new startup-time runtime dependencies by wiring the existing header logo preview as an on-demand trigger inside `js/main.js`, rather than mounting animation code during initial page load.
    - Added `js/utils/logoAnimationOverlay.js` to build the full-screen overlay only after the first click or tap, lazy-load `third_party/t-rex-runner/runner.js`, inject the required sprite assets, and manage replay, close, `Escape`, and crash-restart behavior without interfering with the main p5/WebGL generator boot path.
    - Added overlay and trigger styling in `css/style.css` plus targeted Jest coverage for the lazy controller so the header interaction can evolve without reintroducing the earlier black-screen startup failure.

- **[2026-04-23] Workspace Controls Simplified To Zoom And Reset Only**:
    - Removed the dedicated pan button from the generator workspace controls so the preview toolbar stays aligned with the app’s primary job: adjusting and exporting a single fitted RPI logo bar rather than navigating a freeform canvas.
    - Cleaned up the unused pan-button event wiring in `js/main.js` while keeping existing zoom, reset, pinch, and internal viewport offset behavior intact.

### Phase 0: Analysis & Setup
*   [x] Analyzed Project Proposal and Brand Guidelines.
*   [x] Extracted condensed brand rules for agent usage.

### Phase 1: Foundation & Safety
*   [x] **Structure:** specific directory layout established (`assets`, `css`, `js`).
*   [x] **Branding:** Integrated `RPIGeist` font family and defined CSS variables.
*   [x] **Safety:** Implemented client-side profanity filter with real-time feedback.
*   [x] **UI Polish:** Shifted to workspace layout, implemented accessible dropdowns and navigation.

### Phase 2: Stability & Integration
*   [x] **Frontify Integration:** Researched strategy (iframe/embed) and implemented "Copy Embed Code" feature.
*   [x] **Generator Stability:** Fixed WebGL context handling, memory leaks, and added unit tests (Jest).
*   [x] **UX Perfection:** Refined download workflow with Toast notifications and polished controls.
*   [x] **Asset Lockdown:** Verified adherence to hardcoded brand constants.

## 4. Active Roadmap

### Phase 3: Advanced Features & Refinement
*   [ ] **Advanced Export:** High-res PNG/SVG export refinement.
*   [ ] **Interactive Tutorials:** Guide users through the tool.
*   [ ] **Club Pilot:** Beta launch for student clubs.
*   [ ] **AI Exploration:** (Future) Event-specific background generation.

## 5. Recent Updates
- **[2026-04-24] Live Motion Timing Reworked For High-Refresh Displays**:
    - Removed the generator canvas's extra 60 fps gate and switched live motion timing onto a clamped high-resolution clock, so `RULER`, `TICKER`, and `WAVEFORM` animate with much smoother phase updates on 120 Hz displays instead of stepping through coarse frame-sized jumps.
    - Set the live p5 render target to `120 fps`, which lets the generator actually use high-refresh panels while still keeping a hard upper bound instead of blindly chasing arbitrarily high refresh rates.
    - Replaced the press-and-hold zoom button repeat timer with a `requestAnimationFrame` loop so zoom interactions now respond smoothly at the browser refresh rate rather than ticking forward in 50 ms chunks.
- **[2026-04-24] Artemis II Color Variants Now Use The White-Source Bar Geometry**:
    - Replaced the embedded `ARTEMIS II` bar source with the provided white-version artwork so the generator now recolors the updated shadow treatment instead of tinting the older black-source design.
    - Updated the checked-in `assets/bars/bar-lunar.svg` asset to match that new source and refreshed the generator script cache key so browsers pull the replacement immediately.
    - Changed lunar SVG export scaling to read the embedded asset's real `viewBox` dimensions, keeping downloaded Artemis II SVGs aligned after the new source switched from the old `499.92 x 36` frame to the new `2084 x 151` artwork bounds.
- **[2026-04-24] Header Text And Action Collapse Tightened**:
    - Locked `THE BAR GENERATOR` to a single line with overflow ellipsis instead of allowing the brand title to wrap at constrained widths.
    - Made the Learn/Download header action collapse to its icon-only version before the header runs out of space by adding a measured spacing buffer around the brand, counter, and action cluster.
- **[2026-04-24] Mobile Header Shrink Treatment Removed**:
    - Removed the mobile-only header reductions that made the brand mark, action button, and title lockup switch into a smaller alternate treatment at narrow widths.
    - Added measured responsive handling for the header action button so `Learn About RPI x Artemis` stays on one line when it fits and collapses to the icon-only control before the label can wrap.
- **[2026-04-24] Lunar Backdrop Locked To Canvas Bottom**:
    - Removed the top-offset Lunar backdrop sizing model after it still allowed tall, constrained layouts to lift the moon photo and expose empty canvas at the bottom.
    - Switched the Lunar photo layer to bottom-anchored `cover` sizing so the image always fills the canvas and keeps its lower edge locked to the bottom during resize.
- **[2026-04-24] Mission Control Header Counter No Longer Overlaps Learn Action**:
    - Changed the Lunar header from an absolutely centered T-plus counter to a three-column grid layout so the brand, elapsed-time counter, and `Learn About RPI x Artemis` action reserve separate horizontal space.
    - Kept the counter detail popover anchored to the counter itself by making the counter a positioned grid item instead of an overlay.
- **[2026-04-24] GitHub Pages 404 Fallback Rebuilt To Match Puckman Mockup**:
    - Replaced the previous marquee-inspired 404 page with a sparse white fallback screen matching the provided mockup: top rerouting pill, bottom-left `Oops... That's awkward.` copy, and the Puckman illustration anchored at the lower right.
    - Added `assets/images/puckman.svg` and its local `assets/images/puckman.png` image source while preserving the existing GitHub Pages fallback redirect logic for bad routes and legacy generator links.
    - Increased the visible reroute countdown to five seconds, matched the headline and notification sizing to the marquee homepage, and placed the headline plus hockey mark in one scaled bottom group so they shrink together across tablet and mobile widths.
- **[2026-04-24] Logo And Lunar Backdrop Resize Motion Smoothed**:
    - Added a rendered responsive-scale interpolation step so the main RPI mark eases toward its new canvas fit during window resize instead of switching to the new scale in a single frame.
    - Moved the Lunar canvas photo out of the large background shorthand and into its own layered pseudo-element, allowing its position and size to transition independently from the grid overlay and reducing backdrop flicker during resize.
    - Restored immediate canvas redraw on resize commits now that the rendered scale is smoothed, avoiding a blank cleared-buffer frame between `resizeCanvas(...)` and the next scheduled redraw.
    - Added a forced draw-frame bypass for resize and layout-transition redraws so the frame limiter cannot skip the first redraw after the WebGL buffer changes, and slowed Lunar backdrop motion to keep it from moving too quickly during resize.
    - Reworked Lunar backdrop motion to animate typed custom properties for image offset and width, replacing direct `background-position` and `background-size` transitions that stepped during continuous page resizing.
    - Added a canvas-height-based minimum to the Lunar backdrop width calculation so tall, horizontally constrained workspaces keep the moon imagery covering the bottom of the canvas.
- **[2026-04-24] Compact Sidebar Overlay Now Animates The Logo Toward A Half-Shown State**:
    - Replaced the earlier compact-overlay fit experiment with a simpler layout model: the logo keeps its normal responsive scale on narrow widths instead of changing size based on overlay coverage.
    - Removed the compact-sidebar horizontal logo shift afterward so opening the mobile overlay no longer moves the RPI mark at all; the logo now stays visually anchored while the sidebar slides over it.
    - Kept the transition-time redraw loop and deferred canvas-resize commit so sidebar motion and window resizing still animate more smoothly while continuing to reduce resize flashing.
- **[2026-04-24] Mission Control Theme Became Re-Selectable In Artemis II Again**:
    - Fixed the custom `COLOR THEME` dropdown state so the `MISSION CONTROL` option now drops both its hidden and disabled styling when the active `BAR STYLE` switches to `ARTEMIS II`.
    - Moved that option-state sync into the shared theme utility layer and added a regression test so the custom dropdown cannot drift away from the native select’s enabled state again.
- **[2026-04-23] Compact Sidebar Overlay Now Starts Earlier To Stabilize Narrow-Width Logo Fit**:
    - Moved the generator’s fixed-sidebar-to-overlay transition up from the old phone-only breakpoint to a shared compact-layout breakpoint at `900px`, so tablet and narrow desktop widths no longer keep squeezing the canvas before suddenly flipping into overlay behavior.
    - Synchronized the JavaScript sidebar logic with that same compact breakpoint, including click-outside handling, focus trapping, save-menu positioning, and sidebar state resets when entering or leaving compact layout, so resize behavior stays consistent instead of fighting between CSS and runtime state.
    - Corrected the compact menu button’s initial `aria-expanded` state to `false`, which prevents narrow-width loads from briefly advertising an open control drawer when the overlay sidebar is actually closed.
- **[2026-04-23] Browser Resize Now Defers WebGL Canvas Resizing To Prevent Logo Flashing**:
    - Changed the generator workspace resize flow so the existing canvas frame stays onscreen while the browser window or viewport is actively resizing, instead of repeatedly resizing the WebGL drawing buffer mid-drag.
    - Added a short settle delay before committing `resizeCanvas(...)`, which removes the visible flash on the large logo during browser resizing while still applying the final responsive canvas size once layout changes stop.
    - Kept sidebar-transition resizing on its explicit sync path so the canvas still snaps cleanly to its finished workspace dimensions after those in-app layout transitions complete.
- **[2026-04-23] Ticker Reverse Direction Mapping Was Corrected**:
    - Flipped the ticker style’s effective reverse-direction mapping inside the shared loop runtime so its unchecked state now runs in the opposite direction from before, and enabling `REVERSE` now sends it the other way as expected.
    - Applied that correction at the shared motion-helper layer so live preview, sharable URL playback, and looping GIF export all keep the same ticker direction behavior.
- **[2026-04-23] Report Action Now Opens A Prefilled GitHub New-Issue Page**:
    - Replaced the old in-app report dialog trigger with a direct GitHub `issues/new` action so the sidebar report button now opens issue creation for this repository instead of the internal form.
    - Prefilled the new GitHub issue with the current style, theme, viewport, sharable URL, user agent, and timestamp so the reporting flow still carries the key runtime context without requiring the local dialog.
- **[2026-04-23] Mission Control Removed The Top Sidebar Divider Under The Selectors**:
    - Hid the divider line directly beneath the style and color dropdowns when the `MISSION CONTROL` theme is active so the top of the lunar sidebar reads as a single uninterrupted control cluster.
    - Corrected the lunar-theme selector afterward so the hide rule targets the real `.sidebar-content` container instead of the outer scroll wrapper, which had left the divider visible.
    - Restored the removed divider block’s vertical footprint as spacing above `COMMS`, so the first Mission Control section now sits at the same distance from the dropdowns as the first section in the standard sidebar layouts.
- **[2026-04-23] Mission Control Source Credit Moved Into The Footer Rail**:
    - Moved the Boromir lunar-surface credit block from the top of the sidebar into the sticky footer area so it now sits directly above `Report Anomaly` in Mission Control instead of interrupting the main control stack.
    - Updated the link copy from `View repository` to `View source code` and placed that link on its own line beneath the attribution sentence for a cleaner footer reading order.
    - Added a dedicated footer divider between that source-credit card and `Report Anomaly` so the lower action rail keeps a visible separation even after the top Mission Control divider was removed.
- **[2026-04-23] Mission Control Fun Panel Now Stays Theme-Gated And Visually Quiet**:
    - Limited the special `ARTEMIS II` `FUN` panel so it only appears when the current bar style is `ARTEMIS II` and the active color theme is `MISSION CONTROL`, instead of appearing for the style under other themes.
    - Removed the lunar header’s red status marker from that special panel and kept its `FUN` header aligned flush left so the section reads like the rest of the sidebar rather than like a flagged alert.
- **[2026-04-23] Audio Preview Coverage Expanded And Artemis II Mission Audio Added**:
    - Fixed the shared preview-audio transport so the bar styles that are supposed to expose sound previews continue to work consistently through the current unified runtime, including `WAVEFORM`, `TICKER`, and `MORSE CODE`.
    - Added a dedicated `ARTEMIS II` audio preview using the provided liftoff clip, but gated it to the `MISSION CONTROL` color theme only so the special mission audio does not leak into the standard exported-mark theme set.
    - Stopped that mission audio automatically when users leave the Mission Control theme or switch away from the Artemis II style, keeping transport state and accessibility copy in sync with the visible controls.
- **[2026-04-23] Slider Value Editing No Longer Clips Digits Or Reflows Labels**:
    - Reworked the click-to-edit slider value treatment so the inline input now overlays the existing value footprint instead of replacing it in normal layout flow, which stops adjacent label content from shifting when editing begins.
    - Fixed the edit field sizing and alignment so values no longer lose a digit while editing, especially on compact numeric readouts with suffixes such as `%` or ratio formatting.
- **[2026-04-23] Slider Tick Markers Removed From Sidebar Controls**:
    - Removed the recently added discrete-step tick markers beneath sidebar range inputs so the sliders return to the cleaner uninterrupted track treatment.
    - Kept the click-to-edit numeric value labels and all existing slider bounds, snapping, and parameter behavior intact; this change only removes the visual tick decoration and its helper DOM/CSS.
- **[2026-04-23] Audio Preview Section Clarified In The Sidebar**:
    - Renamed the runtime section header for preview-audio controls from `AUDIO` to `PREVIEW` across the generator sidebar so the grouping reads as an on-canvas preview feature rather than an exported asset feature.
    - Restored the row label beside the preview icon itself to `AUDIO`, keeping the control purpose explicit while avoiding the misleading impression that exported downloads include sound.
- **[2026-04-23] Looping GIF Timing Now Respects Viewer-Safe Frame Delays**:
    - Updated the shared looping GIF planner to reduce frame count for very fast loops instead of always forcing at least 24 frames, which caused some downloaded GIFs to play slower than the live preview once viewers clamped tiny frame delays.
    - Preserved the same loop-period math between preview and export, but now keep the exported frame delay at a safer floor so the downloaded GIF’s real playback speed tracks the on-canvas motion much more closely.
- **[2026-04-23] Looping Styles Gained A Reverse Direction Toggle**:
    - Added `REVERSE` motion toggles for `RULER`, `TICKER`, and `WAVEFORM` so loop previews can run in either direction without changing the underlying pattern geometry or brand-safe defaults.
    - Wired reverse state through the shared loop runtime helper, sharable URL parameters, reset/randomize flows, and looping GIF export so live preview and exported motion stay aligned.
    - Kept the default direction unchanged, preserving existing links and the prior motion behavior unless the reverse option is explicitly enabled.
- **[2026-04-23] Numeric Slider Labels Became Editable And Discrete Stops Gained Tick Dots**:
    - Added click-to-edit behavior to the numeric slider readouts in the generator sidebar so users can type exact values directly from the label, matching the existing zoom percentage control pattern instead of relying only on dragging.
    - Added subtle vertical notch rows for low-count discrete sliders such as units, variants, envelope controls, and ratio selectors so the fixed snap positions are visible before interaction, then aligned those notches to the slider thumb travel instead of the full input width.
    - Refined the inline edit state so typing temporarily replaces the entire displayed value treatment, including affixes like `%`, rather than leaving adjacent static fragments visible beside the active field.
    - Tightened that edit state again so the active field now fully replaces the sidebar readout container while editing, preventing any duplicate number from remaining visible beside the temporary input and matching the focused zoom-field behavior more closely.
    - Kept the existing per-style normalization rules intact, including ticker width-ratio bounds, graph scale clamping, loop speed rounding, and waveform envelope snapping when values are typed manually.
- **[2026-04-23] GitHub Pages 404 Fallback Restyled Into A Branded Recovery Screen**:
    - Replaced the old bare redirect card in root `404.html` with a homepage-aligned marquee fallback that keeps the existing all-black shell, animated bar background, and hero lockup language while swapping in 404-specific recovery copy.
    - Preserved the existing GitHub Pages auto-reroute logic while adding a short visible countdown, the missing route label, and direct links back to the homepage or a clean `solid` generator entry.
- **[2026-04-23] Under-Construction Bar Styles Disabled In The Picker And Routing**:
    - Marked `MUSIC`, `DATA GRAPH`, and `TRUSS` as unavailable options in the bar-style dropdown so they remain visible for roadmap context but cannot be selected from the custom picker.
    - Updated generator route normalization and GitHub Pages fallback handling so direct `/generator/music/`, `/generator/graph/`, `/generator/truss/`, and legacy `staff` links now canonicalize back to `/generator/solid/` instead of loading unfinished styles.
- **[2026-04-23] Circles Now Reject Interlocking Ring Layouts**:
    - Removed the old circles-overlap feature from the circles UI, sharable URL state, and generator core so randomize and deep links can no longer land on any legacy interlocking-circle behavior.
    - Included circle fill style in the live geometry cache key and versioned the updated pattern scripts so switching between `FILL` and `STROKE` reliably regenerates the correct safe layout instead of reusing stale geometry.
    - Replaced the old row-based circle fallback and edge-coverage repair pass with deterministic scatter generation so under-filled or repaired circles bars still resolve as irregular random dots rather than aligned horizontal bands.
- **[2026-04-23] Motion Controls Split From Audio And Synced To Export Timing**:
    - Reworked the sidebar runtime areas so animated styles now use a dedicated `MOTION` section with loop on-off toggles and style-local speed sliders, while `AUDIO` stays isolated as a separate non-essential preview feature.
    - Added motion speed controls for `RULER` and `TICKER`, moved `WAVEFORM` speed out of the main parameter block into `MOTION`, and routed live canvas motion, header preview timing, PNG/SVG snapshots, and looping GIF export through the same shared loop-duration math.
    - Replaced the old play-pause preview behavior with deterministic loop toggles that reset animated styles to the loop start instead of freezing on an arbitrary mid-animation frame.
- **[2026-04-23] GIF Export Description Tightened To Match The Other Download Labels**:
    - Shortened the standard GIF menu description to the same `Best for...` style as the PNG and SVG options while still making the animated use case explicit.
- **[2026-04-23] Export Menu Copy Simplified For Broader Campus Use**:
    - Renamed the standard download options to plain `PNG`, `SVG`, and `GIF` so the picker reads more directly instead of using file-type jargon in the labels.
    - Rewrote the supporting descriptions in simpler terms aimed at general student and faculty use cases, including slides, documents, sharing, resizing, and motion previews.
- **[2026-04-23] Download Picker Simplified To Export-Only Actions**:
    - Removed the `Copy Embed Code` entry from the download picker so the menu now contains only direct asset-export actions.
    - Cleaned up the associated save-menu copy tables and event wiring so the picker no longer carries an unused fourth action in standard or mission-control states.
- **[2026-04-23] PNG Download Resolution Increased For Sharper Logo Exports**:
    - Raised the PNG export render scale from `1.5x` to `4x`, which substantially increases the downloaded raster dimensions without changing the live preview or SVG output.
    - Kept the existing transparent-background export path and padding behavior intact; this change only affects the pixel density of the downloaded PNG.
- **[2026-04-23] Runtime Sidebar Section Restyled To Match Parameters Header**:
    - Replaced the old `PREVIEW` subheader treatment in the dynamic sidebar groups with a full `RUNTIME` section header so motion and audio controls now read as a separate runtime block instead of another parameter row.
    - Moved the divider to the bottom edge of that section title by reusing the shared `control-header` styling, which makes the runtime section visually match `PARAMETERS` and removes the stray line above the label.
- **[2026-04-23] SVG Bar Export Height Corrected To Preserve Full Bottom Edge**:
    - Fixed the SVG export frame so the saved wordmark now uses the full reference logo height derived from the bar's actual `y + height` bounds instead of the previously shorter hardcoded value that clipped the bottom edge.
    - Applied the same reference-height correction to the header preview SVG builder so the in-app vector preview and the downloaded SVG now use the same overall logo box.
    - Kept PNG and GIF export behavior unchanged; the regression was isolated to SVG markup sizing rather than the bar pattern geometry itself.
- **[2026-04-21] GitHub Pages 404 Fallback Added For Legacy And Bad Deep Links**:
    - Audited the live GitHub Pages deployment at `https://tennitech.github.io/rpi-logo-generator/` and confirmed the intended primary routes still work directly under the real repo base path: `/`, `/generator/`, and valid `/generator/[style]/` pages all serve the expected shells and shared assets.
    - Added a custom root `404.html` plus a dedicated Pages fallback utility so unsupported or legacy deep links such as `/generator/staff/`, `/generator/matrix/`, and unknown `/generator/[bar-style]/` paths now recover automatically into valid generator routes instead of stopping at GitHub's default 404 page.
    - Preserved the marquee homepage as the default non-generator destination: unknown non-generator paths now redirect back to `/`, while bad legacy links that still carry generator query state continue to normalize into valid `/generator/[style]/` URLs under the same GitHub Pages base path.
- **[2026-04-21] Legacy Generator Entry URLs Canonicalized To Style Routes**:
    - Extended routing compatibility so old generator-first entry links like `/generator/` and `/generator/index.html` now redirect into the new `/generator/[style]/` structure instead of lingering on the pre-restructure base path.
    - Preserved legacy `style` query handling on those generator entry links, mapping known aliases such as `staff` onto the current style slugs and falling back safely to `solid` when the requested style is missing or unknown.
    - Moved the redirect check into the shared generator bootstrap as well so static wrapper pages normalize `index.html` variants and strip stale `style` query params before the generator shell loads.
- **[2026-04-21] Waveform Preview Input Lag And Mobile Audio Teardown Fixed**:
    - Reduced live waveform preview cost by capping point density to an adaptive width-and-frequency-based sample budget and by moving envelope-state reads out of the per-vertex loop, which removes the worst slider and motion-toggle lag when waveform settings are pushed to their maximum values.
    - Fixed preview audio ownership so stopping audio now follows the actively playing preview type instead of the currently selected bar style; this resolves the waveform case where switching to another style could leave the old sound running.
    - Added stronger document background teardown hooks (`visibilitychange`, `blur`, `pagehide`, `beforeunload`, and `freeze`) and suspend the audio context when the page is backgrounded, closing the Android case where preview sound could continue after leaving the browser or switching apps.
- **[2026-04-21] Browser Pinch Zoom Disabled And Canvas Pinch Routed Into Preview Zoom**:
    - Disabled native browser pinch-to-zoom across the marquee and generator page shells so the app no longer scales the page itself when users pinch on touchscreens or trackpads.
    - Added a dedicated canvas pinch path in `js/main.js` that converts in-canvas pinch gestures into the existing preview zoom state, keeping the zoom buttons, zoom percentage field, and gesture-driven zoom behavior on the same viewport logic.
    - Intercepted desktop pinch-as-browser-zoom gestures as well so ctrl-wheel and Safari gesture zoom now either adjust the generator canvas preview or get blocked outside the canvas instead of magnifying the page.
- **[2026-04-21] Desktop Sidebar Toggle No Longer Blanks The Logo Canvas**:
    - Stopped the generator from resizing the WebGL backing canvas on every frame of the desktop sidebar collapse and expand transition, which had resurfaced as a white logo flicker while the control rail animated.
    - Added a transition-end and timeout-backed final resize pass so the workspace still snaps to the correct final dimensions after the sidebar finishes moving, without losing the current logo frame mid-animation.
- **[2026-04-21] Marquee Row Spacing Locked Against Viewport Height Compression**:
    - Reworked `marquee-ui.html`'s diagonal row placement so the marquee lanes now keep a fixed vertical pitch instead of recalculating row spacing from the live viewport height, which previously caused the rows to collapse into each other on shorter screens.
    - Let excess rows clip naturally at the top and bottom of the stage again while enforcing that minimum pitch, restoring the fuller wide-screen marquee composition without reintroducing row crowding on short viewports.
    - Kept the hero title and credit clearance wrappers in place for layout control, but removed their visible fill so those protective surfaces are now fully transparent instead of reading as black boxes over the marquee.
    - Tightened the title lockup's bottom clearance padding so the protected area under `The Bar Generator` no longer carves out unnecessary empty space at mid-sized desktop resolutions.
    - Added a large-desktop marquee tier for `1920x1080` and above so the diagonal bars, row height, gap rhythm, and hero lockup can all scale beyond the baseline desktop size instead of plateauing.
    - Added a smooth upward-lift band for near-square, taller viewport ratios so the diagonal rows rise earlier around tablet and edge-case desktop sizes instead of waiting for a hard breakpoint where they can still cross underneath the title before snapping clear.
    - Strengthened the narrow-portrait hero scale cap and reduced the measured mobile lockup bottom gap so widths around the `547px` class now shrink the RPI mark and title cluster sooner while preserving the same proportional padding model used by the larger layouts.
    - Removed the separate narrow-screen hero centering path so portrait widths now keep the same left, right, and bottom inset model as the larger layouts while still dropping the RCOS credit at the smallest breakpoint.
    - Updated the credit-hidden narrow-screen scale calculation so once `Made in RCOS` drops away, the hero can size itself against the actual title block instead of the larger desktop lockup width, letting `The Bar Generator` grow into the reclaimed horizontal space.
    - Added a dedicated narrow-portrait row-clearance lift band between roughly `430px` and `550px` wide so the diagonal bars rise away from the RPI mark in tall phone-sized edge cases without changing the lockup mode switch or the RCOS credit cutoff behavior, and then tuned that band upward in small follow-up passes after visual review to open a bit more space above the logo.
    - Added regression coverage for the row-position helper so future marquee changes keep the fixed-gap behavior when the viewport height shrinks.
- **[2026-04-21] Easter Egg Game References Removed From Generator Runtime**:
    - Removed the inactive Rink Rush easter-egg integration from the live generator shell, including its startup hooks, hidden overlay markup, workspace launcher button, and bar-render interception path in `main.js`.
    - Stopped loading the standalone easter-egg script and removed its Jest coverage file so the current app no longer carries dormant arcade-only runtime paths while that feature is on hold.
    - Stripped stale `gif.js` and `gif.worker.js` source-map annotations from the vendored exporter assets so browsers stop logging 404 requests for missing local `.map` files.
- **[2026-04-21] Mission Control Mobile Credits Panel Clamped To Viewport**:
    - Fixed the Mission Control `Learn About RPI x Artemis` panel on phones so the credits popup no longer renders past the left viewport edge when opened from the compact icon-only header action.
    - Kept the desktop dropdown behavior unchanged while switching the mobile panel to a viewport-aware position pass that anchors to the trigger and clamps within the visible screen width.
- **[2026-04-21] Live Preview Scale Made Viewport-Responsive**:
    - Reworked the on-canvas RPI mark sizing so the default `100%` preview now resolves relative to the visible workspace instead of a fixed draw scale, which keeps the logo proportionate across phones, tablets, and desktop canvases.
    - Kept export geometry unchanged; the responsive logic only affects live preview sizing, pan bounds, and interactive hotspot alignment inside the generator viewport.
    - Capped the responsive baseline at the previous desktop scale so larger workspaces keep the established presentation while smaller screens automatically reduce the default preview size to avoid clipping.
- **[2026-04-21] Mobile Viewport Locking And Touch Input Recovery**:
    - Locked both the generator workspace and `marquee-ui.html` to the visible mobile viewport using a shared viewport-height CSS variable synced from `visualViewport` when available, replacing the earlier `100vh`-based sizing that could size against browser chrome and make the pages feel like desktop layouts on phones.
    - Removed the generator's global mobile `touchend` cancellation path and switched sidebar outside-close handling onto `pointerdown`, restoring normal tap-to-click behavior for mobile buttons, menus, and custom dropdown controls.
    - Tightened the generator's phone header, action cluster, floating workspace controls, and mobile drawer width so the interface fits the handset frame more intentionally without introducing page-level scrolling.
    - Removed the marquee page's narrow-screen `overflow-y: auto` fallback so the home experience now stays non-scrollable and scales the hero cluster inside the visible phone screen instead of extending below it.
    - Reworked mobile pan-mode input to use explicit pointer-drag tracking on the canvas viewport with touch gestures disabled only while pan mode is active, preventing the logo from dropping out during phone drags and preserving the existing desktop mouse path.
    - Limited bottom-toolbar hover affordances to hover-capable fine-pointer devices so mobile taps no longer leave the workspace pill controls stuck in a pseudo-hover state after the first press.
- **[2026-04-20] GitHub Pages Source Switched Back To `main`**:
    - Confirmed the existing default Pages URL remains `https://tennitech.github.io/rpi-logo-generator/` and reused it instead of creating a new site path.
    - Switched the repository's GitHub Pages publishing source from a stale GitHub Actions deployment back to `Deploy from a branch` on `main` at `/ (root)` so the live site tracks the repository's primary branch again.
    - Added a root `.nojekyll` marker file so GitHub Pages serves the repo as a plain static site without Jekyll processing during branch-based publishing.
- **[2026-04-20] Marquee UI Promoted To Home And Generator Moved To Style Routes**:
    - Switched the default site entry point from the generator workspace to the marquee experience, making `/` the primary home page while preserving `marquee-ui.html` as an alias.
    - Moved the generator onto style-specific paths under `/generator/[style]/` and updated generator URL synchronization so the active bar style now lives in the pathname instead of the query string.
    - Added a static route bootstrap layer so style-specific generator paths work on plain static hosting without framework rewrites, and kept legacy query-based generator links compatible by redirecting them into the new `/generator/[style]/` paths.
    - Made marquee bar assets real links into the generator, and then simplified that interaction so every marquee click now opens the default generator view instead of style-specific destinations.
    - Fixed a routed-generator startup regression where the shell HTML loaded but the canvas stayed blank because `p5.js` initialized before the injected generator scripts defined `window.setup`; the bootstrap now explicitly starts one p5 instance after those scripts finish loading.
- **[2026-04-20] Mission Control Theme And Splashdown Counter**:
    - Reworked the former visible `LUNAR` color option into `MISSION CONTROL` while keeping the underlying `lunar` value for URL and legacy state compatibility.
    - Refined the mission-control chrome back toward the design system by removing the decorative header divider, sidebar plaque, workspace-control label/dot treatment, and oversized workspace counter treatment while preserving restrained RPI Red command accents and RPI Blue/Silver signal details.
    - Added a compact Artemis II splashdown elapsed-time counter centered in the header, using NASA's reported splashdown timestamp of April 10, 2026 at 8:07 p.m. EDT as the fixed start time.
    - Normalized Mission Control divider and border colors around a shared blue divider token, then restyled the T-plus counter with a small `Since splashdown` caption and a subtler panel shape.
    - Added Mission Control-only interface copy for `SIGNAL`, `DISPLAY MODE`, and `Report Anomaly`, plus a sidebar `BOROMIR - Lunar surface source` credit block below the main divider linking Maeve Marshall's thesis repository.
    - Refined the Mission Control canvas grid with subtle major grid lines and coordinate ticks, added hover readouts to workspace controls, added blue/red launch-key focus states, and made the T-plus counter open a compact splashdown detail popover with the same reveal motion as the header Learn menu.
    - Reworked the Mission Control grid into a responsive overlay that scales to the visible canvas so cells stay complete on each device, the center lines stay aligned to the RPI mark and bottom controls, and the canvas resize tracks the sidebar transition smoothly instead of snapping at the end.
    - Converted the header asset menu into a contextual `Learn About RPI x Artemis` credits panel while Mission Control is active, linking Reid Wiseman, Maeve Marshall, Paul McKee, and Maeve Marshall's lunar thesis-image source without changing the normal export menu in other themes.
    - Kept the hidden Rink Rush easter egg unchanged; the new treatment applies to the Mission Control theme interface and header counter only.
- **[2026-04-19] Added `SPECIAL / ARTEMIS II` Static Bar Option**:
    - Added a new `SPECIAL` section above `UNDER CONSTRUCTION` in the `BAR STYLE` dropdown with an `ARTEMIS II` option.
    - Copied the user-provided Artemis bar SVG into `assets/bars/bar-lunar.svg` and generated a shared JS asset from it so the live canvas and export paths use the same vector source.
    - Updated live preview, PNG rendering, and SVG export so Lunar bar artwork inherits the active logo/theme color instead of staying black.
    - Renamed the visible special bar option to `ARTEMIS II` and added a `LUNAR` color theme using the provided moon-horizon image as the canvas backdrop. The Artemis II bar defaults into that theme while keeping manual color overrides available.
    - Refined the Lunar theme toward a restrained white, dark-blue, and RPI-red interface treatment and lowered the moon surface in the canvas backdrop so the logo sits primarily against space.
    - Normalized Lunar theme hover, border, selected, and focus states against the shared control token system so default structure uses dark-blue borders while active and focus affordances use RPI red consistently.
    - Changed the Lunar color theme to behave like an optional Artemis II-only easter-egg theme: it sits at the bottom of the color dropdown, is hidden for all other bar styles, and no longer becomes the default when ARTEMIS II is selected.
- **[2026-04-17] Added `NEURAL NETWORK` As A New Scientific Bar Pattern**:
    - Introduced a new `NEURAL NETWORK` bar style in the main generator, designed as a feedforward multilayer node-and-connection diagram that stays inside the official bar geometry and uses the existing one-color brand system.
    - Implemented the pattern through the shared `js/utils/barPattern.js` geometry/export pipeline so live preview, header preview, and SVG export all use the same source of truth instead of drifting.
    - Added regression coverage for the new geometry and SVG serialization so the network stays stable as additional bar styles are added later.
    - Refined the geometry after review so the network now uses much more of the official bar height and added a `HIDDEN LAYERS` parameter to control the depth of the interior network structure directly from the UI and URL state.
    - Tightened that geometry again after visual review by switching to a fixed node count per layer and sparse adjacent-layer connectivity, which removes the overloaded corner fan-outs and keeps the network legible across the full bar span.
    - Reduced the node count again and enlarged the remaining nodes so the neural bar reads with fewer circles and stronger dot presence at generator scale.
    - Reintroduced controlled diagonal cross-links after review so the bar preserves a clearer neural-network character without returning to the earlier dense all-to-all mesh.
- **[2026-04-17] Exported-Mark-First Theme System Recovered And Refined**:
    - Removed `LINK BLUE` from the active color-theme set, including the picker option, export color mapping, CSS theme class, theme availability lists, and legacy color-mode alias handling.
    - Restored the intended contrasting workspace families so `BLACK` now renders in the light UI family while `WHITE`, `SILVER`, and `GRAY` remain on dark workspace surfaces, matching the generator's exported mark-color model again.
    - Replaced the remaining generic theme-state styling with explicit semantic tokens for header controls, dropdown rows, save-menu states, preview/report buttons, workspace chrome, sliders, and toggles so every color theme follows the same interaction logic without falling back to unreadable defaults.
    - Removed the last contrast-breaking assumptions from the custom-select system, including hardcoded light-on-accent selected rows that could fail on pale themes such as `WHITE`, `SILVER`, and `GRAY`.
    - Added a shared `themeMode` utility plus regression tests for legacy alias normalization and custom-select sync so the exported-mark-first theme naming and dropdown state behavior are less likely to drift again.
    - Followed that recovery with a Safari-specific polish pass for the `GOLD` theme: active toggle knobs now stay white, open dropdown triggers no longer show the old red focus box, toggle switches reuse the slider halo-style hover treatment, and the custom-select scrollbar gutter is hidden so selected gold rows fill cleanly to the right edge.
    - Hid the visible sidebar scrollbar across engines so overflow now relies on the existing top and bottom fade cues instead of showing a separate track/thumb inside the control rail.
    - Rebuilt the preview/audio transport controls into a shared icon-driven system across `TICKER`, `WAVEFORM`, `BINARY`, `MORSE CODE`, and `MUSIC`, with unified play/pause button logic, compact restart actions, live-state animation, and disabled guidance for music when no notes are present.
    - Added a dedicated `previewControls` utility plus regression tests so transport labels, ARIA copy, active states, and restart semantics stay consistent as preview behavior evolves.
    - Added versioned local asset URLs for the updated stylesheet and main preview scripts to reduce Safari cache-staleness after these UI changes.
    - Simplified that preview transport pass again after review: the controls now use a more minimal single-line treatment with smaller icon marks, lighter borders, and a restrained active indicator instead of the heavier two-line card-style presentation.
    - Replaced that experimental rail treatment after review with a stricter toolbar-style transport pattern: preview rows now use the same compact icon-button language as the workspace controls, visible text labels and extra restart actions are gone, and motion/audio state is communicated only through the gray play-pause and volume icons themselves.
    - Fixed the `MORSE CODE` text input so clearing the field no longer falls back to visible `RPI` output in the live canvas or SVG pattern path, renamed `SURPRISE` controls to `RANDOMIZE`, and squared their radius to match the compact toolbar hover-button language.
    - Corrected the mobile controls drawer so the sidebar remains a right-edge panel at small widths instead of switching to a left-side slide-in.
    - Removed the mobile-only workspace padding so the canvas background fills edge-to-edge like the desktop layout instead of exposing colored app edges around the logo area.
    - Softened logo panning with resisted drag deltas, eased offset following, and short decaying inertia so the pan tool feels less twitchy while preserving the existing pan bounds.
    - Added a small shared pan-edge inset so the logo can get close to the viewport edges on desktop and mobile without clamping flush against them.
    - Kept the header height consistent across desktop and mobile by removing the mobile-only shorter header override.
    - Simplified the `CIRCLES` parameter panel so it only exposes `MODE` (`PACKING`/`GRID`), `STYLE` (`STROKE`/`FILL`), and the shared density and variation sliders; grid mode now uses those same controls with fixed internal grid defaults.
    - Tightened `CIRCLES` rendering so generated grid and packing circles keep usable multi-circle coverage across the full bar bounds and are clipped to the official bar rectangle, keeping live canvas, header preview, and SVG export visually full-bleed without leaking outside the mark geometry.
- **[2026-04-15] Runtime Control Redesign Rolled Back After Stylesheet Corruption**:
    - Restored `css/style.css` after it was accidentally overwritten, then reapplied the current right-sidebar shell, scroll-fade, sticky report rail, report dialog, and parameter-header utility styling as an override layer.
    - Reverted the unfinished `LIVE` runtime-control treatment back to the prior `PREVIEW` structure so the interface returns to the last stable control layout.
- **[2026-04-15] Top Sidebar Fade Moved Into The Scrolling Content Layer**:
    - Reworked the sidebar into a fixed shell plus an inner scroll region so the top fade can live on the shell while the controls and pinned report footer scroll independently underneath it.
    - Kept the fade tied to actual scroll state so it remains hidden at the top and only appears once content has moved underneath it.
    - Aligned the top fade styling with the footer fade treatment so both edges now use the same soft gradient language instead of mixing different blur and shadow effects.
    - Removed the extra top-fade DOM node and its layout footprint so the first control group sits flush at the top again without introducing a visible gap.
    - Made the inner scroll region a full-height flex column so the `Report a Problem` footer now stays anchored to the bottom even on shorter control sets.
- **[2026-04-15] Top Sidebar Fade Reintroduced As A Scroll-Only Overlay**:
    - Reimplemented the top sidebar cue as a pseudo-element on the sidebar shell instead of a real DOM layer, avoiding layout interference with the first controls.
    - The fade now stays fully hidden at the top and only appears after the sidebar has actually been scrolled, making it a true scroll indicator instead of a permanent band.
- **[2026-04-15] Mobile Marquee Hero Now Prioritizes The Main Lockup Below 550px**:
    - Added a dedicated narrow-screen hero layout for `marquee-ui.html` that hides the `Made in RCOS` credit below `550px` so the poster composition does not collapse into cramped secondary text on phones.
    - Recentered the RPI mark and `The Bar Generator` lockup and switched the hero scale math to mobile-specific dimensions at that breakpoint so the main title can expand to the available device width instead of shrinking against the desktop credit layout.
    - Tightened the mobile hero box and added narrower-screen typography sizing for the title lockup so the centered group keeps its intended prominence without cutting off `Generator` on small devices.
    - Reworked that narrow-screen behavior again so the lockup now scales from the measured width and height of the existing left-aligned RPI/logo title group itself, preserving the desktop padding rhythm instead of relying on separate mobile font sizing or ad hoc box dimensions.
    - Restored the larger-layout bottom breathing room inside that measured mobile lockup by adding back the same bottom gap beneath the title group instead of collapsing the lockup box tightly around the text.
- **[2026-04-15] Marquee Credit Enters A Compact Layout Before Narrow-Width Clipping**:
    - Updated the experimental `marquee-ui.html` hero scaling logic so the lower-right RCOS credit switches into a compact placement once the shared hero cluster shrinks past a defined threshold.
    - Lifted the credit block upward and slightly inward in that compact state, and allowed the byline to wrap instead of clipping off the right edge on smaller viewports.
- **[2026-04-15] Sidebar Report Action Pinned As A Persistent Utility Rail**:
    - Converted the `Report a Problem` control into a sticky sidebar footer so it remains available even while parameter panels scroll.
    - Added a soft top edge fade above the pinned footer using the same dropdown scroll-fade visual language, so controls can disappear under the report rail without a hard cutoff.
    - Removed the top sidebar fade entirely after testing; the clean header edge works better and avoids visual interference with the first controls.
    - Split the sidebar into a dedicated scrolling control region plus a pinned footer rail so the last controls can still scroll fully into view without being trapped under the report action.
    - Removed the forced full-height control stack so the sidebar now only becomes scrollable when the active UI genuinely overflows the available height.
- **[2026-04-15] Preview Runtime Controls Reworked Into A Consistent Transport System**:
    - Replaced the mixed preview toggles and transport buttons with a single button-based preview model so runtime controls now read as actions instead of configuration state.
    - `TICKER` and `WAVEFORM` now expose motion as `PLAY` / `PAUSE` transport buttons, while all audio-capable bars use the same button treatment for audio preview and sequence-capable bars expose a matching `RESTART` action.
    - Removed preview playback state from the sharable URL layer so exported and shared generator state reflects the designed bar, not transient runtime preview status.
- **[2026-04-15] Pan Tool Now Releases On First Outside Click**:
    - Reworked the viewport pan tool so any pointer-down outside the main canvas viewport immediately exits pan mode instead of consuming the user's first sidebar or workspace-control interaction.
    - Kept drag behavior unchanged inside the canvas area, including the active logo/bar repositioning flow, while leaving the pan button itself responsible for its own toggle state.
- **[2026-04-15] Sidebar Reporting And Parameter Randomize Controls Added**:
    - Added a persistent `Report a Problem` action to the bottom of the sidebar and implemented a native dialog-based reporting flow that captures the current style, theme, viewport, browser, timestamp, and sharable state URL automatically.
    - Wired the reporting flow so it is ready for a static-site-friendly Google Sheets pipeline through a deployable Google Apps Script URL, while preserving a clipboard fallback during local development until that endpoint is configured.
    - Added contextual randomize controls beside `RESET` inside each parameterized style panel so users can rapidly generate valid random variations without changing bar style, color theme, or preview-state toggles.
- **[2026-04-15] Header Added Direct Repository Shortcut**:
    - Added a dedicated GitHub icon action to the main header so the project source is reachable as a secondary utility without competing with the primary `Download Asset` CTA.
    - Placed the repository shortcut inside the existing right-side action cluster between download and the sidebar toggle, keeping the brand lockup clean and aligning the new link with the same bordered icon-control treatment already used in the header chrome.
- **[2026-04-15] Runtime Preview Controls Standardized Across Audio And Animated Bars**:
    - Reworked `BINARY`, `TICKER`, `WAVEFORM`, `MORSE`, and `MUSIC` so style-local runtime actions now live in a consistent `PREVIEW` section instead of being scattered between inline rows and full-width badges.
    - Promoted animation pause/play to the shared workspace toolbar with a real global playback button, keeping `SPEED` as a waveform parameter while removing the old waveform-only visible animate toggle.
    - Replaced large runtime badges with compact status chips, kept persistent audio toggles only for continuous-preview styles, and converted `MUSIC` to transport-style `PLAY` and `RESTART` behavior instead of a hidden persistent audio mode.
- **[2026-04-15] Runtime Controls Simplified And Reset Added Per Style**:
    - Removed the bottom workspace playback control again so the floating toolbar returns to view-only actions such as zoom and pan instead of mixing viewport and style-preview responsibilities.
    - Simplified preview UI by stripping out passive status bubbles like `LIVE`, `SPACEBAR`, and `SEQUENCE`, and by letting transport buttons and toggles communicate state directly.
    - Added a lightweight `RESET` action inline with each dynamic `PARAMETERS` header so each style can quickly return to its own default values without resetting the whole generator.
    - Moved motion pause/resume back into the relevant sidebar styles (`TICKER` and `WAVEFORM`) so preview controls now live with the parameters they affect.
    - Unified audio interaction across preview-capable styles by giving `MORSE` and `MUSIC` the same explicit audio toggle pattern as the other audio bars, while leaving their play/restart controls as secondary transport actions.
- **[2026-04-15] Toggle Active Colors Aligned With Theme Identity**:
    - Made the active toggle track and hover-ring tokens explicit for the chromatic themes so `RED`, `BLUE`, and `GOLD` now reliably use their own theme color instead of falling back to a generic red on-state.
    - Kept the neutral themes contrast-aware by preserving specialized active-toggle treatments for `WHITE`, `SILVER`, and `GRAY`, and explicitly setting `BLACK` to use a black track with a light knob for legibility.
- **[2026-04-15] Slider And Toggle Interaction States Made Contrast-Aware**:
    - Added universal slider thumb hover and focus treatment using a ring/halo and slight scale change so neutral themes like `BLACK` and `WHITE` still show meaningful interaction feedback even when the fill color barely changes.
    - Split toggle active styling into dedicated track, border, knob, and ring tokens instead of relying on the raw theme accent color alone.
    - Tuned `WHITE`, `SILVER`, and `GRAY` so enabled toggles now use stronger active tracks, darker knobs, and clearer focus/active contrast on their darker UI surfaces.
- **[2026-04-15] Added Three Reference Bar Families And Reworked Music Styling**:
    - Added selectable `LINES`, `POINT CONNECT`, and `TRIANGLE GRID` bar styles to the main generator, each with a matching lightweight variant control derived from the corresponding reference SVG family under `assets/bar references/`.
    - Implemented shared geometry helpers for those styles in `js/utils/barPattern.js` so live rendering, header previews, and exported SVG bar output all use the same rect/line construction.
    - Reworked the `MUSIC` bar renderer to use filled circular note heads on a five-line staff closer to `assets/bar references/Style=Music.svg`, replacing the previous stem-and-flag-heavy notation treatment and keeping note placement constrained inside the bar.
    - Added regression coverage for the new reference-style geometry helpers and serialization paths.
- **[2026-04-15] Waveform Envelope Controls Constrained To Brand Bar Bounds**:
    - Reworked waveform envelope center-offset handling so shifting the waveform center now compresses the usable amplitude toward the nearest edge instead of letting the filled waveform escape the official bar height.
    - Locked the waveform envelope `WAVES` control to whole-number steps from `1` through `10`, removing the previous half-step states.
    - Narrowed the waveform envelope `CENTER OFFSET` control to a `-0.5` through `0.5` range and clamp legacy query-string values into that tighter window.
    - Passed the same envelope settings through live rendering, header preview SVG generation, and exported SVG bar output to keep waveform behavior consistent across the tool.
- **[2026-04-15] Looping GIF Export Added For Repeating Bar Styles**:
    - Added a conditional `LOOPING GIF` download action to the main asset menu and limited it to the repeat-safe bar styles: `RULER`, `TICKER`, and `WAVEFORM`.
    - Implemented a dedicated loop-planning utility so ruler and ticker exports translate by one exact repeat cell and waveform exports capture one exact phase cycle, preventing visible seams when the GIF restarts.
    - Vendored a local copy of `gif.js` under `third_party/gif.js` so animated exports work without a CDN dependency and documented the addition in the repo's third-party notices.
- **[2026-04-15] Remaining Reference Bar Styles Added**:
    - Added the remaining production bar families from `assets/bar references/` to the public generator: `CIRCLES GRADIENT`, `GRADIENT`, `GRID`, `TRIANGLES`, `FIBONACCI SEQUENCE`, `UNION`, and `WAVE QUANTUM`.
    - Kept live canvas rendering and exported SVG output on the same shared geometry helpers so each new style stays consistent between preview and export.
    - Added selector controls for the reference families that expose multiple documented variants, while leaving `SOLID` as the existing equivalent of the default bar treatment instead of duplicating it as a separate style.
    - Corrected the first-pass `FIBONACCI SEQUENCE` and `UNION` helpers so Fibonacci now renders as separated weighted segments instead of a visually solid fill, and Union now uses repeated modular scalloped blocks instead of circular cutouts extending below the bar.
- **[2026-04-15] Organization Bar Style Added For RPI Flying Club**:
    - Added an `ORGANIZATIONS` section to the `BAR STYLE` dropdown between the main production styles and the `UNDER CONSTRUCTION` group.
    - Introduced a functional `RUNWAY - RPI FLYING CLUB` bar style with no extra parameter controls so it behaves like a real selectable/exportable bar pattern rather than a placeholder.
    - Derived normalized runway geometry from `assets/bars/bar-competition_runway.svg` so the style renders with the active foreground color in the live canvas, header preview, PNG export, and SVG export.
- **[2026-04-15] Dropdown Menus Added Scroll-Aware Edge Fades**:
    - Reworked the custom-select menu shell so scrolling now happens inside a dedicated viewport rather than on the outer bordered container.
    - Added intelligent top and bottom gradient blur fades that appear only when additional dropdown options exist above or below the current scroll position.
    - Kept the grouped `UNDER CONSTRUCTION` style section compatible with the new viewport and fade treatment so long menus feel intentional instead of abruptly clipped.
- **[2026-04-15] Style Selector Grouped Experimental Modes And Removed Matrix**:
    - Removed the `MATRIX` bar style from the public generator UI and from the active style-selection logic so it no longer appears in the main dropdown or resolves as a selectable mode.
    - Added an `UNDER CONSTRUCTION` section to the custom `BAR STYLE` dropdown and moved `MUSIC`, `DATA GRAPH`, and `TRUSS` beneath the standard production-ready styles.
    - Updated the custom-select renderer to preserve grouped dropdown headings in the styled menu rather than flattening all `<option>` entries into one undifferentiated list.
- **[2026-04-15] Header Controls Refined To Match Workspace Chrome**:
    - Tightened the main header action cluster so the `Download Asset` button and sidebar toggle now share the same bordered control treatment, spacing rhythm, and restrained hover behavior.
    - Reduced the visual weight of the sidebar toggle icon while preserving a comfortable tap target, helping the right-side controls sit more naturally against the live header logo lockup.
    - Added an explicit expanded/collapsed visual state and matching accessible label updates for the sidebar toggle so the header control accurately reflects whether the design-controls panel is open on both desktop and mobile.
- **[2026-04-14] Color Theme System Normalized Around Exported Mark Color**:
    - Reworked the generator theme model so the selected color theme name now refers to the actual exported RPI mark color first, with the UI family indicated in the visible dropdown labels.
    - Split the themes into consistent light-UI and dark-UI families so high-value light marks such as White, Silver, and Gray render on supportive dark workspace surfaces, while Black, Red, Blue, and Gold use lighter interface treatments.
    - Removed the visible `INVERTED` option from the current theme selector and kept legacy query-string values compatible by normalizing old color-mode aliases onto the new theme names.
    - Introduced shared semantic UI tokens for headers, controls, hover states, sliders, toggles, menus, and workspace chrome so each theme applies color with the same interaction logic instead of bespoke per-component overrides.
    - Simplified the visible theme labels back down to the exported mark color names only, and tightened dark-theme contrast for custom dropdown lists, slider values, slider thumbs, and the bottom workspace controls.
    - Fixed a custom-select synchronization bug where the color-theme trigger text and selected row could remain stuck on the initial option even after the active theme had changed, and moved floating control surfaces onto explicit per-theme tokens.
    - Gave the `SILVER` and `GRAY` header action controls slightly stronger surface and border contrast so the download button and menu toggle stay visible against their light metallic headers without changing the broader theme balance.
    - Made slider hover color an explicit theme token so the thumb now shifts to the active theme-appropriate mark color on hover instead of depending on a generic fallback.
    - Set the remaining non-white themes to explicit per-theme slider hover colors as well, avoiding browser-specific fallback behavior that could keep the hover thumb red outside the white theme.
- **[2026-04-14] Marquee Loop Rebuilt For Seamless Wrap**:
    - Reworked `marquee-ui.html`'s diagonal bar scene around individual repeated asset slots in each row, replacing the earlier grouped-segment seam logic with a slot-based layout that wraps across a full repeated pattern span so the visible bars keep their identities while moving.
    - Slowed the baseline marquee motion, clipped each diagonal lane to its own rotated row box to stop neighboring bars from bleeding across rows, and eased row hover slowdown through continuous velocity changes in the frame loop instead of snapping.
    - Added per-bar hover and press states so the active SVG now lifts on hover, glows red while pressed, darkens only during the press-hold state, and returns to normal on release.
    - Grouped the RPI logo, title, and RCOS credit into a shared hero cluster so the experimental poster layout scales proportionally as a unit on narrower desktop widths.
- **[2026-04-14] Header Brand Mirrored To Active Bar Logo**:
    - Replaced the static text `RPI` in the main header with a live mini SVG preview of the current generated RPI mark so the header reflects the active style, parameters, and color mode.
    - Updated the header title copy from `LOGO GENERATOR` to `THE BAR GENERATOR`.
    - Added lightweight preview refresh logic so animated bar styles in the main workspace stay reasonably in sync in the header without introducing a second full canvas.
    - Split header contrast styling away from theme accent fills so the mini mark and header controls remain visible when the active theme color is also used as the header background.
    - Applied that same colored-header treatment to the red theme so it now uses RPI Red in the header while preserving readable header controls through the shared contrast-layer tokens.
- **[2026-04-14] Expanded Main Generator Color Themes**:
    - Renamed the main sidebar controls to `BAR STYLE` and `COLOR THEME` for clearer wording in the generator UI.
    - Added new RPI brand color themes for Silver, Gray, Blue, and Gold, including matching rendered wordmark/bar colors in the main canvas.
    - Extended the interface theming system so each color mode now carries through the header, sidebar, page background, borders, inputs, buttons, dropdown states, and other accent surfaces instead of recoloring only part of the UI.
    - Removed the separate canvas backdrop so the RPI mark now sits directly on the workspace theme background instead of on a white block.
    - This earlier expansion was later normalized into the exported-mark-first theme model above, so `BLACK / LIGHT UI` and `WHITE / DARK UI` now replace the older light/dark naming while keeping legacy URLs compatible.
- **[2026-04-14] Main Generator Sidebar Moved To Right Edge**:
    - Updated the primary `index.html` workspace layout so the design-controls sidebar now anchors to the right side of the canvas on desktop.
    - Mirrored the mobile off-canvas behavior so the sidebar also slides in from the right instead of the left.
    - Kept the existing sidebar toggle behavior and control structure unchanged while aligning the main workspace chrome with the new placement.
- **[2026-04-14] Marquee Hover Reworked As Directional SVG Smear**:
    - Replaced the circular screen-space lens experiment in `marquee-ui.html` with a hover effect that acts directly on the moving bar SVG assets.
    - Each hovered bar now renders layered blurred ghost copies that are pulled toward the cursor, creating a directional smear closer to the provided morphing reference.
    - Kept the original SVG base visible and brand-faithful so the distortion reads as an additive deformation instead of fading the bar away.
- **[2026-04-14] Startup Style Prompt Added**:
    - Added a delayed startup prompt to `marquee-ui.html` that appears 5 seconds after load in the experimental marquee concept page.
    - Matched the prompt to the provided visual reference with a blurred black glass surface, official RPI red border, and red drop-shadow glow while keeping all text in the local `RPIGeist` family.
    - Kept the prompt visible until the user clicks a marquee bar asset to make a selection, so the onboarding cue does not disappear on its own.
- **[2026-04-14] Marquee Bar Hover Effect Added**:
    - Updated `marquee-ui.html`'s animated bar scene so hover interaction applies only to the moving bar assets, not to the title or credit copy.
    - Rebuilt each marquee asset as a layered wrapper with a masked blurred clone to create a cursor-local "blur near hover, sharp elsewhere" effect inspired by the experimental shader reference.
    - Kept the underlying SVG bars brand-faithful by reusing the existing official bar references rather than replacing them with new generative geometry.
- **[2026-04-14] Marquee UI Experiment Started**:
    - Created a standalone experimental page at `marquee-ui.html` so marquee exploration does not disturb the current generator interface.
    - Added a dedicated stylesheet and script for the poster-style concept layout using official RPI and RCOS assets.
    - Reused the existing reference bar SVG components in alternating marquee rows to match the diagonal motion study from the provided design reference.
- **[2026-02-17] Stability Pass In Progress**:
    - Fixed ticker width ratio label binding bug in `main.js` (`#ticker-width-ratio-display` now updates correctly).
    - Consolidated SVG bar pattern export logic into shared utility `js/utils/barPattern.js` to prevent drift between files.
    - Added waveform and circles SVG export parity in the shared generator (including circles grid/packing and fill/stroke variants).
    - Added regression tests for shared SVG bar generation and ticker width ratio display behavior.
- **[2026-02-12] Phase 2 Completed**:
    - Implemented Toast notification system for better UX.
    - Added "Copy Embed Code" feature for Frontify integration.
    - Fixed WebGL context handling and memory leaks.
    - Set up Jest testing framework.
    - Created Frontify integration strategy document.

### October 28 selector refinement

- Bar style menus now offer up to 35rem of choices, bounded to the viewport and sidebar scroll area. Short menus flip upward when needed. Names stay left aligned with still SVG family samples in a right column; direction options use matching right-hand arrows. Touch users receive the same visual selectors with 48px rows. Other selectors retain their native touch picker.
- Samples use default family parameters and shared bar export geometry, a frozen packing sample, and the existing Artemis source as a mask. They describe a family rather than the active settings or live motion. Unfinished styles retain disabled Coming soon hints and have no misleading preview.
- Triangles now expose direction and count only. Old variant-2 query/share state migrates to the opposite direction to preserve the image; new captures, canonical URLs and filenames omit variant. Low-level historical complementary geometry is retained. Reset/Randomize cover the remaining controls.
- Validation: 305 unit tests; selector, touch, legacy-link and SVG/PNG checks plus integrated triangle/header/raster/share comparisons in Chromium and WebKit. Browser evidence does not establish formal brand approval or physical Safari/device accessibility validation.

### October 28 Quantum phase transport repair

- Phase changes now retain the explicit LOOP selection. Running playback continues from the selected phase; paused playback remains paused. Native pointer drags and the numeric editor temporarily hold model time, then resume with a fresh timestamp and no catch-up. Keyboard range input rebases the frame timestamp. Explicit pause/play, reduced-motion pause, static defaults and paused query/share restoration remain intact.
- The change is confined to Quantum control transport. Its analytic model, speed bounds, reverse evolution, fixed spatial/amplitude scales and static SVG/PNG snapshot geometry are unchanged. See [Quantum controls and model](quantum_model.md).
- Validation: 312 unit tests passed in 31 suites, including seven focused transport regressions. WebKit completed active/paused seeks, keyboard, pointer, 320/390px touch-layout interaction, reduced motion, paused legacy sharing and deterministic SVG/PNG snapshots. Chromium passed the desktop seek/share/export checks but its full run intermittently stalled during routed startup; a touch-layout run reported `GeneratorInitialState is not defined` before controls initialized. This separate startup issue is handed to platform/integration work. Browser emulation does not establish physical-device or formal brand approval.

### Bar information cards — October 28, 2026

- Added one standardized information card above the problem-report button for all 21 available styles, including Organizations and Special. Each explanation has two sentences and approximately 40 words, grounded in the implemented system and RPI voice records.
- Mission Control's existing BOROMIR/Maeve Marshall surface credit now appears within that same card. No duplicate card, invented Union affiliation, telemetry claim or new approval is introduced. Quantum explains projections of the actual ring model.
- Copy inventory and source/approval limits: [bar information cards](bar_information_cards.md). Rendering/export math and motion behavior are unchanged. Validation: 305 unit tests pass; focused Chromium/WebKit checks pass for all styles, four themes, 320/390/768px layouts, motion preferences and credit focus. Desktop and 320px screenshots were visually inspected. Local static-file fulfillment avoids test-server socket resets; audio playback, physical devices and formal RPI approval remain outside this check.

## Inspection zoom GPU limit — October 28, 2026

- Fixed a shared static-bar failure where zoom × fitted scale × device pixel ratio requested an SVG raster wider than `MAX_TEXTURE_SIZE`. The failed WebGL upload sampled as an opaque black rectangle. The live snapshot now rounds the active GPU limit down to a multiple of 125, retaining integer 125:9 raster dimensions and the unchanged 250 × 18 design frame. Cached oversized images cannot be used as a pending-preview fallback.
- The vulnerable path covers Solid, Binary, Circles, Numeric, Morse, Circles Gradient, Gradient, Grid, Lines, Point Connect, Neural Network, Triangle Grid, Triangles, Fibonacci Sequence, Union and Runway. Solid's intended fill can conceal the symptom. Ruler, Ticker, Waveform and Quantum use immediate geometry; Artemis uses its DOM SVG overlay and bypasses this texture path.
- Reproduced Triangle Grid on published `3814997`: at 1920 × 1200 / DPR 3, Chromium rejected 8,875 px at 200% against its 8,192 px GPU limit; WebKit rejected 17,625 px at 400% against 16,384 px. The same cases render the pattern after the fix with no WebGL error. A baseline Chromium audit also reproduces error 1281 on Grid and Lines with 9,875 px requests against 8,192 px; Ruler remains error-free at the same viewport and zoom. The limit affects live sampling sharpness at extreme zoom only; scientific coordinates, bar clipping, header vectors and export transforms remain unchanged.
- Validation: 311 unit tests in 31 suites; Chromium and WebKit zoom pixel checks across 20 canvas-rendered styles and seven themes, repeated Fit–400% cycles, buttons, typed percentages and wheel; small-screen Triangle Grid inspection and 2D fallback; existing actual-touch regression. Triangle Grid SVG/header/transparent PNG output is byte-identical at Fit and 400% in both engines (1160 × 762 PNG). See `scripts/zoomSmoke.js`. Physical Safari/device, screen-reader and formal owner/brand approval are separate checks.

## 6. Design Decisions
*   **Profanity Filter:** Implemented client-side for immediate feedback and user privacy. Unicode folding and a documented list improve coverage, but this is best-effort moderation rather than a guarantee.
*   **Renderer Dependency:** An unchanged, licensed p5.js 1.7.0 build is served locally so generator boot is independent of cdnjs.
*   **Browser Regression Check:** Playwright smoke scripts run locally for relevant changes; the unit suite is the only automated merge check. The site's vanilla runtime stack is unchanged.
*   **Font Format:** Chosen `.woff2` for optimal web performance.
*   **Global Access:** `ProfanityFilter` attached to `window` for p5.js compatibility.
*   **Frontify Integration:** Chosen external iframe embedding as the initial integration strategy for simplicity and speed.
*   **Export Consistency:** Introduced shared SVG bar pattern generator (`js/utils/barPattern.js`) as single source of truth for non-solid bar exports.

## 7. Known Issues / Notes
*   Official complete-vector geometry is integrated across preview, header and exports, with a 250-unit basis, 18-unit bar height and fixed 21-unit gap. See [geometry](bar_geometry.md) and [integration verification](integration_qa.md) for the measured coverage and remaining manual-review limits.
*   October 27 brand-site review: the Pattern page excludes gradients and complex imagery as pattern elements. Existing gradient and Artemis artwork treatments need RPI owner review. Student-club and official-library approvals are separate, and free font use does not establish public redistribution rights. See the dated source checklist in references/rpi_brand_guidelines.md. No new permission or brand approval was inferred.

*   The client-side text filter covers more offensive content and Unicode variants but cannot guarantee detection of every evasion or avoid every false positive. A formal owner-approved content policy is still needed.
*   Manual screen-reader, physical mobile-device, 200%/400% browser zoom, Safari application, low-power performance, and brand approval checks remain before claiming full accessibility or brand compliance. Firefox passed headless Linux CI but could not be launched locally on this Mac.
*   `main.js` relies heavily on global variables (p5.js pattern). Future refactoring might consider modularizing this.
*   Previously identified issue where ticker width ratio display failed to update has been resolved (2026-02-17).
*   Previously identified SVG export drift between `main.js` and `drawing.js` has been addressed by shared utility (2026-02-17).

### Circle bounds and alignment repair — October 28, 2026

- Circles Gradient rows now share column centers, removing variant 1's leaning columns while preserving row sizes and complete dot bounds. The largest endpoint dots meet the bar edges; smaller endpoint dots remain aligned inside them.
- Circles now treats packed radii as outer painted extents and insets stroked paths by half their stroke width. Every complete circle is geometrically bounded before clipping, with exact tangent endpoint circles and no horizontal stretching. Moving formerly overflowing circles inward can introduce minor overlaps; this remains an illustrative geometric pattern. See [circle assumptions](bar_science_notes.md#circle-containment-repair--october-28-2026).
- Validation: 326 unit tests passed in 33 suites. Chromium and WebKit each passed 22 selected states (all three gradient variants; Circles density 10/100 × variation 0/100 × fill/stroke, black/white), checking pre-clip primitive bounds, no circle stretch, actual SVG/header geometry, downloaded PNG parity, painted edges, preview interior agreement, and byte-identical SVG/PNG at Fit versus 400%. Both engines also passed 390px touch-layout rendering at Fit/400% with stable snapshots and no page errors. Desktop and phone preview screenshots were visually inspected; exported PNG pixels were checked automatically. This is browser emulation, not physical-device or formal brand approval.

## Numeric Values / Formula sources — October 28, 2026

- Implemented Numeric's mutually exclusive decimal entry and curated formula dropdown on an isolated branch from published main `ab23e3a`. Decimal input retains leading zeros/precision, rejects invalid edits as a whole, permits normal incomplete drafts, and explicitly omits signs from encoding. Empty drafts no longer silently render π. The existing encodings, geometry and zero-ink export recovery remain intact.
- Added eight fixed examples: π, e, φ, √2, √3, 2π, sine RMS/peak `1/√2`, and exponential half-life/time-constant `ln(2)`. Descriptions explain their assumptions and show exact encoded decimal approximations. They are not a popularity ranking or official RPI endorsements. Reset/Randomize and inactive-source retention use the existing control system.
- Replaced the Function-constructor evaluator with fixed presets and a bounded non-executing arithmetic parser used only for historical-link migration. New query/share controls restore modes and inactive values intentionally; new explicit-source shares reject invalid values. Unsupported/oversized historical expressions recover as empty input with guidance. One resolved source drives preview/header and frozen SVG/PNG snapshots. New utility loads before routed first-paint/share parsing; updated asset versions keep those dependencies together for returning visitors. The app retains vanilla/p5 global-state integration and the existing browser/CommonJS utility convention.
- Validation: 326 unit tests in 34 suites, then 41 focused tests after final cleanup; Chromium/WebKit checked eight presets × two encodings, actual SVG/PNG pixel parity and share restoration, source switching, Reset/Randomize, drafts/bad input, legacy query/share migration and desktop/native touch controls at 390/320px. Twelve Chromium routed-startup checks passed with normal/reduced motion and Retry recovery. See [Numeric design, sources and migration](numeric_modes.md) and [QA evidence](review-images/numeric-modes/validation.md). Physical-device/clipboard/keyboard, manual screen-reader, Safari application and formal brand approval remain unverified. This entry records local implementation, not publication.

### Quantum category — October 28, 2026

Quantum now appears once under Dynamic, immediately after Waveform, in the native bar-style selector and its generated custom menu. The `wave-quantum` route, shader/model identity, phase/loop controls, preview and share keys are unchanged. Category grouping is authored by the selector’s optgroups; the landing marquee has no separate Quantum category entry. Combined selector checks cover the unique entry and still preview.

Numeric integration also guards historical aliases with own-property checks. Prototype names such as `constructor` previously entered Formula mode and fell back to Pi; they now recover as empty Values without executing text or substituting data. Unit and browser legacy-query/share cases cover this integration repair.

### Sticky grouped dropdown headings — October 28, 2026

- Grouped dropdowns now retain their section heading while scrolling, with the next section naturally pushing the previous heading away. The shared enhancement covers Color Theme (Primary/Secondary), Bar Style (Dynamic/Static/Organizations/Special/Under Construction), and future native optgroups. Each section has a named ARIA group; ungrouped menus retain their existing structure.
- Headers use an opaque menu-surface backing and reserve scroll space so arrow-key navigation does not hide the active option behind them. The upper fade is suppressed for grouped menus; the lower fade, previews, arrows, disabled Coming soon hints, selection, guidance popover and native touch color picker are retained. No bar geometry or export calculations changed.
- Validation: all 321 unit tests pass. `scripts/stickyDropdownSmoke.js` checks section push/return, eight theme surfaces, every style section, previews, keyboard visibility, disabled choices, repeated open/close, constrained dropdowns, narrow/short windows and native touch fallback. The focused sticky suite passes in Chromium/WebKit. The existing color-picker smoke also passes in both engines, including legacy query/share/SVG checks; the full selector suite passes in both engines, including 21 previews, direction arrows, 320/390px touch interaction, legacy links and SVG/PNG exports. Chromium was rerun serially after an interrupted concurrent run. Browser screenshots were visually inspected; this does not establish physical-device, screen-reader or formal brand approval.
- Resolved the short-window followup: the pinned information-card footer could intercept the theme trigger after switching to Artemis II at 1024 × 360. At viewport heights up to 40rem (640 CSS px), the intact footer now flows through the same sidebar scroller as the controls; larger desktop layouts retain the pinned footer. No controls or card content are hidden. Focused short-layout evidence is captured by `scripts/shortSidebarSmoke.js` for Artemis II, Circles, Quantum and Solid at 1024 × 360, 1280 × 500 and 320 × 568, including pointer/keyboard selection, scrolling both directions, the complete information card and report action. These focused short-layout checks pass in Chromium and WebKit, and the 1024 × 360 control/card screenshots were visually checked.

## Neural Network redesign — October 28, 2026

Replaced the clipped illustrative graph with an explicit untrained feedforward
network. Six controls cover hidden layers, units per layer, dense/local
connectivity, tanh/sigmoid activation, input mix and deterministic weight sets.
The three-hidden-layer default balances the narrow bar; explicit legacy layer
settings remain supported. Each unit now computes its actual weighted sum and
activation. Ring-center area encodes activation, line width encodes weight
magnitude and dashes encode negative weights without depending on color.
The sidebar includes numeric outputs and an optional model explanation/source.
There is no training, biological simulation, animated inference or GIF mode.

Complete node rings include their stroke in the vertical padding and horizontal
edge placement, fixing cutoff while retaining the official 250 × 18 domain,
132.4885 offset and existing painted-edge rule. Shared geometry/values feed
preview, header, SVG and PNG. Query/share links, native controls, numeric editors,
Reset and Randomize cover every parameter. No runtime dependency, asset, framework,
font, theme or permission change. See [model and sources](neural_network_model.md)
and [review evidence](review-images/neural-network/validation.md).

Validation: 329 unit tests in 34 suites, including forward-pass equations,
determinism, sparse/dense weight identity, connectedness, activation area and 320
parameter combinations with complete node/stroke bounds. Focused Chromium and
WebKit checks pass 28 theme/extrema/header-raster cases per engine, shared and
plain-query round trips including zero input, old shared links, numeric editor,
keyboard and real emulated touch interaction, Reset/Randomize, motion preference,
Fit–400% export stability and 2D fallback. Decoded Standard PNG is 1160 × 762;
its bar paints x=80…1079 with no paint outside the official bar domain. Fit and
400% PNG bytes are identical. Source primitives agree; live SVG-raster sampling
versus direct header rasterization differs by at most 3.624/255 mean alpha in the
bar, due to fractional bar placement and thin-stroke sampling, rather than a
geometry or model change.

Implementation is saved locally on `codex/feat-neural-network`, based on published
`ab23e3a`, with unrelated local-main ancestry and concurrent feature branches
preserved. No merge or deployment is included. Physical devices, Safari app,
screen readers, final-size owner acceptance and formal RPI approval remain
unverified; secondary themes were exercised only for legacy-state compatibility.


## Numeric character limit — November 3, 2026

Numeric now accepts at most 100 total characters in its field, decimal validation and query/share restore. This is the exact Dot Matrix circle threshold: `250 / 100 - 1 = 1.5` units wide, matching the existing 1.5-unit dot height. Shorter entries retain their horizontal stretching; 101 encoded columns would be narrower than a circle. The sign is unencoded but counts toward the input limit. The π default and export fallback now retain its first 100 characters, and Reset uses the shared default. Historical over-limit decimals are not rounded into shorter replacement values. Rendering geometry, the two encoding modes, formula presets and official logo geometry are unchanged.

Integrated-release verification passed all 536 unit tests in 47 suites and `scripts/numericLimitSmoke.js` in Chromium and WebKit. Browser coverage includes 24/99/100-column geometry, typing/inserted-text limits, synthetic-input rejection, exact 100-character historical snapshot restoration, over-limit current/legacy URLs, Reset, actual downloaded SVG/PNG pixel parity and a 390px touch layout. Desktop and touch screenshots were inspected. Route shells and changed runtime files use a new cache version. Broader browser aggregate suites were not rerun for this narrow change; physical devices, owner acceptance and formal RPI approval remain separate. See [Numeric threshold details](numeric_modes.md#circle-threshold--november-3-2026).

## November 11 menu and dialog consistency audit

Secondary Color Usage and Keyboard shortcuts now inherit one modal shell:
shared theme surface/border/corners, width, padding, heading size, dark unblurred
backdrop and text Close action. The shortcut guide opens at its heading, resets
scroll position and guards backdrop drags and stale close events. Three-dot
menus share selector surface tokens; larger-control text and reduced-motion
coverage include both guides. The retained report form shares the header/chrome
while keeping its narrower form layout; the live GitHub reporting flow is unchanged.

The audit distinguishes native modal guides, anchored export/listbox menus,
inline disclosures, tooltips and the full-screen Easter egg instead of flattening
them into one interaction. Export geometry, official palette, bar generation,
audio and the custom theme rows are unchanged. See
[the inventory and QA limits](menu_consistency_audit.md).

Validation: 1,137 tests across 97 suites pass; helper/smoke syntax and whitespace
checks pass. Rendered browser, native keyboard/touch, zoom and Safari checks remain
unverified under the existing browser restriction. A reusable four-viewport,
three-theme smoke check is included for a permitted browser environment.
