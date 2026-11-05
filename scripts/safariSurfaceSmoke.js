/* WebKit checks page-provided Safari color hints, not native Safari chrome. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { webkit, chromium, devices } = require('playwright');
const engine = process.env.RPI_BROWSER || 'webkit';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await ({ webkit, chromium }[engine]).launch({ headless: true });
  try {
    const errors = [];
    for (const viewport of [{ width: 390, height: 664 }, { width: 844, height: 390 }]) {
      for (const style of ['solid', 'lunar']) {
        const page = await browser.newPage({ ...devices['iPhone 13'], viewport, reducedMotion: 'reduce' });
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + '/generator/' + style + '/');
        await page.locator('#p5-container canvas').waitFor();
        await page.waitForFunction(() => !window.PageEntrance?.isActive());
        await page.locator('#mobile-menu-toggle').tap();
        const themes = await page.locator('#color-mode-select option').evaluateAll(options =>
          options.filter(option => !option.disabled && !option.hidden).map(option => option.value));
        for (const theme of themes) {
          await page.locator('#color-mode-select').selectOption(theme);
          for (const open of [true, false, true]) {
            if ((await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded')) !== String(open)) {
              await page.locator('#mobile-menu-toggle').tap();
            }
            await page.waitForFunction(() => !document.querySelector('.theme_scan'));
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const state = await page.evaluate(open => ({
              top: getComputedStyle(document.querySelector('.app-header')).backgroundColor,
              bottom: getComputedStyle(document.querySelector(open ? '#app-sidebar' : '.logo-container')).backgroundColor,
              hint: document.querySelector('meta[name="theme-color"]').content,
              root: getComputedStyle(document.documentElement).backgroundColor,
              body: getComputedStyle(document.body).backgroundColor,
            }), open);
            assert.equal(state.hint, state.top, JSON.stringify(state));
            assert.equal(state.root, state.top, JSON.stringify(state));
            assert.equal(state.body, state.bottom, JSON.stringify(state));
            if (theme === 'black' && open) assert.notEqual(state.top, state.bottom, 'white header and gray sheet remain independent');
          }
          if (process.env.RPI_MOBILE_EVIDENCE && theme === 'black') {
            await fs.mkdir(process.env.RPI_MOBILE_EVIDENCE, { recursive: true });
            await page.screenshot({ path: process.env.RPI_MOBILE_EVIDENCE + '/' + engine + '-' + style + '-' + viewport.width + '.png' });
          }
        }
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
        console.log(engine + ': ' + viewport.width + ' ' + style + ' ' + themes.join(', ') + ' independent top/bottom colors, repeated toggles and Escape passed');
        await page.close();
      }
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
