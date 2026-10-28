// Host-browser preference/renderer regression; this is not a physical Windows/Android test.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit, devices } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_MOTION_EVIDENCE;
const frames = async (page, count = 12) => page.evaluate(async count => {
  for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
}, count);
async function main() {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  let cases = 0;
  try {
    for (const touch of (process.argv.includes('--iframe-only') || process.argv.includes('--preference-change-only') ? [] : [false, true])) for (const reduce of [false, true]) for (const fallback of [false, true]) {
      const page = await browser.newPage({ ...(touch ? devices['Pixel 7'] : { viewport: { width: 1440, height: 900 } }),
        reducedMotion: reduce ? 'reduce' : 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      if (fallback) await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          return /webgl/.test(kind) ? null : getContext.call(this, kind, ...args);
        };
      });
      for (const style of ['ruler', 'ticker', 'waveform']) {
        await page.goto(`${base}/generator/${style}/`);
        await page.locator('#p5-container canvas').waitFor();
        await page.waitForFunction(() => !window.PageEntrance?.isActive?.());
        assert.equal(await page.locator(`#${style}-motion-toggle`).isChecked(), !reduce);
        if (fallback) assert.equal(await page.evaluate(() => liveCanvasUsesWebGL), false);
        const phase = () => page.evaluate(() => liveMotionPhase);
        const start = await phase();
        await frames(page);
        assert.equal((await phase()) === start, reduce, `${style}: startup preference`);
        await page.evaluate(style => {
          const toggle = document.getElementById(`${style}-motion-toggle`);
          toggle.checked = true; toggle.dispatchEvent(new Event('change', { bubbles: true }));
        }, style);
        const playing = await phase(); await frames(page);
        assert.notEqual(await phase(), playing, `${style}: explicit playback must advance even with reduced motion`);
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        const hidden = await phase(); await frames(page);
        assert.equal(await phase(), hidden);
        await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
        await frames(page); assert.notEqual(await phase(), hidden, `${style}: background resume`);
        await page.evaluate(style => setMotionEnabledForStyle(style, false), style);
        const paused = await phase(); await frames(page); assert.equal(await phase(), paused);
        cases++;
      }
      await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
      if (reduce) {
        const play = page.getByRole('button', { name: 'Play animation once' });
        await play.waitFor();
        assert.equal(await page.locator('.logo_animation_frame').count(), 0);
        if (evidence) {
          await fs.mkdir(evidence, { recursive: true });
          await page.screenshot({ path: `${evidence}/${engine}-${touch ? 'touch' : 'desktop'}-${fallback ? '2d' : 'gpu'}-still.png` });
        }
        await page.locator('#logo-animation-close').focus();
        await page.keyboard.press('Tab');
        assert.equal(await play.evaluate(el => el === document.activeElement), true);
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#logo-animation-close').evaluate(el => el === document.activeElement), true);
      }
      const projection = page.frameLocator('.logo_animation_frame').locator('#animation-projection');
      await page.waitForFunction(() => document.querySelector('#logo-animation-close')?.disabled === false);
      await projection.waitFor();
      await projection.filter({ hasText: /\S/ }).waitFor();
      const content = await projection.textContent();
      await page.waitForTimeout(200);
      assert.notEqual(await projection.textContent(), content, 'ASCII projection must actually animate');
      await page.keyboard.press('Escape');
      await page.locator('.logo_animation_overlay').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('#brand-title').evaluate(el => el === document.activeElement), true);
      if (reduce) {
        await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
        await page.getByRole('button', { name: 'Play animation once' }).waitFor();
        assert.equal(await page.locator('.logo_animation_frame').count(), 0, 'one-run consent must reset');
        await page.keyboard.press('Escape');
      }
      assert.deepEqual(errors, []);
      await page.close();
      cases++;
      console.log(`${engine}: touch=${touch} reduce=${reduce} fallback=${fallback} passed`);
    }
    const preferences = await browser.newPage({ reducedMotion: 'no-preference' });
    await preferences.goto(`${base}/generator/ruler/`);
    await preferences.locator('#p5-container canvas').waitFor();
    await preferences.waitForFunction(() => !window.PageEntrance?.isActive?.());
    await preferences.emulateMedia({ reducedMotion: 'reduce' });
    await preferences.waitForFunction(() => ['ruler', 'ticker', 'waveform'].every(style =>
      !document.getElementById(`${style}-motion-toggle`).checked));
    const paused = await preferences.evaluate(() => liveMotionPhase);
    await frames(preferences);
    assert.equal(await preferences.evaluate(() => liveMotionPhase), paused);
    await preferences.emulateMedia({ reducedMotion: 'no-preference' });
    await frames(preferences);
    assert.equal(await preferences.evaluate(() => liveMotionPhase), paused, 'preference relaxation must not silently restart loops');
    await preferences.evaluate(() => setMotionEnabledForStyle('ruler', true));
    await frames(preferences);
    assert.notEqual(await preferences.evaluate(() => liveMotionPhase), paused, 'explicit restart remains available');
    await preferences.close();
    console.log(`${engine}: changed OS preference pauses all repeating styles; relaxing it preserves pause and explicit restart works.`);
    // A same-origin embed verifies preference inheritance and nested ASCII playback;
    // it is not a test of Frontify itself.
    const host = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
    await host.route('**/motion-test-host', route => route.fulfill({ contentType: 'text/html',
      body: `<iframe title="Embedded generator" src="${base}/generator/ruler/" style="width:100%;height:800px"></iframe>` }));
    await host.goto(`${base}/motion-test-host`);
    const embedded = host.frameLocator('iframe[title="Embedded generator"]');
    await embedded.locator('#p5-container canvas').waitFor();
    assert.equal(await embedded.locator('#ruler-motion-toggle').isChecked(), false);
    await embedded.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
    await embedded.getByRole('button', { name: 'Play animation once' }).click();
    const ascii = embedded.frameLocator('.logo_animation_frame').locator('#animation-projection');
    await ascii.filter({ hasText: /\S/ }).waitFor();
    const first = await ascii.textContent(); await host.waitForTimeout(200);
    assert.notEqual(await ascii.textContent(), first, 'embedded ASCII must animate after explicit play');
    await host.close();
    console.log(`${engine}: same-origin embedded reduced-motion opt-in and nested ASCII playback passed (Frontify itself unverified).`);
    console.log(`${engine}: ${cases} preference/playback/intro cases passed (desktop and emulated touch, normal/reduced motion, WebGL and forced 2D). Physical Windows/Android unverified.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
