// Rendered-pixel regression checks; run against a local static preview server.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, firefox, webkit } = require('playwright');
const browserName = process.env.RPI_BROWSER || 'chromium';
const baseUrl = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidenceDirectory = process.env.RPI_GEOMETRY_EVIDENCE;
const styles = ['solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles', 'numeric', 'morse',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network',
  'triangle-grid', 'triangles', 'fibonacci-sequence', 'union', 'wave-quantum', 'runway', 'lunar'];

async function inspectRenderedMark(page) {
  return page.evaluate(async () => {
    const g = RPI_LOGO_GEOMETRY;
    let snapshotAspectError = 0;
    if (![1, 2, 4].includes(currentShader)) {
      await getCanonicalBarImage().ready;
      const snapshot = await getCanonicalBarImage(g.width * getRenderedResponsiveLogoScale() * zoomLevel * (window.devicePixelRatio || 1)).ready;
      snapshotAspectError = Math.abs(snapshot.width / snapshot.height - g.width / g.barHeight);
    }
    const pg = createExportGraphicsBuffer(4);
    drawExportLogoFrame(pg, { scale: 4 });
    const raster = pg.drawingContext.getImageData(0, 0, pg.width, pg.height);
    // Give the SVG an integer raster viewport with exactly four pixels per unit.
    // Fractional intrinsic image heights otherwise change WebKit's sampling origin.
    const header = buildHeaderPreviewSVG()
      .replace('<svg ', `<svg width="${pg.width}" height="${pg.height}" `)
      .replace(`viewBox="0 0 ${g.width} ${g.totalHeight}"`, `viewBox="-20 -20 ${pg.width / 4} ${pg.height / 4}"`)
      .replace('fill="currentColor"', 'fill="#000000"');
    const image = new Image();
    image.src = `data:image/svg+xml,${encodeURIComponent(header)}`;
    await image.decode();
    const reference = document.createElement('canvas');
    reference.width = pg.width; reference.height = pg.height;
    const ctx = reference.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const expected = ctx.getImageData(0, 0, reference.width, reference.height);
    const bounds = { x: Infinity, y: Infinity, right: -1, bottom: -1 };
    let painted = 0, difference = 0, expectedPaint = 0, outside = 0;
    const minY = Math.floor((g.barY + 20) * 4), maxY = Math.ceil((g.totalHeight + 20) * 4);
    for (let y = 0; y < pg.height; y++) for (let x = 0; x < pg.width; x++) {
      const i = (y * pg.width + x) * 4;
      if (y < minY) continue;
      const alpha = raster.data[i + 3], other = expected.data[i + 3];
      if (alpha > 8) {
        painted++; bounds.x = Math.min(bounds.x, x); bounds.y = Math.min(bounds.y, y);
        bounds.right = Math.max(bounds.right, x); bounds.bottom = Math.max(bounds.bottom, y);
        if (x < 79 || x > 1080 || y >= maxY) outside++;
      }
      if (other > 8) expectedPaint++;
      difference += Math.abs(alpha - other) / 255;
    }
    // Read actual live canvas pixels immediately after drawing; WebGL otherwise clears its buffer.
    draw();
    const preview = new Image(); preview.src = document.querySelector('#p5-container canvas').toDataURL();
    await preview.decode();
    const live = document.createElement('canvas'); live.width = preview.width; live.height = preview.height;
    const liveCtx = live.getContext('2d'); liveCtx.drawImage(preview, 0, 0);
    let vectorDOMAlignmentError = 0;
    if (currentShader === 24) {
      // Artemis intentionally paints in a vector DOM overlay, outside p5's
      // bitmap. Composite that actual visible element at its actual CSS bounds,
      // after checking its transform, rather than treating the canvas as blank.
      const element = document.querySelector('[data-lunar-vector-preview] > svg');
      if (!element || element.parentElement.hidden || getComputedStyle(element).visibility === 'hidden'
        || getComputedStyle(element.parentElement).display === 'none') throw new Error('Artemis vector preview is hidden');
      const bounds = element.getBoundingClientRect();
      const canvasBounds = document.querySelector('#p5-container canvas').getBoundingClientRect();
      const expectedScale = getRenderedResponsiveLogoScale() * zoomLevel;
      const expectedX = width / 2 - g.width * expectedScale / 2;
      const expectedY = height / 2 - getPreviewFitLayout().controlSpace / 2 + (LOGO_VERTICAL_OFFSET + g.barY) * expectedScale;
      vectorDOMAlignmentError = Math.max(Math.abs(bounds.left - canvasBounds.left - expectedX),
        Math.abs(bounds.top - canvasBounds.top - expectedY), Math.abs(bounds.width - g.width * expectedScale),
        Math.abs(bounds.height - g.barHeight * expectedScale));
      const clone = element.cloneNode(true); clone.removeAttribute('style');
      const vector = new Image(); vector.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      await vector.decode();
      liveCtx.drawImage(vector, (bounds.left - canvasBounds.left) * live.width / canvasBounds.width,
        (bounds.top - canvasBounds.top) * live.height / canvasBounds.height,
        bounds.width * live.width / canvasBounds.width, bounds.height * live.height / canvasBounds.height);
    }
    const scale = getRenderedResponsiveLogoScale() * zoomLevel;
    const ratio = preview.width / width;
    const startX = (width / 2 - g.width * scale / 2) * ratio;
    const startY = (height / 2 - getPreviewFitLayout().controlSpace / 2 + (LOGO_VERTICAL_OFFSET + g.barY) * scale) * ratio;
    const liveExpected = document.createElement('canvas'); liveExpected.width = live.width; liveExpected.height = live.height;
    const expectedCtx = liveExpected.getContext('2d');
    expectedCtx.drawImage(image, 80, 80, g.width * 4, g.totalHeight * 4,
      startX, startY - g.barY * scale * ratio,
      g.width * scale * ratio, g.totalHeight * scale * ratio);
    const livePixels = liveCtx.getImageData(0, 0, live.width, live.height).data;
    const referencePixels = expectedCtx.getImageData(0, 0, live.width, live.height).data;
    let previewDifference = 0, previewExpectedPaint = 0;
    let actualMass = 0, expectedMass = 0, actualY = 0, expectedY = 0;
    let liveMinX = Infinity, liveMaxX = -1;
    const scanY = Math.max(0, Math.floor(startY - 20 * scale * ratio));
    for (let y = scanY; y < live.height; y++) for (let x = 0; x < live.width; x++) {
      const i = (y * live.width + x) * 4 + 3;
      previewDifference += Math.abs(livePixels[i] - referencePixels[i]) / 255;
      if (livePixels[i] > 8) { liveMinX = Math.min(liveMinX, x); liveMaxX = Math.max(liveMaxX, x); }
      actualMass += livePixels[i]; expectedMass += referencePixels[i];
      actualY += livePixels[i] * y; expectedY += referencePixels[i] * y;
      if (referencePixels[i] > 8) previewExpectedPaint++;
    }
    const pixels = liveCtx.getImageData(Math.max(0, Math.floor(startX)), Math.max(0, Math.floor(startY)),
      Math.min(live.width - Math.max(0, Math.floor(startX)), Math.ceil(g.width * scale * ratio)),
      Math.min(live.height - Math.max(0, Math.floor(startY)), Math.ceil(g.barHeight * scale * ratio))).data;
    let previewPaint = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 8) previewPaint++;
    const result = { hasStaticHorizontalFit: buildCurrentBarPatternSVGFragment().includes('data-bar-edge-fit'), painted, expectedPaint, difference: difference / Math.max(1, expectedPaint), differenceArea: difference / (1000 * 72), outside, bounds,
      previewPaint, snapshotAspectError, vectorDOMAlignmentError,
      previewEdgeError: Math.max(Math.abs(liveMinX - Math.floor(startX)),
        Math.abs(liveMaxX - (Math.ceil(startX + g.width * scale * ratio) - 1))),
      previewDifference: previewDifference / Math.max(1, previewExpectedPaint),
      previewPositionError: Math.abs(actualY / actualMass - expectedY / expectedMass),
      previewDifferenceArea: previewDifference / (g.width * g.barHeight * scale * scale * ratio * ratio), dimensions: [pg.width, pg.height], barY: g.barY, gap: g.barY - g.letterHeight };
    pg.remove();
    return result;
  });
}

