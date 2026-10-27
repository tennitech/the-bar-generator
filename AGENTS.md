# RPI Logo Generator Agent Policy

This is the canonical agent instruction file for this repository.

If another local rule file disagrees with this file, `AGENTS.md` wins. Keep all other agent and rule files as references or supplements so the policy does not drift again.

## Required Reading Before Edits

1. Read `references/project_status.md` for the current state and known issues.
2. For copy, design, pattern, or export changes, read the dated checklist in `references/rpi_brand_guidelines.md` and its relevant full sections.
3. For asset changes, read `references/asset_licensing.md` and the actual asset license or permission record.
4. For behavior or mathematical changes, read `references/bar_science_notes.md` and the relevant export references and source code. Confirm preview/export parity.
5. Read `contributing.md` for branch, test, and pull request conventions. Use `README.md` for development commands.

This file remains the canonical agent policy. `references/AGENTS.md` and older local rule files are supplementary references, not competing policy.

## Feature Branches, User Testing, And Deletion

Scope: These rules apply only to this repository. They do not change global Codex instructions or rules for other projects.

- Create a new branch whenever the user requests work on a new feature. Use the naming convention in `contributing.md`. Start from current `main` unless the feature needs unmerged work; explain that dependency. Clarifications and repairs to the same feature stay on its existing branch.
- Before switching to a new feature, preserve the current work and tell the user where it is saved. Example: "The motion feature still awaits your testing. It is saved in `codex/fix-animation-timing`." State whether the branch is local, pushed to GitHub, or linked to an open pull request. Verify the save state before reporting it.
- Omit that unfinished-feature note only when the earlier feature is complete AND the user has explicitly told you that they tested it. Automated checks, source inspection, a merge, silence, or approval without an explicit testing statement do not establish user testing. Keep unconfirmed work available on its branch.
- Delete a local or remote branch only when the user explicitly asks for that deletion. A merge, completed feature, or passing test does not authorize deletion. Keep automatic deletion of merged branches disabled. Do not use `--delete-branch` or a cleanup command without explicit deletion authorization.
- Before an authorized deletion, fetch current remote refs and inspect the target branch and any checkout that uses it. Report the comparison branch, ahead/behind counts, merge status, unmerged commits, open pull requests, and any unsaved changes. Explain what work would be removed before deleting it. Do not discard unrelated or unsaved work.
- Verify the result after deletion and tell the user which local and remote branches were removed and which remain. If the requested deletion scope or loss of work needs a decision, ask for that decision; do not infer authorization for other branches.

## Applying RPI's Feel To This Tool

These are repository applications of the official voice, design, and pattern rules, not new official quotations or a request to redesign the site.

- Be experimental and technically precise. Help people explore and understand meaningful systems.
- Be curious, humble, genuine, resilient, offbeat, and relatable. Use specific evidence and approachable language.
- Keep controls clear and calm so the generated bar can be expressive. Use red with purpose.
- Explain the real rule, data, or encoding behind a pattern. Document its source and assumptions.
- Show the process and useful failures. Make the recovery action clear.
- Use authentic work and imagery where appropriate. Avoid generic corporate or luxury styling, stock campus stereotypes, empty claims, forced slogans, and decorative complexity without a system.
- When a source conflicts with the app or policy, record the conflict for review. Retain stricter app controls until the owner resolves it. Do not infer formal approval from existing features or test results.

## Source Guides

- Primary reference provided by the user: `Client First Quick Guide (1).pdf`
- Client-First concepts adapted for this repo from Finsweet's official docs:
  - Core Structure strategy
  - Classes strategy
  - Utility class systems
  - Semantic HTML
  - Accessibility
- Official Codex subagent guidance:
  - `https://developers.openai.com/codex/concepts/subagents`
- Brand and project references already in the repo:
  - `references/rpi_brand_guidelines.md`
  - `references/project_status.md`

## 1. Documentation Maintenance

- `references/project_status.md` is the single source of truth for high-level project status.
- You must update `references/project_status.md` whenever:
  - a phase is completed
  - a significant architectural decision is made, such as adding a library or changing directory structure
  - a new known issue is discovered
- Do not modify `references/project_proposal.md`. It is the historical requirements document.

## 2. Filename Conventions

Adhere to the following casing standards for new files:

- JavaScript: `camelCase.js`
  - Exception: service workers or worklets may use `kebab-case` if idiomatic, such as `pulse-worklet.js`
- HTML: `kebab-case.html`
- CSS: `kebab-case.css`
- Assets:
  - directories use `kebab-case`
  - files should prefer `kebab-case` for images and icons
  - keep original naming where needed for official asset matching, such as `RPIGeist-Bold.woff2`
- Markdown: `snake_case.md` or `kebab-case.md`

## 3. Code Style And Structure

