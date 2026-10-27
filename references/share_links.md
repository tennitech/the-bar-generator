# Client-side share links

The **Share this bar** section copies a link containing the complete bar settings and an optional name. Opening it restores those settings. The name is plain text in a separate workspace caption; it does not alter the RPI mark or exported files. The profanity filter applies to names and encoded text. Audio does not start automatically, and the receiver's reduced-motion preference takes priority over shared animation toggles.

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

The application accepts a fragment up to 24,000 characters, text up to 4,096 Unicode codepoints per field (or its smaller native maxlength), and a name up to 80 codepoints. Text is rejected rather than silently truncated for serialization. Typical complete links are about 2,400 characters before long text. Some services have limits near 2,000 characters or strip fragments; no universal delivery length is guaranteed. The share panel displays actual length and includes a selectable field when Clipboard API access is unavailable. For an oversized configuration, shorten its text and retry. Do not use a public shortener for private text without considering its disclosure.

## Validation

Run `npm test -- --runInBand` and, against a local static server, `RPI_SITE_URL=http://127.0.0.1:4315 node scripts/shareSmoke.js`. The latter exercises all 21 selectable families with modified active and inactive controls, seed and paused phase restoration, actual downloaded SVG equality, Unicode names and HTML-looking text, Back/Forward, legacy query links, edited-fragment reload, malformed-link recovery, clipboard rejection, mobile layout and reduced motion. `RPI_EVIDENCE_DIR` optionally saves desktop and mobile screenshots. Standard `test:browser` and `test:motion` remain relevant aggregate checks. These checks do not establish formal RPI approval or physical-device accessibility coverage.
