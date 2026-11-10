/* Brand compositions, neutral control contrast, transparent mark exports, and
   contextual native guidance. Run when a supported browser environment is available. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { COLOR_SCHEMES } = require('../js/utils/themeMode');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8140';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/bar-brand-color-evidence';
const rgb = hex => 'rgb(' + hex.slice(1).match(/../g).map(v => parseInt(v, 16)).join(', ') + ')';
function luminance(values) {
  return values.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}
function contrast(a, b) {
  const [hi, lo] = [a, b].map(luminance).sort((x, y) => y - x);
  return (hi + .05) / (lo + .05);
}
async function guidanceCheck(page) {
  const help = page.locator('#secondary-color-help');
  const dialog = page.locator('#secondary-color-dialog');
  assert.equal(await help.textContent(), 'How to use');
  const helpStyle = await help.evaluate(el => {
    const css = getComputedStyle(el), label = getComputedStyle(el.querySelector('.color_guidance-label'));
    return { color: css.color, background: css.backgroundColor,
      underline: label.textDecorationLine, transform: css.textTransform, icons: el.querySelectorAll('svg,img').length };
  });
  assert.deepEqual(helpStyle, { color: 'rgb(214, 0, 28)', background: 'rgba(0, 0, 0, 0)',
    underline: 'underline', transform: 'none', icons: 0 });
  await help.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const focus = await help.evaluate(el => {
    const label = el.querySelector('.color_guidance-label');
    return { focused: el === document.activeElement, targetHeight: el.getBoundingClientRect().height,
      labelHeight: label.getBoundingClientRect().height, buttonOutline: getComputedStyle(el).outlineStyle,
      labelOutline: getComputedStyle(label).outlineColor, labelOutlineWidth: getComputedStyle(label).outlineWidth };
  });
  assert.equal(focus.focused, true);
  assert.ok(focus.targetHeight >= 44 && focus.labelHeight < focus.targetHeight);
  assert.equal(focus.buttonOutline, 'none');
  assert.equal(focus.labelOutline, 'rgb(214, 0, 28)');
  assert.equal(focus.labelOutlineWidth, '2px');
  await help.click();
  assert.equal(await dialog.evaluate(el => el.matches(':modal')), true);
  const corners = await dialog.evaluate(el => ({
    popup: getComputedStyle(el).borderRadius,
    export: getComputedStyle(document.getElementById('save-menu')).borderRadius,
    clipping: getComputedStyle(el).overflow,
    innerBorder: getComputedStyle(el.querySelector('.report_dialog-panel')).borderTopWidth
  }));
  assert.equal(corners.popup, corners.export);
  assert.equal(corners.clipping, 'hidden');
  assert.equal(corners.innerBorder, '0px');
  await page.locator('#secondary-color-title').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => document.activeElement.id), 'secondary-color-title');
  assert.equal(await dialog.locator('li').count(), 4);
  assert.equal(await dialog.locator('a').getAttribute('href'),
    'https://brand.rpi.edu/d/pfJS6BKVKBeq/brand-guidelines#/-/color/secondary-colors');
  // Native Tab containment, including wrap in both directions.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
  }
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await help.evaluate(el => el === document.activeElement), true);
  await help.click();
  await page.locator('#secondary-color-close').click();
  assert.equal(await dialog.isVisible(), false);
  await help.click();
  await page.mouse.click(2, 2);
  assert.equal(await dialog.isVisible(), false);
  await help.click();
  const fits = await dialog.evaluate(el => {
    const bounds = el.getBoundingClientRect(), panel = el.querySelector('.report_dialog-panel');
    panel.scrollTop = panel.scrollHeight;
    return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0
      && bounds.bottom <= innerHeight && panel.scrollTop > 0 === (panel.scrollHeight > panel.clientHeight);
  });
  assert.equal(fits, true);
  await page.screenshot({ path: path.join(evidence, engine + '-guidance-' + (await page.viewportSize()).width + '.png'), scale: 'css' });
  await page.keyboard.press('Escape');
}
(async () => {
  const browser = await { chromium, webkit }[engine].launch({ headless: true });
  const results = [], errors = [];
  await fs.mkdir(evidence, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    for (const [mode, scheme] of Object.entries(COLOR_SCHEMES)) {
      await page.goto(base + '/generator/' + (mode === 'lunar' ? 'lunar' : 'ruler') + '/?colorMode=' + mode);
      await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
      await page.evaluate(() => { noLoop(); return document.fonts.ready; });
      const data = await page.evaluate(() => {
        const read = selector => getComputedStyle(document.querySelector(selector));
        const control = read('#color-mode-select + .custom-select-trigger');
        const header = read('.app-header');
        const parse = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
        const snapshot = captureLogoExportSnapshot();
        return {
          stage: read('.logo-container').backgroundColor,
          header: header.backgroundColor,
          sidebar: read('.app-sidebar').backgroundColor,
          headerInk: read('#header-logo-preview').color,
          headerText: parse(header.color), headerRGB: parse(header.backgroundColor),
          controlBg: parse(control.backgroundColor), controlText: parse(control.color),
          fg: snapshot.foreground.toLowerCase(), svg: snapshot.svgSource,
          label: document.getElementById('color-mode-select-label').textContent,
          selectedLabel: document.querySelector('#color-mode-select + .custom-select-trigger').textContent,
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      assert.equal(data.fg, scheme.fg);
      assert.equal(data.overflow, false);
      assert.ok(data.svg.toLowerCase().includes('fill="' + scheme.fg + '"'));
      assert.equal(await page.locator('#secondary-color-help').isVisible(), scheme.secondary);
      const expectedBackground = mode === 'lunar' ? '#03060d' : scheme.bg;
      const tile = page.locator('#color-mode-select').locator('..').locator('.custom-select-trigger [data-color-theme-swatch]');
      assert.equal(await tile.evaluate(el => getComputedStyle(el).backgroundColor), rgb(expectedBackground));
      assert.equal(await tile.evaluate(el => getComputedStyle(el, '::after').backgroundColor), rgb(scheme.fg));
      if (mode !== 'lunar') {
        assert.equal(data.stage, rgb(scheme.bg));
        assert.equal(data.header, data.sidebar);
        assert.equal(data.headerInk, ['white', 'gray-on-black'].includes(mode) ? rgb('#ffffff') : rgb('#000000'));
        assert.equal(data.label, 'COLOR THEME');
        assert.equal(data.selectedLabel, scheme.label);
        assert.ok(contrast(data.headerText, data.headerRGB) >= 4.5);
        assert.ok(contrast(data.controlText, data.controlBg) >= 4.5);
      }
      // Mark-only downloads retain alpha; colors change the shared ink, not export geometry.
      if (['gold', 'silver', 'gray'].includes(mode)) {
        const png = await page.evaluate(async () => {
          const blob = await createRasterExportBlob(captureLogoExportSnapshot(), new AbortController().signal);
          const url = URL.createObjectURL(blob), image = new Image();
          try {
            image.src = url; await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width; canvas.height = image.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
            return { alpha: ctx.getImageData(0, 0, 1, 1).data[3], width: image.width, height: image.height };
          } finally { URL.revokeObjectURL(url); }
        });
        assert.equal(png.alpha, 0);
        data.png = png;
      }
      await page.screenshot({ path: path.join(evidence, engine + '-' + mode + '-desktop.png'), scale: 'css' });
      if (mode === 'blue') await guidanceCheck(page);
      results.push({ mode, ...data, svg: undefined });
    }
    await page.goto(base + '/generator/ruler/?colorMode=red');
    await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
    assert.equal(await page.locator('#color-mode-select').inputValue(), 'black');
    assert.equal(await page.locator('#color-mode-select option[value="red"]').count(), 0);
    // Changing themes in place exercises change events and both directions of contextual visibility.
    await page.selectOption('#color-mode-select', 'blue', { force: true });
    assert.equal(await page.locator('#secondary-color-help').isVisible(), true);
    await page.selectOption('#color-mode-select', 'black', { force: true });
    assert.equal(await page.locator('#secondary-color-help').isVisible(), false);
    await page.selectOption('#color-mode-select', 'gold', { force: true });
    await guidanceCheck(page);
    const mobile = await browser.newPage({
      viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce'
    });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(base + '/generator/ruler/?colorMode=blue');
    await mobile.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
    await mobile.locator('#mobile-menu-toggle').click();
    assert.equal(await mobile.locator('.app-header').evaluate(el => getComputedStyle(el).backgroundColor),
      await mobile.locator('.app-sidebar').evaluate(el => getComputedStyle(el).backgroundColor));
    assert.equal(await mobile.locator('#header-logo-preview').evaluate(el => getComputedStyle(el).color), 'rgb(0, 0, 0)');
    const trigger = mobile.locator('#color-mode-select').locator('..').locator('.custom-select-trigger');
    await trigger.click();
    const rows = mobile.locator('#color-mode-select').locator('..').locator('.custom-option:not(.is-hidden)');
    assert.equal(await rows.locator('[data-color-theme-swatch]').count(), await rows.count());
    await mobile.keyboard.press('End');
    await mobile.keyboard.press('Enter');
    await trigger.click();
    await mobile.keyboard.press('Escape');
    await mobile.locator('#color-mode-select').selectOption('blue', { force: true });
    await guidanceCheck(mobile);
    assert.equal(await mobile.locator('#app-sidebar').evaluate(el => el.classList.contains('active')), true);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(evidence, engine + '-results.json'), JSON.stringify(results, null, 2));
    console.log(engine + ': all brand compositions, guidance, keyboard focus, mobile overflow and mark alpha passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
