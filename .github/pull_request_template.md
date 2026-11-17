## Problem and change

Explain what happens before and after this change.

## Checks

List the checks you ran and their results. For UI changes, include phone/desktop and keyboard checks. For export changes, check the affected formats.

For site changes, share the live local preview URL and steps at handoff. Record the steps in the PR so reviewers can repeat them from their own checkout.

## Brand review

- Update `references/brand_review.json` for this exact changed state and run `npm run check:brand`.
- List affected review areas, full official source pages read, and the actual rendered/keyboard/contrast/motion/export evidence where relevant. Explain non-applicability.
- Record unresolved source conflicts and required approval evidence. Tests, merge permission and prior features do not establish formal RPI approval.
- For source captures or institutional assets, confirm the intended publication scope and actual redistribution permission before publishing them.

## References

Link the issue, source material, or permission records. Include images for visible changes. Note any changes to brand assets, bar meaning, dependencies, or licenses.

Use `Closes #123` for each fully resolved issue. Use `Refs #123` for partial work and say what remains.

## AI contribution record

Applies to every AI service/tool. Use `none` if no AI was used. Otherwise add one bullet per contributor and configuration. Combine its roles and scope in that entry. Use separate entries for independent contributors and configuration changes. Follow [the project format](../references/ai_contribution_records.md).

Instruction-loading evidence (client/version, loaded project policy path and how verified; `unverified` if not inspected):

<!-- For each entry, record provider, model ID or display label, tool and roles.
Include exact thinking mode, reasoning effort, tool version and other material
settings when exposed. Summarize unavailable details in one note and specify
which entries it covers. -->

## Quality evidence

- Task scope/complexity and constraints:
- Check results, including failures and checks not performed:
- Reviewer findings and remaining defects (`pending` until reviewed):
- Human rework (`unknown` if not tracked):
- User acceptance and tested revision (use `pending` until confirmed, or `not applicable` with a reason):

Before merging, preserve all contribution records as `AI-Assistance` trailers in the final squash or merge commit. See the record format; do not assume squash merging retains every individual commit trailer.
