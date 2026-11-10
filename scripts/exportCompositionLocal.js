/* Offline source/raster QA, not rendered UI/browser QA. Uses optional test-only
 * @napi-rs/canvas from the execution environment; no app dependency is added.
 * node scripts/exportCompositionLocal.js [/tmp/rpi-export-composition-evidence]
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { shaders, read } = require('../tests/helpers/exportCompositionRuntime');
const { encode, preparePixels, createPalette } = require('../js/utils/transparentGif');
const { getLoopingGifFramePlan } = require('../js/utils/loopingGif');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const { nativeRuntime, installCodecWorkers } = require('./helpers/nativeExportRuntime');
const out = path.resolve(process.argv[2] || '/tmp/rpi-export-composition-evidence');
fs.mkdirSync(out, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
// Only the DOM APIs consumed by createRasterExportBlob are adapted. The source
// is decoded by the native SVG rasterizer, not by a simulated canvas renderer.
async function pixels(blob) {
  const image = await loadImage(Buffer.from(await blob.arrayBuffer()));
  const canvas = createCanvas(image.width, image.height), ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0); return ctx.getImageData(0, 0, image.width, image.height);
}
function checkPixels(image, snapshot, gif = false) {
  // Cache native getters once: per-pixel N-API access dominates QA time.
  const { data, width, height } = image;
  const { scale } = snapshot.dimensions, bar = snapshot.composition === 'bar';
  const left = 20 * scale, top = bar ? 20 * scale : (20 + 132.4885) * scale;
  const right = 270 * scale, bottom = top + 18 * scale;
  let ink = 0, letterInk = 0, partial = 0, maxInkError = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, a = data[i + 3];
    if (!a) continue;
    if (x < left || x >= right) throw Error(`horizontal overflow at ${x},${y}`);
    if (y < 20 * scale || y >= Math.ceil(bottom)) throw Error(`vertical overflow at ${x},${y}`);
    if (bar && (y < top || y >= bottom)) throw Error('bar-only contains paint beyond bar viewport');
    else if (!bar && y < Math.floor(top)) { if (y >= Math.ceil((20 + 111.4885) * scale)) throw Error('paint in letter/bar gap'); letterInk++; }
    ink++; if (a < 255) partial++;
    if (a === 255) for (let c = 0; c < 3; c++) maxInkError = Math.max(maxInkError, Math.abs(data[i + c] - snapshot.rgb[c]));
    if (gif) assert.equal(a, 255);
  }
  assert.ok(ink > 0); if (!bar) assert.ok(letterInk > 0);
  assert.ok(maxInkError <= (gif ? 0 : 1), `${snapshot.family}/${snapshot.colorMode}/${snapshot.composition}: opaque ink changed by ${maxInkError}`);
  return { ink, letterInk, partial, maxInkError };
}
async function main() {
  const r = nativeRuntime(), results = { kind: 'Offline source/native raster verification; no browser or OS clipboard', png: [], gif: [], clipboard: [] };
  if (process.env.RPI_REUSE_PNG_RESULTS === '1') results.png = JSON.parse(fs.readFileSync(path.join(out, 'png-results.json'), 'utf8'));
  else for (const family of Object.keys(shaders)) for (const color of ['black', 'white', 'red']) for (const size of ['standard', 'large']) for (const composition of ['logo', 'bar']) {
    r.select(family); r.currentColorMode = color; Object.assign(r.state, { size, composition });
    const snapshot = r.captureLogoExportSnapshot();
    const blob = await r.createRasterExportBlob(snapshot, new AbortController().signal);
    assert.equal(blob.type, 'image/png');
    const image = await pixels(blob);
    assert.equal(image.width, size === 'large' ? 2320 : 1160);
    assert.equal(image.height, composition === 'bar' ? (size === 'large' ? 464 : 232) : (size === 'large' ? 1524 : 762));
    let coverage;
    try { coverage = checkPixels(image, snapshot); } catch (error) { throw Error(`${family}/${color}/${size}/${composition}: ${error.message}`); }
    // Independent explicit viewport oracle catches a PNG path accidentally
    // retaining the complete-logo origin while reporting cropped dimensions.
    const fragment = r.buildCurrentBarPatternSVGFragment({ fgColor: snapshot.foreground, values: snapshot.values, preview: false });
    if (composition === 'bar') {
      const oracle = `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}" viewBox="-20 112.4885 290 58">${fragment}</svg>`;
      const expected = await pixels(new Blob([oracle]));
      assert.equal(hash(image.data), hash(expected.data), `${family} bar-only PNG differs from explicit viewport oracle`);
    }
    results.png.push({ family, color, size, composition, width: image.width, height: image.height, ...coverage });
    if (['solid', 'triangles'].includes(family) && color === 'black' && size === 'standard') {
      fs.writeFileSync(path.join(out, `${family}-${composition}.svg`), snapshot.svgSource);
      fs.writeFileSync(path.join(out, `${family}-${composition}.png`), Buffer.from(await blob.arrayBuffer()));
    }
  }
  assert.equal(r.activeUrls.size, 0);
  fs.writeFileSync(path.join(out, 'png-results.json'), JSON.stringify(results.png, null, 2));
  console.log(`PNG: ${results.png.length} actual encoded images checked`);
  installCodecWorkers();
  for (const family of ['ticker', 'waveform', 'gradient']) for (const size of ['standard', 'large']) for (const composition of ['logo', 'bar']) {
    r.select(family); r.currentColorMode = family === 'ticker' ? 'white' : (size === 'large' ? 'gray' : 'black');
    Object.assign(r.state, { size, composition });
    const snapshot = r.captureLogoExportSnapshot();
    const plan = getLoopingGifFramePlan(family, snapshot.values, { barWidth: 250 });
    const renderer = r.createCapturedGifRenderer(snapshot, plan), expectedHashes = [];
    const result = await encode({ ...snapshot.dimensions, frameCount: plan.frameCount, periodSeconds: plan.periodSeconds,
      foreground: snapshot.rgb, workerScript: 'vendored codec in local adapter',
      renderFrame: async (index, progress) => {
        const frame = renderer.renderFrame(index, progress);
        checkPixels(frame, snapshot);
        const expected = { width: frame.width, height: frame.height, data: new Uint8ClampedArray(frame.data) };
        const palette = createPalette(snapshot.rgb);
        await preparePixels(expected, palette);
        // Compare encoded palette colors, with normalized transparent RGBA.
        for (let i = 0; i < expected.data.length; i += 4) {
          if (expected.data[i] === palette.key[0] && expected.data[i + 1] === palette.key[1] && expected.data[i + 2] === palette.key[2]) expected.data.fill(0, i, i + 4);
        }
        expectedHashes[index] = hash(expected.data);
        // Native ImageData owns external memory that Node cannot transfer.
        // Copy only at this offline adapter boundary; browser rendering is unchanged.
        return { width: frame.width, height: frame.height, data: new Uint8ClampedArray(frame.data) };
      } });
    const bytes = Buffer.from(await result.blob.arrayBuffer()), decoded = parseGif(bytes);
    assert.equal(decoded.width, snapshot.dimensions.width); assert.equal(decoded.height, snapshot.dimensions.height);
    let index = 0;
    for (const frame of decodeFrames(decoded)) {
      assert.equal(frame.frame.disposal, 2); assert.equal(frame.frame.transparent, true);
      assert.equal(hash(frame.rgba), expectedHashes[index], `${family}/${size}/${composition} frame ${index} changed composition or alpha`);
      index++;
    }
    assert.equal(index, plan.frameCount);
    results.gif.push({ family, size, composition, width: decoded.width, height: decoded.height, frames: index, bytes: bytes.length });
    if (size === 'standard') fs.writeFileSync(path.join(out, `${family}-${composition}.gif`), bytes);
    renderer.release(); console.log(`GIF: ${family}/${size}/${composition}, ${index} frames decoded`);
  }
  delete global.Worker;
  // Browser API adapter: exercise the real copy handler and raster pipeline,
  // never access this machine's clipboard or claim native-paste verification.
  const elements = { 'export-cancel': {}, 'export-message': { focus() {} }, 'save-menu': { classList: { contains: () => false } } };
  r.document.getElementById = id => elements[id];
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }), describe() {}, ready() {}, message() {}, finish() {} };
  r.isSecureContext = true;
  r.ClipboardItem = class { static supports() { return true; } constructor(data) { this.data = data; } };
  let payload;
  r.navigator = { clipboard: { write: async items => { payload = await Promise.all(Object.values(items[0].data)); } } };
  vm.runInContext(read('js/utils/logoClipboard.js'), r);
  for (const format of ['svg', 'png']) for (const size of ['standard', 'large']) for (const composition of ['bar', 'logo', 'bar']) {
    r.select('triangles'); Object.assign(r.state, { size, composition });
    const snapshot = r.captureLogoExportSnapshot(), pending = r.logoClipboard.copy(format);
    r.state.composition = composition === 'bar' ? 'logo' : 'bar';
    const result = await pending; assert.equal(payload[0].type, result.mime);
    if (format === 'svg') assert.equal(await payload[0].text(), snapshot.svgSource);
    else { const image = await pixels(payload[0]); checkPixels(image, snapshot); assert.equal(image.height, snapshot.dimensions.height); }
    results.clipboard.push({ format, size, composition, mime: result.mime });
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.png.length} PNGs, ${results.gif.length} complete GIFs, ${results.clipboard.length} clipboard-adapter requests. Evidence: ${out}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
