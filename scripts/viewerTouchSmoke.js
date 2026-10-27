const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, devices } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_MOBILE_EVIDENCE;

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 664 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    async function touch(type, points) {
      await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y, id]) => ({ x, y, id })) });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
    async function move(from, to) {
      for (let step = 1; step <= 10; step++) {
        await touch('touchMove', from.map(([x, y, id], i) => [x + (to[i][0] - x) * step / 10, y + (to[i][1] - y) * step / 10, id]));
        await page.waitForTimeout(20);
      }
    }
    const state = () => page.evaluate(() => ({ level: zoomLevel, target: zoomTargetLevel,
      pan: { ...panOffset }, pageScale: visualViewport.scale, dragging: isPanDragging,
      toolbar: document.querySelector('.zoom_controls').getBoundingClientRect().toJSON() }));
    async function open() {
      await page.goto(`${base}/generator/solid/`);
      await page.locator('#p5-container canvas').waitFor();
    }
    async function geometry() {
      const rect = await page.locator('.canvas-viewport').boundingBox();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height * 0.45 };
    }
    async function pinch(startHalf, endHalf, end = true) {
      const { x, y } = await geometry();
      const from = [[x - startHalf, y, 1], [x + startHalf, y, 2]];
      const to = [[x - endHalf, y, 1], [x + endHalf, y, 2]];
      await touch('touchStart', from);
      await move(from, to);
      if (end) await touch('touchEnd', []);
      return to;
    }
    async function svg() {
      await page.locator('#save-button').tap();
      const promise = page.waitForEvent('download');
      await page.locator('#save-svg').tap();
      return fs.readFile(await (await promise).path());
    }
    await open();
    const exportBefore = await svg();
    const before = await state();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await pinch(45, 90);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const after = await state();
    assert.ok(Math.abs(after.level - 2) < 0.02, `pinch should zoom viewer: ${JSON.stringify(after)}`);
    assert.equal(after.pageScale, 1);
    assert.deepEqual(after.toolbar, before.toolbar, 'viewer pinch must not scale/move the toolbar');
    assert.equal(after.dragging, false);
    if (evidence) {
      await fs.mkdir(evidence, { recursive: true });
      await page.screenshot({ path: path.join(evidence, 'viewer-pinch-200.png'), scale: 'css' });
    }

    // When pan bounds allow it, keep the same world point beneath the moving centroid.
    await page.evaluate(() => setZoomLevel(3, { resetPan: true, immediate: true }));
    const { x, y } = await geometry();
    const worldBefore = await page.evaluate(({ x, y }) => {
      const anchor = getPointerZoomAnchor({ clientX: x, clientY: y });
      const scale = getResponsiveLogoScale();
      return { x: (anchor.x / scale - panOffset.x) / zoomLevel,
        y: (anchor.y / scale - panOffset.y) / zoomLevel };
    }, { x, y });
    await touch('touchStart', [[x - 40, y, 1], [x + 40, y, 2]]);
    await move([[x - 40, y, 1], [x + 40, y, 2]], [[x - 35, y + 12, 1], [x + 65, y + 12, 2]]);
    await touch('touchEnd', []);
    const worldAfter = await page.evaluate(({ x, y }) => {
      const anchor = getPointerZoomAnchor({ clientX: x, clientY: y });
      const scale = getResponsiveLogoScale();
      return { x: (anchor.x / scale - panOffset.x) / zoomLevel,
        y: (anchor.y / scale - panOffset.y) / zoomLevel };
    }, { x: x + 15, y: y + 12 });
    assert.ok(Math.abs(worldAfter.x - worldBefore.x) < 0.01);
    assert.ok(Math.abs(worldAfter.y - worldBefore.y) < 0.01);

    await page.evaluate(() => setZoomLevel(1, { resetPan: true, immediate: true }));
    await pinch(25, 150);
    assert.equal((await state()).level, 4);
    const exportAfter = await svg();
    assert.deepEqual(exportAfter, exportBefore, 'viewer transforms must not change the actual SVG');
    await pinch(150, 15);
    assert.equal((await state()).level, 1);

    // Add/remove a finger without a jump, then continue one-finger panning.
    await page.evaluate(() => setZoomLevel(2, { resetPan: true, immediate: true }));
    await touch('touchStart', [[x - 40, y, 1]]);
    await touch('touchMove', [[x - 30, y, 1]]);
    const one = await state();
    await touch('touchStart', [[x - 30, y, 1], [x + 40, y, 2]]);
    assert.deepEqual((await state()).pan, one.pan);
    await touch('touchMove', [[x - 40, y, 1], [x + 60, y, 2]]);
    const two = await state();
    // CDP lists the lifted contacts for a partial touchEnd.
    await touch('touchEnd', [[x + 60, y, 2]]);
    assert.deepEqual((await state()).pan, two.pan);
    await touch('touchMove', [[x - 20, y + 10, 1]]);
    assert.notDeepEqual((await state()).pan, two.pan);
    await touch('touchCancel', []);
    assert.equal((await state()).dragging, false);
    await pinch(40, 50);
    assert.equal((await state()).pageScale, 1);

    // Open sheet stays put during a pinch; an ordinary tap still dismisses it.
    await page.locator('#mobile-menu-toggle').tap();
    await page.locator('#mobile-controls-close').waitFor();
    await page.waitForTimeout(200);
    await pinch(30, 45);
    assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'true');
    const sheetCenter = await geometry();
    await page.touchscreen.tap(sheetCenter.x, sheetCenter.y);
    assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');

    const active = await pinch(40, 50, false);
    const rotationLevel = (await state()).level;
    await page.setViewportSize({ width: 844, height: 290 });
    await page.waitForTimeout(200);
    await touch('touchMove', active.map(([px, py, id]) => [px + 20, py, id]));
    assert.equal((await state()).level, rotationLevel, 'resize must cancel the old touch geometry');
    await touch('touchEnd', []);
    await page.locator('#zoom-reset-btn').tap();
    assert.equal((await state()).level, 1);
    await pinch(40, 60);
    assert.ok((await state()).level > 1.4);
    assert.equal((await state()).pageScale, 1);

    // Native page pinch remains available in the header, outside the viewer.
    await open();
    await touch('touchStart', [[145, 28, 1], [245, 28, 2]]);
    await move([[145, 28, 1], [245, 28, 2]], [[65, 28, 1], [325, 28, 2]]);
    await touch('touchEnd', []);
    await page.waitForTimeout(150);
    assert.ok((await state()).pageScale > 1.1);
    assert.equal((await state()).level, 1);
    assert.deepEqual(errors, []);
    console.log('chromium viewer touch passed: actual two-finger pinch, anchor/centroid, 100–400% limits, one/two-finger transitions, cancellation, sheet/tap, rotation, stable toolbar, identical SVG and native page pinch outside viewer');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
