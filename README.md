# The Bar Generator

[![Checks](https://github.com/tennitech/the-bar-generator/actions/workflows/checks.yml/badge.svg)](https://github.com/tennitech/the-bar-generator/actions/workflows/checks.yml)

A browser tool for Rensselaer Polytechnic Institute (RPI) bar designs. Choose a pattern, adjust its controls, and export an SVG or PNG. The asset menu also copies SVG and PNG images where supported. Ruler, Ticker, and Waveform also support looping GIF exports.

PNG and GIF exports share Standard (1000 px logo) and Large (2000 px logo) choices. Their complete canvases are 1160 × 762 and 2320 × 1524 px, including padding. SVG remains vector. GIF uses binary transparency; PNG preserves smooth partial alpha. See [export sizes, timing, and measured cost](references/transparent_gif_exports.md).

**[Open the site](https://tennitech.github.io/the-bar-generator/)** · **[Report a bug](https://github.com/tennitech/the-bar-generator/issues/new/choose)** · **[Contribute](contributing.md)**

## Project intent and reading map

The tool is a place to explore meaningful systems with technical precision. Keep the controls calm and clear so the generated bar can be expressive. Use RPI's curious, humble, genuine, resilient, offbeat, and relatable voice. Explain the pattern's actual rule and use specific evidence.

- [AGENTS.md](AGENTS.md): mandatory agent policy and reading order.
- [contributing.md](contributing.md): human workflow, branch names, tests, and pull requests.
- [RPI brand guidelines](references/rpi_brand_guidelines.md): dated official sources and detailed brand checks.
- [Project status](references/project_status.md): current state, decisions, and known issues.

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
RPI_SITE_URL=http://127.0.0.1:8000 npm run test:motion
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/transparentGifSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/patternExportSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/firstPaintSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/sharedFirstPaintSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/pageEntranceSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=firefox npm run test:browser
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit npm run test:browser
```

Keep the local server running for browser checks. Run the startup and entrance scripts one at a time; their screenshots and results are written to temporary evidence folders. Recorded-frame checks do not replace normal-speed visual review. Chromium is the default browser; the default test URL is `http://127.0.0.1:8765`. On Linux, browser installation can also need system packages: `npx playwright install --with-deps chromium firefox webkit`.

Browser checks cover the 21 selectable styles, SVG downloads, a PNG file signature, five viewport sizes, text filtering, reduced motion, 2D fallback, and renderer failure states. They do not establish visual accuracy or full accessibility compliance. Check changed UI, keyboard controls, touch behavior, and exports by hand. Playwright WebKit is not a test of the Safari app.

## Clipboard copies

Open **Download Asset** for **Copy SVG** and **Copy PNG**. Copy SVG writes only native `image/svg+xml` vector content. If the browser cannot copy that format, the action reports **SVG copy unavailable** and **Download SVG** remains available. There is no source-text fallback or silent PNG substitution. Copy PNG preserves alpha and uses the selected raster size. Copies capture the current pattern, phase, color, title, and size before asynchronous work. Receiving apps must accept the copied format; browser support alone does not guarantee destination-app paste acceptance.

Copy requires HTTPS or localhost and a user click. If a browser blocks it, focus the page and retry or use a download. No persistent permissions or clipboard reading are requested by the app. See [clipboard support and verification limits](references/clipboard_exports.md).

```sh
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/clipboardSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit node scripts/clipboardSmoke.js
```

These checks use Chromium's isolated headless clipboard for real MIME readback. WebKit uses a test adapter to avoid the system pasteboard; it validates encoded payloads and UI, not native Safari paste acceptance.

## Preview zoom

100% fits the complete mark to the available preview area. Enlarge up to 400% to inspect the bar. Use the − / + buttons, enter a percentage, or scroll over the preview. Drag while enlarged. Fit or the 0 key restores the full mark; + and − also work outside text controls. Two-finger pinch inside the viewer enlarges the artwork; pinch outside it and browser keyboard zoom enlarge the page.

Zoom is relative to the current viewport and does not change downloads. The same 100% setting can be larger on a desktop than on a phone. Check the final placement size separately before using a complex bar pattern.

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

`main` requires a pull request, the passing Unit tests check, and resolved review conversations. During primary development, a second approval is not required. Prefer squash merge for routine changes. Retain branches unless the user explicitly requests deletion; first report ahead/behind counts, merge status, and unmerged or unsaved work. Use a merge commit when retaining a reviewed multi-commit history is useful. No permanent development branch is needed.

## Automation and deployment

The Checks workflow runs the fast unit tests only on ready pull requests targeting `main`. Feature branch pushes without a ready pull request and draft pull requests do not run tests. Marking a draft ready starts the check. Merging does not repeat the same tests. It does not install browsers or run UI tests. There is no scheduled run. Replaced runs are cancelled and each job has a five-minute limit.

Contributors and reviewers perform the relevant browser, keyboard, accessibility, motion, and export checks. The browser and motion scripts above are optional local tools for changes that need them; they are not merge requirements.

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

Additional focused rendering, sharing and interaction checks:

```sh
RPI_SITE_URL=http://127.0.0.1:8000 npm run test:integration
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/triangleShareSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/shareSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/geometrySmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/geometryEdgesSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/quantumIntegrationSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/firstPaintSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/pageEntranceSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/headerMotionSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/introLifecycleSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/iconsSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/exportSnapshotSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/urlStateSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/colorPickerSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 node scripts/selectorSmoke.js
```

`test:integration` checks real triangle controls, downloaded SVG equality after
share restore, rendered header/raster bounds, and same-document packing seeds.
`RPI_BROWSER=webkit` selects WebKit for the integration and geometry scripts.
These remain optional local checks; the fast unit suite is the only CI merge check.
