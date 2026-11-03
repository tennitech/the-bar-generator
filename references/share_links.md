# Client-side share links

The public Share trigger, Copy link action, name editor and popover were removed
on November 3, 2026 for the Frontify workflow. Existing snapshot URLs still
restore their validated settings, document name, seed and phase. The codec remains for historical compatibility; no new public sharing service
or new-tab export workflow is exposed. See [embedded export compatibility](frontify_exports.md).

Names remain plain document context and export metadata, not part of the RPI mark.
The profanity filter applies to names and encoded text. Audio does not start
automatically; reduced motion takes priority, and Quantum snapshots restore paused.
No account, upload, database, URL shortener or storage service is used. State lives
in the URL fragment and is not encrypted. Anyone receiving a snapshot URL can
decode its settings and text. The historical UI descriptions below are retained
only as implementation history and do not describe current available controls.

## Version 1 contract

`#bar=<base64url of canonical UTF-8 JSON>` encodes:

- `v: 1`
- `name`: up to 80 Unicode codepoints, rendered with `textContent`.
- `controls`: stable sidebar control IDs and string values, or booleans for checkboxes. All controls are included, including inactive families. The manifest derives native numeric bounds, steps, select options, and text limits from the generator shell. Only known controls can be restored; disabled bar families remain unavailable.
- `runtime`: unsigned 32-bit circle-layout seed, loop phase in `[0,1]`, elapsed animation time in `[0,1e9]` seconds, current music-note duration and up to four measures of validated music notes. Audio playback and context are excluded.

Canonical control key ordering makes the same snapshot encode identically. Random circle packing uses local seeded generators in its existing sampling helpers. The same configuration and seed regenerate the same circle layout, including exported SVG; no global random function is replaced.

New controls can extend v1 by retaining a stable ID and correct native constraints in the sidebar. New non-control runtime state requires an explicit normalizer in `normalizeRuntime` and corresponding capture/restore in `setupShareLinks`. Quantum uses its native phase, LOOP, REVERSE and SPEED controls; it requires no extra runtime fields. Restore calls `quantumControls.pause()` and `sync()` after assigning controls, retaining exact phase while preventing autoplay. Do not assign arbitrary decoded properties to application state. Breaking interpretation or default changes require a new version with an explicit migration. Unknown control/runtime fields are ignored; unknown envelope versions and invalid controls are rejected before applying a snapshot. Absent controls use shell defaults; absent runtime values use bounded defaults.

The existing p5 global-state application is retained. Snapshot serialization, validation and legacy restoration are in `js/utils/shareState.js`; `setupShareLinks` is the small runtime bridge in `main.js`. UMD matches the existing unbundled runtime and permits CommonJS unit testing without a build tool. `drawing.js` and the SVG collector are not duplicated.

## Complete control inventory

The manifest derives the active sidebar controls, including triangle direction/count and Quantum transport/phase controls. There is no custom-color or seed editor; the approved palette selection and internal layout seed are preserved.

| Family | State captured |
| --- | --- |
| All | Style, approved color theme |
| Ruler | Major repeats, divisions per repeat (legacy key `rulerUnits`), loop enabled, reverse, speed |
| Binary / Morse | Each text field, including empty strings and Unicode |
| Ticker | Repeats, count ratio, width ratio, loop enabled, reverse, speed |
| Waveform | Wave type, frequency, envelope enabled/type/waves/center/bipolar, loop enabled, reverse, speed |
| Circles | Density, size variation, fill/stroke, internal layout seed |
| Numeric | Number/formula text and visualization mode |
| Circles Gradient / Gradient / Grid / Lines / Point Connect / Triangle Grid / Triangles | Each variant control |
| Neural Network | Hidden-layer count |
| Music (currently unavailable) | Instrument, note shape, reverb, tremolo, tempo, composed notes and current duration |
| Truss (currently unavailable) | Family, segment count, thickness |
| Data Graph (currently unavailable) | Five text streams, multistream toggle, scale |
| Solid / Fibonacci Sequence / Union / Wave Quantum / Runway / Artemis II | Family and approved theme; no additional baseline pattern controls |

Preview zoom/pan, open panels, active audio and mission countdown wall-clock time are view/session state, not bar configuration, and are not shared. Artemis mission artwork uses the bundled asset, not network telemetry. No new palette, geometry, scientific interpretation or asset permissions are introduced.

## URL and navigation behavior

Copied links use the existing clean style route, preserve any site subdirectory and omit query parameters. Existing query links still load. Legacy generator redirects preserve the fragment. Shared settings take precedence over query settings. Editing an opened shared configuration replaces its current fragment so reloading keeps edits. The feature does not add a history entry for every slider event. Browser Back/Forward and fragment navigation restore snapshots without reusing the original page's route style.

The application accepts a fragment up to 24,000 characters, text up to 4,096 Unicode codepoints per field (or its smaller native maxlength), and a name up to 80 codepoints. Text is rejected rather than silently truncated for serialization. Typical complete links are about 2,400 characters before long text. Some services have limits near 2,000 characters or strip fragments; no universal delivery length is guaranteed. A compact popover contains an optional name and Copy link. The Copy link tooltip gives its character count and notes messaging-app limits. A selectable field appears only when Clipboard API access is unavailable. Escape returns focus to the toolbar button; clicking outside or moving keyboard focus away closes the popover. For an oversized configuration, shorten its text and retry. Do not use a public shortener for private text without considering its disclosure.

