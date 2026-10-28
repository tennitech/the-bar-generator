# Marquee, Home and secret animation — checkpoint, October 28, 2026

## Saved scope

Branch `codex/feat-marquee-home-secret`, based on published PR #57 `f8ad484`.
This is a WIP checkpoint for cloud continuation, not release-ready or deployed.
The previous combined batch and its source branches remain preserved. No owner
testing, asset approval, or institutional approval is inferred.

- `js/utils/marqueeCatalog.js` lists all 21 implemented routed families; no Music,
  Graph or Truss samples. Ten short repeating rows distribute the catalog.
- `assets/images/marquee-bars/` contains still SVG samples captured through
  `buildCurrentBarOnlySVG()`, the actual current shared preview/export geometry.
  Source seed is 1824; capture uses reduced motion and white mode, including the
  correct supplied Artemis white-source artwork. The existing splash monochrome
  filter displays the source black as white. Opacity and geometric tone remain.
- Root and alias splash backgrounds now use exactly `#000000`, without the old
  radial gradients. Body/browser chrome stay black.
- Header mark is a native `a href="./"` with accessible name `RPI — Home`; the
  routed base resolves it to the correct site root. No click/key interception.
- Header artwork ink is separate from UI text. Black artwork changed from the
  inherited `#111111` text value to exact black; white header art uses exact white.
- Secret: hold **THE BAR GENERATOR** title for **1.824–6 seconds**, release, then
  tap it twice within **2.4 seconds**. Mouse/touch share pointer handling; movement
  over 12px, cancellations, outside presses, focus loss and page hiding reset it.
  Keyboard route: type **rpi1824** with no modifiers outside editable/interactive
  controls, with no gap above 2.4 seconds. Ordinary clicks do nothing.
- Existing ASCII overlay retains one-time reduced-motion opt-in and focus rules.
  Close returns to the prior focused element, or the title. Title is not a normal
  Tab stop and does not advertise dialog state. Home never acts as the secret.
- Latest request implemented but not browser-verified: `animationPalette.js`
  carries captured selected artwork ink into animation and still view. Black
  gets an exact white contrasting overlay; other captured inks get black.
  Mission Control retains its existing `#f4f7fb` ink as a separate treatment.
  The splash stays black. Child frame still uses alpha-based shape masks, with
  projection color supplied independently. Iframe completion/ready/close messages
  now require exact same origin and the current frame's source window.

## Color evidence

Directly rechecked the official Color page in the in-app browser October 28:
https://brand.rpi.edu/document/4#/-/color (modified October 22, 2026).
Black #000000, white #ffffff, red #d6001c, blue #0081ce, gold #cdac38,
silver #e1edf5, gray #b9ccd8; link blue #006eb0 is a distinct link color.
Generator foregrounds and exported source inks already match. The genuine
mismatch was the inherited charcoal header artwork. Secondary options remain
disabled for new selection; restored legacy secondary states are preserved.
Mission Control, UI neutral surfaces and RCOS identity are not claimed to be
official standard artwork palette entries. Existing gradient/artwork and asset
permission questions remain open; no new external asset is introduced.

## Verification at checkpoint

- 356 unit tests pass in 37 suites after all code changes, including catalog
  coverage, palette validation and current overlay controller tests.
- `git diff --check` passes.
- Initial Chromium focused run verified all 21 decoded sources, exact black
  splash/no background image, bounded DOM, native modified-click new-tab and
  keyboard Home behavior. It initially failed an incorrect assertion that the
  default `colorMode=black` query survives canonicalization; corrected to inspect
  restored state.
- Corrected pre-disconnection run produced desktop Home/secret and touch Home
  screenshots in `/tmp/marquee-home-evidence`, but no final results JSON. Its
  outcome is unverified. The interrupted generation run did reach an updated
  `lunar.svg` file, but rerun all sample generation for certainty.
- No complete WebKit run, final source-vs-sample parity run, exported PNG pixel
  audit, full selected-ASCII-color browser run, or final visual review yet.
- Existing overlay smoke scripts now invoke the controller deliberately and
  expect focus at the title instead of clicking Home; dedicated new smoke tests
  cover the hidden gesture itself. These adapted browser scripts need reruns.

## Continue

Use Node 22+, Python and npm test dependencies in a fresh cloud checkout. Do not
commit the local node_modules symlink. Start `python3 scripts/test_server.py
--port 8779`, then run:

```sh
npm test -- --runInBand
RPI_SITE_URL=http://127.0.0.1:8779 node scripts/generateMarqueeAssets.js
RPI_SITE_URL=http://127.0.0.1:8779 node scripts/marqueeHomeSmoke.js
RPI_SITE_URL=http://127.0.0.1:8779 RPI_BROWSER=webkit node scripts/marqueeHomeSmoke.js
RPI_SITE_URL=http://127.0.0.1:8779 node scripts/browserSmoke.js
RPI_SITE_URL=http://127.0.0.1:8779 RPI_BROWSER=webkit node scripts/browserSmoke.js
```

The focused smoke includes all 21 images, native Home/new-tab/history, secret
false positives, repeat opening, one-time playback, touch and seven SVG/PNG color
checks. Chromium uses a real CDP touch hold; WebKit uses mouse hold in a coarse
viewport plus real touch taps because its driver has no held-touch API. Add
checks for editable-input/movement/timeout cancellation, forward history and
selected ASCII ink for all eight modes, repeated/lazy theme changes, still view,
explicit playback, cross-origin/wrong-source messages and actual frame color.
Inspect both screenshots and normal-speed reveal. Keep physical-device and
formal approval limits explicit. Review overlay CSS for any later overrides.

Shared integration should reconcile additive edits to `main.js`, `style.css`,
`generator/index.html`, route cache versions and `mobileBrowser.js` with the
parallel sidebar/export-width/Randomize/Reset and Mission Control-performance
branches. No main mutation, merge, deployment or branch deletion is authorized
by this checkpoint.
