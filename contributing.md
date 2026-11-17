# Contributing

What if we tried this? Open an issue with the problem, the proposed change, and an example. Small fixes can go straight to a pull request.

## Run the project

Use Node.js 22 and Python 3. No build step is required.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test -- --runInBand
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/. Check for an existing server before starting another one.

## Submit a change

1. Read [AGENTS.md](AGENTS.md) for the stack, naming, accessibility, and brand rules. These rules apply to all contributors and AI services, even when a tool does not automatically load the file.
2. Fork the repo if you do not have write access. Work on a branch, not `main`.
3. Keep the change focused. Preserve the text filter and official logo geometry.
4. Run the tests. For UI changes, check the page in a browser at phone and desktop widths. Check keyboard access and exports affected by the change.
5. Open a pull request into `main`. State the problem, the change, and the checks you ran. Include images for visible changes.
6. Update `references/project_status.md` for material changes, architecture decisions, and known issues. Do not edit the historical project proposal.

The fast Unit tests check is the only required automated check. It runs only on ready pull requests targeting main. Use a draft pull request while work is in progress; marking it ready starts the check. New pushes to that ready pull request replace older runs. There is no duplicate test run after merge. Contributors and reviewers perform the relevant UI, keyboard, accessibility, motion, and export checks. Optional browser and motion scripts are available in [README.md](README.md); run them locally when useful. They do not run in CI and are not merge requirements.

## Prepare the complete release package

Before requesting publication or release approval, list the destination repository,
code changes, required project-status update, review images and other new files as
one package. Confirm that images contain only project UI and permitted content.
Request any missing publication permission for that complete package up front.
A project checklist documents the intended scope; it does not grant permission or
replace a required approval. If a step is blocked, report its exact file/action
and wait for the applicable approval rather than omitting required documentation.

Before committing transferred files, compare their Git blob/tree hashes with the
locally tested candidate. Resolve any mismatch before opening the PR. Coordinate
concurrent releases so additive documentation and cache-key changes survive.

## License and assets

Submit original work or work that you have permission to contribute under the project's MIT license. Retain third-party license notices. Do not add assets without a source and permission record. See [asset licensing notes](references/asset_licensing.md).

## Reviews and maintenance

Today, the project owner can merge a pull request after checks pass without a second reviewer. Other contributors can propose changes; access to a public repo does not grant push access. See [maintenance and handoff](references/maintenance_handoff.md) for the December transition.

## Branch and commit names

Use a separate branch for each new feature or change. Related fixes stay on that feature branch. When switching features, state the saved branch for any feature that is not complete and explicitly confirmed as tested by the user. Automated checks do not establish user testing. Start from the latest `main`:

```sh
git switch main
git pull --ff-only origin main
git switch -c fix/mobile-menu-focus
```

Use `<type>/<short-description>` with lowercase words and hyphens:

| Type | Use | Example |
| --- | --- | --- |
| `feat` | New behavior | `feat/new-bar-control` |
| `fix` | Bug repair | `fix/mobile-menu-focus` |
| `docs` | Documentation | `docs/local-setup` |
| `refactor` | Restructuring without a behavior change | `refactor/export-snapshots` |
| `test` | Test coverage | `test/svg-export` |
| `chore` | Dependencies or repository upkeep | `chore/update-playwright` |

Use this convention for both human and AI-assisted work. Do not add tool, provider, model, or personal prefixes. An existing issue number may follow the type, for example `fix/123-mobile-menu-focus`; do not invent an issue number. Use lowercase words and hyphens, keep names short, and avoid spaces, `testing`, and permanent `dev` branches. Existing branch names are historical and need no rename. Retain branches after merge unless the user explicitly requests deletion. Before deleting, report fresh ahead/behind counts, merge status, unmerged work, open pull requests, and unsaved changes.

Use a direct commit message. Prefer `fix: restore mobile menu focus` or `docs: explain local setup`. Use the same form for the pull request title. This is a writing convention; no commit-message tool is required.

Prefer squash merge for routine changes. A merge commit is suitable when the commit history is useful to retain. Update an existing pull request on its branch rather than opening duplicates.

## AI contribution tracking

Before starting an AI-assisted task, use [AI tool setup](references/agent_tool_setup.md)
to check how your client loads AGENTS.md. The repository includes compatibility
adapters; other clients use the canonical file natively or need explicit context.
Check the actual loaded files rather than relying only on the assistant's claim.

For AI-assisted changes in any service, fill in the PR template's contribution table with every materially contributing provider, exact model identifier when available, tool/version, role, thinking mode, reasoning effort and other exposed settings/budgets. Preserve exact provider labels; similarly named modes are not assumed equivalent across services. Record multiple models and configuration changes separately, including reviewers. Use `unknown` for unavailable identity/settings, and `none` for work with no AI assistance. Never guess a model from a product name or retrospectively label old work without evidence.

Preserve these records in `AI-Assistance` commit trailers, including in the final squash or merge commit. Record task scope, checks, reviewer findings, human rework and user acceptance in the PR so later comparisons have context. See [the record format, merge checklist and research sources](references/ai_contribution_records.md). This is a project convention, not a universal AI attribution standard.

## Review checks

Explain the behavior before and after the change and provide test evidence. Keep pull requests small enough to review. Add a regression test for a behavior repair when it gives useful coverage. Do not add tests that only repeat the implementation.

For a new dependency, explain why it is needed, retain its license, lock its version, and check runtime and maintenance costs. Keep the production stack in AGENTS.md. For new bar logic, record the meaning and scientific assumptions in references/bar_science_notes.md.

Changes to workflows must retain public-repo guards, standard runners, read-only permissions, time limits, and no cache or artifact storage unless the owner first approves a cost review. Do not use pull_request_target to execute contributor code or put secrets in tests. First-time fork contributors may need a maintainer to approve the workflow run; ask in the pull request if it has not started.

## Brand review

Use the dated source record and checklist in [RPI brand guidelines](references/rpi_brand_guidelines.md). Follow the solid-bar qualification for minimum logo size, the two student-club approval routes, and the distinction between free font use and redistribution rights. Include source and permission records for brand-related changes. Do not treat existing gradient or artwork options as evidence of approval.
