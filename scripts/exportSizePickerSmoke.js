const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      const page = await browser.newPage({ viewport, hasTouch: viewport.width < 500, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/waveform/`);
      await page.waitForFunction(() => window.logoExportUI && typeof captureLogoExportSnapshot === 'function');
      await page.locator('#save-button').click();
      assert.equal(await page.locator('#export-size-select').isVisible(), false);
      assert.equal(await page.locator('#export-size-large').isChecked(), true);
      await page.locator('#export-size-large').focus();
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#export-size-standard').isChecked(), true);
      assert.equal(await page.locator('#export-dimensions').textContent(), '1160 × 762 px');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'save-png');
      for (const [size, width, height] of [['standard', 1160, 762], ['large', 2320, 1524]]) {
        const label = page.locator(`.export_size-option:has(#export-size-${size})`);
        assert((await label.boundingBox()).height >= 44);
        if (viewport.width < 500) await label.tap(); else await label.click();
        assert.equal(await page.locator(`#export-size-${size}`).isChecked(), true);
        const download = page.waitForEvent('download'); await page.locator('#save-png').click();
        const png = await fs.readFile(await (await download).path());
        assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
        await page.waitForFunction(() => !logoExportUI.isBusy());
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#save-menu').isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button');
      await page.locator('#save-button').click();
      assert.equal(await page.locator('#export-size-large').isChecked(), true);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS ${engine}: custom picker, keyboard, Tab, touch, 44px targets, both PNG dimensions, close/reopen at desktop and two phone sizes`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
