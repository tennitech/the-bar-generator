# Feather SVG subset

Exact source: https://github.com/feathericons/feather/tree/v4.29.2/icons
Version: Feather 4.29.2. Author: Cole Bemis. License: MIT, retained in LICENSE.

These 19 unchanged SVGs are included for source attribution and verification.
`js/utils/featherIcons.js` embeds their exact source markup, adding only accessible
presentation/class attributes when used. This is a static subset, not an npm
package, CDN dependency, runtime fetch, or another icon family. Existing download,
menu, x, plus and minus glyph geometry matches this same Feather source.

SHA-256 hashes of every unchanged upstream file are recorded in `manifest.json`.
Each file is fetched from the pinned official tag above. The registry and static
HTML retain the exact source child geometry; only component size, class and
accessibility presentation attributes differ. Tests verify all 19 files and static
button markup against that record.

Do not approximate these paths or change stroke weights per control. Use a24×24
viewBox,2px round-capped/round-joined stroke, currentColor, and the app's existing
component sizing. RPI logos and generated artwork are identity assets, not UI
icons; this icon policy does not replace or modify them.
