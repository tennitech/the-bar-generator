// Preparation/UI evidence only: native browser menus and saves need manual testing.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_EVIDENCE_DIR;
(async () => {
  const host = http.createServer((req, res) => {
    const params = new URL(req.url, 'http://fixture.test').searchParams;
    const clipboardAllowed = params.has('clipboard');
    if (!clipboardAllowed) res.setHeader('Permissions-Policy', 'clipboard-write=()');
    const path = params.get('style') || 'triangles';
    res.end(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Manual save sandbox fixture</title><style>body{margin:0}iframe{width:100vw;height:100vh;border:0}</style><iframe title="RPI generator" src="${base}/generator/${path}/" sandbox="allow-scripts allow-same-origin" ${clipboardAllowed ? 'allow="clipboard-write"' : ''}></iframe>`);
  });
  await new Promise(resolve => host.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${host.address().port}/`;
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } });
    await context.addInitScript(() => {
      window.__saveWrites = 0; window.__createdURLs = []; window.__revokedURLs = [];
      const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = blob => { const url = create(blob); __createdURLs.push(url); return url; };
      URL.revokeObjectURL = url => { __revokedURLs.push(url); return revoke(url); };
      if (navigator.clipboard) navigator.clipboard.write = () => { __saveWrites++; return Promise.reject(new Error('No clipboard writes in this test')); };
      document.addEventListener('contextmenu', event => { window.__lastContextMenu = { id: event.target.id, prevented: event.defaultPrevented }; });
    });
    const page = await context.newPage();
    const errors = []; let downloads = 0, popups = 0;
    page.on('pageerror', error => errors.push(error.stack || error.message));
    page.on('download', () => { downloads++; }); page.on('popup', () => { popups++; });
    async function embeddedFrame(page) {
      const element = await page.locator('iframe').elementHandle();
      const frame = await element.contentFrame();
      assert(frame, 'fixture iframe is attached');
      await frame.waitForURL(url => url.href.startsWith(base));
      return frame;
    }
    async function load(style = 'triangles') {
      await page.goto(`${url}?style=${style}`);
      const frame = await embeddedFrame(page);
      await frame.waitForFunction(() => window.manualSavePreview && window.barShareController && document.querySelector('#p5-container canvas'));
      return frame;
    }
    async function open(frame, format = 'svg') {
      await frame.locator('#save-button').click();
      await frame.locator(`#save-${format}`).click();
      await frame.locator('#save-preview-dialog').waitFor({ state: 'visible' });
      await frame.waitForFunction(() => !logoExportUI.isBusy());
      assert.equal(await frame.locator('#save-menu').isVisible(), false);
      assert.equal(await frame.evaluate(() => document.activeElement.id), 'save-preview-title');
    }
    let frame = await load();
    const expected = await frame.evaluate(() => captureLogoExportSnapshot().svgSource);
    await open(frame);
    assert.equal(await frame.evaluate(() => fetch(document.getElementById('save-preview-image').src).then(r => r.text())), expected);
    assert.match(await frame.locator('#save-preview-filename').inputValue(), /\.svg$/);
    await frame.locator('#save-preview-image').click({ button: 'right' });
    assert.deepEqual(await frame.evaluate(() => __lastContextMenu), { id: 'save-preview-image', prevented: false });
    assert.equal(await frame.evaluate(() => __revokedURLs.includes(document.getElementById('save-preview-image').src)), false);
    results.push('genuine original SVG image resource; native context menu not intercepted; live URL retained');
    if (evidence) await page.screenshot({ path: `${evidence}/${engine}-desktop-svg.png` });

    // Keep one captured design and raster size while the underlying controls change.
    await frame.evaluate(() => {
      document.getElementById('triangles-count-slider').value = '30';
      document.getElementById('triangles-count-slider').dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('export-size-select').value = 'large';
    });
    await frame.locator('#save-preview-png').click();
    await frame.waitForFunction(() => document.getElementById('save-preview-png').getAttribute('aria-pressed') === 'true');
    const png = await frame.evaluate(async () => {
      const image = document.getElementById('save-preview-image'), blob = await (await fetch(image.src)).blob();
      const bytes = [...new Uint8Array(await blob.arrayBuffer()).slice(0, 24)];
      const c = document.createElement('canvas'); c.width = image.naturalWidth; c.height = image.naturalHeight;
      const ctx = c.getContext('2d'); ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
      let transparent = 0, partial = 0, opaque = 0;
      for (let i = 3; i < pixels.length; i += 4) { if (!pixels[i]) transparent++; else if (pixels[i] === 255) opaque++; else partial++; }
      return { type: blob.type, width: image.naturalWidth, height: image.naturalHeight, bytes, transparent, partial, opaque };
    });
    assert.equal(png.type, 'image/png'); assert.equal(png.width, 1160); assert.equal(png.height, 762);
    assert.equal(Buffer.from(png.bytes).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert(png.transparent > 0 && png.partial > 0 && png.opaque > 0);
    await frame.locator('#save-preview-svg').click();
    await frame.waitForFunction(() => document.getElementById('save-preview-svg').getAttribute('aria-pressed') === 'true');
    assert.equal(await frame.evaluate(() => fetch(document.getElementById('save-preview-image').src).then(r => r.text())), expected);
    assert.notEqual(await frame.evaluate(() => captureLogoExportSnapshot().svgSource), expected);
    results.push('SVG/PNG switching preserves exact captured design, standard dimensions and smooth transparency');

    // A later format choice wins; closing pending work cannot reopen the dialog.
    await frame.evaluate(() => {
      window.__originalRaster = createRasterExportBlob;
      createRasterExportBlob = (...args) => new Promise(resolve => { window.__releaseRaster = () => resolve(__originalRaster(...args)); });
    });
    await frame.locator('#save-preview-png').click();
    await frame.waitForFunction(() => window.__releaseRaster);
    await frame.locator('#save-preview-svg').click();
    await frame.evaluate(() => __releaseRaster());
    await frame.waitForFunction(() => document.getElementById('save-preview-stage').getAttribute('aria-busy') === 'false');
    assert.equal(await frame.locator('#save-preview-svg').getAttribute('aria-pressed'), 'true');
    await frame.evaluate(() => { createRasterExportBlob = __originalRaster; });
    await frame.locator('#save-preview-help').evaluate(element => { element.open = true; });
    assert.match(await frame.locator('#save-preview-help').innerText(), /cannot confirm/);
    const activeURL = await frame.locator('#save-preview-image').getAttribute('src');
    await page.keyboard.press('Escape');
    assert.equal(await frame.locator('#save-preview-dialog').isVisible(), false);
    assert.equal(await frame.evaluate(() => document.activeElement.id), 'save-button');
    assert.equal(await frame.evaluate(url => __revokedURLs.includes(url), activeURL), true);
    results.push('latest format wins; Escape closes, restores focus and releases resources');

    // Preparation failure leaves an accurate usable image and an in-place retry.
    await open(frame);
    await frame.evaluate(() => { createRasterExportBlob = () => Promise.reject(new Error('Fixture PNG failure')); });
    await frame.locator('#save-preview-png').click();
    await frame.locator('#save-preview-error').waitFor({ state: 'visible' });
    assert.equal(await frame.locator('#save-preview-svg').getAttribute('aria-pressed'), 'true');
    await frame.evaluate(() => { createRasterExportBlob = __originalRaster; });
    await frame.locator('#save-preview-retry').click();
    await frame.waitForFunction(() => document.getElementById('save-preview-png').getAttribute('aria-pressed') === 'true');
    assert.equal(await frame.locator('#save-preview-error').isVisible(), false);
    await frame.locator('#save-preview-done').click();
    results.push('format preparation failure preserves current asset; in-page retry succeeds');

    // Initial preparation cancellation must not open an unwanted late panel.
    await frame.evaluate(() => {
      window.__originalDecode = Image.prototype.decode;
      Image.prototype.decode = function (...args) {
        if (!this.src.startsWith('blob:')) return __originalDecode.apply(this, args);
        return new Promise(resolve => { window.__releaseDecode = () => resolve(__originalDecode.apply(this, args)); });
      };
    });
    await frame.locator('#save-button').click(); await frame.locator('#save-svg').click();
    await frame.waitForFunction(() => window.__releaseDecode);
    await page.keyboard.press('Escape');
    await frame.waitForFunction(() => !logoExportUI.isBusy());
    await frame.evaluate(() => { Image.prototype.decode = __originalDecode; __releaseDecode(); });
    assert.equal(await frame.locator('#save-preview-dialog').isVisible(), false);
    results.push('dismissal cancels initial preparation without late modal');

    for (const event of ['popstate', 'pagehide']) {
      await frame.evaluate(() => {
        Image.prototype.decode = function (...args) {
          if (!this.src.startsWith('blob:')) return __originalDecode.apply(this, args);
          return new Promise(resolve => { window.__releaseNavigationDecode = () => resolve(__originalDecode.apply(this, args)); });
        };
      });
      await frame.locator('#save-button').click(); await frame.locator('#save-svg').click();
      await frame.waitForFunction(() => window.__releaseNavigationDecode);
      await frame.evaluate(event => dispatchEvent(new Event(event)), event);
      await frame.waitForFunction(() => !logoExportUI.isBusy());
      await frame.evaluate(() => { Image.prototype.decode = __originalDecode; __releaseNavigationDecode(); delete window.__releaseNavigationDecode; });
      assert.equal(await frame.locator('#save-preview-dialog').isVisible(), false);
    }
    results.push('Back/pagehide cancel pending preparation; no stale modal reopens');

    for (const theme of ['black', 'white', 'red']) {
      await frame.evaluate(theme => {
        const control = document.getElementById('color-mode-select'); control.value = theme;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }, theme);
      await open(frame);
      assert.equal(await frame.locator('#save-preview-stage').evaluate(el => el.classList.contains('is-dark')), theme === 'white');
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-${theme}.png` });
      await frame.locator('#save-preview-done').click();
    }
    results.push('black/white/red themes use contrasting preview backgrounds without altering artwork');

    await frame.evaluate(() => { const control = document.getElementById('color-mode-select'); control.value = 'black'; control.dispatchEvent(new Event('change', { bubbles: true })); });
    await open(frame);
    for (const [width, height] of [[320, 700], [390, 844], [740, 360], [1440, 950]]) {
      await page.setViewportSize({ width, height });
      const dialog = await frame.locator('#save-preview-dialog').boundingBox();
      assert(dialog.x >= 0 && dialog.x + dialog.width <= width + 1);
      assert(dialog.y >= 0 && dialog.y + dialog.height <= height + 1);
      assert.equal(await frame.locator('#save-preview-dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
      await frame.locator('#save-preview-done').scrollIntoViewIfNeeded();
      const done = await frame.locator('#save-preview-done').boundingBox();
      assert(done.height >= 44);
      assert.equal(await frame.evaluate(() => getComputedStyle(document.getElementById('save-preview-dialog')).animationName), 'none');
      await frame.locator('#save-preview-dialog').evaluate(el => { el.scrollTop = 0; });
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-layout-${width}x${height}.png` });
    }
    await frame.locator('#save-preview-close').click();
    assert.equal(await frame.evaluate(() => __saveWrites), 0);
    assert.equal(downloads, 0); assert.equal(popups, 0);
    results.push('320/390px and short landscape layouts, reduced motion, no automatic downloads/clipboard writes/popups');

    // Large PNG uses the selected original raster size, never a screenshot.
    await frame.evaluate(() => { document.getElementById('export-size-select').value = 'large'; });
    await open(frame, 'png');
    assert.deepEqual(await frame.locator('#save-preview-image').evaluate(image => [image.naturalWidth, image.naturalHeight]), [2320, 1524]);
    const inside = await frame.evaluate(() => {
      document.getElementById('save-button').focus();
      return document.getElementById('save-preview-dialog').contains(document.activeElement);
    });
    assert.equal(inside, true, 'modal keeps background controls inert');
    await frame.locator('#save-preview-done').click();
    results.push('Large PNG preserves 2320 × 1524 source pixels; native modal makes background inert');

    const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const phone = await phoneContext.newPage(); await phone.goto(url);
    const phoneFrame = await embeddedFrame(phone);
    await phoneFrame.waitForFunction(() => window.manualSavePreview && window.logoExportUI && document.querySelector('#p5-container canvas'));
    assert.equal(await phoneFrame.evaluate(() => innerWidth), 390, 'touch fixture has a real narrow layout viewport');
    await phoneFrame.locator('#save-button').tap(); await phoneFrame.locator('#save-png').tap();
    await phoneFrame.locator('#save-preview-dialog').waitFor({ state: 'visible' });
    assert.match(await phoneFrame.locator('#save-preview-gesture').innerText(), /Touch and hold/);
    assert.match(await phoneFrame.locator('#save-preview-menu-action').innerText(), /image save option/);
    // A pointer gesture in the modal must not dismiss background compact controls.
    await phoneFrame.evaluate(() => document.getElementById('app-sidebar').classList.add('active'));
    await phoneFrame.locator('#save-preview-background').tap();
    assert.equal(await phoneFrame.locator('#app-sidebar').evaluate(el => el.classList.contains('active')), true);
    await phoneFrame.evaluate(() => document.getElementById('app-sidebar').classList.remove('active'));
    await phoneFrame.locator('#save-preview-background').tap();
    if (evidence) await phone.screenshot({ path: `${evidence}/${engine}-phone-touch.png` });
    await phoneFrame.locator('#save-preview-close').tap(); await phoneContext.close();
    results.push('touch context receives long-press guidance; modal gestures leave background controls unchanged; native save support remains unverified');

    // Clipboard work is already dispatched and must not be cancelled with preview preparation.
    await page.goto(`${url}?clipboard=allowed`);
    const copyFrame = await embeddedFrame(page);
    await copyFrame.waitForFunction(() => window.logoClipboard && window.logoExportUI && document.querySelector('#p5-container canvas'));
    await copyFrame.evaluate(() => {
      navigator.clipboard.write = async items => { await items[0].getType('image/png'); };
      const raster = createRasterExportBlob;
      createRasterExportBlob = (...args) => new Promise(resolve => {
        window.__copySignal = args[1]; window.__releaseCopy = () => resolve(raster(...args));
      });
    });
    await copyFrame.locator('#save-button').click(); await copyFrame.locator('#copy-png').click();
    await copyFrame.waitForFunction(() => window.__releaseCopy);
    await page.keyboard.press('Escape');
    await copyFrame.evaluate(() => dispatchEvent(new Event('popstate')));
    assert.equal(await copyFrame.evaluate(() => __copySignal.aborted), false);
    await copyFrame.evaluate(() => __releaseCopy());
    await copyFrame.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await copyFrame.locator('#export-message').textContent(), /PNG copied/);
    results.push('permitted clipboard adapter preparation survives menu dismissal and unrelated navigation');

    // Standalone keeps its original real download flow.
    const standalone = await context.newPage();
    await standalone.goto(`${base}/generator/triangles/`);
    await standalone.waitForFunction(() => window.manualSavePreview && window.logoExportUI && typeof captureLogoExportSnapshot === 'function');
    assert.equal(await standalone.evaluate(() => manualSavePreview.enabled('svg')), false);
    assert.equal(await standalone.evaluate(() => { const control = document.getElementById('save-button'); control.blur(); const before = document.activeElement; dispatchEvent(new Event('popstate')); return document.activeElement === before; }), true, 'unrelated navigation does not steal standalone focus');
    const download = standalone.waitForEvent('download');
    await standalone.locator('#save-button').click(); await standalone.locator('#save-svg').click();
    assert.match(await fs.readFile(await (await download).path(), 'utf8'), /<svg\b/);
    results.push('standalone SVG download remains native and unchanged');
    assert.deepEqual(errors, []);
    if (evidence) await fs.writeFile(`${evidence}/${engine}-results.json`, JSON.stringify(results, null, 2));
    console.log(`PASS ${engine}: ${results.join('; ')}`);
  } finally { await browser.close(); await new Promise(resolve => host.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
