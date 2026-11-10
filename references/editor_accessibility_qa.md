# Larger editor controls: release validation

Date: November 10, 2026. Integration base: `862fa8932d10cf4ca570f8a37a263a68d5c3c328`
(after schematic export cards #168).
Branch: `codex/feat-larger-editor-controls-release`.
Original candidate: `07beffecbeeae10a773e8e55bd088e2a1816592c`, retained on
`codex/feat-larger-editor-controls`.

## Scope and integration

The three-dot disclosure gains a **Larger controls and text** switch before
Why not.... `js/utils/editorAccessibility.js` restores the editor-only
`rpi-editor-larger-controls` localStorage key in the head and binds the native
switch after the direct/routed shell exists. `css/editor-accessibility.css`
contains the switch presentation and opt-in size rules. All 26 generator entry
pages load those assets after the current main stylesheet; 25 routed stubs
request the updated full shell. Bootstrap fallback and Home prefetch use the
same shell version. No runtime library or asset is added.

The integration keeps current main's pinned footer, independently scrollable
About region, disclosure buttons, control helpers, theme palettes/states, sidebar
fade and native Escape/outside-focus dismissal. Section headings, new help and
limit text, and export-composition labels participate in the larger setting.
The indicator retains readable On/Off text. Primary targets are 3rem, labels
0.875rem, and main field text 1rem. No renderer, export, model, theme, shared
artwork configuration, main.js or secretIntro.js behavior changes are made.
Home changes only its existing generator-shell prefetch cache reference.

The optional keyboard-shortcuts release is separate and may add a sibling in
this menu. Preserve both items, retain the existing disclosure and reconcile
shell cache references during final integration. The parent release coordinator granted the exclusive merge slot after #168.
Its schematic card implementation, review evidence and existing script cache
reference are preserved byte-for-byte. All 90 focused sizing, disclosure,
shell-cache and export integration tests pass in six suites after integration;
JavaScript, all 80 generator inline scripts and whitespace checks pass. Shared shell/bootstrap/Home references keep the sizing
release version. Both additive status entries survive. Branches are retained.

## Automated validation

The focused suite covers missing/invalid saved values, restoration before DOM
readiness, both switch directions, denied storage, focus retention after reflow,
not scrolling after a focus change, one-time asynchronous route binding,
cross-tab updates/clear and every route's early assets/accessible-switch wiring.
All 13 focused tests pass. JavaScript syntax, all 80 generator inline scripts and
whitespace checks pass in cloud Node 24.22.1. No lint, build or typecheck command
is defined for this static application.

Two monolithic full-suite processes were terminated with exit 137, with no
reported assertion failures. A bounded-heap retry had the same outcome. Full
validation is therefore rerun as four sequential Jest shards using the same
checkout and dependencies:

```sh
node ../the-bar-generator/node_modules/jest/bin/jest.js --runInBand --cache=false --shard=1/4
node ../the-bar-generator/node_modules/jest/bin/jest.js --runInBand --cache=false --shard=2/4
node ../the-bar-generator/node_modules/jest/bin/jest.js --runInBand --cache=false --shard=3/4
node ../the-bar-generator/node_modules/jest/bin/jest.js --runInBand --cache=false --shard=4/4
node --check js/utils/editorAccessibility.js
node --check tests/editorAccessibility.test.js
git diff --check
```

The first shard-3 attempt found the new shell version was missing from bootstrap
and Home prefetch. Those references and the routed bootstrap script cache keys
were aligned before rerunning the affected shard. Full-suite results are
now complete: **1,062 tests in 92 suites pass** across the four shards
(337 + 185 + 232 + 308 tests, 23 suites each). The required GitHub
Unit tests check must pass on the final PR head before a normal merge.

After integration with released #168, all **1,062 tests in 92 suites pass again**
in four sequential shards (337 + 185 + 232 + 308). This run validates the
integrated runtime tree `e4ef600dea4aae062c0fd8401227008557114228`; the following
commit records only this completed validation. The 90 focused integration tests
also pass, and the schematic implementation still matches released main.

## Rendering verification limits

Browser launch escalation was denied earlier in this cloud session. This task
does not retry a denied browser route or close/reopen a PR. No new screenshots,
computed layout bounds, touch/keyboard/screen-reader interaction results or
real downloaded before/after export comparisons are available. Source isolation
and unit results do not establish rendered QA or formal RPI approval. No review
images are published because none were produced in this permitted workflow.

On the final live candidate, check:

- Open the three-dot menu, Tab to the switch, use Space/Enter repeatedly, then
  Escape. The switch stays named and focused; Escape returns to More options.
- Reload with On and Off; navigate between generator styles; confirm the saved
  preference remains local and artwork share links do not gain a preference key.
- Review 320/390 px portrait, 768 px tablet and desktop layouts, plus short
  landscape heights. Scroll to the last control and the entire information card.
  Open More options and all dropdown/export menus; every item must remain
  reachable, without clipped text, focus rings or horizontal page overflow.
- Review Solid, Neural Network, Waveform/Quantum and Artemis II, including long
  labels, slider value editing, Reset/Randomize, checkbox toggles and descriptions.
- Check light/dark/Artemis themes, reduced motion, browser zoom, screen-reader
  switch state and native touch sizing. The mode uses existing theme tokens;
  theme contrast and forced-colors appearance still need rendered review.
- Pause animation and compare downloaded SVG/PNG before and after toggling.
  Artwork and export dimensions must match; preview fit may resize when the
  available workspace changes. Include any new combined export setting.

Manual acceptance, physical-device validation and formal RPI approval remain
separate from automated checks.
