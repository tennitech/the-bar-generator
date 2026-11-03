// Focused waveform exports: actual downloaded SVG/PNG/GIF, exact loop endpoint,
// and transparent encoded frames. This does not claim physical-display smoothness.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const { parseGif } = require('../tests/helpers/gifDecoder');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8841';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/waveform-exports-${engine}`;
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/generator/waveform/`);
    await page.waitForFunction(() => window.logoExportUI && window.barShareController);
    for (const type of [1, 2, 3]) {
      await page.evaluate(type => {
        waveformTypeSlider.value = type; waveformTypeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        waveformSpeedSlider.value = 1; waveformSpeedSlider.dispatchEvent(new Event('input', { bubbles: true }));
        waveformFrequencySlider.value = 100; waveformFrequencySlider.dispatchEvent(new Event('input', { bubbles: true }));
      }, type);
      const source = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
      for (const method of ['saveSVG', 'savePNG']) {
        const pending = page.waitForEvent('download'); await page.evaluate(method => window[method](), method);
        const file = await pending, data = await fs.readFile(await file.path());
        if (method === 'saveSVG') assert.equal(data.toString(), source);
        else { assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
          assert.equal(data.readUInt32BE(16), 1160); assert.equal(data.readUInt32BE(20), 762); }
        await fs.writeFile(`${evidence}/type-${type}.${method === 'saveSVG' ? 'svg' : 'png'}`, data);
      }
      assert.equal(await page.evaluate(async () => {
        const snapshot = captureLogoExportSnapshot();
        const plan = getLoopingGifFramePlan('waveform', snapshot.values);
        const renderer = createCapturedGifRenderer(snapshot, plan);
        try {
          const first = renderer.renderFrame(0, 0).data;
          const last = renderer.renderFrame(plan.frameCount, 1).data;
          return first.every((byte, i) => byte === last[i]);
        } finally { renderer.release(); }
      }), true, `type ${type} exact full-cycle raster endpoint`);
    }
    // Interpolated sharp shapes plus envelope exercise the real GIF pipeline.
    await page.evaluate(() => {
      waveformTypeSlider.value = 2.35; waveformTypeSlider.dispatchEvent(new Event('input', { bubbles: true }));
      waveformEnvelopeToggle.checked = true; waveformEnvelopeToggle.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const pending = page.waitForEvent('download', { timeout: 180000 });
    await page.evaluate(() => saveLoopingGIF());
    const file = await pending, data = await fs.readFile(await file.path()), gif = parseGif(data);
    assert.equal(gif.width, 1160); assert.equal(gif.height, 762);
    assert.ok(gif.frames.length >= 20); assert.ok(gif.frames.every(frame => frame.transparent));
    await fs.writeFile(`${evidence}/morphed-envelope.gif`, data);
    assert.deepEqual(errors, []);
    console.log(`${engine}: 3 SVG + 3 PNG downloads, 3 exact loop raster endpoints, ${gif.frames.length}-frame transparent GIF passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
