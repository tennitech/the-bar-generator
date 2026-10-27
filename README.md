# The Bar Generator

[![Checks](https://github.com/tennitech/the-bar-generator/actions/workflows/checks.yml/badge.svg)](https://github.com/tennitech/the-bar-generator/actions/workflows/checks.yml)

A browser tool for Rensselaer Polytechnic Institute (RPI) bar designs. Choose a pattern, adjust its controls, and export an SVG or PNG. Ruler, Ticker, and Waveform also support looping GIF exports.

**[Open the site](https://tennitech.github.io/the-bar-generator/)** · **[Report a bug](https://github.com/tennitech/the-bar-generator/issues/new/choose)** · **[Contribute](contributing.md)**

## Requirements

- Node.js 22 and npm for tests. The `.nvmrc` file selects Node.js 22 if you use nvm.
- Python 3, or another static HTTP server, for local development.
- A current browser. The generator uses WebGL when available and falls back to 2D canvas.

The site uses HTML, CSS, JavaScript, p5.js, and Web Audio. There is no build step or application framework. npm installs test tools, not site runtime files.

## Quick start

```sh
git clone https://github.com/tennitech/the-bar-generator.git
cd the-bar-generator
npm ci --ignore-scripts --no-audit --no-fund
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://127.0.0.1:8000/). The root page is the bar picker. Open `/generator/solid/` for the generator or `/animation/` for the animation prototype. Check for an existing project server before starting another one. If port 8000 is in use by another project, choose another port.

Serve the files over HTTP. Do not open HTML files with `file://`; routed pages and asset loading need HTTP. No environment variables or credentials are required for local use.

## Tests

```sh
# Unit tests
npm test -- --runInBand

# Install browser binaries once, then run browser checks
npm run test:browser:install
RPI_SITE_URL=http://127.0.0.1:8000 npm run test:browser
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=firefox npm run test:browser
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit npm run test:browser
```

Keep the local server running for browser checks. Chromium is the default browser; the default test URL is `http://127.0.0.1:8765`. On Linux, browser installation can also need system packages: `npx playwright install --with-deps chromium firefox webkit`.

Browser checks cover the 21 selectable styles, SVG downloads, a PNG file signature, five viewport sizes, text filtering, reduced motion, 2D fallback, and renderer failure states. They do not establish visual accuracy or full accessibility compliance. Check changed UI, keyboard controls, touch behavior, and exports by hand. Playwright WebKit is not a test of the Safari app.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html`, `js/marqueeUi.js` | Bar picker and intro |
| `generator/` | Generator shell and style routes |
| `js/main.js`, `js/drawing.js` | p5.js preview, controls, and exports |
| `js/utils/` | Shared patterns, routes, text filtering, and controls |
| `css/` | Site styles and design tokens |
| `animation/` | ASCII animation page |
| `assets/` | Fonts, images, audio, and prototype shaders |
| `third_party/` | Vendored runtime code and licenses |
| `tests/`, `scripts/browserSmoke.js` | Unit tests and browser checks |
| `references/` | Project status, brand rules, audit evidence, and handoff |

## Contribution workflow

Read [contributing.md](contributing.md) and [AGENTS.md](AGENTS.md) before editing. Fork the repo if you do not have write access. Create a short branch such as `fix/mobile-menu-focus`, then open a pull request into `main`. Use `feat/`, `fix/`, `docs/`, `test/`, or `chore/` followed by a lowercase description with hyphens. Codex branches use `codex/<type>-<description>`, such as `codex/fix-mobile-menu-focus`.

`main` requires a pull request, passing Unit tests and Browser tests checks, and resolved review conversations. During primary development, a second approval is not required. Prefer squash merge for routine changes and delete the branch after merge. Use a merge commit when retaining a reviewed multi-commit history is useful. No permanent development branch is needed.

## Automation and deployment

The Checks workflow runs on pull requests into `main` and pushes to `main`. Unit tests run for every change. Browser tests run when runtime files, tests, dependencies, scripts, or workflow files change; documentation-only changes skip browser installation and execution. There is no scheduled run. Replaced runs are cancelled.

The test jobs run only for public repos on standard Ubuntu runners, with no caches or artifact uploads. See the [maintenance guide](references/maintenance_handoff.md) for billing controls and the December handoff.

GitHub Pages publishes the root of `main`. A merge to `main` can update the public site. Check the deployed site and affected exports after a merge. A repository transfer needs a separate Pages URL and embed check.

## Project policies

- [Code of conduct](code_of_conduct.md)
- [Private security reports](security.md)
- [Project status and known issues](references/project_status.md)
- [Maintenance and December handoff](references/maintenance_handoff.md)
- [Bar meaning and scientific assumptions](references/bar_science_notes.md)

## License and brand assets

Project software uses the [MIT license](LICENSE). Retain [third-party notices](THIRD_PARTY_NOTICES.md) and their license files. RPI trademark rights and bundled font, artwork, and audio permissions need separate review. See the [asset permission record](references/asset_licensing.md). The software license does not establish approval for every generated mark.
