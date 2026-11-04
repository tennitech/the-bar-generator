const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
(async () => {
  const engine = process.env.RPI_BROWSER || 'chromium';
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8824';
    const route = '/generator/waveform/?waveformType=3&waveformFrequency=10';
    const ready = async () => page.waitForFunction(() => window.barShareController && window.logoExportUI);
    await page.goto(base + route); await ready();
    const plain = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    await page.goto(base + route + '&waveformEnvelope=true&waveformEnvelopeType=inverse&waveformEnvelopeWaves=6&waveformEnvelopeCenter=0.4&waveformEnvelopeBipolar=true'); await ready();
    assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource), plain);
    assert.equal(await page.locator('[id^="waveform-envelope"], #envelope-settings-group').count(), 0);
    assert.equal(await page.evaluate(() => getCurrentAudioPreviewType()), 'waveform');
    const capture = await page.evaluate(() => barShareController.capture());
    assert.equal(Object.keys(capture.controls).some(key => key.includes('waveform-envelope')), false);
    for (const action of ['randomize', 'reset']) {
      await page.locator(`[data-parameter-style="waveform"][data-parameter-action="${action}"]`).click();
      assert.equal(await page.evaluate(() => location.search.includes('waveformEnvelope')), false);
    }
    for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(size);
      await page.screenshot({ path: `/tmp/waveform-no-envelope-${engine}-${size.width}.png` });
    }
    assert.deepEqual(errors, []);
    console.log('Legacy query migration, export parity, controls, randomize/reset and responsive layouts: PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
