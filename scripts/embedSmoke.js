// Real cross-origin iframe policies. No production host permissions are changed.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_EVIDENCE_DIR;
(async () => {
  const host = http.createServer((req, res) => {
    const mode = new URL(req.url, 'http://fixture.test').searchParams.get('mode');
    const allowed = mode === 'allowed';
    if (mode === 'header-denied') res.setHeader('Permissions-Policy', 'clipboard-write=()');
    const sandbox = `allow-scripts allow-same-origin${allowed ? ' allow-downloads' : ''}`;
    res.end(`<!doctype html><title>Embedding test host</title><style>body{margin:0}iframe{width:100vw;height:100vh;border:0}</style><iframe title="RPI generator" src="${base}/generator/triangles/" sandbox="${sandbox}" ${allowed || mode === 'header-denied' ? 'allow="clipboard-write"' : ''}></iframe>`);
  });
  await new Promise(resolve => host.listen(0, '127.0.0.1', resolve));
  const hostURL = `http://127.0.0.1:${host.address().port}/`;
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    if (engine === 'chromium') await context.grantPermissions(['clipboard-write']);
    else await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { write: async items => {
        window.__copiedType = items[0].types[0];
        window.__copiedBytes = (await items[0].getType(window.__copiedType)).size;
      } } });
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let popups = 0; page.on('popup', () => { popups++; });
    async function open(mode) {
      await page.goto(`${hostURL}?mode=${mode}`);
      await page.bringToFront();
      const frame = page.frames().find(frame => frame.url().startsWith(base));
      assert(frame, 'cross-origin child loaded');
      await frame.waitForFunction(() => window.barShareController && window.logoClipboard && document.querySelector('#p5-container canvas'));
      assert.equal(await frame.locator('#share-button, #share-popover, #share-name, #share-copy').count(), 0);
      await frame.locator('#save-button').click();
      assert.equal(await frame.locator('#export-open-standalone, #export-embed-help, #save-menu a[target="_blank"]').count(), 0);
      return frame;
    }
    let frame = await open('blocked');
    if (engine === 'chromium') {
      assert.equal(await frame.evaluate(() => embedSupport.clipboardBlocked()), true);
      assert.equal(await frame.locator('#copy-png').isDisabled(), true);
      assert.match(await frame.locator('#copy-png').innerText(), /embedding permissions/);
    }
    let downloads = 0; const countDownload = () => { downloads++; }; page.on('download', countDownload);
    await frame.locator('#save-svg').click();
    await frame.waitForFunction(() => !logoExportUI.isBusy());
    await page.waitForTimeout(500);
    assert.equal(downloads, 0, 'host sandbox rejects download');
    assert.match(await frame.locator('#export-message').textContent(), /download requested/);
    assert.equal(await frame.locator('#save-menu').isVisible(), true, 'request feedback stays accessible');
    assert.doesNotMatch(await frame.locator('#save-menu').innerText(), /new tab|open this design separately/i);
    page.off('download', countDownload);
    results.push('blocked download + policy-aware copy + same-page request feedback');

    frame = await open('allowed');
    assert.equal(await frame.locator('#copy-png').isDisabled(), false);
    for (const format of ['svg', 'png']) {
      const waiting = page.waitForEvent('download');
      await frame.locator(`#save-${format}`).click();
      const bytes = await fs.readFile(await (await waiting).path());
      if (format === 'svg') assert.match(bytes.toString(), /<svg\b/);
      else assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      await frame.waitForFunction(() => !logoExportUI.isBusy());
    }
    await frame.locator('#copy-png').click();
    await frame.waitForFunction(() => !logoExportUI.isBusy());
    const copyMessage = await frame.locator('#export-message').textContent();
    assert.match(copyMessage, /PNG copied/);
    if (engine === 'webkit') assert((await frame.evaluate(() => __copiedBytes)) > 0);
    results.push(`allowed iframe SVG/PNG downloads + ${engine === 'chromium' ? 'native' : 'adapter'} PNG copy`);
    if (await frame.evaluate(() => logoClipboard.mode('svg') === 'image')) {
      await frame.locator('#save-button').click();
      await frame.locator('#copy-svg').click();
      await frame.waitForFunction(() => !logoExportUI.isBusy());
      assert.match(await frame.locator('#export-message').textContent(), /SVG copied/);
      results.push(`${engine === 'chromium' ? 'native' : 'adapter'} SVG copy in the permitted iframe`);
    } else {
      assert.equal(await frame.locator('#copy-svg').isDisabled(), true);
      results.push('unsupported native SVG remains disabled');
    }

    // A clipboard denial keeps the controls available for an in-page retry.
    await frame.evaluate(() => {
      window.__originalWrite = navigator.clipboard.write;
      navigator.clipboard.write = () => Promise.reject(new DOMException('Fixture denial', 'NotAllowedError'));
    });
    await frame.locator('#save-button').click();
    await frame.locator('#copy-png').click();
    await frame.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await frame.locator('#export-message').textContent(), /brand portal/);
    assert.equal(await frame.locator('#save-menu').isVisible(), true);
    assert.doesNotMatch(await frame.locator('#export-message').innerText(), /new tab/i);
    await frame.evaluate(() => { navigator.clipboard.write = __originalWrite; });
    await frame.locator('#copy-png').click();
    await frame.waitForFunction(() => !logoExportUI.isBusy());
    assert.match(await frame.locator('#export-message').textContent(), /PNG copied/);
    results.push('clipboard rejection and in-page retry');

    await frame.evaluate(() => {
      const style = document.getElementById('style-select');
      style.value = 'ruler'; style.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await frame.locator('#save-button').click();
    const gifWaiting = page.waitForEvent('download');
    await frame.locator('#save-loop-gif').click();
    const gif = await fs.readFile(await (await gifWaiting).path());
    assert.match(gif.subarray(0, 6).toString(), /^GIF8[79]a$/);
    assert.equal(gif.readUInt16LE(6), 1160); assert.equal(gif.readUInt16LE(8), 762);
    await frame.waitForFunction(() => !logoExportUI.isBusy());
    results.push('allowed iframe native transparent GIF download');

    if (engine === 'chromium') {
      frame = await open('header-denied');
      assert.equal(await frame.locator('#copy-png').isDisabled(), true, 'ancestor HTTP policy overrides iframe allow');
      results.push('ancestor header denial overrides iframe delegation');
    }
    frame = await open('blocked');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 700 });
      await frame.locator('#copy-png').scrollIntoViewIfNeeded();
      const bounds = await frame.locator('#copy-png').boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
      assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-embed-${width}.png` });
    }
    await page.keyboard.press('Escape');
    assert.equal(await frame.locator('#save-menu').isVisible(), false);
    assert.equal(await frame.evaluate(() => document.activeElement.id), 'save-button');
    results.push('320/390/1440px same-page menu layout and iframe Escape focus');
    assert.equal(popups, 0, 'exports never open another tab');
    assert.deepEqual(errors, []);
    if (evidence) await fs.writeFile(`${evidence}/${engine}-results.json`, JSON.stringify(results, null, 2));
    console.log(`PASS ${engine}: ${results.join('; ')}`);
  } finally { await browser.close(); await new Promise(resolve => host.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
