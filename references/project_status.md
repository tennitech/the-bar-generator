# RPI Logo Generator - Project Status & Master Documentation

**Last Updated:** 2026-04-21
**Current Phase:** Phase 3 (Advanced Features & Refinement)

## 1. Project Overview
A web-based **Design Tool** integrated with RPI's central Brand Hub. It allows students and faculty to generate unique, brand-compliant RPI "Bar" logos and lockups. The tool strictly adheres to branding patterns while ensuring safety and stability.

## 2. Architecture & Tech Stack
*   **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+).
*   **Rendering:** p5.js (WebGL mode) for 2D/3D graphics and shaders.
*   **Integration:** Designed to embed within the **Frontify** ecosystem.
*   **Shaders:** GLSL fragment shaders for pattern generation.
*   **Audio:** Web Audio API with AudioWorklet (`pulse-worklet.js`) for audio-reactive features.
*   **Fonts:** Official `RPIGeist` family (WOFF2) served locally.

### File Structure
*   `assets/` - Static resources (fonts, images, shaders).
*   `css/` - Stylesheets (`style.css`).
*   `js/` - Logic (`main.js`, `drawing.js`, `pulse-worklet.js`).
    *   `utils/` - Helper modules (`profanityFilter.js`).
*   `references/` - Documentation and guidelines.

## 3. Completed Milestones

### Phase 0: Analysis & Setup
*   [x] Analyzed Project Proposal and Brand Guidelines.
*   [x] Extracted condensed brand rules for agent usage.

### Phase 1: Foundation & Safety
*   [x] **Structure:** specific directory layout established (`assets`, `css`, `js`).
*   [x] **Branding:** Integrated `RPIGeist` font family and defined CSS variables.
*   [x] **Safety:** Implemented client-side profanity filter with real-time feedback.
*   [x] **UI Polish:** Shifted to workspace layout, implemented accessible dropdowns and navigation.

### Phase 2: Stability & Integration
*   [x] **Frontify Integration:** Researched strategy (iframe/embed) and implemented "Copy Embed Code" feature.
*   [x] **Generator Stability:** Fixed WebGL context handling, memory leaks, and added unit tests (Jest).
*   [x] **UX Perfection:** Refined download workflow with Toast notifications and polished controls.
*   [x] **Asset Lockdown:** Verified adherence to hardcoded brand constants.

## 4. Active Roadmap

### Phase 3: Advanced Features & Refinement
*   [ ] **Advanced Export:** High-res PNG/SVG export refinement.
*   [ ] **Interactive Tutorials:** Guide users through the tool.
*   [ ] **Club Pilot:** Beta launch for student clubs.
*   [ ] **AI Exploration:** (Future) Event-specific background generation.

## 5. Recent Updates
- **[2026-04-21] GitHub Pages 404 Fallback Added For Legacy And Bad Deep Links**:
    - Audited the live GitHub Pages deployment at `https://tennitech.github.io/rpi-logo-generator/` and confirmed the intended primary routes still work directly under the real repo base path: `/`, `/generator/`, and valid `/generator/[style]/` pages all serve the expected shells and shared assets.
    - Added a custom root `404.html` plus a dedicated Pages fallback utility so unsupported or legacy deep links such as `/generator/staff/`, `/generator/matrix/`, and unknown `/generator/[bar-style]/` paths now recover automatically into valid generator routes instead of stopping at GitHub's default 404 page.
    - Preserved the marquee homepage as the default non-generator destination: unknown non-generator paths now redirect back to `/`, while bad legacy links that still carry generator query state continue to normalize into valid `/generator/[style]/` URLs under the same GitHub Pages base path.
- **[2026-04-21] Legacy Generator Entry URLs Canonicalized To Style Routes**:
    - Extended routing compatibility so old generator-first entry links like `/generator/` and `/generator/index.html` now redirect into the new `/generator/[style]/` structure instead of lingering on the pre-restructure base path.
    - Preserved legacy `style` query handling on those generator entry links, mapping known aliases such as `staff` onto the current style slugs and falling back safely to `solid` when the requested style is missing or unknown.
    - Moved the redirect check into the shared generator bootstrap as well so static wrapper pages normalize `index.html` variants and strip stale `style` query params before the generator shell loads.
- **[2026-04-21] Waveform Preview Input Lag And Mobile Audio Teardown Fixed**:
    - Reduced live waveform preview cost by capping point density to an adaptive width-and-frequency-based sample budget and by moving envelope-state reads out of the per-vertex loop, which removes the worst slider and motion-toggle lag when waveform settings are pushed to their maximum values.
    - Fixed preview audio ownership so stopping audio now follows the actively playing preview type instead of the currently selected bar style; this resolves the waveform case where switching to another style could leave the old sound running.
    - Added stronger document background teardown hooks (`visibilitychange`, `blur`, `pagehide`, `beforeunload`, and `freeze`) and suspend the audio context when the page is backgrounded, closing the Android case where preview sound could continue after leaving the browser or switching apps.
