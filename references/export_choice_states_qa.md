# Export choice-state consistency

November 11, 2026. Scope: export composition cards, image-size choices and adjacent
export action surfaces. The separate three-dot menu/dialog work in #184 is not
included.

## Evidence and change

The current public Waveform export menu was inspected in the cloud browser.
Composition used native radio rendering and an extra inset selected border;
image size used a custom radio with a single selected border. Hover and focus
colors differed, and both selected labels remained medium weight. Native Tab,
arrow-key selection, composition/size dimension updates and Escape-to-trigger
focus worked in that baseline.

Both groups now use one shared export choice class. They share a 1px border,
control radius, neutral hover surface, native radio semantics with one drawn
radio glyph, and the existing menu selected background/text tokens. Selection
uses the app's existing red/white menu fill and bold primary label. The decorative
schematic inherits the selected ink; official paths and exported artwork do not
change. Hidden, aria-hidden bold copies reserve each label's layout footprint,
so font weight can change without moving nearby text or wrapping the card anew.

Every choice/action uses the same outside 2px keyboard ring; it remains distinct
from the selected fill. Action icons and text share pressed colors. Disabled
controls do not acquire enabled hover/pressed states. Forced colors restores
native radio rendering and system selection/focus colors. No new animation,
font, palette, renderer, export dimensions or behavior is introduced.

Shell, route first-paint stylesheets, bootstrap/fallback and Home prefetch cache
versions advance together. Larger-controls sizing remains in its existing
stylesheet. #184's three-dot menu changes are neither copied nor merged here.

## Verification and limits

- Automated source/regression checks cover four native radio choices, accessible
  label copies, shared states, dimension-stable selected CSS, disabled guards,
  forced-color fallback, and selected text/radio contrast (over 4.5:1).
- Existing export snapshot, clipboard, GIF, busy/cancel and keyboard-dismissal
  unit tests remain applicable and unchanged.
- `scripts/exportChoiceStatesSmoke.js` supplies optional rendered checks for
  desktop/390px/320px, light/dark/Mission Control, both editor sizes, label/box
  stability, keyboard selection, focus, busy recovery, reopen and forced colors.
- The modified candidate could not be opened in the available browser environment.
  The optional rendered test has not been run. Candidate screenshots, native
  screen-reader output, touch, browser high-contrast rendering and aesthetic
  acceptance remain unverified. Baseline inspection is not candidate validation.
- The complete local suite passes 1,130 tests in 96 suites. All 81 inline scripts
  and the changed bootstrap/optional smoke script parse; whitespace checks pass.
  Exact-head CI results are recorded in the pull request. Passing
  software checks do not imply formal RPI approval.
