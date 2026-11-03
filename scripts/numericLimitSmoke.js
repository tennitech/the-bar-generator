// Focused Numeric length boundary, unchanged geometry, and actual export parity.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8799';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/rpi-numeric-limit-${engine}`;
async function ready(page) {
  await page.waitForFunction(() => window.barShareController && window.logoExportUI);
}
async function download(page, type) {
  const pending = page.waitForEvent('download');
  await page.evaluate(type => { void window[`save${type}`](); }, type);
  return fs.readFile(await (await pending).path());
}
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/numeric/`); await ready(page);
    const input = page.locator('#numeric-input');
    assert.equal(await input.getAttribute('maxlength'), '100');
    assert.equal((await input.inputValue()).length, 100, 'default respects the cap');
    for (const count of [24, 99, 100]) {
      await input.fill('9'.repeat(count));
      const shapes = await page.evaluate(() => {
        const xml = new DOMParser().parseFromString(buildCurrentBarOnlySVG(), 'image/svg+xml');
        return [...xml.querySelectorAll('rect[rx]')].map(dot =>
          ({ width: Number(dot.getAttribute('width')), height: Number(dot.getAttribute('height')) }));
      });
      assert.equal(shapes.length, count * 9);
      assert.ok(shapes.every(dot => Math.abs(dot.width - (250 / count - 1)) < 1e-10 && dot.height === 1.5));
      await page.screenshot({ path: path.join(evidence, `preview-dots-${count}.png`) });
    }
    await input.press('End'); await input.press('1');
    assert.equal((await input.inputValue()).length, 100, 'typing cannot exceed the cap');
    await input.fill('1'.repeat(101));
    assert.equal((await input.inputValue()).length, 100, 'inserted text is capped by the native input');
    await page.evaluate(() => {
      const input = document.getElementById('numeric-input');
      input.value = '0.' + '2'.repeat(99);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.equal(await input.inputValue(), '1'.repeat(100), 'over-limit synthetic edit is rejected');
    await input.fill('0.' + '1'.repeat(98));
    const link = await page.evaluate(() => barShareController.buildLink());
    await page.goto(link); await ready(page);
    assert.equal(await input.inputValue(), '0.' + '1'.repeat(98), '100-character share restore retains every digit');
    await input.fill('9'.repeat(100));
    const snapshot = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    const svg = await download(page, 'SVG');
    assert.equal(svg.toString(), snapshot);
    const png = await download(page, 'PNG');
    const parity = await page.evaluate(async ({ svg, png }) => {
      const width = 1160, height = 762;
      const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
      xml.documentElement.setAttribute('width', width);
      xml.documentElement.setAttribute('height', height);
      xml.documentElement.setAttribute('viewBox', `-20 -20 ${width / 4} ${height / 4}`);
      async function pixels(source) {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, width, height);
        return context.getImageData(0, 0, width, height).data;
      }
      const vector = await pixels('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(xml)))));
      const raster = await pixels('data:image/png;base64,' + png);
      return vector.reduce((different, value, index) => different + (value !== raster[index]), 0);
    }, { svg: snapshot, png: png.toString('base64') });
    assert.equal(parity, 0, '100-column PNG matches captured SVG pixel-for-pixel');
    await fs.writeFile(path.join(evidence, 'dots-100.svg'), svg);
    await fs.writeFile(path.join(evidence, 'dots-100.png'), png);
    await page.getByRole('button', { name: 'Reset numeric parameters', exact: true }).click();
    assert.equal(await input.inputValue(), await page.evaluate(() => NumericControls.DEFAULT_VALUE));
    assert.equal((await input.inputValue()).length, 100);
    for (const prefix of ['', 'numericSource=values&']) {
      await page.goto(`${base}/generator/numeric/?${prefix}numericValue=${'0.' + '1'.repeat(99)}`); await ready(page);
      assert.equal(await input.inputValue(), '', 'over-limit URL must not round to a shorter value');
    }
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(`${base}/generator/numeric/`); await ready(mobile);
    const toggle = mobile.locator('#mobile-menu-toggle');
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    await mobile.locator('#numeric-input').fill('9'.repeat(101));
    assert.equal((await mobile.locator('#numeric-input').inputValue()).length, 100);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.screenshot({ path: path.join(evidence, 'limit-mobile.png') });
    assert.deepEqual(errors, []);
    console.log(`PASS ${engine}: 24/99/100-column geometry, typing/insertion cap, synthetic rejection, exact share restore, over-limit current/legacy URLs, Reset, SVG/PNG pixel parity, 390px touch layout. Evidence: ${evidence}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
