# Mission Control rendering and profiling notes

The static Artemis bar uses the existing supplied black/white vector sources and
fixed official geometry. Live preview, header and exports retain their existing
vector/raster paths; the image is artwork, not mission telemetry.

Only unchanged Artemis canvas painting is skipped. Renderer identity, canvas and
backing dimensions, fit/control space, zoom/pan, theme, source readiness and
explicit updates invalidate the cache. Hidden/intro/entrance suspension, resize,
visibility, page lifecycle and context restoration also invalidate it. Animated
families keep their established scheduler and model time.

Same-source recolors preserve one SVG tree and inherit currentColor. Geometry,
transform or color writes occur only when needed. The splashdown counter derives
from wall time, uses at most one interval while relevant/visible, refreshes on
resume and writes only changed values. Existing detail controls and credits stay.

The original PNG remains the source and fallback for a lossless WebP at unchanged
2048 × 2592 dimensions. Exact decoded RGBA and composed-image equality were
verified in Chromium and WebKit; existing source permissions remain unresolved.

## Reproducible checks

```sh
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=chromium node scripts/missionControlProfile.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit node scripts/missionControlProfile.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=chromium node scripts/missionControlSmoke.js
RPI_SITE_URL=http://127.0.0.1:8000 RPI_BROWSER=webkit node scripts/missionBackdropSmoke.js
```

Profile baseline and optimized revisions on the same host/browser with identical
settings. Record the browser/OS, cold/warm entry, repeated theme selections and
idle observation window. Selection times include the intended visual scan and
automation overhead; they are not pure render time. WebKit does not support the
long-task observer used here, so an empty long-task list proves nothing there.

[Condensed same-host measurements](cloud_comparison.json) establish reduced idle
painting, not faster overall cold entry. [Detailed evidence](cloud_validation.md)
records scope, codec/export checks and physical-device/approval limits.
