// Focused menu checks. Other scripts cover native clipboard and iframe policy.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_EVIDENCE_DIR;
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/ruler/`);
    await page.waitForFunction(() => window.logoExportUI && typeof captureLogoExportSnapshot === 'function');
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    const open = async () => { if (!await page.locator('#save-menu').isVisible()) await page.locator('#save-button').click(); };
    assert.equal(await page.locator('#export-size-select').inputValue(), 'large');
    assert.equal(await page.locator('#export-size-select option:checked').textContent(), 'Large · Recommended');
    await open();
    assert.equal(await page.locator('#export-dimensions').textContent(), '2320 × 1524 px');
    for (const [size, width, height] of [['large', 2320, 1524], ['standard', 1160, 762]]) {
      await page.locator('#export-size-select').selectOption(size);
      assert.equal(await page.locator('#export-dimensions').textContent(), `${width} × ${height} px`);
      assert.match(await page.locator('#copy-png').textContent(), new RegExp(`${width} × ${height}`));
      const wait = page.waitForEvent('download'); await page.locator('#save-png').click();
      const file = await wait; const png = await fs.readFile(await file.path());
      assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
      assert.match(file.suggestedFilename(), new RegExp(`${width}x${height}\\.png$`));
      await page.waitForFunction(() => !logoExportUI.isBusy());
      assert.equal(await page.locator('#save-menu').isVisible(), true);
      assert.equal(await page.locator('#export-message').textContent(), 'PNG download requested.');
      assert.match(await page.locator('#export-detail').textContent(), new RegExp(`${width} × ${height} px.*[BK]B?.*Check your browser`));
    }
    await page.locator('#export-size-select').selectOption('large');
    // Observe actual GIF encoder reports, not simulated time-based progress.
    await page.evaluate(() => {
      window.__exportReports = [];
      const report = logoExportUI.report;
      logoExportUI.report = (job, progress) => {
        report(job, progress);
        __exportReports.push({ ...progress, value: document.getElementById('export-meter').value });
      };
    });
    const gifWait = page.waitForEvent('download', { timeout: 120000 });
    await page.locator('#save-loop-gif').click();
    await page.waitForFunction(() => __exportReports.some(p => p.encoded > 0), { timeout: 120000 });
    assert.equal(await page.locator('#export-track').getAttribute('data-indeterminate'), 'false');
    assert.equal(await page.locator('#export-fill').evaluate(el => getComputedStyle(el).animationName), 'none');
    if (evidence) await page.screenshot({ path: `${evidence}/${engine}-progress.png` });
    const gif = await fs.readFile(await (await gifWait).path());
    assert.equal(gif.readUInt16LE(6), 2320); assert.equal(gif.readUInt16LE(8), 1524);
    await page.waitForFunction(() => !logoExportUI.isBusy());
    const reports = await page.evaluate(() => __exportReports);
    assert(reports.length > 3);
    for (let i = 1; i < reports.length; i++) assert(reports[i].value >= reports[i - 1].value);
    assert.equal(reports.at(-1).value, 1);
    assert.equal(await page.locator('#export-message').textContent(), 'GIF download requested.');
    assert.match(await page.locator('#export-detail').textContent(), /2320 × 1524 px/);
    if (evidence) await page.screenshot({ path: `${evidence}/${engine}-complete.png` });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#save-menu').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button');
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(300);
      await open();
      const box = await page.locator('#save-menu').boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width + 1);
      assert(box.y >= 0 && box.y + box.height <= height + 1);
      for (const id of ['save-png', 'save-svg', 'save-loop-gif', 'copy-png']) {
        await page.locator(`#${id}`).evaluate(el => { document.getElementById('save-menu').scrollTop = el.offsetTop; });
        const target = await page.locator(`#${id}`).boundingBox(); assert(target.height >= 44);
      }
      await page.locator('#save-menu').evaluate(el => { el.scrollTop = 0; });
      assert.equal(await page.evaluate(() => scrollX), 0, 'the export menu must not pan the page');
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-${width}.png` });
      await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${engine}: Large default; real PNG/GIF dimensions and filenames; measured GIF progress; retained completion; Escape; four viewport layouts`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
