# Clipboard exports

October 27, 2026. Implementation and browser evidence do not establish institutional approval or native-app paste acceptance.

## Native image formats

The existing Download Asset menu contains two copy actions. Native `ClipboardItem.supports()` determines SVG support at runtime. A browser without that method may attempt PNG, a mandatory clipboard type; it does not assume SVG support. Copy needs a secure context, ClipboardItem and the write API. The application never reads the clipboard, queries/request permissions, or changes persistent permission settings.

- **Copy SVG** writes only `image/svg+xml`, preserving the shared standalone vector document, namespaces, viewBox, official paths and selected bar geometry. No plain text, HTML, proprietary format or raster alternate is supplied.
- **SVG copy unavailable** is disabled when the browser cannot write native SVG. The independent **Download SVG** action saves the vector file. No source-text fallback remains.
- **Copy PNG** writes `image/png` with smooth partial alpha and the selected raster size. When unavailable, its disabled action points to the existing PNG download.

## SVG paste correction — October 27, 2026

The user reported SVG paste failure and requested actual SVG content, removal of destination-specific picker wording, and code-only publication before their own native-app testing. The prior source-text fallback is removed entirely, including its label, writeText path and completion messages. Unsupported requests leave the clipboard untouched; export completion reapplies capability state so downloads cannot accidentally re-enable an unsupported copy action. Error focus returns to an enabled retry control or the menu trigger.

The exported SVG document has an SVG namespace, explicit width/height and a fixed `-20 -20 290 190.4885` viewBox, official letter paths and primitive pattern geometry. Clipboard parsing and geometry parity checks diagnose this content independently of receiving-app behavior. No concrete malformed-SVG defect was established; the valid XML declaration and export geometry are retained. Speculative XML-preamble changes from the saved recovery work were not applied.

[Chromium's macOS clipboard implementation](https://chromium.googlesource.com/chromium/src/+/main/ui/base/clipboard/clipboard_mac.mm) writes SVG using its SVG clipboard format; [the platform format mapping](https://chromium.googlesource.com/chromium/src/+/main/ui/base/clipboard/clipboard_format_type_mac.mm) identifies `public.svg-image`. This is native SVG content, not a custom web-prefixed clipboard format. A successful browser write/readback proves the payload in that browser, not that every destination application accepts it. No native-app paste or Figma acceptance is claimed. The user will test native-app paste after deployment; no Figma operation is part of this fix.

JPEG remains removed. SVG/PNG copying, existing SVG/PNG downloads and conditional looping GIF downloads are retained. Ruler's natural edge whitespace, official geometry and frozen-state behavior are unchanged.

## State, activation and recovery

Copies and downloads share `captureLogoExportSnapshot()` and the raster renderer in drawing.js. Standard remains 1000 px nominal mark width on 1160 × 762; Large is 2000 px on 2320 × 1524. Vector SVG remains scalable. Official letterforms, bar placement, scientific phase, seed, title filtering and clear space use the existing export pipeline. Controls changing while raster preparation runs cannot change the requested image.

The click handler calls clipboard.write synchronously with promise-backed ClipboardItem data. No timer, asynchronous permission check or raster decode precedes that call. This preserves Safari's user-activation requirement while image preparation remains asynchronous. One export/copy job owns the busy state; duplicate clicks and concurrent downloads are excluded. The existing polite status and indeterminate progress announce preparation. A dispatched platform write cannot reliably be cancelled, so its Cancel button is hidden. Download cancellation retains the existing behavior. Failure releases controls and offers retry/download guidance; denied permissions are not expanded.

Keyboard activation, Escape, touch targets, shared Feather copy/download icons and the existing reduced-motion busy indicator use the existing interface patterns. The Artemis credits menu remains credits-only; these actions do not bypass its existing behavior.

## Primary API references

Reviewed October 27, 2026:

- [WebKit Async Clipboard API](https://webkit.org/blog/10855/async-clipboard-api/): promises for item data, user gestures, MIME support and privacy constraints. This historical announcement lists PNG and text types; runtime detection governs newer browsers.
- [Chrome SVG clipboard support](https://developer.chrome.com/blog/svg-support-for-async-clipboard-api): native SVG MIME support and positive supports() detection.
- [MDN ClipboardItem.supports](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem/supports_static): secure contexts, baseline and mandatory clipboard types.
- [Chromium headless clipboard test](https://chromium.googlesource.com/chromium/src/+/main/headless/test/headless_browser_browsertest.cc): headless uses ClipboardNonBacked. The smoke script launches Playwright's default headless shell, avoiding the user's system pasteboard; it reads only after its own successful writes.

## Verification and limits

`scripts/clipboardSmoke.js` separates genuine Chromium headless clipboard payload checks from a WebKit test adapter. Chromium's headless shell uses ClipboardNonBacked, isolated from the system pasteboard. Tests read only payloads they just wrote. The WebKit adapter resolves native ClipboardItem promises and decodes actual renderer output but does not prove an OS clipboard write.

Checks cover Standard/Large PNG MIME, dimensions, smooth alpha and ink colors, native SVG-only MIME, standalone XML validity and vector geometry parity, a receiving-browser paste event, unsupported SVG with no write or format substitution, genuine SVG downloads, frozen request state, duplicate prevention, denial/retry, insecure/missing APIs, touch/keyboard activation, and desktop/mobile menu bounds. Unit tests cover detection, unsupported requests, cross-format busy exclusion and retry focus. Browser regression and request-time SVG/PNG snapshot checks remain separate from native-app acceptance.

Physical Safari, iOS hardware, manual screen readers and native-app paste targets remain untested. No persistent permission or unrelated clipboard content is used for verification. Current correction evidence is recorded in project_status.md and review-images/native-svg-clipboard/validation.md.
