// Menu hierarchy and surface checks; native copying has its own payload suite.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_EVIDENCE_DIR;
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const checks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    await page.goto(`${base}/generator/waveform/`);
    await page.waitForFunction(() => window.logoExportUI && typeof captureLogoExportSnapshot === 'function');
    for (const theme of ['black', 'white', 'red']) {
      await page.evaluate(theme => { const select = document.getElementById('color-mode-select'); select.value = theme; select.dispatchEvent(new Event('change', { bubbles: true })); }, theme);
      if (!await page.locator('#save-menu').isVisible()) await page.locator('#save-button').click();
      assert.equal(await page.locator('#export-download-label').textContent(), 'Download');
      assert.equal(await page.locator('#export-copy-label').textContent(), 'Copy');
      assert.deepEqual(await page.locator('.export_download-actions .option-label').allTextContents(), ['PNG', 'SVG', 'GIF']);
      assert.deepEqual(await page.locator('.export_copy-actions .option-label').allTextContents(), ['PNG', 'SVG']);
      assert.equal(await page.locator('.export_group-label svg').count(), 0);
      assert.equal(await page.locator('.save-option .export_action-icon[aria-hidden="true"][focusable="false"]').count(), 5);
      assert.equal(await page.locator('.export_copy-actions').evaluate(el => getComputedStyle(el).borderLeftWidth), '1px');
      const [download, copy] = await page.evaluate(() => ['.export_download-actions', '.export_copy-actions'].map(selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width }; }));
      assert.equal(download.y, copy.y);
      assert(copy.x >= download.x + download.width);
      for (const [id, verb, format] of [['save-png', 'Download', 'PNG'], ['save-svg', 'Download', 'SVG'], ['save-loop-gif', 'Download', 'GIF'], ['copy-svg', 'Copy', 'SVG'], ['copy-png', 'Copy', 'PNG']]) {
        assert.match(await page.locator(`#${id}`).getAttribute('aria-label'), new RegExp(`^${verb} ${format}:`));
      }
      const appearance = await page.evaluate(() => {
        const menu = document.getElementById('save-menu'), style = getComputedStyle(menu);
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = values => values.map(n => { const c = n / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((n, c, i) => n + c * [.2126, .7152, .0722][i], 0);
        const bg = luminance(rgb(style.backgroundColor));
        return { shadow: style.boxShadow, bg: style.backgroundColor, blur: style.backdropFilter,
          contrast: ['.export_size-label', '.export_group-label', '.option-label', '.option-desc', '.export_note'].map(selector => {
            const fg = luminance(rgb(getComputedStyle(menu.querySelector(selector)).color));
            return (Math.max(bg, fg) + .05) / (Math.min(bg, fg) + .05);
          }) };
      });
      assert.notEqual(appearance.shadow, 'none');
      assert.match(appearance.shadow, /16px 48px/);
      assert.equal(appearance.blur, 'none');
      assert(appearance.contrast.every(ratio => ratio >= 4.5), JSON.stringify(appearance));
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-${theme}-desktop.png` });
      checks.push({ theme, ...appearance });
    }
    await page.evaluate(() => { const select = document.getElementById('color-mode-select'); select.value = 'black'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    for (const [width, height] of [[320, 568], [375, 812], [844, 390]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(300);
      if (!await page.locator('#save-menu').isVisible()) await page.locator('#save-button').click();
      // Read all boxes in one frame: opening/viewport transitions must not mix timestamps.
      const [box, left, right] = await page.evaluate(() => ['save-menu', 'save-png', 'copy-png'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
      assert.equal(left.y, right.y);
      assert(right.x > left.x + left.width);
      assert.equal(await page.locator('#save-menu').evaluate(el => el.scrollWidth <= el.clientWidth), true);
      assert(box.x >= 0 && box.x + box.width <= width + 1);
      assert(box.y >= 0 && box.y + box.height <= height + 1);
      for (const id of ['save-png', 'save-svg', 'save-loop-gif', 'copy-png']) {
        const height = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().height);
        assert(height >= 44);
      }
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-${width}.png` });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#save-menu').isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button');
    }
    await page.evaluate(() => { window.__clipboardBlocked = embedSupport.clipboardBlocked; embedSupport.clipboardBlocked = () => true; logoClipboard.sync(); });
    assert.equal(await page.locator('#copy-png').isDisabled(), true);
    assert.equal(await page.locator('#copy-png .option-desc').textContent(), 'Blocked by site');
    assert.match(await page.locator('#copy-png').getAttribute('aria-label'), /Blocked by this site/);
    await page.evaluate(() => { embedSupport.clipboardBlocked = window.__clipboardBlocked; logoClipboard.sync(); });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(300);
    await page.locator('#save-button').focus(); await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'export-size-large');
    assert.notEqual(await page.locator('.export_size-option:has(#export-size-large)').evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    assert.equal(await page.locator('#export-size-select').inputValue(), 'large');
    const waiting = page.waitForEvent('download'); await page.locator('#save-png').click();
    const png = await fs.readFile(await (await waiting).path());
    assert.equal(png.readUInt32BE(16), 4752); assert.equal(png.readUInt32BE(20), 3121);
    await page.waitForFunction(() => !logoExportUI.isBusy());
    assert.equal(await page.locator('#export-message').textContent(), 'PNG download requested.');
    assert.equal(await page.locator('#save-menu').isVisible(), true);
    if (evidence) await page.screenshot({ path: `${evidence}/${engine}-result.png` });
    assert.deepEqual(errors, []);
    console.log(`PASS ${engine}: grouped labels, accessible actions, three theme shadows/contrast, three compact layouts, keyboard, real Large PNG, retained result`);
    console.log(JSON.stringify(checks, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
