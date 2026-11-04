# Interface icon consistency audit

Reviewed November 4, 2026 against AGENTS.md, references/rpi_brand_guidelines.md,
references/asset_licensing.md and third_party/feather/notice.md. RPI guidance asks
for calm supporting controls, precise geometry, purposeful color, and accessible
states. It does not mandate Feather; this product already uses Feather v4.29.2.

## Covered surfaces

- Generator header: repository, export, menu and close actions.
- Export menu: Download/Copy formats, working/result icons and selected states.
- Preview controls: play/pause and audio-on/off states.
- Workspace: zoom in/out; Fit remains a text action, not an invented glyph.
- Toasts: information, success, error and dismissal.
- Dropdowns and the new Parameters overflow cue.
- Report dialog dismissal and the optional ASCII overlay's replay/close actions.
- Home's currently released controls are text-based; no second icon family is
  introduced by them. Subsequent Home controls should reuse the pinned family.

## Corrections and rules

Toast dismissal now uses the existing Feather x instead of a typographic ×.
Selected dropdown markers now mask the pinned Feather check instead of a
hand-drawn CSS check. The overflow cue uses the existing Feather chevron-down.
Existing recognized action meanings and accessible names are preserved.

Keep the source 24×24 viewBox, 2 px stroke, round caps/joins and currentColor.
Component footprints intentionally vary from 14 to 20 px according to context;
that does not change the source stroke geometry. Decorative SVGs are hidden from
assistive technology and cannot receive focus. Labels belong to their controls.
Native radio/switch elements are control states, not a competing icon family.
RPI identity assets, data patterns, style preview artwork and the ASCII animation
are artwork rather than interface icons and are not replaced by this audit.

No unresolved icon-family inconsistency was found in these released surfaces.
The pinned file-hash/source tests and rendered keyboard/overflow/dismissal checks
provide implementation evidence, not formal RPI brand approval or physical-device
accessibility certification. Future additions should extend this same source
record rather than silently mixing icon libraries.
