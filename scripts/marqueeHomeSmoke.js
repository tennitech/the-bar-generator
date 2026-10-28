const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');
const { entries } = require('../js/utils/marqueeCatalog');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8779';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-home-evidence';
async function main() {
 const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
 const checks = [];
 await fs.mkdir(evidence, { recursive: true });
 try {
  for (const touch of [false,true]) {
   const context = await browser.newContext(touch ? { ...devices['iPhone 13'], reducedMotion:'reduce' } : {viewport:{width:1440,height:900},reducedMotion:'reduce'});
   const page = await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base);
   await page.waitForFunction(()=>document.querySelectorAll('.marquee_item:not(.is-measure) img').length>100 && [...document.images].every(i=>i.complete && i.naturalWidth>0));
   const inventory=await page.evaluate(()=>({styles:[...new Set([...document.querySelectorAll('[data-bar-style]')].map(e=>e.dataset.barStyle))],background:getComputedStyle(document.querySelector('.section_marquee_hero')).backgroundColor,image:getComputedStyle(document.querySelector('.section_marquee_hero')).backgroundImage,sourceCount:new Set([...document.images].map(i=>i.src)).size,count:document.images.length,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.deepEqual(inventory.styles.sort(),entries.map(e=>e.value).sort());assert.equal(inventory.background,'rgb(0, 0, 0)');assert.equal(inventory.image,'none');assert.equal(inventory.sourceCount,21);assert.equal(inventory.overflow,false);assert.ok(inventory.count<300);
   await page.screenshot({path:path.join(evidence,`${engine}-${touch?'touch':'desktop'}-home.png`)});
   checks.push({touch,inventory});
   await page.goto(`${base}/generator/solid/?colorMode=black`);await page.locator('#p5-container canvas').waitFor();await page.waitForLoadState('networkidle');
   const home=page.getByRole('link',{name:'RPI — Home'});
   assert.equal(await home.getAttribute('href'),'./');assert.equal(await home.getAttribute('role'),null);assert.equal(await home.getAttribute('aria-haspopup'),null);
   assert.equal(await home.evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 0)');
   // Native browser opening and history preserve state and the canonical home URL.
   if(!touch){const popupWait=context.waitForEvent('page');await home.click({modifiers:['Meta']});const popup=await popupWait;await popup.waitForLoadState();assert.equal(new URL(popup.url()).pathname,'/');await popup.close();assert.match(page.url(),/generator\/solid/);}
   if(touch) await home.tap(); else {await home.focus();await page.keyboard.press('Enter');}
   await page.waitForURL(`${base}/`);await page.goBack();await page.locator('#p5-container canvas').waitFor();assert.equal(await page.evaluate(()=>currentColorMode),'black');
   await page.locator('#brand-title').click({clickCount:3});assert.equal(await page.locator('#logo-animation-overlay').count(),0);
   await page.locator('#brand-title').focus();await page.keyboard.type('rpi182');await page.keyboard.press('x');await page.keyboard.type('4');assert.equal(await page.locator('#logo-animation-overlay').count(),0);
   await page.keyboard.type('rpi1824');await page.locator('.logo_animation_static svg').waitFor();assert.equal(await page.locator('.logo_animation_frame').count(),0);
   await page.getByRole('button',{name:'Play animation once'}).click();await page.frameLocator('.logo_animation_frame').locator('#animation-projection').filter({hasText:/\S/}).waitFor();
   await page.screenshot({path:path.join(evidence,`${engine}-${touch?'touch':'desktop'}-secret.png`)});
   await page.keyboard.press('Escape');await page.locator('#logo-animation-overlay').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.activeElement.id),'brand-title');
   // Short holds and a moved/cancelled hold are not the secret.
   const box=await page.locator('#brand-title').boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();await page.locator('#brand-title').click({clickCount:2});assert.equal(await page.locator('#logo-animation-overlay').isVisible(),false);
   // Real touch pointer events for mobile, physical mouse hold for desktop.
   if(touch) {
    if(engine==='chromium') {
     const session=await context.newCDPSession(page);
     await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
     await page.waitForTimeout(1900);
     await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
    } else {
     // WebKit's driver has tap but no held-touch API: hold with a mouse in
     // the coarse-pointer viewport, then complete with genuine touch taps.
     await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(1900);await page.mouse.up();
    }
    await page.locator('#brand-title').tap();await page.locator('#brand-title').tap();
   } else {await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(1900);await page.mouse.up();await page.locator('#brand-title').click();await page.locator('#brand-title').click();}
   await page.locator('.logo_animation_static svg').waitFor();await page.getByRole('button',{name:'Close animation',exact:true}).click();await page.locator('#logo-animation-overlay').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);checks.push({touch,navigation:true,secret:true});await context.close();
  }
  // Source and actual export foreground/pixels for all standard palette entries.
  const page=await browser.newPage({reducedMotion:'reduce'});
  for(const [mode,ink] of Object.entries({black:'#000000',white:'#ffffff',red:'#d6001c',blue:'#0081ce',gold:'#cdac38',silver:'#e1edf5',gray:'#b9ccd8'})){
   await page.goto(`${base}/generator/solid/?colorMode=${mode}`);await page.locator('#p5-container canvas').waitFor();
   const result=await page.evaluate(async()=>{const s=captureLogoExportSnapshot();const blob=await createRasterExportBlob(s,new AbortController().signal);const image=new Image();image.src=URL.createObjectURL(blob);await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const px=[...ctx.getImageData(Math.round((20+125)*4),Math.round((20+140)*4),1,1).data];URL.revokeObjectURL(image.src);return {fg:s.foreground.toLowerCase(),source:s.svgSource.includes(`fill="${s.foreground}"`),px};});
   assert.equal(result.fg,ink);assert.equal(result.source,true);assert.deepEqual(result.px,[...ink.slice(1).match(/../g).map(n=>parseInt(n,16)),255]);checks.push({mode,...result});
  }
  await page.close();
  await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify(checks,null,2));console.log(JSON.stringify({engine,checks:checks.length,passed:true,evidence}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
