# Full-color theme rows — source and QA

Superseded by the owner’s compact typography/pairing correction; see
[the current correction record](theme_picker_correction_qa.md). The account below
records PR #149’s historical implementation and validation.

Date: November 10, 2026. Initial base: main e19238a (PR #145).
Branch: `codex/feat-color-theme-rows`. Final reconciliation also preserves
main 5f7ad20 (PR #146, responsive marquee focus).

## Reference inspection

The owner supplied `libfile_40eb874fe9988191acb68855851166aa`, resolved as
`image(20261110-172707).png`. It was materialized through the current Library
skill, its local Library identity applied and verified, and readable pixels
inspected before image-dependent changes. It is a 1000 × 649 RGB screenshot
showing full-width colored table bands, colored labels and contrast classifications.
Sample background pixels include black (0, 0, 0), red (214, 1, 27) and gold
(206, 172, 56). Its layout is the visual reference; all palette values continue
to come from the existing exact application constants.
SHA-256: `31b55273ed42deef471b43cee5fa72bb8a6dc3398a4681351bfbedab42461270`.
The PNG remains local evidence and is not redistributed as an asset.

## Design and interaction

The ten currently offered choices remain, with complete pairing names painted
in the foreground color across a full background-colored row. There is no
nested color tile in either the rows or the neutral closed trigger. The existing
RPIGeist Bold face supplies labels at max(1.25rem, 19px), weight 700, with wrapping.

Hover adds black/white bottom rules. Keyboard-active rows receive black/white
inset keylines. Selected rows show a black checkmark on a white circular marker
with a black border; its span is aria-hidden, so option names remain unchanged.
The legacy sidebar pseudo-element checkmark is suppressed only for these rows
to avoid a duplicate marker; the picker also overrides the old marker padding.
The selected marker and keyboard-active frame are independent. Row colors remain
exact in all three states. A thin scrollbar provides a scroll cue, and color
rows remain clear of gradient overlays. Forced-colors mode supplies a system
Highlight focus outline and system-colored marker.

The existing combobox/listbox roles, active-descendant management, selected ARIA
state, Arrow/Home/End/Enter/Space, Escape/Tab, click/tap behavior and grouped
scrolling are retained. Labels wrap and the menu still fits available screen
space. There are no new focus stops or assets.

## Contrast evidence

[W3C's Contrast Minimum guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
permits a 3:1 ratio for sufficiently large text, including bold text above the
14pt threshold. The 19px minimum is above that bold-text size. Exact application
colors are checked without rounding before comparison. Display values below are
rounded only for reading.

| Choice | Text/background contrast |
| --- | ---: |
| Black on White | 21.000 |
| White on Black | 21.000 |
| White on Red | 5.418 |
| Gray on Red | 3.274 |
| Silver on Blue | 3.505 |
| Black on Gold | 9.554 |
| Red on Gray | 3.274 |
| Blue on Silver | 3.505 |
| Gray on Black | 12.692 |
| Mission Control dark base | 18.870 |

The unit check also verifies that at least one of black/white has 4.5:1 contrast
against every row background, supporting the two-tone hover/focus cues. The
marker itself uses black on white (21:1). These are color calculations and
source checks, not a blanket accessibility certification or rendered-browser test.

## Validation and preservation

All 926 tests in 81 suites pass after preserving PRs #146 and #147. Focused checks cover row styling, retained exact
pairs, large-text contrast, state-cue contrast, selection-label synchronization,
legacy red query/snapshot fallback, and unchanged modal lifecycle. JavaScript,
inline scripts, entrypoint cache consistency, source preservation and whitespace
are checked before publication. The previous nested-swatch layout is superseded;
the safe Black on White fallback for retired red/red-on-white settings remains.

The optional browser harness checks exact row foreground/background in normal,
hovered and keyboard-active states; selected marker visibility; no nested tile;
large bold label size; actual active-descendant navigation; touch selection;
and the previously shipped compact focus/modal radius behavior. It is
syntax-checked, not executed here. A CSS parser is not installed in this executor;
CSS was source-reviewed. Existing Chromium socket and WebKit dependency
restrictions are respected without another denied launch or bypass.

The entire modal markup, exact remaining brand palette, neutral header/sidebar,
underlined compact How to use focus, GIF timing, and export implementation are
preserved. No dependency, font, artwork or workflow is added.

## Owner checks after deployment

- On desktop and phone, inspect the full-color rows, wrapping and scrolling.
- Hover, use Arrow/Home/End, select with Enter and tap a row; confirm each cue is
  distinct and visible across light, dark, red, blue, gold and neutral backgrounds.
- Verify selected names, previews and secondary-help visibility agree; check
  an older red saved link still recovers safely.
- Check forced-colors/high-contrast mode, modal dismissal, compact help focus,
  popup corners and normal exports.

The PR, required CI and Pages run carry release status. Live file hashes prove
served source, while browser rendering and native/device interactions remain
unverified. Existing branches remain preserved.

Final reconciliation also preserves control presentation PR #147 (`df359fdac0f64b2fa3ac52745cfdd130492f7c92`), including its chevrons, Randomize die, speed descriptions and cache references.
