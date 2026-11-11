# Generator keyboard shortcuts — November 10, 2026

## Behavior and bindings

The existing three-dot menu contains Keyboard shortcuts above Why not... .
The guide uses a native modal dialog, the existing modal component, RPIGeist
fonts and current theme tokens. New CSS is scoped to the guide; no palette,
logo asset, rendering model, export geometry or dependency changes.

| Key | Action |
| --- | --- |
| N | Randomize the selected style's parameters |
| U | Undo its last randomize while Undo is available |
| E | Open the existing download options, with keyboard focus inside |
| ? | Open the shortcut guide |
| Space | Existing motion / supported audio play and pause |
| + or = / − | Preview zoom in / out |
| 0 | Fit the whole mark |
| Shift + Space | Existing seven-style quick cycle |
| Shift + Up / Down | Existing previous / next selectable color mode |

N avoids colliding with the hidden rpi1824 sequence. Undo uses the existing
button and restores workspace focus for successive keyboard variations. No
immediate download or reset shortcut is introduced. Unsupported/disabled actions
do nothing and do not consume the event.

The guide's Enable keyboard shortcuts switch disables every listed binding,
including the existing zoom/transport and shifted shortcuts. It persists under
rpi-generator-keyboard-shortcuts in localStorage; if storage is blocked, it
continues to work for the current page. The menu guide button remains available.
Native Tab, Enter, Space activation and in-control editing remain independent.

One controller excludes inputs, textareas, selects, editable content (including
inherited/empty/plaintext-only contenteditable), links, buttons, summaries and
interactive ARIA widgets. It checks the composed event path; ignores composition
lifecycle, isComposing, IME keyCode 229, key repeat, handled events and all
Ctrl/Command/Alt/AltGraph combinations; and suppresses actions while a modal,
three-dot menu, export popup or custom selector is open. It does not assume touch
devices lack external keyboards.

The native guide provides inert background, Tab containment and Escape dismissal.
Close/backdrop dismissal restores focus to the disclosure summary, or a visible
navigation control after a layout change. Its pointer interactions keep compact
Design controls open underneath for that return. Added UI has no animation.

## Engineering evidence and limits

Final candidate: 819 tests in 72 suites pass in cloud Node 24.22.1, including
37 keyboard shortcut cases. Focused checks include the actual main.js parameter
bridge and compact outside-click handler in Node VM contexts, shortcut dispatch,
composed-path typing exclusions, modifier/composition suppression, unavailable
actions, persisted/blocked preferences, guide close/focus behavior and routed
body-script loading before main.js. Existing intro, parameter, randomization,
preview, scientific-geometry and export regressions remain green.

JavaScript syntax, inline script compilation, duplicate HTML IDs and whitespace
checks pass. These are source and simulated DOM/event checks. Native dialog
focus containment, physical keyboard events and rendered appearance were not
verified in a browser. The prior browser-launch/escalation denial was respected;
no alternative executable, sandbox flags or environment bypass was attempted.
No screenshots or formal brand/owner acceptance are claimed.

## Integration

Base: main 0654f5d. Branch: codex/feat-keyboard-shortcuts.
Worktree: /workspace/scratch/83f166ead34c/the-bar-generator-keyboard-shortcuts.
Patch: /workspace/scratch/83f166ead34c/keyboard-shortcuts.patch.
Shared handoff: /workspace/scratch/83f166ead34c/keyboard-shortcuts-handoff.md.

Integrate the main.js keyboard-listener replacement plus helper functions and
small compact-modal guard without dropping other tasks' runtime changes. Add
the guide button beside the existing Why not... action; preserve its separate
intro-loader repair. The utility script belongs in the generator shell BODY
before main.js because routed pages inject body sources. Preserve both new QA
records and additive project_status.md sections. Reconcile the shell/main/CSS
cache references with the batch's consolidated revision, including route stubs
and bootstrap's shell-fetch revision. Rerun tests on the integrated tree.

No push, PR, merge or deployment is performed by this task. The integration task
01a1c5f5-dedf-7768-a55a-b247710d50f2 owns publication and deployment.

## Manual acceptance checklist

