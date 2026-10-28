const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
async function ready(page) { await page.waitForFunction(() => window.barShareController); }
async function artifact(page, kind) {
  const wait = page.waitForEvent('download'); await page.evaluate(kind => window[`save${kind}`](), kind);
  return fs.readFile(await (await wait).path());
}
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/numeric/?numericSource=formula&numericFormula=rms&numericValue=001.20`); await ready(page);
    const numericSVG = await artifact(page, 'SVG'), numericPNG = await artifact(page, 'PNG');
    const numericLink = await page.evaluate(() => barShareController.buildLink());
    await page.selectOption('#style-select', 'circles', { force: true });
    const circleSVG = await artifact(page, 'SVG');
    const circleLink = await page.evaluate(() => barShareController.buildLink());
    await page.selectOption('#style-select', 'neural-network', { force: true });
    await page.evaluate(() => {
      const values = { neuralNetworkHiddenLayers: '5', neuralNetworkUnits: '5', neuralNetworkInput: '0',
        neuralNetworkSeed: '16', neuralNetworkActivation: 'sigmoid', neuralNetworkConnectivity: 'local' };
      for (const [key, value] of Object.entries(values)) {
        const field = document.querySelector(`[data-url-parameter="${key}"]`); field.value = value;
        field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      }
    });
    const neuralSVG = await artifact(page, 'SVG');
    const neuralLink = await page.evaluate(() => barShareController.buildLink());
    await page.goto(numericLink); await ready(page);
    assert.equal(await page.inputValue('#numeric-source-select'), 'formula');
    assert.equal(await page.inputValue('#numeric-formula-select'), 'rms');
    assert.equal(await page.inputValue('#numeric-input'), '001.20');
    assert.ok((await artifact(page, 'SVG')).equals(numericSVG));
    assert.ok((await artifact(page, 'PNG')).equals(numericPNG));
    await page.goto(circleLink); await ready(page);
    assert.ok((await artifact(page, 'SVG')).equals(circleSVG));
    await page.goto(neuralLink); await ready(page);
    assert.equal(await page.inputValue('#neural-network-input-slider'), '0');
    assert.ok((await artifact(page, 'SVG')).equals(neuralSVG));
    await page.locator('#style-select + button').click();
    assert.equal(await page.locator('#style-select-options .select_style-preview').count(), 21);
    const quantum = page.locator('#style-select-options [data-value="wave-quantum"]');
    assert.equal(await quantum.count(), 1);
    assert.equal(await quantum.evaluate(el => el.closest('.select_option-group').firstElementChild.textContent), 'Dynamic');
    assert.equal(await quantum.locator('.select_style-preview svg').count(), 1);
    assert.ok(await page.locator('#style-select-options [data-value="neural-network"] .select_style-preview circle').count() > 0);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
    await page.getByRole('button', { name: 'Play animation once' }).click();
    await page.frameLocator('.logo_animation_frame').locator('#animation-projection').filter({ hasText: /\S/ }).waitFor();
    await page.evaluate(() => { window.__crossFrame = document.querySelector('.logo_animation_frame'); });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => document.querySelector('.logo_animation_frame') === window.__crossFrame), true);
    await page.keyboard.press('Escape'); await page.locator('.logo_animation_overlay').waitFor({ state: 'hidden' });
    assert.ok((await artifact(page, 'SVG')).equals(neuralSVG));
    assert.deepEqual(errors, []);
    console.log(`${engine}: Numeric/Circles/Neural switching and shared SVG/PNG restoration, zero neural input, all previews, Quantum Dynamic and audited intro passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
