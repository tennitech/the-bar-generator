# Clipboard menu review images

Captured October 27, 2026 from the SVG/Finder follow-up worktree after removing the extra raster format:

- `clipboard-desktop.png`: Chromium, 1440 × 900, Black ink/light UI; native SVG copy and Download SVG file recovery, reached using the keyboard.
- `clipboard-mobile.png`: Playwright WebKit, 390 × 844 touch context, White ink/dark UI; explicit SVG source-text fallback and Download SVG file recovery.

The existing toolbar retains 38 px desktop action heights, aligned at y=8.5 px,
and its 10 px inter-control gaps. Copy rows measured 51 px high at desktop; both
actions met the 44 px minimum and stayed within the mobile viewport. Real keyboard
Tab navigation produced a visible outline in both Black/White themes; Enter
activated copying and Escape restored the export trigger. Touch tapping and
reduced-motion operation passed the clipboard smoke script. Native desktop
controls, menu text, density and icon alignment were inspected in full-page
context. Copy/download icons use the existing exact Feather glyphs.

The screenshots reuse the repository's existing configured identity/font assets;
no external artwork was added. The [existing permission questions](../asset_licensing.md)
remain open. Browser checks do not establish physical Safari/iOS behavior,
manual screen-reader acceptance, native-app vector paste support, owner testing
or formal RPI approval. WebKit clipboard operations used a test adapter; actual
SVG/PNG clipboard payload readback used Chromium's isolated headless shell.
