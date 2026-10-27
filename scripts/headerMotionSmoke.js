const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:4316';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_HEADER_EVIDENCE;

async function main() {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless:true });
  const results = [], errors = [];
  if(evidence) await fs.mkdir(evidence, {recursive:true});
  try {
    for (const dpr of (process.env.RPI_DPRS || '1,2,3').split(',').map(Number)) {
      const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:dpr});
      const page = await context.newPage();page.setDefaultTimeout(30000);
      page.on('pageerror',e=>errors.push(e.message));
      for (const style of ['ruler','ticker','waveform']) {
        await page.goto(`${base}/generator/${style}/?${style}Speed=999&rulerUnits=10&tickerRatio=5`);
        await page.locator('.header_motion-letters').waitFor();
        await page.waitForLoadState('networkidle');
        const rect = await page.locator('#header-logo-preview').boundingBox();
        const letterClip={x:rect.x,y:rect.y,width:rect.width,height:rect.height*0.73};
        const beforeLetters = await page.screenshot({clip:letterClip,scale:'css'});
        const result = await page.evaluate(async style=>{
          const root=document.querySelector('#header-logo-preview');
          const stage=root.firstElementChild,letters=root.querySelector('svg'),canvas=root.querySelector('canvas');
          const markup=letters.outerHTML,ctx=canvas.getContext('2d');
          let mutations=0;const observer=new MutationObserver(events=>mutations+=events.length);
          observer.observe(root,{childList:true,subtree:true,attributes:true});
          const hashes=[];for(let f=0;f<45;f++){
            await new Promise(requestAnimationFrame);const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
            let hash=0;for(let i=3;i<d.length;i+=4)hash=(hash*31+d[i])>>>0;hashes.push(hash);
          }
          let stable=true;for(let i=0;i<8;i++){
            setMotionEnabledForStyle(style,false);await new Promise(requestAnimationFrame);
            const phase=liveMotionPhase;await new Promise(requestAnimationFrame);
            if(liveMotionPhase!==phase)stable=false;
            setMotionEnabledForStyle(style,true);
            if(root.firstElementChild!==stage||root.querySelector('svg')!==letters||root.querySelector('canvas')!==canvas)stable=false;
          }
          observer.disconnect();const slider=document.querySelector(`#${style}-speed-slider`);
          return {style,dpr:devicePixelRatio,speed:Number(slider.value),min:Number(slider.min),max:Number(slider.max),
            period:getCurrentLoopAnimationState().periodSeconds,canvas:[canvas.width,canvas.height],
            mutations,stable,lettersUnchanged:letters.outerHTML===markup,uniqueBarFrames:new Set(hashes).size};
        },style);
        const afterLetters = await page.screenshot({clip:letterClip,scale:'css'});
        assert.equal(Buffer.compare(beforeLetters,afterLetters),0,`${style}: actual-size letter pixels changed`);
        assert.equal(result.mutations,0);assert.equal(result.stable,true);assert.equal(result.lettersUnchanged,true);
        assert.ok(result.uniqueBarFrames>1,`${style}: bar was frozen`);
        assert.equal(result.speed,result.max);assert.ok(Math.abs(result.period-1/result.max)<1e-8);
        if(evidence) await page.screenshot({path:path.join(evidence,`${engine}-${style}-dpr${dpr}.png`),scale:'css'});
        results.push(result);
        await page.goto(`${base}/generator/${style}/?${style}Speed=garbage`);
        await page.locator('.header_motion-letters').waitFor();
        const fallback=await page.locator(`#${style}-speed-slider`).inputValue();
        assert.equal(Number(fallback),{ruler:0.3,ticker:0.4,waveform:0.3}[style]);
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
      for (const theme of ['white','red','black']) {
        await page.evaluate(theme=>{const s=document.querySelector('#color-mode-select');s.value=theme;s.dispatchEvent(new Event('change'));},theme);
        const color=await page.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(document.querySelector('.header_motion-letters')).color;return {expected:c.fillStyle,actual:headerMotionContext.fillStyle};});
        assert.equal(color.actual,color.expected,`paused/reduced-motion theme ${theme} color mismatch`);
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);
    if(evidence) await fs.writeFile(path.join(evidence,`${engine}-header${process.env.RPI_HEADER_SUFFIX || ''}-results.json`),JSON.stringify(results,null,2));
    console.log(`${engine}: 3 families × DPR${process.env.RPI_DPRS || '1/2/3'}; exact stable letter pixels, persistent DOM through8 pause/play cycles, moving bar frames and bounded URL/export timing passed.`);
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
