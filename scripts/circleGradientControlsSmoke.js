const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8783';
(async () => {
  const browser = await ({chromium,webkit}[process.env.RPI_BROWSER || 'chromium']).launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1489,height:974},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const open = async query => { await page.goto(`${base}/generator/circles-gradient/${query||''}`);await page.waitForFunction(()=>window.barShareController && typeof captureLogoExportSnapshot==='function');await page.locator('#p5-container.is-entry-complete').waitFor(); };
    const svg = () => page.evaluate(()=>buildCurrentBarOnlySVG());
    const set = (id,value,event='input') => page.locator(`#${id}`).evaluate((el,{value,event})=>{if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new Event(event,{bubbles:true}));},{value,event});
    await open();const original=await svg();
    assert.equal(await page.locator('#style-select option[value="circles-gradient"]').evaluate(el=>el.parentElement.label),'Dynamic');
    const presetTrigger=page.locator('#circles-gradient-variant-slider').locator('..').locator('.custom-select-trigger');
    await presetTrigger.focus();await page.keyboard.press('Enter');
    await page.getByRole('option',{name:'Center peak',exact:true}).click();
    assert.equal(await page.inputValue('#circles-gradient-variant-slider'),'3');
    for (const variant of ['1','2','3']) {
      await set('circles-gradient-variant-slider',variant,'change');
      const current=await svg();
      await open(`?circlesGradientVariant=${variant}`);assert.equal(await svg(),current);
    }
    await open();
    await page.locator('#circles-gradient-columns').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.inputValue('#circles-gradient-columns'),'30');
    await set('circles-gradient-rows','5');await set('circles-gradient-size','65');
    await set('circles-gradient-contrast','30');await set('circles-gradient-stagger','45');await set('circles-gradient-reverse',true);
    const configured=await svg();assert.notEqual(configured,original);
    await page.waitForFunction(()=>new URLSearchParams(location.search).get('circlesGradientReverse')==='true');
    const url=await page.evaluate(()=>location.href);await page.reload();await page.waitForFunction(()=>window.barShareController && typeof buildCurrentBarOnlySVG==='function');assert.equal(await svg(),configured);
    const link=await page.evaluate(()=>barShareController.buildLink());
    await open();await page.goto(link);await page.waitForFunction(()=>window.barShareController && typeof buildCurrentBarOnlySVG==='function');assert.equal(await svg(),configured,'historical snapshot roundtrip');
    await page.evaluate(()=>barShareController.restoreLocal({v:1,name:'',controls:{'style-select':'circles-gradient','circles-gradient-variant-slider':'2'},runtime:{seed:1}}));
    assert.equal(await page.inputValue('#circles-gradient-columns'),'24');assert.equal(await page.inputValue('#circles-gradient-rows'),'2');
    await page.goto(url);await page.waitForFunction(()=>window.barShareController && typeof captureLogoExportSnapshot==='function');
    const exported=await page.evaluate(async()=>{
      const snapshot=captureLogoExportSnapshot();const blob=await createRasterExportBlob(snapshot,new AbortController().signal);
      const image=await createImageBitmap(blob);const result={width:image.width,height:image.height,bytes:blob.size,header:buildHeaderPreviewSVG().includes(buildCurrentBarPatternSVGFragment())};image.close();return result;
    });assert.ok(exported.header&&exported.bytes>1000);assert.equal(exported.width,4752);
    await page.evaluate(()=>setZoomLevel(4,{immediate:true}));assert.equal(await svg(),configured);
    await page.evaluate(()=>setZoomLevel(1,{immediate:true}));
    await page.screenshot({path:'/tmp/circle-gradient-controls-desktop.png'});
    await page.locator('[data-parameter-action="randomize"][data-parameter-style="circles-gradient"]').click();const random=await svg();assert.notEqual(random,configured);
    await page.locator('[data-randomize-undo="circles-gradient"]').click();assert.equal(await svg(),configured);
    await page.locator('[data-parameter-action="reset"][data-parameter-style="circles-gradient"]').click();assert.equal(await svg(),original);
    await page.setViewportSize({width:390,height:844});await page.locator('#mobile-menu-toggle').click();
    await page.locator('#circles-gradient-reverse').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/circle-gradient-controls-mobile.png'});
    await page.locator('#mobile-menu-toggle').click();
    await page.locator('#mobile-menu-toggle').click();await page.locator('#circles-gradient-rows').scrollIntoViewIfNeeded();
    await page.locator('#circles-gradient-rows').focus();await page.keyboard.press('End');assert.equal(await page.inputValue('#circles-gradient-rows'),'5');
    assert.deepEqual(errors,[]);console.log(JSON.stringify({presets:3,customQuery:true,snapshot:true,legacySnapshot:true,keyboard:true,reset:true,randomize:true,zoomStable:true,exported,passed:true}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
