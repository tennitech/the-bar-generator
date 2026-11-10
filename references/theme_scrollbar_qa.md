# Color Theme visual scrollbar correction

November 10, 2026. Branch `codex/fix-theme-scrollbar`; base main includes #158.
Previous release branches remain preserved.

## Source identification and scope

The user reported a bar/line at the dropdown right edge without a screenshot.
Current source has two separate visuals: the native thin scrollbar, explicitly
re-enabled for Color Theme, and each row’s short horizontal decorative ink mark.
The delegated request identified the scrollbar as the target. This correction
hides only that vertical scrollbar. The separate ink mark, selected checkmark
pseudo-element and contrasting focus outline are retained. An optional owner
clarification was requested to distinguish the two visuals; no rendered diagnosis
is claimed under the established browser restriction.

The Color Theme scroll viewport keeps `overflow-y: auto`. Scoped `scrollbar-width:
none` and zero WebKit scrollbar dimensions hide the visual track/thumb only.
Removing its custom color and stable gutter avoids a residual right-edge strip.
The existing top/bottom fade elements are restored; their existing controller
updates show the appropriate boundary when additional content remains. They are
pointer-transparent and do not add a new line, control, tab stop or scroll handler.
They match the app’s existing default dropdown overflow treatment.

Mouse wheel/trackpad/touch native scrolling and Arrow/Home/End navigation with
`scrollIntoView` use unchanged code. Exact palette/text state rules, selection
ARIA/checkmark, focus outline, labels, compact row sizing, saved settings and
modal/export/audio/GIF implementations remain untouched. The correction is CSS
plus cache-version updates, not a controller rewrite.

## Checks and limits

All 20 focused exact-pair, generator route/cache, modal and touch-control feedback
checks pass in five suites after preserving #160. JavaScript and all 80 inline
scripts pass syntax checks; 26 entrypoint/shell/bootstrap/Home cache keys agree.
Exact comparisons preserve the controller/palette/export/audio/GIF/modal sources,
row-state CSS, horizontal ink mark and HTML bodies.
The full required CI remains the merge gate. Source comparisons verify all
production controller/palette/render/export/save/audio/GIF modules and HTML bodies
are unchanged, apart from cache references. CSS and shell/bootstrap/fallback/Home
prefetch cache keys advance together.

The optional browser harness additionally checks hidden scrollbar styles,
retained `overflow-y: auto`, real overflowing content, native mouse-wheel movement,
Home/End movement, top/bottom affordances, pointer transparency, selected checkmark
and focus outline. It also retains the existing exact-pair/neutral-exit and mobile
selection checks. The harness is syntax-checked only; it is not executed through
any previously blocked route. Native wheel/trackpad/touch rendering and physical
device behavior remain unverified, as do served-file hashes. Verified CI/merged
tree and Pages deployment are reported separately.

Owner checks: confirm the right-edge scrollbar is gone; scroll with wheel,
trackpad and touch; use Arrow/Home/End and Enter; inspect boundary fades, checkmark,
focus outline and exact theme text colors. The horizontal ink marks intentionally
remain because they are a different element from the requested scrollbar.

Final reconciliation preserves changed-setting marker PR #160, current main
`9be283918160b6ef7b6ea7e55331b56533f9d0fa`, including touch controls and cache keys.
