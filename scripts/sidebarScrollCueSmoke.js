const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    for (const [width, height] of [[1280, 720], [390, 844], [320, 568], [844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 500, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/generator/waveform/`);
      await page.waitForFunction(() => window.SidebarScrollCue && document.querySelector('[data-scroll-cue]'));
      await page.locator('#p5-container canvas').waitFor();
      if (width <= 900) await page.locator('#mobile-menu-toggle').click();
      const cue = page.locator('[data-scroll-cue]');
      await cue.waitFor({ state: 'visible' });
      assert.equal(await cue.getAttribute('aria-hidden'), 'true');
      await page.screenshot({ path: `/tmp/scroll-cue-${engine}-${width}.png` });
      const overlap = await cue.evaluate(el => {
        const r = el.getBoundingClientRect(); const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { intercepts: el === target || el.contains(target), animation: getComputedStyle(el).animationName,
          right: r.right, left: r.left, width: innerWidth };
      });
      assert.equal(overlap.intercepts, false); assert.equal(overlap.animation, 'none');
      assert(overlap.left >= 0 && overlap.right <= overlap.width);
      const scroller = page.locator('#sidebar-scroll');
      await scroller.focus(); await page.keyboard.press('End');
      await page.waitForFunction(() => document.querySelector('[data-scroll-cue]').hidden);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'sidebar-scroll');
      await page.keyboard.press('Home'); await cue.waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.getElementById('sidebar-scroll').scrollTop === 0);
      await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await cue.waitFor({ state: 'hidden' });
      await scroller.evaluate(el => { el.scrollTop = 0; }); await cue.waitFor({ state: 'visible' });
      await page.evaluate(() => SidebarScrollCue.init());
      assert.equal(await page.locator('[data-scroll-cue]').count(), 1);
      await page.setViewportSize({ width: 1280, height: 1200 });
      await page.selectOption('#style-select', 'solid', { force: true });
      await cue.waitFor({ state: 'hidden' });
      await page.selectOption('#style-select', 'wave-quantum', { force: true });
      await page.setViewportSize({ width: 1280, height: 650 });
      await cue.waitFor({ state: 'visible' });
      // An expanded About section can switch its footer from sticky to flow.
      await page.selectOption('#style-select', 'lunar', { force: true });
      await page.locator('#artemis-information').evaluate(el => { el.open = true; });
      await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await cue.waitFor({ state: 'hidden' });
      await page.evaluate(() => Toast.show('Selection saved', 'success', 0));
      assert.equal(await page.locator('.toast_dismiss-icon[aria-hidden="true"]').count(), 1);
      await page.getByRole('button', { name: 'Dismiss message' }).click();
      assert.equal(await page.locator('.toast').count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS ${engine}: four layouts, true overflow/end states, keyboard and touch-compatible scroll, resize/style/details changes, passive cue and consistent dismiss icon`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
