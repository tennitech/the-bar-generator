# UI icon provenance

The UI action-icon source is [Feather4.29.2](https://github.com/feathericons/feather/tree/v4.29.2/icons),
by Cole Bemis, under the retained [MIT license](../third_party/feather/LICENSE).
Source files, URLs and SHA-256 hashes are recorded in
[the source notice](../third_party/feather/notice.md) and
[manifest](../third_party/feather/manifest.json).

There was no prior declared icon package. Existing Download, Menu, Plus, Minus,
report Close and Toast Check/Info child geometry matched that pinned source.
Other custom/filled glyphs were replaced with exact upstream SVGs rather than
visually similar approximations. The static registry embeds unchanged source
geometry; root presentation/class/accessibility attributes are applied locally.
No npm package, CDN or remote runtime icon request is introduced.

| UI action | Feather source |
| --- | --- |
| Share / Copy / Copied | share / copy / check |
| Download / mission information | download / book-open |
| Header Menu / Close / repository | menu / x / github |
| Zoom | plus / minus |
| Report Close | x |
| Toast states | check / info / x-circle |
| Motion transport | play / pause |
| Audio state | volume-2 / volume-x |
| Intro Replay / Close | rotate-ccw / x |
| Existing custom select decoration | chevron-down, used as an alpha mask |
| Export busy state | loader, used as an alpha mask |

All sources use a 24 × 24 viewBox, stroke 2, round caps/joins and currentColor.
The export busy indicator uses the unchanged Feather `loader` SVG as an alpha mask; reduced motion keeps it still. It replaces the earlier custom border spinner.

Existing component sizes remain deliberate: toolbar 18px, menu/preview 16px and
toast 20px. Icons are decorative inside controls with retained accessible labels;
SVGs are hidden from assistive technology and are not separate focus targets.
Native triangle options use plain direction words, preserving values, ordering
and migrations. Browser-native popup/widget chrome remains native.

Official RPI/RCOS marks, Artemis artwork, generated bars and ASCII artwork are
identity/content, not action icons. This policy does not replace their sources.

Tests verify every retained file hash, registry content and static button child
geometry. Final full-page toolbar/menu/mobile appearance, interaction states and
accessible-label checks remain acceptance gates; source equality alone does not
establish visual or physical-device accessibility approval.
