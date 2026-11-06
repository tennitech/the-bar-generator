const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=process.env.RPI_SITE_URL||'http://127.0.0.1:8861';
const engine=process.env.RPI_BROWSER||'chromium';
const output=process.env.RPI_EVIDENCE_DIR||`/tmp/ruler-static-${engine}`;
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await ({chromium,webkit}[engine]).launch({headless:true,...(process.env.RPI_BROWSER_EXECUTABLE?{executablePath:process.env.RPI_BROWSER_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const ready=()=>page.waitForFunction(()=>window.logoExportUI&&window.barShareController&&!window.PageEntrance?.isActive?.());
 try{
 await page.goto(`${base}/generator/ruler/`);await ready();
 assert.equal(await page.locator('#style-select option[value="ruler"]').evaluate(el=>el.parentElement.label),'Dynamic');
 assert.equal(await page.locator('#ruler-motion-toggle,#ruler-speed-slider,#ruler-reverse-toggle').count(),0);
 assert.equal(await page.locator('#save-loop-gif').isVisible(),false);
 assert.equal(await page.evaluate(()=>isMotionEnabledForStyle('ruler')),false);
 for(const divisions of [2,4,8,10,16])for(const units of [1,10,20])for(const thickness of [.5,1,3]){
  const geometry=await page.evaluate(({divisions,units,thickness})=>{
   const set=(id,value,event)=>{const field=document.getElementById(id);field.value=value;field.dispatchEvent(new Event(event,{bubbles:true}));};
   set('ruler-repeats-slider',units,'input');set('ruler-divisions-select',divisions,'change');set('ruler-thickness-slider',thickness,'input');
   return createRulerPatternGeometry(getCurrentBarPatternValues(250));
  },{divisions,units,thickness});
  assert.equal(geometry.rects.length,divisions*units+1);
  const major=geometry.rects.filter(r=>r.height===18);assert.equal(major.length,units+1);
  major.forEach(tick=>assert.equal(tick.width,major[0].width));
  assert.equal(major[0].x,0);assert.ok(Math.abs(major.at(-1).x+major.at(-1).width-250)<1e-8);
 }
 await page.locator('#ruler-group [data-parameter-action="reset"]').click();
 assert.equal(await page.locator('#ruler-thickness-slider').inputValue(),'1');
 assert.equal(await page.locator('#ruler-group [data-parameter-action="reset"]').isDisabled(),true);
 await page.locator('#ruler-thickness-slider').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#ruler-thickness-slider').inputValue(),'1.1');
 await page.locator('#ruler-thickness-display').click();
 const editor=page.locator('.slider_value-input');await editor.fill('2.3');await editor.press('Enter');
 assert.equal(await page.locator('#ruler-thickness-slider').inputValue(),'2.3');
 await page.waitForTimeout(250);await page.reload();await ready();
 assert.equal(await page.locator('#ruler-thickness-slider').inputValue(),'2.3');
 await page.screenshot({path:`${output}/ruler-desktop.png`});
 const snapshot=await page.evaluate(()=>{
  const snapshot=captureLogoExportSnapshot();
  return {svg:snapshot.svgSource,preview:buildCurrentBarPatternSVGFragment({fgColor:snapshot.foreground}),thickness:snapshot.values.rulerThickness};
 });
 assert.equal(snapshot.thickness,'2.3');assert.ok(snapshot.svg.includes(snapshot.preview));
 for(const format of ['svg','png']){
  const pending=page.waitForEvent('download');assert.ok(await page.evaluate(format=>runLogoExport(format),format));
  const file=await pending;const bytes=await fs.readFile(await file.path());
  if(format==='svg')assert.equal(bytes.toString(),snapshot.svg);
  else assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 }
 const legacy={v:1,controls:{'style-select':'ruler','ruler-repeats-slider':'4','ruler-units-slider':'6','ruler-motion-toggle':true,'ruler-speed-slider':'5','ruler-reverse-toggle':true},runtime:{phase:.37}};
 await page.goto(`${base}/generator/ruler/#bar=${Buffer.from(JSON.stringify(legacy)).toString('base64url')}`);await ready();
 assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'8');
 const before=await page.evaluate(()=>buildCurrentBarOnlySVG());await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>buildCurrentBarOnlySVG()),before);
 assert.equal(await page.evaluate(()=>liveMotionPhase),0);
 await page.setViewportSize({width:375,height:812});await page.locator('#mobile-menu-toggle').click();
 await page.locator('#ruler-group .control-surprise-btn').click();
 assert.ok(Number(await page.locator('#ruler-thickness-slider').inputValue())>=.5);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:`${output}/ruler-mobile-controls.png`});
 await page.locator('#ruler-group [data-parameter-action="reset"]').click();
 await page.locator('#mobile-menu-toggle').click();await page.screenshot({path:`${output}/ruler-mobile-preview.png`});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({engine,geometryCases:45,dynamic:true,noMotion:true,legacy:true,keyboard:true,editableThickness:true,reload:true,mobile:true}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
