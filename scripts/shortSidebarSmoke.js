const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8027';
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/rpi-short-sidebar';
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 360 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/solid/`); await page.waitForFunction(() => window.barShareController);
    const style = page.locator('#style-select + button');
    const theme = page.locator('#color-mode-select + button');
    const reachable = async locator => {
      await locator.scrollIntoViewIfNeeded();
      assert.ok(await locator.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        return element === hit || element.contains(hit);
      }), 'control must be reachable without footer interception');
    };
    for (const size of [{ width: 1024, height: 360 }, { width: 1280, height: 500 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      if (size.width === 320) await page.locator('#mobile-menu-toggle').click();
      for (const family of ['lunar', 'circles', 'wave-quantum', 'solid']) {
        await page.selectOption('#style-select', family, { force: true });
        await reachable(style); await style.click();
        await page.keyboard.press('Home'); await page.keyboard.press('End'); await page.keyboard.press('Home'); await page.keyboard.press('Escape');
        await reachable(theme); await theme.click();
        await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
        assert.equal(await page.inputValue('#color-mode-select'), 'white');
        await reachable(theme); await theme.click(); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
        assert.equal(await page.inputValue('#color-mode-select'), 'black');
        await page.screenshot({ path: `${evidence}/${engine}-${family}-${size.width}x${size.height}-controls.png` });
        const card = page.locator('#bar-information');
        await card.scrollIntoViewIfNeeded(); assert.equal(await card.isVisible(), true);
        assert.ok((await page.locator('#bar-information-description').textContent()).length > 100);
        const report = page.locator('#report-problem-btn'); await reachable(report); await report.click();
        await page.keyboard.press('Escape');
        // The report dialog intentionally dismisses the narrow-screen drawer.
        if (size.width === 320 && !await page.locator('.app-sidebar').evaluate(sidebar => sidebar.classList.contains('active'))) {
          await page.locator('#mobile-menu-toggle').click();
          await report.scrollIntoViewIfNeeded();
        }
        await page.screenshot({ path: `${evidence}/${engine}-${family}-${size.width}x${size.height}-card.png` });
        await reachable(theme); await theme.focus(); await page.keyboard.press('Enter');
        assert.equal(await theme.getAttribute('aria-expanded'), 'true'); await page.keyboard.press('Escape');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.deepEqual(errors, []);
    console.log(`${engine}: Artemis/Circles/Quantum/Solid at 1024x360, 1280x500 and 320x568: theme/style pointer and keyboard, two-way scrolling, intact card/report action and no interception passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
