# Nucleotide bar

## Encoding and input

Enter at least 30 bases to export, with up to 50 allowed. These are tool limits,
not biological requirements. There is no length dropdown. Input accepts A, T, C,
G and U, converts lowercase to uppercase and removes other characters. Mixed T/U
is allowed and labeled as mixed DNA/RNA notation. Input, query, share and
rendering paths enforce the same 50-base bound. Retired length fields in older
links are ignored; actual sequences are retained up to 50 without padding.

One tooth represents one entered base, from left to right in the conventional
5′ to 3′ direction. Below 30, the preview uses 30 positions with dashed outlines
for missing bases. From 30 to 50, all positions contain actual bases. Tooth width
uses the current slot pitch, 250 / max(30, count) at reference width 250.
The gap stays fixed at 16% of the 30-base pitch for all counts. At reference
width 250, teeth are 7 units wide through 30 bases, then shrink smoothly to
3.67 units at 50. The gap remains 1.33 units throughout. Other bar sizes scale
this gap proportionally. This keeps the accepted short-sequence spacing as
more bases enter the bar.
The final gap remains positive. This is a visual encoding rule,
not a claim about molecular size. Preview, header and exports share the geometry.

The two user-supplied references, `rna bar 1.svg` and `RNA Bar 2.svg`, establish
the separated and backbone treatments. Original primitives implement them in
the existing 500 × 36 design area, scaled to 250 × 18 reference units. The
connected variant adds the intentional backbone. Official lettering, spacing
and export clear space are unchanged.

## Shape convention

A has a rounded tip; T/U a rounded notch; G a pointed tip; C an angular notch.
This is a design convention. It is not a universal molecular symbol standard or
a diagram of atoms, bonds, a duplex or molecular size. The complementary shapes
refer to canonical A–T in DNA, A–U in RNA and C–G pairing. U shares T's shape,
so the artwork alone does not distinguish DNA from RNA notation.

Primary sources:

- [NHGRI base pair](https://www.genome.gov/genetics-glossary/Base-Pair)
- [NHGRI uracil](https://www.genome.gov/genetics-glossary/Uracil)
- [Jackson Laboratory base pairing](https://www.informatics.jax.org/glossary/base_pair)

## Presets

Presets are transcript excerpts, not complete genes or unique identifiers.
Coordinates are one-based inclusive positions within the versioned NCBI record.
GenBank CDS starts and literal ORIGIN sequences were checked through EFetch.

| Preset | Source | Coordinates | Bases |
| --- | --- | --- | --- |
| Human INS | [NM_000207.3](https://www.ncbi.nlm.nih.gov/nuccore/NM_000207.3) | 60–109 | `ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTG` |
| Human HBB | [NM_000518.5](https://www.ncbi.nlm.nih.gov/nuccore/NM_000518.5) | 51–100 | `ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGG` |
| INS RNA letters | Same INS record | 60–109 | Same 50 bases with T replaced by U |

The table gives the 50-base maximum excerpts. A matching shorter input uses
the corresponding prefix and displays its actual source coordinates.

Edits update the preset and source label. Arbitrary sequences are never assigned
a gene identity. Randomize chooses a different actual length from 30 to 50 and a
different verified preset, then uses that prefix. Undo restores the preceding
sequence, including incomplete input. Reset restores 50 bases, INS and separate
bases. The three Home samples come from the shared renderer.

## Completion and limit feedback

The progress display has a 30-base minimum marker and a 50-base maximum. Below
30, the input border and progress feedback are red and Export is unavailable.
At 30, a brief green confirmation, check mark and green border show readiness.
The user can keep typing through 50 while the export actions remain enabled.
At 50, the neutral count says “Maximum reached. Ready to export.”
Only the artwork uses the base data; no control color enters the files.

An attempt to exceed 50 leaves the accepted sequence at 50, flashes the input
outline red and shakes it briefly. A polite inline notice explains the maximum.
Its red color ends with the 650 ms outline cue. The notice then uses the normal
secondary text color and clears four seconds after the last rejected edit.
An accepted edit or leaving the field clears it immediately. The 50-base cap,
neutral maximum label and export readiness remain. Reduced motion removes
translation and animation while keeping the short red outline and text. The
notice itself never moves. Repeated rejected edits renew its timeout without
rewriting the same live-region text.

[Carbon's character-counter guidance](https://www.carbondesignsystem.com/building-blocks/core/components/text-input/guidelines)
supports a visible count, an enforced maximum and feedback when that maximum
is reached. The four-second notice duration is a project choice, not an
industry requirement. A valid capped sequence does not carry a lasting error.

Input handlers cover ordinary typing, paste, selection replacement and
composition commits. WebKit's early native maxlength path has a key-event
fallback. Formatted paste is sanitized before the 50-base cap, so spaces do not
consume base positions. Overflow paste accepts the available bases and reports
the remainder. Selection replacement at 50 remains available.

The unavailable Export trigger stays focusable. Hover, keyboard focus and touch
show the same minimum explanation; Escape and outside interaction dismiss it.
File/copy actions and direct snapshots enforce the minimum. SVG, PNG and
clipboard output contain no dashed slots, green/red indicators or limit UI.

## Verification

All 711 unit tests in 63 suites pass. Focused Chromium and WebKit checks cover
empty and partial input, 29/30/31 and 49/50
boundaries, the same gap at every count in previews and exports, fixed containment, native over-limit typing,
notice expiry and renewal, blur/edit dismissal, polite live-region markup,
formatted/overlong paste, selection replacement, simulated composition commit, reduced
motion, SVG/PNG downloads, Randomize/Undo/Reset, reload, retired query/share
fields and desktop/phone layouts. Review images are stored in
`references/review-images/nucleotide-completion/`, including the limit warning.
All three Home samples exactly match the shared renderer.

Automated checks and visual review do not establish owner acceptance, manual
screen-reader output, physical mobile/IME behavior, native-app paste acceptance
or formal RPI approval. Existing asset permission questions remain separate.
