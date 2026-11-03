# Embedded export compatibility

November 3, 2026. Application implementation and fixture verification are
separate from production host permissions. A later read-only production
inspection confirmed missing iframe download and clipboard delegation; no host
settings were changed and this release does not claim to repair that block.

## Current behavior

- The public Share trigger, naming field, link-copy action and popover are
  removed. Existing snapshot URLs still restore controls, names, runtime seed
  and phase. No new sharing workflow or short-link service is exposed.
- Downloads and copying stay in the embedded generator. The user rejected
  leaving Frontify, so the new-tab export link and related guidance are removed.
  No popup permission is required by these export actions.
- Clipboard detection checks the current document's Permissions Policy when
  available. An explicit denial disables native image copy with an explanation.
  Missing/unsupported introspection is not proof of denial. Actual writes still
  handle browser rejection and retain same-page retry feedback.
- A download anchor has no browser completion callback. Embedded exports say
  **download requested** and retain the menu rather than claiming a successful
  download. The synthetic anchor click does not dismiss the menu as an outside
  click.
- SVG remains native `image/svg+xml` only when supported. PNG remains transparent
  `image/png`. No source-text, HTML, raster-for-SVG, deprecated clipboard command
  or permission bypass is introduced. Rendering, scientific model math, vector
  geometry and raster sizing are unchanged.

## Host-side requirements

The generator cannot grant itself permissions removed by its embedding host.
The inspected production iframe lacks download and clipboard delegation. Its
ancestor frames and HTTP policy headers also constrain any future solution;
no production host permission fix is claimed here.

- A sandboxed iframe needs `allow-downloads` for generated-file downloads.
- Chromium cross-origin image copying needs `clipboard-write` delegation on the
  iframe. A restrictive ancestor Permissions Policy can still deny access.
  This app writes only; clipboard-read delegation is unnecessary.
- Browser clipboard rules still apply: HTTPS (localhost is a test exception),
  focus/user activation, MIME support and user permission choices.
- The existing generator needs scripts and its normal origin for module fetches
  and export workers. Do not remove security restrictions wholesale.

A reviewed, administrator-managed **cross-origin** embed could use:

```html
<iframe
  title="RPI Bar Generator"
  src="https://tennitech.github.io/the-bar-generator/generator/solid/"
  allow="clipboard-write https://tennitech.github.io"
  sandbox="allow-scripts allow-same-origin allow-downloads">
</iframe>
```

This is a proposed configuration, not a change applied by this branch. Every
ancestor must permit the action; changing one iframe is not always sufficient.

## Frontify-specific research

Frontify's current iFrame block documentation lists URL, validation, height and
padding controls, but does not document download or clipboard permission
controls. This does not prove the deployed block has none, or establish whether
RPI uses the modern iFrame block or legacy Embed block.

Frontify supports private Brand SDK content blocks and demonstrates an external
embed in its Typeform tutorial. If the stock block cannot delegate the required
permissions, a small private content block wrapping the existing hosted
generator is an option to validate against the real parent policy. It would
avoid rebuilding the generator, but is not yet a verified production solution.
Developer mode enables local block testing; it is not evidence of an iframe
permission override.

The SDK's `downloadAsset` command accepts an existing Frontify `Asset`, not an
arbitrary generated Blob. It is not a ready-made SVG/PNG export bridge. No
Frontify configuration, installation, publishing or external outreach occurred.

## Fixture evidence and remaining limits

`node scripts/embedSmoke.js` serves a separate-origin local host with permitted,
blocked and ancestor-header-denied fixtures. It checks actual SVG/PNG/GIF
downloads, the absence of a blocked download, clipboard rejection/retry,
keyboard focus, no export popups, and 320/390/1440px menu layouts. No fixture
grants popup permissions. Chromium uses its native isolated test clipboard with
test-context permission grants; policy restrictions still apply. WebKit uses the
existing clipboard adapter approach, verifying payload preparation and UI, not
Safari OS clipboard permission or native paste.

These fixtures are not an authenticated test of RPI's Frontify configuration.
Physical devices, native-application paste, platform dialogs and formal RPI
approval remain unverified. No host permission settings were changed.

## Local verification record

The original implementation passed 507 unit tests in 46 suites and Chromium/
WebKit baseline, legacy snapshot, integration, frozen-export, clipboard and
icon checks. The same-page follow-up is checked separately below.

- Same-page follow-up: 506 unit tests in 46 suites passed. The revised
  Chromium and WebKit iframe matrices passed, including direct SVG/PNG/GIF
  downloads with no popup permission, denial/retry, request feedback, and narrow
  layouts. The first concurrent Chromium run crashed during GIF encoding; an
  isolated rerun passed. WebKit passed on its first run. Desktop and 320px
  screenshots were visually reviewed.
- `sharedFirstPaintSmoke.js` found an existing hidden Neural Network input label
  changing from `65` to `65%` during setup. The identical first-case failure was
  reproduced on untouched base `395ce422`. It is not a Share removal regression;
  the remaining cases in that script did not run. This branch does not mask it.

## Sources checked November 3, 2026

- [HTML iframe sandbox rules](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe): downloads and inherited restrictions.
- [Clipboard API security rules](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#security_considerations): secure contexts, Chromium permission delegation and browser differences.
- [Frontify iFrame block](https://help.frontify.com/en/articles/13671596-iframe-block): documented stock-block controls.
- [Frontify Brand SDK](https://help.frontify.com/en/articles/6114618-getting-started-with-the-brand-sdk): supported private content blocks and local testing.
- [Frontify Typeform tutorial](https://github.com/Frontify/typeform-block-tutorial): a custom React block embedding an external service.
- [SDK command registry](https://github.com/Frontify/brand-sdk/blob/main/packages/app-bridge/src/registries/commands/CommandRegistry.ts): `downloadAsset` accepts `Asset`.