async function main() {
  const browser = await ({ chromium, firefox, webkit }[browserName]).launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('Page error:', error.message); });
    const results = [];
    for (const style of styles) {
      console.log(`Checking ${style}`);
      await page.goto(`${baseUrl}/generator/${style}/`);
      await page.locator('#p5-container canvas').waitFor({ state: 'attached', timeout: 15000 }).catch(async error => { console.log(await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 500), p5: typeof p5, setup: typeof setup }))); throw error; });
      if (style === 'lunar') await page.waitForFunction(() => !!window.LUNAR_BAR_SVG_SOURCE);
      const variants = await page.locator('[id$="variant-slider"]:visible').count();
      const variantInput = page.locator('[id$="variant-slider"]:visible').first();
      const values = variants ? await variantInput.evaluate(input => [Number(input.min), Math.round((Number(input.min) + Number(input.max)) / 2), Number(input.max)]) : [null];
      for (const variant of [...new Set(values)]) {
        if (variant !== null) await variantInput.evaluate((input, value) => {
          input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
        }, variant);
        const result = await inspectRenderedMark(page);
        const label = `${style}/${variant ?? 'default'}`;
        assert.ok(result.painted > 20, `${label}: PNG bar blank`);
        assert.ok(result.previewPaint > 20, `${label}: live preview bar blank`);
        assert.ok(result.vectorDOMAlignmentError < 0.1, `${label}: vector DOM placement error ${result.vectorDOMAlignmentError}`);
        // Normalize antialiasing error over the full design rectangle; keep position strict.
        assert.ok(result.previewDifferenceArea < 0.08, `${label}: preview/header position or paint mismatch ${result.previewDifference}`);
        assert.ok(result.snapshotAspectError < 1e-9, `${label}: SVG snapshot changed the bar aspect ratio`);
        if (style !== 'ruler') assert.ok(result.previewEdgeError <= 1, `${label}: preview painted edge inset ${result.previewEdgeError}px`);
        assert.ok(result.previewPositionError < 1.5, `${label}: live bar displacement ${result.previewPositionError}px`);
        if (style !== 'ruler') assert.equal(result.bounds.x, 80, `${label}: painted left edge inset`);
        if (style !== 'ruler') assert.equal(result.bounds.right, 1079, `${label}: painted right edge inset`);
        assert.equal(result.outside, 0, `${label}: stroke/fill escapes official rectangle`);
        assert.ok(result.differenceArea < 0.08, `${label}: PNG/header pixel mismatch ${result.difference}`);
        assert.deepEqual(result.dimensions, [1160, 762], `${label}: scaled export margins`);
        assert.ok(Math.abs(result.gap - 21) < 1e-9, `${label}: official spacing`);
        results.push({ style, variant, ...result });
      }
      // Exercise actual downloads, not just internal renderers.
      await page.locator('#save-button').click();
      const svgWait = page.waitForEvent('download'); await page.locator('#save-svg').click();
      const svg = await fs.readFile(await (await svgWait).path(), 'utf8');
      assert.match(svg, /viewBox="-20 -20 290 190.4885"/);
      await page.locator('#save-button').click();
      const pngWait = page.waitForEvent('download'); await page.locator('#save-png').click();
      const png = await fs.readFile(await (await pngWait).path());
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      const pixels = await page.evaluate(async encoded => {
        const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
        const g = RPI_LOGO_GEOMETRY, scale = image.width / (g.width + g.exportPadding * 2);
        const header = buildHeaderPreviewSVG().replace('<svg ', `<svg width="${image.width}" height="${image.height}" `)
          .replace(`viewBox="0 0 ${g.width} ${g.totalHeight}"`, `viewBox="-${g.exportPadding} -${g.exportPadding} ${image.width / scale} ${image.height / scale}"`);
        const reference = new Image(); reference.src = `data:image/svg+xml,${encodeURIComponent(header)}`; await reference.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const actual = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(reference, 0, 0);
        const expected = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let difference = 0; for (let i = 0; i < actual.length; i++) difference += Math.abs(actual[i] - expected[i]);
        return { difference, width: image.width, height: image.height };
      }, png.toString('base64'));
      assert.deepEqual([pixels.width, pixels.height], [1160, 762]);
      assert.equal(pixels.difference, 0, `${style}: downloaded PNG differs from selected header vector content`);

      if (evidenceDirectory) await page.screenshot({ path: `${evidenceDirectory}/geometry-${style}.png` });
    }
    for (const viewport of [{ width: 375, height: 667 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}/generator/solid/`);
      await page.locator('#p5-container canvas').waitFor({ state: 'attached', timeout: 15000 }).catch(async error => { console.log(await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 500), p5: typeof p5, setup: typeof setup }))); throw error; });
      const result = await inspectRenderedMark(page);
      assert.ok(result.previewPaint > 20, `${viewport.width}px preview visible`);
      if (evidenceDirectory) await page.screenshot({ path: `${evidenceDirectory}/geometry-${viewport.width}.png` });
    }
    assert.deepEqual(errors, []);
    if (evidenceDirectory) await fs.writeFile(`${evidenceDirectory}/geometry-results.json`, JSON.stringify(results, null, 2));
    console.log(`${browserName}: Geometry pixels and real SVG/PNG downloads passed for ${results.length} family/variant cases and 2 mobile/tablet layouts.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
