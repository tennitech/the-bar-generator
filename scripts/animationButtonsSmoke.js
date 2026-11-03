const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
async function main() {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  try {
    for (const width of [1440, 768, 390, 320, 1800]) {
      const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: width < 800 });
      await page.goto(`${base}/generator/ruler/`);
      await page.waitForFunction(() => typeof openHeaderLogoAnimation === 'function');
      await page.evaluate(() => openHeaderLogoAnimation());
      await page.waitForFunction(() => document.querySelector('#logo-animation-close')?.disabled === false);
      async function check() {
        const boxes = await page.evaluate(() => ['#logo-animation-replay', '#logo-animation-close', '#mobile-menu-toggle'].map(selector => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right };
        }));
        const [replay, close, menu] = boxes;
        assert.deepEqual(close, menu);
        assert.equal(close.x - replay.right, 10);
        assert.equal(replay.width, close.width);
        assert.equal(replay.height, close.height);
        assert.equal(replay.y, close.y);
        assert.ok(replay.x >= 0 && close.right <= page.viewportSize().width);
      }
      await check();
      if (width === 1440) await page.screenshot({ path: '/tmp/animation-buttons-fixed-' + engine + '.png' });
      await page.waitForTimeout(1000);
      await page.locator('#logo-animation-replay').click();
      await page.waitForTimeout(1000);
      await check();
      await page.setViewportSize({ width: width === 320 ? 1800 : 320, height: 800 });
      await page.waitForTimeout(150);
      await check();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#logo-animation-overlay').hidden);
      await page.evaluate(() => openHeaderLogoAnimation());
      await page.waitForFunction(() => !document.querySelector('#logo-animation-close').disabled);
      await check();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.logo_animation_static').waitFor();
      assert.equal(await page.locator('#logo-animation-replay').isVisible(), false);
      await page.locator('#logo-animation-close').click();
      await page.waitForFunction(() => document.querySelector('#logo-animation-overlay').hidden);
      await page.close();
    }
    console.log(`${engine}: grouped animation buttons pass at 1800/1440/768/390/320px, resize, Replay, Escape, reopen and reduced motion.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
