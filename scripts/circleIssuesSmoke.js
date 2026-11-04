const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8783';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1489, height: 974 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (const route of ['circles/?circlesDensity=10&circlesSizeVariation=100', 'neural-network/?neuralNetworkHiddenLayers=5', 'circles-gradient/']) {
      await page.goto(`${base}/generator/${route}`);
      await page.waitForFunction(() => typeof captureLogoExportSnapshot === 'function' && document.querySelector('#p5-container canvas'));
      await page.locator('#p5-container.is-entry-complete').waitFor();
      const result = await page.evaluate(async () => {
        const snapshot = captureLogoExportSnapshot();
        const doc = new DOMParser().parseFromString(snapshot.svgSource, 'image/svg+xml');
        const circles = [...doc.querySelectorAll('circle')];
        for (const c of circles) {
          const x = +c.getAttribute('cx'), y = +c.getAttribute('cy');
          const r = +c.getAttribute('r') + +(c.getAttribute('stroke-width') || 0) / 2;
          if (x - r < -1e-7 || x + r > 250 + 1e-7 || y - r < REFERENCE_BAR_Y - 1e-7 || y + r > REFERENCE_BAR_Y + 18 + 1e-7) throw new Error('Incomplete circle before clipping');
        }
        const blob = await createRasterExportBlob(snapshot, new AbortController().signal);
        const image = await createImageBitmap(blob);
        const png = { width: image.width, height: image.height, bytes: blob.size }; image.close();
        const fragment = buildCurrentBarPatternSVGFragment();
        return { family: snapshot.family, circles: circles.length, png, headerParity: buildHeaderPreviewSVG().includes(fragment), bar: buildCurrentBarOnlySVG() };
      });
      assert.ok(result.circles > 0); assert.ok(result.png.bytes > 1000); assert.ok(result.headerParity);
      if (result.family === 'circles-gradient') {
        assert.equal(result.circles, 86);
        const source = await fs.readFile('assets/bar references/Style=Circles Gradient 1.svg', 'utf8');
        await page.screenshot({ path: '/tmp/bar-gradient-desktop.png' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: '/tmp/bar-gradient-mobile.png' });
        const comparison = await browser.newPage();
        await comparison.setContent(`<body style="background:white;padding:30px;font:18px sans-serif"><p>Supplied reference</p>${source}<p>Generator variant 1 (same scale)</p>${result.bar.replace('<svg ', '<svg width="509" height="36.648" ' )}</body>`);
        await comparison.setViewportSize({ width: 600, height: 260 });
        await comparison.screenshot({ path: '/tmp/bar-gradient-reference-comparison.png' });
        await comparison.close();
      }
      delete result.bar; console.log(JSON.stringify(result));
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
