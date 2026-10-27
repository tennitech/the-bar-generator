# Clipboard exports

October 27, 2026. Implementation and browser evidence do not establish institutional approval or native-app paste acceptance.

## Formats and explicit fallbacks

The existing Download Asset menu contains two copy actions. Native `ClipboardItem.supports()` determines SVG support at runtime. A browser without that method may attempt PNG, a mandatory clipboard type; it does not assume SVG support. Copy needs a secure context, ClipboardItem and the write API. The application never reads the clipboard, queries/request permissions, or changes persistent permission settings.

- **Copy SVG** writes `image/svg+xml`, preserving the shared vector paths and selected bar geometry. A receiving application must support that MIME type. No raster replacement or custom web format is silently supplied.
- **Copy SVG source (text)** writes `text/plain` when native vector copying is unavailable. Both the label and completion identify source text. Download SVG remains the vector import path; text copying is not presented as a pasted vector image.
- **Copy PNG** writes `image/png` with smooth partial alpha and the selected raster size. When unavailable, the menu explicitly points to the existing PNG download.


## SVG paste interoperability follow-up

A user reported text clippings when copying from Dia/Chromium and pasting into Finder. The native code path writes only image/svg+xml; it does not add text/plain, HTML or a raster alternate. The unsupported-browser source action separately writes only text/plain. Isolated Chromium readback and a normal receiving-browser paste event both confirmed SVG-only types, empty plain/HTML data and zero file references. This rules out an always-attached plaintext representation in that tested path; it does not establish native-app SVG editability. Finder needs a file representation to paste an actual file; the shipped action writes content, not that file representation.

Current [Chromium macOS clipboard source](https://chromium.googlesource.com/chromium/src/+/main/ui/base/clipboard/clipboard_mac.mm) implements SVG writing separately from ordinary text and file references. macOS UniformTypeIdentifiers, queried without touching a pasteboard, identifies SVG as public.svg-image and reports conformance to both public.image and public.text/public.xml. A receiving application can therefore treat the content as XML/text; successful API detection and browser readback do not guarantee editable-vector import. A clipping alone does not prove the app chose our source-text fallback.

The menu now labels the fallback **Copy SVG source (text)**, describes native SVG as content for supporting SVG apps rather than promising editability, names the file action **Download SVG**, and explicitly directs Finder users to that download. The native payload stays SVG-only. The user-requested JPEG removal also removes its action, download fallback, matte logic and dead tests; the shared PNG raster renderer remains. Downloaded SVG preserves the existing vector paths and is the file-import recovery; no PNG is silently substituted. No raw image ClipboardItem can promise a file-reference paste or create a Finder `.svg` file. [Apple's pasteboard types](https://developer.apple.com/documentation/appkit/nspasteboard/pasteboardtype) distinguish file/resource URLs from other representations.

Dia 1.55.0 was identified from installed bundle metadata. No system clipboard content was read or written during this investigation. The user confirmed Finder as the destination. The mismatch is content copying versus Finder file pasting; the exact Dia/macOS representation chosen for the reported clipping was not sampled. No native Finder paste test was performed. Headless browser paste tests remain separate from actual native-app acceptance.

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

`scripts/clipboardSmoke.js` separates real Chromium headless clipboard payload checks from a WebKit test adapter. The adapter resolves native ClipboardItem promises and decodes actual renderer output but is not proof of an OS clipboard write. Current tested Chromium supports native SVG/PNG; WebKit reports PNG and uses the SVG source-text fallback.

The script checks Standard/Large PNG MIME, decoded dimensions, smooth alpha and ink color across black/white/red, native SVG vector geometry, explicit source text, frozen request state, duplicate prevention, denial/retry, insecure/missing APIs, touch/keyboard activation, menu bounds and screenshots. Supporting unit tests cover detection, unsupported requests, cross-format busy exclusion and retry focus. The SVG/Finder and format-removal follow-up passed 294 unit tests in 29 suites, plus the updated Chromium and WebKit clipboard scripts. Native readback and receiving-browser paste events are checked separately from source text and SVG-file downloads. Chromium and WebKit each passed the complete browser smoke, aggregate integration, PNG/SVG request-time snapshot checks, and all six transparent GIF family/size cases with cancellation/retry. [Review screenshots](review-images/clipboard-validation.md) distinguish browser layout inspection from hardware or institutional approval.

Physical Safari, iOS hardware, manual screen readers and native-app paste targets remain untested. A browser successfully accepting an SVG item does not guarantee every destination preserves editable vectors. No persistent permission or unrelated clipboard content was used for verification.
