# Maintenance and December 2026 handoff

## Current operation

The repo is public and owned by tennitech. Kaden is the current administrator; d-kote has write access. These are the roles checked on October 27, 2026, not a permanent assignment.

Use branches and pull requests for all changes to `main`. The main ruleset requires the Unit tests check and resolved review conversations. It blocks force pushes and deletion. It requires no second approval while Kaden is the primary developer. No account is a required code owner today, so work does not depend on a personal approval.

GitHub Pages currently publishes the root of `main`. Merging a change to `main` can update the public site. Check the live site after a merge. Auto-merge is off; merged feature branches are deleted automatically.

## Tests and cost controls

Checks runs on pushes to `main` and on pull requests opened, reopened, or updated against `main`. There is no schedule. The older Site audit workflow is disabled to avoid duplicate runs. Actions are pinned to reviewed commit IDs; update those IDs when reviewing action upgrades. The Unit tests job uses a standard Ubuntu runner, read-only repository permissions, no saved checkout credentials, no cache, no artifact uploads, and a ten-minute limit. A newer run cancels an older run for the same pull request or branch. The job is disabled for private repos.

Standard runner compute is free for public repos under current GitHub pricing. This is not a guarantee of future pricing. Do not add paid runners, stored artifacts, caches, private-repo execution, or paid services without checking cost and owner approval. GitHub Pages has its own deployment process.

On October 27, 2026, GitHub billing showed no valid payment method and rejected creation of a repository-scoped $0 Actions budget. No payment method was added. Under current GitHub rules, usage beyond the free allowance is blocked without a valid payment method; larger paid runners are also blocked. The free public-repo test workflow remains enabled. If a payment method is added later, first configure a repository-scoped $0 Actions budget with Stop usage when budget limit is reached enabled, including any separate cache storage budget. Account billing controls are separate from repository files. Recheck these controls after transfer. If changing the repo to private, stop and review the workflow and required checks first; a skipped job is not evidence that tests passed.

## Before graduation

1. Ask the RPI sponsor to name the receiving organization, at least two continuing staff owners, and the next student maintainers. Obtain their agreement to own maintenance, access, and security reports.
2. Confirm software ownership and asset permissions. Complete references/asset_licensing.md. Keep valid copyright notices; do not assign ownership by editing a notice.
3. Review the eight-commit audit branch. Run its tests before merging. Add browser checks to the required test workflow only after they work on `main`. Remove its duplicate push/PR workflow triggers when integrating it.
4. Add the successors while Kaden is available. Have them submit, review, merge, and check one real site change.
5. Transfer the repo to the agreed RPI organization. Confirm that the organization permits public repositories and the required settings. Update local remotes, README links, issue contact links, and integrations. Git repo links redirect after transfer; GitHub Pages URLs do not automatically redirect.
6. Create a maintainers team. Give active maintainers write access and staff owners administrative control. Set organization default access to read. Require one approval from another maintainer on `main`. Add .github/CODEOWNERS using the real team name, including ownership of workflow and policy files. Do not make Kaden a required owner.
7. Check that rules, Unit tests, private vulnerability reports, Pages deployment, Actions permissions, and $0 billing controls work under the new owner. Limit any emergency ruleset bypass to continuing staff owners and document its use.
8. Inventory domain/DNS, hosting, Frontify embedding, secrets, accounts, and deployment credentials with the sponsor. Transfer project access, replace personal credentials, and test the live URL and embeds. Do not share a personal login.
9. Name a private conduct-report contact and a security-report owner. Record how students join, leave, and hand over maintenance each term.
10. Remove Kaden from required approvals, billing contacts, and administrative duties after the successors confirm the handoff. A repo transfer can retain the previous owner as a collaborator; remove or reduce that access if desired. Unwatch the repo if ongoing notifications are not wanted.

Do not remove the last active administrator before the new owners have tested access. If no successor accepts responsibility, agree with the sponsor whether to freeze changes or archive the repo. Tests alone cannot maintain a project.

## References

- [GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Repository transfers](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Spending controls](https://docs.github.com/en/billing/how-tos/set-up-budgets)
