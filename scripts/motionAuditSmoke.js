// Confirmed-incident audit: browser preference simulation, not an old-Chrome/device test.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_MOTION_EVIDENCE;
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__auditCompletions = 0;
      addEventListener('message', event => {
        if (event.origin === location.origin && event.data?.type === 'rpi-logo-animation-complete') window.__auditCompletions++;
      });
    });
    await page.goto(`${base}/generator/ruler/`);
    await page.waitForFunction(() => window.barShareController);
    assert.equal(await page.isChecked('#ruler-motion-toggle'), false);
    const phase = await page.evaluate(() => liveMotionPhase);
    await settle(page);
    assert.equal(await page.evaluate(() => liveMotionPhase), phase);
    assert.equal(await page.evaluate(() => PageEntrance.isActive()), false);
    assert.equal(await page.evaluate(() => {
      ThemeMotion.run(() => {});
      return document.querySelectorAll('.theme_scan').length;
    }), 0);

    // Replacing a focused still-view control must retain dialog focus.
    await page.locator('#header-logo-preview').tap();
    const play = page.getByRole('button', { name: 'Play animation once' });
    await play.waitFor();
    await play.focus();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await settle(page);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'logo-animation-close');
    await page.locator('#logo-animation-replay').focus();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await play.waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'logo-animation-close');
    await page.keyboard.press('Tab');
    assert.equal(await play.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'logo-animation-close');
    results.push({ preferenceReplacementFocus: true, tabCycle: true, reducedDefaults: true });

    // A full one-run playback must survive relaxation without restarting and close once.
    await play.tap();
    const projection = page.frameLocator('.logo_animation_frame').locator('#animation-projection');
    await projection.filter({ hasText: /\S/ }).waitFor();
    await page.evaluate(() => { window.__auditFrame = document.querySelector('.logo_animation_frame'); });
    const heldPhase = await page.evaluate(() => liveMotionPhase);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await settle(page);
    assert.equal(await page.evaluate(() => document.querySelector('.logo_animation_frame') === window.__auditFrame), true);
    assert.equal(await page.evaluate(() => liveMotionPhase), heldPhase);
    await page.locator('.logo_animation_overlay').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.__auditCompletions), 1);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'header-logo-preview');
    assert.equal(await page.isChecked('#ruler-motion-toggle'), false, 'explicit intro playback must not enable bar loops');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.logo_animation_frame').count(), 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#header-logo-preview').tap();
    await play.waitFor();
    assert.equal(await page.locator('.logo_animation_frame').count(), 0);
    await page.keyboard.press('Escape');
    await page.locator('.logo_animation_overlay').waitFor({ state: 'hidden' });
    results.push({ fullOneRunCompletedOnce: true, relaxationKeepsFrame: true, reopenResets: true, noLoopOptInLeak: true });

    // Existing no-preference autoplay completes normally and preserves loop transport.
    const normal = await browser.newPage({ reducedMotion: 'no-preference' });
    normal.on('pageerror', error => errors.push(error.message));
    await normal.goto(`${base}/generator/ruler/`);
    await normal.waitForFunction(() => window.barShareController && !window.PageEntrance?.isActive?.());
    assert.equal(await normal.isChecked('#ruler-motion-toggle'), true);
    await normal.locator('#header-logo-preview').click();
    await normal.locator('.logo_animation_frame').waitFor();
    await normal.locator('.logo_animation_overlay').waitFor({ state: 'hidden' });
    assert.equal(await normal.isChecked('#ruler-motion-toggle'), true);
    const resumed = await normal.evaluate(() => liveMotionPhase);
    await settle(normal);
    await normal.waitForFunction(value => liveMotionPhase !== value, resumed);
    assert.equal(await normal.evaluate(() => document.activeElement.id), 'header-logo-preview');
    results.push({ normalAutoplayAndCompletion: true, normalLoopResume: true });
    await normal.close();
    // Decorative landing motion follows the same OS preference without an override.
    await page.goto(`${base}/`);
    await page.waitForFunction(() => document.querySelector('.marquee_item:not(.is-measure)')?.style.transform);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => Array.from(document.images).every(image => image.complete));
    await page.waitForTimeout(100);
    const item = page.locator('.marquee_item:not(.is-measure)').first();
    const stillTransform = await item.evaluate(el => el.style.transform);
    await page.waitForTimeout(150);
    assert.equal(await item.evaluate(el => el.style.transform), stillTransform);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(value => document.querySelector('.marquee_item:not(.is-measure)').style.transform !== value, stillTransform);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    const stopped = await item.evaluate(el => el.style.transform);
    await page.waitForTimeout(150);
    assert.equal(await item.evaluate(el => el.style.transform), stopped);
    results.push({ marqueeReducedDefault: true, marqueePreferenceChanges: true });
    assert.deepEqual(errors, []);
    await page.close();
    if (evidence) {
      await fs.mkdir(evidence, { recursive: true });
      await fs.writeFile(`${evidence}/${engine}-motion-audit.json`, JSON.stringify({ version: browser.version(), results, errors }, null, 2));
    }
    console.log(`${engine}: reduced defaults, focus/Tab, full single-run completion, preference relaxation, reopening, normal autoplay and loop resume passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
