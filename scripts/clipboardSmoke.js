// Chromium's headless shell uses ClipboardNonBacked, isolated from the user's
// pasteboard. Only read payloads after our own copy succeeds. WebKit uses a
// test clipboard adapter here; it must not touch the Mac's system pasteboard.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:4322';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 }, hasTouch: true });
    if (engine === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
    const page = await context.newPage();
    if (engine === 'webkit') await page.addInitScript(() => {
      window.__testClipboard = [];
      Object.defineProperty(navigator, 'clipboard', { value: {
        write: async items => { window.__testClipboard = await Promise.all(items.map(async item => {
          const data = {}; for (const type of item.types) data[type] = await item.getType(type); return data;
        })); },
        writeText: async text => { window.__testSource = text; window.__testClipboard = [{ 'text/plain': new Blob([text], { type: 'text/plain' }) }]; }
      } });
    });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/generator/triangles/`);
    await page.waitForFunction(() => window.barShareController && typeof captureLogoExportSnapshot === 'function');
    await page.evaluate(() => { window.__originalSupports = ClipboardItem.supports; });
    const open = async () => {
      if (await page.locator('#save-menu').evaluate(e => e.classList.contains('hidden'))) await page.locator('#save-button').click();
    };
    const set = (id, value) => page.evaluate(({ id, value }) => {
      const e = document.getElementById(id); e.value = value; e.dispatchEvent(new Event(id.includes('select') ? 'change' : 'input', { bubbles: true }));
    }, { id, value });
    const read = format => page.evaluate(async ({ engine, format }) => {
      const mime = `image/${format === 'svg' ? 'svg+xml' : format}`;
      let blob, types;
      if (engine === 'webkit') { types = Object.keys(window.__testClipboard[0]); blob = window.__testClipboard[0][mime]; }
      else { const [item] = await navigator.clipboard.read(); types = item.types; if (!types.includes(mime)) throw Error(JSON.stringify({ types, message: document.getElementById('export-message').textContent })); blob = await item.getType(mime); }
      if (format === 'svg') return { types, type: blob.type, source: await blob.text() };
      const image = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = image.width; c.height = image.height;
      const ctx = c.getContext('2d'); ctx.drawImage(image, 0, 0); image.close();
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let partial = 0, ink = 0, firstInk, hash = 2166136261;
      for (const byte of data) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
      for (let i = 0; i < data.length; i += 4) { if (data[i + 3] > 0 && data[i + 3] < 255) partial++; if (data[i + 3] > 250) { ink++; if (!firstInk) firstInk = [...data.slice(i, i + 4)]; } }
      return { types, type: blob.type, width: c.width, height: c.height, corner: [...data.slice(0, 4)], partial, ink, firstInk, pixelHash: hash };
    }, { engine, format });
    assert.deepEqual(await page.locator('#clipboard-actions button').evaluateAll(nodes => nodes.map(node => node.id)), ['copy-svg', 'copy-png']);
    const caps = await page.evaluate(() => ({ svg: logoClipboard.native('image/svg+xml') }));
    for (const size of ['standard', 'large']) for (const theme of ['black', 'white', 'red']) {
      await set('export-size-select', size); await set('color-mode-select', theme); await open();
      await page.locator('#copy-png').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
      const result = await read('png');
      assert.deepEqual(result.types, ['image/png']); assert.equal(result.type, 'image/png');
      assert.equal(result.width, size === 'large' ? 2320 : 1160); assert.equal(result.height, size === 'large' ? 1524 : 762);
      assert.equal(result.corner[3], 0); assert(result.partial > 0); assert(result.ink > 10000); assert.deepEqual(result.firstInk.slice(0, 3), { black: [0, 0, 0], white: [255, 255, 255], red: [214, 0, 28] }[theme]);
      results.push({ size, theme, ...result });
    }
    if (caps.svg) {
      await page.evaluate(() => { window.__expectedSVG = captureLogoExportSnapshot().svgSource; });
      await open(); await page.locator('#copy-svg').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
      assert.match(await page.locator('#export-message').innerText(), /For Finder, use Download SVG/);
      const result = await read('svg'); assert.deepEqual(result.types, ['image/svg+xml'], 'native SVG has no plain-text or HTML alternative');
      const parity = await page.evaluate(source => {
        const parse = text => new DOMParser().parseFromString(text, 'image/svg+xml');
        const paths = doc => [...doc.querySelectorAll('path, polygon, rect')].map(e => [e.tagName, ...[...e.attributes].map(a => `${a.name}=${a.value}`).sort()]);
        return JSON.stringify(paths(parse(source))) === JSON.stringify(paths(parse(window.__expectedSVG)));
      }, result.source); assert(parity, 'native SVG preserves the selected vector geometry'); assert(result.source.includes('<path'));
      assert(!result.source.includes('<image')); assert(result.source.includes('polygon')); results.push({ nativeSVG: result.type });
      if (engine === 'chromium') {
        // Observe a receiving browser's normal paste event too. This still
        // does not prove a native application's SVG import behavior.
        const receiver = await context.newPage();
        try {
          await receiver.goto(`${base}/references/clipboard_exports.md`);
          await receiver.setContent('<div id="receiver" contenteditable>Paste</div><script>document.addEventListener("paste", event => { event.preventDefault(); window.__received = { types: [...event.clipboardData.types], plain: event.clipboardData.getData("text/plain"), html: event.clipboardData.getData("text/html"), files: event.clipboardData.files.length }; });</script>');
          await receiver.locator('#receiver').focus(); await receiver.keyboard.press('ControlOrMeta+V');
          await receiver.waitForFunction(() => window.__received);
          const received = await receiver.evaluate(() => window.__received);
          assert.deepEqual(received, { types: ['image/svg+xml'], plain: '', html: '', files: 0 });
          results.push({ browserPasteEvent: received });
        } finally { await receiver.close(); await page.bringToFront(); }
      }
    }
    // Force the explicit source fallback, while retaining the real Chromium text write.
    await page.evaluate(() => {
      const original = ClipboardItem.supports.bind(ClipboardItem);
      ClipboardItem.supports = mime => mime === 'image/svg+xml' ? false : original(mime);
      logoClipboard.sync();
    });
    await open(); assert.match(await page.locator('#copy-svg').innerText(), /Copy SVG source \(text\)/);
    await page.locator('#copy-svg').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await page.locator('#export-message').innerText(), /SVG source text copied.*Finder file/);
    const source = await page.evaluate(async engine => engine === 'webkit' ? window.__testSource : navigator.clipboard.readText(), engine);
    assert(source.includes('<svg')); assert(source.includes('<polygon'));
    const sourceTypes = await page.evaluate(async engine => engine === 'webkit' ? Object.keys(window.__testClipboard[0]) : (await navigator.clipboard.read())[0].types, engine);
    assert.deepEqual(sourceTypes, ['text/plain'], 'source action explicitly copies text, not an SVG image');
    results.push({ sourceFallback: true, types: sourceTypes });
    // File recovery is a genuine vector download, not a clipboard file promise.
    await open();
    assert.match(await page.locator('#save-svg').innerText(), /Download SVG/);
    const waitingSVG = page.waitForEvent('download'); await page.locator('#save-svg').click();
    const file = await waitingSVG, vector = await fs.readFile(await file.path(), 'utf8');
    assert.match(file.suggestedFilename(), /\.svg$/); assert(vector.includes('<path')); assert(vector.includes('<polygon')); assert(!vector.includes('<image'));
    results.push({ vectorFileRecovery: file.suggestedFilename() });
    // Capture an actual asynchronous PNG while controls change and reject duplicates.
    await set('color-mode-select', 'black'); await set('export-size-select', 'standard');
    await page.evaluate(() => {
      const decode = Image.prototype.decode;
      Image.prototype.decode = async function () { await new Promise(r => setTimeout(r, 100)); return decode.call(this); };
      window.__copyPromise = logoClipboard.copy('png'); window.__duplicate = logoClipboard.copy('png');
      document.getElementById('color-mode-select').value = 'white'; document.getElementById('color-mode-select').dispatchEvent(new Event('change'));
      document.getElementById('export-size-select').value = 'large';
      const count = document.getElementById('triangles-count-slider'); count.value = 28; count.dispatchEvent(new Event('input'));
    });
    await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.equal(await page.evaluate(() => window.__duplicate), null);
    const frozen = await read('png'); assert.equal(frozen.width, 1160); assert.deepEqual(frozen.firstInk.slice(0, 3), [0, 0, 0]); assert.equal(frozen.pixelHash, results[0].pixelHash, 'clipboard image retains the frozen triangle geometry'); results.push({ frozenSnapshot: true });
    // Denial and retry are UI tests, deliberately injected after native payload checks.
    await page.evaluate(() => {
      window.__write = navigator.clipboard.write.bind(navigator.clipboard);
      navigator.clipboard.write = () => Promise.reject(new DOMException('Test denial', 'NotAllowedError'));
    });
    await open(); await page.locator('#copy-png').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await page.locator('#export-message').innerText(), /Copy was blocked/);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'copy-png');
    await page.evaluate(() => { navigator.clipboard.write = window.__write; });
    await page.locator('#copy-png').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
    // Fail the real encoder, rather than mocking a successful clipboard write.
    await page.evaluate(() => { window.__toBlob = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (callback) { callback(null); }; });
    await open(); await page.locator('#copy-png').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await page.locator('#export-message').innerText(), /Copy failed/);
    await page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = window.__toBlob; });
    // Insecure and missing image-write APIs recover without requesting permissions.
    await page.evaluate(() => { Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true }); });
    await open(); await page.locator('#copy-png').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await page.locator('#export-message').innerText(), /HTTPS/);
    await page.evaluate(() => { Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true }); navigator.clipboard.write = undefined; logoClipboard.sync(); });
    await open(); await page.locator('#copy-png').click(); await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await page.locator('#export-message').innerText(), /unavailable/);
    await page.evaluate(() => { navigator.clipboard.write = window.__write; ClipboardItem.supports = window.__originalSupports; logoClipboard.sync(); document.getElementById('toast-container').replaceChildren(); document.getElementById('export-progress').hidden = true; });
    await page.setViewportSize({ width: 390, height: 844 }); await open();
    await page.locator('#copy-png').tap(); await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await page.locator('#export-message').innerText(), /PNG image copied/); await open();
    await page.locator('#copy-svg').focus(); await page.keyboard.press('Enter'); await page.waitForFunction(() => !logoExportUI.isBusy());
    await open();
    await page.evaluate(() => { document.getElementById('toast-container').replaceChildren(); document.getElementById('export-progress').hidden = true; });
    for (const id of ['copy-svg', 'copy-png']) {
      const box = await page.locator(`#${id}`).boundingBox(); assert(box.height >= 44); assert(box.x >= 0); assert(box.x + box.width <= 390);
    }
    await fs.mkdir('/tmp/bar-clipboard-evidence', { recursive: true });
    await page.screenshot({ path: `/tmp/bar-clipboard-evidence/${engine}-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(350); await open();
    await page.screenshot({ path: `/tmp/bar-clipboard-evidence/${engine}-desktop.png` });
    await fs.writeFile(`/tmp/bar-clipboard-evidence/${engine}-results.json`, JSON.stringify({ engine, caps, results }, null, 2));
    assert.deepEqual(errors, []); console.log(JSON.stringify({ engine, clipboard: engine === 'chromium' ? 'native headless isolated' : 'test adapter', caps, results }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
