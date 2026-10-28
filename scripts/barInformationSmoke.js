const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8027';
const evidence = `/tmp/rpi-bar-information-${engine}`;
(async () => {
  await fs.mkdir(evidence, {recursive:true});
  const browser = await ({chromium, webkit}[engine]).launch();
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    // Serve the unchanged static files through Playwright to avoid local socket limits.
    await page.route(`${base}/**`, async route => {
      let relative = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//, '');
      if (!path.extname(relative)) relative = relative.replace(/\/$/, '') + '/index.html';
      const file = path.resolve(__dirname, '..', relative);
      const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.mp3':'audio/mpeg'};
      try {await route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}
      catch {await route.fulfill({status:404,body:'Not found'});}
    });
    page.on('pageerror' ,error=>{ errors.push(error.message); console.error(error.message); });
    page.on('console',message=>{if(message.type()==='error') console.error(message.text());});
    await page.goto(`${base}/generator/solid/`);
    await page.waitForFunction(()=>window.barShareController);
    const styles = await page.locator('#style-select option:not([disabled])').evaluateAll(options=>options.map(o=>o.value));
    assert.equal(styles.length,21);
    for (const style of styles) {
      await page.selectOption('#style-select',style,{force:true});
      const expected=await page.evaluate(style=>BarInformation.descriptions[style],style);
      assert.equal(await page.locator('#bar-information-title').textContent(),expected.title);
      assert.equal(await page.locator('#bar-information-description').textContent(),expected.text);
      await page.locator('#report-problem-btn').scrollIntoViewIfNeeded();
      const card=await page.locator('#bar-information').boundingBox();
      const report=await page.locator('#report-problem-btn').boundingBox();
      assert.ok(card.y+card.height<=report.y);
      assert.equal(await page.locator('#bar-information').count(),1);
    }
    for(const color of ['black','white','red','lunar']) {
      await page.selectOption('#color-mode-select',color,{force:true});
      assert.equal(await page.locator('.bar_information-credit').isVisible(),color==='lunar');
      await page.locator('#bar-information').scrollIntoViewIfNeeded();
      await page.screenshot({path:`${evidence}/desktop-${color}.png`});
    }
    for(const width of [320,390,768]) {
      await page.setViewportSize({width,height:664});
      // Use the real panel trigger where the narrow layout hides controls.
      const toggle=page.locator('#mobile-menu-toggle');
      if(await toggle.isVisible() && await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
      await page.locator('#bar-information').scrollIntoViewIfNeeded();
      const card=await page.locator('#bar-information').boundingBox();
      assert.ok(card.x>=0 && card.x+card.width<=width,JSON.stringify({width,card}));
      await page.screenshot({path:`${evidence}/mobile-${width}.png`});
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(`${base}/generator/wave-quantum/`);
    await page.waitForFunction(()=>window.barShareController);
    assert.equal(await page.locator('#bar-information-title').textContent(),'Quantum');
    await page.selectOption('#style-select','lunar',{force:true});
    await page.selectOption('#color-mode-select','lunar',{force:true});
    const credit=page.locator('.bar_information-credit a');
    await credit.focus();
    assert.equal(await credit.evaluate(el=>el===document.activeElement),true);
    assert.deepEqual(errors,[]);
    console.log(`${engine}: 21 styles, 4 themes, 3 narrow layouts, direct route, motion preferences, and credit focus passed. Evidence: ${evidence}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
