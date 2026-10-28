# Selector refinement verification — October 28, 2026

The two adjacent selector PNGs show Chromium at a 1440 × 1000 CSS-pixel viewport,
reduced motion enabled, black theme. The style sample column and direction arrows
sit to the right of the names. They are app screenshots, not brand approval.

305 unit tests pass. `selectorSmoke.js` covers 21 still family samples, menu bounds
and scrolling, unavailable options, keyboard selection, arrow icons, dark theme,
legacy variant-2 query/share migration, canonical SVG equality and PNG downloads,
and 320/390px touch selection in Chromium and WebKit. `integrationSmoke.js` checks
eight triangle direction/count combinations, painted raster bounds, header/raster
parity, SVG equality after share restore, and packing seed history in both engines.
The legacy `triangleShareSmoke.js` command delegates to the expanded selector check.

The prior color-picker smoke check and general Chromium browser regression suite
also pass. WebKit is Playwright's engine, not physical Safari. Physical devices,
screen readers and formal RPI approval remain outside this verification.
