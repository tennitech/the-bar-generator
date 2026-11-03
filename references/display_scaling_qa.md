# Display scaling and complete first-frame verification

Date: November 3, 2026. Based on `395ce42` in an isolated feature worktree.

## Changes

- The landing page uses a continuous scale based on CSS viewport width/1440 and
  height/900, bounded below by 1 for the decorative bars. Hero fit continues to
  handle compact screens. This intentionally does not multiply layout by DPR:
  browser and OS scaling already change the available CSS viewport.
- Larger bars, horizontal gaps, vertical spacing, heading, credits and content
  width share that scale. Tall viewports add lanes instead of stretching the
  vertical gaps. Untransformed dimensions measure each rotated lane.
- The “Select a bar design” prompt uses bounded max-content width, zero paragraph
  margins, rem typography and real viewport wrapping. It no longer shrink-wraps
  against only the right half of a small viewport.
- Lane speed drops from 62–69 to 24–30 CSS px/s at baseline size. Larger
  compositions keep the same proportionate speed. Pointer hover/press stops the
  lane immediately; pointer exit eases back into motion. Touch release/cancel
  clears the held state. Reduced-motion movement remains disabled.
- Static preview readiness is checked before clearing/painting letters. The
  current bar's image must be ready, or a compatible already-ready image of the
  exact same markup must exist. The first entrance begins after a complete draw.
  Image failure offers Retry, and changing styles dismisses its alert. No model,
  official logo geometry or export calculations changed.
- Entrance bookkeeping releases decoded image references after the first pass,
  so responsive lane creation/removal does not retain obsolete image elements.

## Verification

- Full unit suite: **504 tests in 45 suites passed**.
- Chromium and Playwright WebKit each passed `scripts/displayScalingSmoke.js`:
  15 viewport/DPR combinations, 8 forced 500ms static-image delays, immediate
  hover pause/resume, reduced-motion stopping, failed-image Retry and changing
  away from a failed style. Final canvases contain real rendered pixels, and
  no letter draw occurs before the initial static bar is ready.
- Layout cases: 320×568 DPR1, 390×844 DPR3, 844×390 DPR2,
  1024×768 DPR2, 1440×900 DPR1/2, 1920×1080 DPR1,
  2560×1440 DPR2, 3840×2160 DPR1, 5120×1440 DPR1,
  7680×4320 DPR1, 1440×2560 DPR1, 800×450 DPR2,
  720×450 DPR2 and 576×360 DPR2. These include effective viewports
  representative of browser/display scaling, not direct OS setting changes.
- Repeated resize creates/removes lanes without losing the layout. Same CSS
  viewport at DPR1 and DPR2 has identical title, brand, prompt and row geometry.
  Hero and prompt stay within bounds; row pitch remains 0.95–1.34× row height.
  The tall-portrait field retains one to two lanes of clearance above the heading.
- 1440×900, 4K, tall-portrait and 320px screenshots were visually inspected.
  The tall-portrait refinement removes the oversized blank band above the heading.
- The existing entrance/history suite passed 34 Chromium/WebKit scenarios,
  including normal/reduced motion, repeated navigation, Back/Forward, delayed
  assets, unsupported native transitions, interaction cancellation and early
  control intent. Two stale fixture expectations were corrected to the already
  integrated Triangles actions and disabled-at-default Reset behavior.
- Full Chromium browser smoke passed all 21 styles/SVG exports, PNG, five
  viewport widths, text safety, reduced motion, 2D fallback and renderer recovery.
- In Chromium and WebKit, the existing export invariance check confirmed actual
  Triangle Grid SVG, PNG (1160×762) and header equality at Fit versus 400%, DPR3.
- Reduced motion now disables transitions rather than assigning 0.01ms to every
  element. The previous blanket duration inadvertently animated otherwise static
  dimensions and produced stale measurements during initial layout/resize.
- Evidence is in `/tmp/rpi-display-evidence` in the verification workspace;
  these temporary screenshots and JSON are not repository assets.

## Limits

This is a bounded software matrix, not every display, macOS scaling mode, physical
screen, viewing distance, native Safari app, or accessibility combination.
DPR and viewport emulation are not physical-display validation. A native browser
zoom changes the effective CSS viewport and DPR; equivalent viewport cases test
that layout response, not an OS settings panel or hardware display.

The installed Playwright Firefox engine could not launch in this execution
sandbox: `RenderCompositorSWGL failed mapping default framebuffer, no dt`, then
launch timeout. Writable temporary HOME/cache and supported software-renderer
preferences did not resolve the launch. No Firefox page could be tested, and no
Firefox pass is claimed. The generic async image mechanism is separately covered
by deliberate delayed-image tests in available engines. Formal RPI/asset approval
and the owner's physical Firefox/macOS testing remain separate.

Cache-version consolidation and any changed pattern's generated marquee samples
must be handled in the combined release; this branch does not rewrite unrelated
route versions or overwrite the parallel motion changes' generated assets.
