// Combined-contract checks that require real controls, renderers and downloads.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_INTEGRATION_EVIDENCE;
const browserName = process.env.RPI_BROWSER || 'chromium';
async function svg(page) {
  const waiting = page.waitForEvent('download');
  await page.evaluate(() => saveSVG());
  return fs.readFile(await (await waiting).path(), 'utf8');
}
async function ready(page) {
  await page.waitForFunction(() => window.barShareController && typeof buildCurrentBarPatternSVGFragment === 'function');
  await page.locator('#p5-container canvas').waitFor();
}
(async () => {
  const browser = await ({ chromium, webkit }[browserName]).launch();
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/triangles/`); await ready(page);
    // Use the actual desktop custom picker and keyboard range control.
    await page.locator('#triangles-count-slider').focus();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.inputValue('#triangles-count-slider'), '27');
    const trigger = page.locator('#triangles-direction-select').locator('..').locator('.custom-select-trigger');
    await trigger.focus(); await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Down right', exact: true }).click();
    assert.equal(await page.inputValue('#triangles-direction-select'), 'down-right');
    assert.equal((await svg(page)).match(/<polygon /g).length, 27);
    for (const direction of ['up-left', 'up-right', 'down-left', 'down-right']) {
      for (const count of [6, 28]) for (const variant of [1, 2]) {
        await page.selectOption('#triangles-direction-select', direction, { force: true });
        await page.evaluate(({ count, variant }) => {
          for (const [id, value] of [['triangles-count-slider', count], ['triangles-variant-slider', variant]]) {
            const input = document.getElementById(id); input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, { count, variant });
        const before = await svg(page);
        assert.equal((before.match(/<polygon /g) || []).length, count, 'actual SVG selected triangle count');
        const parity = await page.evaluate(async () => {
          await getCanonicalBarImage().ready;
          const g = RPI_LOGO_GEOMETRY, pg = createExportGraphicsBuffer(4);
          drawExportLogoFrame(pg, { scale: 4 });
          const header = buildHeaderPreviewSVG().replace('<svg ', `<svg width="${pg.width}" height="${pg.height}" `)
            .replace(`viewBox="0 0 ${g.width} ${g.totalHeight}"`, `viewBox="-20 -20 ${pg.width / 4} ${pg.height / 4}"`)
            .replace('fill="currentColor"', 'fill="#000000"');
          const image = new Image(); image.src = `data:image/svg+xml,${encodeURIComponent(header)}`; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = pg.width; canvas.height = pg.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
          const a = pg.drawingContext.getImageData(0, 0, pg.width, pg.height).data;
          const b = ctx.getImageData(0, 0, pg.width, pg.height).data;
          let delta = 0, left = Infinity, right = -1, outside = 0;
          const top = Math.floor((g.barY + 20) * 4), bottom = Math.ceil((g.totalHeight + 20) * 4);
          for (let y = top; y < pg.height; y++) for (let x = 0; x < pg.width; x++) {
            const i = (y * pg.width + x) * 4 + 3; delta += Math.abs(a[i] - b[i]);
            if (a[i] > 8) { left = Math.min(left, x); right = Math.max(right, x);
              if (x < 80 || x > 1079 || y >= bottom) outside++; }
          }
          pg.remove(); return { left, right, outside, meanAlphaDifference: delta / (1000 * 72) };
        });
        assert.deepEqual([parity.left, parity.right, parity.outside], [80, 1079, 0]);
        assert.ok(parity.meanAlphaDifference < 1, JSON.stringify(parity));
        const link = await page.evaluate(() => barShareController.buildLink());
        await page.goto(link); await ready(page);
        assert.equal(await svg(page), before, 'selected direction/count exported SVG after share restore');
        results.push({ direction, count, variant, ...parity });
        console.log(`PASS triangles ${direction}/${count}/${variant}`);
      }
    }
    // Canonical packing must invalidate by seed on same-document history restore.
    await page.goto(`${base}/generator/circles/`); await ready(page);
    const links = await page.evaluate(() => [123, 456].map(seed => {
      const state = barShareController.capture(); state.runtime.seed = seed;
      state.controls['circles-size-variation-slider'] = '65';
      return location.href.split('#')[0] + BarShareState.encodeState(state, barShareController.manifest);
    }));
    const documents = [];
    for (const link of links) {
      await page.goto(link); await ready(page); documents.push(await svg(page));
    }
    assert.notEqual(documents[0], documents[1], 'distinct packing seeds produce distinct geometry');
    await page.evaluate(link => { history.pushState({}, '', link); dispatchEvent(new PopStateEvent('popstate')); }, links[0]);
    assert.equal(await svg(page), documents[0], 'same-document seed restore invalidates canonical packing cache');
    assert.deepEqual(errors, []);
    if (evidence) {
      await fs.writeFile(`${evidence}/${browserName}-integration-results.json`, JSON.stringify({ triangles: results, seedHistory: true, errors }, null, 2));
      await page.screenshot({ path: `${evidence}/${browserName}-integration-desktop.png` });
    }
    console.log(`${browserName}: 16 triangle SVG/count/paint/header/raster/share comparisons and seed-history restore passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
