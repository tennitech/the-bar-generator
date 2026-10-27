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

1. Read [AGENTS.md](AGENTS.md) for the stack, naming, accessibility, and brand rules. These rules also guide human contributions.
2. Fork the repo if you do not have write access. Work on a branch, not `main`.
3. Keep the change focused. Preserve the text filter and official logo geometry.
4. Run the tests. For UI changes, check the page in a browser at phone and desktop widths. Check keyboard access and exports affected by the change.
5. Open a pull request into `main`. State the problem, the change, and the checks you ran. Include images for visible changes.
6. Update `references/project_status.md` for material changes, architecture decisions, and known issues. Do not edit the historical project proposal.

The required Unit tests check must pass. Browser checks are manual on `main` today. The separate audit branch contains browser automation that needs review before use here.

## License and assets

Submit original work or work that you have permission to contribute under the project's MIT license. Retain third-party license notices. Do not add assets without a source and permission record. See [asset licensing notes](references/asset_licensing.md).

## Reviews and maintenance

Today, the project owner can merge a pull request after checks pass without a second reviewer. Other contributors can propose changes; access to a public repo does not grant push access. See [maintenance and handoff](references/maintenance_handoff.md) for the December transition.
