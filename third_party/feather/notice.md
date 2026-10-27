# Feather SVG subset

Exact source: https://github.com/feathericons/feather/tree/v4.29.2/icons
Version: Feather 4.29.2. Author: Cole Bemis. License: MIT, retained in LICENSE.

These three unchanged SVGs are included for source attribution and verification.
`js/utils/featherIcons.js` embeds their exact source markup, adding only accessible
presentation/class attributes when used. This is a static subset, not an npm
package, CDN dependency, runtime fetch, or another icon family. Existing download,
menu, x, plus and minus glyph geometry matches this same Feather source.

SHA-256 of unchanged upstream files:
- share.svg: effae7164671d39452a674f414ce0536e21e266632ddc7d8ec90d4fe7f1e7043
- copy.svg: a32de6b675efb2d05a19455cde9d7350706257069e0a52d0a99fdf51a565fe91
- check.svg: 1df722c1758fb0cb4868c38eb038fecf64c3717fe09ceaeb43783b70d027a1c4

Do not approximate these paths or change stroke weights per control. Use a24×24
viewBox,2px round-capped/round-joined stroke, currentColor, and the app's existing
component sizing. RPI logos and generated artwork are identity assets, not UI
icons; this icon policy does not replace or modify them.
