# Client-side share links

The toolbar **Share bar** button opens a compact menu with **Copy link** first and a secondary optional-name field. Copied links contain the complete bar settings and name. Opening it restores those settings. The name is plain document context beside the app title and in the browser title, with editing kept in the share menu; it does not alter the RPI mark or exported files. The profanity filter applies to names and encoded text. Audio does not start automatically, and the receiver's reduced-motion preference takes priority over shared animation toggles.

No account, upload, database, URL shortener, or storage service is used. The state lives in the URL fragment, which is not sent in HTTP requests. Anyone receiving the URL can decode its settings and text; it is not encrypted. A copied moving bar resumes from the captured phase rather than staying frozen unless its motion was paused.

## Version 1 contract

`#bar=<base64url of canonical UTF-8 JSON>` encodes:

- `v: 1`
- `name`: up to 80 Unicode codepoints, rendered with `textContent`.
- `controls`: stable sidebar control IDs and string values, or booleans for checkboxes. All controls are included, including inactive families. The manifest derives native numeric bounds, steps, select options, and text limits from the generator shell. Only known controls can be restored; disabled bar families remain unavailable.
- `runtime`: unsigned 32-bit circle-layout seed, loop phase in `[0,1]`, elapsed animation time in `[0,1e9]` seconds, current music-note duration and up to four measures of validated music notes. Audio playback and context are excluded.

Canonical control key ordering makes the same snapshot encode identically. Random circle packing uses local seeded generators in its existing sampling helpers. The same configuration and seed regenerate the same circle layout, including exported SVG; no global random function is replaced.

New controls can extend v1 by retaining a stable ID and correct native constraints in the sidebar. New non-control runtime state requires an explicit normalizer in `normalizeRuntime` and corresponding capture/restore in `setupShareLinks`. For quantum animation, add any transport controls to the sidebar, and add explicitly bounded quantum runtime fields to those two functions. Do not assign arbitrary decoded properties to application state. Breaking interpretation or default changes require a new version with an explicit migration. Unknown control/runtime fields are ignored; unknown envelope versions and invalid controls are rejected before applying a snapshot. Absent controls use shell defaults; absent runtime values use bounded defaults.

The existing p5 global-state application is retained. Serialization, validation, clipboard handling and share UI are in `js/utils/shareState.js`; `setupShareLinks` is the small runtime bridge in `main.js`. UMD matches the existing unbundled runtime and permits CommonJS unit testing without a build tool. `drawing.js` and the SVG collector are not duplicated.

## Complete control inventory

There are 53 sidebar controls at the assigned baseline. There is no custom-color or seed editor; the approved palette selection and internal layout seed are preserved.

| Family | State captured |
| --- | --- |
| All | Style, approved color theme |
| Ruler | Repeats, units, loop enabled, reverse, speed |
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

Run `npm test -- --runInBand` and, against a local static server, `RPI_SITE_URL=http://127.0.0.1:4315 node scripts/shareSmoke.js`. The latter exercises all 21 selectable families with modified active and inactive controls, seed and paused phase restoration, actual downloaded SVG equality, Unicode names and HTML-looking text, Back/Forward, legacy query links, edited-fragment reload, malformed-link recovery, clipboard success/rejection, toolbar focus, Escape/outside dismissal, mobile layout and reduced motion. `RPI_EVIDENCE_DIR` optionally saves desktop and mobile screenshots. Standard `test:browser` and `test:motion` remain relevant aggregate checks. These checks do not establish formal RPI approval or physical-device accessibility coverage.

## Triangle direction/count extension

BAR-02 adds `triangles-direction-select` (`up-left` / `up-right` / `down-left` / `down-right`, native default `down-right`) and `triangles-count-slider` (integer 6–28, step 1, native default 14), alongside `triangles-variant-slider` (1–2, default 1). These remain ordinary sidebar controls; v1 derives their native constraints and new captures explicitly include direction even at the Down right default. No runtime field, schema version, or share UI change is needed.

Historical v1 snapshots need one compatibility migration before enum validation: `up` becomes `up-right`, `down` becomes `down-right`, and an omitted direction becomes `down-right`. Omission preserves the historical appearance even for inactive triangle settings; the historical default remains stable even if native UI defaults change. Count/variant retain native defaults 14/1 when absent. Unshared pages and query links without direction use BAR-02's Down right app default; query alias migration remains in BAR-02. Unknown explicit directions are rejected, not silently replaced.

After integrating BAR-02 controls and BAR-01's canonical collector, run `RPI_SITE_URL=<combined-preview> node scripts/triangleShareSmoke.js`. Its default mode requires actual controls and verifies Copy link → open → reload, all four directions and both variants, explicit new direction payloads, historical aliases/omission, and canonical migrated links. Before a combined branch exists, `RPI_TRIANGLE_SHARE_FIXTURE=1` injects only the contracted native controls into the generator shell response for the isolated browser test; it does not modify source files or import BAR-02 rendering. Fixture mode proves state plumbing, not new rendered triangle geometry or export parity. The unit matrix covers all 24 variant/direction/count combinations, invalid values, both historical aliases, omitted historical values, and explicit canonical values.

The integrated export collector must consume BAR-02's `getTrianglePatternControlValues()` for variant, direction and count. This remains BAR-01/BAR-02 integration work; sharing values cannot repair an export collector that omits them.

## Motion-speed import integration

Before strict native validation, sharing delegates known Ruler/Ticker/Waveform speed fields to `loopingGifUtils.normalizeMotionSpeedControls` when that BAR-06 helper is available. It clamps/rounds legacy speeds to the policy owner's current family limits: Ruler0.2–0.6/default0.3, Ticker0.2–0.8/default0.4, Waveform0.2–1/default0.3, step0.1. Other controls remain strict; custom text and quantum model rates are untouched. The guarded fallback supports the baseline utility until BAR-06 is integrated, but does not itself supply the new speed policy. Load the updated loopingGif utility before shareState, as the existing script order already does.

## Sharing UI and icon source

Saved names are document context in the existing header title, never floating debug-style labels over the canvas or part of the official mark. The compact menu keeps Copy link and optional-name editing together. Its two text controls share one type scale, with16px text on coarse/mobile to avoid input autozoom; menu states use existing semantic foreground/background tokens. Success updates the action to Copied with a check and announces it without repeating visible status prose.

The sharing glyphs are exact Feather4.29.2 share/copy/check SVGs, matching the evidenced source of core existing toolbar icons. See [icon provenance](icon_provenance.md) for exact sources, license/hash verification, and outstanding non-sharing mismatches. No new package or icon CDN is loaded.
