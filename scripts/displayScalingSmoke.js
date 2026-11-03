/* Real-HTTP layout and complete-frame checks. No UA/DPR layout overrides. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_DISPLAY_EVIDENCE || '/tmp/rpi-display-evidence';
const cases = [[320,568,1], [390,844,3], [844,390,2], [1024,768,2],
  [1440,900,1], [1440,900,2], [1920,1080,1], [2560,1440,2],
  [3840,2160,1], [5120,1440,1], [7680,4320,1], [1440,2560,1], [800,450,2], [720,450,2], [576,360,2.5]];
async function metrics(page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.marquee_row')];
    const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    const last=rows.at(-1).getBoundingClientRect(),brand=box('.hero_brand');
    const angle=parseFloat(getComputedStyle(rows[0]).getPropertyValue('--marquee-tilt'))*Math.PI/180;
    const fieldGap=brand.top-last.top-(brand.left-last.left)*Math.tan(angle)
      -rows.at(-1).offsetHeight*Math.cos(angle);
    return { width:innerWidth, height:innerHeight, dpr:devicePixelRatio,
      scale:Number(document.documentElement.style.getPropertyValue('--hero-scale')),
      rowHeight:rows[0].offsetHeight,
      rowStep:parseFloat(rows[1].style.top)-parseFloat(rows[0].style.top),
      fieldGap, rowCount:rows.length, itemCount:document.images.length,
      assetWidth:document.querySelector('.bar_asset_wrap').offsetWidth,
      title:box('.hero_title'), brand:box('.hero_brand'), prompt:box('.startup_prompt'),
      promptText:box('.startup_prompt_text'),
      overflow:document.documentElement.scrollWidth>innerWidth,
      loaded:[...document.images].every(image=>image.complete&&image.naturalWidth>0) };
  });
}
(async () => {
  const browser = await ({chromium,firefox,webkit}[engine]).launch({headless:true});
  const results = [];
  await fs.mkdir(evidence,{recursive:true});
  try {
    for (const [width,height,deviceScaleFactor] of cases) {
      const context=await browser.newContext({viewport:{width,height},deviceScaleFactor,reducedMotion:'reduce'});
      const page=await context.newPage(); const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base);
      await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(()=>document.querySelector('.startup_prompt').classList.add('is-visible'));
      await page.waitForTimeout(60);
      const current=await metrics(page);
      assert.equal(current.overflow,false);
      if(width>=550&&height>width*1.4) assert.ok(current.fieldGap>=current.rowStep*0.95
        &&current.fieldGap<=current.rowStep*2.05,'portrait field keeps bounded heading clearance');
      assert.ok(current.rowStep/current.rowHeight>=0.95&&current.rowStep/current.rowHeight<=1.34,`row spacing ${width}×${height}`);
      assert.ok(current.title.x>=0&&current.title.right<=width+1,`title width ${width}×${height}`);
      assert.ok(current.title.bottom<=height+1&&current.brand.top>=0,`hero height ${width}×${height}`);
      assert.ok(current.prompt.x>=8&&current.prompt.right<=width-8,`prompt width ${width}×${height}`);
      assert.ok(current.prompt.height<=60,`prompt height ${width}×${height}`);
      assert.ok(current.promptText.width<=current.prompt.width);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(evidence,`${engine}-${width}x${height}-dpr${deviceScaleFactor}.png`),scale:'css'});
      results.push(current);
      // Repeated resize includes lane creation/removal and no missing assets.
      await page.setViewportSize({width:390,height:844});
      await page.setViewportSize({width,height});
      await page.waitForTimeout(100);
      const resized=await metrics(page);
      assert.equal(resized.rowCount,current.rowCount);
      await context.close();
    }
    const layouts=results.filter(r=>r.width===1440&&r.height===900);
    for(const key of ['scale','rowHeight','rowStep','assetWidth','title','brand','prompt']) {
      if (key === 'prompt') {
        // WebKit may snap a centered transform to different device pixels at
        // DPR1/2. Size must stay exact; origin may differ by half a CSS pixel.
        for (const property of Object.keys(layouts[0][key])) {
          if (['x', 'left', 'right'].includes(property)) {
            assert.ok(Math.abs(layouts[0][key][property] - layouts[1][key][property]) <= 0.5,
              `DPR prompt ${property} exceeds device-pixel snapping`);
          } else assert.equal(layouts[0][key][property], layouts[1][key][property], `DPR prompt ${property}`);
        }
      } else assert.deepEqual(layouts[0][key],layouts[1][key],`DPR must not double-scale ${key}`);
    }
    const motion=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    await motion.goto(base); await motion.waitForFunction(()=>!PageEntrance.isActive()&&document.images.length>100);
    const point=await motion.evaluate(()=>{
      for(let y=80;y<500;y+=30) for(let x=100;x<1200;x+=60) {
        const link=document.elementFromPoint(x,y)?.closest('.bar_asset_wrap');
        if(link){link.id='hover-test';return {x,y};}
      }
    });
    assert.ok(point,'visible bar link');
    await motion.mouse.move(point.x,point.y);
    const pos=()=>motion.locator('#hover-test').evaluate(e=>e.parentElement.style.transform);
    const stopped=await pos(); await motion.waitForTimeout(450);
    assert.equal(await pos(),stopped,'hover must pause immediately');
    await motion.mouse.move(20,880); await motion.waitForTimeout(450);
    assert.notEqual(await pos(),stopped,'pointer leave resumes the lane');
    await motion.emulateMedia({reducedMotion:'reduce'}); const reduced=await pos();
    await motion.waitForTimeout(250); assert.equal(await pos(),reduced);
    results.push({hoverPause:true,resume:true,reducedMotion:true}); await motion.close();

    for (const style of ['solid','circles','neural-network','numeric']) {
      for(const reducedMotion of ['reduce','no-preference']) {
        const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion});
        await context.route('**/js/drawing.js*',async route=>{
          const response=await route.fetch(); let source=await response.text();
          source=source.replace('encodeURIComponent(svg)}`, image => {',
            'encodeURIComponent(svg)}`, async image => { await new Promise(resolve => setTimeout(resolve, 500));');
          source+=`\nwindow.__earlyLetters=0; const originalLetters=drawSVGPath; drawSVGPath=function(...args){
            if (![...canonicalBarImages.values()].some(entry=>entry.image)) window.__earlyLetters++;
            return originalLetters(...args); };`;
          await route.fulfill({response,body:source});
        });
        const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`${base}/generator/${style}/`,{waitUntil:'domcontentloaded'});
        await page.locator('#p5-container canvas').waitFor();
        await page.waitForFunction(()=>canonicalBarImages.size>0);
        assert.equal(await page.evaluate(()=>window.__earlyLetters),0,`${style}: no incomplete mark during decode`);
        await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
        await page.waitForFunction(()=>!PageEntrance.isActive());
        assert.equal(await page.evaluate(()=>window.__earlyLetters),0);
        const pixels=await page.evaluate(()=>{
          const source=document.querySelector('#p5-container canvas');
          const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
          const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
          const p=ctx.getImageData(0,0,canvas.width,canvas.height).data;
          let ink=0; for(let i=3;i<p.length;i+=4) if(p[i])ink++;return ink;
        });
        assert.ok(pixels>1000,`${style}: final canvas has real pixels`);
        assert.deepEqual(errors,[]);results.push({style,reducedMotion,delayedDecodeAtomic:true,pixels});
        await context.close();
      }
    }
    const failure=await browser.newContext({reducedMotion:'reduce'});
    await failure.addInitScript(()=>{ window.__failNextCanonical=true; });
    await failure.route('**/js/drawing.js*',async route=>{
      const response=await route.fetch();
      const source=(await response.text()).replace('entry.image = image;',
        `if(window.__failNextCanonical){window.__failNextCanonical=false;
          entry.error=new Error('Injected image failure');reject(entry.error);requestUpdate();return;}
        entry.image = image;`);
      await route.fulfill({response,body:source});
    });
    const retry=await failure.newPage();
    await retry.goto(`${base}/generator/solid/`);
    await retry.locator('#bar-preview-error').waitFor({state:'visible'});
    assert.equal(await retry.locator('#p5-container canvas').getAttribute('data-preview-ready'),null);
    await retry.getByRole('button',{name:'Retry',exact:true}).click();
    await retry.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
    assert.equal(await retry.locator('#bar-preview-error').count(),0);
    await retry.evaluate(()=>{
      window.__failNextCanonical=true;
      styleSelect.value='circles';styleSelect.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await retry.locator('#bar-preview-error').waitFor({state:'visible'});
    await retry.evaluate(()=>{
      styleSelect.value='ruler';styleSelect.dispatchEvent(new Event('change',{bubbles:true}));
    });
    assert.equal(await retry.locator('#bar-preview-error').count(),0);
    results.push({imageFailureRetry:true,failedStyleChangeRecovery:true});
    await failure.close();
    await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify(results,null,2));
    console.log(`${engine}: ${cases.length} viewport/DPR layouts, hover/reduced motion, 8 delayed-image complete-frame cases, and image failure/retry passed. ${evidence}`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
