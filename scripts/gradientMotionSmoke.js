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
      assert.ok(raster.runs > 1 && raster.runs < 21, 'finite pixels resolve only a subset of the 21 true area steps');
      await page.screenshot({ path: path.join(evidence, `variant-${variant}-desktop.png`) });
    }
    await page.locator('[data-parameter-action="reset"][data-parameter-style="gradient"]').click();
    const reset = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    await page.locator('[data-parameter-action="randomize"][data-parameter-style="gradient"]').click();
    await page.locator('[data-randomize-undo="gradient"]').click();
    assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource), reset);
    await page.evaluate(() => { document.getElementById('export-size-select').value = 'standard'; logoExportUI.sync(false); });
    const rasterSpec = await page.evaluate(() => { const s = captureLogoExportSnapshot(); return {dimensions:s.dimensions, viewport:s.viewport}; });
    for (const [format, method] of [['svg', 'saveSVG'], ['png', 'savePNG']]) {
      const pending = page.waitForEvent('download');
      await page.evaluate(method => window[method](), method);
      const download = await pending;
      const target = path.join(evidence, `gradient.${format}`);
      await download.saveAs(target);
      if (format === 'svg') assert.equal(await fs.readFile(target, 'utf8'), reset);
      else {
        const png = await fs.readFile(target);
        assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        const alphaError = await page.evaluate(async ({ png, svg, rasterSpec }) => {
          const load = async source => { const image = new Image(); image.src = source; await image.decode(); return image; };
          const actual = await load('data:image/png;base64,' + png);
          const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
          const { dimensions, viewport } = rasterSpec;
          xml.documentElement.setAttribute('width', dimensions.width);
          xml.documentElement.setAttribute('height', dimensions.height);
          // The export contract uses a whole-pixel viewport at uniform scale.
          xml.documentElement.setAttribute('viewBox', `${viewport.x} ${viewport.y} ${dimensions.width / dimensions.scale} ${dimensions.height / dimensions.scale}`);
          const expected = await load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(xml)));
          const canvas = document.createElement('canvas');
          canvas.width = actual.naturalWidth; canvas.height = actual.naturalHeight;
          const context = canvas.getContext('2d');
          context.drawImage(actual, 0, 0);
          const actualPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(expected, 0, 0, canvas.width, canvas.height);
          const expectedPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let difference = 0, expectedAlpha = 0;
          for (let i = 3; i < actualPixels.length; i += 4) {
            difference += Math.abs(actualPixels[i] - expectedPixels[i]);
            expectedAlpha += expectedPixels[i];
          }
          return expectedAlpha ? difference / expectedAlpha : Infinity;
        }, { png: png.toString('base64'), svg: reset, rasterSpec });
        assert.ok(alphaError < .005, `decoded PNG alpha differs from the captured SVG: ${alphaError}`);
      }
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
