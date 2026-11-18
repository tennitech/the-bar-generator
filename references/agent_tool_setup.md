# AI tool setup and instruction loading

Reviewed November 17, 2026. Scope: this repository only. Root `AGENTS.md` is
the single project policy; adapters contain imports or pointers, not copies.
All contributors follow that policy, whichever tool or model they use.

## Repository setup

| Tool / surface | Loading path in this repository | Important limit |
| --- | --- | --- |
| Cursor Agent | Root `AGENTS.md` natively; no `.cursor/rules` adapter needed. | Cursor also supports nested AGENTS.md. Inspect applicable rules in the actual client. |
| Codex | Root `AGENTS.md` natively; `.codex/config.toml` remains a policy pointer. | Override files and directory scope can change the loaded instruction chain. |
| Claude Code | Root `CLAUDE.md` imports `@AGENTS.md`. | Native AGENTS.md fallback depends on version, session and other instruction files; the import avoids relying on that fallback. |
| Gemini CLI | Root `GEMINI.md` imports `@./AGENTS.md`. | A custom `context.fileName` configuration can change discovery. No `.gemini/settings.json` is needed for the default filename here. |
| GitHub Copilot | `.github/copilot-instructions.md` points to root policy and includes a CLI-compatible `@../AGENTS.md` reference. | Support differs by editor, feature and agent. A Markdown link alone does not guarantee inclusion; explicitly attach/read AGENTS.md if needed. |
| Antigravity | Root `AGENTS.md` natively; existing tracked `.agent/rules/*.md` are thin, activated pointers. | Current docs prefer `.agents/rules`, accept legacy `.agent/rules`, and require valid trigger frontmatter in rule files. No directory migration or duplicate rule set is needed here. |
| Grok Build (xAI) | Root `AGENTS.md` natively; no `.grok` adapter needed. | Verify the actual rules loaded by this client; do not assume a similarly named third-party tool behaves identically. |
| Devin CLI | Root `AGENTS.md` natively; no additional adapter. | This statement covers Devin CLI, not every Devin/Windsurf product or release. |
| Other tools or older clients | Explicitly read or attach root `AGENTS.md` before work. | Verify the specific client/version before adding an adapter; do not infer support from a grouped third-party compatibility table. |

The names `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md`
intentionally follow tool discovery conventions. None changes
model selection, permissions, approval behavior, global settings or billing.

The existing `.agent/` ignore entry is retained. Its two rule files are already
tracked; new local files there are not automatically shared. `.gemini/` stays
ignored. Do not force-add private tool state or unignore these folders wholesale.

## Verify each working session

1. Open this repository as the project/workspace and confirm the working folder.
   Check the actual client/version and selected model/configuration.
   Read the [parallel work procedure](../contributing.md#parallel-work), inspect
   the current checkout and linked worktrees. Each active thread must own a
   separate branch and worktree. Read ownership notes before a handoff.
   For new independent work, fetch `origin main` and use refreshed `origin/main`
   by default. Honor an explicit branch or revision choice. Verify client-created worktrees before edits.
2. Inspect loaded instructions using the client's context/rules view or loading
   diagnostics. Claude Code offers `/memory`; Gemini CLI offers `/memory show`;
   Copilot CLI offers `/instructions`; Grok Build offers `grok inspect`.
   For other clients use their documented instruction/context inspection UI.
3. Confirm root AGENTS.md content is present, including the branch convention
   and AI contribution records, rather than just the adapter's filename.
   If expansion is absent or uncertain, explicitly read/attach AGENTS.md.
   A read log proves access, not continued inclusion in every request or compliance.
4. Read the required status and task-specific references. When working in a
   subdirectory, check applicable nested instructions; clients differ in how
   they discover and combine these. `references/AGENTS.md` is only a pointer.
5. Record the loading evidence in the PR alongside the provider/model, exact
   thinking/effort labels and material settings. Use `unverified` when loading
   was not inspected. Do not describe documentation review as a live-client pass.

Repeat after changing clients, instruction settings, or adapters. Reload context
or start a fresh session as appropriate; do not assume an existing session
notices edits automatically. If tool/platform rules prevent the project workflow,
report the conflict rather than claiming project policy can override them.

These files guide behavior. They do not technically enforce branches, tests,
provenance, review or approvals, and cannot expose hidden thinking settings.
Use [AI contribution records](ai_contribution_records.md) for attribution and
comparison limits. Do not infer the backend model from the editor or service name.

## Maintaining adapters

Change shared policy in root AGENTS.md. Keep per-tool files limited to loading
that policy. Avoid symlinks or generated copies that can break across platforms
or drift. Add tool-specific behavior only when necessary, with an official source
and a documented scope. Do not create a second Cursor or Grok rule set just to
repeat AGENTS.md. Antigravity's legacy pointers retain valid activation metadata.

## Official sources

The setup paths above were checked against official documentation on November
17, 2026. This is source verification, not execution in every tool/version.

- [Cursor rules](https://cursor.com/docs/rules): native root/nested AGENTS.md and project rules.
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): instruction discovery and overrides.
- [Claude Code memory](https://code.claude.com/docs/en/memory): imports, AGENTS.md fallback, version/session limits and inspection.
- [Gemini CLI context](https://geminicli.com/docs/cli/gemini-md/): imports, custom filenames and memory inspection.
- [Copilot support matrix](https://docs.github.com/en/copilot/reference/custom-instructions-support): editor/feature differences.
- [Copilot CLI instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions): repository instructions, file references and inspection.
- [VS Code instruction reference](https://code.visualstudio.com/docs/agents/reference/custom-instructions-reference): references do not guarantee inclusion across clients.
- [Antigravity rules](https://antigravity.google/docs/rules): native files, legacy directory support and activation metadata.
- [Grok Build project rules](https://docs.x.ai/build/features/project-rules): native AGENTS.md discovery and inspection.
- [Devin CLI rules](https://docs.devin.ai/cli/extensibility/rules): automatic root AGENTS.md loading.

## Validation of this change

Local checks cover adapter/import targets, Markdown links,
Antigravity activation metadata, Git trailer parsing, branch names and whitespace.
No other AI client was launched for acceptance testing. Full model identity,
thinking settings and file-loading behavior remain observations to record in
each contributor's real session. The app runtime and exports are unchanged.
