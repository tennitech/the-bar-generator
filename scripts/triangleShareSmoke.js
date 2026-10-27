// Default mode checks real integrated controls. The explicit fixture mode checks
// future native controls against the current share branch without importing triangle rendering.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const fixture = process.env.RPI_TRIANGLE_SHARE_FIXTURE === '1';
const evidence = process.env.RPI_EVIDENCE_DIR;
const controlsFixture = '<div class="control"><label for="triangles-direction-select" class="control-label">DIRECTION</label><div class="select-wrapper"><select id="triangles-direction-select" class="control-select"><option value="down-right" selected>Down right</option><option value="up-right">Up right</option><option value="up-left">Up left</option><option value="down-left">Down left</option></select></div></div><div class="control"><label for="triangles-count-slider" class="control-label">COUNT</label><input id="triangles-count-slider" class="control-slider" type="range" min="6" max="28" step="1" value="14"></div>';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    if (fixture) await page.route('**/generator/index.html*', async route => {
      const response = await route.fetch();
      const html = await response.text();
      assert.ok(!html.includes('id="triangles-direction-select"'), 'Use real mode when triangle controls are present');
      const marker = '<div id="triangles-group" class="control-group" style="display: none;">';
      assert.ok(html.includes(marker), 'Fixture insertion point exists');
      await route.fulfill({ response, body: html.replace(marker, marker + controlsFixture) });
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/triangles/`);
    await page.waitForFunction(() => window.barShareController);
    assert.equal(await page.locator('#triangles-direction-select').count(), 1, 'triangle direction control present');
    assert.equal(await page.locator('#triangles-count-slider').count(), 1, 'triangle count control present');
    const manifest = await page.evaluate(() => barShareController.manifest);
    assert.deepEqual(manifest['triangles-direction-select'].options, ['down-right', 'up-right', 'up-left', 'down-left']);
    assert.deepEqual([manifest['triangles-count-slider'].min, manifest['triangles-count-slider'].max, manifest['triangles-count-slider'].step], [6, 28, 1]);
    assert.equal(await page.inputValue('#triangles-direction-select'), 'down-right', 'new unshared app default');
    const directions = ['up-left', 'up-right', 'down-left', 'down-right'];
    const cases = [1, 2].flatMap(variant => directions.map((direction, index) => [variant, direction, [6, 14, 28, 6][index]]));
    for (const [variant, direction, count] of cases) {
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
      const savedDirection = await page.evaluate(link => {
        const encoded = new URL(link).hash.slice('#bar='.length).replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)).controls['triangles-direction-select'];
      }, link);
      assert.equal(savedDirection, direction, 'new links save explicit direction, including Down right');
      await page.goto(link); await page.waitForFunction(() => window.barShareController);
      for (let reload = 0; reload < 2; reload++) {
        assert.equal(await page.inputValue('#triangles-variant-slider'), String(variant));
        assert.equal(await page.inputValue('#triangles-direction-select'), direction);
        assert.equal(await page.inputValue('#triangles-count-slider'), String(count));
        if (reload === 0) { await page.reload(); await page.waitForFunction(() => window.barShareController); }
      }
      console.log(`PASS ${fixture ? 'fixture' : 'integrated'} copy/open/reload: variant${variant}, ${direction}, count${count}`);
    }
    // Historical raw envelopes must migrate before current enum validation.
    for (const variant of [1, 2]) for (const oldDirection of ['up', 'down', null]) {
      const oldLink = await page.evaluate(({ variant, oldDirection }) => {
        const state = barShareController.capture();
        state.controls['triangles-variant-slider'] = String(variant);
        delete state.controls['triangles-count-slider'];
        if (oldDirection === null) delete state.controls['triangles-direction-select'];
        else state.controls['triangles-direction-select'] = oldDirection;
        const bytes = new TextEncoder().encode(JSON.stringify(state));
        const raw = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return location.href.split('#')[0] + '#bar=' + raw;
      }, { variant, oldDirection });
      await page.goto(oldLink); await page.waitForFunction(() => window.barShareController);
      const expected = oldDirection === 'up' ? 'up-right' : 'down-right';
      assert.equal(await page.inputValue('#triangles-direction-select'), expected);
      assert.equal(await page.inputValue('#triangles-count-slider'), '14');
      assert.equal(await page.inputValue('#triangles-variant-slider'), String(variant));
      const canonical = await page.evaluate(() => barShareController.buildLink());
      await page.goto(canonical); await page.waitForFunction(() => window.barShareController);
      assert.equal(await page.inputValue('#triangles-direction-select'), expected, 'migrated canonical link retains historical direction');
      console.log(`PASS legacy variant${variant}, ${oldDirection || 'omitted'} → ${expected}`);
    }
    assert.equal(await page.locator('#app-sidebar [data-share-ui]').count(), 0);
    assert.equal(await page.locator('#share-button').count(), 1);
    if (evidence) await page.screenshot({ path: `${evidence}/bar-05-triangle-${fixture ? 'fixture' : 'integrated'}.png` });
    assert.deepEqual(errors, []);
    console.log(`PASS ${fixture ? 'fixture' : 'integrated'} four-direction legacy migration and unchanged minimal toolbar UI`);
    if (fixture) console.log('Fixture covers native state plumbing only; combined rendered geometry and actual SVG parity require integrated mode.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
