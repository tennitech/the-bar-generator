# Bar information cards

October 28, 2026. One shared sidebar card sits immediately above Report a Problem (Report Anomaly in Mission Control), covering all 21 available bar styles. Each description has two sentences and approximately 40 words. Disabled Music, Data Graph and Truss entries remain unavailable and do not gain cards for unimplemented behavior.

## Copy and sources

The copy follows the curious, humble, specific and approachable institutional voice in the October 27 source record in [RPI brand guidelines](rpi_brand_guidelines.md). The explanations identify the actual system and invite comparison without inventing a scientific interpretation or origin story for decorative geometry.

- Encoding, measurement-inspired and geometric styles: [bar science notes](bar_science_notes.md), `js/utils/barPattern.js`, and the current controls in `generator/index.html` and `js/main.js`. Union describes its five repeated modules and arches without claiming a Student Union affiliation. Runway retains the existing menu's RPI Flying Club context without claiming approved lockup status or operational aviation meaning. No new organizational affiliation has been inferred.
- Neural Network: [explicit untrained feedforward model](neural_network_model.md), grounded in Stanford CS231n and Glorot/Bengio. Its two-sentence card describes actual weighted sums, activation, negative weights and input recomputation without a learning claim.
- Quantum: [implemented model](quantum_model.md), including equal-weight modes −4, 3 and 7, periodic ring, projection convention and amplitude interpretation. [David Tong's Cambridge particle-on-a-circle derivation](https://www.damtp.cam.ac.uk/user/tong/qm/qmhtml/S2.html#S2.SS1.SSS1), checked October 28, supports the periodic-mode construction; the chosen modes remain the app's design choice.
- Artemis II: [NASA splashdown and recovery record](https://www.nasa.gov/gallery/artemis-ii-splashdown-and-recovery/), checked October 28, supports April 10, 2026, 8:07 p.m. EDT. The supplied artwork is described as illustration, never telemetry. The card preserves the existing Maeve Marshall thesis imagery / [BOROMIR source](https://github.com/the-astronot/boromir/blob/main/README.md) credit whenever Mission Control is active, replacing the former standalone credit card.

Asset permissions, proposed organizational lockups, gradients and formal RPI approval retain the existing unresolved status recorded in the brand and asset licensing references. This copy change does not establish new permission or approval.

## Implementation

`js/utils/barInformation.js` contains the complete inventory and updates text safely with `textContent`. Its sync function runs after initial state preparation and in the existing style-change synchronization path, covering user selections and restored style state. Integration also loads the utility before routed chrome is inserted and prepares its detached shell, so selected-style copy is present before the renderer initializes. `main.js` retains its existing p5 global-state structure; the new copy remains in a separate utility following the project's browser/CommonJS compatibility convention.

The card uses semantic `aside`/`h2`/`p` markup, existing surface/text/border tokens and rem sizing. There is no card animation or live region. The Mission Control source link remains keyboard reachable with a visible focus outline. Canvas, renderer, export coordinates, motion state and profanity filtering are unchanged.

## Validation

- 305 existing unit tests pass in 30 suites.
- `scripts/barInformationSmoke.js` checks all 21 selectable styles, placement above the report button, four themes, 320/390/768px layouts, direct Quantum routing, both reduced-motion settings and credit keyboard focus. Passed in local Chromium and WebKit. Screenshots are in `/tmp/rpi-bar-information-chromium` and `/tmp/rpi-bar-information-webkit`; desktop and 320px Mission Control images were visually inspected.
- Browser checks fulfill the actual local static files through Playwright because temporary Python HTTP-server runs encountered connection resets during bootstrap. Chromium logs an audio-worklet initialization warning in that fixture; audio playback is outside this copy/layout check. No renderer or motion module is mocked.
- Mac Playwright engines do not establish physical Windows/Android, Safari-app, manual screen-reader or formal brand validation.

### Integrated HTTP verification

After combining the Quantum and motion-preference repairs, the card smoke passed
again in Chromium and WebKit over a real HTTP server, without static-file
fulfillment. The fixture now defaults to actual HTTP. A delayed-main probe found
that the routed card initially showed an empty Solid description; the bootstrap
now prepares the selected-style text before inserting chrome. A regression
checks Quantum copy before the canvas exists. See `scripts/routedStartupSmoke.js`.

Numeric's card now names decimal entry and formula selection as separate sources and explains that signs are not encoded. Formula approximations, sources, limits and historical migration are documented in [Numeric modes](numeric_modes.md). The remaining 20 cards are unchanged.
