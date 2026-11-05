const { chromium, webkit } = require('playwright');
const fs = require('node:fs');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const out = process.env.RPI_LETTER_EVIDENCE || '/tmp/ascii-letter-evidence';
fs.mkdirSync(out, { recursive: true });
(async()=>{
 const browser=await ({chromium,webkit}[process.env.RPI_BROWSER||'chromium']).launch();
 try {
  for(const [name,route,width] of [['home','/',1280],['generator','/generator/solid/',1280],['mobile','/',390]]){
   const context=await browser.newContext({viewport:{width,height:800},recordVideo:{dir:out,size:{width,height:800}}});
   const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{window.__letterFrames=[];const start=performance.now();function tick(t){const active=document.querySelector('.entrance_ascii');if(active)window.__letterFrames.push({t, fields:document.querySelectorAll('.entrance_ascii-artwork,.entrance_ascii-text').length, originalMasks:[...document.querySelectorAll('.is-ascii-original')].map(x=>({tag:x.tagName,mask:getComputedStyle(x).maskImage,opacity:getComputedStyle(x).opacity})),rects:[...document.querySelectorAll('[data-ascii-letter]')].map(x=>0.18 + 0.82 * Number(x.style.opacity))});if(t-start<4000)requestAnimationFrame(tick)}requestAnimationFrame(tick)});
   await page.goto(base+route,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(2500);
   fs.writeFileSync(`${out}/${name}.json`,JSON.stringify(await page.evaluate(()=>({frames:window.__letterFrames,prep:AsciiEntrance.lastPreparation,animation:AsciiEntrance.lastAnimation})),null,2));
   await page.screenshot({path:`${out}/${name}-final.png`}); const video=page.video();await context.close();await video.saveAs(`${out}/${name}.webm`);console.log(name,errors);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
