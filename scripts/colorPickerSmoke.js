const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit, devices } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/rpi-color-picker';
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const ready = async () => { await page.locator('#p5-container canvas').waitFor(); await page.waitForFunction(() => window.barShareController); };
    await page.goto(`${base}/generator/solid/`); await ready();
    const trigger = page.locator('#color-mode-select + .custom-select-trigger');
    const row = value => page.locator(`#color-mode-select-options .custom-option[data-value="${value}"]`);
    await trigger.click();
    assert.deepEqual(await page.locator('#color-mode-select-options .custom-option-group-label').allTextContents(), ['Primary','Secondary']);
    await page.screenshot({path:`${evidence}/${engine}-primary-secondary.png`});
    for (const value of ['blue','gold','silver','gray']) {
      await row(value).hover();
      assert.equal(await row(value).getAttribute('aria-disabled'), 'true');
      assert.equal(await row(value).locator('.select_availability-hint').evaluate(e=>getComputedStyle(e).visibility), 'visible');
      // Physical pointer click: Playwright correctly refuses aria-disabled locator.click.
      const box = await row(value).boundingBox(); await page.mouse.click(box.x+15,box.y+box.height/2);
      assert.equal(await page.inputValue('#color-mode-select'), 'black');
    }
    await page.screenshot({path:`${evidence}/${engine}-desktop-colors.png`});
    await trigger.focus(); await page.keyboard.press('End');
    assert.match(await trigger.getAttribute('aria-activedescendant'), /option-6$/);
    assert.equal(await row('gray').locator('.select_availability-hint').evaluate(e=>getComputedStyle(e).visibility), 'visible');
    await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    assert.equal(await page.inputValue('#color-mode-select'), 'black');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    for (const value of ['white','red','black','white','black','white']) {
      await trigger.click(); await row(value).click();
      assert.equal(await page.inputValue('#color-mode-select'), value);
      assert.equal(await trigger.textContent(), value[0].toUpperCase()+value.slice(1));
    }
    await trigger.click(); await row('blue').hover();
    await page.screenshot({path:`${evidence}/${engine}-dark-colors.png`});
    await page.keyboard.press('Escape');
    const summary = page.locator('#color-guidance summary');
    await summary.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#color-guidance').getAttribute('open'), '');
    assert.equal(await page.locator('#color-guidance a').getAttribute('href'), 'https://brand.rpi.edu/document/4#/-/color');
    await page.screenshot({path:`${evidence}/${engine}-guidance.png`});
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#color-guidance').getAttribute('open'), null);
    const styleTrigger = page.locator('#style-select + .custom-select-trigger');
    await summary.click();
    await styleTrigger.click();
    assert.equal(await page.locator('#color-guidance').getAttribute('open'), null);
    await page.keyboard.press('End');
    for (const value of ['music','graph','truss']) {
      const item = page.locator(`#style-select-options [data-value="${value}"]`); await item.hover();
      assert.equal(await item.locator('.select_availability-hint').evaluate(e=>getComputedStyle(e).visibility), 'visible');
      const box=await item.boundingBox(); await page.mouse.click(box.x+10,box.y+box.height/2);
      assert.equal(await page.inputValue('#style-select'), 'solid');
    }
    await page.screenshot({path:`${evidence}/${engine}-styles.png`});
    await page.keyboard.press('Escape');
    // Disabled new choices do not invalidate existing query/shared snapshots or exports.
    await page.goto(`${base}/generator/solid/?colorMode=blue`); await ready();
    assert.equal(await page.inputValue('#color-mode-select'), 'blue');
    const link=await page.evaluate(()=>barShareController.buildLink());
    await page.goto(link); await ready(); assert.equal(await page.inputValue('#color-mode-select'), 'blue');
    const download=page.waitForEvent('download'); await page.evaluate(()=>saveSVG());
    assert.match(await fs.readFile(await (await download).path(),'utf8'), /#0081ce/i);
    await page.goto(`${base}/generator/lunar/`); await ready();
    await page.selectOption('#color-mode-select','lunar',{force:true});
    assert.equal(await page.inputValue('#color-mode-select'), 'lunar');
    const mobile=await browser.newPage({...devices['iPhone 13'],viewport:{width:390,height:664},reducedMotion:'reduce'});
    for (const width of [390,320]) {
      await mobile.setViewportSize({width,height:664});
      await mobile.goto(`${base}/generator/solid/`); await mobile.locator('#p5-container canvas').waitFor();
      await mobile.locator('#mobile-menu-toggle').tap();
      assert.equal(await mobile.locator('#color-mode-select').isVisible(), true);
      const options=await mobile.locator('option[data-coming-soon]').evaluateAll(options=>options.map(o=>({disabled:o.disabled,label:o.label})));
      assert.equal(options.length,7); assert.ok(options.every(o=>o.disabled && /Coming soon/.test(o.label)));
      await mobile.selectOption('#color-mode-select','red'); assert.equal(await mobile.inputValue('#color-mode-select'),'red');
      await mobile.locator('#color-guidance summary').tap();
      assert.equal(await mobile.locator('#color-guidance a').isVisible(),true);
      assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await mobile.screenshot({path:`${evidence}/${engine}-touch-${width}.png`});
    }
    assert.deepEqual(errors,[]);
    console.log(`${engine}: desktop hover/keyboard/blocked selection, repeated primary choices, guidance, legacy query/share/SVG, mission theme and 320/390px native touch checks passed`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
