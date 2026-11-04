/* Hold the renderer script to expose the actual pre-initialization controls. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:4495';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/randomize-startup-${engine}`;
const metrics = page => page.evaluate(() => {
  const group = document.querySelector('#circles-group');
  const origin = group.getBoundingClientRect();
  const actions = group.querySelector('.control-header-actions');
  return [...actions.children].map(button => {
    const box = button.getBoundingClientRect();
    return { text: button.textContent, x: box.x - origin.x, y: box.y - origin.y,
      width: box.width, height: box.height, disabled: button.disabled };
  });
});
const positions = items => items.map(({ disabled, ...item }) => item);
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    for (const width of [1280, 375, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let gate, release;
      await page.route(/\/js\/main\.js(?:\?|$)/, async route => { await gate; await route.continue(); });
      try {
        for (const reload of [false, true]) {
          gate = new Promise(resolve => { release = resolve; });
          if (reload) await page.reload({ waitUntil: 'domcontentloaded' });
          else await page.goto(`${base}/generator/circles/`, { waitUntil: 'domcontentloaded' });
          await page.locator('#circles-group [data-parameter-action="randomize"]').waitFor({ state: 'attached' });
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.evaluate(() => Boolean(window.randomizeHistory)), false, 'history setup is still held');
          const early = await metrics(page);
          await fs.writeFile(`${evidence}/initial-${width}-${reload ? 'reload' : 'fresh'}.json`, JSON.stringify(early, null, 2));
          assert.deepEqual(early.map(item => item.text), ['Randomize', 'Undo', 'Reset'], 'all action chrome exists before renderer setup');
          assert.equal(early[1].disabled, true, 'Undo starts unavailable even after a prior randomization');
          await page.evaluate(() => { window.initialUndoButton = document.querySelector('[data-randomize-undo="circles"]'); });
          release();
          await page.waitForFunction(() => window.randomizeHistory && window.logoExportUI);
          await page.evaluate(() => document.fonts.ready);
          const initialized = await metrics(page);
          assert.deepEqual(positions(initialized), positions(early), `startup does not move actions at ${width}px`);
          assert.equal(await page.evaluate(() => initialUndoButton === document.querySelector('[data-randomize-undo="circles"]')), true);
          assert.equal(initialized[1].disabled, true);
          await page.evaluate(() => { ParameterControls.prepare(document); ParameterControls.prepare(document); });
          assert.equal(await page.locator('[data-randomize-undo="circles"]').count(), 1, 'repeated preparation never duplicates Undo');
          if (width < 1000) await page.locator('#mobile-menu-toggle').click();
          const artwork = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
          await page.locator('[data-parameter-style="circles"][data-parameter-action="randomize"]').click();
          const undo = page.locator('[data-randomize-undo="circles"]');
          assert.equal(await undo.isEnabled(), true);
          await undo.focus(); await page.keyboard.press('Enter');
          assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource), artwork);
          assert.equal(await undo.isDisabled(), true);
          assert.equal(await page.evaluate(() => document.activeElement.dataset.parameterAction), 'randomize');
          await page.locator('[data-parameter-style="circles"][data-parameter-action="randomize"]').click();
          assert.equal(await undo.isEnabled(), true, 'next reload starts with available history');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          const bounds = await undo.boundingBox();
          assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, 'Undo remains inside the viewport');
          await page.screenshot({ path: `${evidence}/${width}-${reload ? 'reload' : 'fresh'}.png` });
          results.push({ width, reload, early, initialized, exactArtwork: true });
        }
        assert.deepEqual(errors, []);
      } finally { release?.(); await page.close(); }
    }
    await fs.writeFile(`${evidence}/results.json`, JSON.stringify({ engine, results }, null, 2));
    console.log(`${engine}: ${results.length} delayed-start/refresh cases passed, with stable action positions and exact Undo.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