- **[2026-04-21] Browser Pinch Zoom Disabled And Canvas Pinch Routed Into Preview Zoom**:
    - Disabled native browser pinch-to-zoom across the marquee and generator page shells so the app no longer scales the page itself when users pinch on touchscreens or trackpads.
    - Added a dedicated canvas pinch path in `js/main.js` that converts in-canvas pinch gestures into the existing preview zoom state, keeping the zoom buttons, zoom percentage field, and gesture-driven zoom behavior on the same viewport logic.
    - Intercepted desktop pinch-as-browser-zoom gestures as well so ctrl-wheel and Safari gesture zoom now either adjust the generator canvas preview or get blocked outside the canvas instead of magnifying the page.
- **[2026-04-21] Desktop Sidebar Toggle No Longer Blanks The Logo Canvas**:
    - Stopped the generator from resizing the WebGL backing canvas on every frame of the desktop sidebar collapse and expand transition, which had resurfaced as a white logo flicker while the control rail animated.
    - Added a transition-end and timeout-backed final resize pass so the workspace still snaps to the correct final dimensions after the sidebar finishes moving, without losing the current logo frame mid-animation.
- **[2026-04-21] Marquee Row Spacing Locked Against Viewport Height Compression**:
    - Reworked `marquee-ui.html`'s diagonal row placement so the marquee lanes now keep a fixed vertical pitch instead of recalculating row spacing from the live viewport height, which previously caused the rows to collapse into each other on shorter screens.
    - Let excess rows clip naturally at the top and bottom of the stage again while enforcing that minimum pitch, restoring the fuller wide-screen marquee composition without reintroducing row crowding on short viewports.
    - Kept the hero title and credit clearance wrappers in place for layout control, but removed their visible fill so those protective surfaces are now fully transparent instead of reading as black boxes over the marquee.
    - Tightened the title lockup's bottom clearance padding so the protected area under `The Bar Generator` no longer carves out unnecessary empty space at mid-sized desktop resolutions.
    - Added a large-desktop marquee tier for `1920x1080` and above so the diagonal bars, row height, gap rhythm, and hero lockup can all scale beyond the baseline desktop size instead of plateauing.
    - Added a smooth upward-lift band for near-square, taller viewport ratios so the diagonal rows rise earlier around tablet and edge-case desktop sizes instead of waiting for a hard breakpoint where they can still cross underneath the title before snapping clear.
    - Strengthened the narrow-portrait hero scale cap and reduced the measured mobile lockup bottom gap so widths around the `547px` class now shrink the RPI mark and title cluster sooner while preserving the same proportional padding model used by the larger layouts.
    - Removed the separate narrow-screen hero centering path so portrait widths now keep the same left, right, and bottom inset model as the larger layouts while still dropping the RCOS credit at the smallest breakpoint.
    - Updated the credit-hidden narrow-screen scale calculation so once `Made in RCOS` drops away, the hero can size itself against the actual title block instead of the larger desktop lockup width, letting `The Bar Generator` grow into the reclaimed horizontal space.
    - Added a dedicated narrow-portrait row-clearance lift band between roughly `430px` and `550px` wide so the diagonal bars rise away from the RPI mark in tall phone-sized edge cases without changing the lockup mode switch or the RCOS credit cutoff behavior, and then tuned that band upward in small follow-up passes after visual review to open a bit more space above the logo.
    - Added regression coverage for the row-position helper so future marquee changes keep the fixed-gap behavior when the viewport height shrinks.
- **[2026-04-21] Easter Egg Game References Removed From Generator Runtime**:
    - Removed the inactive Rink Rush easter-egg integration from the live generator shell, including its startup hooks, hidden overlay markup, workspace launcher button, and bar-render interception path in `main.js`.
    - Stopped loading the standalone easter-egg script and removed its Jest coverage file so the current app no longer carries dormant arcade-only runtime paths while that feature is on hold.
    - Stripped stale `gif.js` and `gif.worker.js` source-map annotations from the vendored exporter assets so browsers stop logging 404 requests for missing local `.map` files.
- **[2026-04-21] Mission Control Mobile Credits Panel Clamped To Viewport**:
    - Fixed the Mission Control `Learn About RPI x Artemis` panel on phones so the credits popup no longer renders past the left viewport edge when opened from the compact icon-only header action.
    - Kept the desktop dropdown behavior unchanged while switching the mobile panel to a viewport-aware position pass that anchors to the trigger and clamps within the visible screen width.
- **[2026-04-21] Live Preview Scale Made Viewport-Responsive**:
    - Reworked the on-canvas RPI mark sizing so the default `100%` preview now resolves relative to the visible workspace instead of a fixed draw scale, which keeps the logo proportionate across phones, tablets, and desktop canvases.
    - Kept export geometry unchanged; the responsive logic only affects live preview sizing, pan bounds, and interactive hotspot alignment inside the generator viewport.
    - Capped the responsive baseline at the previous desktop scale so larger workspaces keep the established presentation while smaller screens automatically reduce the default preview size to avoid clipping.
