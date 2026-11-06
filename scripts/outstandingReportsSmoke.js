// Revisit the original reports on the current release. No issue #14 symptom is inferred.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8869';
const output = process.env.RPI_EVIDENCE_DIR || `/tmp/bar-reports-${engine}`;
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    for (const requestedWidth of [1489, 390]) for (const [issue, route] of [
      [43, 'ticker/?tickerRepeats=5&tickerRatio=1'],
      [53, 'waveform/?waveformType=3&waveformFrequency=10&waveformEnvelopeWaves=6'],
      [14, 'waveform/?waveformType=2&waveformFrequency=29&waveformSpeed=5&waveformEnvelope=true&waveformEnvelopeType=inverse&waveformEnvelopeWaves=6&waveformEnvelopeCenter=0.4']
    ]) {
      const width = issue === 14 && requestedWidth !== 390 ? 1600 : requestedWidth;
      const height = width === 390 ? 844 : issue === 14 ? 789 : 974;
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/${route}`);
      await page.waitForFunction(() => window.barShareController && window.logoExportUI && !window.PageEntrance?.isActive?.());
      const result = await page.evaluate(() => {
        const options = { ...getCurrentBarPatternValues(250), shader: currentShader, barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 };
        const fragment = buildCurrentBarPatternSVGFragment({ barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 });
        const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${fragment}</svg>`, 'image/svg+xml');
        const paint = [...doc.querySelectorAll('rect,path')].filter(el => !el.closest('defs,clipPath'));
        const snapshot = captureLogoExportSnapshot();
        const exportFragment = buildCurrentBarPatternSVGFragment({ fgColor: snapshot.foreground });
        return { shader: currentShader, rects: paint.filter(el => el.tagName === 'rect').length,
          paths: paint.filter(el => el.tagName === 'path').length,
          ticks: currentShader === 2 ? createTickerPatternGeometry(options).rects.length : null,
          naturalTicks: currentShader !== 2 || JSON.stringify(createBoundedTickGeometry(options)) === JSON.stringify(createTickerPatternGeometry(options)),
          exportParity: snapshot.svgSource.includes(exportFragment),
          overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      assert.equal(result.exportParity, true); assert.equal(result.overflow, false);
      if (issue === 43) { assert.equal(result.rects, result.ticks); assert.equal(result.naturalTicks, true); assert.equal(result.paths, 0); }
      else { assert.equal(result.rects, 0, 'Waveform adds no baseline rectangle'); assert.equal(result.paths, 1); }
      for (const format of ['svg', 'png']) {
        const pending = page.waitForEvent('download');
        assert.ok(await page.evaluate(format => runLogoExport(format), format));
        const download = await pending;
        const bytes = await fs.readFile(await download.path());
        if (format === 'png') assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        await fs.writeFile(`${output}/issue-${issue}-${width}-export.${format}`, bytes);
      }
      await page.screenshot({ path: `${output}/issue-${issue}-${width}.png` });
      assert.deepEqual(errors, []);
      results.push({ issue, width, ...result, errors }); await page.close();
    }
    await fs.writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ engine, results }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
