# Nucleotide bar — November 3, 2026

The two user-supplied SVG references (`rna bar 1.svg` and `RNA Bar 2.svg`)
show the same four end shapes, first separated and then attached to a top
backbone. Both were rendered and inspected. New original primitives reproduce
that visual grammar inside the existing official 500 × 36 design area (250 × 18
at reference scale); the supplied lettering is not imported or redrawn.

## Encoding and limits

The input accepts only A, T, C, G and U, converts lowercase to uppercase, removes
other characters, and caps work at 60 bases. One tooth represents one base,
left to right in the conventional 5′ to 3′ sequence direction. Short sequences
remain centered with natural whitespace rather than stretching tooth shapes.
The connected variant adds the intentional backbone from reference 2; this is
not an artificial extent-fitting strip. Empty input stays empty with a recovery
hint. Mixed T/U is allowed but identified as mixed DNA/RNA notation.

The shape key is **our design convention**, not a universal scientific symbol
standard: A rounded tip; T/U rounded notch; G pointed tip; C angular notch.
Complementary visual pairs reflect canonical A–T (DNA), A–U (RNA), and C–G
pairing. They do not portray atoms, bonds, molecular size, a duplex, or a
physical molecule. U intentionally shares T's shape, so the artwork alone does
not distinguish DNA from RNA notation.

Primary sources checked November 3, 2026:
- [NHGRI base pair](https://www.genome.gov/genetics-glossary/Base-Pair)
- [NHGRI uracil](https://www.genome.gov/genetics-glossary/Uracil)
- [Jackson Laboratory base pairing](https://www.informatics.jax.org/glossary/base_pair)

## Presets and provenance

These are short excerpts, **not complete genes or unique gene identifiers**.
NCBI GenBank records were retrieved with EFetch and the annotated CDS starts
and literal ORIGIN sequences checked. All positions are one-based inclusive
within the versioned transcript record, not genomic coordinates.

- Human INS: [NM_000207.3](https://www.ncbi.nlm.nih.gov/nuccore/NM_000207.3),
  positions 60–89, first 30 CDS bases: `ATGGCCCTGTGGATGCGCCTCCTGCCCCTG`.
- Human HBB: [NM_000518.5](https://www.ncbi.nlm.nih.gov/nuccore/NM_000518.5),
  positions 51–80, first 30 CDS bases: `ATGGTGCATCTGACTCCTGAGGAGAAGTCT`.
- INS RNA letters: same INS excerpt with T replaced by U, explicitly labeled.
  NCBI transcript records use the DNA alphabet for their sequence representation.

Sequence edits update the preset label and source; arbitrary inputs are never
assigned a gene identity. Randomize selects a different verified excerpt; Reset
restores INS and separate bases. URL restore, legacy snapshots and Undo preserve
the actual sequence and structure. Input/query/share and rendering boundaries
all enforce the five-letter alphabet.

Static preview, header, SVG, PNG and clipboard exports use the same SVG pattern
and frozen export collector. No animation, audio, network request for user input,
new runtime dependency or external asset is introduced. Existing RPI asset
permissions and formal brand approval remain unresolved independently of testing.

## Validation

At the candidate based on production `c72ac00`, all 642 unit tests pass.
Focused Chromium and WebKit runs pass sequence sanitization/empty handling,
all three presets and their source labels, structure changes, query reload SVG
parity, real SVG/PNG downloads, Reset/Randomize, keyboard selection, shared-state
normalization, and 320/390/768 px layout checks. The 390 px controls open, accept
edits and close successfully. Desktop/backbone and mobile states were rendered
and visually inspected. The three homepage samples were generated from the
shared export renderer, not independently drawn. First paint synchronizes the
preset/source before insertion and waits for the complete rendered mark.

The initial smoke harness wrongly toggled the still-open Export menu closed
before requesting PNG; the corrected test passed in both engines. One earlier
Chromium process also crashed during the blocked test. These are not evidence
of an application export failure. Physical Safari/mobile hardware, screen-reader
output, native-app paste acceptance and formal RPI approval were not tested.

The existing Chromium browser regression suite also passes all 21 prior styles
and their SVG exports, PNG, five widths, text safety, reduced motion, 2D fallback
and renderer recovery. This is separate from the added Nucleotide-specific run.

Final integration on production `684673b` (export #84) passes all 647 unit tests
and repeats the complete focused Chromium/WebKit sequence and export flows.
The export side-by-side controls, quiet intro dropdown and their cache versions
are retained. Owner approval to publish the feature was received November 3, 2026.
