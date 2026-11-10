# Why not... intro recovery — November 10, 2026

## Scope and root cause

The intended action opens the existing full-screen ASCII animation of the current
selected bar, the title and official mark, then returns to the same generator.
Reduced motion retains the static artwork and explicit Play animation once choice.

A reproducible permanent failure exists in the lazy script loader. A script's
load event does not establish that its JavaScript registered the expected API.
Previously, if the optional overlay script finished loading without registering
LogoAnimationOverlay.createLogoAnimationController, the controller initialization
failed but loadExternalScriptOnce retained its resolved promise and script tag.
Every later click reused that unusable result. Resetting only the controller
promise did not permit a fresh request. An existing unusable script tag also
counted as success.

The loader now accepts a readiness predicate for this optional controller, checks
it on load and when reusing an existing tag, and removes/evicts unusable loads.
Normal download failures keep their existing retry behavior. Concurrent requests
still coalesce. No dependency, asset, CSS, theme, color, renderer, export or
scientific model change is included.

This reproduces and repairs a concrete failure path. Browser execution is blocked
in this environment, so it does not establish that this was the exact cause of
the owner's live incident. Renderer initialization remains responsible for binding
controls after the design state is restored, preserving selected-bar snapshots.

## Automated evidence

- Full suite: 787 tests in 71 suites pass in Node 24.22.1.
- Focused suite: 77 tests in five suites pass (introLoading, secretIntro,
  logoAnimationOverlay, introBackground, animationPalette).
- New tests execute the production loader, controller initializer, launch function
  and SecretIntro script in a Node VM browser-script context. They cover download
  and evaluation failures, cache/tag eviction, successful retry, stale tags,
  concurrent requests and repeated launches.
- A production default overlay test combines the real menu binding and overlay
  controller through three open/cancel cycles: parent Escape, Close click and
  authenticated current-iframe close message. Tab/Shift-Tab cycle controls; each
  cancellation tears down the frame, restores menu-summary focus and clears ARIA
  expanded/modal state. Existing cases cover menu Escape, outside dismissal,
  native Enter/Space noninterference and reduced motion.
- Existing palette tests cover exact brand values. No theme or palette file changes.
- JavaScript syntax and git diff --check pass.

These are simulated DOM/event tests, not rendered-browser or native-keyboard proof.
No screenshots, live-site interaction, physical-device checks or new browser launch
attempts were performed. The earlier sandbox/browser escalation rejection was
respected without using a different executable, sandbox flag or environment.

## Integration

Worktree: /workspace/scratch/83f166ead34c/the-bar-generator-why-not

Branch: codex/fix-why-not-easter-egg, based on main at 0654f5d.
Changes are uncommitted. No push, PR, merge, deployment or publication was performed.
Transfer the main.js loader and initializer hunks, both test additions, this QA
file and the additive project_status.md section. Do not replace other tasks'
main.js changes or project status sections. The integration owner should apply
one consolidated cache revision to main.js in the generator shell and reconcile
the routed shell/bootstrap cache revisions with the other work.

Before shipping, run npm test -- --runInBand on the integrated candidate. In an
allowed browser environment, existing scripts/headerHomeSmoke.js covers the
menu, Enter/Space, repeated opens, Escape, mobile focus and themes;
scripts/marqueeHomeSmoke.js covers failed lazy-download recovery and normal-motion
mobile launch. Serve the integration checkout via scripts/test_server.py and set
RPI_SITE_URL. These browser scripts were not run here.

## Owner's live checks

1. Open the three-dot menu, select Why not..., and verify the ASCII sequence uses
   the current bar. Close it, open it again and try Replay.
2. Repeat with keyboard Enter and Space. Escape should dismiss the menu by itself;
   in the animation it should return focus to More options. Tab and Shift-Tab must
   stay within the open animation.
3. On phone width, open Design controls and repeat by touch. The design and its
   parameters should remain intact after closing the animation.
4. With system reduced motion enabled, verify the still logo and Play animation
   once choice. Test black, white and red artwork without altered brand colors.
5. If it still fails, record the route, device/browser, reduced-motion setting,
   whether any dialog/toast appears and the browser console/network failure.

## Incremental release reconciliation

Applied the focused original candidate onto published main `fed8e88` after
export PR 136 was merged and all 33 changed runtime files matched production.
The original dirty source worktree remains untouched. Latest-main regression:
**859 tests in 78 suites pass**, with loader/controller tests and all prior
brand, motion and composition coverage. Log: `/tmp/why-not-release-jest.log`.
Only loader readiness/retry behavior changes in main.js; shell/runtime cache
references are refreshed. Existing brand/renderer/export sources are preserved.
Browser/native verification limits above still apply.

The final candidate also preserves independently published PR 137 / main
`d55bdc1af80b9d04d38a0cf02aba76a1031bdf4f`. The full suite again passes
859 tests in 78 suites (`/tmp/why-not-release-r2-jest.log`). Shared route
cache conflicts are reconciled without reverting its preview/header correction.
