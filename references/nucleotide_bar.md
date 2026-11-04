# Nucleotide bar

## Encoding and input

Enter 30–50 bases to export. This is the tool's layout rule, not a biological
requirement. Input accepts A, T, C, G and U, converts lowercase to uppercase,
removes other characters and caps the sequence at 50 bases. Mixed T/U is allowed
and labeled as mixed DNA/RNA notation. Input, query, share and rendering paths
apply the same bound. Older longer links are capped at 50; short links remain
editable without padding or repetition.

One filled tooth represents one entered base, read from left to right in the
conventional 5′ to 3′ direction. Below 30 bases, a fixed 30-slot preview uses
dashed neutral rectangles for empty positions. At 30–50 bases, the entered
sequence fills the full bar. Preview, header and exports share that geometry.
The connected variant adds the intentional backbone from the second supplied
reference. No letters, positions or scientific measurements are invented.

The two user-supplied references, `rna bar 1.svg` and `RNA Bar 2.svg`, establish
the separated and backbone shape treatments. Original primitives implement them
inside the existing 500 × 36 design area, scaled to 250 × 18 reference units.
Official lettering, spacing and export clear space are unchanged.

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

Edits update the preset and source label. Arbitrary sequences are never assigned
a gene identity. Randomize chooses a different verified preset. Reset restores
INS and separate bases. URL restoration and Undo preserve the accepted sequence
and structure. The three Home samples come from the shared renderer.

## Completion and exports

Progress shows readiness at the 30-base minimum. The Parameters panel retains a
green border and check mark once ready. A brief green confirmation runs only
when crossing from incomplete to ready. Reduced motion removes that animation.
These controls do not recolor or animate the official artwork.

Below 30, Export has a dashed border and `aria-disabled` state. The trigger stays
focusable so hover, keyboard focus, Enter/Space and touch can explain the lock
in a small pop-up. Escape and outside interaction dismiss it. File/copy actions
and direct snapshot capture enforce the same requirement. At 30–50, the normal
export menu returns. All exports contain actual bases only; no dashed slots,
green indicators or completion UI enter the files.

## Verification

Review images: [partial desktop](review-images/nucleotide-completion/desktop-incomplete.png),
[ready desktop](review-images/nucleotide-completion/desktop-ready.png),
[phone progress](review-images/nucleotide-completion/mobile-progress.png) and
[phone export explanation](review-images/nucleotide-completion/mobile-blocked.png).

Automated checks and visual review do not establish owner acceptance,
screen-reader output, physical mobile behavior, native-app paste acceptance or
formal RPI approval. Existing asset permission questions remain separate.
