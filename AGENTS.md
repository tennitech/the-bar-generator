# RPI Logo Generator Agent Policy

This is the canonical agent instruction file for this repository.

If another local rule file disagrees with this file, `AGENTS.md` wins. Keep all other agent and rule files as references or supplements so the policy does not drift again.

## Scope Across Contributors And AI Services

These project rules apply to every contributor working in this repository,
regardless of AI provider, model, editor, CLI, or hosted service. This includes
Codex, Claude Code, Cursor, Antigravity, Grok Build, and other current or future
tools. The same branch, development, validation, documentation, approval,
provenance, and retention rules apply to all of them. Scope remains this project
folder; do not copy these rules into global settings for unrelated projects.

Contributors must read this file before work, even if their tool does not
automatically load it. Any tool-specific instruction file must point here rather
than duplicate the policy. Do not assume that a file's presence automatically
configures or enforces rules in every service. Follow higher-priority platform
constraints and report any conflict that prevents the project workflow.

See `references/agent_tool_setup.md` for the supported loading paths and session
verification steps. Keep compatibility adapters thin, and verify loaded context
after switching tools or changing instruction settings. A model's assertion that
it followed the rules is not proof that the tool loaded the files.

## Required Reading Before Edits

0. Read `references/brand_policy.md` and `references/brand_conflicts.md` for every task. Follow the source routes there and read the full applicable captured official pages before work. Brand requirements apply to every aspect of this generator and every deliverable, regardless of contributor or AI service. Source examples and existing code are not automatic approvals.
1. Read `references/project_status.md` for the current state and known issues.
2. For copy, design, pattern, or export changes, read the dated checklist in `references/rpi_brand_guidelines.md` and its relevant full sections.
3. For asset changes, read `references/asset_licensing.md` and the actual asset license or permission record.
4. For behavior or mathematical changes, read `references/bar_science_notes.md` and the relevant export references and source code. Confirm preview/export parity.
5. Read `contributing.md` for branch, test, and pull request conventions. Use `README.md` for development commands.

This file remains the canonical agent policy. `references/AGENTS.md` and older local rule files are supplementary references, not competing policy.

## Mandatory Brand Review For Every Change

- Follow `references/brand_policy.md` across algorithms, data, motion, audio, preview, header, exports, UI, copy, accessibility, media, documentation and release material. Its source archive separates official text, dated evidence, project applications and unresolved conflicts.
- Complete `references/brand_review.json` for the actual changed file state. Cover every review area, cite the required full source pages, explain non-applicability, record performed checks honestly, and document approval applicability. Read relevant science/export/asset records as well.
- Run `npm run check:brand` and the relevant tests/checks. `npm test` runs the brand guard first; required CI uses the same guard. Refresh the review fingerprint after further edits. Do not remove sources, weaken a check, invent an approval or relabel pending validation to make a change pass.
- If work depends on an unresolved source conflict or missing permission, stop that part and obtain the applicable documented decision. Preserve stricter app controls. This task's source capture is not formal RPI approval of the current generator or a license for unrestricted redistribution.
- Automated validation verifies coverage, integrity and current review records. It cannot guarantee scientific correctness, aesthetic judgment, photosensitivity safety or institutional approval. Perform and evidence the applicable rendered, keyboard, contrast, motion and export checks; distinguish those from user testing and formal approval.

## Feature Branches, User Testing, And Deletion

Scope: These rules apply only to this repository. They do not change global tool settings or rules for other projects.

