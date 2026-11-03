/* Real-HTTP native pointer, click, keyboard and reduced-motion regressions. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-drag-evidence';
const axis = { x: Math.cos(17 * Math.PI / 180), y: Math.sin(17 * Math.PI / 180) };
async function ready(page) {
  await page.waitForFunction(() => document.images.length > 100
    && [...document.images].every(image => image.complete && image.naturalWidth > 0)
    && !window.PageEntrance?.isActive());
  await page.evaluate(() => document.fonts.ready);
}
async function target(page, direction = null) {
  const point = await page.evaluate(direction => {
    document.querySelector('#drag-test')?.removeAttribute('id');
    for (let y = 70; y < Math.min(innerHeight - 200, 400); y += 12) {
      for (let x = 80; x < Math.min(innerWidth - 220, 600); x += 20) {
        const a = document.elementFromPoint(x, y)?.closest('.bar_asset_wrap');
        const row = a?.closest('.marquee_row');
        if (!a || a.closest('.is-measure') || (direction && !row.classList.contains(direction))) continue;
        if (![-12, 12].every(dx => [-6, 6].every(dy => document.elementFromPoint(x + dx, y + dy)?.closest('.bar_asset_wrap') === a))) continue;
        a.id = 'drag-test';
        return { x, y, href: a.href };
      }
    }
  }, direction);
  assert.ok(point, 'reachable interior point');
  return point;
}
const position = page => page.locator('#drag-test').evaluate(a => new DOMMatrixReadOnly(a.closest('.marquee_track').style.transform).m41);
async function move(page, point, distance, steps = 8) {
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(point.x + axis.x * distance * i / steps, point.y + axis.y * distance * i / steps);
    await page.waitForTimeout(15);
  }
}
async function afterFrames(page, count = 8) {
  await page.evaluate(count => new Promise(resolve => {
    let frames = 0;
    const next = () => ++frames >= count ? resolve() : requestAnimationFrame(next);
    requestAnimationFrame(next);
  }), count);
}
async function atRest(page) {
  const before = await position(page); await page.waitForTimeout(180);
  assert.equal(await position(page), before, 'held or hovered lane is exactly still');
}
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [], errors = [];
  await fs.mkdir(evidence, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => { Math.random = () => 0.37; });
    await page.goto(base); await ready(page);
    await page.evaluate(() => document.addEventListener('pointerup', () => {
      const a = document.querySelector('#drag-test');
      window.dragRelease = { x: new DOMMatrixReadOnly(a.closest('.marquee_track').style.transform).m41,
        dragging: a.closest('.marquee_row').classList.contains('is-dragging') };
    }, true));
    for (const direction of ['is-forward', 'is-backward']) {
      await page.mouse.move(1400, 880);
      const point = await target(page, direction);
      await page.mouse.move(point.x, point.y); await atRest(page);
      const before = await position(page);
      await page.mouse.down(); await move(page, point, 160);
      await page.mouse.up();
      const released = await page.evaluate(() => window.dragRelease);
      assert.ok(Math.abs(released.x - before - 160) < 1, 'drag projects exactly along lane');
      assert.equal(released.dragging, true);
      assert.equal(page.url(), `${base}/`, 'a drag never navigates');
      const release = await position(page);
      await afterFrames(page);
      assert.deepEqual(errors, [], 'no runtime errors during a throw');
      const coast = await position(page);
      assert.ok(coast - release > 4, `release has positive momentum: ${coast - release}`);
      await page.waitForTimeout(1150);
      const settled = await position(page);
      assert.ok(settled - release < 350, 'fling distance is bounded');
      // The pointer might now be in a gutter: move onto the lane to stop autoplay.
      const hovered = await target(page, direction); await page.mouse.move(hovered.x, hovered.y);
      await atRest(page);
      await page.screenshot({ path: path.join(evidence, `${engine}-${direction}-hover.png`), scale: 'css' });
      results.push({ direction, drag: 160, coast: coast - release, totalCoast: settled - release });
    }
    // Changing motion preferences does not forget the stationary hover target.
    await page.emulateMedia({ reducedMotion: 'reduce' }); await atRest(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await atRest(page);
    // Re-grabbing moving content cancels its existing throw immediately.
    let point = await target(page); await page.mouse.move(point.x, point.y);
    await page.mouse.down(); await move(page, point, 120); await page.mouse.up();
    await page.waitForTimeout(60);
    point = await target(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
    await atRest(page);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await page.locator('.is-pressed,.is-dragging').count(), 0, 'window interruption clears drag');
    await page.mouse.up();
    assert.equal(page.url(), `${base}/`);
    results.push({ repeatedDragAndBlur: 'passed' });

    // Resize and lost capture must not leave a lane in the grabbing state.
    point = await target(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
    await move(page, point, 40);
    await page.setViewportSize({ width: 1300, height: 860 }); await page.waitForTimeout(100);
    assert.equal(await page.locator('.is-pressed,.is-dragging').count(), 0);
    await page.mouse.up();
    point = await target(page); await page.mouse.move(point.x, point.y); await page.mouse.down(); await move(page, point, 40);
    await page.locator('#drag-test').evaluate(a => a.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1, pointerType: 'mouse' })));
    assert.equal(await page.locator('.is-pressed,.is-dragging').count(), 0);
    await page.mouse.up();
    results.push({ resizeAndCancel: 'passed' });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    point = await target(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
    const reducedBefore = await position(page); await move(page, point, -70); await page.mouse.up();
    assert.ok(Math.abs(await position(page) - reducedBefore + 70) < 1);
    await atRest(page); assert.equal(page.url(), `${base}/`);
    results.push({ reducedMotion: 'direct drag with no coast' });

    // Real native click with harmless hand jitter opens the exact configured sample.
    point = await target(page); await page.mouse.move(point.x, point.y); await page.mouse.down();
    await page.mouse.move(point.x + 2, point.y + 1); await page.mouse.up();
    await page.waitForURL(point.href); await page.locator('#p5-container canvas').waitFor();
    assert.equal(page.url(), point.href);
    await page.goBack(); await ready(page);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.className), 'marquee_skip-link');
    await page.keyboard.press('Enter'); await page.waitForURL(/\/generator\/solid\/$/); await page.locator('#p5-container canvas').waitFor();
    await page.goBack(); await ready(page); await page.goForward(); await page.waitForURL(/\/generator\/solid\/$/); await page.locator('#p5-container canvas').waitFor();
    results.push({ nativeClickKeyboardAndHistory: 'passed' });
    await page.close();

    const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    touch.on('pageerror', error => errors.push(error.message));
    touch.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await touch.addInitScript(() => { Math.random = () => 0.37; });
    await touch.goto(base); await ready(touch);
    const touchPoint = await target(touch);
    assert.equal(await touch.locator('#drag-test').evaluate(a => getComputedStyle(a).touchAction), 'pan-y pinch-zoom');
    assert.equal(await touch.locator('#drag-test').evaluate(a => a.draggable), false);
    if (engine === 'chromium') {
      const cdp = await touch.context().newCDPSession(touch);
      const start = await position(touch);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchPoint.x, y: touchPoint.y, id: 1 }] });
      for (let i = 1; i <= 8; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchPoint.x + axis.x * 90 * i / 8, y: touchPoint.y + axis.y * 90 * i / 8, id: 1 }] });
        await touch.waitForTimeout(15);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.ok(Math.abs(await position(touch) - start - 90) < 2, 'native touch drags along lane');
      assert.equal(touch.url(), `${base}/`); await atRest(touch);
      const vertical = await target(touch), verticalBefore = await position(touch);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vertical.x, y: vertical.y, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vertical.x, y: vertical.y + 90, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.equal(await position(touch), verticalBefore);
      assert.equal(await touch.locator('.is-pressed,.is-dragging').count(), 0);
      results.push({ nativeTouchDragAndVerticalCancel: 'passed' });
    }
    const tap = await target(touch); await touch.touchscreen.tap(tap.x, tap.y); await touch.waitForURL(tap.href); await touch.locator('#p5-container canvas').waitFor();
    results.push({ nativeTouchTap: 'passed', physicalTouchPinch: 'not tested' });
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(evidence, `${engine}-results.json`), JSON.stringify({ engine, results, errors }, null, 2));
    console.log(JSON.stringify({ engine, results, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