- Prefer ES modules with `import` and `export` for new utilities.
- If modifying `main.js`, acknowledge the existing p5.js global-state pattern but prefer modular utilities where practical.
- We are currently Vanilla HTML, CSS, and JavaScript with p5.js and WebGL. Do not introduce build tools or frameworks such as Vite, Webpack, React, or Next.js without explicit user approval and a documented reason in `references/project_status.md`.
- Preserve profanity filtering, accessibility, and brand compliance in all changes.
- When architecture or behavior changes materially, update the relevant markdown references, with `references/project_status.md` as the required minimum.

## 4. RPI Core Identity

`RPI` stands for `Rensselaer Polytechnic Institute` and is a dynamic, generative brand centered on "Building the New."

- Motto: "Why not change the world?" and "What if we tried this?" as implied framing
- Archetype: curious, humble, genuine, resilient, offbeat, and relatable
- Mission: cultivate exceptional problem-solvers who build, test, break, and rebuild

## 5. Brand Naming Conventions

- Primary naming:
  - `RPI` for general use
  - `Rensselaer Polytechnic Institute` for formal use
- Acceptable:
  - specific school names in approved lockups, such as `Rensselaer School of Engineering`
- Prohibited:
  - do not use `Rensselaer` by itself to refer to the university
  - do not create new lockups for student clubs or projects; they should use the primary logo alongside their own name

## 6. Voice And Tone

When generating text or creative copy:

1. Be curious. Ask "What if?" and focus on inquiry.
2. Be humble. Show confidence without arrogance.
3. Be genuine. Keep enthusiasm sincere.
4. Be resilient. Frame setbacks as learning.
5. Be offbeat. Allow unexpected connections.
6. Be relatable. Keep expertise accessible and grounded.

Avoid:

- obvious statements
- arrogance or condescension
- pretentiousness or academic snobbery
- hyperbole and marketing fluff

## 7. Visual Principles

### Background vs Foreground

- Background and supporting surfaces should be formal, distraction-free, and lower contrast, typically using cool colors, black, or white.
- Foreground and hero moments can be more attention-capturing, high contrast, dynamic, and fully activated.

### Authenticity

- Use real imagery over stock whenever imagery is involved.
- Show the process and experimentation, not only polished outcomes.

## 8. Logo Usage

- The primary logo is the `RPI` lettering with the bar.
- The bar is a variable element and may contain data visualization, metrics, or patterns.
- The bar must obey the official geometry:
  - use the official 500 × 36 px bar design area and scale it proportionally with the official vectors
  - keep spacing, placement, and letterform proportions fixed
  - use primitive geometry such as rectangles, ellipses, polygons, and lines
  - do not infer new numerical geometry from ambiguous prose about the width of lettering
- Any bars should be scientifically accurate.
- Update the project reference markdown files whenever bar logic, scientific assumptions, or bar-related export behavior changes.
- Prioritize function over form. It can look cool, but it MUST be accurate.
- Clear space:
  - digital: minimum `10px` on all sides
  - print: minimum `0.25in`
- Minimum size:
  - with a solid bar, digital: minimum `60px` width
  - with a solid bar, print: minimum `0.75in` width
  - complex patterns can require larger display sizes; do not invent a universal numerical minimum
- Do not:
  - distort or stretch the logo
  - add outlines or shadows
  - use unapproved colors
  - recreate the logo; use provided official assets

## 9. Development Constraints

- Hard-coded assets: users cannot deviate from official colors or fonts.
- Style direction: graphic art, including duotones, halftones, and abstract patterns where appropriate.
- Safety: profanity filtering is required for data visualizers.
- Tech stack: Vanilla JS and WebGL are preferred. No heavy frameworks unless necessary and approved.
- Accessibility: WCAG compliance is mandatory.

## 10. Technical Specifications

- Color codes:
  - RPI Red: `#d6001c`
  - White: `#ffffff`
  - Black: `#000000`
- Fonts:
  - logo basis: official provided logo assets
  - UI and body: `RPIGeist` and `RPIGeistMono`
- Current repo asset locations:
  - fonts: `assets/fonts/`
  - images and logo assets: `assets/images/`
  - shaders: `assets/shaders/`

## 11. Client-First System For This Repo

Client-First here means every new change should be easy for a client or new teammate to scan, reason about, and extend. The source guide is Webflow-oriented, so agents must apply the principles below to this vanilla HTML, CSS, and JavaScript codebase instead of copying Webflow conventions mechanically.

### Structure First

- For new or substantially reworked page shells, prefer a readable wrapper structure such as:
  - `body`
  - `.page-wrapper`
  - semantic `<header>`, `<main>`, and `<footer>` or a `.main-wrapper`
  - `section_[section-name]`
  - `.padding-global`
  - `.container-large`, `.container-medium`, or `.container-small`
