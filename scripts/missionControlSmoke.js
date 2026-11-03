// Focused local browser regression. Run only in an environment where the
// selected Playwright engine is supported; do not change sandbox permissions.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8792';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MISSION_EVIDENCE || path.join(os.tmpdir(), 'rpi-mission-smoke');
const selectedCases = process.env.RPI_MISSION_CASES?.split(',');

async function ready(page) {
  await page.waitForFunction(() => window.barShareController && document.querySelector('[data-lunar-vector-preview] svg')
    && !window.PageEntrance?.isActive?.() && !document.querySelector('.theme_scan'));
}
async function theme(page, value) {
  await page.selectOption('#color-mode-select', value, { force: true });
  await page.waitForFunction(value => document.querySelector('#color-mode-select').value === value
    && !document.querySelector('.theme_scan'), value);
}
async function main() {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [];
  try {
    for (const reduce of [false, true]) for (const touch of [false, true]) for (const fallback of [false, true]) {
      const caseName = `${reduce ? 'reduced' : 'normal'}-${touch ? 'touch' : 'desktop'}-${fallback ? '2d' : 'gpu'}`;
      if (selectedCases && !selectedCases.includes(caseName)) continue;
      const context = await browser.newContext({ viewport: touch ? { width: 390, height: 664 } : { width: 1440, height: 900 },
        hasTouch: touch, isMobile: touch, reducedMotion: reduce ? 'reduce' : 'no-preference' });
      if (fallback) await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          return /webgl/.test(kind) ? null : original.call(this, kind, ...args);
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/lunar/?colorMode=lunar`); await ready(page);
      const renderer = await page.evaluate(() => {
        const gl = window._renderer.GL;
        return { liveCanvasUsesWebGL, contextClass: window._renderer.drawingContext.constructor.name,
          webglVersion: gl ? gl.getParameter(gl.VERSION) : null,
          renderer: gl ? gl.getParameter(gl.RENDERER) : null };
      });
      if (fallback) assert.equal(renderer.liveCanvasUsesWebGL, false);
      await page.reload(); await ready(page);
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        window.__missionPaints = 0;
        const original = clear;
        window.clear = function (...args) { window.__missionPaints++; return original.apply(this, args); };
        window.__missionVector = document.querySelector('[data-lunar-vector-preview] svg');
      });
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => __missionPaints), 0, 'Settled Artemis must not repaint each scheduler frame');
      if (touch) await page.locator('#mobile-menu-toggle').tap();
      for (const color of ['white', 'lunar', 'white', 'lunar']) {
        await theme(page, color);
        assert.equal(await page.evaluate(() => __missionVector === document.querySelector('[data-lunar-vector-preview] svg')), true);
        assert.equal(await page.evaluate(() => lunarCounterInterval !== 0), color === 'lunar' && !touch);
      }
      if (touch) await page.locator('#mobile-controls-close').tap();
      // The latest edit wins even when a scan is interrupted or canceled.
      await page.evaluate(() => {
        for (const value of ['black', 'white', 'lunar']) {
          colorModeSelect.value = value; handleColorModeChange();
        }
        window.ThemeMotion.cancel();
      });
      await ready(page);
      assert.equal(await page.inputValue('#color-mode-select'), 'lunar');
      assert.equal(await page.locator('.theme_scan').count(), 0);
      assert.equal(await page.evaluate(() => document.body.classList.contains('has-theme-snapshot')), false);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      assert.equal(await page.evaluate(() => lunarCounterInterval), 0);
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
      assert.equal(await page.evaluate(() => lunarCounterInterval !== 0), !touch);
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
      assert.equal(await page.evaluate(() => lunarCounterInterval), 0);
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      assert.equal(await page.evaluate(() => lunarCounterInterval !== 0), !touch);
      const shared = await page.evaluate(() => barShareController.buildLink());
      await theme(page, 'black');
      // Theme commits are immediate with reduced motion; URL serialization has
      // its separate documented 200 ms writer. Navigate only after that state is
      // actually in history, rather than asserting restoration of an old URL.
      await page.waitForFunction(() => {
        const mode = new URL(location.href).searchParams.get('colorMode');
        return mode === null || mode === 'black';
      });
      await page.goto(shared); await ready(page);
      assert.equal(await page.inputValue('#color-mode-select'), 'lunar');
      await page.goBack(); await ready(page);
      assert.equal(await page.inputValue('#color-mode-select'), 'black');
      await page.goForward(); await ready(page);
      assert.equal(await page.inputValue('#color-mode-select'), 'lunar');
      const toggle = page.locator('#lunar-counter-detail-toggle');
      if (!touch) {
        await toggle.focus(); await page.keyboard.press('Enter');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      } else assert.equal(await toggle.isVisible(), false, 'Existing compact layout hides the counter');
      assert.equal(await page.locator('#save-button').getAttribute('aria-label'), 'Open asset download menu');
      if (touch) await page.locator('#save-button').tap();
      else await page.locator('#save-button').click();
      assert.match(await page.locator('#save-menu').innerText(), /Download SVG/);
      assert.equal(await page.locator('#export-settings').isVisible(), true);
      assert.equal(await page.locator('#save-loop-gif').isVisible(), false);
      assert.equal(await page.locator('#artemis-information').count(), 1);
      await page.screenshot({ path: path.join(evidence, `${engine}-${caseName}-exports.png`) });
      if (touch) await page.locator('#save-button').tap();
      else await page.locator('#save-button').click();
      assert.equal(await page.locator('#save-button').getAttribute('aria-expanded'), 'false');
      await page.screenshot({ path: path.join(evidence, `${engine}-${touch ? 'touch' : 'desktop'}-${reduce ? 'reduced' : 'normal'}-${fallback ? '2d' : 'gpu'}.png`) });
      // Exercise actual captured PNG encoders independently of the UI checks.
      // These artifacts are not a user-facing download.
      const exports = await page.evaluate(async () => {
        const output = [];
        for (const mode of ['black', 'white', 'lunar']) {
          applyColorMode(mode);
          for (const size of ['standard', 'large']) {
            document.getElementById('export-size-select').value = size;
            const snapshot = captureLogoExportSnapshot();
            const blob = await createRasterExportBlob(snapshot, new AbortController().signal);
            const data = await blob.arrayBuffer();
            const bytes = new Uint8Array(data);
            const base64 = btoa(Array.from(bytes, value => String.fromCharCode(value)).join(''));
            setZoomLevel(4, { immediate: true });
            const zoomed = captureLogoExportSnapshot();
            if (zoomed.svgSource !== snapshot.svgSource) throw new Error('Zoom changed exported SVG');
            setZoomLevel(1, { immediate: true });
            const xml = new DOMParser().parseFromString(snapshot.svgSource, 'image/svg+xml');
            if (xml.querySelector('parsererror')) throw new Error('Invalid exported SVG');
            output.push({ mode, size, svg: snapshot.svgSource, png: base64, dimensions: snapshot.dimensions });
          }
        }
        applyColorMode('lunar');
        return output;
      });
      for (const artifact of exports) {
        const png = Buffer.from(artifact.png, 'base64');
        const expected = artifact.size === 'standard' ? [1160, 762] : [2320, 1524];
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], expected);
        assert.match(artifact.svg, /<path/); assert.doesNotMatch(artifact.svg, /<image\b/);
        const name = `${engine}-${touch ? 'touch' : 'desktop'}-${reduce ? 'reduced' : 'normal'}-${fallback ? '2d' : 'gpu'}-${artifact.mode}-${artifact.size}`;
        await fs.writeFile(path.join(evidence, `${name}.png`), png);
        await fs.writeFile(path.join(evidence, `${name}.svg`), artifact.svg);
      }
      const zoom = await page.evaluate(() => {
        const canvas = document.querySelector('#p5-container canvas');
        const svg = document.querySelector('[data-lunar-vector-preview] svg');
        const fitted = canvas.toDataURL();
        const fitTransform = svg.style.transform;
        setZoomLevel(4, { immediate: true });
        const zoomTransform = svg.style.transform;
        const zoomChanged = fitted !== canvas.toDataURL() && fitTransform !== zoomTransform;
        applyPanDragDelta(-24, 12);
        const panChanged = svg.style.transform !== zoomTransform;
        setZoomLevel(1, { immediate: true, resetPan: true });
        return { zoomChanged, panChanged, restoredFitPixels: fitted === canvas.toDataURL(),
          restoredFitTransform: svg.style.transform === fitTransform };
      });
      assert.ok(Object.values(zoom).every(Boolean), 'Live vector/canvas must follow zoom/pan and restore exact fitted artwork');
      let memory = null;
      if (engine === 'chromium' && !reduce && !touch && !fallback) {
        const session = await context.newCDPSession(page);
        await session.send('Performance.enable');
        const measure = async () => {
          await session.send('HeapProfiler.collectGarbage');
          return { counters: await session.send('Memory.getDOMCounters'),
            heapBytes: (await session.send('Performance.getMetrics')).metrics.find(item => item.name === 'JSHeapUsedSize').value };
        };
        const before = await measure();
        const rounds = [];
        for (let round = 0; round < 2; round++) {
          await page.evaluate(() => {
            const first = document.querySelector('[data-lunar-vector-preview] svg');
            for (let i = 0; i < 40; i++) applyColorMode(i % 2 ? 'lunar' : 'white');
            if (first !== document.querySelector('[data-lunar-vector-preview] svg')) throw new Error('Same-source lifecycle rebuilt the live SVG');
          });
          rounds.push(await measure());
        }
        assert.equal(rounds[0].counters.nodes, rounds[1].counters.nodes, 'Repeated recolors keep retained DOM bounded after GC');
        assert.equal(rounds[0].counters.jsEventListeners, rounds[1].counters.jsEventListeners, 'Repeated recolors must not add listeners');
        memory = { before, rounds, note: 'Forced-GC diagnostic on two 40-recolor rounds, not a proof of zero leaks or a portable heap budget.' };
      }
      assert.deepEqual(errors, []);
      results.push({ caseName, reduce, touch, fallback, renderer, zoom, memory, exports: exports.length });
      await fs.writeFile(path.join(evidence, `${engine}-${selectedCases ? 'selected-' : ''}results.json`), JSON.stringify({ engine,
        status: 'partial', browserVersion: browser.version(), platform: os.platform(), release: os.release(), results }, null, 2));
      console.log(`${engine}: reduce=${reduce} touch=${touch} fallback=${fallback} passed`);
      await context.close();
    }
    await fs.writeFile(path.join(evidence, `${engine}-${selectedCases ? 'selected-' : ''}results.json`), JSON.stringify({ engine,
      status: 'passed', browserVersion: browser.version(), platform: os.platform(), release: os.release(), results }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