- **[2026-04-21] Mobile Viewport Locking And Touch Input Recovery**:
    - Locked both the generator workspace and `marquee-ui.html` to the visible mobile viewport using a shared viewport-height CSS variable synced from `visualViewport` when available, replacing the earlier `100vh`-based sizing that could size against browser chrome and make the pages feel like desktop layouts on phones.
    - Removed the generator's global mobile `touchend` cancellation path and switched sidebar outside-close handling onto `pointerdown`, restoring normal tap-to-click behavior for mobile buttons, menus, and custom dropdown controls.
    - Tightened the generator's phone header, action cluster, floating workspace controls, and mobile drawer width so the interface fits the handset frame more intentionally without introducing page-level scrolling.
    - Removed the marquee page's narrow-screen `overflow-y: auto` fallback so the home experience now stays non-scrollable and scales the hero cluster inside the visible phone screen instead of extending below it.
    - Reworked mobile pan-mode input to use explicit pointer-drag tracking on the canvas viewport with touch gestures disabled only while pan mode is active, preventing the logo from dropping out during phone drags and preserving the existing desktop mouse path.
    - Limited bottom-toolbar hover affordances to hover-capable fine-pointer devices so mobile taps no longer leave the workspace pill controls stuck in a pseudo-hover state after the first press.
- **[2026-04-20] GitHub Pages Source Switched Back To `main`**:
    - Confirmed the existing default Pages URL remains `https://tennitech.github.io/rpi-logo-generator/` and reused it instead of creating a new site path.
    - Switched the repository's GitHub Pages publishing source from a stale GitHub Actions deployment back to `Deploy from a branch` on `main` at `/ (root)` so the live site tracks the repository's primary branch again.
    - Added a root `.nojekyll` marker file so GitHub Pages serves the repo as a plain static site without Jekyll processing during branch-based publishing.
- **[2026-04-20] Marquee UI Promoted To Home And Generator Moved To Style Routes**:
    - Switched the default site entry point from the generator workspace to the marquee experience, making `/` the primary home page while preserving `marquee-ui.html` as an alias.
    - Moved the generator onto style-specific paths under `/generator/[style]/` and updated generator URL synchronization so the active bar style now lives in the pathname instead of the query string.
    - Added a static route bootstrap layer so style-specific generator paths work on plain static hosting without framework rewrites, and kept legacy query-based generator links compatible by redirecting them into the new `/generator/[style]/` paths.
    - Made marquee bar assets real links into the generator, and then simplified that interaction so every marquee click now opens the default generator view instead of style-specific destinations.
    - Fixed a routed-generator startup regression where the shell HTML loaded but the canvas stayed blank because `p5.js` initialized before the injected generator scripts defined `window.setup`; the bootstrap now explicitly starts one p5 instance after those scripts finish loading.
- **[2026-04-20] Mission Control Theme And Splashdown Counter**:
    - Reworked the former visible `LUNAR` color option into `MISSION CONTROL` while keeping the underlying `lunar` value for URL and legacy state compatibility.
    - Refined the mission-control chrome back toward the design system by removing the decorative header divider, sidebar plaque, workspace-control label/dot treatment, and oversized workspace counter treatment while preserving restrained RPI Red command accents and RPI Blue/Silver signal details.
    - Added a compact Artemis II splashdown elapsed-time counter centered in the header, using NASA's reported splashdown timestamp of April 10, 2026 at 8:07 p.m. EDT as the fixed start time.
    - Normalized Mission Control divider and border colors around a shared blue divider token, then restyled the T-plus counter with a small `Since splashdown` caption and a subtler panel shape.
    - Added Mission Control-only interface copy for `SIGNAL`, `DISPLAY MODE`, and `Report Anomaly`, plus a sidebar `BOROMIR - Lunar surface source` credit block below the main divider linking Maeve Marshall's thesis repository.
    - Refined the Mission Control canvas grid with subtle major grid lines and coordinate ticks, added hover readouts to workspace controls, added blue/red launch-key focus states, and made the T-plus counter open a compact splashdown detail popover with the same reveal motion as the header Learn menu.
    - Reworked the Mission Control grid into a responsive overlay that scales to the visible canvas so cells stay complete on each device, the center lines stay aligned to the RPI mark and bottom controls, and the canvas resize tracks the sidebar transition smoothly instead of snapping at the end.
    - Converted the header asset menu into a contextual `Learn About RPI x Artemis` credits panel while Mission Control is active, linking Reid Wiseman, Maeve Marshall, Paul McKee, and Maeve Marshall's lunar thesis-image source without changing the normal export menu in other themes.
    - Kept the hidden Rink Rush easter egg unchanged; the new treatment applies to the Mission Control theme interface and header counter only.
- **[2026-04-19] Added `SPECIAL / ARTEMIS II` Static Bar Option**:
    - Added a new `SPECIAL` section above `UNDER CONSTRUCTION` in the `BAR STYLE` dropdown with an `ARTEMIS II` option.
    - Copied the user-provided Artemis bar SVG into `assets/bars/bar-lunar.svg` and generated a shared JS asset from it so the live canvas and export paths use the same vector source.
    - Updated live preview, PNG rendering, and SVG export so Lunar bar artwork inherits the active logo/theme color instead of staying black.
    - Renamed the visible special bar option to `ARTEMIS II` and added a `LUNAR` color theme using the provided moon-horizon image as the canvas backdrop. The Artemis II bar defaults into that theme while keeping manual color overrides available.
    - Refined the Lunar theme toward a restrained white, dark-blue, and RPI-red interface treatment and lowered the moon surface in the canvas backdrop so the logo sits primarily against space.
    - Normalized Lunar theme hover, border, selected, and focus states against the shared control token system so default structure uses dark-blue borders while active and focus affordances use RPI red consistently.
    - Changed the Lunar color theme to behave like an optional Artemis II-only easter-egg theme: it sits at the bottom of the color dropdown, is hidden for all other bar styles, and no longer becomes the default when ARTEMIS II is selected.
