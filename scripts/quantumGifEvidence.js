/* Real native raster + vendored GIF codec and independent decoder. No browser
 * launch, DOM layout or viewer behavior is simulated. Optional @napi-rs/canvas
 * is a QA-only environment dependency. Run with NODE_PATH set to that package.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createCanvas } = require('@napi-rs/canvas');
const { nativeRuntime, installCodecWorkers } = require('./helpers/nativeExportRuntime');
const loopingGifUtils = require('../js/utils/loopingGif');
const { getLoopingGifFramePlan } = loopingGifUtils;
const captureSpeed = Number(process.env.RPI_RING_GIF_SPEED || 4);
const selectedCases = process.env.RPI_RING_GIF_CASES?.split(',');
const referenceCount = Number(process.env.RPI_RING_GIF_REFERENCES || 64);
const skipRaster = process.env.RPI_RING_SKIP_RASTER === '1';
const { frameTiming, encode, preparePixels, createPalette } = require('../js/utils/transparentGif');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const { COLOR_SCHEMES } = require('../js/utils/themeMode');
const out = path.resolve(process.argv[2] || '/tmp/rpi-ring-gif');
const hash = pixels => createHash('sha256').update(pixels).digest('hex');
async function normalized(image, rgb) {
  const copy = { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) };
  const palette = createPalette(rgb);
  await preparePixels(copy, palette);
  for (let i = 0; i < copy.data.length; i += 4) {
    if (copy.data[i] === palette.key[0] && copy.data[i + 1] === palette.key[1] && copy.data[i + 2] === palette.key[2]) copy.data.fill(0, i, i + 4);
  }
  return copy;
}
async function main() {
  fs.mkdirSync(out, { recursive: true });
  installCodecWorkers();
  const r = nativeRuntime(), rows = [];
  r.loopingGifUtils = loopingGifUtils;
  r.select('wave-quantum');
  r.getLoopRuntimeValues = () => ({ quantumSpeed: r.state.speed, quantumReverse: r.state.reverse });
  // Every ink/size/composition/direction at nonzero phases, including full-cycle
  // pixel closure and no inspection zoom/pan dependency.
  let rasterCases = 0;
  for (const ink of Object.keys(COLOR_SCHEMES)) for (const size of ['standard', 'large']) for (const composition of ['bar', 'logo']) for (const reverse of [false, true]) {
    if (skipRaster) continue;
    global.gc?.(); // QA-only: bound transient native ImageData across the matrix.
    Object.assign(r.state, { size, composition, speed: 4, reverse }); r.currentColorMode = ink;
    r.state.values.quantumPhase = 0.37123456789;
    const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
    const plan = getLoopingGifFramePlan(snapshot.family, snapshot.values);
    const renderer = r.createCapturedGifRenderer(snapshot, plan);
    const first = renderer.renderFrame(0, 0);
    assert.equal(hash(first.data), hash(renderer.renderFrame(0, 1).data), `${ink}/${size}/${composition}/${reverse}: cycle closure`);
    assert.notEqual(hash(first.data), hash(renderer.renderFrame(0, 0.001).data), 'phase must animate');
    assert.equal(snapshot.values.quantumPhase, r.quantumModel.normalizePhase(r.state.values.quantumPhase));
    renderer.release(); rasterCases++;
  }
  console.log(`Raster closure: ${rasterCases} current-theme/size/composition/direction cases passed`);
  const sheet = createCanvas(1000, 720), context = sheet.getContext('2d');
  context.fillStyle = '#eeeeee'; context.fillRect(0, 0, sheet.width, sheet.height);
  context.fillStyle = '#000000'; context.font = '22px sans-serif'; context.fillText('Particle on a Ring — decoded GIF frames', 24, 30);
  let rowIndex = 0;
  for (const size of ['standard', 'large']) for (const composition of ['bar', 'logo']) {
    if (selectedCases && !selectedCases.includes(`${size}:${composition}`)) continue;
    global.gc?.();
    const reverse = composition === 'logo';
    Object.assign(r.state, { size, composition, speed: captureSpeed, reverse });
    r.currentColorMode = process.env.RPI_RING_GIF_INK || (size === 'standard' ? 'white' : 'gray');
    r.state.values.quantumPhase = composition === 'bar' ? 0.37123456789 : 0.9999;
    const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
    const plan = getLoopingGifFramePlan(snapshot.family, snapshot.values);
    const timing = frameTiming(plan.periodSeconds, plan.frameCount);
    const renderer = r.createCapturedGifRenderer(snapshot, plan), expected = [];
    const references = new Set(Array.from({ length: Math.min(referenceCount, plan.frameCount) }, (_, i) => Math.round(i * (plan.frameCount - 1) / (Math.min(referenceCount, plan.frameCount) - 1))));
    const firstHash = hash((await normalized(renderer.renderFrame(0, 0), snapshot.rgb)).data);
    assert.equal(firstHash, hash((await normalized(renderer.renderFrame(0, 1), snapshot.rgb)).data));
    let lastReported = -1;
    const result = await encode({ ...snapshot.dimensions, style: snapshot.family, frameCount: plan.frameCount, periodSeconds: plan.periodSeconds,
      foreground: snapshot.rgb, workerScript: 'native serial codec adapter',
      onProgress: p => { if (p.encoded >= lastReported + 600) { lastReported = p.encoded; console.log(`${size}/${composition}: ${p.encoded}/${p.total} encoded`); } },
      renderFrame: async (index, progress) => {
        if (index % 120 === 0) global.gc?.();
        assert.equal(progress, timing.progress[index]);
        const frame = renderer.renderFrame(index, progress);
        if (references.has(index)) expected[index] = hash((await normalized(frame, snapshot.rgb)).data);
        return { width: frame.width, height: frame.height, data: new Uint8ClampedArray(frame.data) };
      } });
    const bytes = Buffer.from(await result.blob.arrayBuffer()), gif = parseGif(bytes);
    fs.writeFileSync(path.join(out, `ring-${size}-${composition}.gif`), bytes);
    console.log(`${size}/${composition}: encoded ${bytes.length} bytes; independently decoding ${plan.frameCount} frames`);
    assert.equal(gif.width, snapshot.dimensions.width); assert.equal(gif.height, snapshot.dimensions.height);
    assert.equal(gif.frames.length, plan.frameCount); assert.equal(result.metrics.durationMs, Math.round(plan.periodSeconds * 100) * 10);
    assert.deepEqual(gif.frames.map(frame => frame.delayMs), timing.delays);
    assert.equal(bytes.readUInt16LE(bytes.indexOf(Buffer.from('NETSCAPE2.0')) + 13), 0);
    const distinct = new Set(); let index = 0;
    const sampled = [0, Math.floor(plan.frameCount / 4), Math.floor(plan.frameCount / 2), plan.frameCount - 1];
    for (const decoded of decodeFrames(gif)) {
      if (index % 120 === 0) global.gc?.();
      assert.equal(decoded.frame.disposal, 2); assert.equal(decoded.frame.transparentIndex, 0);
      const actual = hash(decoded.rgba); distinct.add(actual);
      if (references.has(index)) assert.equal(actual, expected[index], `${size}/${composition}: decoded frame ${index}`);
      if (sampled.includes(index)) {
        const column = sampled.indexOf(index), src = createCanvas(gif.width, gif.height);
        const srcContext = src.getContext('2d'), pixels = srcContext.createImageData(gif.width, gif.height);
        pixels.data.set(decoded.rgba); srcContext.putImageData(pixels, 0, 0);
        context.fillStyle = '#222222'; context.fillRect(column * 244 + 16, rowIndex * 165 + 75, 232, 130);
        const scale = Math.min(232 / gif.width, 130 / gif.height);
        context.drawImage(src, column * 244 + 16 + (232 - gif.width * scale) / 2, rowIndex * 165 + 75 + (130 - gif.height * scale) / 2, gif.width * scale, gif.height * scale);
        src.width = src.height = 0;
      }
      index++;
    }
    assert.equal(index, plan.frameCount); assert.ok(distinct.size > plan.frameCount * 0.9);
    assert.notEqual(expected.at(-1), expected[0], 'Do not duplicate the terminal frame');
    context.fillStyle = '#000000'; context.font = '16px sans-serif';
    context.fillText(`${size} / ${composition} / ${reverse ? 'reverse' : 'forward'} / frames ${sampled.join(', ')}`, 24, rowIndex * 165 + 65);
    const name = `ring-${size}-${composition}`;
    fs.writeFileSync(path.join(out, `${name}.gif`), bytes);
    const row = { name, foreground: snapshot.foreground, alphaPolicy: 'current default', requestedSize: size, actualSize: snapshot.gifPolicy.size, policyNote: snapshot.gifPolicy.note, sourcePixelReferences: references.size, phase: snapshot.values.quantumPhase, speed: snapshot.values.quantumSpeed, reverse,
      ...result.metrics, decodedFrames: index, distinctFrames: distinct.size, delayMs: [...new Set(timing.delays)], fullCyclePixelClosure: true };
    rows.push(row); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ rasterCases, rows }, null, 2));
    console.log(JSON.stringify(row)); renderer.release(); rowIndex++;
  }
  fs.writeFileSync(path.join(out, 'decoded-frames.png'), sheet.toBuffer('image/png'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
