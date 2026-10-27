# UI icon provenance and consistency

Audited on October 27, 2026 against the assigned baseline and read-only active BAR worker
sources. There was no icon-package dependency, source declaration, or icon-license
record in this repository. Similar appearance is not proof of a shared library.

## Verified common source

The generator's existing Download, Menu, Plus, Minus and report-dialog X geometry,
and Toast Check/Info geometry, exactly match the child elements/attributes of
[Feather 4.29.2](https://github.com/feathericons/feather/tree/v4.29.2/icons).
This is the evidenced existing source for consistent replacements. It does not
establish the historical provenance of every other inline glyph.

Sharing now uses the exact upstream `share.svg`, `copy.svg` and `check.svg` from
that pinned source. Source files, SHA-256 hashes and attribution are in
[third_party/feather/notice.md](../third_party/feather/notice.md), with the actual
[MIT license](../third_party/feather/LICENSE). `js/utils/featherIcons.js` embeds
those unchanged source SVGs and adds only presentation/class attributes. Unit
tests compare embedded markup and upstream-file hashes. No package, CDN, remote
icon request or different family is introduced. All three use a 24×24 viewBox,
stroke 2, round caps/joins and currentColor; component CSS controls display size.

## Inventory and proposed remaining work

| Area / owner | Actual source finding | Scoped consistent replacement |
| --- | --- | --- |
| Share toolbar/menu, BAR-05 | Previous hand-drawn1.8-stroke Share/Copy approximations; now fixed | Exact Feather `share`, `copy`, `check` via static registry |
| Download, generator shell | Exact Feather `download`, stroke2 | Retain geometry; consume same registry when shell owner centralizes |
| Header Menu / Close, shell/mobile owner | Menu geometry matches Feather; stroke overridden2.15. Close is same X lines reordered | Exact Feather `menu` / `x`, common stroke 2, retain shared component dimensions |
| Header GitHub link, shell owner | Filled brand silhouette has no attribution and does not match Feather `github` | Feather `github` outline from same pinned source; do not guess another pack's provenance |
| Mission credit Book, shell/Artemis owner | Inline path not exact Feather `book` source | Feather `book-open` or `book`, chosen by actual navigation meaning |
| Zoom+/−, mobile/geometry owner | Exact Feather `plus` / `minus`, stroke2 | Retain; central registry avoids duplicated inline markup |
| Report-dialog Close, shell owner | Exact Feather `x` | Retain/source centrally |
| Toast Success/Info, ui.js owner | Exact Feather `check` / `info`, stroke2 | Retain/source centrally |
| Toast Error, ui.js owner | Circle+X composite; not matched by the audited downloaded subset | Verify/use exact Feather `x-circle`; do not infer provenance from shape |
| Motion Play/Pause, previewControls.js; BAR-06/BAR-03 consumers | Custom filled rounded paths, not Feather source | Exact Feather `play` / `pause` outline; preserve hooks, state, aria labels and44px controls |
| Audio On/Off, previewControls.js | Custom speaker/waves and crossed-speaker paths, stroke1.9 | Exact Feather `volume-2` / `volume-x`, stroke2 |
| Intro Replay, logoAnimationOverlay.js/BAR-06 | Custom arc and arrow; not exact Feather `rotate-ccw` | Exact Feather `rotate-ccw`; preserve lifecycle and focus behavior |
| Intro Close, logoAnimationOverlay.js/BAR-06 | Exact Feather X geometry | Retain/source centrally |
| Select chevrons, CSS | Border-rotation CSS glyphs, not a source-pack asset | Feather `chevron-down` if an icon is required; keep native select behavior |
| Triangle direction labels, BAR-02 | Unicode diagonal arrow characters from font, not a verified icon pack | Native options can use plain direction words; if visual arrows remain, source custom-menu glyphs from Feather `arrow-up-left/right`, `arrow-down-left/right` |
| Quantum controls, BAR-03 | Reuse the same previewControls.js glyphs, no separate quantum-specific pack found | Include in shared Play/Pause replacement; do not change quantum model/phase |
| Intro theme controls, BAR-06 | No additional SVG icon family found in themeMotion.js; ASCII transition is content, not a UI icon | Keep ASCII artwork/model separate from glyph inventory |
| Browser-native select popups, slider widgets and platform controls | OS/browser UI, not site-sourced action glyphs | Preserve native controls and accessibility; do not redraw their platform chrome |
| Official RPI/RCOS marks, Artemis artwork and scientific bars | Identity assets and generated geometry, not UI action icons | Preserve official vectors and sources; never replace them with an icon font |

Only owned sharing glyphs were changed here. Other rows are proposals for the
coordinator to assign; no active worker functions were edited. A single verified
pack does not require equal displayed size in unrelated components: toolbar 18px,
menu 16px and the existing 16px Download glyph can remain deliberate component
sizes. Stroke family, caps/joins, currentColor and source geometry stay coherent.
Full-toolbar equality and all interaction states remain acceptance checks.

Machine comparison evidence is recorded outside the product in
`/tmp/bar-generator-coordination/feather-audit/geometry-matches.json`. Source
comparison ignores root presentation dimensions but checks child element names,
geometry attributes and child order; reordered equivalent X lines are explicitly
identified above rather than labeled a literal source match.