- **[2026-04-17] Added `NEURAL NETWORK` As A New Scientific Bar Pattern**:
    - Introduced a new `NEURAL NETWORK` bar style in the main generator, designed as a feedforward multilayer node-and-connection diagram that stays inside the official bar geometry and uses the existing one-color brand system.
    - Implemented the pattern through the shared `js/utils/barPattern.js` geometry/export pipeline so live preview, header preview, and SVG export all use the same source of truth instead of drifting.
    - Added regression coverage for the new geometry and SVG serialization so the network stays stable as additional bar styles are added later.
    - Refined the geometry after review so the network now uses much more of the official bar height and added a `HIDDEN LAYERS` parameter to control the depth of the interior network structure directly from the UI and URL state.
    - Tightened that geometry again after visual review by switching to a fixed node count per layer and sparse adjacent-layer connectivity, which removes the overloaded corner fan-outs and keeps the network legible across the full bar span.
    - Reduced the node count again and enlarged the remaining nodes so the neural bar reads with fewer circles and stronger dot presence at generator scale.
    - Reintroduced controlled diagonal cross-links after review so the bar preserves a clearer neural-network character without returning to the earlier dense all-to-all mesh.
- **[2026-04-17] Exported-Mark-First Theme System Recovered And Refined**:
    - Removed `LINK BLUE` from the active color-theme set, including the picker option, export color mapping, CSS theme class, theme availability lists, and legacy color-mode alias handling.
    - Restored the intended contrasting workspace families so `BLACK` now renders in the light UI family while `WHITE`, `SILVER`, and `GRAY` remain on dark workspace surfaces, matching the generator's exported mark-color model again.
    - Replaced the remaining generic theme-state styling with explicit semantic tokens for header controls, dropdown rows, save-menu states, preview/report buttons, workspace chrome, sliders, and toggles so every color theme follows the same interaction logic without falling back to unreadable defaults.
    - Removed the last contrast-breaking assumptions from the custom-select system, including hardcoded light-on-accent selected rows that could fail on pale themes such as `WHITE`, `SILVER`, and `GRAY`.
    - Added a shared `themeMode` utility plus regression tests for legacy alias normalization and custom-select sync so the exported-mark-first theme naming and dropdown state behavior are less likely to drift again.
    - Followed that recovery with a Safari-specific polish pass for the `GOLD` theme: active toggle knobs now stay white, open dropdown triggers no longer show the old red focus box, toggle switches reuse the slider halo-style hover treatment, and the custom-select scrollbar gutter is hidden so selected gold rows fill cleanly to the right edge.
    - Hid the visible sidebar scrollbar across engines so overflow now relies on the existing top and bottom fade cues instead of showing a separate track/thumb inside the control rail.
    - Rebuilt the preview/audio transport controls into a shared icon-driven system across `TICKER`, `WAVEFORM`, `BINARY`, `MORSE CODE`, and `MUSIC`, with unified play/pause button logic, compact restart actions, live-state animation, and disabled guidance for music when no notes are present.
    - Added a dedicated `previewControls` utility plus regression tests so transport labels, ARIA copy, active states, and restart semantics stay consistent as preview behavior evolves.
    - Added versioned local asset URLs for the updated stylesheet and main preview scripts to reduce Safari cache-staleness after these UI changes.
    - Simplified that preview transport pass again after review: the controls now use a more minimal single-line treatment with smaller icon marks, lighter borders, and a restrained active indicator instead of the heavier two-line card-style presentation.
    - Replaced that experimental rail treatment after review with a stricter toolbar-style transport pattern: preview rows now use the same compact icon-button language as the workspace controls, visible text labels and extra restart actions are gone, and motion/audio state is communicated only through the gray play-pause and volume icons themselves.
    - Fixed the `MORSE CODE` text input so clearing the field no longer falls back to visible `RPI` output in the live canvas or SVG pattern path, renamed `SURPRISE` controls to `RANDOMIZE`, and squared their radius to match the compact toolbar hover-button language.
    - Corrected the mobile controls drawer so the sidebar remains a right-edge panel at small widths instead of switching to a left-side slide-in.
    - Removed the mobile-only workspace padding so the canvas background fills edge-to-edge like the desktop layout instead of exposing colored app edges around the logo area.
    - Softened logo panning with resisted drag deltas, eased offset following, and short decaying inertia so the pan tool feels less twitchy while preserving the existing pan bounds.
    - Added a small shared pan-edge inset so the logo can get close to the viewport edges on desktop and mobile without clamping flush against them.
    - Kept the header height consistent across desktop and mobile by removing the mobile-only shorter header override.
    - Simplified the `CIRCLES` parameter panel so it only exposes `MODE` (`PACKING`/`GRID`), `STYLE` (`STROKE`/`FILL`), and the shared density, variation, and overlap sliders; grid mode now uses those same controls with fixed internal grid defaults.
    - Tightened `CIRCLES` rendering so generated grid and packing circles keep usable multi-circle coverage across the full bar bounds and are clipped to the official bar rectangle, keeping live canvas, header preview, and SVG export visually full-bleed without leaking outside the mark geometry.
