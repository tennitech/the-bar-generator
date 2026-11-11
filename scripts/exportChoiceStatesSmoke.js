// Optional rendered coverage. Run only in an environment with permitted browser access.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, firefox, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_EVIDENCE_DIR;
(async () => {
  const browser = await ({ chromium, firefox, webkit }[engine]).launch();
  try {
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    for (const width of [1440, 390, 320]) for (const theme of ['black', 'white', 'lunar']) for (const large of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/waveform/?colorMode=${theme}`);
      await page.waitForFunction(() => window.logoExportUI && document.getElementById('export-composition-logo'));
      if (large) await page.evaluate(() => { document.documentElement.dataset.editorSize = 'large'; });
      await page.locator('#save-button').click();
      const appearance = () => page.locator('.export_choice').evaluateAll(choices => choices.map(el => {
        const style = getComputedStyle(el), input = el.querySelector('input'), rect = el.getBoundingClientRect();
        return { id: input.id, checked: input.checked, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          bg: style.backgroundColor, fg: style.color, borderWidth: style.borderWidth, border: style.borderColor,
          weight: getComputedStyle(el.querySelector('.export_choice-text')).fontWeight,
          radio: [getComputedStyle(input).width, getComputedStyle(input).height],
          ring: [style.outlineWidth, style.outlineOffset, style.outlineColor] };
      }));
      const before = await appearance();
      assert.equal(before.length, 4);
      for (const row of before) {
        assert.equal(row.borderWidth, '1px');
        assert.deepEqual(row.radio, ['16px', '16px']);
        assert.equal(row.weight, row.checked ? '700' : '500');
      }
      const selected = before.filter(row => row.checked);
      assert.equal(selected[0].bg, selected[1].bg);
      assert.equal(selected[0].fg, selected[1].fg);
      assert.equal(selected[0].border, selected[1].border);
      await page.locator('#export-composition-logo').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#export-composition-bar').isChecked(), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'export-size-large');
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#export-size-standard').isChecked(), true);
      assert.equal(await page.locator('#export-dimensions').textContent(), '1160 × 232 px');
      const after = await appearance();
      for (let i = 0; i < before.length; i += 1) {
        for (const prop of ['x', 'y', 'width', 'height']) assert.equal(after[i][prop], before[i][prop], `layout shifted: ${after[i].id} ${prop}`);
        assert.equal(after[i].weight, after[i].checked ? '700' : '500');
      }
      assert.equal(after.find(row => row.id === 'export-size-standard').ring[0], '2px');
      assert.equal(after.find(row => row.id === 'export-size-standard').ring[1], '2px');
      await page.locator('#export-size-standard').hover();
      assert.equal((await appearance()).find(row => row.id === 'export-size-standard').bg, selected[0].bg);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'save-png');
      assert.equal(await page.locator('#save-png').evaluate(el => getComputedStyle(el).outlineOffset), '2px');
      assert.equal(await page.locator('#save-menu').evaluate(el => el.scrollWidth <= el.clientWidth), true);
      assert.equal(await page.getByRole('radio', { name: 'Bar + RPI', exact: true }).count(), 1);
      assert.equal(await page.getByRole('radio', { name: 'Large Recommended', exact: true }).count(), 1);
      // Busy jobs retain selection, block changes, and recover on cancel/finish.
      await page.evaluate(() => { window.exportChoiceTestJob = logoExportUI.begin('gif'); });
      for (const id of ['export-composition-logo', 'export-composition-bar', 'export-size-large', 'export-size-standard', 'save-png']) {
        assert.equal(await page.locator(`#${id}`).isDisabled(), true);
      }
      await page.locator('#export-cancel').click();
      await page.evaluate(() => { logoExportUI.finish(window.exportChoiceTestJob, 'cancelled', 'Export cancelled.'); delete window.exportChoiceTestJob; });
      await page.locator('#save-button').press('Escape');
      assert.equal(await page.locator('#save-menu').isVisible(), false);
      await page.locator('#save-button').click();
      assert.equal(await page.locator('#export-composition-bar').isChecked(), true);
      assert.equal(await page.locator('#export-size-standard').isChecked(), true);
      if (evidence) await page.screenshot({ path: `${evidence}/${engine}-${theme}-${width}-${large ? 'large' : 'regular'}.png` });
      await page.emulateMedia({ forcedColors: 'active' });
      assert.equal(await page.locator('#export-size-standard').evaluate(el => getComputedStyle(el).appearance), 'auto');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS ${engine}: shared selection, bold labels without shifts, radios, keyboard, focus, disabled/recovery, close/reopen and forced colors at three widths, three themes and both editor sizes`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
