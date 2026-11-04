// State feedback adds no timers or export logic. Verify the rendered CSS and
// repeated outcome transitions with the real UI controller in both motion modes.
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/waveform/`);
      await page.waitForFunction(() => window.logoExportUI && typeof captureLogoExportSnapshot === 'function');
      await page.locator('#save-button').click();
      await page.locator('#save-png').hover();
      await page.waitForTimeout(200);
      const arrow = await page.locator('#save-png svg polyline').evaluate(el => getComputedStyle(el).transform);
      assert.equal(arrow === 'none', reducedMotion === 'reduce');
      await page.keyboard.press('Tab');
      await page.locator('#copy-png').focus();
      await page.waitForTimeout(200);
      // Keyboard focus shares the same feedback as hover, without touching the tray/front sheet.
      const rear = await page.locator('#copy-png svg path').evaluate(el => getComputedStyle(el).transform);
      assert.equal(rear === 'none', reducedMotion === 'reduce');
      assert.equal(await page.locator('#copy-png svg rect').evaluate(el => getComputedStyle(el).transform), 'none');
      for (const [outcome, icon] of [['started', 'check.svg'], ['error', 'x-circle.svg'], ['copied', 'check.svg'], ['requested', 'check.svg']]) {
        const result = await page.evaluate(outcome => {
          const job = logoExportUI.begin('png');
          const working = getComputedStyle(document.getElementById('export-message'), '::before').maskImage;
          const duplicate = logoExportUI.begin('png');
          logoExportUI.finish(job, outcome, `Test ${outcome}`);
          const style = getComputedStyle(document.getElementById('export-message'), '::before');
          return { working, duplicate, icon: style.maskImage, animation: style.animationName,
            busy: logoExportUI.isBusy(), disabled: document.getElementById('save-png').disabled };
        }, outcome);
        assert.match(result.working, /loader\.svg/);
        assert(result.icon.includes(icon)); assert.equal(result.duplicate, null);
        assert.equal(result.busy, false); assert.equal(result.disabled, false);
        assert.equal(result.animation, reducedMotion === 'reduce' || outcome === 'error' ? 'none' : 'feedbackResolve');
      }
      const toast = await page.evaluate(() => {
        Toast.show('Copied successfully', 'success');
        return getComputedStyle(document.querySelector('.toast.success .toast_icon polyline')).animationName;
      });
      assert.equal(toast, reducedMotion === 'reduce' ? 'none' : 'feedbackCheck');
      const selected = await page.locator('#style-select-options .custom-option[aria-selected="true"]').evaluate(el => getComputedStyle(el, '::after').animationName);
      assert.equal(selected, reducedMotion === 'reduce' ? 'none' : 'feedbackSelection');
      await page.locator('#save-png').evaluate(el => { el.disabled = true; });
      await page.locator('#save-png').hover();
      await page.waitForTimeout(200);
      assert.equal(await page.locator('#save-png svg polyline').evaluate(el => getComputedStyle(el).transform), 'none');
      await page.locator('#save-png').evaluate(el => { el.disabled = false; });
      if (reducedMotion === 'reduce') {
        assert.equal(await page.evaluate(() => { const indicator = document.createElement('span'); indicator.className = 'audio-indicator'; document.body.append(indicator); const animation = getComputedStyle(indicator, '::before').animationName; indicator.remove(); return animation; }), 'none');
        assert.equal(await page.locator('.slider').first().evaluate(el => getComputedStyle(el, '::before').transitionDuration), '0s');
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#save-menu').isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'save-button');
      await page.locator('#save-button').click();
      await page.evaluate(() => { const job = logoExportUI.begin('gif'); logoExportUI.finish(job, 'cancelled', 'Cancelled'); });
      assert.equal(await page.locator('#save-menu').isVisible(), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS ${engine}: hover/keyboard icons, repeated export outcomes, concurrent-click guard, success stroke, reduced-motion pseudo-elements, Escape/Cancel recovery`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
