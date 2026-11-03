/* Focused header Home, footer discovery, keyboard and compact-layout checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8138';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_HEADER_EVIDENCE || '/tmp/bar-header-home-evidence';
(async () => {
 const browser = await {chromium,webkit}[engine].launch({headless:true});
 const results=[];
 await fs.mkdir(evidence,{recursive:true});
 try {
  for (const [width,theme] of [[320,'black'],[375,'black'],[390,'lunar'],[844,'black'],[1440,'black'],[1440,'lunar']]) {
   const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<900,reducedMotion:'reduce'});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   const route=`${base}/generator/${theme==='lunar'?'lunar':'solid'}/?colorMode=${theme}`;
   await page.goto(route);
   await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
   await page.evaluate(()=>{ noLoop(); return document.fonts.ready; });
   const measure=await page.locator('#brand-title').evaluate(el=>{
    const rect=el.getBoundingClientRect(), actions=document.querySelector('.header-actions').getBoundingClientRect(), css=getComputedStyle(el);
    return {tag:el.tagName,href:el.href,weight:css.fontWeight,size:parseFloat(css.fontSize),underline:css.textDecorationLine,height:rect.height,gap:actions.x-rect.right,overflow:document.documentElement.scrollWidth>innerWidth,icon:!!el.querySelector('svg'),loaded:document.fonts.check('500 18px RPIGeist')};
   });
   assert.equal(measure.tag,'A');assert.equal(measure.href,`${base}/`);assert.equal(measure.weight,'500');assert.equal(measure.loaded,true);assert.equal(measure.underline,'none');assert.equal(measure.icon,false);assert.equal(measure.overflow,false);assert.ok(measure.height>=44 && measure.gap>=8,JSON.stringify(measure));
   await page.locator('#brand-title').hover();
   assert.equal(await page.locator('.brand_title-text').evaluate(e=>getComputedStyle(e).textDecorationLine),'none');
   await page.screenshot({path:`${evidence}/${engine}-${width}-${theme}.png`,scale:'css'});
   if(width<900) await page.locator('#mobile-menu-toggle').click();
   const trigger=page.locator('#ascii-intro-trigger');await trigger.scrollIntoViewIfNeeded();
   for(const key of ['Enter','Space']) {
    await trigger.focus(); await page.keyboard.press(key);
    await page.locator('.logo_animation_static-artwork > svg').waitFor();
    await page.keyboard.press('Escape');await page.locator('#logo-animation-overlay').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>document.activeElement.id),'ascii-intro-trigger');
    assert.equal(await trigger.getAttribute('aria-expanded'),'false');
   }
   if(width<900) await page.locator('#mobile-controls-close').click();
   await page.locator('#brand-title').click();await page.waitForURL(`${base}/`);
   await page.goBack();await page.locator('#brand-title').waitFor();
   assert.ok(page.url().includes('/generator/'));
   await page.evaluate(()=>document.activeElement.blur());await page.keyboard.type('rpi1824');
   await page.locator('.logo_animation_static-artwork > svg').waitFor();await page.keyboard.press('Escape');
   await page.locator('#logo-animation-overlay').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);results.push({width,theme,...measure});await page.close();
  }
  await fs.writeFile(`${evidence}/${engine}-results.json`,JSON.stringify(results,null,2));
  console.log(`${engine}: ${results.length} layout/theme cases with repeated keyboard intro, Home and Back passed.`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
