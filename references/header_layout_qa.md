# Header title and export alignment — November 3, 2026

## Change

The product name uses the bundled RPIGeist Bold face at full contrast rather
than small, translucent, letter-spaced monospace. The complete name stays on one
line when space permits and becomes two deliberate lines below 641 CSS pixels.
It no longer uses an ellipsis or disappears on small phones. The optional GitHub
shortcut gives up its header space at that breakpoint; the Home link, controls
button and export action remain available.

Existing named snapshot links retain their document name on a smaller second
line. Only that optional document name may truncate, with the complete name
retained in the title attribute. It cannot displace or truncate the product name.
The official RPI artwork, pattern geometry, text filtering and exports are
unchanged.

The export group is last in both DOM and visual order. Its desktop width uses the
sidebar's usable width, including the one-pixel border. The Download/Learn
trigger, open menu and sidebar fields therefore share both horizontal edges.
Compact layouts keep the existing smaller trigger and viewport-bounded menu
rather than forcing a desktop sidebar's width into a phone header. The lunar
counter occupies the remaining header space and yields below 1101 pixels.

Header-fit detection recognizes the intentional multiline title and uses a
16-pixel gap before collapsing the export trigger. Startup and runtime use the
same value. No framework, library, asset, model or cache-token change is included.

## Measured baseline

At a rendered 1440 × 900 CSS-pixel viewport, the prior Download button extended
from x=1012 to x=1324 (312 pixels), while sidebar fields extended from x=1109 to
x=1420 (311 pixels). After the change, both the button and fields extend from
x=1109 to x=1420. The title changed from 11-pixel translucent RPIGeistMono to
18-pixel RPIGeist Bold. These are browser measurements of the combined local
integration baseline and this branch, not claims about a newly deployed site.

## Validation

Run `node scripts/headerLayoutSmoke.js` against the local test server. Set
`RPI_BROWSER=webkit` for WebKit and `RPI_HEADER_EVIDENCE` to retain screenshots and
JSON geometry elsewhere. The script checks:

- 21 viewport/pointer/DPR configurations in black and lunar themes: 320–3840 CSS
  pixels, breakpoint boundaries, phone and landscape touch, tablet, desktop and
  DPR 1–2.
- Full title visibility, bold face, no ellipsis/overflow, header non-overlap and
  exact desktop trigger/menu/sidebar alignment (within 0.6 CSS pixel).
- Menu keyboard dismissal, repeated sidebar toggle, long legacy document names,
  page errors and three delayed-startup cases. Subpixel logo raster-rounding is
  allowed, but no material title/action jump.
- Visual screenshots for narrow phone, desktop breakpoint and lunar desktop.

The full unit suite passes: 531 tests in 47 suites. Chromium and WebKit each
passed all 45 cases, including legacy-name checks in every responsive case. The
320-pixel phone, 1101-pixel lunar desktop and 1440-pixel desktop screenshots were
visually inspected. Existing export/model checks belong to the combined
integration validation; no export code is changed.

## Limits

These are browser-engine and CSS viewport/DPR simulations, not testing every
physical screen, macOS display mode, Safari application or assistive technology.
The installed Firefox build cannot start reliably in this cloud environment
(SWGL default-framebuffer initialization fails), so no Firefox result is claimed.
Owner visual acceptance and formal RPI approval remain open. The work is isolated
on `codex/fix-header-title`, based on integration `bd42e3b` because it depends on
the already-combined Share-removal and display work. No push, merge or deployment
is part of this change.
