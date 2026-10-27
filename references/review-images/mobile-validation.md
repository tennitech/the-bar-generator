# Mobile correction review captures

These are original local browser QA captures of the existing application at runtime commit `a12da421d5f37d2d7bc8f4daab23850afeaa5966` on October 27, 2026. They show the corrected native picker labels, matching header/preview foreground and separate controls/preview space in portrait (390 × 664) and landscape (844 × 290).

- `mobile-controls-portrait.png`: WebKit mobile emulation, Ruler, Gray theme, menu open.
- `mobile-controls-landscape.png`: WebKit mobile emulation, Solid, Gray theme, menu open.

The underlying app assets retain their existing source and permission records in [asset licensing](../asset_licensing.md); these captures do not establish new permissions or formal RPI approval. Browser UI, a physical iPhone keyboard and assistive technology were not captured or verified.

Validation used one temporary local server and serial browser processes. It covered viewer-only two-finger pinch with native page pinch outside the viewer, pan/finger transitions/cancellation/orientation, stable toolbar and identical SVG output, repeated menu/focus/layout states, all available themes for Solid/Ruler/Quantum/Artemis in portrait and landscape, native option values and reload, actual SVG/PNG downloads, and existing motion behavior. The server was closed afterward.