- Use one feature branch for each PR. A thread can handle several tasks within that PR. Use `<type>/<short-description>` as defined in `contributing.md`, with the same naming for humans and AI tools. Do not add a tool, provider, model, or personal prefix. Use the base-selection rules below. Clarifications and repairs to the same feature stay on its existing branch.
- Before switching to a new feature, preserve the current work and tell the user where it is saved. Example: "The motion feature still awaits your testing. It is saved in `fix/animation-timing`." State whether the branch is local, pushed to GitHub, or linked to an open pull request. Verify the save state before reporting it.
- Omit that unfinished-feature note only when the earlier feature is complete and the user's response, read in context, confirms they tested it. Keep unconfirmed work available on its branch.
- Delete a local or remote branch only when the user explicitly asks for that deletion. A merge, completed feature, or passing test does not authorize deletion. Keep automatic deletion of merged branches disabled. Do not use `--delete-branch` or a cleanup command without explicit deletion authorization.
- Before an authorized deletion, fetch current remote refs and inspect the target branch and any checkout that uses it. Report the comparison branch, ahead/behind counts, merge status, unmerged commits, open pull requests, and any unsaved changes. Explain what work would be removed before deleting it. Do not discard unrelated or unsaved work.
- Verify the result after deletion and tell the user which local and remote branches were removed and which remain. If the requested deletion scope or loss of work needs a decision, ask for that decision; do not infer authorization for other branches.

## Thread Ownership And Concurrent Work

