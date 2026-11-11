# Color Theme helper spacing

November 11, 2026. Branch `codex/fix-color-help-spacing`, initial main
`c09f9b8ad2bacd4474a08d3e8dc2d4af9f7af790` (#191). This base already includes
copy audit #187 and approved menu presentation #184; neither PR is merged by
this task. Reconciled with main `b068d58f10eb9034d0c4afe328b69359abb83679`
(Waveform LFO removal #193), preserving its complete runtime, copy and delivery
changes. Prior feature branches are preserved.

## Source diagnosis and minimal correction

The helper is a sibling below the color select wrapper, inside a normal block
control. The control has no internal flex/grid gap. Its original button adds
`--control-label-gap` above a 44px target and vertically centers an 18px line box.
At a 16px root this puts the line box 8 + (44 - 18)/2 = 21px below the dropdown.
Large mode raises that to 10 + (48 - 21)/2 = 23.5px through the larger label-gap,
font and target overrides. These are source-derived box calculations, not browser
pixel measurements of the glyphs.

The button now has zero top margin, aligns its child at flex-start and uses the
existing 0.375rem hint-gap token as top padding (6px at a 16px root). The line box
therefore starts 6px below the select in both modes. Actual glyph ink depends on
font metrics. The transparent remainder stays below the text to retain the
44/48px hit area. No negative margin, positioning, transformed target or pointer
event change overlaps the dropdown. The label's existing 2px outline plus 3px
offset fits below the select with that padding.

The large-controls sheet had a higher-specificity generic focus rule restoring
a rectangle around the entire transparent helper. A helper-only exception now
leaves the existing red label outline in charge. All other large-control button
focus rules remain. Font sizes/line heights, underlined red sentence-case text,
secondary-only visibility and modal lifecycle are untouched.

## Preservation and verification

The current copy audit's generator text, Home startup and barInformation.js are
preserved byte-for-byte except delivery cache URLs. The helper/controller markup,
modal contents, selector behavior, approved palettes, real render/export/GIF/audio
and dice logic are unchanged. CSS changes are confined to three helper declarations
and one large-mode focus exception. Both CSS keys, every route's shell/bootstrap,
bootstrap fallback and Home prefetch advance together.

All 31 focused secondary-guidance, large-control, theme, shell-cache, About and Waveform retirement
checks pass in six suites. Changed JavaScript and all 81 inline scripts parse;
exact source and synchronized stylesheet/shell cache checks pass. No
implementation-mirroring unit-test count expansion is added. The optional
browser harness now checks standard and large mode on desktop/mobile: 44/48px
minimum target, compact line-box gap, no target/dropdown overlap, tight focus and
hit-testing within the top padding returning the helper rather than the select.
It retains actual modal opening/dismissal and selected/secondary behavior checks.
The harness is syntax-checked only under existing browser restrictions.

No rendered application, native touch/focus, screen-reader or served-file hash
pass is claimed. No previously denied/cancelled browser/network route is retried.
CI, matching reviewed/merged tree and Pages deployment are verified separately.
Owner checks: standard/large controls at desktop and phone widths, visible gap,
focus outline, tapping above/below the text, dropdown selection and modal reopen.
