const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.RPI_SITE_URL||'http://127.0.0.1:8784';
(async()=>{
 const browser=await ({chromium,webkit}[process.env.RPI_BROWSER || 'chromium']).launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1489,height:974},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const open=async(query='')=>{await page.goto(`${base}/generator/triangle-grid/${query}`);await page.waitForFunction(()=>window.barShareController&&typeof captureLogoExportSnapshot==='function');await page.locator('#p5-container.is-entry-complete').waitFor();};
  const svg=()=>page.evaluate(()=>buildCurrentBarOnlySVG());
  const set=(id,value,event='input')=>page.locator(`#${id}`).evaluate((el,{value,event})=>{el.value=value;el.dispatchEvent(new Event(event,{bubbles:true}));},{value,event});
  await open();const original=await svg();
  assert.equal(await page.locator('#style-select option[value="triangle-grid"]').evaluate(el=>el.parentElement.label),'Dynamic');
  const trigger=page.locator('#triangle-grid-variant-slider').locator('..').locator('.custom-select-trigger');await trigger.focus();await page.keyboard.press('Enter');await page.getByRole('option',{name:'Fine',exact:true}).click();assert.equal(await page.inputValue('#triangle-grid-rows'),'4');
  for(const variant of ['1','2','3']){await set('triangle-grid-variant-slider',variant,'change');const expected=await svg();await open(`?triangleGridVariant=${variant}`);assert.equal(await svg(),expected);}
  await open();await page.locator('#triangle-grid-rows').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.inputValue('#triangle-grid-rows'),'4');
  await set('triangle-grid-density','70');await set('triangle-grid-stroke','60');await set('triangle-grid-stagger','20');const configured=await svg();assert.notEqual(configured,original);
  await page.waitForFunction(()=>new URLSearchParams(location.search).get('triangleGridStagger')==='20');const url=await page.evaluate(()=>location.href);
  await page.reload();await page.waitForFunction(()=>window.barShareController&&typeof buildCurrentBarOnlySVG==='function');assert.equal(await svg(),configured);
  const link=await page.evaluate(()=>barShareController.buildLink());await open();await page.goto(link);await page.waitForFunction(()=>window.barShareController&&typeof buildCurrentBarOnlySVG==='function');assert.equal(await svg(),configured);
  await page.evaluate(()=>barShareController.restoreLocal({v:1,controls:{'style-select':'triangle-grid','triangle-grid-variant-slider':'3'},runtime:{seed:1}}));assert.equal(await page.inputValue('#triangle-grid-rows'),'4');assert.equal(await page.inputValue('#triangle-grid-density'),'100');
  await page.goto(url);await page.waitForFunction(()=>window.barShareController&&typeof captureLogoExportSnapshot==='function');assert.equal(await svg(),configured);
  const exported=await page.evaluate(async()=>{const snapshot=captureLogoExportSnapshot(),blob=await createRasterExportBlob(snapshot,new AbortController().signal),image=await createImageBitmap(blob);const result={bytes:blob.size,width:image.width,height:image.height,header:buildHeaderPreviewSVG().includes(buildCurrentBarPatternSVGFragment())};image.close();return result;});assert.ok(exported.header&&exported.bytes>1000);assert.equal(exported.width,2320);
  await page.evaluate(()=>setZoomLevel(4,{immediate:true}));assert.equal(await svg(),configured);await page.evaluate(()=>setZoomLevel(1,{immediate:true}));
  await page.screenshot({path:'/tmp/triangle-grid-controls-desktop.png'});
  await page.locator('[data-parameter-action="randomize"][data-parameter-style="triangle-grid"]').click();assert.notEqual(await svg(),configured);await page.locator('[data-randomize-undo="triangle-grid"]').click();assert.equal(await svg(),configured);
  await page.locator('[data-parameter-action="reset"][data-parameter-style="triangle-grid"]').click();assert.equal(await svg(),original);
  await page.setViewportSize({width:390,height:844});await page.locator('#mobile-menu-toggle').click();await page.locator('#triangle-grid-stagger').click();await page.screenshot({path:'/tmp/triangle-grid-controls-mobile.png'});await page.locator('#mobile-menu-toggle').click();await page.locator('#mobile-menu-toggle').click();await page.locator('#triangle-grid-rows').scrollIntoViewIfNeeded();await page.locator('#triangle-grid-rows').focus();await page.keyboard.press('End');assert.equal(await page.inputValue('#triangle-grid-rows'),'6');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({presets:3,customQuery:true,snapshot:true,legacySnapshot:true,keyboard:true,mobileReopen:true,undo:true,reset:true,randomize:true,zoomStable:true,exported,passed:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
