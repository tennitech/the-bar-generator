const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8841';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/binary-seams-${engine}`;
const allowBefore = process.env.RPI_EXPECT_BINARY_SEAMS === '1';
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/generator/binary/`);
    await page.waitForFunction(() => window.logoExportUI && window.barShareController && document.querySelector('#p5-container canvas[data-preview-ready="true"]'));
    for (const text of ['RPI', '0000000000', 'WHY NOT', '🚀'.repeat(10), 'Café 東京']) {
      await page.locator('#binary-input').fill(text);
      for (const size of ['standard', 'large']) {
        const data = await page.evaluate(async ({ size }) => {
          document.getElementById('export-size-select').value = size;
          const snapshot = captureLogoExportSnapshot(), bits = textToBinary(binaryInput.value || 'RPI');
          const blob = await createRasterExportBlob(snapshot, new AbortController().signal);
          const url = URL.createObjectURL(blob), image = new Image(); image.src = url; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); URL.revokeObjectURL(url);
          const { data, width } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const scale = snapshot.dimensions.scale, padding = snapshot.geometry.exportPadding;
          const alpha = (x, y) => data[(y * width + x) * 4 + 3];
          const issues = [], probes = [];
          // Independent oracle: same-bit neighbours must have no edge at their joint.
          for (let i = 1; i < bits.length; i++) if (bits[i - 1] === bits[i]) {
            const x = (padding + i * 250 / bits.length) * scale;
            for (const row of bits[i] ? [0, 2] : [1]) {
              const y = Math.floor((padding + snapshot.geometry.barY + (row + .5) * 6) * scale);
              const samples = [Math.floor(x), Math.ceil(x)].map(px => alpha(px, y));
              probes.push(samples);
              if (samples.some(value => value !== 255)) issues.push({ bit: i, row, x, samples });
            }
          }
          // Cell centres must keep the original encoding and negative space.
          let wrongCells = 0;
          bits.forEach((bit, i) => { for (let row = 0; row < 3; row++) {
            const x = Math.floor((padding + (i + .5) * 250 / bits.length) * scale);
            const y = Math.floor((padding + snapshot.geometry.barY + (row + .5) * 6) * scale);
            const expected = bit ? row !== 1 : row === 1;
            if (expected ? alpha(x, y) < 250 : alpha(x, y) > 5) wrongCells++;
          } });
          return { size, probes: probes.length, issues, wrongCells, width: canvas.width, height: canvas.height,
            source: snapshot.svgSource, png: canvas.toDataURL('image/png').split(',')[1] };
        }, { size });
        if (!allowBefore) { assert.equal(data.issues.length, 0, `${text}/${size}: ${JSON.stringify(data.issues.slice(0, 4))}`); assert.equal(data.wrongCells, 0); }
        results.push({ text, size, seamCount: data.issues.length, wrongCells: data.wrongCells, probes: data.probes });
        if (text === 'RPI' && size === 'standard') {
          await fs.writeFile(`${evidence}/binary.svg`, data.source); await fs.writeFile(`${evidence}/binary.png`, Buffer.from(data.png, 'base64'));
        }
      }
    }
    if (allowBefore) assert.ok(results.some(item => item.seamCount > 0), 'before repair must reproduce seams');
    else {
      // Actual download paths retain the captured source and PNG encoding.
      await page.locator('#binary-input').fill('RPI');
      for (const method of ['saveSVG', 'savePNG']) {
        const pending = page.waitForEvent('download'); await page.evaluate(method => window[method](), method);
        const download = await pending, data = await fs.readFile(await download.path());
        if (method === 'saveSVG') assert.equal(data.toString(), await page.evaluate(() => captureLogoExportSnapshot().svgSource));
        else assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      }
    }
    await page.close();
    // Main preview, including high-zoom texture path, and the 2D fallback.
    for (const fallback of [false, true]) for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const preview = await browser.newPage({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 2 });
      preview.on('pageerror', e => errors.push(e.message));
      if (fallback) await preview.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /^webgl/.test(type) ? null : original.call(this, type, ...args); };
      });
      await preview.goto(`${base}/generator/binary/`); await preview.waitForFunction(() => window.barShareController && document.querySelector('#p5-container canvas[data-preview-ready="true"]'));
      for (const zoom of [1, 4]) {
        await preview.evaluate(async zoom => {
          setZoomLevel(zoom, { immediate: true });
          const width = REFERENCE_WIDTH * getRenderedResponsiveLogoScale() * zoomLevel * devicePixelRatio;
          await getCanonicalBarImage(width).ready; requestUpdate();
          for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
        }, zoom);
        await preview.screenshot({ path: `${evidence}/preview-${viewport.width}-${fallback ? '2d' : 'webgl'}-${zoom}.png` });
        const sources = await preview.evaluate(() => ({ header: document.querySelector('#header-logo-preview').innerHTML,
          expected: buildHeaderPreviewSVG(), source: buildCurrentBarPatternSVGFragment({ barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 }),
          controls: binaryInput.value, alert: !!document.querySelector('#bar-preview-error') }));
        assert.equal(sources.alert, false); assert.equal(sources.controls, 'RPI');
        const painted = await preview.evaluate(() => {
          const source = document.querySelector('#p5-container canvas');
          const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(source, 0, 0);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const scale = getRenderedResponsiveLogoScale(), ratio = source.width / window.width;
          const bits = textToBinary(binaryInput.value), probes = [], issues = [];
          for (let i = 1; i < bits.length; i++) if (bits[i] === bits[i - 1]) {
            const x = (window.width / 2 + scale * panOffset.x + scale * zoomLevel * (i * 250 / bits.length - 125)) * ratio;
            for (const row of bits[i] ? [0, 2] : [1]) {
              const y = (window.height / 2 - getPreviewFitLayout().controlSpace / 2 + scale * panOffset.y
                + scale * zoomLevel * (LOGO_VERTICAL_OFFSET + REFERENCE_BAR_Y + (row + .5) * 6)) * ratio;
              if (x < 1 || x >= canvas.width - 1 || y < 1 || y >= canvas.height - 1) continue;
              const alpha = pixels[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3];
              probes.push(alpha); if (alpha !== 255) issues.push({ i, row, x, y, alpha });
            }
          }
          const expected = new DOMParser().parseFromString(buildHeaderPreviewSVG(), 'image/svg+xml');
          const rects = root => [...root.querySelectorAll('rect')].map(el => ['x', 'y', 'width', 'height'].map(key => Number(el.getAttribute(key))));
          return { probes: probes.length, issues, headerMatches: JSON.stringify(rects(expected)) === JSON.stringify(rects(document.querySelector('#header-logo-preview'))) };
        });
        if (!allowBefore) { assert.ok(painted.probes > 0); assert.equal(painted.issues.length, 0, JSON.stringify({ viewport, fallback, zoom, ...painted })); }
        assert.equal(painted.headerMatches, true);
        results.push({ viewport: viewport.width, fallback, zoom, previewProbes: painted.probes, previewSeams: painted.issues.length });
      }
      await preview.close();
    }
    assert.deepEqual(errors, []); await fs.writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
    console.log(`${engine}: ${JSON.stringify(results)}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
