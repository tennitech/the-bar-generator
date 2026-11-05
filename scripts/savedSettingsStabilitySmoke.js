const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage();
 await page.addInitScript(() => {
   window.summarySamples=[];
   new MutationObserver(() => {
     const style=document.querySelector('#style-select')?.value;
     const summary=document.querySelector(`[data-parameter-actions="${style}"] [data-parameter-summary]`);
     if(summary?.textContent && window.summarySamples.at(-1)!==summary.textContent) window.summarySamples.push(summary.textContent);
   }).observe(document,{subtree:true,childList:true,characterData:true});
 });
 const base=process.env.RPI_SITE_URL;
 for (const style of ['circles','binary']) {
   await page.goto(`${base}/generator/${style}/`);
   await page.waitForFunction(()=>window.barShareController);
   await page.waitForTimeout(1200);
   let result=await page.evaluate(()=>({samples:window.summarySamples, seed:GeneratorInitialState.getInitialSeed()}));
   assert.deepEqual(result.samples,['Default settings']);
   console.log(style,'default',JSON.stringify(result));
   const hash=await page.evaluate(style=>{
     const snapshot=barShareController.capture();
     snapshot.controls[style==='circles'?'circles-density-slider':'binary-input']=style==='circles'?'75':'BUILD';
     if(style==='circles') snapshot.runtime.seed=87;
     return BarShareState.encodeState(snapshot, barShareController.manifest);
   },style);
   await page.goto('about:blank');
   await page.goto(`${base}/generator/${style}/${hash}`);
   await page.waitForFunction(()=>window.barShareController);
   await page.waitForTimeout(1200);
   result=await page.evaluate(()=>({samples:window.summarySamples, seed:GeneratorInitialState.getInitialSeed()}));
   assert.deepEqual(result.samples,[`${style==='circles'?2:1} changed from defaults`]);
   console.log(style,'saved',JSON.stringify(result));
   await page.reload(); await page.waitForFunction(()=>window.barShareController); await page.waitForTimeout(1000);
   const repeated=await page.evaluate(()=>window.summarySamples);
   assert.deepEqual(repeated,result.samples);
   console.log(style,'repeat',JSON.stringify(repeated));
 }
 await browser.close();
})().catch(error=>{ console.error(error);process.exit(1); });
