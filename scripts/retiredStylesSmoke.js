// Retired styles must stay absent, with working old route/query/share recovery.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const retired = ['gradient', 'lines', 'point-connect'];
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ready = () => page.waitForFunction(() => window.barShareController && window._renderer?.canvas?.dataset.previewReady === 'true' && !window.PageEntrance?.isActive?.());
    for (const style of retired) {
      await page.goto(`${base}/generator/${style}/?colorMode=gray-on-black&gradientVariant=2&gradientSpeed=0.4`);
      await ready();
      assert.equal(await page.inputValue('#style-select'), 'solid');
      assert.ok(new URL(page.url()).pathname.endsWith('/generator/solid/'));
      assert.equal(await page.inputValue('#color-mode-select'), 'gray-on-black');
      await page.evaluate(style => {
        const saved = barShareController.capture();
        saved.controls['style-select'] = style;
        saved.controls['gradient-variant-slider'] = '2';
        barShareController.restoreLocal(saved);
      }, style);
      assert.equal(await page.inputValue('#style-select'), 'solid');
      for (const value of retired) assert.equal(await page.locator(`#style-select option[value="${value}"]`).count(), 0);
      assert.equal(await page.locator('#gradient-group').count(), 0);
      await page.goto(`${base}/?style=${style}&colorMode=gray-on-black`);
      await ready();
      assert.equal(await page.inputValue('#style-select'), 'solid');
    }
    const source = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    const pending = page.waitForEvent('download');
    await page.evaluate(() => saveSVG());
    const download = await pending;
    assert.equal(await fs.readFile(await download.path(), 'utf8'), source);
    await page.goto(`${base}/generator/circles-gradient/`);
    await ready();
    assert.equal(await page.inputValue('#style-select'), 'circles-gradient');
    assert.equal(await page.locator('#bar-information-title').textContent(), 'Circles Gradient');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#mobile-menu-toggle').click();
    await page.locator('#bar-information-toggle').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#bar-information').getAttribute('open'), '');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.goto(base);
    await page.waitForFunction(() => window.MarqueeCatalog?.entries?.length);
    const values = await page.evaluate(() => MarqueeCatalog.entries.map(entry => entry.value));
    for (const style of retired) assert.ok(!values.includes(style));
    assert.equal(await page.locator('img[src*="marquee-bars/gradient."]').count(), 0);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ engine, passed: true, retired, routes: true, query: true, snapshots: true, svg: true, circlesGradient: true, mobileKeyboard: true }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