- Keep `body` styles limited to app-wide typography, background, and viewport behavior. Put page-level layout on wrappers instead.
- Use semantic HTML tags whenever the meaning exists. Do not default to anonymous `div` wrappers.

### Utility Classes vs Custom Classes

- Use utility classes for reusable global patterns. Utility class names use dash-only syntax and no underscores, for example:
  - `padding-global`
  - `container-large`
  - `text-color-secondary`
- Use custom classes for component-, section-, or page-specific styling. New custom class names should use Client-First folder-style underscores, for example:
  - `app_header`
  - `app_sidebar`
  - `control_group`
  - `control_label`
- Use `is-*` or `has-*` only as state or variant classes layered on top of a base class.
- Do not create generic layout helper utilities such as `.flex-center`, `.grid-2`, `.row`, or `.col` unless the pattern is intentionally global and reused broadly. Prefer component-specific layout classes.

### Global Systems

- Keep design tokens centralized in `:root` for colors, spacing, radii, motion, z-index, and similar values.
- Reuse global spacing, container, and typography utilities before inventing new one-off values.
- If a value repeats or should change globally, promote it to a token or utility instead of hard-coding it again.
- Prefer `rem`-based spacing and text sizing for new UI work unless pixel units are required for logo fidelity, canvas math, or export accuracy.

### JS Hook Discipline

- Do not use styling utility classes as JavaScript hooks.
- Prefer IDs or `data-*` attributes for behavior.
- Keep state classes descriptive and reversible, for example:
  - `is-open`
  - `is-active`
  - `has-error`

### Legacy Migration Rule

- Existing hyphenated custom classes are legacy. Do not mass-rename the current codebase unless the task explicitly includes migration.
- All new classes and significant refactors must follow this Client-First policy.
- When touching an existing area, align adjacent markup and styles to the new system only when the change is low-risk and easy to verify.

### Accessibility In Client-First Work

- Prefer native interactive elements such as `button`, `input`, `label`, and `select` over `div`-based controls.
- Any custom interactive behavior must preserve keyboard access, visible focus, and correct ARIA state.
- Keep heading order, landmark tags, labels, and contrast sane.

### Brand Alignment During Refactors

- New Client-First structure must still obey all RPI brand rules in this file.
- Do not use Client-First as a reason to loosen logo, color, tone, or asset restrictions.

## 12. Subagent Workflows

Use subagent workflows to keep the main thread focused on requirements, decisions, and final outputs.

- Subagents help reduce context pollution and context rot by moving noisy intermediate work such as exploration notes, test logs, stack traces, and command output off the main thread.
- Prefer subagents for read-heavy and parallelizable work such as repo exploration, tests, triage, log analysis, document review, and summarization.
- Be more careful with write-heavy parallel work. Multiple agents editing code at once can create conflicts and coordination overhead.
- Codex does not spawn subagents automatically. Only use subagents when the user explicitly asks for subagents, delegation, or parallel agent work.
- Use subagents only when the token and coordination cost is justified. Parallel runs consume more tokens than comparable single-agent work.
- When delegating, define the split clearly:
  - what slice of work each subagent owns
  - whether the main agent should wait for all subagents or continue locally
  - what summary or output each subagent should return
- Have subagents return distilled summaries with relevant file references instead of flooding the main thread with raw logs.
- Default model and reasoning guidance:
  - use `gpt-5.4` with `medium` or `high` reasoning for the main agent and for ambiguous, multi-step, reviewer, or security-focused subagents
  - use `gpt-5.4-mini` with `low` or `medium` reasoning for faster exploration, read-heavy scans, large-file review, or supporting-document analysis
- Avoid subagents for tiny tasks, single-file edits, or blocking work that the main agent needs immediately to keep the critical path moving.
- The main agent remains responsible for overall direction, integration, conflict management, and final review.

## 13. Agent Checklist

Before making code changes, agents should check the following:

1. Does this change follow the documentation and status-update rules?
2. Does it preserve the approved stack, brand rules, accessibility, and profanity protections?
3. Can the implementation reuse existing tokens, utilities, or structure?
4. If a new class is needed, is it clearly a global utility or a local custom class?
5. If layout is changing, does the markup use semantic wrappers and readable section and container layers?
6. If JavaScript behavior is changing, are the selectors stable and independent from styling utilities?
7. If the user explicitly asked for delegation or parallel agent work, would a bounded subagent workflow improve focus, speed, or verification quality?
8. If architecture, policy, or known issues changed, was `references/project_status.md` updated?
9. For visual or behavior changes, were the relevant rendered states and exports checked? Were keyboard access, contrast, and reduced motion checked where relevant?
10. Does the completion report distinguish source inspection, automated checks, visual checks, and formal RPI approval? State only the validation performed and record open approval questions.
