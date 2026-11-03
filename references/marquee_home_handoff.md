# Marquee, native Home and selected-color intro

## Runtime behavior

`js/utils/marqueeCatalog.js` lists all 21 implemented families; unfinished Music,
Data Graph and Truss are excluded. Ten short repeating rows use SVG stills from
`buildCurrentBarOnlySVG()`, the actual shared preview/export geometry. Samples
use authored default controls, reduced motion, white source mode and the
canonical initial packing seed 1. The Artemis still retains its supplied vector
source. The splash uses exact black, without a radial gradient.

The header mark is an ordinary `a href="./"` named `RPI — Home`; the routed base
resolves the site root. There is no click/key interception. Artwork ink is
separate from softer interface text neutrals, with exact black/white artwork.

## Deliberate intro gesture

Hold the title for 1.824–6 seconds, release, then tap twice within 2.4 seconds.
The compact Design controls heading supports the same pointer gesture. Movement
above 12 px, cancellation, outside presses, focus loss and page hiding reset it.
Keyboard users can type `rpi1824` without modifiers outside editable/interactive
controls, with no gap above 2.4 seconds. Ordinary clicks do not open the intro.
The title is not an extra normal Tab stop and Home never acts as the secret.

The intro captures the selected artwork ink. Black receives a white contrasting
surface; other inks receive black. Mission Control keeps its separate #f4f7fb
artwork ink. Reduced motion remains respected; deliberate one-time playback does
not persist an override. Close restores the appropriate visible prior focus.
Background sidebar handlers do not react to pointer input inside the modal.
Lazy loading can retry, unavailable session storage has a fallback, and frame
messages require the exact same origin and current iframe window.

## Verification and maintenance

```sh
RPI_SITE_URL=http://127.0.0.1:8000 RPI_MARQUEE_CHECK=1 node scripts/generateMarqueeAssets.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=chromium node scripts/marqueeHomeSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit node scripts/marqueeHomeSmoke.js
```

Omit `RPI_MARQUEE_CHECK` only when intentionally refreshing representative product
samples after reviewed default/geometry changes. Verification requires identical
SVG structure/text; numeric coordinates allow only 1e-10 reference-unit drift
for cross-host floating-point serialization. It never refits geometry or changes
the actual model. The Circles capture explicitly asserts the canonical seed.

Chromium's cached `page.url()` was stale for one native background-tab fixture;
actual document location, title, loaded home landmark and screenshot established
correct native navigation without an application workaround. Evidence and scope:
[feature validation](review-images/marquee-home/validation.md) and
[combined release QA](bar24_26_integration_qa.md).

Existing RPI, font, artwork and gradient approval questions remain open. Source
capture and passing software checks do not grant asset or institutional approval.
