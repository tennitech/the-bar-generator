## Problem and change

Explain what happens before and after this change.

## Checks

List the checks you ran and their results. For UI changes, include phone/desktop and keyboard checks. For export changes, check the affected formats.

## Brand review

- Update `references/brand_review.json` for this exact changed state and run `npm run check:brand`.
- List affected review areas, full official source pages read, and the actual rendered/keyboard/contrast/motion/export evidence where relevant. Explain non-applicability.
- Record unresolved source conflicts and required approval evidence. Tests, merge permission and prior features do not establish formal RPI approval.
- For source captures or institutional assets, confirm the intended publication scope and actual redistribution permission before publishing them.

## References

Link the issue, source material, or permission records. Include images for visible changes. Note any changes to brand assets, bar meaning, dependencies, or licenses.

## AI contribution record

Applies to every AI service/tool. Use `none` if no AI was used. Otherwise add one row per materially contributing provider/model/configuration/role combination, including reviewers, model switches and thinking/effort changes. Preserve exact mode labels; use `unknown` for details the session does not expose. Follow [the project format](../references/ai_contribution_records.md).

Instruction-loading evidence (client/version, loaded project policy path and how verified; `unverified` if not inspected):

| Provider | Model identifier | Tool / version | Role and scope | Thinking mode | Reasoning effort | Other exposed settings / budgets |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Quality evidence

- Task scope/complexity and constraints:
- Check results, including failures and checks not performed:
- Reviewer findings and remaining defects (`pending` until reviewed):
- Human rework (`unknown` if not tracked):
- User acceptance (`pending` until explicitly tested and confirmed):

Before merging, preserve all contribution records as `AI-Assistance` trailers in the final squash or merge commit. See the record format; do not assume squash merging retains every individual commit trailer.
