const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    for (const style of ['waveform', 'triangle-grid', 'circles-gradient']) for (const reducedMotion of ['no-preference', 'reduce']) for (const width of [1280, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion });
      await page.addInitScript(() => {
        window.__actionFeedback = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (frames, options) {
          if (this.matches('[data-die-face], .parameter_action-label')) window.__actionFeedback.push({ face: this.dataset.dieFace, options });
          return animate.call(this, frames, options);
        };
      });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/generator/${style}/`);
      await page.waitForFunction(() => window.randomizeHistory && typeof captureLogoExportSnapshot === 'function');
      if (width < 900) {
        await page.locator('#mobile-menu-toggle').click();
        await page.locator('#app-sidebar').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
      }
      const randomize = page.locator(`#${style}-group [data-parameter-action="randomize"]`);
      const undo = page.locator(`#${style}-group [data-randomize-undo]`);
      const reset = page.locator(`#${style}-group [data-parameter-action="reset"]`);
      const boxes = () => page.locator(`#${style}-group .control-header-actions button`).evaluateAll(nodes => nodes.map(el => {
        const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
      }));
      const initialBoxes = await boxes();
      const capture = () => page.evaluate(() => captureLogoExportSnapshot().svgSource);
      const original = await capture();
      let previous;
      for (let i = 0; i < 3; i++) { previous = await capture(); await randomize.click(); }
      assert.deepEqual(await boxes(), initialBoxes, 'fixed action hit targets');
      assert.equal(await undo.isDisabled(), false);
      await undo.click(); assert.equal(await capture(), previous, 'Undo restores exact artwork');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.parameterAction), 'randomize');
      if (await reset.isEnabled()) await reset.click();
      assert.equal(await capture(), original, 'Reset restores defaults');
      assert.deepEqual(await boxes(), initialBoxes);
      const feedback = await page.evaluate(() => window.__actionFeedback);
      assert.equal(feedback.length > 0, reducedMotion === 'no-preference');
      assert(feedback.every(event => event.options.duration <= (event.face ? 700 : 220)));
      if (reducedMotion === 'no-preference') {
        assert(feedback.some(event => event.face === 'back'));
        assert(feedback.some(event => event.face === 'front'));
      }
      await randomize.focus(); await randomize.press('Enter');
      assert.deepEqual(await boxes(), initialBoxes, 'keyboard activation preserves layout');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const before = await page.evaluate(() => window.__actionFeedback.length); await randomize.click();
      assert.equal(await page.evaluate(() => window.__actionFeedback.length), before);
      assert.equal(await randomize.locator('svg[aria-hidden="true"][focusable="false"]').count(), 1);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS ${engine}: Waveform, Triangle Grid, Circles Gradient; stable action layout, bounded feedback, exact Undo/Reset artwork, reduced-motion/live preference, repeated actions`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
