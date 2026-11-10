# Paired theme picker — QA and compatibility

Date: November 10, 2026. Initial base: main d55bdc1 (published PR #137).
Branch: `codex/feat-theme-pairing-swatches`. The final candidate also preserves
main ecec2e1 (PR #139, sidebar footer) and dfcc987 (PR #138, Why not retry).
Shared cache URLs are reconciled while their complete behavior and additive
status records remain intact.

## Behavior and scope

The color menu and selected trigger show a 2.25 × 1.5rem background tile
with a 1.125 × 0.375rem mark in the composition's foreground color. This keeps
the two colors in their actual foreground/background relationship. The existing
neutral option labels retain each full pairing name. The tile is decorative,
uses `aria-hidden`, and does not replace the combobox/option names or selected
state. Styling uses existing border/radius tokens and no new asset.

The color picker uses the established visual-menu component on touch, as the
style/direction selectors already do. Existing Arrow/Home/End/Enter/Space,
Escape/Tab, pointer selection, focus return, disabled/hidden options and scroll
fades remain. Trigger labels can wrap without fixed-height clipping. The
selected swatch updates in place when themes are restored or changed.

All remaining palette pairs retain their exact hex values. Mission Control
uses its existing dark canvas base `#03060D` with existing `#F4F7FB` ink for
its compact tile. Its illustrated preview itself is unchanged.

## Legacy recovery

Red on White is removed from the select and available theme list. Query aliases
`red` and `red-on-white` resolve to the existing Black on White default. The
same explicit migration runs before saved-snapshot native-option validation,
so existing version-1 URLs/named saves retain their names, controls, runtime data
and other settings while restoring a safe available composition. Unknown
unrelated saved options still fail validation. Input snapshot objects are not
mutated. Alias lookups exclude inherited object properties.

The update preserves the published header/sidebar correction, secondary-only
underlined How to use control, complete modal markup, bar geometry, patterns,
and both export compositions. Red-ink export tests and the offline test helper
select Red on Gray instead of the retired mode. No new font, artwork,
dependency or workflow is added.

## Validation

- Focused theme synchronization, legacy query/snapshot recovery and export
  snapshot checks pass.
- All 866 tests in 78 suites pass after preserving PR #139 and PR #138.
- JavaScript and all generator inline scripts are syntax-checked. Route/shell
  cache versions for the changed shared modules are checked for consistency.
- Source comparisons check unchanged retained palette values, complete modal
  markup, header/sidebar styling and export implementation.
- The existing browser smoke script checks paired swatch colors, obsolete query
  recovery, touch-menu swatches and keyboard behavior when a browser is available.
  It is syntax-checked, not run here.

Rendered browser QA remains unverified because of the established Chromium
socket restrictions and missing WebKit libraries. No denied launch,
installation, sandbox bypass or local-browser fallback is attempted. Source
deployment hashes establish served code only; they do not establish appearance,
native accessibility or physical-device behavior.

## Owner test items

- Open Color Theme on desktop and phone: each row shows a paired tile and full
  readable name; labels and swatches fit, and the list scrolls naturally.
- Select via keyboard and touch, then restore a share URL: the selected name,
  tile, preview and secondary-help visibility agree.
- Open old red/red-on-white query URLs and version-1 saved bars: Black on White
  appears and the other saved settings remain intact.
- Verify Red on White is absent; check the retained primary/secondary choices,
  neutral header/sidebar, existing modal and both export compositions.

The separate PR, required CI and Pages run record the exact release state.
Existing branches remain preserved.