- Give each active thread exclusive ownership of its branch and worktree. Several issues and tasks can share that thread and PR. Independent threads use separate branches and worktrees, even when they change the same files.
- Before the first edit, verify the checkout path, branch, working changes and linked worktrees. Use the [thread setup procedure](contributing.md#parallel-work). Repeat after a resume, checkout change or handoff. This check confirms where the thread will write.
- For new independent work, default to `git fetch origin main`, then create the thread's branch and worktree from refreshed `origin/main`. An explicitly requested branch or revision takes priority. Use the client's worktree tools when available, or standard Git worktrees. Report fetch failures without claiming the base is current.
- If the client already created a worktree, verify its base matches refreshed `origin/main` or the user's requested base before edits. Preserve existing changes and continue existing tasks on their branches. Explain dependencies on unmerged work.
- Continue an existing branch only through a handoff after its previous writer has stopped. A clean checkout does not establish ownership.
- Record the owner thread, PR scope and state in the branch's local description. Include a thread ID when exposed. These notes are shared by linked worktrees. Update them at handoff and when the thread stops or awaits user testing. Published issues and PRs hold context across machines.
- Keep edits, commits, tests and previews within the thread's own worktree. Never switch branches, stash, reset or clean another thread's checkout. Do not bypass Git's branch checkout protection with force options.
- Give each preview a free port. Include its branch, URL and expiry in the handoff. Stop only previews started by that thread.
- Before merging, fetch current main and check related PRs or dependencies. Merge one PR at a time. Refresh integration, validation and the brand fingerprint if main changes. Preserve the other thread's intended behavior when resolving conflicts.

Ownership notes are advisory. Git cannot detect two chats editing the same directory. Separate worktrees provide the file isolation.

## Local Preview And User Testing

- For changes that affect the running site, generated bars, or exports, start a local preview from the checkout containing the work. Start it early when it helps reproduce the issue or check the baseline. Use it during development to test the changed routes and states in a browser. The brand guard and Jest suite run independently of the server.
- At handoff, confirm the affected route loads from the final checkout and leave that server running for the user. Share the exact URL, when it expires, and short steps to inspect the change. Follow the [local preview setup](README.md#local-preview-for-site-changes). If the session cannot provide a reachable live preview, state the limitation and give the command and route the user can open locally.
- Use the standard 30-minute timeout for agent-started previews. If a preview started early, check how much time remains and restart your preview when needed to give the user time to test. Attach the public PR URL when available so a confirmed merge ends the preview early. When you confirm a successful merge during the session, stop the preview you started if it is still running. Failed checks or a failed merge leave it available for debugging until the deadline.
- Report the browser and automated checks actually performed. Keep user acceptance pending until their response confirms they tested and accepted the relevant changes. Changes limited to documentation or tooling that do not affect the running generator do not require a live preview.

## Release Handoff

- Accept ordinary wording for user testing and merge authorization when the work, result, and intent are clear from context. One reply can cover both, and prior merge authorization still counts. For example, “That works now, go ahead” can cover both after a handoff that identified what to test and that the next step is merging. If one part is unclear, clarify only that part. Automated checks alone do not establish user testing.
- For site changes, record what the user tested and which revision they tested. After any update that affects the accepted behavior, repeat the affected checks and confirm acceptance again. Follow the [merge and release checklist](contributing.md#merge-and-verify-the-release) for final CI, issue tracking, and public-site verification.
- Start each user-facing PR, check, merge, or deployment status line with a square and a plain-text status. Use 🟩 for a verified success, 🟨 for queued, in progress, or awaiting review or verification, and 🟥 for failed or blocked. State what the status applies to. For example, a merge can be 🟩 Merged while its deployment is 🟨 Pending. Keep the text label so the meaning is available without color.

## AI Contribution Records

- Follow `references/ai_contribution_records.md` for the project-specific provenance format, regardless of AI service. Give each material contributor and configuration one PR entry with its roles and scope grouped together. Preserve separate entries for independent reviewers, delegated contributors, and changes to the model, tool, or material settings. Distinguish the model provider from the tool used to access it.
- Capture exact exposed labels at the start and when the configuration changes. Record thinking mode and reasoning effort separately, plus exposed budgets, agent mode, tool version, and other relevant development settings. Do not equate similarly named modes across providers.
- Use only identifiers and settings exposed by the session or explicitly supplied by the user. Summarize unavailable fields once in the PR. Do not infer a model from the app name, a recommended model, or an earlier chat.
- Use the same grouped records as `AI-Assistance` commit trailers, with the roles relevant to each commit. Before merging, ensure the final squash or merge commit preserves all contributing records, including review-only work. Do not rewrite published history to backfill unknown provenance.
- Keep quality evidence in the PR: task scope, checks and failures, reviewer findings, human rework, and confirmed user acceptance. Unperformed checks and acceptance stay pending. Provenance supports later comparison; it does not by itself measure model quality.
- These requirements apply only to this repository. Existing branches need no rename, and historical provenance must not be guessed.

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
  - Exception: tool-discovered instruction filenames retain their required casing,
    such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`; tool configuration files
    likewise retain their documented filenames.

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
  - contain artwork in the fixed design viewport; edge contact is welcome when natural to a pattern, but is not mandatory
  - owner clarification November 3: do not add artificial side strips, bottom baselines, outlines, or painted-bounds fitting to force edge contact; natural gaps, including temporary animation gaps, are valid and will be reviewed case by case
  - preserve scientific coordinates and fixed reference geometry; do not rescale motion per frame to force edge contact
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
- Regardless of the tool's own delegation defaults, use subagents for this project only when the user explicitly asks for subagents, delegation, or parallel agent work. Do not automatically invoke delegated review just because a tool offers it.
- Use subagents only when the token and coordination cost is justified. Parallel runs consume more tokens than comparable single-agent work.
- When delegating, define the split clearly:
  - what slice of work each subagent owns
  - whether the main agent should wait for all subagents or continue locally
  - what summary or output each subagent should return
- Have subagents return distilled summaries with relevant file references instead of flooding the main thread with raw logs.
- Model and reasoning selection is provider-independent:
  - Honor the contributor's selected model and settings. Do not switch providers/models, change reasoning budgets, or incur additional service costs solely to match an example or fill a provenance record.
  - For authorized delegation, use an available model appropriate to the task's ambiguity and risk. A smaller/faster model can suit bounded read-heavy work; complex review needs suitable reasoning capability. Respect the user's model and cost constraints.
  - Record actual provider/model, thinking mode, reasoning effort and material settings for every contributor/configuration as defined in `references/ai_contribution_records.md`. Never infer that equal effort labels mean equal capability across services.
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