## Validation

Run `npm test -- --runInBand` and, against a local static server, `RPI_SITE_URL=http://127.0.0.1:8000 node scripts/shareSmoke.js`. The latter exercises all 21 selectable families with modified active and inactive controls, seed and paused phase restoration, actual downloaded SVG equality, Unicode names and HTML-looking text, Back/Forward, legacy query links, edited-fragment reload, malformed-link recovery, absence of public Share controls, legacy named-title restoration, mobile layout and reduced motion. `RPI_EVIDENCE_DIR` optionally saves desktop and mobile screenshots. Standard `test:browser` and `test:motion` remain relevant aggregate checks. These checks do not establish formal RPI approval or physical-device accessibility coverage.

## Triangle direction/count extension

Triangles provides `triangles-direction-select` (`up-left` / `up-right` / `down-left` / `down-right`, native default `down-right`) and `triangles-count-slider` (integer 6–28, step 1, native default 14), alongside `triangles-variant-slider` (1–2, default 1). These remain ordinary sidebar controls; v1 derives their native constraints and new captures explicitly include direction even at the Down right default. No runtime field, schema version, or share UI change is needed.

Historical v1 snapshots need one compatibility migration before enum validation: `up` becomes `up-right`, `down` becomes `down-right`, and an omitted direction becomes `down-right`. Omission preserves the historical appearance even for inactive triangle settings; this matches the current Down right default. Count/variant retain native defaults 14/1 when absent. Unshared pages and query links without direction use the current Down right app default; query aliases use the same direction normalizer. Unknown explicit directions are rejected, not silently replaced.

Run `RPI_SITE_URL=<combined-preview> node scripts/triangleShareSmoke.js`. Its default mode requires actual controls and verifies captured snapshot → open → reload, all four directions and both variants, explicit new direction payloads, historical aliases/omission, and canonical migrated links. Before a combined branch exists, `RPI_TRIANGLE_SHARE_FIXTURE=1` injects only the contracted native controls into the generator shell response for the isolated browser test; it does not modify source files or import triangle rendering. Fixture mode proves state plumbing, not new rendered triangle geometry or export parity. The unit matrix covers all 24 variant/direction/count combinations, invalid values, both historical aliases, omission and the current native default and explicitly saved historical values.

The integrated export collector consumes `getTrianglePatternControlValues()` for variant, direction and count. `scripts/integrationSmoke.js` checks real selected counts and rendered header/raster bounds, exact downloaded SVG equality after share restore, and same-document seeded circle-cache restoration.

## Quantum projection migration

`quantum-phase` is0..1, `quantum-motion-toggle` and `quantum-reverse-toggle`
are booleans, and `quantum-speed-slider` is0.2..1 with0.1step. Old
`quantum-view=density` fields are ignored while phase is retained. Shares always
restore Quantum paused, even if an old envelope captured LOOP=true. The new
three-mode artwork intentionally replaces the former two-mode views; old links
preserve phase/settings, not the old pixels. `quantumIntegrationSmoke.js` checks
actual deterministic SVG/PNG files, paused migration, native motion dispatch,
legacy query history and reduced motion against the combined renderer.

The final native direction order is Down right, Up right, Up left, Down left. Explicit saved directions keep their meanings, including Up left saved while it was the default.

## Historical sharing UI and icon source

Saved names are document context in the existing header title, never floating debug-style labels over the canvas or part of the official mark. The compact menu keeps Copy link and optional-name editing together. Its two text controls share one type scale, with16px text on coarse/mobile to avoid input autozoom; menu states use existing semantic foreground/background tokens. Success updates the action to Copied with a check and announces it without repeating visible status prose.

The sharing glyphs are exact Feather4.29.2 share/copy/check SVGs, matching the evidenced source of core existing toolbar icons. See [icon provenance](icon_provenance.md) for exact sources, license/hash verification, and the consistent sitewide glyph inventory. No new package or icon CDN is loaded.

## Published reconciliation checks

Run `scripts/shareIntegrationSmoke.js` alongside the real-controls triangle check to verify paused Quantum imports, legacy history restoration and actual SVG equality. Model, renderer and projection geometry remain unchanged.

## Rapid edits and reload

Legacy query and shared-fragment updates use one bounded 200ms history writer,
retaining the final edit without exhausting WebKit’s history API limit. Copy link
always captures current controls immediately. History navigation cancels an older
pending edit. A same-origin session handoff recovers the final pending URL before
startup on immediate reload; no upload or server storage is involved.

## Numeric source migration — October 28, 2026

Numeric adds `numeric-source-select` (`values`/`formula`) and `numeric-formula-select` (eight stable preset IDs), retaining `numeric-input` and `numeric-mode-select`. Both inactive choices remain captured, so switching sources does not erase a decimal draft. Historical snapshots without the source control explicitly migrate decimal strings, known formula aliases and bounded finite arithmetic; unsupported or oversized historical expressions recover as an empty value with input guidance. New explicit-source snapshots reject invalid decimal strings before applying controls. No arbitrary expression is executed. Legacy query links use the same migration; `numericSource`/`numericFormula` are new canonical query keys. See [Numeric modes](numeric_modes.md).

November 3 compatibility: Binary shares from the former 100-code-point limit migrate their first ten code points, preserving all other fields. New captures use the ten-code-point cap. Motion direction follows the corrected defaults; paused shared transport is retained. Fresh routes and deliberate style selection start Loop unless reduced motion is requested.
