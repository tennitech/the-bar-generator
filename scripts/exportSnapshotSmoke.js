// Exercise actual downloads while sidebar state changes during asynchronous export.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (const style of ['triangles', 'wave-quantum']) {
      const prepare = async () => {
        await page.goto(`${base}/generator/${style}/`);
        await page.waitForFunction(() => window.logoExportUI && window.barShareController);
        await page.evaluate(style => {
          const set = (id, value, type = 'input') => {
            const field = document.getElementById(id); field.value = String(value);
            field.dispatchEvent(new Event(type, { bubbles: true }));
          };
          set('triangles-count-slider', 6); set('triangles-variant-slider', 2);
          set('triangles-direction-select', 'up-left', 'change');
          set('quantum-phase', 0.375); window.quantumControls.pause();
          set('share-name', 'Frozen request');
          set('export-size-select', 'standard', 'change');
          window.__oldSVG = captureLogoExportSnapshot().svgSource;
          window.__mutateExportControls = () => {
            set('triangles-count-slider', 28); set('triangles-variant-slider', 1);
            set('triangles-direction-select', 'down-right', 'change');
            set('quantum-phase', 0.8); set('share-name', 'In-flight change');
            set('export-size-select', 'large', 'change');
            set('color-mode-select', 'white', 'change');
          };
        }, style);
      };
      await prepare();
      const baselineWaiting = page.waitForEvent('download');
      await page.evaluate(() => { void savePNG(); });
      const baseline = await fs.readFile(await (await baselineWaiting).path());
      await page.evaluate(() => {
        const original = Image.prototype.decode;
        let first = true;
        Image.prototype.decode = function (...args) {
          if (first && this.src.startsWith('blob:')) {
            first = false; window.__decodeReached = true;
            return new Promise(resolve => { window.__releaseExportDecode = resolve; })
              .then(() => original.apply(this, args));
          }
          return original.apply(this, args);
        };
      });
      const frozenWaiting = page.waitForEvent('download');
      await page.evaluate(() => { void savePNG(); });
      await page.waitForFunction(() => window.__decodeReached);
      await page.evaluate(() => { __mutateExportControls(); __releaseExportDecode(); });
      const frozenDownload = await frozenWaiting;
      const frozen = await fs.readFile(await frozenDownload.path());
      assert.match(frozenDownload.suggestedFilename(), /1000w.*frozen-request/i);
      assert.equal(frozen.readUInt32BE(16), 1160); assert.equal(frozen.readUInt32BE(20), 762);
      assert.deepEqual(frozen, baseline, `${style}: downloaded PNG changed after request-time capture`);
      assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource !== __oldSVG), true,
        'Controls really changed while the original PNG decode was pending');
      await prepare();
      const svgWaiting = page.waitForEvent('download');
      await page.evaluate(() => { void saveSVG(); __mutateExportControls(); });
      const svgDownload = await svgWaiting;
      const svg = await fs.readFile(await svgDownload.path(), 'utf8');
      assert.equal(svg, await page.evaluate(() => __oldSVG), `${style}: SVG changed after capture`);
      assert.match(svgDownload.suggestedFilename(), /frozen-request/i);
      console.log(`PASS ${style}: exact PNG bytes, size/name/ink/phase/variant frozen during decode; SVG frozen before asynchronous download`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
