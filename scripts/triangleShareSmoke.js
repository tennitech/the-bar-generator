// Default mode checks real integrated controls. The explicit fixture mode checks
// future native controls against the current share branch without importing BAR-02 rendering.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:4315';
const fixture = process.env.RPI_TRIANGLE_SHARE_FIXTURE === '1';
const evidence = process.env.RPI_EVIDENCE_DIR;
const controlsFixture = '<div class="control"><label for="triangles-direction-select" class="control-label">DIRECTION</label><div class="select-wrapper"><select id="triangles-direction-select" class="control-select"><option value="down">Down right ↘</option><option value="up">Up right ↗</option></select></div></div><div class="control"><label for="triangles-count-slider" class="control-label">COUNT</label><input id="triangles-count-slider" class="control-slider" type="range" min="6" max="28" step="1" value="14"></div>';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    if (fixture) await page.route('**/generator/index.html*', async route => {
      const response = await route.fetch();
      const html = await response.text();
      assert.ok(!html.includes('id="triangles-direction-select"'), 'Use real mode when BAR-02 controls are present');
      const marker = '<div id="triangles-group" class="control-group" style="display: none;">';
      assert.ok(html.includes(marker), 'Fixture insertion point exists');
      await route.fulfill({ response, body: html.replace(marker, marker + controlsFixture) });
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/triangles/`);
    await page.waitForFunction(() => window.barShareController);
    assert.equal(await page.locator('#triangles-direction-select').count(), 1, 'BAR-02 direction control present');
    assert.equal(await page.locator('#triangles-count-slider').count(), 1, 'BAR-02 count control present');
    const manifest = await page.evaluate(() => barShareController.manifest);
    assert.deepEqual(manifest['triangles-direction-select'].options, ['down', 'up']);
    assert.deepEqual([manifest['triangles-count-slider'].min, manifest['triangles-count-slider'].max, manifest['triangles-count-slider'].step], [6, 28, 1]);
    for (const [variant, direction, count] of [[1, 'down', 6], [2, 'up', 28], [1, 'up', 14], [2, 'down', 6]]) {
      await page.selectOption('#triangles-direction-select', direction, { force: true });
      await page.evaluate(({ variant, count }) => {
        for (const [id, value] of [['triangles-variant-slider', variant], ['triangles-count-slider', count]]) {
          const field = document.getElementById(id); field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, { variant, count });
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
        value: { writeText: async link => { window.__triangleShareLink = link; } } }));
      await page.click('#share-button'); await page.click('#share-copy');
      const link = await page.evaluate(() => window.__triangleShareLink);
      assert.ok(link.includes('#bar='));
      await page.goto(link); await page.waitForFunction(() => window.barShareController);
      for (let reload = 0; reload < 2; reload++) {
        assert.equal(await page.inputValue('#triangles-variant-slider'), String(variant));
        assert.equal(await page.inputValue('#triangles-direction-select'), direction);
        assert.equal(await page.inputValue('#triangles-count-slider'), String(count));
        if (reload === 0) { await page.reload(); await page.waitForFunction(() => window.barShareController); }
      }
      console.log(`PASS ${fixture ? 'fixture' : 'integrated'} copy/open/reload: variant${variant}, ${direction}, count${count}`);
    }
    // Old v1 links have no new IDs: the receiving native defaults must fill them.
    const oldLink = await page.evaluate(() => {
      const state = barShareController.capture();
      delete state.controls['triangles-direction-select']; delete state.controls['triangles-count-slider'];
      return location.href.split('#')[0] + BarShareState.encodeState(state, barShareController.manifest);
    });
    await page.goto(oldLink); await page.waitForFunction(() => window.barShareController);
    assert.equal(await page.inputValue('#triangles-direction-select'), 'down');
    assert.equal(await page.inputValue('#triangles-count-slider'), '14');
    assert.equal(await page.locator('#app-sidebar [data-share-ui]').count(), 0);
    assert.equal(await page.locator('#share-button').count(), 1);
    if (evidence) await page.screenshot({ path: `${evidence}/bar-05-triangle-${fixture ? 'fixture' : 'integrated'}.png` });
    assert.deepEqual(errors, []);
    console.log(`PASS ${fixture ? 'fixture' : 'integrated'} old-v1 defaults and unchanged minimal toolbar UI`);
    if (fixture) console.log('Fixture covers native state plumbing only; BAR-02/BAR-01 rendered geometry and actual SVG parity require integrated mode.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
