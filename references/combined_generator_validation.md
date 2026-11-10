# Combined generator review — November 10, 2026

## Scope and provenance

Integration worktree: `/workspace/scratch/83f166ead34c/the-bar-generator-integration`.
Branch: `codex/feat-combined-generator-candidate`; base `0654f5d`.
The original source worktrees and branches are preserved.

| Source | Exact provenance | Integration |
| --- | --- | --- |
| Static Home marquee | PR #132 head `63a438216b66e1e922ca816d5f5e94dea83048d8`; local `468ee0e75d45f4e960ba5c04dd14df71d19d5905`; identical tree `05f59e38602f921d71afbb0a2e2020260454c1a6` | 450ms prompt, no separate Enter button, native sample links, 50% neighboring opacity, no lift/splitting or internal preview animation |
| Generator entrance | `fcd812fc6395554ff5db2efb1a03318b4d964d27` | Canonical aligned first-frame ASCII, frozen transform/resize cancellation |
| Sidebar | Uncommitted `codex/fix-sidebar-bottom-fade`, base `0654f5d` | Bounded passive 4.5rem overflow fade |
| Gradient | Uncommitted `codex/feat-dynamic-gradient`, base `0654f5d` | Shared live/header/GIF motion, controls, resting static exports and Home samples |
| Speed/icon | Uncommitted `codex/fix-animation-speed-randomize-icon`, base `0654f5d` | Reworked as 0.2–4× relative SPEED, original stored rates; retained licensed shuffle at 18px instead of reset-like refresh-cw |
| Waveform LFO | Uncommitted `codex/feat-waveform-visual-lfo`, base `0654f5d`; supplied `visual-lfo.patch` | Shared audio/visual amplitude, continuous waveform folds, logarithmic 0.07–1300Hz, sampling average |

Raw source diffs, source hashes and test logs are retained outside the repository
at `/workspace/scratch/83f166ead34c/generator-integration-evidence`.
Cache references for changed runtime/styles, fetched shell and route bootstrap
share `20261110-combined-brand-refinement`; unchanged assets retain their
existing versions. No framework, dependency, waveform frequency claim, official
logo geometry or profanity-filter policy changed. `main.js` retains the existing
p5 global-state bridges; multiplier logic is isolated in `motionSpeed.js`.

## Reconciliation and interaction repairs

- Three-way content merges preserve all main/drawing changes; export snapshots
  reset Gradient phase and capture resting LFO amplitude together.
- Waveform LFO settings cannot change Gradient or Ticker GIF planning.
- Joint Waveform carrier/LFO loops use exact stored rates, bounded to 100 seconds
  and 3000 frames. Longer joint cycles and rates at/above 5Hz use the LFO mean
  over one carrier cycle. This bounds capture cost and avoids a nonclosing seam.
- Shared/query state continues storing actual rates; all formerly valid rates
  retain their value. The separate LFO rate remains Hz. Reset/Randomize/Undo,
  numeric entry, keyboard steps, shared phases and reduced motion retain their
  respective transport policies.
- Routed startup explicitly preloads the head-only speed helper before main
  setup; a source contract regression guards its bootstrap dependency.
- The existing pinned Feather shuffle symbol stays distinct from Reset's arrow;
  no new third-party asset or license record is required.

## Completed validation

`npm test -- --runInBand --no-cache`: **833 tests in 77 suites passed** on cloud
Node 24.22.1. Regressions exercise actual controls/model functions, first-frame
transform capture, static marquee/catalog parity, shared rate migration,
keyboard/editor multipliers, preserved default rates, bounded LFO joint cycles,
geometry containment, amplitude/transport handoffs and GIF rectangle rendering.
Final source checks pass: 50 changed/new JavaScript files parse, all 84 HTML
inline scripts compile, 343 local script/stylesheet references resolve, changed
resource cache versions agree, and `git diff --check` is clean. Source hashes
confirm all six source candidates remain untouched. This static application has
no configured lint, typecheck or build command.

## Browser limits and remaining review

No rendered browser, native audio or real downloaded export pass is claimed.
Previously established blockers remain: Chromium Unix socket creation is denied,
WebKit lacks required Linux libraries, and the managed browser cannot reach the
isolated localhost server. Browser escalation was explicitly denied and has not
been retried or bypassed. Pure unit tests and source checks do not establish
visual acceptance, physical-device behavior, accessibility certification or
formal RPI approval. The user authorized publication and will test production.

Prepared harnesses: `marqueeStaticSmoke.js`, `generatorEntranceSmoke.js`,
`sidebarScrollCueSmoke.js`, `gradientMotionSmoke.js`, `animationSpeedSmoke.js`,
`waveformVisualLfoSmoke.js` and `waveformLfoSmoke.js`. They remain unexecuted here.
Long LFO GIF cycles can still take substantial time and memory; streaming input
remains bounded, and cancellation remains available. Native audio Fourier,
real decoding/loop seams, mobile layout and exact composited entrance alignment
need testing in a usable browser. Export-composition choice and Easter egg work
are separate unfinished tasks and are excluded from this batch.

## Owner test checklist

1. Home: prompt appears quickly; bars stay still internally; hovering/focusing
   leaves one complete bar at full opacity and others at 50%; click a sample.
2. Generator: refresh several styles and resize during entry; look for aligned
   ASCII resolving directly into the final logo, with no jump or missing bar.
3. Sidebar: scroll long controls on desktop/phone in black/white/red; fade should
   be taller, allow clicks/scroll, and disappear at the end.
4. Gradient: both variants, Loop/pause/resume, Reverse, 0.2×/1×/4×, Reset,
   Randomize/Undo; Home stills stay static. Download SVG, PNG and GIF.
5. SPEED: Ticker/Waveform/Quantum/Gradient show 1× after Reset; drag, arrow keys,
   type 0.25×/2×, reload a configured URL and restore a saved link.
6. Waveform LFO: Loop with audio off, then Audio; fold Sine→Sawtooth→Square→Pulse,
   try slow Hz and 1300Hz, Depth, pause/resume, reduced motion, Reset/Undo,
   reload/share, then GIF. Fast LFO should settle visually while audio modulates.


## Reconciliation with published PR #134

The final candidate includes exact main `04194d6a4f96aeb67d0d679a24ffad758ba6610e`.
Dedicated brand utilities, controls, supplied guidance copy, modal behavior,
source records and focused tests are retained. Only HTML cache references and
additive project status required conflict resolution; main/drawing/CSS content
merged additively. Still-export LFO sampling now runs only for Waveform, so brand
and other-family exports do not acquire an unrelated LFO dependency. All 833
tests in 77 suites pass after reconciliation. The parent owns the final merge;
this revision does not claim a deployment or rendered browser pass.

Reconciliation source checks pass: 47 JavaScript files changed since the released
static-marquee base parse; all 84 inline scripts compile; 369 local runtime/style
references resolve; 11 dedicated brand files and exact selector/button/dialog
markup match #134 byte for byte; cache and whitespace checks pass.
