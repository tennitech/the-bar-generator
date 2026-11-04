const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
(async () => {
  const browser = await ({ chromium, webkit }[process.env.RPI_BROWSER || 'chromium']).launch();
  try {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.RPI_SITE_URL || 'http://127.0.0.1:8824') + '/generator/ticker/?tickerRepeats=5&tickerRatio=4&tickerWidthRatio=5');
    await page.waitForFunction(() => window.barShareController && window.logoExportUI);
    assert.equal(await page.locator('#ticker-audio-btn').count(), 0);
    assert.equal(await page.evaluate(() => getCurrentAudioPreviewType()), null);
    assert.equal(await page.evaluate(() => getCurrentMotionStyle()), 'ticker');
    await page.waitForTimeout(2500);
    await page.evaluate(() => setMotionEnabledForStyle('ticker', true));
    const initialPhase = await page.evaluate(() => barShareController.capture().runtime.phase);
    await page.waitForTimeout(200);
    assert.notEqual(await page.evaluate(() => barShareController.capture().runtime.phase), initialPhase);
    for (const style of ['binary', 'waveform', 'morse', 'ticker']) {
      await page.selectOption('#style-select', style, { force: true });
      assert.equal(await page.evaluate(() => getCurrentAudioPreviewType()), ['ticker', 'binary'].includes(style) ? null : style);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('#ticker-audio-btn, #binary-audio-btn').count(), 0);
    await page.screenshot({path: '/tmp/ticker-no-audio-' + (process.env.RPI_BROWSER || 'chromium') + '.png'});
    assert.deepEqual(errors, []); console.log('Audio availability, supported-style navigation, Ticker motion, mobile layout: PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
