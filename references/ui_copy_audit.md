# UI copy audit

November 11, 2026. Scope: the app’s public UI, not a redesign or formal RPI approval.

## Source and approach

Read the live official [Voice & Tone](https://brand.rpi.edu/d/pfJS6BKVKBeq/brand-guidelines#/-/voice-tone)
and [Color](https://brand.rpi.edu/d/pfJS6BKVKBeq/brand-guidelines#/-/color/secondary-colors)
pages in the cloud browser. Both showed October 29, 2026 at 10:29 AM as the
modification time. The [RPI Policy Library](https://policy.rpi.edu/policy/rpi-brand-guidelines)
identifies the Brand Hub as the policy document.

Apply the voice’s approachable, evidence-based, humble tone to an interactive
tool: explain the actual system, avoid obvious instructions and repeated
invitations to explore, and give a useful recovery action. Retain room for
curiosity where it adds something, such as the network’s wider/deeper question.
This is an editorial application of the guide, not an official word-count rule.

Scientific meaning was checked against `references/bar_science_notes.md`, the
linked per-pattern references and current controls/model code. Original sources
and credits remain in [bar information cards](bar_information_cards.md).

## Inventory and decisions

- **Home and alternate Home:** reduce the startup prompt from “Select a bar design
  below to get started” to “Choose a bar design.” Shorten the keyboard skip link
  to “Open the generator.” Retain motion/drag instructions, labels and credits.
- **About all 22 selectable styles:** 967 to 609 whitespace-counted words (37%
  less), ranging from 14 words for Solid to 58 for Ring Wavefunction. Remove
  repeated compare/explore prompts while retaining each pattern’s actual system.
  Disabled Music, Data Graph and Truss remain unavailable, without new claims.
- **Scientific limits retained:** UTF-8 bit order and rejected-text behavior;
  Morse timing, transliteration and omissions; Nucleotide export bounds, pairing
  convention and excerpt provenance; Numeric approximation, unencoded sign and
  empty zero cells; the untrained network, activation and negative weights; Ring
  normalization, mode/angle choices, scrolling coordinates, recurrence, amplitude
  interpretation and display choices. Runway approval/navigation caveats and
  Artemis date/time and non-telemetry distinction remain.
- **Control help:** shorten Ruler, Nucleotide, Numeric and Phase hints. Replace
  “recurrence” in the visible Phase helper with “repeating cycle,” retaining the
  precise accessible name. LFO help preserves signal provenance, window length,
  silent/live distinction, freeze/replay behavior and GIF wrap limitation.
- **Keyboard guide:** shorten the lead-in, action descriptions and preference
  explanation. Name Export consistently. Keep every shortcut, supported-style
  condition, text/control/menu exclusions, preference storage caveat, navigation
  instructions and browser/system shortcut assurance.
- **Secondary colors:** preserve the exact owner-supplied official guidance
  verbatim, including all exceptions and the direct source link. Its length is
  intentional. No palette permission or type contrast rule changes.
- **Other dialogs/settings:** shorten the larger-control helper and retained
  report-form placeholders. Keep the full automatic metadata/state-URL disclosure
  and optional email status. The live report action remains the existing GitHub
  flow; no report was sent and no reporting behavior changed.
- **Errors and status:** retain concise recovery-oriented loading, filtering,
  export, clipboard and audio failures. Keep capability/host-permission caveats,
  captured-design provenance, accurate download-request versus delivery status,
  zero-ink guidance and scope history/update/fallback diagnostics. A long status
  can explain a real exceptional state; length alone is not a reason to delete it.
- **Accessibility and navigation:** keep descriptive icon names, range/value
  labels, live regions, zoom and pinch guidance, reduced-motion instructions,
  focus/Close controls, input restrictions and meaningful link text. No ARIA
  relationships, roles, keyboard bindings or disclosure behavior are removed.
- **Route/fallback/prototype:** reviewed loading recovery, no-JavaScript fallback,
  404 routing and the animation/ASCII overlay. Existing brief copy stays. Changed
  shell, bootstrap and About assets receive coordinated cache versions.
- **Export:** reviewed the labels and status/error copy. The separate owner-requested
  composition-subtext cleanup is not part of this patch; its work is preserved.

## Verification

The existing About tests cover detached routed startup, all description changes,
unknown-style fallback, disclosure-state preservation, scroll reset and Artemis
credit visibility. Added checks compare the inventory with actual selectable
options and retain the essential scientific and approval qualifications above.

The optional About browser smoke had stale Quantum names and the removed Red on
White theme. Its expectations now match Ring Wavefunction and White on Red.
That script was syntax-checked, not executed here.

Rebased onto the merged export-copy cleanup #186 (`acee536`), retaining its
removed captions and description reference. Both status entries survive; only
the shell delivery version advances. The prerebase final suite passed 1,126 tests
in 95 suites with a bounded Node heap after an unbounded run was resource-killed.
The combined final suite results and exact-head required CI are recorded in the PR. This patch
changes copy, tests, documentation and delivery cache keys only. No mathematical
model, filtering, palette, renderer, asset, export dimensions or runtime control
logic changes.

The official source pages were read in a browser. Rendered app QA was unavailable
in this environment. Final layout at phone/desktop widths, native screen-reader behavior,
physical devices, aesthetic acceptance and formal RPI approval are not established
by source review or the unit suite. Review screenshots are not included.

## Release reconciliation after #188

Rebased onto `81605e5`, preserving the entire export markup and CSS from #188.
Only shell/bootstrap cache versions conflict; they advance together for this
copy release, while export CSS retains its current key. Both project-status
entries remain. Rechecked the copied official color guidance and all generator
ARIA names, roles and relationships against current main. #184 remains a separate
following release and is not included here. Final combined test and CI results
are recorded on PR #187.
