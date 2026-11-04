const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    for (const width of [1280, 390]) for (const route of ['/', '/generator/solid/']) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      if (engine === 'chromium' && Number(process.env.RPI_CPU_THROTTLE) > 1) {
        const session = await page.context().newCDPSession(page);
        await session.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.RPI_CPU_THROTTLE) });
      }
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + route);
      await page.waitForFunction(() => window.AsciiEntrance?.lastPreparation);
      const result = await page.evaluate(() => ({ ...AsciiEntrance.lastPreparation }));
      results.push({ width, route, ...result });
      if (result.outcome === 'ready') {
        const overlay = page.locator('.entrance_ascii');
        assert.equal(await overlay.getAttribute('aria-hidden'), 'true');
        assert.equal(await overlay.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
        await page.screenshot({ path: `/tmp/ascii-${engine}-${width}-${route === '/' ? 'home' : 'generator'}.png` });
      }
      await page.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await page.locator('.entrance_ascii,.entrance_ascii-artwork,.entrance_ascii-text,.is-ascii-original').count(), 0);
      await page.reload();
      await page.waitForFunction(() => window.AsciiEntrance?.lastPreparation);
      await page.keyboard.press('Tab');
      await page.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await page.locator('.entrance_ascii,.entrance_ascii-artwork,.entrance_ascii-text,.is-ascii-original').count(), 0);
      await page.reload();
      await page.waitForFunction(() => window.AsciiEntrance?.lastPreparation);
      await page.setViewportSize({ width: width - 10, height: 780 });
      await page.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await page.locator('.entrance_ascii,.entrance_ascii-artwork,.entrance_ascii-text,.is-ascii-original').count(), 0);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForTimeout(800);
      assert.equal(await page.locator('.entrance_ascii,.entrance_ascii-artwork,.entrance_ascii-text').count(), 0);
      assert.equal(await page.evaluate(() => PageEntrance.isActive()), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(JSON.stringify({ engine, results }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
