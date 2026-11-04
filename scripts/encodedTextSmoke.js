const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
(async () => {
  const engine = process.env.RPI_BROWSER || 'chromium';
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true, ...(engine === 'chromium' ? { ...(process.env.RPI_CHROMIUM_PATH ? { executablePath: process.env.RPI_CHROMIUM_PATH } : {}) } : {}) });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(10000);
      for (const kind of ['binary', 'morse']) {
        await page.goto(`${process.env.RPI_SITE_URL || 'http://127.0.0.1:8765'}/generator/${kind}/?${kind}Text=hell`);
        await page.waitForFunction(() => window.barShareController && window.randomizeHistory && document.querySelector('#p5-container canvas'));
        const input = page.locator(`#${kind}-input`);
        assert.equal(await input.getAttribute('aria-invalid'), 'true');
        assert.equal(await page.evaluate(() => buildCurrentBarPatternSVGFragment()), '');
        if (viewport.width < 900 && await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded') === 'false') await page.locator('#mobile-menu-toggle').click();
        await input.fill('');
        await input.pressSequentially('hello');
        await page.waitForFunction(kind => document.getElementById(`${kind}-input`).getAttribute('aria-invalid') === 'false', kind);
        assert.ok((await page.evaluate(() => buildCurrentBarPatternSVGFragment())).length > 0);
        await input.fill('abcdefghijklm');
        assert.equal(await input.inputValue(), 'abcdefghij');
        await input.fill('hell');
        await input.press('ArrowLeft');
        assert.equal(await input.getAttribute('aria-invalid'), 'true');
        assert.equal(await page.evaluate(() => buildCurrentBarPatternSVGFragment()), '');
        await page.evaluate(() => window.URLState.flush());
        await page.reload();
        await page.waitForFunction(() => window.barShareController && window.randomizeHistory && document.querySelector('#p5-container canvas'));
        assert.equal(await input.getAttribute('aria-invalid'), 'true');
        assert.equal(await page.evaluate(() => buildCurrentBarPatternSVGFragment()), '');
        if (viewport.width < 900 && await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded') === 'false') await page.locator('#mobile-menu-toggle').click();
        await input.fill('');
        await input.pressSequentially('hello');
        assert.ok((await page.evaluate(() => buildCurrentBarPatternSVGFragment())).length > 0);
        console.log(`${engine} ${viewport.width} ${kind}: blocked initial URL, recovery, limit, repeated key, reload, preview/export geometry passed`);
      }
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
