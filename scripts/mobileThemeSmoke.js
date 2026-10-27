const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { webkit, chromium, devices } = require('playwright');
const browserName = process.env.RPI_BROWSER || 'webkit';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_MOBILE_EVIDENCE;
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function main() {
  const browser = await ({ webkit, chromium }[browserName]).launch({ headless: true });
  try {
    const page = await browser.newPage({ ...devices['iPhone 13'], viewport: { width: 390, height: 664 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    async function checkSurface(open) {
      await settle(page);
      const state = await page.evaluate(open => {
        const header = document.getElementById('header-logo-preview');
        const panel = document.getElementById('app-sidebar');
        const surface = open ? panel : document.querySelector('.logo-container');
        const expected = document.createElement('span');
        expected.style.color = colors[currentColorMode].fg;
        document.body.append(expected);
        const expectedColor = getComputedStyle(expected).color;
        expected.remove();
        const motionCanvas = header.querySelector('canvas');
        let paintedColor = null;
        let barColor = null;
        if (motionCanvas) {
          const data = motionCanvas.getContext('2d').getImageData(0, 0, motionCanvas.width, motionCanvas.height).data;
          for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 255) {
            paintedColor = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
            break;
          }
          const barStart = Math.floor(REFERENCE_BAR_Y * 2) * motionCanvas.width * 4;
          for (let i = barStart; i < data.length; i += 4) if (data[i + 3] === 255) {
            barColor = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
            break;
          }
        } else {
          const shapes = [...header.querySelectorAll('svg path,svg rect,svg polygon,svg circle')]
            .filter(e => !e.closest('defs,clipPath,mask'));
          if (shapes[3]) barColor = getComputedStyle(shapes[3]).fill;
          paintedColor = getComputedStyle(header.querySelector('svg path')).fill;
        }
        return { expectedColor, headerColor: getComputedStyle(header).color, paintedColor, barColor,
          surface: getComputedStyle(surface).backgroundColor,
          hint: document.querySelector('meta[name="theme-color"]').content,
          root: getComputedStyle(document.documentElement).backgroundColor,
          body: getComputedStyle(document.body).backgroundColor,
          pageScale: visualViewport.scale, scroll: [scrollX, scrollY],
          mode: currentColorMode, transition: getComputedStyle(panel).transitionDuration };
      }, open);
      assert.equal(state.headerColor, state.expectedColor, JSON.stringify(state));
      assert.equal(state.paintedColor, state.expectedColor, JSON.stringify(state));
      // Canvas coverage/premultiplication can round an opaque edge by one
      // 8-bit channel value. CSS and SVG fill assertions remain exact.
      const actualBar = state.barColor?.match(/\d+/g).map(Number);
      const expectedBar = state.expectedColor.match(/\d+/g).map(Number);
      assert.ok(actualBar && actualBar.every((channel, i) => Math.abs(channel - expectedBar[i]) <= 1), JSON.stringify(state));
      assert.equal(state.hint, state.surface, JSON.stringify(state));
      assert.equal(state.body, state.surface);
      assert.equal(state.root, state.surface);
      assert.equal(state.pageScale, 1);
      assert.deepEqual(state.scroll, [0, 0]);
      assert.equal(parseFloat(state.transition), 0, 'touch sheet layout must not animate under focus');
    }
    for (const viewport of [{ width: 390, height: 664 }, { width: 844, height: 290 }]) {
      await page.setViewportSize(viewport);
      for (const style of ['solid', 'ruler', 'wave-quantum', 'lunar']) {
      await page.goto(`${base}/generator/${style}/`);
      await page.locator('#p5-container canvas').waitFor();
      const themes = style === 'lunar' ? ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar']
        : ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray'];
      for (const theme of themes) {
        await page.locator('#mobile-menu-toggle').tap();
        await page.locator('#color-mode-select').selectOption(theme);
        await checkSurface(true);
        if (evidence && theme === 'gray') await page.screenshot({ path: path.join(evidence, `${browserName}-${style}-gray-${viewport.width}-open.png`), scale: 'css' });
        assert.equal(await page.locator('#color-mode-select').inputValue(), theme);
        await page.locator('#mobile-controls-close').tap();
        await checkSurface(false);
      }
      const selected = await page.locator('#color-mode-select').inputValue();
      await page.reload();
      await page.locator('#p5-container canvas').waitFor();
      assert.equal(await page.locator('#color-mode-select').inputValue(), selected, 'native values/URLs survive reload');
      await checkSurface(false);
      console.log(`${browserName} ${viewport.width} ${style}: all available themes, painted header parity, open/close surfaces and reload passed`);
    }
    }
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto(`${base}/generator/binary/`);
    await page.locator('#p5-container canvas').waitFor();
    const labels = await page.locator('.control-select').evaluateAll(selects => selects.flatMap(select =>
      [...select.options].map(option => ({ value: option.value, label: option.textContent.trim() }))));
    assert.ok(labels.every(({ label }) => label !== label.toUpperCase()), 'native option labels use natural case');
    assert.ok(labels.some(({ label }) => label === 'Artemis II'));
    assert.ok(labels.some(({ label }) => label === 'Runway - RPI Flying Club'));

    for (let n = 0; n < 8; n++) {
      await page.locator('#mobile-menu-toggle').tap();
      await settle(page);
      const frames = await page.evaluate(async () => {
        const result = [];
        for (let frame = 0; frame < 6; frame++) {
          await new Promise(requestAnimationFrame);
          const canvas = document.querySelector('#p5-container canvas');
          const main = document.querySelector('.app-main').getBoundingClientRect();
          result.push({ w: canvas.width / devicePixelRatio, h: canvas.height / devicePixelRatio,
            mw: main.width, mh: main.height, scroll: [scrollX, scrollY] });
        }
        return result;
      });
      assert.ok(frames.every(f => Math.abs(f.w - f.mw) < 2 && Math.abs(f.h - f.mh) < 2), JSON.stringify(frames));
      assert.ok(frames.every(f => f.scroll[0] === 0 && f.scroll[1] === 0));
      await page.locator('#mobile-controls-close').tap();
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
    }
    await page.evaluate(() => { toggleMobileMenu(); toggleMobileMenu(); });
    await settle(page);
    assert.equal(await page.locator('#app-sidebar').evaluate(e => e.inert), true);
    assert.equal(await page.locator('#app-sidebar').evaluate(e => e.contains(document.activeElement)), false);

    await page.locator('#mobile-menu-toggle').tap();
    await settle(page);
    assert.equal(await page.locator('#mobile-controls-close').evaluate(e => e === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#style-select').evaluate(e => e === document.activeElement), true);
    await page.locator('#binary-input').focus();
    // Explicitly simulate visualViewport keyboard shrink; this is not an OS keyboard test.
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 340 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    await settle(page);
    assert.ok(await page.locator('#app-sidebar').evaluate(e => e.getBoundingClientRect().bottom) <= 341);
    await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
    await settle(page);
    await page.setViewportSize({ width: 844, height: 290 });
    await settle(page);
    await checkSurface(true);
    if (evidence) await page.screenshot({ path: path.join(evidence, `${browserName}-menu-landscape.png`), scale: 'css' });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.setViewportSize({ width: 390, height: 664 });
    await page.locator('#mobile-menu-toggle').tap();
    if (evidence) await page.screenshot({ path: path.join(evidence, `${browserName}-menu-portrait.png`), scale: 'css' });

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(`${base}/generator/solid/`);
    await desktop.locator('#p5-container canvas').waitFor();
    assert.equal(await desktop.locator('#style-select + .custom-select-trigger').evaluate(e => getComputedStyle(e).textTransform), 'uppercase');
    assert.equal(await desktop.locator('#style-select').isVisible(), false);
    assert.equal(await desktop.locator('.mobile_controls-header').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(`${browserName}: native casing, repeated/two-toggle menu stability, per-frame canvas sizing, focus/Escape, simulated keyboard viewport, orientation and desktop caps passed`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
