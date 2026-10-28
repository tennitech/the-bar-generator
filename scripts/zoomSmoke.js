// Pixel and GPU-limit regressions for the shared inspection-zoom path.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const browserName = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_ZOOM_EVIDENCE;
const styles = ['solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles', 'numeric', 'morse',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network',
  'triangle-grid', 'triangles', 'fibonacci-sequence', 'union', 'wave-quantum', 'runway'];

async function inspect(page) {
  return page.evaluate(async () => {
    noLoop();
    const gl = window._renderer.GL;
    const max = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : Infinity;
    const g = RPI_LOGO_GEOMETRY;
    const scale = getRenderedResponsiveLogoScale();
    const entry = getCanonicalBarImage(g.width * scale * zoomLevel * devicePixelRatio, max);
    const snapshot = await entry.ready;
    while (gl && gl.getError()) { /* Discard earlier state before this actual draw. */ }
    draw();
    const error = gl ? gl.getError() : 0;
    const actual = new Image();
    actual.src = document.querySelector('#p5-container canvas').toDataURL();
    await actual.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(actual, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    ctx.clearRect(0, 0, width, height);
    const x = width / 2 + scale * panOffset.x - g.width * scale * zoomLevel / 2;
    const y = height / 2 - getPreviewFitLayout().controlSpace / 2 + scale * panOffset.y
      + (LOGO_VERTICAL_OFFSET + g.barY) * scale * zoomLevel;
    ctx.drawImage(snapshot.canvas, x, y, g.width * scale * zoomLevel, g.barHeight * scale * zoomLevel);
    const reference = ctx.getImageData(0, 0, width, height).data;
    let difference = 0, area = 0, paint = 0;
    // Interior scan excludes sampling differences at the texture's outer edge.
    for (let py = Math.max(0, Math.ceil(y + 2)); py < Math.min(height, y + g.barHeight * scale * zoomLevel - 2); py++) {
      for (let px = Math.max(0, Math.ceil(x + 2)); px < Math.min(width, x + g.width * scale * zoomLevel - 2); px++) {
        const i = (py * width + px) * 4;
        for (let channel = 0; channel < 4; channel++) difference += Math.abs(pixels[i + channel] - reference[i + channel]) / 255 / 4;
        paint += pixels[i + 3] / 255; area++;
      }
    }
    return { style: styleSelect.value, theme: currentColorMode, zoom: zoomLevel, error,
      snapshotWidth: snapshot.width, max, difference: difference / area, area, paint };
  });
}

async function main() {
  const browser = await ({ chromium, webkit })[browserName].launch({ headless: true });
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 850 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/triangle-grid/`);
    await page.locator('#p5-container canvas').waitFor({ state: 'attached' });
    await page.evaluate(() => {
      noLoop();
      // Exercise the portable low-limit path without requiring a particular GPU.
      const gl = window._renderer.GL, original = gl.getParameter.bind(gl);
      gl.getParameter = parameter => parameter === gl.MAX_TEXTURE_SIZE ? Math.min(2048, original(parameter)) : original(parameter);
    });
    async function check() {
      const result = await inspect(page);
      assert.ok(result.area > 100 && result.paint > 20, `visible bar: ${JSON.stringify(result)}`);
      assert.equal(result.error, 0, JSON.stringify(result));
      assert.ok(result.snapshotWidth <= result.max, JSON.stringify(result));
      assert.ok(result.difference < 0.08, JSON.stringify(result));
      results.push(result);
    }
    for (const style of styles) {
      await page.locator('#style-select').evaluate((select, value) => {
        select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); noLoop();
      }, style);
      for (const zoom of [1, 4, 1]) {
        await page.evaluate(zoom => setZoomLevel(zoom, { immediate: true }), zoom);
        await check();
      }
    }
    await page.locator('#style-select').evaluate(select => {
      select.value = 'triangle-grid'; select.dispatchEvent(new Event('change', { bubbles: true })); noLoop();
    });
    for (const theme of ['black', 'white', 'red', 'silver', 'gray', 'blue', 'gold']) {
      await page.locator('#color-mode-select').evaluate((select, value) => {
        select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); noLoop();
      }, theme);
      for (const zoom of [1, 1.25, 1.5, 2, 2.5, 3, 4, 2, 1]) {
        await page.evaluate(zoom => setZoomLevel(zoom, { immediate: true }), zoom);
        await check();
      }
    }
    // Actual buttons, percent entry, wheel and Fit follow the same renderer path.
    for (let i = 0; i < 6; i++) await page.locator('#zoom-in-btn').click();
    await check();
    await page.locator('#zoom-reset-btn').click();
    await page.locator('#zoom-level').fill('400'); await page.locator('#zoom-level').press('Enter');
    await check();
    await page.locator('#zoom-reset-btn').click();
    const bounds = await page.locator('.canvas-viewport').boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.7);
    await page.mouse.wheel(0, -120); await check();
    await page.locator('#zoom-reset-btn').click();
    await check();
    assert.equal(await page.evaluate(() => zoomLevel), 1);
    const mobile = await browser.newContext({ viewport: { width: 390, height: 664 },
      deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const touchPage = await mobile.newPage();
    await touchPage.goto(`${base}/generator/triangle-grid/`);
    await touchPage.locator('#p5-container canvas').waitFor({ state: 'attached' });
    if (browserName === 'chromium') {
      const cdp = await mobile.newCDPSession(touchPage);
      const box = await touchPage.locator('.canvas-viewport').boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height * 0.6;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
        { x: x - 20, y, id: 1 }, { x: x + 20, y, id: 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
        { x: x - 100, y, id: 1 }, { x: x + 100, y, id: 2 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      // CDP touch dispatch is Chromium-only; exercise WebKit's same viewer state.
      await touchPage.evaluate(() => setZoomLevel(4, { immediate: true }));
    }
    const mobileResult = await inspect(touchPage);
    assert.equal(mobileResult.zoom, 4);
    assert.equal(mobileResult.error, 0);
    assert.ok(mobileResult.difference < 0.08 && mobileResult.paint > 20, JSON.stringify(mobileResult));
    results.push(mobileResult);
    await touchPage.locator('#zoom-reset-btn').tap();
    assert.equal(await touchPage.evaluate(() => zoomLevel), 1);
    await mobile.close();

    // 2D fallback must retain the same geometry without a GPU limit.
    const fallback = await browser.newPage({ viewport: { width: 900, height: 700 }, reducedMotion: 'reduce' });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : original.call(this, type, ...args);
      };
    });
    await fallback.goto(`${base}/generator/triangle-grid/`);
    await fallback.locator('#p5-container canvas').waitFor({ state: 'attached' });
    assert.equal(await fallback.evaluate(() => liveCanvasUsesWebGL), false);
    await fallback.evaluate(() => setZoomLevel(4, { immediate: true }));
    const fallbackResult = await inspect(fallback);
    assert.ok(fallbackResult.difference < 0.08 && fallbackResult.paint > 20, JSON.stringify(fallbackResult));
    results.push(fallbackResult);
    await fallback.close();
    assert.deepEqual(errors, []);
    if (evidence) {
      await fs.mkdir(evidence, { recursive: true });
      await fs.writeFile(`${evidence}/${browserName}-zoom-results.json`, JSON.stringify(results, null, 2));
      await page.screenshot({ path: `${evidence}/${browserName}-zoom-fit.png` });
    }
    console.log(`${browserName}: ${results.length} zoom pixel checks passed across ${styles.length} styles and 7 themes.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
