# Compact sidebar footer QA

November 10, 2026. Repository: `tennitech/the-bar-generator`.
Branch: `codex/fix-compact-sidebar-footer`, isolated worktree
`the-bar-generator-sidebar-footer`. Started from main `05655f6`; incorporated
export-composition release #136 / `fed8e88` and brand header repair #137 /
`d55bdc1`, plus Why not retry repair #138 / `dfcc987` before final validation. Other release
worktrees remain untouched; keep all branches after merge.

## Result

- One full-width, theme-token divider separates scrolling controls from the footer.
- About uses native `details`/`summary`, initially closed, labeled **About [current
  style]**. It has a 44px minimum target, a reversible chevron, visible keyboard
  focus, no boxed surface and no new animation. Native semantics supply expanded
  state and Enter/Space behavior without redundant ARIA.
- The footer is a fixed flex sibling of the controls scroller. Its report and
  three-dot actions stay below About. Expanded reading content is bounded to
  25% of the dynamic viewport (18rem maximum) and is a labeled, focusable scroll
  region. Text can wrap; theme tokens and safe-area/sidebar padding remain shared.
- Current-style copy and Artemis details/credit are retained. Open/closed choice
  survives style changes; changed-style text starts at the top, ordinary updates
  preserve reading position, and leaving Artemis closes its nested disclosure.
- The existing passive More below cue and gradient use the controls viewport and
  footer boundary. Resize/toggle observers keep them accurate when About changes
  height; About text alone cannot create a controls cue. No input interception.
- Cache references for stylesheet, shell, bootstrap, About utility and cue are
  consistent. Export code, artwork, filter, model and rendering paths are retained.

## Performed checks

- **863 unit tests pass in 78 suites**, Node 24.22.1. This includes the complete
  released export-composition suite. Four added regressions cover native state
  across all style descriptions, style-specific reading scroll reset, and actual
  cue initialization/event scheduling with its new sibling footer.
- Generator markup has balanced elements and unique IDs; source parsing confirms
  the sibling scroller/footer, initially closed native details, summary structure,
  and both footer actions. This is source verification, not rendered DOM QA.
- All 26 generator entrypoints and 80 inline scripts compile. Changed runtime and
  smoke JavaScript parse. CSS/shell/bootstrap references agree; whitespace passes.
- Diff inspection confirms the complete #136 exports, #137 header repair, and #138 intro recovery and tests are
  unchanged. This footer work has no preview/export geometry change.

## Unverified rendered behavior

Browser launch/socket escalation was already denied in this environment, and
WebKit dependencies are missing, as recorded in project status and prior release
QA. These denied operations were not retried or bypassed. No browser screenshots,
real keyboard/touch tests, manual screen-reader checks or physical device claims
are made for this change. Updated smoke scripts are syntax-checked, not run.

With an authorized working browser and this checkout served over HTTP, run:

```sh
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/barInformationSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/shortSidebarSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/sidebarScrollCueSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/missionHeaderSmoke.js
```

Review desktop and phone/landscape widths with each theme, reduced motion,
repeated Enter/Space opening and closing, style changes while open and closed,
scrolling the explanation and Artemis links, keyboard focus return, report/menu
actions and conditional cues at top/middle/end. Confirm controls remain reachable
in short windows. Existing export/browser checks remain available independently.
Owner acceptance and formal RPI approval are separate from engineering checks.
