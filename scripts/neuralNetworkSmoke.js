const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8793';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_NEURAL_EVIDENCE || `/tmp/neural-network-${engine}`;
async function ready(page) {
  await page.waitForFunction(() => window.barShareController && typeof buildCurrentBarPatternSVGFragment === 'function');
  await page.locator('#p5-container canvas').waitFor();
}
async function svg(page) {
  const wait = page.waitForEvent('download');
  await page.evaluate(() => saveSVG());
  return fs.readFile(await (await wait).path(), 'utf8');
}
async function set(page, values) {
  await page.evaluate(values => {
    for (const [key, value] of Object.entries(values)) {
      const field = document.querySelector(`[data-url-parameter="${key}"]`);
      field.value = String(value); field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    }
  }, values);
}
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    await fs.mkdir(evidence, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/neural-network/`); await ready(page);
    await page.screenshot({ path: `${evidence}/desktop-default.png` });
    await page.locator('#neural-network-hidden-layers-slider').focus();
    await page.keyboard.press('End'); assert.equal(await page.inputValue('#neural-network-hidden-layers-slider'), '5');
    const trigger = page.locator('#neural-network-activation-select').locator('..').locator('.custom-select-trigger');
    await trigger.focus(); await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Sigmoid', exact: true }).click();
    assert.equal(await page.inputValue('#neural-network-activation-select'), 'sigmoid');
    for (const theme of ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray']) {
      await set(page, { colorMode: theme });
      for (const size of [2, 5]) for (const depth of [1, 5]) {
        await set(page, { neuralNetworkUnits: size, neuralNetworkHiddenLayers: depth,
          neuralNetworkConnectivity: depth === 1 ? 'local' : 'dense', neuralNetworkInput: size === 2 ? 0 : 100,
          neuralNetworkSeed: size === 2 ? 1 : 16 });
        const parity = await page.evaluate(async () => {
          await getCanonicalBarImage().ready;
          const g = RPI_LOGO_GEOMETRY, pg = createExportGraphicsBuffer(4);
          drawExportLogoFrame(pg, { scale: 4 });
          const header = buildHeaderPreviewSVG().replace('<svg ', `<svg width="${pg.width}" height="${pg.height}" `)
            .replace(`viewBox="0 0 ${g.width} ${g.totalHeight}"`, `viewBox="-20 -20 ${pg.width / 4} ${pg.height / 4}"`)
            .replace(/currentColor/g, '#000000');
          const image = new Image(); image.src = `data:image/svg+xml,${encodeURIComponent(header)}`; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = pg.width; canvas.height = pg.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
          const a = pg.drawingContext.getImageData(0, 0, pg.width, pg.height).data;
          const b = ctx.getImageData(0, 0, pg.width, pg.height).data;
          let delta = 0, left = Infinity, right = -1, outside = 0;
          const top = Math.floor((g.barY + 20) * 4), bottom = Math.ceil((g.totalHeight + 20) * 4);
          for (let y = top; y < pg.height; y++) for (let x = 0; x < pg.width; x++) {
            const i = (y * pg.width + x) * 4 + 3; delta += Math.abs(a[i] - b[i]);
            if (a[i] > 8) { left = Math.min(left, x); right = Math.max(right, x);
              if (x < 80 || x > 1079 || y >= bottom) outside++; }
          }
          pg.remove(); return { left, right, outside, meanAlphaDifference: delta / (1000 * 72) };
        });
        assert.deepEqual([parity.left, parity.right, parity.outside], [80, 1079, 0]);
        assert.ok(parity.meanAlphaDifference < 4, JSON.stringify(parity));
        results.push({ theme, size, depth, ...parity });
      }
    }
    await set(page, { colorMode: 'black', neuralNetworkHiddenLayers: 3, neuralNetworkUnits: 4,
      neuralNetworkActivation: 'tanh', neuralNetworkConnectivity: 'local', neuralNetworkInput: 27, neuralNetworkSeed: 8 });
    const before = await svg(page);
    await page.screenshot({ path: `${evidence}/desktop-configured.png` });
    const link = await page.evaluate(() => barShareController.buildLink());
    await page.goto(link); await ready(page); assert.equal(await svg(page), before);
    await fs.writeFile(`${evidence}/configured.svg`, before);
    // Plain query URLs retain the same explicit weight set, including zero input.
    await set(page, { neuralNetworkInput: 0 });
    await page.waitForTimeout(350);
    const query = await page.evaluate(() => { const url = new URL(location.href); url.hash = '';
      for (const field of document.querySelectorAll('#neural-network-group [data-url-parameter]')) url.searchParams.set(field.dataset.urlParameter, field.value); return url.href; });
    const zero = await svg(page); await page.goto(query); await ready(page);
    assert.equal(await svg(page), zero); assert.equal(await page.inputValue('#neural-network-input-slider'), '0');
    // Zoom never changes exports.
    await page.evaluate(() => setZoomLevel(4));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${evidence}/desktop-400.png` });
    assert.equal(await svg(page), zero);
    const wait = page.waitForEvent('download'); await page.evaluate(() => savePNG());
    const png = await fs.readFile(await (await wait).path());
    assert.deepEqual([...png.subarray(0,8)], [137,80,78,71,13,10,26,10]);
    await fs.writeFile(`${evidence}/configured.png`, png);
    const pngBounds = await page.evaluate(async base64 => {
      const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = Infinity, right = -1, outside = 0;
      for (let y = 609; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 8) {
          left = Math.min(left, x); right = Math.max(right, x);
          if (x < 80 || x >= 1080 || y >= 682) outside++;
        }
      }
      return { width: canvas.width, height: canvas.height, left, right, outside };
    }, png.toString('base64'));
    assert.deepEqual(pngBounds, { width: 1160, height: 762, left: 80, right: 1079, outside: 0 });
    await page.evaluate(() => setZoomLevel(1));
    const fitWait = page.waitForEvent('download'); await page.evaluate(() => savePNG());
    assert.deepEqual(await fs.readFile(await (await fitWait).path()), png, 'Fit and 400% PNG bytes');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await svg(page), zero, 'motion preference does not evolve the network');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Every added slider uses the existing numeric editor and ordinary keyboard input.
    await page.locator('#neural-network-input-slider').focus(); await page.keyboard.press('End');
    assert.equal(await page.inputValue('#neural-network-input-slider'), '100');
    await page.locator('#neural-network-input-display').click();
    await page.locator('#neural-network-group .slider_value-input').fill('32');
    await page.keyboard.press('Enter');
    assert.equal(await page.inputValue('#neural-network-input-slider'), '32');
    // Existing per-family reset and randomize must cover the entire model.
    await page.evaluate(() => resetStyleParameters('neural-network'));
    assert.equal(await page.inputValue('#neural-network-seed-slider'), '1');
    assert.equal(await page.inputValue('#neural-network-input-slider'), '65');
    await page.evaluate(() => randomizeStyleParameters('neural-network'));
    assert.ok(Number(await page.inputValue('#neural-network-seed-slider')) >= 1);
    // Exact-size artwork sheet: 250 × 18 CSS pixels, plus width/depth extremes.
    const samples = await page.evaluate(() => ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray'].map(theme => {
      const fg = colors[theme].fg;
      return { theme, fg, background: ['white', 'gray', 'silver'].includes(theme) ? '#171717' : '#fff',
        shapes: [[1,2], [3,3], [5,5]].map(([layers, units]) => createBarPatternSVG({ currentShader: 23,
          barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18, fgColor: fg,
          values: { neuralNetworkHiddenLayers: layers, neuralNetworkUnits: units } })) };
    }));
    const sheet = await browser.newPage({ viewport: { width: 960, height: 650 }, deviceScaleFactor: 1 });
    await sheet.setContent(`<body style="margin:0;padding:20px;font:12px monospace;background:#e8e8e8"><p>Neural Network · actual 250 × 18 px · shallow / default / deep</p>${samples.map(sample => `<div style="padding:12px;margin:6px 0;background:${sample.background};color:${sample.fg}"><span style="display:inline-block;width:65px">${sample.theme}</span>${sample.shapes.map(shape => `<svg style="margin-right:10px" width="250" height="18" viewBox="0 0 250 18">${shape}</svg>`).join('')}</div>`).join('')}</body>`);
    await sheet.screenshot({ path: `${evidence}/actual-size-themes.png` });
    // Old shared snapshots omit newly introduced controls and retain their layer count.
    const legacy = await page.evaluate(() => {
      const state = barShareController.capture(); state.controls['neural-network-hidden-layers-slider'] = '1';
      for (const key of ['units-slider','input-slider','seed-slider','connectivity-select','activation-select']) delete state.controls[`neural-network-${key}`];
      return location.href.split('#')[0] + BarShareState.encodeState(state, barShareController.manifest);
    });
    await page.goto(legacy); await ready(page);
    assert.equal(await page.inputValue('#neural-network-hidden-layers-slider'), '1');
    assert.equal(await page.inputValue('#neural-network-seed-slider'), '1');
    assert.equal(await page.inputValue('#neural-network-units-slider'), '3');
    const fallback = await browser.newPage({ reducedMotion: 'reduce' });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (['webgl', 'webgl2', 'experimental-webgl'].includes(kind)) return null;
        return original.call(this, kind, ...args);
      };
    });
    await fallback.goto(link); await ready(fallback);
    assert.equal(await fallback.evaluate(() => drawingContext instanceof CanvasRenderingContext2D), true);
    assert.equal(await svg(fallback), before, '2D fallback preserves model/export');
    await fallback.screenshot({ path: `${evidence}/fallback-2d.png` });
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await mobile.goto(link); await ready(mobile);
    await mobile.locator('#mobile-menu-toggle').tap();
    await mobile.screenshot({ path: `${evidence}/mobile.png` });
    const range = mobile.locator('#neural-network-units-slider'); await range.scrollIntoViewIfNeeded();
    const box = await range.boundingBox(); await mobile.touchscreen.tap(box.x + box.width - 4, box.y + box.height / 2);
    assert.equal(await mobile.inputValue('#neural-network-units-slider'), '5');
    await mobile.evaluate(async () => { await getCanonicalBarImage().ready; redraw(); });
    await mobile.waitForTimeout(150);
    await mobile.screenshot({ path: `${evidence}/mobile-controls.png` });
    await mobile.locator('.neural_model-details summary').scrollIntoViewIfNeeded();
    await mobile.locator('.neural_model-details summary').tap();
    assert.equal(await mobile.locator('.neural_model-details').getAttribute('open'), '');
    await mobile.screenshot({ path: `${evidence}/mobile-explanation.png` });
    for (const viewport of [{ width: 320, height: 700 }, { width: 844, height: 390 }]) {
      await mobile.setViewportSize(viewport);
      await mobile.locator('#neural-network-input-slider').scrollIntoViewIfNeeded();
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.deepEqual(errors, []);
    await fs.writeFile(`${evidence}/results.json`, JSON.stringify({ engine, cases: results.length, results, share: 'exact SVG', query: 'exact SVG including zero', png: pngBounds, fallback: '2D and WebGL share exact SVG', errors }, null, 2));
    console.log(`PASS ${engine}: ${results.length} theme/extrema/parity cases, share/query, keyboard/touch, zoom/export`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