- **[2026-04-15] Runtime Control Redesign Rolled Back After Stylesheet Corruption**:
    - Restored `css/style.css` after it was accidentally overwritten, then reapplied the current right-sidebar shell, scroll-fade, sticky report rail, report dialog, and parameter-header utility styling as an override layer.
    - Reverted the unfinished `LIVE` runtime-control treatment back to the prior `PREVIEW` structure so the interface returns to the last stable control layout.
- **[2026-04-15] Top Sidebar Fade Moved Into The Scrolling Content Layer**:
    - Reworked the sidebar into a fixed shell plus an inner scroll region so the top fade can live on the shell while the controls and pinned report footer scroll independently underneath it.
    - Kept the fade tied to actual scroll state so it remains hidden at the top and only appears once content has moved underneath it.
    - Aligned the top fade styling with the footer fade treatment so both edges now use the same soft gradient language instead of mixing different blur and shadow effects.
    - Removed the extra top-fade DOM node and its layout footprint so the first control group sits flush at the top again without introducing a visible gap.
    - Made the inner scroll region a full-height flex column so the `Report a Problem` footer now stays anchored to the bottom even on shorter control sets.
- **[2026-04-15] Top Sidebar Fade Reintroduced As A Scroll-Only Overlay**:
    - Reimplemented the top sidebar cue as a pseudo-element on the sidebar shell instead of a real DOM layer, avoiding layout interference with the first controls.
    - The fade now stays fully hidden at the top and only appears after the sidebar has actually been scrolled, making it a true scroll indicator instead of a permanent band.
- **[2026-04-15] Mobile Marquee Hero Now Prioritizes The Main Lockup Below 550px**:
    - Added a dedicated narrow-screen hero layout for `marquee-ui.html` that hides the `Made in RCOS` credit below `550px` so the poster composition does not collapse into cramped secondary text on phones.
    - Recentered the RPI mark and `The Bar Generator` lockup and switched the hero scale math to mobile-specific dimensions at that breakpoint so the main title can expand to the available device width instead of shrinking against the desktop credit layout.
    - Tightened the mobile hero box and added narrower-screen typography sizing for the title lockup so the centered group keeps its intended prominence without cutting off `Generator` on small devices.
    - Reworked that narrow-screen behavior again so the lockup now scales from the measured width and height of the existing left-aligned RPI/logo title group itself, preserving the desktop padding rhythm instead of relying on separate mobile font sizing or ad hoc box dimensions.
    - Restored the larger-layout bottom breathing room inside that measured mobile lockup by adding back the same bottom gap beneath the title group instead of collapsing the lockup box tightly around the text.
- **[2026-04-15] Marquee Credit Enters A Compact Layout Before Narrow-Width Clipping**:
    - Updated the experimental `marquee-ui.html` hero scaling logic so the lower-right RCOS credit switches into a compact placement once the shared hero cluster shrinks past a defined threshold.
    - Lifted the credit block upward and slightly inward in that compact state, and allowed the byline to wrap instead of clipping off the right edge on smaller viewports.
- **[2026-04-15] Sidebar Report Action Pinned As A Persistent Utility Rail**:
    - Converted the `Report a Problem` control into a sticky sidebar footer so it remains available even while parameter panels scroll.
    - Added a soft top edge fade above the pinned footer using the same dropdown scroll-fade visual language, so controls can disappear under the report rail without a hard cutoff.
    - Removed the top sidebar fade entirely after testing; the clean header edge works better and avoids visual interference with the first controls.
    - Split the sidebar into a dedicated scrolling control region plus a pinned footer rail so the last controls can still scroll fully into view without being trapped under the report action.
    - Removed the forced full-height control stack so the sidebar now only becomes scrollable when the active UI genuinely overflows the available height.
- **[2026-04-15] Preview Runtime Controls Reworked Into A Consistent Transport System**:
    - Replaced the mixed preview toggles and transport buttons with a single button-based preview model so runtime controls now read as actions instead of configuration state.
    - `TICKER` and `WAVEFORM` now expose motion as `PLAY` / `PAUSE` transport buttons, while all audio-capable bars use the same button treatment for audio preview and sequence-capable bars expose a matching `RESTART` action.
    - Removed preview playback state from the sharable URL layer so exported and shared generator state reflects the designed bar, not transient runtime preview status.
- **[2026-04-15] Pan Tool Now Releases On First Outside Click**:
    - Reworked the viewport pan tool so any pointer-down outside the main canvas viewport immediately exits pan mode instead of consuming the user's first sidebar or workspace-control interaction.
    - Kept drag behavior unchanged inside the canvas area, including the active logo/bar repositioning flow, while leaving the pan button itself responsible for its own toggle state.
- **[2026-04-15] Sidebar Reporting And Parameter Randomize Controls Added**:
    - Added a persistent `Report a Problem` action to the bottom of the sidebar and implemented a native dialog-based reporting flow that captures the current style, theme, viewport, browser, timestamp, and sharable state URL automatically.
    - Wired the reporting flow so it is ready for a static-site-friendly Google Sheets pipeline through a deployable Google Apps Script URL, while preserving a clipboard fallback during local development until that endpoint is configured.
    - Added contextual randomize controls beside `RESET` inside each parameterized style panel so users can rapidly generate valid random variations without changing bar style, color theme, or preview-state toggles.
