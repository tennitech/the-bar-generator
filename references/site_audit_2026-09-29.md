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
| Existing unit tests | 10 suites, 88 tests passed after changes. |
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

## Open findings, prioritized

### High — profanity and hateful-content filtering is incomplete

`js/utils/profanityFilter.js` has a short fixed list of sexual/profane terms. It does not cover hateful slurs or many Unicode variants. In direct tests, basic and simple leet examples were caught, while a full-width spelling, a vowel with a diacritic, and an unlisted racial slur passed unchanged. Binary and Morse inputs use this filter, including when restored from URL state. The client-side filter should use an agreed content policy, Unicode normalization/confusable handling, explicit tests for evasion and false positives, and a review of every user-controlled text path before the site is presented as brand-safe. No filter can guarantee every offensive phrase is caught.

### High — the generator has no recovery path when p5 fails to load

Each generator route loads p5 1.7.0 from cdnjs. Blocking that request in Chromium produced no preview canvas and no user-facing error. The generator shell still appeared, making the failure look like a broken design. Bundle an approved local copy or add a fallback and retry/error state. The external script also has no Subresource Integrity attribute; deployment owners should review the third-party loading policy.

### Medium — final accessibility verification is still needed

The automated scan does not cover screen-reader behavior, 200%/400% zoom, actual iOS/Android touch, or Safari and Firefox. The canvas viewport uses `touch-action: none`, so browser pinch zoom over that region needs a physical-device check despite the corrected viewport meta tag. The on-demand ASCII overlay also needs a reduced-motion review. Run manual WCAG 2.2 AA checks before claiming conformance.

### Medium — ultrawide preview uses a small fixed maximum scale

At 3440×1440, layout and controls remained in bounds, but `MAX_LOGO_SCALE = 1.5` keeps the generated mark around 375px wide inside a 3140px workspace. This is usable with manual zoom, yet leaves the main preview visually small on very wide monitors. Review the intended maximum with design/brand owners before raising it.

### Medium — brand approvals and scientific assumptions are not evidenced in the repo

The documented brand rules require approved logo color use, exact geometry, and meaningful, accurate bars. The site offers secondary logo colors, a club Runway bar, and an Artemis II bar. The repository does not contain approval records for these uses or validation notes for every bar's scientific meaning. Obtain the relevant brand and club approvals and record each bar's data/geometry assumptions before describing every output as approved and scientifically accurate.

### Low — performance and release coverage gaps

The intro creates roughly 150–160 repeated image links and updates their transforms every animation frame. It now paints without waiting for preloading, but should be profiled on a lower-power phone, especially for battery and thermal impact. There is no checked-in browser test or CI workflow for routes, exports, keyboard flows, and responsive layouts. The existing Jest suite covers 88 unit cases but cannot catch a missing CDN dependency or browser-only interaction regression.

## Limits of this audit

The live GitHub Pages deployment, analytics, privacy policy, security headers, actual assistive technology, physical devices, and owner approval records were not available in this local checkout. This report records observed behavior and code evidence, not a legal compliance certification or approval of generated marks.
