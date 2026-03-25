# Frontify Integration Strategy

**Goal:** Seamlessly integrate the RPI Logo Generator into the RPI Brand Hub (powered by Frontify).

## 1. Integration Methods

### A. Frontify Asset Creation API
*   **Description:** Use Frontify's API to upload generated assets directly to a specific "Library" or "Workspace".
*   **Pros:** Keeps everything in one place; users don't need to download/upload manually.
*   **Cons:** Requires API keys/authentication handling (OAuth2); might be complex for a client-side only app.
*   **Feasibility:** Moderate. Requires backend proxy or secure client-side flow (if supported).

### B. Frontify "Finder" (Embed SDK)
*   **Description:** Frontify offers an SDK to open a "Finder" window to pick assets.
*   **Relevance:** Less relevant for *generating* assets, more for *consuming* them.

### C. Custom Metadata Block (Frontify Content Block)
*   **Description:** Develop the generator as a custom "Content Block" that lives *inside* a Frontify style guide page.
*   **Pros:** Ultimate seamless experience. The tool exists on the brand page itself.
*   **Cons:** Requires developing within Frontify's specific specialized framework (Terrific.js / React integration).
*   **Feasibility:** High effort, high reward.

## 2. Recommended Approach: "The iframe / External Link" (Phase 1 of Integration)
Given the constraint of "Stability First" and "Vanilla JS":
1.  **Host** the generator on a stable RPI subdomain (e.g., `design-tool.rpi.edu`).
2.  **Embed** via iframe or link directly from the Brand Hub navigation.
3.  **Manual Upload:** Users download the PNG and manually upload it to their Frontify libraries if needed.

### Embedded UI Constraint
When the generator is embedded inside the Brand Hub, it should behave like a compact tool surface inside existing page chrome, not like a standalone application shell.

- Avoid introducing a second persistent left navigation/sidebar inside the embedded experience.
- Prefer docked top controls on desktop and an overlay sheet on smaller screens when space is limited.
- Keep canvas/output controls scoped to the generator itself and assume Frontify already provides surrounding navigation context.
- Treat interface appearance separately from artwork/canvas appearance to avoid confusing the host platform's navigation with the generator's output options.

## 3. Next Steps
1.  Request API Documentation for RPI's specific Frontify instance.
2.  Determine if "Custom Content Blocks" are allowed in RPI's plan.
3.  Proceed with **Method B (External Tool)** for immediate launch, while researching **Method C (Content Block)** for V2.
