/* Offline verification of production snapshot/raster/codec code using the
 * existing native SVG/canvas adapter. Not browser, Safari or OS clipboard QA.
 * Optional environment-only @napi-rs/canvas and pngjs; no runtime dependency.
 * node --expose-gc scripts/highResolutionExportsLocal.js [/tmp/rpi-high-resolution]
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { PNG } = require('pngjs');
const { nativeRuntime, installCodecWorkers } = require('./helpers/nativeExportRuntime');
const { read } = require('../tests/helpers/exportCompositionRuntime');
const { getLoopingGifFramePlan } = require('../js/utils/loopingGif');
const gif = require('../js/utils/transparentGif');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const output = path.resolve(process.argv[2] || '/tmp/rpi-high-resolution');
fs.mkdirSync(output, { recursive: true });
const results = { kind: 'Offline production-code/native-raster/codec validation; no browser', png: [], gif: [], clipboard: [] };

function inspect(bytes, snapshot) {
  const image = PNG.sync.read(bytes), { width, height, data } = image;
  const high = snapshot.dimensions.logoWidth === 4096, bar = snapshot.composition === 'bar';
  assert.equal(width, high ? 4752 : 1160);
  assert.equal(height, high ? (bar ? 951 : 3121) : (bar ? 232 : 762));
  const scale = (high ? 4096 : 1000) / 250;
  const left = Math.floor(20 * scale), right = Math.ceil(270 * scale);
  const top = Math.floor(20 * scale), bottom = Math.ceil((bar ? 38 : 170.4885) * scale);
  let ink = 0, partial = 0, letterInk = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = 4 * (y * width + x), alpha = data[i + 3];
    if (!alpha) continue;
    assert(x >= left && x < right && y >= top && y < bottom, `paint outside proportional viewport: ${x},${y}`);
    if (!bar && y < (20 + 111.4885) * scale) letterInk++;
    if (!bar && y >= Math.ceil((20 + 111.4885) * scale) && y < Math.floor((20 + 132.4885) * scale)) assert.fail('paint in letter/bar gap');
    if (alpha < 255) partial++;
    else for (let c = 0; c < 3; c++) assert(Math.abs(data[i + c] - snapshot.rgb[c]) <= 1, 'opaque ink mismatch');
    ink++;
  }
  assert(ink > 0); assert(partial > 0); if (!bar) assert(letterInk > 0);
  return { width, height, ink, partial, bytes: bytes.length };
}

(async () => {
  const r = nativeRuntime();
  for (const family of ['solid', 'triangles', 'lunar']) for (const color of ['black', 'white']) for (const size of ['standard', 'large']) for (const composition of ['logo', 'bar']) {
    r.select(family); r.currentColorMode = color; Object.assign(r.state, { size, composition });
    const snapshot = r.captureLogoExportSnapshot({ format: 'png' });
    const blob = await r.createRasterExportBlob(snapshot, new AbortController().signal);
    const bytes = Buffer.from(await blob.arrayBuffer()), metrics = inspect(bytes, snapshot);
    assert.equal(r.activeUrls.size, 0);
    results.png.push({ family, color, size, composition, ...metrics });
    if (family === 'solid' && color === 'black' && size === 'large') fs.writeFileSync(path.join(output, `high-${composition}.png`), bytes);
    global.gc?.();
  }
  console.log(`PNG: ${results.png.length} decoded production exports; true alpha, ink, clear space, gap and URL cleanup passed`);
  installCodecWorkers();
  for (const size of ['standard', 'large']) for (const composition of ['logo', 'bar']) {
    r.select('gradient'); r.currentColorMode = 'black'; Object.assign(r.state, { size, composition });
    const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
    // Four sampled production frames bound offline validation time; the full
    // plan/timing/budget are independently covered by existing codec/unit tests.
    const plan = getLoopingGifFramePlan('gradient', snapshot.values, { barWidth: 250 });
    const renderer = r.createCapturedGifRenderer(snapshot, plan);
    const encoded = await gif.encode({ ...snapshot.dimensions, frameCount: 4, periodSeconds: .16,
      foreground: snapshot.rgb, workerScript: 'existing local codec adapter', renderFrame: (index, progress) => {
        const frame = renderer.renderFrame(index, progress);
        return { width: frame.width, height: frame.height, data: new Uint8ClampedArray(frame.data) };
      } });
    const parsed = parseGif(Buffer.from(await encoded.blob.arrayBuffer()));
    assert.equal(parsed.width, size === 'large' ? 2320 : 1160);
    assert.equal(parsed.height, composition === 'bar' ? (size === 'large' ? 464 : 232) : (size === 'large' ? 1524 : 762));
    let frames = 0;
    for (const frame of decodeFrames(parsed)) { assert.equal(frame.frame.disposal, 2); assert.equal(frame.frame.transparent, true); frames++; }
    assert.equal(frames, 4); renderer.release();
    results.gif.push({ size, composition, width: parsed.width, height: parsed.height, frames, bytes: encoded.blob.size });
    global.gc?.();
  }
  delete global.Worker;
  const elements = { 'export-cancel': {}, 'export-message': { focus() {} }, 'save-menu': { classList: { contains: () => false } } };
  r.document.getElementById = id => elements[id];
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }), describe() {}, ready() {}, message() {}, finish() {} };
  r.isSecureContext = true;
  r.ClipboardItem = class { static supports() { return true; } constructor(data) { this.data = data; } };
  let payload, synchronous;
  r.navigator = { clipboard: { write: items => { synchronous = true; return Promise.all(Object.values(items[0].data)).then(values => { payload = values[0]; }); } } };
  vm.runInContext(read('js/utils/logoClipboard.js'), r);
  for (const composition of ['logo', 'bar']) {
    r.select('solid'); Object.assign(r.state, { size: 'large', composition });
    const snapshot = r.captureLogoExportSnapshot(); synchronous = false;
    const pending = r.logoClipboard.copy('png'); assert.equal(synchronous, true, 'Safari activation path must remain synchronous');
    await pending; results.clipboard.push({ composition, ...inspect(Buffer.from(await payload.arrayBuffer()), snapshot) });
    assert.equal(r.activeUrls.size, 0); global.gc?.();
  }
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.png.length} PNGs, ${results.gif.length} sampled GIFs, ${results.clipboard.length} adapted PNG clipboard payloads. Evidence: ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
