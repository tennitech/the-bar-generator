/* Mission Control keeps real exports in the header and credits in About this bar. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_HEADER_EVIDENCE || '/tmp/rpi-header-order-evidence';
const ready = target => target.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();

(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  await fs.mkdir(evidence, { recursive: true });
  try {
    for (const [width, height, touch] of [[320, 568, true], [390, 844, true], [844, 390, true],
      [901, 360, false], [1024, 768, false], [1440, 900, false], [3840, 2160, false]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch,
        isMobile: touch, deviceScaleFactor: touch ? 2 : 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = []; let popups = 0;
      page.on('pageerror', e => errors.push(e.message));
      page.on('popup', () => popups++);
      await page.goto(`${base}/generator/lunar/?colorMode=lunar`); await ready(page);
      await page.evaluate(() => { noLoop(); return document.fonts.ready; });
      assert.equal(await page.locator('#save-button-label').innerText(), 'Download Asset');
      assert.equal(await page.locator('#save-button .icon-download').isVisible(), true);
      const expectedSVG = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
      for (const format of ['svg', 'png']) {
        await page.locator('#save-button').click();
        assert.equal(await page.locator('#export-settings').isVisible(), true);
        assert.equal(await page.locator('#save-loop-gif').isVisible(), false);
        const download = page.waitForEvent('download');
        await page.locator(`#save-${format}`).click();
        const bytes = await fs.readFile(await (await download).path());
        if (format === 'svg') assert.equal(bytes.toString('utf8'), expectedSVG);
        else {
          assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
          assert.equal(bytes.readUInt32BE(16), 1160); assert.equal(bytes.readUInt32BE(20), 762);
        }
        await page.waitForFunction(() => !logoExportUI.isBusy());
      }
      assert.equal(popups, 0, 'export actions must not open former credits links');
      const toggle = page.locator('#mobile-menu-toggle');
      if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
      const details = page.locator('#artemis-information'), summary = details.locator('summary');
      await summary.scrollIntoViewIfNeeded(); await summary.focus(); await page.keyboard.press('Enter');
      assert.equal(await details.getAttribute('open'), '');
      assert.equal(await details.locator('a').count(), 3);
      assert.match(await details.innerText(), /Reid Wiseman '97/);
      assert.match(await details.innerText(), /Maeve Marshall '23, M.Eng. '24/);
      assert.match(await details.innerText(), /Paul McKee '17, MS '18, Ph.D. '23/);
      for (const link of await details.locator('a').all()) {
        assert.match(await link.getAttribute('href'), /^https:\/\/news\.rpi\.edu\//);
        await link.scrollIntoViewIfNeeded(); await link.focus();
        assert.equal(await link.evaluate(el => document.activeElement === el), true);
      }
      assert.equal(await page.locator('.sidebar-footer').evaluate(el => getComputedStyle(el).position), 'static');
      await page.locator('#report-problem-btn').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(evidence, `${engine}-mission-info-${width}.png`), scale: 'css' });
      await summary.scrollIntoViewIfNeeded(); await summary.click();
      assert.equal(await details.getAttribute('open'), null);
      await page.selectOption('#color-mode-select', 'black', { force: true });
      assert.equal(await details.isVisible(), true, 'Artemis context follows its bar in any theme');
      await page.selectOption('#style-select', 'solid', { force: true });
      assert.equal(await details.isVisible(), false);
      await page.selectOption('#style-select', 'lunar', { force: true });
      assert.equal(await details.isVisible(), true); assert.equal(await details.getAttribute('open'), null);
      assert.deepEqual(errors, []); results.push({ width, height, touch, downloads: ['svg', 'png'], credits: 3 });
      await context.close();
    }
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      await page.setContent(`<iframe style="width:${width}px;height:800px;border:0" sandbox="allow-scripts allow-same-origin" src="${base}/generator/lunar/?colorMode=lunar"></iframe>`);
      const frame = await (await page.locator('iframe').elementHandle()).contentFrame(); await ready(frame);
      assert.equal(await frame.locator('#save-button-label').innerText(), 'Save asset');
      for (const format of ['svg', 'png']) {
        await frame.locator('#save-button').click(); await frame.locator(`#save-${format}`).click();
        await frame.waitForFunction(() => !logoExportUI.isBusy());
        assert.match(await frame.locator('#export-message').textContent(), /download requested/);
        assert.equal(await frame.locator('#save-menu').isVisible(), true);
        assert.equal(await frame.locator('#save-preview-dialog, #save-preview-image').count(), 0);
        await page.keyboard.press('Escape');
      }
      results.push({ embedded: true, width, requestedFormats: ['svg', 'png'] }); await page.close();
    }
    await fs.writeFile(path.join(evidence, `${engine}-mission-header-results.json`), JSON.stringify(results, null, 2));
    console.log(`${engine}: ${results.length} mission header/info/export cases passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