- **[2026-04-15] Header Added Direct Repository Shortcut**:
    - Added a dedicated GitHub icon action to the main header so the project source is reachable as a secondary utility without competing with the primary `Download Asset` CTA.
    - Placed the repository shortcut inside the existing right-side action cluster between download and the sidebar toggle, keeping the brand lockup clean and aligning the new link with the same bordered icon-control treatment already used in the header chrome.
- **[2026-04-15] Runtime Preview Controls Standardized Across Audio And Animated Bars**:
    - Reworked `BINARY`, `TICKER`, `WAVEFORM`, `MORSE`, and `MUSIC` so style-local runtime actions now live in a consistent `PREVIEW` section instead of being scattered between inline rows and full-width badges.
    - Promoted animation pause/play to the shared workspace toolbar with a real global playback button, keeping `SPEED` as a waveform parameter while removing the old waveform-only visible animate toggle.
    - Replaced large runtime badges with compact status chips, kept persistent audio toggles only for continuous-preview styles, and converted `MUSIC` to transport-style `PLAY` and `RESTART` behavior instead of a hidden persistent audio mode.
- **[2026-04-15] Runtime Controls Simplified And Reset Added Per Style**:
    - Removed the bottom workspace playback control again so the floating toolbar returns to view-only actions such as zoom and pan instead of mixing viewport and style-preview responsibilities.
    - Simplified preview UI by stripping out passive status bubbles like `LIVE`, `SPACEBAR`, and `SEQUENCE`, and by letting transport buttons and toggles communicate state directly.
    - Added a lightweight `RESET` action inline with each dynamic `PARAMETERS` header so each style can quickly return to its own default values without resetting the whole generator.
    - Moved motion pause/resume back into the relevant sidebar styles (`TICKER` and `WAVEFORM`) so preview controls now live with the parameters they affect.
    - Unified audio interaction across preview-capable styles by giving `MORSE` and `MUSIC` the same explicit audio toggle pattern as the other audio bars, while leaving their play/restart controls as secondary transport actions.
- **[2026-04-15] Toggle Active Colors Aligned With Theme Identity**:
    - Made the active toggle track and hover-ring tokens explicit for the chromatic themes so `RED`, `BLUE`, and `GOLD` now reliably use their own theme color instead of falling back to a generic red on-state.
    - Kept the neutral themes contrast-aware by preserving specialized active-toggle treatments for `WHITE`, `SILVER`, and `GRAY`, and explicitly setting `BLACK` to use a black track with a light knob for legibility.
- **[2026-04-15] Slider And Toggle Interaction States Made Contrast-Aware**:
    - Added universal slider thumb hover and focus treatment using a ring/halo and slight scale change so neutral themes like `BLACK` and `WHITE` still show meaningful interaction feedback even when the fill color barely changes.
    - Split toggle active styling into dedicated track, border, knob, and ring tokens instead of relying on the raw theme accent color alone.
    - Tuned `WHITE`, `SILVER`, and `GRAY` so enabled toggles now use stronger active tracks, darker knobs, and clearer focus/active contrast on their darker UI surfaces.
- **[2026-04-15] Added Three Reference Bar Families And Reworked Music Styling**:
    - Added selectable `LINES`, `POINT CONNECT`, and `TRIANGLE GRID` bar styles to the main generator, each with a matching lightweight variant control derived from the corresponding reference SVG family under `assets/bar references/`.
    - Implemented shared geometry helpers for those styles in `js/utils/barPattern.js` so live rendering, header previews, and exported SVG bar output all use the same rect/line construction.
    - Reworked the `MUSIC` bar renderer to use filled circular note heads on a five-line staff closer to `assets/bar references/Style=Music.svg`, replacing the previous stem-and-flag-heavy notation treatment and keeping note placement constrained inside the bar.
    - Added regression coverage for the new reference-style geometry helpers and serialization paths.
- **[2026-04-15] Waveform Envelope Controls Constrained To Brand Bar Bounds**:
    - Reworked waveform envelope center-offset handling so shifting the waveform center now compresses the usable amplitude toward the nearest edge instead of letting the filled waveform escape the official bar height.
    - Locked the waveform envelope `WAVES` control to whole-number steps from `1` through `10`, removing the previous half-step states.
    - Narrowed the waveform envelope `CENTER OFFSET` control to a `-0.5` through `0.5` range and clamp legacy query-string values into that tighter window.
    - Passed the same envelope settings through live rendering, header preview SVG generation, and exported SVG bar output to keep waveform behavior consistent across the tool.
- **[2026-04-15] Looping GIF Export Added For Repeating Bar Styles**:
    - Added a conditional `LOOPING GIF` download action to the main asset menu and limited it to the repeat-safe bar styles: `RULER`, `TICKER`, and `WAVEFORM`.
    - Implemented a dedicated loop-planning utility so ruler and ticker exports translate by one exact repeat cell and waveform exports capture one exact phase cycle, preventing visible seams when the GIF restarts.
    - Vendored a local copy of `gif.js` under `third_party/gif.js` so animated exports work without a CDN dependency and documented the addition in the repo's third-party notices.
