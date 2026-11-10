const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const fs = require('node:fs/promises');
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/rpi-sidebar-fade';
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch({
    ...(process.env.RPI_BROWSER_EXECUTABLE ? { executablePath: process.env.RPI_BROWSER_EXECUTABLE } : {})
  });
  try {
    for (const [width, height] of [[1280, 720], [390, 844], [320, 568], [844, 390], [1024, 360], [1280, 650]]) {
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: width <= 900, reducedMotion: width === 1280 ? 'no-preference' : 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/generator/waveform/`);
      await page.waitForFunction(() => window.SidebarScrollCue && document.querySelector('[data-scroll-cue]'));
      await page.locator('#p5-container canvas').waitFor();
      if (width <= 900) await page.locator('#mobile-menu-toggle').click();
      const cue = page.locator('[data-scroll-cue]');
      await cue.waitFor({ state: 'visible' });
      assert.equal(await cue.getAttribute('aria-hidden'), 'true');
      for (const theme of ['black', 'white', 'red']) {
        await page.selectOption('#color-mode-select', theme, { force: true });
        await page.waitForFunction(() => !document.querySelector('.theme_scan'));
        const fade = await cue.evaluate(el => {
          const css = getComputedStyle(el, '::before'), r = el.getBoundingClientRect();
          const scroller = document.getElementById('sidebar-scroll').getBoundingClientRect();
          const sidebar = document.getElementById('app-sidebar').getBoundingClientRect();
          const bottom = r.bottom + parseFloat(css.bottom) * -1;
          const available = parseFloat(el.style.getPropertyValue('--sidebar-scroll-fade-space'));
          return { height: parseFloat(css.height), available, top: bottom - parseFloat(css.height),
            scrollerTop: scroller.top, bottom, scrollerBottom: scroller.bottom,
            left: r.left, right: r.right, sidebarLeft: sidebar.left, sidebarRight: sidebar.right,
            pointerEvents: css.pointerEvents, animation: css.animationName, background: css.backgroundImage };
        });
        assert(fade.height > 24 && fade.height <= 72 && fade.height <= fade.available, JSON.stringify(fade));
        assert(fade.top >= fade.scrollerTop - 1 && fade.bottom <= fade.scrollerBottom + 1);
        assert(Math.abs(fade.left - fade.sidebarLeft) <= 1 && Math.abs(fade.right - fade.sidebarRight) <= 1);
        assert.equal(fade.pointerEvents, 'none'); assert.equal(fade.animation, 'none');
        assert.match(fade.background, /linear-gradient/);
        await page.screenshot({ path: `${evidence}/${engine}-${width}x${height}-${theme}.png` });
      }
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
      assert.equal(await cue.evaluate(el => getComputedStyle(el).display), 'none');
      assert.equal(await page.locator('.sidebar-footer').evaluate(el => getComputedStyle(el, '::before').content), 'none');
      await page.screenshot({ path: `${evidence}/${engine}-${width}x${height}-end.png` });
      await page.keyboard.press('Home'); await cue.waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.getElementById('sidebar-scroll').scrollTop === 0);
      await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await cue.waitFor({ state: 'hidden' });
      await scroller.evaluate(el => { el.scrollTop = 0; }); await cue.waitFor({ state: 'visible' });
      await page.mouse.move((await scroller.boundingBox()).x + 30, (await cue.boundingBox()).y - 10);
      await page.mouse.wheel(0, 100);
      await page.waitForFunction(() => document.getElementById('sidebar-scroll').scrollTop > 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const themeControl = page.locator('#color-mode-select');
      const customTheme = page.locator('#color-mode-select + button');
      const activeTheme = await customTheme.isVisible() ? customTheme : themeControl;
      await activeTheme.scrollIntoViewIfNeeded();
      assert.ok(await activeTheme.evaluate(el => {
        const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return el === hit || el.contains(hit);
      }), 'theme control remains reachable through the fade');
      await activeTheme.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape');
      await page.evaluate(() => SidebarScrollCue.init());
      assert.equal(await page.locator('[data-scroll-cue]').count(), 1);
      await page.setViewportSize({ width: 1280, height: 1200 });
      await page.selectOption('#style-select', 'solid', { force: true });
      await cue.waitFor({ state: 'hidden' });
      await page.selectOption('#style-select', 'wave-quantum', { force: true });
      await page.setViewportSize({ width: 1280, height: 650 });
      await cue.waitFor({ state: 'visible' });
      // Expanded descriptions never become more controls; the footer stays pinned.
      await page.selectOption('#style-select', 'lunar', { force: true });
      await page.locator('#bar-information-toggle').click();
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
    console.log(`PASS ${engine}: six layouts, three themes, 72px bounded passive fades, true overflow/end states, keyboard and touch-compatible scroll, resize/style/details changes, passive cue and consistent dismiss icon`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
