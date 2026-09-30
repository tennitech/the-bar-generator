# Full Site Audit — 2026-09-29

## Baseline and scope

- Audited a fresh clone of `tennitech/the-bar-generator`, starting from `origin/main` commit `f779f04` on branch `audit/full-site-2026-09-29`.
- Confirmed that `main` contains the marquee intro screen and the April 28 header logo animation work. No changes were made to `main`.
- Covered the intro, generator, 404 page, animation prototype, all 24 generator route shells, all 21 selectable bar styles, three disabled styles, eight color themes, and available export formats.
- Used a local static server and headless Chromium at 320×568, 375×667, 768×1024, 1440×900, and 3440×1440. This is browser emulation, not testing on physical devices or other browser engines.
- Used [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) as the accessibility reference. Automated scans covered selected 2 A/AA and 2.1 A/AA rules; manual conformance testing remains outstanding.

## Results

| Area | Result |
| --- | --- |
| Existing unit tests | 10 suites, 90 tests passed after follow-up changes. |
| Route files | All 24 generator route shells returned HTTP 200 with the matching route style. Music, graph, and truss redirected to Solid as intended. |
| Rendering | All 21 selectable styles switched without page errors in the desktop browser sweep. Sampled Binary, Lunar, and Waveform at phone, tablet, and ultrawide sizes. No horizontal document overflow at the five tested widths. |
| SVG | All 21 selectable styles downloaded nonempty SVG files with vector content. |
| PNG | Solid, Binary, and Lunar downloaded files with valid PNG signatures. |
| GIF | Ruler, Ticker, and Waveform downloaded files with valid GIF89a signatures. |
| Automated accessibility | axe-core 4.10.3 reported zero WCAG 2 A/AA, WCAG 2.1 A/AA, or best-practice violations on the tested intro, generator, 404, and animation states after fixes. Contrast scans also passed all eight settled color themes. This does not establish full WCAG conformance. |
| Keyboard and motion | The intro has a keyboard route into the generator; its repeated decorative bar links are removed from the tab order. The custom style selector supports Arrow keys, Home/End, Enter, Space, Escape, and Tab. The mobile sidebar becomes inert when closed and restores focus on Escape. Reduced-motion preference stops intro movement and starts Ruler, Ticker, and Waveform with motion off. |

## Changes made on the audit branch

1. Mapped the seven reference-bar families on the intro to their matching generator routes. Previously every bar opened Solid.
2. Filled the intro scene before image preload completes, reduced the logo/title scale floor for 320px phones, and lifted moving rows away from the title on short phones.
3. Removed `maximum-scale=1` and `user-scalable=no` from the 27 affected HTML pages. Added a generator `<h1>` and accessible preview name, fixed header title contrast, and raised the header mark to the documented 60px digital minimum.
4. Made custom selectors keyboard and screen-reader operable with a combobox/listbox model. Prevented keyboard focus from entering the closed mobile sidebar.
5. Honored reduced-motion settings for the marquee and initial motion-enabled generator bars.
6. Corrected repository and issue links to `tennitech/the-bar-generator`, and replaced the production homepage's “Experiment” metadata.

## Follow-up repairs — 2026-09-30

- Removed six serial shader fetches and compilations from startup; the current renderer never used those shaders. Routed pages now download their dependency scripts concurrently while preserving execution order. The intro preloads the renderer and prefetches the generator shell. The 676 KB Artemis II artwork script loads only for that style or when selected later.
- Vendored the unchanged p5.js 1.7.0 browser build with its LGPL-2.1 license. All generator pages now load it locally. Both the direct and routed generator show a Retry action if the renderer is unavailable.
- Expanded client-side text moderation to cover unambiguous hateful slurs, full-width and accented forms, common lookalike characters, and existing leet/spacing forms. Binary and Morse conversion, share URLs, live preview, and exports now consume sanitized text. This remains a best-effort filter, not a guarantee against every offensive phrase.
- Corrected the Fibonacci pattern to include `2` in the consecutive sequence. Binary now encodes Unicode text as UTF-8 instead of silently substituting `A`; Morse now encodes commas, normalizes accented letters, and avoids phantom gaps around unsupported characters. [Bar meaning and source notes](bar_science_notes.md) record the assumptions.
- Preserved native mobile pinch zoom over the canvas, stopped intercepting browser zoom gestures outside it, and provided a static mark instead of the ASCII animation under reduced motion.
- Enlarged the preview proportionally on ultrawide workspaces while preserving mark geometry. SVG exports now carry 20 viewBox units of clear space on each side, matching the existing PNG/GIF export padding model.
- Added a 2D canvas fallback for browsers and devices that cannot create a WebGL context. The browser smoke test simulates WebGL denial and checks that the live generator still renders.
- Added a browser smoke script and CI workflow. Local Chromium and Playwright WebKit runs passed all 21 style routes and SVG exports, a PNG signature check, five viewport widths, text safety, reduced motion, and missing-renderer recovery. A fresh axe-core 4.10.3 scan reported zero tested WCAG/best-practice violations on the intro, phone Ruler, ultrawide Artemis II, and reduced-motion overlay states. The Jest suite passed 10 suites and 90 tests using a fresh package-manager runner. In a Chromium intro-to-generator check, the renderer preload was reused from cache and a canvas was attached in 353 ms; this is one local observation, not a device-wide performance guarantee.

## Remaining findings

### Medium — final accessibility verification is still needed

The automated scans and browser smoke tests do not cover screen-reader behavior, actual iOS/Android touch, or the Safari application. Playwright WebKit passed locally. Playwright Firefox stalled before launch on this Mac; Linux CI Firefox coverage is being checked with the new 2D fallback. Native pinch zoom is no longer suppressed by the generator, but physical-device and 200%/400% browser-zoom checks are still needed before claiming WCAG 2.2 AA conformance.

### Medium — brand approvals and scientific assumptions are not evidenced in the repo

The documented brand rules require approved logo color use, exact geometry, and meaningful, accurate bars. The site offers secondary logo colors, a club Runway bar, and an Artemis II bar. The repository still does not contain approval records for these uses. The new [bar meaning notes](bar_science_notes.md) distinguish data encodings from decorative patterns, and generator metadata no longer claims every output is brand-compliant. Obtain the relevant brand and club approvals before making that claim.

### Low — performance and release coverage gaps

The intro creates roughly 150–160 repeated image links and updates their transforms every animation frame. It should be profiled on a lower-power phone, especially for battery and thermal impact. The new CI browser smoke covers routes, SVG/PNG exports, viewport widths, text safety, and renderer recovery. It does not replace manual touch, keyboard, and assistive-technology testing.

## Limits of this audit

The live GitHub Pages deployment, analytics, privacy policy, security headers, actual assistive technology, physical devices, and owner approval records were not available in this local checkout. This report records observed behavior and code evidence, not a legal compliance certification or approval of generated marks.