- **[2026-04-15] Remaining Reference Bar Styles Added**:
    - Added the remaining production bar families from `assets/bar references/` to the public generator: `CIRCLES GRADIENT`, `GRADIENT`, `GRID`, `TRIANGLES`, `FIBONACCI SEQUENCE`, `UNION`, and `WAVE QUANTUM`.
    - Kept live canvas rendering and exported SVG output on the same shared geometry helpers so each new style stays consistent between preview and export.
    - Added selector controls for the reference families that expose multiple documented variants, while leaving `SOLID` as the existing equivalent of the default bar treatment instead of duplicating it as a separate style.
    - Corrected the first-pass `FIBONACCI SEQUENCE` and `UNION` helpers so Fibonacci now renders as separated weighted segments instead of a visually solid fill, and Union now uses repeated modular scalloped blocks instead of circular cutouts extending below the bar.
- **[2026-04-15] Organization Bar Style Added For RPI Flying Club**:
    - Added an `ORGANIZATIONS` section to the `BAR STYLE` dropdown between the main production styles and the `UNDER CONSTRUCTION` group.
    - Introduced a functional `RUNWAY - RPI FLYING CLUB` bar style with no extra parameter controls so it behaves like a real selectable/exportable bar pattern rather than a placeholder.
    - Derived normalized runway geometry from `assets/bars/bar-competition_runway.svg` so the style renders with the active foreground color in the live canvas, header preview, PNG export, and SVG export.
- **[2026-04-15] Dropdown Menus Added Scroll-Aware Edge Fades**:
    - Reworked the custom-select menu shell so scrolling now happens inside a dedicated viewport rather than on the outer bordered container.
    - Added intelligent top and bottom gradient blur fades that appear only when additional dropdown options exist above or below the current scroll position.
    - Kept the grouped `UNDER CONSTRUCTION` style section compatible with the new viewport and fade treatment so long menus feel intentional instead of abruptly clipped.
- **[2026-04-15] Style Selector Grouped Experimental Modes And Removed Matrix**:
    - Removed the `MATRIX` bar style from the public generator UI and from the active style-selection logic so it no longer appears in the main dropdown or resolves as a selectable mode.
    - Added an `UNDER CONSTRUCTION` section to the custom `BAR STYLE` dropdown and moved `MUSIC`, `DATA GRAPH`, and `TRUSS` beneath the standard production-ready styles.
    - Updated the custom-select renderer to preserve grouped dropdown headings in the styled menu rather than flattening all `<option>` entries into one undifferentiated list.
- **[2026-04-15] Header Controls Refined To Match Workspace Chrome**:
    - Tightened the main header action cluster so the `Download Asset` button and sidebar toggle now share the same bordered control treatment, spacing rhythm, and restrained hover behavior.
    - Reduced the visual weight of the sidebar toggle icon while preserving a comfortable tap target, helping the right-side controls sit more naturally against the live header logo lockup.
    - Added an explicit expanded/collapsed visual state and matching accessible label updates for the sidebar toggle so the header control accurately reflects whether the design-controls panel is open on both desktop and mobile.
- **[2026-04-14] Color Theme System Normalized Around Exported Mark Color**:
    - Reworked the generator theme model so the selected color theme name now refers to the actual exported RPI mark color first, with the UI family indicated in the visible dropdown labels.
    - Split the themes into consistent light-UI and dark-UI families so high-value light marks such as White, Silver, and Gray render on supportive dark workspace surfaces, while Black, Red, Blue, and Gold use lighter interface treatments.
    - Removed the visible `INVERTED` option from the current theme selector and kept legacy query-string values compatible by normalizing old color-mode aliases onto the new theme names.
    - Introduced shared semantic UI tokens for headers, controls, hover states, sliders, toggles, menus, and workspace chrome so each theme applies color with the same interaction logic instead of bespoke per-component overrides.
    - Simplified the visible theme labels back down to the exported mark color names only, and tightened dark-theme contrast for custom dropdown lists, slider values, slider thumbs, and the bottom workspace controls.
    - Fixed a custom-select synchronization bug where the color-theme trigger text and selected row could remain stuck on the initial option even after the active theme had changed, and moved floating control surfaces onto explicit per-theme tokens.
    - Gave the `SILVER` and `GRAY` header action controls slightly stronger surface and border contrast so the download button and menu toggle stay visible against their light metallic headers without changing the broader theme balance.
    - Made slider hover color an explicit theme token so the thumb now shifts to the active theme-appropriate mark color on hover instead of depending on a generic fallback.
    - Set the remaining non-white themes to explicit per-theme slider hover colors as well, avoiding browser-specific fallback behavior that could keep the hover thumb red outside the white theme.
- **[2026-04-14] Marquee Loop Rebuilt For Seamless Wrap**:
    - Reworked `marquee-ui.html`'s diagonal bar scene around individual repeated asset slots in each row, replacing the earlier grouped-segment seam logic with a slot-based layout that wraps across a full repeated pattern span so the visible bars keep their identities while moving.
    - Slowed the baseline marquee motion, clipped each diagonal lane to its own rotated row box to stop neighboring bars from bleeding across rows, and eased row hover slowdown through continuous velocity changes in the frame loop instead of snapping.
    - Added per-bar hover and press states so the active SVG now lifts on hover, glows red while pressed, darkens only during the press-hold state, and returns to normal on release.
    - Grouped the RPI logo, title, and RCOS credit into a shared hero cluster so the experimental poster layout scales proportionally as a unit on narrower desktop widths.
