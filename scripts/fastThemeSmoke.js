/* Bounded native/fallback theme timing and interruption checks. */
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium,webkit}=require('playwright');
const base=process.env.RPI_SITE_URL||'http://127.0.0.1:8139';
const engine=process.env.RPI_BROWSER||'chromium';
(async()=>{
 const browser=await {chromium,webkit}[engine].launch({headless:true});const results=[];
 try{
  for(const fallback of [false,true]){
   const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'no-preference'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(fallback)await page.addInitScript(()=>{document.startViewTransition=undefined;});
   await page.goto(`${base}/generator/solid/`);await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
   await page.evaluate(()=>noLoop());
   const result=await page.evaluate(async()=>{
    const select=document.getElementById('color-mode-select');
    const choose=value=>{select.value=value;select.dispatchEvent(new Event('change'));};
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const token=getComputedStyle(document.documentElement).getPropertyValue('--duration-theme-scan').trim();
    const start=performance.now();choose('white');const immediate=currentColorMode;
    await wait(400);
    const single={elapsed:performance.now()-start,theme:currentColorMode,scanner:document.querySelectorAll('.theme_scan').length,snapshot:document.body.classList.contains('has-theme-snapshot')};
    choose('red');choose('blue');choose('gold');await wait(400);
    const rapid={theme:currentColorMode,scanner:document.querySelectorAll('.theme_scan').length,snapshot:document.body.classList.contains('has-theme-snapshot')};
    choose('white');window.dispatchEvent(new Event('resize'));await wait(100);
    const resize={theme:currentColorMode,scanner:document.querySelectorAll('.theme_scan').length,snapshot:document.body.classList.contains('has-theme-snapshot')};
    return{token,immediate,native:typeof document.startViewTransition==='function',single,rapid,resize};
   });
   assert.equal(result.token,'120ms');assert.equal(result.immediate,'white');assert.equal(result.single.theme,'white');assert.equal(result.rapid.theme,'gold');assert.equal(result.resize.theme,'white');
   for(const state of [result.single,result.rapid,result.resize]){assert.equal(state.scanner,0);assert.equal(state.snapshot,false);}
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await page.evaluate(()=>{const select=document.getElementById('color-mode-select');select.value='black';select.dispatchEvent(new Event('change'));return{theme:currentColorMode,scanner:document.querySelectorAll('.theme_scan').length};});
   assert.deepEqual(reduced,{theme:'black',scanner:0});assert.deepEqual(errors,[]);results.push({fallback,...result,reduced});await page.close();
  }
  await fs.writeFile(`/tmp/fast-theme-${engine}.json`,JSON.stringify(results,null,2));console.log(`${engine}: native/fallback 120 ms duration, repeated switches, resize and reduced motion passed.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
