/* Native hover freezes one preview without pausing the shared model or peers. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=(process.env.RPI_SITE_URL||'http://127.0.0.1:8000').replace(/\/$/,'');
const engine=process.env.RPI_BROWSER||'chromium';
const evidence=process.env.RPI_MARQUEE_EVIDENCE||'/tmp/marquee-preview-hover-evidence';
async function ready(page){await page.waitForFunction(()=>!window.PageEntrance?.isActive() && document.querySelector('.is-animated canvas'));}
async function locate(page,style){return page.evaluate(style=>{
 document.querySelector('#preview-hover')?.removeAttribute('id');
 for(let y=50;y<innerHeight-220;y+=10)for(let x=60;x<innerWidth-70;x+=18){
  const a=document.elementFromPoint(x,y)?.closest('.bar_asset_wrap.is-animated');
  if(a?.dataset.barStyle===style){a.id='preview-hover';return{x,y};}
 }
},style);}
const snapshot=page=>page.evaluate(()=>{
 const a=document.querySelector('#preview-hover'),c=a.querySelector('canvas');
 return{pixels:c.toDataURL(),row:a.closest('.marquee_track').style.transform,
  phase:[...marqueeAnimation.settings.values()].find(s=>s.style===a.dataset.barStyle).phase,
  canvases:document.querySelectorAll('canvas').length};
});
(async()=>{
 const browser=await({chromium,webkit}[engine]).launch({headless:true}),results=[],errors=[];
 try{
  await fs.mkdir(evidence,{recursive:true});
  const page=await browser.newPage({viewport:{width:1600,height:1300},reducedMotion:'no-preference'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Math.random=()=>0.37);
  await page.goto(base);await ready(page);
  for(const style of ['ticker','waveform','wave-quantum']){
   await page.mouse.move(1590,1290);
   const p=await locate(page,style);assert.ok(p,`reachable animated ${style}`);
   await page.mouse.move(p.x,p.y);
   await page.waitForFunction(()=>document.querySelector('#preview-hover').classList.contains('is-hovered'));
   const held=await snapshot(page);
   await page.waitForFunction(phase=>[...marqueeAnimation.settings.values()].find(s=>s.style===document.querySelector('#preview-hover').dataset.barStyle).phase!==phase,held.phase);
   await page.waitForTimeout(250);
   const after=await snapshot(page);
   assert.equal(after.pixels,held.pixels,`${style} pixels hold while shared phase advances`);
   assert.equal(after.row,held.row,`${style} lane is also stationary`);
   await page.mouse.down();await page.waitForTimeout(120);
   assert.equal((await snapshot(page)).pixels,held.pixels,'held press retains the same frame');
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
   await page.mouse.move(1590,1290);
   await page.waitForFunction(pixels=>document.querySelector('#preview-hover canvas').toDataURL()!==pixels,held.pixels);
   results.push(`${style}: native hover/hold freezes pixels; leave/interruption resumes, shared phase continues`);
  }
  const p=await locate(page,'ticker');assert.ok(p);await page.mouse.move(p.x,p.y);
  await page.locator('#marquee-motion-toggle').evaluate(b=>b.click());
  const paused=await snapshot(page);await page.mouse.move(1590,1290);await page.waitForTimeout(200);
  assert.equal((await snapshot(page)).pixels,paused.pixels,'leaving hover cannot override saved global pause');
  await page.locator('#marquee-motion-toggle').click();
  await page.waitForFunction(pixels=>document.querySelector('#preview-hover canvas').toDataURL()!==pixels,paused.pixels);
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await snapshot(page);await page.mouse.move(p.x,p.y);await page.mouse.move(1590,1290);await page.waitForTimeout(200);
  assert.equal((await snapshot(page)).pixels,reduced.pixels,'hover leave cannot override OS reduced motion');
  results.push('global pause and OS reduced motion continue to hold after hover leaves');
  await page.screenshot({path:`${evidence}/${engine}-desktop.png`});await page.close();
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  await phone.addInitScript(()=>Math.random=()=>0.37);await phone.goto(base);await ready(phone);
  const touch=await phone.evaluate(()=>{
   const a=document.querySelector('.is-animated');a.id='preview-hover';
   a.dispatchEvent(new PointerEvent('pointerenter',{bubbles:true,pointerType:'touch'}));
   return{hovered:a.classList.contains('is-hovered'),pixels:a.querySelector('canvas').toDataURL()};
  });
  assert.equal(touch.hovered,false);
  await phone.waitForFunction(pixels=>document.querySelector('#preview-hover canvas').toDataURL()!==pixels,touch.pixels);
  results.push('touch enter creates no sticky hover or frozen sample');
  if(engine==='chromium'){
   let p=null;
   for(const style of ['ticker','waveform','wave-quantum']){p=await locate(phone,style);if(p)break;}
   assert.ok(p,'reachable animated phone sample');
   const cdp=await phone.context().newCDPSession(phone);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});
   const held=await snapshot(phone);await phone.waitForTimeout(220);
   assert.equal((await snapshot(phone)).pixels,held.pixels,'native touch hold freezes preview');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   await phone.waitForFunction(pixels=>document.querySelector('#preview-hover canvas').toDataURL()!==pixels,held.pixels);
   assert.equal(await phone.locator('.is-hovered,.is-pressed').count(),0);
   assert.equal(phone.url(),`${base}/`);
   results.push('native emulated touch hold freezes, cancellation releases without navigation or sticky state');
  }
  await phone.close();assert.deepEqual(errors,[]);
  const result={engine,passed:true,results,errors};await fs.writeFile(`${evidence}/${engine}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
