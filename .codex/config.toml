# Project Standards & Agent Rules

## 1. Documentation Maintenance
*   **Master Doc:** `references/project_status.md` is the single source of truth for high-level project status.
*   **Update Rule:** You **MUST** update `references/project_status.md` whenever:
    *   A phase is completed.
    *   A significant architectural decision is made (e.g., adding a library, changing directory structure).
    *   New known issues are discovered.
*   **Separation:** Do NOT modify the original `project_proposal.md`. It serves as the historic requirements document.

## 2. Filenaming Conventions
Adhere to the following casing standards for new files:

*   **JavaScript:** `camelCase.js` (e.g., `profanityFilter.js`, `main.js`).
    *   *Exception:* Service Workers or Worklets may use `kebab-case` if idiomatic (e.g., `pulse-worklet.js`).
*   **HTML:** `kebab-case.html` (e.g., `index.html`, `about-page.html`).
*   **CSS:** `kebab-case.css` (e.g., `style.css`, `mobile-layout.css`).
*   **Assets:**
    *   Directories: `kebab-case` (e.g., `assets/fonts`).
    *   Files: `kebab-case` preferred for images/icons. Keep original naming for simplified font matching if necessary (e.g., `RPIGeist-Bold.woff2`).
*   **Markdown:** `snake_case.md` or `kebab-case.md` (e.g., `project_status.md`).

## 3. Code Style & Structure
*   **Imports:** Prefer ES6 Modules (`import`/`export`) for new utilities.
*   **Global State:** If modifying `main.js` (p5.js sketch), acknowledge global state usage but prefer modular utilities where possible.
*   **Frameworks:** We are currently **Vanilla JS**. Do not introduce build tools (Vite, Webpack) or frameworks (React, Next.js) without explicit user approval and a documented reason in `project_status.md`.

# RPI Brand Guidelines & Development Rules

## 1. Core Identity
**RPI** (Rensselaer Polytechnic Institute) is a dynamic, generative brand centered on "Building the New."
*   **Motto:** "Why not change the world?" (implied) / "What if we tried this?"
*   **Archetype:** The specific "RPI" brand is **Curious, Humble, Genuine, Resilient, Offbeat, and Relatable**.
*   **Mission:** We cultivate exceptional problem-solvers. We don't just theorize; we build, test, break, and rebuild.

## 2. Naming Conventions
*   **Primary:** "RPI" (General use), "Rensselaer Polytechnic Institute" (Formal).
*   **Acceptable:** Using specific school names in lockups (e.g., "Rensselaer School of Engineering").
*   **PROHIBITED:**
    *   Do NOT use "Rensselaer" in isolation to refer to the university.
    *   Do NOT create new lockups for student clubs/projects (they use the primary logo alongside their name).

## 3. Voice & Tone
When generating text or creative copy:
1.  **Curious:** Ask "What if?" Focus on inquiry.
2.  **Humble:** Confidence without arrogance. Show, don't tell.
3.  **Genuine:** Sincere enthusiasm. No manufactured excitement.
4.  **Resilient:** Frame setbacks as learning opportunities.
5.  **Offbeat:** Celebrate unique, unexpected connections.
6.  **Relatable:** Accessible expertise. Down-to-earth.

**Avoid:**
*   Obvious statements (state the unconsidered).
*   Arrogance/Condescension.
*   Pretentiousness (academic snobbery).
*   Hyperbole (marketing fluff).

## 4. Visual Principles
### A. Spectrum: Background vs. Foreground
*   **Background (Supporting):** Formal, distraction-free. Low contrast patterns. Cool colors/Black/White.
*   **Foreground (Hero):** Attention-capturing (Social Media, Events). Full color activation. High contrast. Dynamic layouts.

### B. Authenticity
*   Use real imagery (students, labs) over stock.
*   Show the process/messiness of experimentation, not just polished results.

## 5. Logo Usage
*   **Primary Logo:** "RPI" letters with the "Bar" (underscore/calibration rod).
*   **The Bar:** A variable element. Can contain data viz, metrics, or patterns.
    *   *Constraint:* Height of bar = Width of lettering line. Fixed spacing.
*   **Clear Space:**
    *   Digital: Min 10px on all sides.
    *   Print: Min 0.25 inch.
*   **Minimum Size:**
    *   Digital: 60px width.
    *   Print: 0.75 inch width.
*   **Don'ts:**
    *   Never distortion or stretch.
    *   No outlines/shadows.
    *   No unapproved colors.
    *   Do not re-create the logo (use provided assets).

## 6. Development Constraints (From Project Proposal)
*   **Hard-coded Assets:** Users CANNOT deviate from official colors/fonts.
*   **Style:** "Graphic Art" – Duotones, Halftones, Abstract Patterns.
*   **Safety:** Profanity filter required for data visualizers.
*   **Tech Stack:** Vanilla JS / WebGL preferred. No heavy frameworks unless necessary.
*   **Accessibility:** WCAG compliance mandatory.

## 7. Technical Specifications
*   **Color Codes (from main.js):**
    *   **RPI Red:** `#d6001c`
    *   **White:** `#ffffff`
    *   **Black:** `#000000`
*   **Fonts:**
    *   **Logo:** Replica (Basis for the SVG assets).
    *   **UI/Body:** `RPIGeist` (Regular, Medium, Bold, Italic) and `RPIGeistMono` (Regular, Medium, Bold). Files located in `attached_assets/`.
*   **Assets:**
    *   SVGs located in `attached_assets/`.
    *   Shaders located in `shaders/` for the visual effects.