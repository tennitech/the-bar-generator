# RPI Logo Generator - Project Status & Master Documentation

**Last Updated:** 2026-03-24
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
- **[2026-03-24] Hidden Animation Prototype Added At `/animation`**:
    - Added a standalone experimental page at `/animation` so new experience ideas can be explored without coupling prototype motion work to the main generator shell.
    - Reworked the initial prototype from DOM-positioned text into a canvas-based glyph field so the page can support much denser motion and closer reference fidelity without choking the browser.
    - Introduced a cinematic RPI-first concept inspired by the supplied reference: a tilted motion field of encoded text, scanline depth, logo cutout handling, and centered official logo treatment.
    - Simplified the visual direction into a flat 2D composition with a white background, red text field, and no logo overlay so the prototype can focus purely on motion language and typography density.
    - Made the background language meaningful to the Institute by rotating among three content systems: measurement data, inquiry/experimentation language, and campus/research domains.
    - Kept the prototype hidden from the primary UI and implemented it as a static subdirectory route so it works cleanly with the repo's simple static-server workflow.
- **[2026-03-24] Embed-First UI Refactor For Frontify Context**:
    - Reworked the generator layout away from a persistent in-app left sidebar and toward an embed-friendly control dock, so the tool no longer visually competes with Frontify's existing page navigation.
    - Split canvas appearance from interface appearance: canvas color modes now affect only the artwork/canvas frame, while overall UI dark mode is a separate interface preference.
    - Simplified the control language by removing non-essential status copy and shifting the UI toward concise labels and direct controls.
    - Rebalanced typography toward `RPIGeist` for interface elements and reserved `RPIGeistMono` for smaller technical moments, reducing the developer-tool feel while staying inside the RPI type system.
    - Kept mobile access via an overlay control sheet and retained keyboard/focus handling for the compact controls experience.
- **[2026-03-24] Subagent Policy Aligned To Official Codex Docs**:
    - Added a dedicated subagent workflow section to root `AGENTS.md` based on the official OpenAI Codex subagents documentation.
    - Clarified that subagents help reduce context pollution by offloading noisy exploration, logs, tests, and summarization work from the main thread.
    - Added explicit guidance to prefer subagents for read-heavy parallel tasks, be cautious with write-heavy parallel edits, and choose model/reasoning settings by task depth.
    - Clarified that Codex should only use subagents when the user explicitly asks for subagents, delegation, or parallel agent work.
- **[2026-03-17] Client-First Policy Consolidation Completed**:
    - Added root `AGENTS.md` as the canonical repo instruction file so Codex agents launched from the repo root now receive the correct policy.
    - Adopted a repo-specific Client-First system based on the supplied quick guide, adapted for Vanilla HTML/CSS/JS instead of copied Webflow mechanics.
    - Merged the full legacy `project_standards` and `rpi-brand-guidelines` requirements into root `AGENTS.md` so no prior agent rules were dropped during consolidation.
    - Added the explicit bar-governance rule to `AGENTS.md`: bars must stay scientifically accurate, related reference markdown files must be updated, and function must win over form.
    - Converted `.agent/rules/*`, `references/AGENTS.md`, and `.codex/config.toml` away from duplicated rule text to lightweight compatibility references so instructions do not drift.
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
*   **Embed-First Controls:** Desktop controls should behave like a docked tool surface inside the Brand Hub content area, not like a second site sidebar; mobile may use an overlay sheet when space is constrained.
*   **Export Consistency:** Introduced shared SVG bar pattern generator (`js/utils/barPattern.js`) as single source of truth for non-solid bar exports.
*   **Agent Policy Source Of Truth:** Root `AGENTS.md` is now the canonical instruction surface for repo-scoped agents; compatibility rule files should reference it instead of duplicating policy text.
*   **Client-First Adaptation:** The project now applies a repo-specific Client-First system that keeps global utilities reusable, new custom classes underscore-scoped, JS hooks separate from style classes, and structural wrappers semantic and readable.
*   **Prototype Route Isolation:** Experimental experience concepts may ship as standalone static subdirectory routes, allowing direct URLs such as `/animation` without entangling the main generator's p5.js application shell.

## 7. Known Issues / Notes
*   `main.js` relies heavily on global variables (p5.js pattern). Future refactoring might consider modularizing this.
*   Previously identified issue where ticker width ratio display failed to update has been resolved (2026-02-17).
*   Previously identified SVG export drift between `main.js` and `drawing.js` has been addressed by shared utility (2026-02-17).
