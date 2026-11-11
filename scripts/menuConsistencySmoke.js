/* Run only in a permitted browser environment: RPI_SITE_URL=http://127.0.0.1:8000
   RPI_EVIDENCE_DIR=/tmp/rpi-menu-consistency node scripts/menuConsistencySmoke.js */
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/rpi-menu-consistency';
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  try {
    for (const [width, height] of [[1440, 1000], [390, 844], [320, 568], [844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/solid/?colorMode=blue`);
      await page.locator('#p5-container canvas').waitFor();
      await page.waitForFunction(() => window.barShareController);
      const revealSidebar = async () => {
        if (!await page.locator('#secondary-color-help').isVisible()) await page.locator('#mobile-menu-toggle').click();
      };
      for (const theme of ['blue', 'gold', 'gray-on-black']) {
        await page.selectOption('#color-mode-select', theme);
        await revealSidebar();
        await page.locator('#secondary-color-help').click();
        const color = await inspect(page, '#secondary-color-dialog');
        assert.equal(await page.locator('#secondary-color-title').evaluate(e => document.activeElement === e), true);
        await page.screenshot({ path: path.join(evidence, `${engine}-${width}-${theme}-color.png`) });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#secondary-color-help').evaluate(e => document.activeElement === e), true);
        await page.locator('#sidebar-more-toggle').click();
        await page.locator('#keyboard-shortcuts-trigger').click();
        const shortcuts = await inspect(page, '#keyboard-shortcuts-dialog');
        for (const key of ['width', 'radius', 'background', 'border', 'backdrop', 'blur', 'padding', 'titleSize']) assert.equal(shortcuts[key], color[key], key);
        assert.equal(await page.locator('#keyboard-shortcuts-title').evaluate(e => document.activeElement === e), true);
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          assert.equal(await page.locator('#keyboard-shortcuts-dialog').evaluate(e => e.contains(document.activeElement)), true);
        }
        await page.screenshot({ path: path.join(evidence, `${engine}-${width}-${theme}-shortcuts.png`) });
        await page.locator('#keyboard-shortcuts-close').click();
        assert.equal(await page.locator('#sidebar-more-toggle').evaluate(e => document.activeElement === e), true);
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
async function inspect(page, selector) {
  return page.locator(selector).evaluate(element => {
    const s = getComputedStyle(element), back = getComputedStyle(element, '::backdrop');
    const box = element.getBoundingClientRect();
    if (box.x < 0 || box.right > innerWidth + 1 || box.y < 0 || box.bottom > innerHeight + 1) throw Error('Dialog exceeds viewport');
    if (element.scrollWidth > element.clientWidth + 1) throw Error('Horizontal dialog overflow');
    return { width: s.width, radius: s.borderRadius, background: s.backgroundColor,
      border: s.borderColor, backdrop: back.backgroundColor, blur: back.backdropFilter,
      padding: getComputedStyle(element.querySelector('.report_dialog-panel')).padding,
      titleSize: getComputedStyle(element.querySelector('.report_dialog-title')).fontSize };
  });
}