- **[2026-04-14] Header Brand Mirrored To Active Bar Logo**:
    - Replaced the static text `RPI` in the main header with a live mini SVG preview of the current generated RPI mark so the header reflects the active style, parameters, and color mode.
    - Updated the header title copy from `LOGO GENERATOR` to `THE BAR GENERATOR`.
    - Added lightweight preview refresh logic so animated bar styles in the main workspace stay reasonably in sync in the header without introducing a second full canvas.
    - Split header contrast styling away from theme accent fills so the mini mark and header controls remain visible when the active theme color is also used as the header background.
    - Applied that same colored-header treatment to the red theme so it now uses RPI Red in the header while preserving readable header controls through the shared contrast-layer tokens.
- **[2026-04-14] Expanded Main Generator Color Themes**:
    - Renamed the main sidebar controls to `BAR STYLE` and `COLOR THEME` for clearer wording in the generator UI.
    - Added new RPI brand color themes for Silver, Gray, Blue, and Gold, including matching rendered wordmark/bar colors in the main canvas.
    - Extended the interface theming system so each color mode now carries through the header, sidebar, page background, borders, inputs, buttons, dropdown states, and other accent surfaces instead of recoloring only part of the UI.
    - Removed the separate canvas backdrop so the RPI mark now sits directly on the workspace theme background instead of on a white block.
    - This earlier expansion was later normalized into the exported-mark-first theme model above, so `BLACK / LIGHT UI` and `WHITE / DARK UI` now replace the older light/dark naming while keeping legacy URLs compatible.
- **[2026-04-14] Main Generator Sidebar Moved To Right Edge**:
    - Updated the primary `index.html` workspace layout so the design-controls sidebar now anchors to the right side of the canvas on desktop.
    - Mirrored the mobile off-canvas behavior so the sidebar also slides in from the right instead of the left.
    - Kept the existing sidebar toggle behavior and control structure unchanged while aligning the main workspace chrome with the new placement.
- **[2026-04-14] Marquee Hover Reworked As Directional SVG Smear**:
    - Replaced the circular screen-space lens experiment in `marquee-ui.html` with a hover effect that acts directly on the moving bar SVG assets.
    - Each hovered bar now renders layered blurred ghost copies that are pulled toward the cursor, creating a directional smear closer to the provided morphing reference.
    - Kept the original SVG base visible and brand-faithful so the distortion reads as an additive deformation instead of fading the bar away.
- **[2026-04-14] Startup Style Prompt Added**:
    - Added a delayed startup prompt to `marquee-ui.html` that appears 5 seconds after load in the experimental marquee concept page.
    - Matched the prompt to the provided visual reference with a blurred black glass surface, official RPI red border, and red drop-shadow glow while keeping all text in the local `RPIGeist` family.
    - Kept the prompt visible until the user clicks a marquee bar asset to make a selection, so the onboarding cue does not disappear on its own.
- **[2026-04-14] Marquee Bar Hover Effect Added**:
    - Updated `marquee-ui.html`'s animated bar scene so hover interaction applies only to the moving bar assets, not to the title or credit copy.
    - Rebuilt each marquee asset as a layered wrapper with a masked blurred clone to create a cursor-local "blur near hover, sharp elsewhere" effect inspired by the experimental shader reference.
    - Kept the underlying SVG bars brand-faithful by reusing the existing official bar references rather than replacing them with new generative geometry.
- **[2026-04-14] Marquee UI Experiment Started**:
    - Created a standalone experimental page at `marquee-ui.html` so marquee exploration does not disturb the current generator interface.
    - Added a dedicated stylesheet and script for the poster-style concept layout using official RPI and RCOS assets.
    - Reused the existing reference bar SVG components in alternating marquee rows to match the diagonal motion study from the provided design reference.
- **[2026-02-17] Stability Pass In Progress**:
    - Fixed ticker width ratio label binding bug in `main.js` (`#ticker-width-ratio-display` now updates correctly).
    - Consolidated SVG bar pattern export logic into shared utility `js/utils/barPattern.js` to prevent drift between files.
    - Added waveform and circles SVG export parity in the shared generator (including circles grid/packing and fill/stroke variants).
    - Added regression tests for shared SVG bar generation and ticker width ratio display behavior.
- **[2026-02-12] Phase 2 Completed**:
    - Implemented Toast notification system for better UX.
    - Added "Copy Embed Code" feature for Frontify integration.
    - Fixed WebGL context handling and memory leaks.
    - Set up Jest testing framework.
    - Created Frontify integration strategy document.

## 6. Design Decisions
*   **Profanity Filter:** Implemented client-side for immediate feedback and user privacy.
*   **Font Format:** Chosen `.woff2` for optimal web performance.
*   **Global Access:** `ProfanityFilter` attached to `window` for p5.js compatibility.
*   **Frontify Integration:** Chosen external iframe embedding as the initial integration strategy for simplicity and speed.
*   **Export Consistency:** Introduced shared SVG bar pattern generator (`js/utils/barPattern.js`) as single source of truth for non-solid bar exports.

## 7. Known Issues / Notes
*   `main.js` relies heavily on global variables (p5.js pattern). Future refactoring might consider modularizing this.
*   Previously identified issue where ticker width ratio display failed to update has been resolved (2026-02-17).
*   Previously identified SVG export drift between `main.js` and `drawing.js` has been addressed by shared utility (2026-02-17).
