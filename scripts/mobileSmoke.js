const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');

const baseUrl = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const browserName = process.env.RPI_BROWSER || 'webkit';
const evidence = process.env.RPI_MOBILE_EVIDENCE;
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function main() {
  const browser = await ({ chromium, webkit }[browserName]).launch({ headless: true });
  const errors = [];
  if (evidence) await fs.mkdir(evidence, { recursive: true });
  try {
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 664 },
      { width: 844, height: 290 }, { width: 932, height: 360 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}/generator/ruler/`);
      await page.locator('#p5-container canvas').waitFor();
      await page.locator('#mobile-menu-toggle').tap();
      await page.waitForFunction(() => {
        const panel = document.getElementById('app-sidebar').getBoundingClientRect();
        const main = document.querySelector('.app-main').getBoundingClientRect();
        return panel.width > 0 && panel.bottom <= innerHeight + 1 && panel.right <= innerWidth + 1
          && (main.right <= panel.left + 1 || main.bottom <= panel.top + 1)
          && Math.abs(document.querySelector('#p5-container canvas').width / devicePixelRatio - main.width) < 2;
      });
      const layout = await page.evaluate(() => {
        const panel = document.getElementById('app-sidebar');
        const rect = panel.getBoundingClientRect();
        return { right: rect.right, bottom: rect.bottom, hidden: panel.inert,
          nativePicker: getComputedStyle(document.getElementById('style-select')).display,
          targetHeight: document.getElementById('mobile-controls-close').getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > innerWidth,
          motion: getComputedStyle(panel).transitionDuration };
      });
      assert.equal(layout.hidden, false);
      assert.equal(layout.overflow, false);
      assert.equal(layout.nativePicker, 'block');
      assert.ok(layout.targetHeight >= 44);
      assert.ok(layout.right <= viewport.width + 1 && layout.bottom <= viewport.height + 1);
      assert.ok(parseFloat(layout.motion) < 0.001, 'reduced motion must apply to the panel');
      if (evidence) await page.screenshot({ path: path.join(evidence, `${browserName}-${viewport.width}x${viewport.height}-panel.png`), scale: 'css' });
      await page.locator('#ruler-repeats-display').tap();
      const editor = page.locator('.slider_value-input');
      assert.equal(await editor.evaluate(e => getComputedStyle(e).boxShadow), 'none');
      assert.ok(await editor.evaluate(e => parseFloat(getComputedStyle(e).fontSize) >= 16));
      await editor.press('1');
      assert.equal(await editor.evaluate(e => getComputedStyle(e).outlineStyle), 'none',
        'ordinary text entry must not restore the tapped input ring');
      await editor.fill('12');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#ruler-repeats-slider').inputValue(), '12');
      await page.locator('#mobile-controls-close').tap();
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
      await page.locator('#zoom-level').tap();
      assert.equal(await page.locator('#zoom-level').evaluate(e => getComputedStyle(e).boxShadow), 'none');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#zoom-level').evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
      await page.keyboard.press('Escape');
      console.log(`${browserName} ${viewport.width}x${viewport.height}: separate preview/panel, native picker, touch editor, keyboard ring`);
    }

    await page.setViewportSize({ width: 390, height: 664 });
    if (browserName === 'chromium') {
      await page.locator('#mobile-menu-toggle').tap();
      const slider = page.locator('#ruler-repeats-slider');
      await slider.scrollIntoViewIfNeeded();
      const rect = await slider.boundingBox();
      const cdp = await context.newCDPSession(page);
      const swipe = async (start, end) => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
        for (let step = 1; step <= 8; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
            x: start.x + (end.x - start.x) * step / 8,
            y: start.y + (end.y - start.y) * step / 8, id: 1 }] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      const beforeValue = await slider.inputValue();
      await swipe({ x: rect.x + rect.width * 0.25, y: rect.y + rect.height / 2 },
        { x: rect.x + rect.width * 0.8, y: rect.y + rect.height / 2 });
      assert.notEqual(await slider.inputValue(), beforeValue, 'horizontal touch drag changes the native range');
      const scrollBefore = await page.locator('#sidebar-scroll').evaluate(e => e.scrollTop);
      await swipe({ x: 30, y: 580 }, { x: 30, y: 400 });
      await page.waitForTimeout(150);
      assert.ok(await page.locator('#sidebar-scroll').evaluate(e => e.scrollTop) > scrollBefore,
        'vertical touch swipe scrolls the control sheet');
      await page.locator('#mobile-controls-close').tap();
      await cdp.detach();
      console.log('chromium: dispatched touch swipe scrolls sheet and horizontal drag edits slider');
    }
    for (const theme of ['white', 'red', 'black', 'blue', 'white', 'black']) {
      await page.evaluate(theme => applyColorMode(theme), theme);
      await settle(page);
      const surfaces = await page.evaluate(() => ({
        body: getComputedStyle(document.body).backgroundColor,
        root: getComputedStyle(document.documentElement).backgroundColor,
        header: getComputedStyle(document.querySelector('.app-header')).backgroundColor,
        hint: document.querySelector('meta[name="theme-color"]').content
      }));
      assert.equal(surfaces.root, surfaces.body);
      assert.equal(surfaces.header, surfaces.body);
      assert.equal(surfaces.hint, surfaces.body);
    }
    await page.locator('#zoom-in-btn').tap();
    await page.waitForFunction(() => zoomLevel > 1);
    const cancelState = await page.evaluate(() => {
      const canvas = document.querySelector('.canvas-viewport');
      // This injected cancellation check has no OS pointer to capture.
      const capture = canvas.setPointerCapture;
      canvas.setPointerCapture = () => {};
      canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 17, pointerType: 'touch', clientX: 100, clientY: 100, bubbles: true }));
      canvas.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 17, pointerType: 'touch', bubbles: true }));
      canvas.setPointerCapture = capture;
      return { dragging: canvas.classList.contains('is-dragging'), pointer: panPointerId,
        touchAction: getComputedStyle(canvas).touchAction };
    });
    assert.equal(cancelState.dragging, false);
    assert.equal(cancelState.pointer, null);
    assert.equal(cancelState.touchAction, 'none', 'viewer owns touch pinch; page outside stays zoomable');
    await page.locator('#zoom-reset-btn').tap();
    await page.locator('#save-button').tap();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#save-svg').tap();
    const download = await downloadPromise;
    const svg = await fs.readFile(await download.path(), 'utf8');
    assert.match(svg, /<svg[^>]*viewBox=/);
    assert.match(svg, /<path/);

    // A visual viewport can shrink during OS keyboard presentation. During a
    // native pinch, however, the app must not re-fit to the magnified viewport.
    const viewportBehavior = await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 300 });
      Object.defineProperty(viewport, 'scale', { configurable: true, value: 1 });
      const keyboardHeight = getViewportHeight();
      Object.defineProperty(viewport, 'scale', { configurable: true, value: 2 });
      const pinchHeight = getViewportHeight();
      delete viewport.height;
      delete viewport.scale;
      return { keyboardHeight, pinchHeight, layoutHeight: innerHeight };
    });
    assert.equal(viewportBehavior.keyboardHeight, 300);
    assert.equal(viewportBehavior.pinchHeight, viewportBehavior.layoutHeight);

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(`${baseUrl}/generator/solid/`);
    await desktop.locator('#p5-container canvas').waitFor();
    assert.equal(await desktop.locator('.mobile_controls-header').isVisible(), false);
    assert.equal(await desktop.locator('#style-select').isVisible(), false);
    assert.equal(await desktop.locator('#style-select + .custom-select-trigger').isVisible(), true);
    await desktop.locator('#zoom-level').click();
    await desktop.keyboard.press('ArrowRight');
    assert.equal(await desktop.locator('#zoom-level').evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
    if (evidence) await desktop.screenshot({ path: path.join(evidence, `${browserName}-desktop.png`), scale: 'css' });
    assert.deepEqual(errors, []);
    console.log(`${browserName}: repeated theme surfaces, pointercancel, SVG download, viewport keyboard/pinch distinction, desktop controls passed`);
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
