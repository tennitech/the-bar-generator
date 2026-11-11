/* Offline native raster + actual vendored GIF codec QA; no browser execution.
 * Optional @napi-rs/canvas is supplied by the test environment, not the app.
 * node scripts/gifEdgeEvidence.js [/tmp/rpi-gif-edge-evidence]
 * Eight phases sample each loop; this script checks edges, not motion cadence.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createCanvas, Path2D } = require('@napi-rs/canvas');
const { createRuntime, read } = require('../tests/helpers/exportCompositionRuntime');
const { encode, preparePixels, createPalette } = require('../js/utils/transparentGif');
const { getLoopingGifFramePlan } = require('../js/utils/loopingGif');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const out = path.resolve(process.argv[2] || '/tmp/rpi-gif-edge-evidence');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function installCodecWorkers() {
  const source = read('third_party/gif.js/gif.worker.js');
  global.Worker = class {
    constructor() { this.self = { postMessage: result => { this.output = result; } }; new Function('self', source)(this.self); }
    postMessage(message, transfers) {
      const task = structuredClone(message, { transfer: transfers });
      this.timer = setTimeout(() => { if (!this.stopped) { this.self.onmessage({ data: task }); this.onmessage({ data: this.output }); } }, 0);
    }
    terminate() { this.stopped = true; clearTimeout(this.timer); }
  };
}
function normalized(image, palette) {
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === palette.key[0] && data[i + 1] === palette.key[1] && data[i + 2] === palette.key[2]) data.fill(0, i, i + 4);
  }
  return data;
}
function teeth(data, width, snapshot) {
  const scale = snapshot.dimensions.scale;
  const left = Math.ceil(20 * scale), right = Math.floor(270 * scale);
  const top = snapshot.composition === 'bar' ? 20 * scale : (20 + 132.4885) * scale;
  const height = 18 * scale;
  let changed = 0;
  // Both waveform fixtures have flat plateaus in these two interior bands.
  // A straight edge's coverage must be identical on every neighboring row.
  for (const [a, b] of [[0.15, 0.35], [0.65, 0.85]]) {
    for (let y = Math.ceil(top + height * a) + 1; y < Math.floor(top + height * b); y++) {
      for (let x = left; x < right; x++) {
        if (data[(y * width + x) * 4 + 3] !== data[((y - 1) * width + x) * 4 + 3]) changed++;
      }
    }
  }
  return changed;
}
async function main() {
  fs.mkdirSync(out, { recursive: true }); installCodecWorkers();
  const r = createRuntime({ Path2D });
  r.document.createElement = name => { assert.equal(name, 'canvas'); return createCanvas(1, 1); };
  const rows = [], previews = {};
  const cases = [2, 2.5].flatMap(type => ['standard', 'large'].flatMap(size => ['bar', 'logo'].map(composition => ({ type, size, composition }))));
  cases.push(...['ticker', 'gradient'].map(family => ({ family, size: 'standard', composition: 'bar' })));
  for (const item of cases) {
    const family = item.family || 'waveform'; r.select(family);
    Object.assign(r.state, item);
    Object.assign(r.state.values, { waveformFrequency: 5, waveformType: item.type || 0 });
    const snapshot = r.captureLogoExportSnapshot();
    const plan = getLoopingGifFramePlan(family, snapshot.values, { barWidth: 250 });
    const renderer = r.createCapturedGifRenderer(snapshot, plan);
    for (const mode of ['ordered', 'threshold']) {
      const expected = [], changes = [], rawChanges = [];
      const palette = createPalette(snapshot.rgb);
      const result = await encode({ ...snapshot.dimensions, frameCount: 8, periodSeconds: 0.32,
        foreground: snapshot.rgb, alphaMode: mode, workerScript: 'offline serial codec adapter',
        renderFrame: async (index, progress) => {
          // Sample between integral-pixel positions, where alpha conversion matters.
          const raw = renderer.renderFrame(index, (progress + 0.01375) % 1);
          const image = { width: raw.width, height: raw.height, data: new Uint8ClampedArray(raw.data) };
          if (family === 'waveform') rawChanges.push(teeth(image.data, image.width, snapshot));
          const oracle = { ...image, data: new Uint8ClampedArray(image.data) };
          await preparePixels(oracle, palette, { alphaMode: mode });
          expected[index] = hash(normalized(oracle, palette));
          return image;
        } });
      const bytes = Buffer.from(await result.blob.arrayBuffer()), gif = parseGif(bytes);
      let index = 0;
      for (const decoded of decodeFrames(gif)) {
        assert.equal(decoded.frame.transparentIndex, 0); assert.equal(decoded.frame.disposal, 2);
        assert.equal(decoded.frame.delayMs, 40); assert.equal(hash(decoded.rgba), expected[index]);
        if (family === 'waveform') changes.push(teeth(decoded.rgba, gif.width, snapshot));
        if (item.type === 2.5 && item.size === 'standard' && item.composition === 'bar' && index === 0) previews[mode] = { ...decoded, rgba: new Uint8ClampedArray(decoded.rgba), snapshot, width: gif.width, height: gif.height };
        index++;
      }
      assert.equal(index, 8);
      if (family === 'waveform') {
        assert.ok(rawChanges.every(value => value === 0), 'source geometry/raster already has serrations');
        if (mode === 'threshold') assert.ok(changes.every(value => value === 0), 'GIF introduced teeth');
        else assert.ok(changes.some(value => value > 0), 'comparison did not exercise partially covered edges');
      }
      const name = `${family}-${item.type || 0}-${item.size}-${item.composition}-${mode}`;
      fs.writeFileSync(path.join(out, `${name}.gif`), bytes);
      rows.push({ name, width: gif.width, height: gif.height, decodedFrames: index, bytes: bytes.length,
        sourceRowChanges: rawChanges, encodedRowChanges: changes });
      console.log(JSON.stringify(rows.at(-1)));
    }
    renderer.release();
  }
  // Enlarged native-raster evidence. No user image, browser UI, logo or font asset.
  const sheet = createCanvas(1120, 370), ctx = sheet.getContext('2d');
  ctx.fillStyle = '#ececec'; ctx.fillRect(0, 0, sheet.width, sheet.height);
  const before = previews.ordered;
  let edgeX;
  for (let y = 90; y < 105 && edgeX === undefined; y++) {
    for (let x = 82; x < 1080; x++) {
      if (before.rgba[(y * before.width + x) * 4 + 3] !== before.rgba[((y - 1) * before.width + x) * 4 + 3]) { edgeX = x; break; }
    }
  }
  assert.ok(edgeX !== undefined, 'review crop must contain the reproduced teeth');
  for (const [i, mode] of ['ordered', 'threshold'].entries()) {
    const frame = previews[mode], canvas = createCanvas(frame.width, frame.height), c = canvas.getContext('2d');
    const pixels = c.createImageData(frame.width, frame.height); pixels.data.set(frame.rgba); c.putImageData(pixels, 0, 0);
    ctx.fillStyle = '#111'; ctx.font = '18px sans-serif'; ctx.fillText(mode === 'ordered' ? 'Before: ordered transparency' : 'After: uniform half-coverage', 20 + i * 560, 30);
    ctx.fillStyle = '#b4d8ec'; ctx.fillRect(20 + i * 560, 50, 520, 288);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, Math.max(80, edgeX - 40), 80, 130, 72, 20 + i * 560, 50, 520, 288);
  }
  fs.writeFileSync(path.join(out, 'gif-edges-before-after.png'), sheet.toBuffer('image/png'));
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ kind: 'Native source raster / encoded GIF; sampled phases, not browser or cadence QA', rows }, null, 2));
  delete global.Worker;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
