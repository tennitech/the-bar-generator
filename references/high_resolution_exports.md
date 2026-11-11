# High-resolution export choices

November 11, 2026. This records the requested export update, not formal RPI
brand approval or universal browser/device compatibility.

## Behavior

- **High resolution · Recommended** stays first and selected by default.
  PNG downloads and copies use 4096 px of actual artwork width, excluding clear
  space. Full logo: 4752 × 3121 px. Bar only: 4752 × 951 px.
- **Smaller file** retains the 1000 px artwork choice. Full logo: 1160 × 762 px.
  Bar only: 1160 × 232 px. Internal `large` / `standard` keys remain stable.
- GIF retains independent 2000/1000 px artwork limits and unchanged codec,
  timing, frame, memory and output guards. High-resolution GIF: 2320 × 1524 px
  full logo or 2320 × 464 px bar only. Actual GIF dimensions are shown before
  activation, including any existing long-loop policy. The common dimensions
  line is explicitly labeled PNG, avoiding an implied 4096 px GIF promise.
- SVG is unchanged vector artwork with the same exact source at either raster
  choice. This update adds neither video nor APNG export.
- The canonical 250-unit design width scales uniformly. High-resolution PNG
  padding is 327.68 px per side; canvas dimensions alone round upward. No logo,
  bar, scientific coordinates, phase, spacing or vector path is distorted.
- PNG releases its temporary object URL, decoded image and canvas after success,
  cancellation and failure. Canvas/encoding failure offers Smaller file rather
  than silently lowering resolution. ClipboardItem still receives a promise in
  a synchronous clipboard.write call before awaiting preparation, preserving
  Safari's user-activation path. This is not proof of native Safari acceptance.

## Placement

4096 px of artwork covers a full-width UHD or DCI 4K bar at 1:1 placement, but
not arbitrary enlargement or every possible display. A complete logo retains
its own aspect ratio rather than stretching to 16:9. At 300 ppi the PNG provides
about 13.65 inches of artwork width. Prefer SVG for arbitrary-size static
print/design work and check brand clear space and pattern legibility at the
actual placement size.

## Verification

- Regression tests cover both compositions, PNG/GIF format separation, default
  and invalid values, fractional clear space, immutable request snapshots,
  unchanged SVG for every selectable family, truthful action dimensions and
  native radio labels. Failure/cancellation tests check cleanup and recovery.
- `node --expose-gc scripts/highResolutionExportsLocal.js` exercises the actual
  production snapshot and PNG exporter through the existing native SVG/canvas
  adapter. Independent PNG decoding checks 24 PNG files: Solid, Triangles and
  Artemis II, black/white, both sizes and both compositions. Dimensions, ink,
  smooth alpha, clear space, the letter/bar gap and object-URL cleanup pass.
- Four sampled GIFs cover both sizes and compositions using the unchanged real
  codec. Every sampled frame decodes with the expected dimensions, transparency
  and disposal. These four-frame samples are not full-loop timing benchmarks;
  existing unit tests cover complete loop planning, codec and resource guards.
- Both high-resolution PNG clipboard payloads pass independent decoding through
  the production copy handler and a clipboard adapter. The call is synchronous
  before encoding completes; no real system clipboard is accessed.
- The complete-mark PNG is 14,830,992 pixels, about 59.3 MB for one RGBA buffer.
  Decoded SVG, PNG encoding and browser overhead add memory; this is not a total
  memory bound or a guarantee for low-memory devices. GIF allocation is unchanged.
- Native-rendered PNGs were visually inspected on white. They are export
  artifacts, not browser screenshots. UI layout, native keyboard/touch, physical
  Safari, low-memory devices and destination-application paste remain unverified
  in this environment. Prior denied local browser routes were not retried.
  Existing optional browser scripts are updated for the new labels/dimensions.

After reconciling the Waveform and marquee releases, all 1,159 tests across 99
suites pass locally with a bounded 768 MB Node heap.
Changed JavaScript, inline-script syntax and whitespace checks pass. Exact-head
CI and production verification are recorded in the release PR.
