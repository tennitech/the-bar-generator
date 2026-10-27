# Native SVG clipboard correction review — October 27, 2026

Visually inspected Chromium desktop and WebKit mobile menu screenshots. Download SVG is separate; Copy SVG displays Vector format on supported Chromium. Unsupported WebKit shows a disabled SVG copy unavailable action and Use SVG download. No Finder wording or source-text action appears. Layout stays within phone width with touch targets at least 44px tall. Existing official artwork, restrained menu surfaces and shared copy glyphs remain.

- [Chromium desktop](chromium-desktop.png)
- [Chromium mobile](chromium-mobile.png)
- [WebKit mobile unsupported state](webkit-mobile.png)

Chromium headless isolated clipboard checks verify only image/svg+xml for SVG, valid standalone SVG namespace/viewBox and original vector shapes, no embedded image or external dependency, and no plain/HTML/file representation in a receiving-browser paste event. PNG checks verify Standard/Large dimensions, colors and partial alpha. WebKit uses a test adapter, not the system pasteboard. Both check unsupported states, no format substitution, download recovery, busy/frozen state, errors/retry, keyboard/touch activation and bounds with reduced motion.

Native-app paste, physical Safari, manual screen-reader behavior, owner testing and formal RPI approval are unverified. No Figma interaction occurred in this correction.
