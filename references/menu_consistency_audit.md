# Menu and dialog consistency audit

November 11, 2026. Scope: the current generator and Home, including inherited
styles, routed shells, responsive sizing, focus/dismissal and motion preferences.
This is source and automated-test evidence, not a rendered accessibility audit.

## Findings and changes

- **Secondary Color Usage and Keyboard shortcuts:** previously disagreed on
  width (44rem / 30rem), corner radius (theme token / 8px), backdrop (solid dark /
  blurred), title size, header copy and Close control (text / multiplication glyph).
  They now inherit one native dialog shell: 44rem maximum, theme surface/border,
  theme corners, unblurred dark backdrop, same padding, heading and text Close.
  Removed the shortcut-only kicker. Each guide keeps its own appropriate body.
- **Keyboard guide interactions:** now opens at its heading and top of content,
  like the color guide. Escape, Close and a deliberate backdrop press dismiss it.
  Dragging from content onto the backdrop no longer closes it. A queued old close
  cannot steal focus after a reopen. Focus returns to a visible trigger/fallback.
- **Three-dot menu:** now uses the same menu surface, border and shadow as the
  custom style/color selectors. Existing editor-accessibility CSS remains the
  final authority for footer-relative sizing, short viewports and larger controls.
  Existing Escape, outside click and focus-leave dismissal remain intact.
- **Larger controls:** guidance text, shortcut rows/keycaps and hints now respond
  to the preference alongside other dialog text. Native dialog buttons also
  respect reduced motion. No animation is added.
- **Retained report dialog:** header and shell match the information dialogs;
  its form remains narrower and keeps first-field focus. The live Report a Problem
  action currently opens GitHub, so this patch does not introduce a new reporting
  path, change form submission, or send any report.

## Deliberate distinctions retained

- **Export:** anchored nonmodal dialog, with composition/size choices, grouped
  actions and progress. Its existing stronger shadow distinguishes it from the
  canvas, as previously requested. It keeps its own responsive width and focus
  navigation. Selection geometry and all export runtime code are untouched.
- **Style/color selectors:** keyboard-operable listboxes, not modal dialogs;
  sticky group labels, theme swatches and chosen-row indication stay unchanged.
- **About/technical disclosures:** inline native details, not floating menus.
  Their shared chevrons, natural height and collapse behavior stay intact.
- **Why not:** full-screen artwork experience, not an informational panel. Its
  previously specified dark chrome, replay/close icons, inert background and
  reduced-motion behavior are retained.
- **LFO help / export-blocked hint / tooltips:** contextual help, not actionable
  menus. The LFO hint now uses the shared corner token. Existing labels, placement,
  hover/focus treatment and status announcements remain.
- **Mobile controls sheet, Home instruction hint, toasts:** distinct navigation
  and feedback surfaces; no reason to turn them into modal guides.

## Verification and limits

Regression tests cover shared native-dialog markup/theme contracts, focus return,
Escape, intentional backdrop dismissal, repeat opening and stale close events.
Full test results are recorded in project status. No artwork, palette, export,
audio or scientific-generation runtime is changed.

Browser rendering, computed theme colors, native Tab confinement, real touch,
200% text zoom and physical Safari remain **unverified** under the known browser
restriction. No attempt was made to bypass it. The optional
`scripts/menuConsistencySmoke.js` exercises these states and produces review
images in a permitted browser environment. No screenshots were manufactured.

Reconciled onto #182, preserving its Ring/GIF runtime keys and #181 trackpad
behavior. Routed shell, bootstrap fallback and Home prefetch advance together
so returning visitors receive the updated dialog markup and helper.
