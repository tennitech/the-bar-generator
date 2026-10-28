const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit, devices } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8014';
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/rpi-selectors';
const opposites = { 'down-right': 'up-left', 'up-right': 'down-left', 'up-left': 'down-right', 'down-left': 'up-right' };
async function ready(page) { await page.waitForFunction(() => window.barShareController); await page.locator('#p5-container canvas').waitFor(); }
async function svg(page) { const pending = page.waitForEvent('download'); await page.evaluate(() => saveSVG()); return fs.readFile(await (await pending).path(), 'utf8'); }
async function bounds(page, id) {
  const box = await page.locator(`#${id}-options`).boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box.y >= 0 && box.y + box.height <= viewport.height, JSON.stringify(box));
  assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
  return box;
}
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({chromium,webkit}[engine]).launch();
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/triangles/`); await ready(page);
    assert.equal(await page.locator('#triangles-variant-slider').count(), 0);
    const style = page.locator('#style-select + button');
    await style.click(); await page.waitForTimeout(200);
    assert.equal(await page.locator('#style-select-options .select_style-preview').count(), 21);
    const quantum = page.locator('#style-select-options [data-value="wave-quantum"]');
    assert.equal(await quantum.count(), 1);
    assert.equal(await page.locator('#style-select option[value="wave-quantum"]').evaluate(option => option.parentElement.label), 'Dynamic');
    assert.equal(await quantum.locator('.select_style-preview svg').count(), 1);

    assert.equal(await page.locator('#style-select-options .is-disabled .select_style-preview').count(), 0);
    assert.ok((await bounds(page,'style-select')).height > 500);
    const samples = await page.locator('.select_style-preview').evaluateAll(rows=>rows.map(r=>r.innerHTML));
    await page.screenshot({path:`${evidence}/${engine}-desktop-styles.png`});
    await page.keyboard.press('Home'); await page.waitForTimeout(100);
    await page.screenshot({path:`${evidence}/${engine}-desktop-styles-top.png`});
    await page.keyboard.press('End');
    assert.equal(await page.locator('#style-select-options .is-active').getAttribute('data-value'), 'truss');
    await page.keyboard.press('Enter'); assert.equal(await page.inputValue('#style-select'),'triangles');
    await page.screenshot({path:`${evidence}/${engine}-coming-soon.png`});
    await page.keyboard.press('Escape');
    const direction = page.locator('#triangles-direction-select + button');
    for (const name of Object.keys(opposites)) {
      await direction.click(); await bounds(page,'triangles-direction-select');
      const row = page.locator(`#triangles-direction-select-options [data-value="${name}"]`);
      assert.equal(await row.locator('.select_direction-arrow').getAttribute('aria-hidden'),'true');
      await page.screenshot({path:`${evidence}/${engine}-directions.png`});
      await row.click(); assert.equal(await page.inputValue('#triangles-direction-select'),name);
    }
    await style.click(); assert.deepEqual(await page.locator('.select_style-preview').evaluateAll(rows=>rows.map(r=>r.innerHTML)),samples);
    await page.keyboard.press('Escape');
    // Raw historical variant 2 envelopes, query URLs, canonical shares and downloads.
    for (const [old, expected] of Object.entries(opposites)) {
      await page.goto(`${base}/generator/triangles/?trianglesVariant=2&trianglesDirection=${old}&trianglesCount=28`); await ready(page);
      assert.equal(await page.inputValue('#triangles-direction-select'),expected);
      assert.ok(!new URL(page.url()).searchParams.has('trianglesVariant'));
      const before = await svg(page); assert.equal((before.match(/<polygon /g)||[]).length,28);
      const link = await page.evaluate(old => {
        const state = barShareController.capture();
        state.controls['triangles-variant-slider']='2'; state.controls['triangles-direction-select']=old;
        return location.href.split('#')[0]+'#bar='+btoa(unescape(encodeURIComponent(JSON.stringify(state)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      },old);
      await page.goto(link); await ready(page);
      assert.equal(await page.inputValue('#triangles-direction-select'),expected);
      assert.equal(await svg(page),before);
      const canonical=await page.evaluate(()=>barShareController.buildLink());
      await page.goto(canonical); await ready(page); assert.equal(await svg(page),before);
      assert.ok(!Object.hasOwn(await page.evaluate(()=>barShareController.capture().controls),'triangles-variant-slider'));
    }
    const png = page.waitForEvent('download'); await page.evaluate(()=>savePNG());
    const bytes=await fs.readFile(await (await png).path()); assert.equal(bytes.subarray(1,4).toString(),'PNG');
    await page.selectOption('#color-mode-select','white',{force:true});
    await style.click(); await page.keyboard.press('Home'); await page.waitForTimeout(200);
    await page.screenshot({path:`${evidence}/${engine}-dark-styles.png`}); await page.keyboard.press('Escape');
    // Small desktop windows: opening, scrolling and resize remain inside the viewport.
    for (const size of [{width:1024,height:600},{width:1280,height:500}]) {
      await page.setViewportSize(size); await style.click(); await bounds(page,'style-select'); await page.keyboard.press('End'); await bounds(page,'style-select'); await page.keyboard.press('Escape');
    }
    const mobile=await browser.newPage({...devices['iPhone 13'],viewport:{width:390,height:664},reducedMotion:'reduce'});
    mobile.on('pageerror',error=>errors.push(error.message));
    for(const width of [390,320]) {
      await mobile.setViewportSize({width,height:664});
      await mobile.goto(`${base}/generator/triangles/`); await ready(mobile);
      await mobile.locator('#mobile-menu-toggle').tap();
      const trigger=mobile.locator('#style-select + button'); await trigger.tap();
      await bounds(mobile,'style-select'); assert.equal(await mobile.locator('.select_style-preview').count(),21);
      const row=mobile.locator('#style-select-options [data-value="solid"]'); await row.scrollIntoViewIfNeeded();
      assert.ok((await row.boundingBox()).height>=44);
      await mobile.screenshot({path:`${evidence}/${engine}-touch-${width}.png`});
      await row.tap(); assert.equal(await mobile.inputValue('#style-select'),'solid');
      await trigger.tap(); const triangle=mobile.locator('#style-select-options [data-value="triangles"]'); await triangle.scrollIntoViewIfNeeded(); await triangle.tap();
      const d=mobile.locator('#triangles-direction-select + button'); await d.tap(); await bounds(mobile,'triangles-direction-select');
      await mobile.locator('#triangles-direction-select-options [data-value="up-left"]').tap();
      assert.equal(await mobile.inputValue('#triangles-direction-select'),'up-left');
      assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    assert.deepEqual(errors,[]);
    console.log(`${engine}: 21 still previews, menu bounds/scrolling, desktop keyboard, direction arrows, blocked styles, legacy variant query/share/SVG, PNG, dark theme and 320/390px touch passed`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
