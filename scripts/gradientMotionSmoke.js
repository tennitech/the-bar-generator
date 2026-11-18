// Verify that Gradient is static, including restored historical motion settings.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = `/tmp/rpi-gradient-static-${engine}`;
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/gradient/?colorMode=gray-on-black&gradientSpeed=0.4&gradientReverse=true`);
    await page.waitForFunction(() => window.barShareController && window._renderer?.canvas?.dataset.previewReady === 'true' && !window.PageEntrance?.isActive?.());
    assert.equal(await page.locator('#gradient-motion-toggle, #gradient-speed-slider, #gradient-reverse-toggle').count(), 0);
    assert.equal(await page.evaluate(() => styleSupportsMotion('gradient')), false);
    assert.equal(await page.evaluate(() => getCurrentMotionStyle()), null);
    assert.equal(await page.locator('#save-loop-gif').getAttribute('hidden'), '');
    for (const variant of ['1', '2']) {
      await page.locator('#gradient-variant-slider').evaluate((input, value) => {
        input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
      }, variant);
      const before = await page.evaluate(() => buildCurrentBarOnlySVG());
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => buildCurrentBarOnlySVG()), before);
      await page.evaluate(() => {
        const snapshot = barShareController.capture();
        snapshot.controls['gradient-motion-toggle'] = true;
        snapshot.controls['gradient-speed-slider'] = '0.4';
        snapshot.controls['gradient-reverse-toggle'] = true;
        snapshot.runtime.phase = .37;
        barShareController.restoreLocal(snapshot);
      });
      assert.equal(await page.evaluate(() => buildCurrentBarOnlySVG()), before);
      assert.equal(await page.evaluate(() => styleSupportsMotion('gradient')), false);
      assert.equal(await page.locator('#save-loop-gif').getAttribute('hidden'), '');
      const raster = await page.evaluate(async () => {
        const image = new Image();
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildCurrentBarOnlySVG());
        await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 72;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 1000, 72);
        const pixels = context.getImageData(0, 9, 1000, 1).data;
        let runs = 0, last = -1, ink = false;
        for (let x = 0; x < 1000; x++) {
          const next = pixels[x * 4 + 3] > 128;
          if (next && !ink) runs++;
          if (next) last = x;
          ink = next;
        }
        return { runs, last };
      });
      assert.equal(raster.runs, 21, 'all 21 stripes resolve separately at a 1000px bar width');
      assert.equal(raster.last, 999, 'the last stripe reaches the final column naturally');
      await page.screenshot({ path: path.join(evidence, `variant-${variant}-desktop.png`) });
    }
    await page.locator('[data-parameter-action="reset"][data-parameter-style="gradient"]').click();
    const reset = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    await page.locator('[data-parameter-action="randomize"][data-parameter-style="gradient"]').click();
    await page.locator('[data-randomize-undo="gradient"]').click();
    assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource), reset);
    await page.evaluate(() => { document.getElementById('export-size-select').value = 'standard'; logoExportUI.sync(false); });
    for (const [format, method] of [['svg', 'saveSVG'], ['png', 'savePNG']]) {
      const pending = page.waitForEvent('download');
      await page.evaluate(method => window[method](), method);
      const download = await pending;
      const target = path.join(evidence, `gradient.${format}`);
      await download.saveAs(target);
      if (format === 'svg') assert.equal(await fs.readFile(target, 'utf8'), reset);
      else assert.equal((await fs.readFile(target)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    }
    await page.locator('#bar-information-toggle').click();
    await page.screenshot({ path: path.join(evidence, 'about-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#mobile-menu-toggle').click();
    await page.locator('#gradient-variant-slider').focus();
    await page.keyboard.press('End');
    assert.equal(await page.inputValue('#gradient-variant-slider'), '2');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(evidence, 'mobile-controls.png') });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ engine, passed: true, static: true, legacyMotionIgnored: true, keyboard: true, svgPng: true, evidence }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
