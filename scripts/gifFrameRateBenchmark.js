/* Cloud/offline benchmark using the real captured renderer and vendored codec.
 * Optional @napi-rs/canvas comes from the test environment, not app dependencies.
 * Codec tasks are serial Node adapters: these are not browser worker timings.
 * node scripts/gifFrameRateBenchmark.js [/tmp/rpi-gif-fps]
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { nativeRuntime, installCodecWorkers } = require('./helpers/nativeExportRuntime');
const { getLoopingGifFramePlan } = require('../js/utils/loopingGif');
const { encode, preparePixels, createPalette } = require('../js/utils/transparentGif');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const cadence = process.env.RPI_GIF_BENCHMARK_MODE === 'cadence';
const alphaMode = process.env.RPI_GIF_ALPHA_MODE || 'ordered';
const out = path.resolve(process.argv[2] || '/tmp/rpi-gif-fps');
const hash = data => createHash('sha256').update(data).digest('hex');
async function coverageHash(image, foreground, alphaMode) {
  const palette = createPalette(foreground);
  await preparePixels(image, palette, { alphaMode });
  const alpha = new Uint8Array(image.width * image.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = image.data[i * 4] === palette.key[0]
    && image.data[i * 4 + 1] === palette.key[1] && image.data[i * 4 + 2] === palette.key[2] ? 0 : 255;
  return hash(alpha);
}
async function main() {
  fs.mkdirSync(out, { recursive: true });
  installCodecWorkers();
  const r = nativeRuntime(), rows = [];
  const cases = ['ticker', 'waveform', 'gradient'].flatMap(family => ['standard', 'large'].map(size => ({ family, size, composition: 'logo' })));
  cases.push(...['ticker', 'waveform', 'gradient'].map(family => ({ family, size: 'large', composition: 'bar' })));
  for (const item of cases) {
    if (process.env.RPI_GIF_BENCHMARK_FILTER && process.env.RPI_GIF_BENCHMARK_FILTER !== `${item.family}:${item.size}:${item.composition}`) continue;
    r.select(item.family); Object.assign(r.state, item);
    Object.assign(r.state.values, { waveformSpeed: 0.2 });
    const snapshot = r.captureLogoExportSnapshot();
    const plan = getLoopingGifFramePlan(item.family, snapshot.values, { barWidth: 250, fps: 30 });
    // Reproduce the old shipping cap even when rerunning after the fix.
    const previousCount = Math.max(24, Math.min(72, Math.round(plan.periodSeconds * 24)));
    assert.equal(plan.frameCount, Math.round(Math.round(plan.periodSeconds * 100) * 0.3), 'Run this benchmark on the 30 fps candidate.');
    const candidate = cadence ? getLoopingGifFramePlan(item.family, snapshot.values, { barWidth: 250, fps: 50 }) : null;
    if (candidate) assert.equal(candidate.frameCount, Math.min(3000, Math.floor(Math.round(plan.periodSeconds * 100) / 2)));
    const counts = cadence ? [['30fps', plan.frameCount], ['50fps', candidate.frameCount]]
      : [['previous', previousCount], ['30fps', plan.frameCount]];
    for (const [rate, frameCount] of counts) {
      const renderer = r.createCapturedGifRenderer(snapshot, { ...plan, frameCount });
      const result = await encode({ alphaMode, ...snapshot.dimensions, frameCount, periodSeconds: plan.periodSeconds,
        foreground: snapshot.rgb, workerScript: 'offline serial codec adapter',
        renderFrame: (index, progress) => {
          const image = renderer.renderFrame(index, progress);
          return { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) };
        } });
      const bytes = Buffer.from(await result.blob.arrayBuffer());
      const gif = parseGif(bytes), delays = gif.frames.map(frame => frame.delayMs);
      assert.equal(gif.width, snapshot.dimensions.width); assert.equal(gif.height, snapshot.dimensions.height);
      assert.equal(gif.frames.length, frameCount);
      assert.equal(delays.reduce((a, b) => a + b, 0), Math.round(plan.periodSeconds * 100) * 10);
      const loop = bytes.indexOf(Buffer.from('NETSCAPE2.0')); assert.ok(loop >= 0);
      assert.equal(bytes.readUInt16LE(loop + 13), 0); // repeat forever
      let index = 0;
      const distinct = new Set();
      for (const decoded of decodeFrames(gif)) {
        assert.equal(decoded.frame.disposal, 2); assert.equal(decoded.frame.transparentIndex, 0);
        const alpha = new Uint8Array(gif.width * gif.height);
        for (let i = 0; i < alpha.length; i++) alpha[i] = decoded.rgba[i * 4 + 3];
        distinct.add(hash(alpha));
        if (index === 0 || index === frameCount - 1) {
          const elapsed = delays.slice(0, index).reduce((a, b) => a + b, 0);
          const image = renderer.renderFrame(index, elapsed / result.metrics.durationMs);
          assert.equal(hash(alpha), await coverageHash(image, snapshot.rgb, alphaMode));
        }
        index++;
      }
      renderer.release(); assert.equal(index, frameCount); assert.ok(distinct.size > 1);
      fs.writeFileSync(path.join(out, `${item.family}-${item.size}-${item.composition}-${rate}.gif`), bytes);
      const meanHoldMs = delays.reduce((sum, delay) => sum + delay * delay, 0) / (2 * result.metrics.durationMs);
      const meanDelay = result.metrics.durationMs / frameCount;
      const delayStdMs = Math.sqrt(delays.reduce((sum, delay) => sum + (delay - meanDelay) ** 2, 0) / frameCount);
      const row = { ...item, rate, alphaMode, meanHoldMs, delayStdMs, ...result.metrics, effectiveFps: frameCount * 1000 / result.metrics.durationMs,
        delayMs: [...new Set(delays)].sort((a, b) => a - b), decodedFrames: index, distinctFrames: distinct.size, repeat: 0 };
      rows.push(row); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(rows, null, 2));
      console.log(JSON.stringify(row));
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
