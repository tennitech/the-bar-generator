# Neutral theme row states

November 10, 2026. Base main: `94ee68db8e7aadfbf7ba29bc2de7dad3967dede9`.
Branch: `codex/fix-theme-row-states`; previous release branches remain preserved.

## Inspected screenshot

Owner reference `libfile_47c7cbd42144819182fecdc01a014d14` was materialized through
the current Library skill, identity applied and verified, decoded and visually
inspected before edits. The resolved Screenshot 2026-11-10 at 1.14.40 PM.png has
45,696 bytes, 662 × 658 RGBA pixels and SHA-256
`51a91b06270b05789d0ef3080e015155208fcd4aef53f7e7ba0b328703a86c5f`.
The visible current menu shows always-colored rows, selected Black on Blue with
stacked inset keylines, a checkmark, neutral group labels and a red trigger focus
ring. The owner’s accompanying instruction supersedes its idle row treatment.
The reference is local evidence and is not redistributed.

## Minimal correction

Idle rows now use the default menu surface and text tokens. Hover, selection and
keyboard-active states reveal the exact retained pairing. Selected state keeps
the original sidebar checkmark; no new marker is added. Keyboard-active rows use
one inset 2px foreground-colored outline, whose contrast is at least 4.5:1 for
all retained pairs. There are no row borders, layered shadow frames or hover
underlines competing with the menu boundary. The existing trigger focus style
and menu/scroll boundaries are retained. A forced-colors system outline remains.

Color transitions take zero time so foreground/background change together,
without contrast-losing intermediate blends. Compact RPIGeistMono uppercase type,
row spacing, groups, touch sizing, palette, labels, legacy recovery, controller
logic, modal and exports are preserved. Production changes are limited to CSS
and its entrypoint/shell cache keys.

## Validation and limits

The optional browser harness checks neutral idle rows against their menu surface,
then hover preview, pointer exit restoring neutral, keyboard preview with one
outline, navigation restoring neutral and unchanged selected pair/checkmark. It
also retains compact typography, touch, modal and scrolling checks. This harness
is syntax-checked only, not run under the known browser restrictions.

All 926 tests in 81 suites pass. The optional browser harness and all 80 inline
scripts pass syntax checks; 26 entrypoint cache references are consistent.
Source comparisons verify exact palette, old-save recovery, controllers, exports,
HTML bodies and unrelated CSS remain unchanged. No test-count
expansion or new dependencies/assets are needed for this CSS correction.

The previous release’s live-source verification was interrupted by cancelled
network approval and tunnel 403 responses. That blocked route is not retried
without permission. Exact-head CI, merged-tree identity and successful Pages
deployment can be verified independently through authorized GitHub tools; these
do not establish served-file hashes or browser rendering.

Owner checks: inspect idle neutrality, hover/exit, Arrow/Home/End previews,
selected checkmark, uncluttered focus/scroll boundaries, forced colors, phone
selection and menu scrolling. Actual native rendering/device/screen-reader
behavior remains unverified until owner testing.

Final reconciliation preserves Randomize dice PR #151, main
`d3c357442701af437ccd9c7502b38343b7983eee`, including its controller/cache changes.
