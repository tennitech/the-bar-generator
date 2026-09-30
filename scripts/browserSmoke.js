const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, firefox, webkit } = require('playwright');

const baseUrl = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const browserName = process.env.RPI_BROWSER || 'chromium';
const browserType = { chromium, firefox, webkit }[browserName];
assert.ok(browserType, `Unsupported browser: ${browserName}`);
const styles = [
  'solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles', 'numeric',
  'morse', 'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect',
  'neural-network', 'triangle-grid', 'triangles', 'fibonacci-sequence',
  'union', 'wave-quantum', 'runway', 'lunar'
];

async function openGenerator(page, style) {
  const errors = [];
  const consoleErrors = [];
  const onPageError = error => errors.push(error.message);
  const onConsole = message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  const response = await page.goto(`${baseUrl}/generator/${style}/`, {
    waitUntil: 'domcontentloaded'
  });
  assert.ok([200, 304].includes(response.status()), `${style} route response: ${response.status()}`);
  try {
    await page.locator('#p5-container canvas').waitFor({ timeout: 15000 });
  } catch (error) {
    const state = await page.evaluate(() => ({
      bodyText: document.body.innerText.slice(0, 500),
      canvasCount: document.querySelectorAll('canvas').length,
      p5Loaded: typeof window.p5 === 'function',
      setupLoaded: typeof window.setup === 'function'
    }));
    throw new Error(`${style} canvas unavailable: ${JSON.stringify({ state, errors, consoleErrors })}`, { cause: error });
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('#style-select').inputValue(), style);
  assert.deepEqual(errors, [], `${style} page errors`);
  page.off('pageerror', onPageError);
  page.off('console', onConsole);
}

async function main() {
  const browser = await browserType.launch({
    headless: true,
    ...(browserName === 'firefox' ? { firefoxUserPrefs: { 'webgl.force-enabled': true } } : {})
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    for (const style of styles) {
      await openGenerator(page, style);
      await page.locator('#save-button').click();
      const svgDownload = page.waitForEvent('download');
      await page.locator('#save-svg').click();
      const svg = await fs.readFile(await (await svgDownload).path(), 'utf8');
      assert.match(svg, /<svg\b/);
      assert.match(svg, /viewBox="-20 -20 290 /, 'SVG clear space');
      assert.match(svg, /<(?:path|rect|circle|line|polygon)\b/);
      const lunarDownloads = await page.evaluate(() => performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('/lunarBarAsset.js')).length);
      assert.equal(lunarDownloads, style === 'lunar' ? 1 : 0, `${style} artwork loading`);
    }

    await openGenerator(page, 'solid');
    await page.getByRole('combobox', { name: 'BAR STYLE: SOLID' }).click();
    await page.getByRole('option', { name: 'ARTEMIS II' }).click();
    await page.waitForFunction(() => typeof window.getLunarBarSVGSourceForColorMode === 'function');
    assert.equal(await page.locator('#style-select').inputValue(), 'lunar');
    await openGenerator(page, 'solid');
    await page.locator('#save-button').click();
    const pngDownload = page.waitForEvent('download');
    await page.locator('#save-png').click();
    const png = await fs.readFile(await (await pngDownload).path());
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');

    for (const [width, height] of [[320, 568], [375, 667], [768, 1024], [1440, 900], [3440, 1440]]) {
      await page.setViewportSize({ width, height });
      await openGenerator(page, 'ruler');
      const layout = await page.evaluate(() => ({
        overflows: document.documentElement.scrollWidth > window.innerWidth,
        logoScale: getResponsiveLogoScale(),
        shaderRequests: performance.getEntriesByType('resource')
          .filter(resource => resource.name.includes('/assets/shaders/')).length
      }));
      assert.equal(layout.overflows, false, `${width}px horizontal overflow`);
      assert.equal(layout.shaderRequests, 0, 'unused shaders fetched during boot');
      if (width === 3440) assert.ok(layout.logoScale > 2, 'ultrawide preview scale');
    }

    await page.goto(`${baseUrl}/generator/binary/?binaryText=nigga`);
    await page.locator('#p5-container canvas').waitFor({ timeout: 15000 });
    const encoding = await page.evaluate(() => ({
      accentedBytes: textToBinary('é').length,
      commaMorse: textToMorse(',').length
    }));
    assert.equal(encoding.accentedBytes, 16, 'UTF-8 binary encoding');
    assert.ok(encoding.commaMorse > 0, 'Morse comma encoding');
    assert.equal(await page.locator('#binary-input').inputValue(), '*****');
    assert.ok(!page.url().includes('nigga'), 'unsafe text removed from initial share URL');
    await page.locator('#binary-input').fill('ｆｕｃｋ');
    assert.equal(await page.locator('#binary-input').inputValue(), '****');
    assert.ok(page.url().includes('binaryText=****'));

    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await openGenerator(reduced, 'ruler');
    await reduced.locator('#header-logo-preview').click();
    await reduced.locator('.logo_animation_static svg').waitFor({ timeout: 15000 });
    assert.equal(await reduced.locator('.logo_animation_frame').count(), 0);
    await reduced.close();

    const fallback = await browser.newPage();
    await fallback.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
        if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
        return originalGetContext.call(this, kind, ...options);
      };
    });
    for (const style of styles) {
      await openGenerator(fallback, style);
      assert.equal(await fallback.evaluate(() => drawingContext instanceof CanvasRenderingContext2D), true);
    }
    await fallback.close();

    const blocked = await browser.newPage();
    await blocked.route('**/third_party/p5/p5.min.js', route => route.abort());
    await blocked.goto(`${baseUrl}/generator/solid/`);
    await blocked.getByRole('heading', { name: 'Unable to load the generator' })
      .waitFor({ timeout: 15000 });
    assert.equal(await blocked.getByRole('button', { name: 'Retry' }).count(), 1);
    await blocked.goto(`${baseUrl}/generator/`);
    await blocked.getByText('Unable to load the preview.').waitFor({ timeout: 15000 });
    await blocked.close();

    await context.close();
    console.log(`${browserName} smoke passed: ${styles.length} styles and SVG exports, PNG, 5 widths, text safety, reduced motion, 2D fallback, renderer recovery.`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