1. At desktop width, open three-dot menu by keyboard and select Keyboard
   shortcuts. Check both options, visible focus, label legibility and unchanged
   footer dimensions. Tab/Shift+Tab must stay inside the modal. Escape and Close
   must return to More options; outside click dismisses only the guide.
2. Select a parameterized style. Click the workspace, then N, U, N repeatedly;
   verify current-style randomization, one-level Undo, disabled-action behavior,
   unchanged style/color and truthful change feedback. Solid/fixed art should
   ignore unavailable actions. Try Quantum and a text-encoding style.
3. Check E, keyboard navigation in download options, and Escape back to Export.
   Verify SVG/PNG still capture the same selected bar. Check +, =, − and 0 and
   confirm browser Ctrl/Command +/−/0 remain browser zoom controls.
4. Check Space in a motion style, Quantum and Morse, then Shift+Space and
   Shift+Up/Down in the workspace. Native Space on links/buttons, text editing,
   dropdown arrows, slider keys, composition and held keys must stay intact.
   Enter rpi1824 outside controls and verify the original intro remains usable.
5. Turn shortcuts off. Dismiss/reopen the guide via the menu and reload; every
   listed shortcut should remain disabled while all on-screen controls work.
   Re-enable and repeat. Also test with storage blocked.
6. At phone width, open Design controls and guide by touch; close it and verify
   focus/Design controls remain usable. Check narrow-screen scroll and 200%
   browser text zoom, keyboard attachment, portrait/landscape and resize while
   open. Inspect black, white, red and Mission Control themes and reduced motion.

## Incremental release reconciliation

Applied source commit `9ed1adc` to current main, retaining export PR 136,
preview/header PR 137 and Why not repair PR 138. Both native guidance and
shortcut dialogs survive, with the generic open-dialog guard and the guide
guard preserved. The repaired lazy-loader is unchanged. Original worktrees and
branches remain available. Final regression: **896 tests in 79 suites pass**,
including all 37 shortcut cases (`/tmp/keyboard-release-jest.log`).
Browser/native input limitations above still apply.

## Serial publication reconciliation

Reconciled in an isolated worktree onto main `d3c3574` after PR #151.
Retained the compact About footer, theme picker, paired dice, 30 fps GIF
planning, LFO controls and all additive source/status notes. The original
shortcut candidate/worktree is untouched. Native browser, keyboard, touch and
screen-reader checks remain unverified under the existing browser restrictions.

Serial candidate validation: **963 tests in 82 suites pass**, including 37
shortcut regressions. All 81 inline scripts and changed JavaScript parse;
26 entrypoints, unique IDs, whitespace and byte preservation of sibling
parameter/theme/export/GIF runtimes pass. Rendered QA remains unverified.

After an interrupted transfer, the isolated candidate was reconciled again
with main `9f5fde7`, retaining the newer GIF edge/cadence, actual-audio LFO,
secondary logo compositions, quiet Undo and theme-row refinements. No original
worktree or existing release branch was modified.

Refreshed candidate: **990 tests in 87 suites pass**. The routed warm-cache
regression now derives current runtime versions from the actual shell and
asserts the shortcut helper is loaded. All 81 inline scripts parse; unique IDs,
whitespace and preserved theme/export/GIF runtime bytes were checked.

## November 11 final reconciliation

Main advanced to `a85b2b1` during the interrupted transfer. Retained its Larger
controls switch and assets, neutral dashed export-card schematics, Ring Wavefunction
name/GIF controls, actual-audio scope and all picker dismissal/focus fixes.
The guide remains beside both Larger controls and Why not actions. No sibling
feature is republished or reverted. The bulk transfer never produced a tree or
branch; publication now uses individually verified blobs and a SHA-only tree.

Final November 11 validation: **1111 tests in 94 suites pass**, including
keyboard, accessibility sizing, warm-cache, picker-focus, actual-audio waveform,
ring/GIF and export regressions. All 81 inline scripts and changed JavaScript
parse. Sibling sizing, schematic, dropdown, GIF and About helper bytes match
main `a85b2b1`; menu siblings, unique IDs and whitespace checks pass. Browser
rendering and physical keyboard/touch QA remain unverified for this feature.
