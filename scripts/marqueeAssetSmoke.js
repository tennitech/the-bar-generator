/* Check actual SVG interior pixels, not just file existence or source parity. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { samples } = require('../js/utils/marqueeCatalog');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-artwork-evidence';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  await fs.mkdir(evidence, { recursive: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.goto(base);
    const results = await page.evaluate(async ({ base, samples }) => {
      const results = [];
      for (const sample of samples) {
        const image = new Image(); image.src = `${base}/${sample.path}`; await image.decode();
        for (const [width, height] of [[250, 18], [448, 32]]) {
          const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, width, height);
          const { data } = ctx.getImageData(0, 0, width, height);
          const insetX = Math.ceil(width * 0.032), insetY = Math.ceil(height * 0.17);
          let interior = 0;
          for (let y = insetY; y < height - insetY; y++) for (let x = insetX; x < width - insetX; x++) {
            if (data[(y * width + x) * 4 + 3] > 80) interior++;
          }
          results.push({ value: sample.value, variant: sample.variant, width, height, interior });
        }
      }
      return results;
    }, { base, samples });
    for (const result of results) {
      assert.ok(result.interior > 25, `unexpectedly empty sample: ${JSON.stringify(result)}`);
      if (result.value === 'triangle-grid') assert.ok(result.interior > 500, `Triangle Grid lost its interior: ${JSON.stringify(result)}`);
    }
    await fs.writeFile(path.join(evidence, `${engine}-asset-pixels.json`), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ engine, samples: samples.length, renderedSizes: results.length, passed: true, evidence }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
