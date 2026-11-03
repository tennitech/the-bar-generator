// Decode/fetch diagnostics, intentionally separate from UI/render profiling.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8792';
const evidence = process.env.RPI_MISSION_EVIDENCE || path.join(os.tmpdir(), 'rpi-mission-backdrop');
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  try {
    await fs.mkdir(evidence, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const requests = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/lunar-canvas-backdrop/.test(request.url())) requests.push(request.url().split('/').pop()); });
    await page.goto(`${base}/generator/lunar/?colorMode=lunar`);
    await page.waitForFunction(() => document.querySelector('[data-lunar-vector-preview] svg') && !window.PageEntrance?.isActive?.());
    const initialCSSRequests = [...requests];
    const result = await page.evaluate(async () => {
      const gl = window._renderer.GL;
      const renderer = { liveCanvasUsesWebGL, contextClass: window._renderer.drawingContext.constructor.name,
        webglVersion: gl ? gl.getParameter(gl.VERSION) : null, renderer: gl ? gl.getParameter(gl.RENDERER) : null };
      const css = getComputedStyle(document.querySelector('.logo-container'), '::after').backgroundImage;
      const timings = [];
      let reference;
      let differences = 0;
      for (let run = 0; run < 3; run++) for (const format of run % 2 ? ['webp', 'png'] : ['png', 'webp']) {
        const start = performance.now();
        const response = await fetch(`assets/images/lunar-canvas-backdrop.${format}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Backdrop request ${response.status}`);
        const blob = await response.blob();
        const fetched = performance.now();
        const url = URL.createObjectURL(blob);
        const image = new Image();
        const canvas = document.createElement('canvas');
        try {
          image.src = url;
          await image.decode();
          const decoded = performance.now();
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const read = performance.now();
          if (!reference) reference = pixels;
          else for (let i = 0; i < pixels.length; i++) if (pixels[i] !== reference[i]) differences++;
          timings.push({ run, format, fileBytes: blob.size, width: image.naturalWidth, height: image.naturalHeight,
            fetchBodyMs: fetched - start, decodeMs: decoded - fetched, drawReadMs: read - decoded });
        } finally {
          URL.revokeObjectURL(url); image.src = ''; canvas.width = 0; canvas.height = 0;
        }
      }
      return { css, renderer, pixelChannelDifferences: differences, timings };
    });
    assert.equal(result.pixelChannelDifferences, 0, 'PNG/WebP decoded RGBA differs');
    assert.ok(result.timings.every(item => item.width === 2048 && item.height === 2592));
    assert.deepEqual(initialCSSRequests, ['lunar-canvas-backdrop.webp'], 'Modern CSS should select WebP only on route entry');
    assert.deepEqual(errors, []);
    // Prove the transport change does not alter final composed screenshot pixels.
    const logo = page.locator('.logo-container');
    await logo.screenshot({ path: path.join(evidence, `${engine}-webp-surface.png`) });
    await page.addStyleTag({ content: 'body.theme-lunar .logo-container::after { background-image: url("assets/images/lunar-canvas-backdrop.png") !important; }' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await logo.screenshot({ path: path.join(evidence, `${engine}-png-surface.png`) });
    await fs.writeFile(path.join(evidence, `${engine}-backdrop.json`), JSON.stringify({ engine,
      browserVersion: browser.version(), platform: os.platform(), osRelease: os.release(), initialCSSRequests, requests, ...result }, null, 2));
    console.log(JSON.stringify({ engine, browserVersion: browser.version(), ...result }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
