# Exact brand text in theme rows

November 10, 2026. Branch `codex/fix-theme-row-text-ink`, based on current main
including PRs #155–157 (`95667d766c05ebab5d38237772748373153eb86b`). Existing release branches are preserved.

The owner explicitly requested exact logo foreground/background colors for row
text on hover, selection and keyboard activity. This overrides the previous
black/white UI-label treatment, while retaining its independent contrasting
focus outline. The [official six-pair audit](secondary_pair_audit.md) remains
the composition authority. No palette or saved-key change is made.

## States and limitation

Idle rows use the default neutral menu surface/text and hide their ink mark.
Hover, selected and keyboard-active rows use the exact composition foreground
for both text and mark, with its exact background. The existing selected
checkmark remains. Keyboard activity additionally has one contrasting 2px inset
outline, independent of the text foreground; forced-colors mode keeps its system
outline. Row geometry, compact RPIGeistMono text, touch target and controller
keyboard/touch behavior are unchanged. Foreground/background switch together.

| Secondary choice | Exact text/background ratio | Ordinary small text |
| --- | ---: | --- |
| Gray on Red | 3.274 | Below 4.5:1 |
| Silver on Blue | 3.505 | Below 4.5:1 |
| Black on Gold | 9.554 | At least 4.5:1 |
| Red on Gray | 3.274 | Below 4.5:1 |
| Blue on Silver | 3.505 | Below 4.5:1 |
| Gray on Black | 12.692 | At least 4.5:1 |

The four lower-contrast small labels are an explicit owner choice, not a claim
of ordinary small-text WCAG AA compliance. Their colors are not altered or their
font enlarged. Primary Black on White/White on Black are 21:1; White on Red is
5.418:1. Every focus outline is independently checked against 4.5:1, and the
selected checkmark remains a separate non-color cue.

## Verification

The existing exact-pair/native-option/export test covers every secondary and
primary mode. The contrast regression checks the four specific below-threshold
pairs plus independent focus contrast, rather than silently requiring a different
text color. Palette, recovery, controller, export, modal, GIF and audio sources
are compared unchanged. All 950 tests in 85 suites pass; changed JavaScript and all 80 inline scripts
pass syntax checks. Source comparisons verify palette/aliases, controllers, saved
state, render/export/audio/GIF/modal code and HTML bodies remain unchanged.
All 26 entrypoints and shell/bootstrap/Home cache keys are aligned. No unit-test count expansion is added for this small correction.

The optional browser harness checks exact selected text and mark, neutral idle
rows, exact hover text, pointer exit back to neutral, keyboard preview and its
independent outline, navigation exit, selected checkmark, all primary/secondary
modes and retained touch behavior. It is updated and syntax-checked only. No
rendered application, native interaction, physical-device or screen-reader pass
is claimed under the established restrictions. The cancelled/403 live-source
route is not retried; GitHub CI/merged-tree and Pages deployment evidence are
reported separately from served-file hashes and browser rendering.

CSS/theme module keys, every routed shell/bootstrap key, the bootstrap fallback
and Home prefetch advance together to preserve PR #156's warm-cache fix. Other
current-main script keys and features remain intact.

Owner checks: compare all six pair labels/text/marks on hover, selection and
Arrow/Home/End activity; confirm idle neutrality after exit, independent focus
visibility, checkmark, scrolling and phone selection; assess the explicitly
requested small-text contrast tradeoff on actual displays.
