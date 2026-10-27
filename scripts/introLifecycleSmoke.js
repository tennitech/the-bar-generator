const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,webkit,devices}=require('playwright');
const base=process.env.RPI_SITE_URL||'http://127.0.0.1:8000';
const engine=process.env.RPI_BROWSER||'chromium', evidence=process.env.RPI_HEADER_EVIDENCE;
async function main(){
 const browser=await({chromium,webkit}[engine]).launch({headless:true});const results=[];
 try{for(const touch of [false,true]){
  const page=await browser.newPage(touch?{...devices['iPhone 13'],viewport:{width:390,height:664}}:{viewport:{width:1440,height:900}});
  page.setDefaultTimeout(30000);await page.goto(`${base}/generator/ruler/`);await page.locator('.header_motion-letters').waitFor();await page.waitForLoadState('networkidle');
  await page.evaluate(()=>openHeaderLogoAnimation());
  const entrance=await page.evaluate(async()=>{
   const overlay=document.querySelector('#logo-animation-overlay'),chrome=overlay.querySelector('.logo_animation_chrome'),stage=overlay.querySelector('.logo_animation_stage'),button=document.querySelector('#logo-animation-close');
   const frames=[];for(let f=0;f<300;f++){
    await new Promise(requestAnimationFrame);
    if(f===8){const select=document.querySelector('#color-mode-select');select.value='white';select.dispatchEvent(new Event('change'));}
    const bg=getComputedStyle(overlay).backgroundColor.match(/[\d.]+/g);
    frames.push({background:Number(bg[3]??1)/0.96,chrome:Number(getComputedStyle(chrome).opacity),stage:Number(getComputedStyle(stage).opacity),disabled:button.disabled});
    if(frames.at(-1).chrome>0.999)break;
   }return frames;
  });
  assert.ok(entrance.length<300);assert.equal(entrance[0].disabled,true);
  assert.ok(entrance.some(f=>f.chrome>0.05&&f.chrome<0.95));
  entrance.forEach(f=>{assert.ok(Math.abs(f.chrome-f.background)<0.035);assert.ok(Math.abs(f.chrome-f.stage)<0.02)});
  const rects=await page.evaluate(()=>['#logo-animation-replay','.header-actions a[aria-label*="GitHub"]','#logo-animation-close','#mobile-menu-toggle'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[r.x,r.y,r.width,r.height]}));
  assert.deepEqual(rects[0],rects[1]);assert.deepEqual(rects[2],rects[3]);
  const exit=await page.evaluate(async()=>{
   const controller=await ensureHeaderLogoAnimationController();controller.close();
   const o=document.querySelector('#logo-animation-overlay'),c=o.querySelector('.logo_animation_chrome'),s=o.querySelector('.logo_animation_stage'),b=document.querySelector('#logo-animation-close');const frames=[];
   for(let f=0;f<180&&!o.hidden;f++){await new Promise(requestAnimationFrame);if(o.hidden)break;const bg=getComputedStyle(o).backgroundColor.match(/[\d.]+/g);frames.push({background:Number(bg[3]??1)/0.96,chrome:Number(getComputedStyle(c).opacity),stage:Number(getComputedStyle(s).opacity),disabled:b.disabled,inert:document.querySelector('.app-header').inert});}
   return{frames,hidden:o.hidden,focus:document.activeElement.id,bodyFlag:document.body.classList.contains('has-logo-animation')};
  });
  if(evidence)await fs.writeFile(path.join(evidence,`${engine}-intro-timing-${touch?'phone':'desktop'}.json`),JSON.stringify({entrance,exit},null,2));
  assert.equal(exit.hidden,true);assert.equal(exit.focus,'header-logo-preview');assert.equal(exit.bodyFlag,false);
  assert.ok(exit.frames.some(f=>f.chrome>0.05&&f.chrome<0.95));
  exit.frames.forEach(f=>{assert.equal(f.disabled,true);assert.equal(f.inert,true);assert.ok(Math.abs(f.chrome-f.background)<0.035);assert.ok(Math.abs(f.chrome-f.stage)<0.02)});
  await page.evaluate(async()=>{const c=await ensureHeaderLogoAnimationController();for(let i=0;i<8;i++){await c.open();c.close();}await c.open();});
  await page.waitForFunction(()=>!document.querySelector('#logo-animation-close').disabled);
  await page.keyboard.press('Escape');
  await page.evaluate(async()=>{const c=await ensureHeaderLogoAnimationController();await c.open();});
  await page.waitForFunction(()=>!document.querySelector('#logo-animation-close').disabled);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('#logo-animation-overlay').hidden);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  await page.evaluate(()=>openHeaderLogoAnimation());await page.locator('.logo_animation_static').waitFor();
  await page.waitForFunction(()=>!document.querySelector('#logo-animation-close').disabled);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('#logo-animation-overlay').hidden);
  results.push({touch,entrance,exit,rects});await page.close();
 }
 if(evidence)await fs.writeFile(path.join(evidence,`${engine}-intro-lifecycle.json`),JSON.stringify(results,null,2));
 console.log(`${engine}: entrance/exit opacity matched per frame; preserved control geometry, disabled invisible/closing controls, focus return, rapid reopen/close and reduced motion passed.`);
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
