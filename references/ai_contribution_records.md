# Branch naming and AI contribution records

Adopted November 17, 2026. Applies only to this repository.

## Service-independent scope

All contributors follow AGENTS.md and this record format regardless of service:
Codex, Claude Code, Cursor, Antigravity, Grok Build, or another tool. These names
identify access tools/services, not proof of which model or provider was used.
Record the actual backend when exposed; automatic routing may leave it unknown.
Contributors remain responsible for reading the project policy when their tool
does not load it automatically. This policy introduces no global configuration
or automatic enforcement in external services.
See [AI tool setup and verification](agent_tool_setup.md) for native discovery,
the repository's adapters, and client-specific limits. Record the actual tool
and version used rather than assuming all clients of one service behave alike.

## Branch names

Use `<type>/<short-description>`, optionally `<type>/<issue-number>-<description>`
when a real issue exists. Allowed types and examples live in `contributing.md`.
Use the same convention for humans and AI tools; keep provider/model information
in the contribution record. Multiple models can work on one branch without a
rename. Existing branches and published history remain unchanged.

There is no single universal branch naming standard. GitHub recommends short,
descriptive names; GitLab supports issue-number naming, and Atlassian documents
type prefixes. This project chooses type prefixes because they describe the
work and already match its human contribution guide.

## Contribution record

For each PR, record every materially contributing provider/model/configuration/role combination
in the PR template, with enough scope to distinguish research, implementation,
test authoring and review. A tool is the access application, not necessarily the
model provider. A recommendation in AGENTS.md is not evidence of actual use.

- **Provider:** model provider, such as `openai`; use `unknown` if unavailable.
- **Model identifier:** exact session-reported ID when exposed. Preserve a
  display label if that is all that is known, and state that the exact ID is
  unknown. Do not invent a version, snapshot, or underlying model for auto mode.
- **Tool and version:** application or integration used, such as `codex`, and its
  exposed version. A service without an exposed version uses `unknown`.
- **Thinking mode:** exact exposed mode label, including explicit disabled/auto
  selections. Use `unknown` if unavailable, or `not-applicable` only when the
  setting is known not to apply. This records configuration, not hidden reasoning.
- **Reasoning effort:** exact exposed effort label, independently of thinking
  mode. Never infer one from the other or translate labels into a universal scale.
- **Role/scope:** what this contributor actually did; list separate rows for
  different roles, model switches, or configuration changes, including delegated
  work if used. Preserve earlier records instead of replacing them with the last mode.
- **Other settings:** exposed thinking/reasoning token budget, agent mode (such as
  plan or implementation), model snapshot, context limit, temperature, tool access,
  approval/permission mode, and relevant custom instruction or skill versions
  when known and material. These are observations, not required configuration
  changes. Record source commit and relevant local instruction changes when useful.
  Include units for numeric budgets. Unavailable values stay `unknown`; do not
  expose credentials, private paths, hidden reasoning, or conversation transcripts.

Update the record as work progresses. Use `none` for unassisted work; use
`unknown` for uncertain historical assistance. Do not fabricate attribution or
rewrite published commits to fill gaps. Disclosure records use, not copyright
ownership, formal approval, or a claim that a model authored every line.

## Durable commit metadata

Use a repeated `AI-Assistance` trailer, one line for each contribution record,
after a blank line at the end of the commit message. This key and value schema
are project-specific; Git provides the trailer mechanism, not an AI standard.

Each value has these fields in this order:

```text
AI-Assistance: provider=<provider>; model=<model-id-or-unknown>; tool=<tool>; tool-version=<version-or-unknown>; role=<role>; thinking=<mode-or-unknown>; effort=<effort-or-unknown>; settings=<settings-or-unknown>
```

Values must be single-line and contain no semicolons; separate different records
with repeated trailer lines. Use lowercase provider/tool/role slugs, retain exact
model ID spelling, and keep detailed scope in the PR. For example, this is an
illustrative format, not an attribution of this change:

```text
docs: clarify local setup

AI-Assistance: provider=openai; model=unknown; tool=codex; tool-version=unknown; role=documentation; thinking=unknown; effort=unknown; settings=unknown
AI-Assistance: provider=unknown; model=unknown; tool=unknown; tool-version=unknown; role=review; thinking=unknown; effort=unknown; settings=unknown
```

For explicitly unassisted work use `AI-Assistance: none`. Where assistance was
used but identities are unavailable, use the full fields with `unknown` values.
Apply records to the commits they describe; do not credit an unrelated model
on every commit. Do not create empty commits solely for attribution.

Before merging, compare the PR record with the final squash or merge message.
Include every material contributor, including research/review-only work, in that
final message. Squash commits must carry the union of records because individual
commit messages may not survive on main. Do not rely on GitHub's default message.
The PR contains detailed context; the Git trailers retain searchable attribution.

## Comparing outcomes

Use the PR's Quality evidence fields to record task scope/complexity, checks and
failures, reviewer findings, remaining defects, human rework and explicit user
acceptance. Distinguish test authoring from independently performed review.
Unreviewed or untested outcomes stay `pending`; untracked rework stays `unknown`.
Record later discovered regressions against the original PR when available.

Compare similar tasks and constraints. A multi-model PR is a joint result;
its outcome cannot establish which individual model caused a defect or improvement.
Treat thinking mode, effort, budgets, tool configuration and human involvement
as comparison context. Identical labels from different providers do not establish
equivalent reasoning budgets or behavior. Unknown settings limit comparisons.
Passing tests, lines changed, and a model label alone are not a quality ranking.
No automatic scoring, telemetry, new service or CI enforcement is introduced.

## Research sources

Reviewed November 17, 2026:

- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow): short, descriptive branch names and focused changes.
- [GitHub branch name guidance](https://docs.github.com/en/get-started/using-git/dealing-with-special-characters-in-branch-and-tag-names): simple names, slash structure and character restrictions.
- [GitLab branches](https://docs.gitlab.com/user/project/repository/branches/): optional issue-number naming.
- [Atlassian branching model](https://www.atlassian.com/blog/bitbucket/introducing-bitbucket-branching-model-support): feature/bugfix/hotfix/release type prefixes.
- [Git trailers](https://git-scm.com/docs/git-interpret-trailers): structured commit-message metadata and repeated keys.
