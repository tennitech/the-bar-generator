# Interaction feedback

## Scope

Controls remain quiet so the generated bar is the expressive part of the product.
This pass adds feedback only where a user makes a choice, presses an action, or
receives a result. It introduces no runtime library, timers, new colors, or logo
geometry changes.

- Export Download and Copy groups use small uppercase secondary labels and a
  fine divider. Every format button carries its own existing Feather action icon.
- Download arrows move down 1.5 px on pointer hover or keyboard focus; the rear
  copy sheet moves up/left 1 px. The tray and front sheet remain anchored.
- Disabled buttons do not respond. Touch does not gain sticky hover animation.
- Export results use a decorative state icon beside the existing announced text.
  A check means preparation/copy completed; it does not establish receipt by a
  browser or another app. Existing copy/download guidance remains authoritative.
- Success toast checks draw once. Selected dropdown checks fade in place. No
  error shaking, bouncing labels, idle animation, or timing-dependent controls.
- Reduced motion suppresses the new feedback, switch-thumb transitions, and the
  older audio-indicator pseudo-element animation. Text, symbols, selection state,
  focus outlines, and existing accessible names remain available immediately.

## Reference

The supplied [Marked status-menu reference](https://marked.dev/ref/fe468639-cf8f-51db-9c8c-95a2438f077d)
was accessible as a [static still](https://marked.dev/seed/media/x-keviduk-2114295013735866729-2.png).
The public reference page did not expose its animation during review. The user's
explanation described animated state icons and a moving selected checkmark. This
informed restrained state cues, not a copy of the reference's rounded styling.
The user also supplied a screenshot of the prior export menu and specifically
requested the divider, smaller group labels, and per-button action icons.

## Checks

Run the existing unit suite, `scripts/exportMenuHierarchySmoke.js`,
`scripts/interactionFeedbackSmoke.js`, and `scripts/clipboardSmoke.js` against
the final checkout. Use Chromium and WebKit for relevant browser checks. The
interaction test exercises repeated success/error states, duplicate-start
protection, keyboard focus, Escape/Cancel recovery, and both motion preferences.
Hierarchy coverage includes 320 px, 375 px and landscape, minimum target heights,
three theme contrasts, overflow, and an actual Large PNG download. Clipboard
coverage uses Chromium's isolated native clipboard and a WebKit adapter, not a
physical-device paste test. Screenshots require visual review.
