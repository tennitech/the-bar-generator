# Asset licensing and permissions

The root LICENSE contains the existing MIT grant for project software. Package metadata now matches that file. This update does not change copyright ownership or create new asset permissions.

An open-source software license does not itself grant rights to use RPI trademarks. Do not assume that the software license authorizes redistribution or modification of every font, logo, artwork, or recording in the repo.

## Records still needed

| Material | Current record | Required follow-up |
| --- | --- | --- |
| Original project software | MIT license, copyright 2026 Kaden | Ask the RPI project sponsor to confirm licensing authority and any employment, sponsorship, or course terms. |
| RPI logos and bar reference artwork | Brand rules in AGENTS.md and references/rpi_brand_guidelines.md | Record the rights holder, source, and permitted distribution and modification. |
| RPIGeist, RPIGeistMono, and other bundled fonts | Font files in assets/fonts | Obtain the applicable font licenses, including web embedding and repo distribution terms. |
| Artemis II artwork and audio | Files and references in the repo | Record source and reuse terms, including any third-party elements. |
| Vendored libraries | THIRD_PARTY_NOTICES.md and third_party licenses | Preserve each license and update notices when dependencies change. |

Keep this table open until the sponsor supplies evidence. Do not claim that all bundled assets have been cleared for unrestricted open-source reuse. If an asset cannot be distributed, replace it or remove it with sponsor approval.

Source references: [RPI intellectual property policy](https://doso.rpi.edu/policies/academic/technology-commercialization-and-intellectual-property) and [Open Source Initiative FAQ](https://opensource.org/faq).

## Brand-site review: October 27, 2026

The official [Typography page](https://brand.rpi.edu/document/4#/-/typography) says RPI Geist and Mono are free to use and downloadable. Replica requires a paid license. The [font library](https://brand.rpi.edu/document/13) was inspected, but no font license files were downloaded or audited. Public redistribution terms remain unverified. These findings do not close the asset-permission items above.

The [Bar rules](https://brand.rpi.edu/document/4#/-/the-bar) distinguish Student Union approval for internal club use from formal brand approval for the official library. Record the applicable approval, not just the asset source. See the dated source checklist in rpi_brand_guidelines.md.

## Feather action icons

UI action icons use the static Feather4.29.2subset from the official tagged
repository. The unchanged MIT license (Cole Bemis,2013–2023) is retained at
`third_party/feather/LICENSE`; source URLs and file hashes are recorded in
`third_party/feather/notice.md` and `manifest.json`. This permission covers those
icons only and does not resolve the RPI trademark, fonts or artwork items above.

## Integration review screenshots

`references/review-images/integration-desktop.png` and `integration-mobile.png`
were generated from this repository’s running application on October27,2026.
They reuse existing configured identity/font assets and the licensed Feather
glyphs. No external image or replacement artwork was added; the underlying
permission questions above remain unchanged. See integration-validation.md in
the same review-images directory for capture conditions and limitations.

## Clipboard review screenshots

`references/review-images/clipboard-desktop.png` and `clipboard-mobile.png` were
captured from this repository's application on October 27, 2026. They reuse the
existing identity/font assets and licensed Feather glyphs, with no external
artwork. Existing permission questions remain open. Capture conditions and
limits are recorded in `review-images/clipboard-validation.md`.

## Selector review screenshots

`references/review-images/selector-styles.png` and `selector-directions.png`
are October 28 application captures of the still family samples and geometric
direction indicators. Samples reuse existing shared geometry and supplied Artemis
artwork; no external asset or replacement artwork was added. The arrows are
simple original UI line geometry with the established 24-unit, two-unit stroke
language. Existing underlying asset permissions and owner approval questions remain.

## Neural Network review screenshots

`references/review-images/neural-network/` contains October 28 application
captures and an actual-size sheet generated from the new original mathematical
primitives. No external image, replacement identity asset or font is added.
Existing identity/font permissions and RPI approval questions remain unchanged.
See the validation record in that directory for capture conditions.
