/* Validate complete fragment restoration before the renderer's delayed setup. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch();
  try {
    const seed = await browser.newPage();
    await seed.goto(`${base}/generator/solid/`);
    await seed.waitForFunction(() => window.barShareController);
    const snapshots = await seed.evaluate(() => {
      const state = barShareController.capture();
      return ['waveform', 'ticker', 'wave-quantum'].map(style => {
        const controls = {...state.controls, 'style-select':style, 'color-mode-select':'gold',
          'waveform-envelope-toggle':true, 'waveform-frequency-slider':'37',
          'waveform-type-slider':'3', 'ticker-ratio-slider':'5', 'ticker-width-ratio-slider':'10',
          'quantum-phase':'0.35', 'quantum-speed-slider':'0.8', 'quantum-reverse-toggle':true};
        return {style, fragment:BarShareState.encodeState({...state,name:'Exploration α',controls},barShareController.manifest)};
      });
    });
    await seed.close();
    let passed = 0;
    for (const width of [1440,390]) for (const reduced of [false,true]) for (const snapshot of snapshots) {
      const context = await browser.newContext({viewport:{width,height:800},reducedMotion:reduced?'reduce':'no-preference'});
      await context.route('**/js/main.js*', async route => {await new Promise(resolve => setTimeout(resolve,1000));await route.continue();});
      const page = await context.newPage();
      const navigation = page.goto(`${base}/generator/${snapshot.style}/?colorMode=white${snapshot.fragment}`);
      await page.locator('.custom-select-trigger').first().waitFor({state:'attached'});
      assert.equal(await page.locator('#p5-container canvas').count(),0);
      const state = () => page.evaluate(() => ({
        fields:Array.from(document.querySelectorAll('#app-sidebar input[id], #app-sidebar select[id]'),field=>({id:field.id,value:field.value,checked:field.checked})),
        labels:Array.from(document.querySelectorAll('[data-slider-value],#waveform-type-display,#lines-variant-display'),field=>({id:field.id,text:field.textContent})),
        theme:document.querySelector('#color-mode-select').value,
        name:document.querySelector('#share-loaded-name').textContent,
        toolbar:Array.from(document.querySelectorAll('.header-actions > button,.header-actions > .save-section > button'),field=>{const r=field.getBoundingClientRect();return {id:field.id,x:r.x,y:r.y,width:r.width,height:r.height};})
      }));
      const early = await state();
      assert.equal(early.theme,'gold','validated fragment overrides query theme');
      assert.equal(early.name,'Exploration α');
      await navigation;
      await page.waitForFunction(() => window.barShareController);
      assert.deepEqual(await state(),early,`${width}px reduced=${reduced} ${snapshot.style}: complete startup state stays stable`);
      await context.close();
      passed++;
    }
    // An early Share click is honored once its existing runtime dialog is ready.
    const context = await browser.newContext();
    await context.route('**/js/main.js*',async route=>{await new Promise(resolve=>setTimeout(resolve,1000));await route.continue();});
    const page = await context.newPage();
    const navigation = page.goto(`${base}/generator/solid/`);
    await page.locator('#share-button').click();
    assert.equal(await page.locator('#p5-container canvas').count(),0);
    await navigation;
    await page.locator('#share-popover').waitFor();
    assert.equal(await page.locator('#share-button').getAttribute('aria-expanded'),'true');
    await context.close();
    console.log(`Passed ${passed} shared first-paint states and early Share intent.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
