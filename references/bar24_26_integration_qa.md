# BAR24–26 cloud integration — October 28, 2026

## Source preservation and scope

Integration branch `codex/fix-bar24-26-integration` starts from published main
`f8ad484cd844928e3eca13de10f403cdaf1f3dbf`. It retains the complete local histories of:

- Marquee, native Home and selected-color secret intro:
  `c8db3bc39c21d489ca093607cea6872ea39e567b` (implementation `592e65a`).
- Sidebar sizing and parameter actions:
  `3dcb831ebb60fd088f468b599558543049f2a47c`.
- Mission Control runtime and lossless backdrop:
  `0ff228d25db9b2eeadf6474db9b095e30e745a5d`.

Original feature branches, checkpoints and worktrees remain available. These
local source identities do not imply that their individual tips were published.
There is no branch deletion, new runtime dependency, framework, credential,
unrelated service change or inferred owner/institutional approval.

The integrated product includes all 21 real shared-renderer marquee samples,
exact-black splash/artwork ink, a native Home link and deliberate hidden intro
with selected artwork ink, contrasting surfaces, reduced-motion choice, modal
focus/background isolation and lazy-load recovery. Wider sidebar/export controls
share bounded dimensions; all configurable families have logical Randomize/Reset,
including inactive Numeric data, Circles seeds and running/paused Quantum.
Mission Control reuses its unchanged vector artwork and avoids unchanged painting.

## Reconciliation

Additive main-runtime, CSS, shell and early control dependencies were preserved.
All October 28 cache references in HTML/JavaScript/CSS use
`20261028-bar24-26-release`, including route stubs and lazy intro dependencies.
The 24 routed shells and fetched shell therefore cannot mix the earlier action
API with the final runtime. Historical documentation and asset-rights records
from all three branches are retained. Additional QA PNGs remain local review
artifacts rather than release-tree binaries; the lossless backdrop is the only
new non-SVG product image. The original PNG remains its source and fallback.

Scientific domains, official geometry, export sizing and the shared export
renderer are unchanged. Sample verification requires identical SVG structure;
The Circles sample uses the same canonical initial seed 1 as Reset; the capture
fixture asserts that seed rather than overriding randomness. Cross-host Neural
floating-point serialization is checked with a documented 1e-10 verification tolerance.
That tolerance does not modify artwork, application math or edge requirements.

## Established feature evidence

The individual branches passed 425/43 (Marquee), 394/36 (Sidebar) and 367/36
(Mission) unit tests/suites. The final combined application passes **494 tests
in 45 suites** under Node 22.23.4. Branch-specific records distinguish complete,
scoped and interrupted/resumed browser runs:

- [Marquee/Home evidence](review-images/marquee-home/validation.md).
- [Sidebar/action evidence](review-images/sidebar-actions/validation.md).
- [Mission runtime and codec evidence](review-images/mission-performance/cloud_validation.md).

Chromium's native Home popup had stale Playwright `page.url()` metadata in one
fixture. The actual new document URL, base URI, title, completed home landmark,
decoded images and screenshot established correct navigation; the source page
remained on the generator. No application navigation workaround was introduced.

## Final combined checks

All ten bounded combined checks passed against production fingerprint
`ac01de450cbc3030d72aa583d5cf897e1676ea0cd0b0e4a8f7ab07c2b58e4451`:

| Check | Final combined coverage |
| --- | --- |
| Source/sample parity | All 21 families; canonical Circles seed 1; no invented geometry |
| Chromium and WebKit browser smoke | 21 styles/SVG exports, PNG, five widths, text safety, reduced motion, forced 2D and renderer recovery |
| Complete WebKit sidebar/action suite | All 21 routes, 16 configurable families, repeated actions/share/SVG/PNG, both Numeric sources, eight themes, fine/touch layouts and running/paused Quantum |
| Chromium and WebKit intro lifecycle | Frame-by-frame entrance/exit opacity, control bounds, disabled states, focus, repeated close/reopen and reduced motion |
| Chromium and WebKit selected Mission checks | Normal desktop forced-2D and reduced-motion touch WebGL2; all three inks and both raster sizes; zoom/pan/Fit, lifecycle, history and credits |
| Chromium and WebKit marquee cross-feature checks | Desktop/phone Home and deliberate intro gestures, genuine native new tab, Mission ink, lazy-load retry and storage fallback |

The combined Mission selection is two representative contexts per engine; the
complete eight-context-per-engine feature matrices are separately documented in
the Mission record. The combined marquee pass selects Mission ink rather than
repeating all eight feature-branch palette cases. Scope is explicit; unrun cases
are not counted as passed. Desktop, emulated phone and Mission screenshots from
the final tree were visually inspected, with no new clipping/overlap identified.
Screenshots remain local review artifacts. A stale Chromium navigation-locator
wait was replaced with assertions on the actual complete document, visible home
landmark and decoded images; application navigation remains native and unchanged.

The [machine-readable result summary](bar24_26_integration_results.json) records
per-check status and observation time. Final aggregate unit, syntax and whitespace
checks passed; existing CI remains the fast unit-only workflow.

## Performance interpretation

Same-host WebKit observations for an unchanged Artemis preview measured wrapped
`draw` work of **172 → 4 ms per 1.2-second idle window**, with **64–69 → 0 canvas
repaints**. The normal p5 scheduler remains; this is not a claim of the same
percentage reduction in total browser CPU, GPU time, memory or startup latency.
The pre-WebP cold-entry sample did not improve, so no overall cold-load speedup
or comparison with the earlier Mac host is claimed.

The backdrop is **3,802,637 → 1,852,312 bytes (51.3% smaller)** at the unchanged
2048 × 2592 dimensions. Chromium 151.0.7922.34 and WebKit 26.5 verified exact
decoded RGBA identity and composed-image pixel equality. Modern CSS selected only
the WebP initially; the PNG fallback and existing credits remain. Bounded DOM and
listener assertions passed; missing raw heap measurements are not fabricated.

## Limits

Linux Playwright engines are not physical phones or the Safari application.
Manual screen-reader output, physical keyboard/touch behavior, high-refresh and
low-power hardware, final-size owner acceptance and formal RPI/asset approvals
remain separate. Existing font, Artemis, gradient and trademark permission
questions are not closed by software tests or publication authorization.
