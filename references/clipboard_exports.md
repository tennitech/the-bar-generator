# Clipboard exports

October 27, 2026. Implementation and browser evidence do not establish institutional approval or native-app paste acceptance.

## Formats and explicit fallbacks

The existing Download Asset menu contains three copy actions. Native `ClipboardItem.supports()` determines SVG and JPEG support at runtime. A browser without that method may attempt PNG, a mandatory clipboard type; it does not assume SVG or JPEG support. Copy needs a secure context, ClipboardItem and the write API. The application never reads the clipboard, queries/request permissions, or changes persistent permission settings.

- **Copy SVG** writes `image/svg+xml`, preserving the shared vector paths and selected bar geometry. A receiving application must support that MIME type. No raster replacement or custom web format is silently supplied.
- **Copy SVG source** writes `text/plain` when native vector copying is unavailable. Both the label and completion identify source text. Download SVG remains the vector import path; text copying is not presented as a pasted vector image.
- **Copy PNG** writes `image/png` with smooth partial alpha and the selected raster size. When unavailable, the menu explicitly points to the existing PNG download.
- **Copy JPEG** writes only `image/jpeg` when capability detection is positive. Otherwise **Download JPEG** creates a genuine JPEG file. No PNG is labeled as JPEG. Encoders must return the requested MIME type or fail visibly.

JPEG has no alpha. Its full canvas uses the black or white background that gives the chosen ink the higher WCAG relative-luminance contrast ratio. The menu states the background before activation; the download filename also names it. Current colors choose white for Black/Red, black for White/Silver/Gray/Blue/Gold. This is a contrast decision within existing controls, not new RPI approval of every secondary-color placement. PNG and SVG keep transparency.

## State, activation and recovery

Copies and downloads share `captureLogoExportSnapshot()` and the raster renderer in drawing.js. Standard remains 1000 px nominal mark width on 1160 × 762; Large is 2000 px on 2320 × 1524. Vector SVG remains scalable. Official letterforms, bar placement, scientific phase, seed, title filtering and clear space use the existing export pipeline. Controls changing while raster preparation runs cannot change the requested image.

The click handler calls clipboard.write synchronously with promise-backed ClipboardItem data. No timer, asynchronous permission check or raster decode precedes that call. This preserves Safari's user-activation requirement while image preparation remains asynchronous. SVG source uses writeText within the same click. One export/copy job owns the busy state; duplicate clicks and concurrent downloads are excluded. The existing polite status and indeterminate progress announce preparation. A dispatched platform write cannot reliably be cancelled, so its Cancel button is hidden. Download cancellation retains the existing behavior. Failure releases controls and offers retry/download guidance; denied permissions are not expanded.

Keyboard activation, Escape, touch targets, shared Feather copy/download icons and the existing reduced-motion busy indicator use the existing interface patterns. The Artemis credits menu remains credits-only; these actions do not bypass its existing behavior.

## Primary API references

Reviewed October 27, 2026:

- [WebKit Async Clipboard API](https://webkit.org/blog/10855/async-clipboard-api/): promises for item data, user gestures, MIME support and privacy constraints. This historical announcement lists PNG and text types; runtime detection governs newer browsers.
- [Chrome SVG clipboard support](https://developer.chrome.com/blog/svg-support-for-async-clipboard-api): native SVG MIME support and positive supports() detection.
- [MDN ClipboardItem.supports](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem/supports_static): secure contexts, baseline and mandatory clipboard types.
- [Chromium headless clipboard test](https://chromium.googlesource.com/chromium/src/+/main/headless/test/headless_browser_browsertest.cc): headless uses ClipboardNonBacked. The smoke script launches Playwright's default headless shell, avoiding the user's system pasteboard; it reads only after its own successful writes.

## Verification and limits

`scripts/clipboardSmoke.js` separates real Chromium headless clipboard payload checks from a WebKit test adapter. The adapter resolves native ClipboardItem promises and decodes actual renderer output but is not proof of an OS clipboard write. Current tested Chromium supports native SVG/PNG and rejects JPEG capability; WebKit reports PNG and uses SVG source/JPEG download fallbacks. The capability-forced WebKit JPEG test verifies image/jpeg dispatch, bytes and dimensions without claiming native support.

The script checks Standard/Large PNG MIME, decoded dimensions, smooth alpha and ink color across black/white/red, native SVG vector geometry, explicit source text, genuine JPEG bytes and all seven theme backgrounds, frozen request state, duplicate prevention, denial/retry, insecure/missing APIs, touch/keyboard activation, menu bounds and screenshots. Supporting unit tests cover detection, contrast selection, cross-format busy exclusion and retry focus. The full unit suite passed 298 tests in 29 suites. Chromium and WebKit each passed the complete browser smoke, aggregate integration, PNG/SVG request-time snapshot checks, and all six transparent GIF family/size cases with cancellation/retry. [Review screenshots](review-images/clipboard-validation.md) distinguish browser layout inspection from hardware or institutional approval.

Physical Safari, iOS hardware, manual screen readers and native-app paste targets remain untested. A browser successfully accepting an SVG item does not guarantee every destination preserves editable vectors. No persistent permission or unrelated clipboard content was used for verification.
