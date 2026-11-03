# Sidebar and parameter-action verification

October 28, 2026. Cloud continuation from checkpoint `3c52684`, using Node 22 and
real localhost HTTP with the repository's unchanged Playwright 1.62.1 dependency.
Cloud browser setup selects an official pinned browser executable through the
supported `executablePath` option; no test-response fulfillment or added security-bypass flags are used. No new
production dependency or user-computer operation is involved.

## Changes and default semantics

- Desktop sidebar: 22rem. Its export trigger/panel use a shared usable-width token.
  Compact headers keep their original small/icon trigger and a viewport-bounded
  export panel; the portrait sheet does not supply a landscape rail width to it.
  The independent Share popover is not resized.
- Sixteen configurable families expose meaningful Randomize/Reset. Solid,
  Fibonacci Sequence, Union, Runway and Artemis II have no parameter actions.
  Disabled construction and prototype-property names cannot invoke side effects.
- Reset compares authored defaults, excluding LOOP preferences. Circles includes
  its seed; Quantum compares recurrence-equivalent phases. Binary/Morse author
  RPI defaults, and Circles starts/resets at seed 1. Explicit shared seeds remain
  intact; ordinary query restoration returns to canonical seed 1.
- Randomize changes a relevant parameter, preserving Numeric source/encoding and
  inactive data, Neural deterministic weight identity, and all LOOP choices.
  Shared/history restoration and actions refresh visible labels/default state.
  Running Quantum refreshes only its own Reset without per-frame URL writes.
- Escape dismisses the export panel both inside it and from its opening trigger,
  restoring trigger focus. The former menu-only handler missed trigger focus.

## Automated evidence

`npm test -- --runInBand` passes 394 tests in 36 suites. New cases exercise actual
runtime action callbacks against authored HTML fields, all direct parameter edits,
repeated actions, both Numeric encodings/inactive sources, real Neural control
setters, LOOP choices, Circles seed/RNG boundaries, Quantum recurrence equivalence,
complete restoration callbacks and routed utility-cache agreement. Quantum's
running tick and export Escape behavior have focused regression tests.

The Chromium action phase passed all 21 routed action inventories; all 16
configurable families' repeated Randomize/Reset, same-page shared-state and exact
SVG restoration; actual SVG and Standard 1160 × 762 PNG downloads; keyboard action
focus; both Numeric encodings; and 42 repeated same-page style switches. Its next
layout assertion found the export-trigger Escape gap, which was repaired with
unit tests and rechecked in the layout phase. Seven ordinary desktop theme
width/bounds checks subsequently passed; the Lunar panel exposed an inherited
340px minimum overriding the shared width, repaired only for the export/credits
panel rather than the separate Share popup.

The corrected Chromium layout phase passed all eight themes, five fine-pointer
viewports (901 × 640, 1024 × 360, 1280 × 500, 768 × 1024 and 320 × 568), and three
actual emulated-touch viewports (320 × 568, 390 × 844 and 844 × 390). Each touch
viewport switched through all 21 families and exercised meaningful actions.
Open-menu bounds, Escape dismissal and label/default agreement passed. The
corrected Quantum-only resume also passed visible-switch activation, running
Reset availability, resetting phase/speed/reverse while preserving LOOP, resumed
progress and exact paused Reset/pristine state. An earlier fixture targeted the
intentionally zero-size native checkbox; another incorrectly required exact zero
while playback remained active. Both fixtures were corrected without changing the
model or transport. Preserved playback can advance during synchronous redraws;
exact zero/pristine is asserted after pausing, rather than treating normal elapsed
time as a stale-clock bug.

These are scoped Chromium phases, not a claim that one uninterrupted final full
script or a feature-specific WebKit matrix ran. Changes after the action/export
phase were confined to menu dismissal, Lunar panel sizing and test fixtures; the
affected menu/layout and Quantum behavior was rechecked afterward.

Visually inspected temporary captures in `/tmp/sidebar-actions-chromium` show
aligned/readable light (`menu-1.png`), dark (`menu-2.png`) and Mission Control
(`menu-8.png`) panels; viewport-bounded portrait (`menu-14.png`) and landscape
(`menu-16.png`) export menus; and intact phone (`touch-320x568.png`), landscape
(`touch-844x390.png`) and short-window (`fine-1024x360.png`) controls. Original
screenshots remain temporary review evidence rather than new repository assets.
Secondary themes were checked only for historical-state compatibility, not new
selection availability or brand approval.

The focused script supports bounded `RPI_ACTIONS_PHASE=layout` and `quantum`
resumes, retaining unchanged expensive phases as separate evidence; the default
command runs the complete matrix:

```sh
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/sidebarActionsSmoke.js
```

The feature-specific WebKit matrix was not rerun in this cloud pass. Physical
devices, native OS-picker behavior, screen-reader announcements, the
Safari application, high-refresh/low-power judgment, user acceptance and formal
RPI/asset approval remain separate. No push, merge or deployment is included.
