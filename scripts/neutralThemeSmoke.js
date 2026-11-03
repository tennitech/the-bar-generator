/* Focused neutral surfaces, text contrast, export invariants and mobile checks. */
const assert=require('node:assert/strict');const fs=require('node:fs/promises');const {chromium,webkit}=require('playwright');
const base=process.env.RPI_SITE_URL||'http://127.0.0.1:8140';const engine=process.env.RPI_BROWSER||'chromium';const evidence='/tmp/bar-neutral-theme-evidence';
const inks={black:'#000000',white:'#ffffff',red:'#d6001c',blue:'#0081ce',gold:'#cdac38',silver:'#e1edf5',gray:'#b9ccd8',lunar:'#f4f7fb'};
const light=['black','red','blue','gold'];
function luminance(rgb){return rgb.map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(hi+.05)/(lo+.05)}
(async()=>{const browser=await{chromium,webkit}[engine].launch({headless:true});const results=[];await fs.mkdir(evidence,{recursive:true});
try{
 for(const theme of Object.keys(inks)){
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/generator/${theme==='lunar'?'lunar':'ruler'}/?colorMode=${theme}`);await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();await page.evaluate(()=>{noLoop();return document.fonts.ready;});
  const data=await page.evaluate(()=>{
   const css=getComputedStyle(document.body),surface=document.querySelector('.logo-container');
   const rgb=v=>(v.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
   const header=getComputedStyle(document.querySelector('.app-header')),side=getComputedStyle(document.querySelector('.app-sidebar')),control=getComputedStyle(document.querySelector('#color-mode-select').parentElement.querySelector('.custom-select-trigger'));
   const snapshot=captureLogoExportSnapshot();
   return{stage:getComputedStyle(surface).backgroundColor,backdrop:getComputedStyle(surface,'::after').backgroundImage,header:rgb(header.backgroundColor),sidebar:rgb(side.backgroundColor),headerText:rgb(header.color),text:rgb(css.getPropertyValue('--text-primary')),secondary:css.getPropertyValue('--text-secondary').trim(),controlBg:rgb(control.backgroundColor),controlText:rgb(control.color),controlBorder:rgb(control.borderTopColor),fg:snapshot.foreground.toLowerCase(),svg:snapshot.svgSource,label:document.getElementById('color-mode-select-label').textContent,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.equal(data.fg,inks[theme]);assert.equal(data.overflow,false);assert.ok(data.svg.includes(`fill="${data.fg}"`)||data.svg.toLowerCase().includes(`fill="${data.fg}"`));
  if(theme!=='lunar'){
   assert.equal(data.stage,light.includes(theme)?'rgb(255, 255, 255)':'rgb(0, 0, 0)');assert.equal(data.backdrop,'none');assert.equal(data.label,'LOGO COLOR');
   for(const color of [data.header,data.sidebar,data.controlBg])assert.equal(new Set(color).size,1,JSON.stringify(data));
   assert.ok(contrast(data.headerText,data.header)>=4.5);assert.ok(contrast(data.controlText,data.controlBg)>=4.5);assert.ok(contrast(data.controlBorder,data.controlBg)>=3);
  }else {assert.equal(data.stage,'rgb(3, 6, 13)');assert.match(data.backdrop,/lunar-canvas-backdrop/);assert.equal(data.label,'DISPLAY MODE');}
  if(['gold','silver','gray'].includes(theme)){
   const png=await page.evaluate(async()=>{const snapshot=captureLogoExportSnapshot();const blob=await createRasterExportBlob(snapshot,new AbortController().signal);const image=new Image();image.src=URL.createObjectURL(blob);await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const alpha=ctx.getImageData(0,0,1,1).data[3];URL.revokeObjectURL(image.src);return{alpha,width:c.width,height:c.height};});assert.equal(png.alpha,0);data.png=png;
  }
  await page.screenshot({path:`${evidence}/${engine}-${theme}-desktop.png`,scale:'css'});
  if(['white','gold','lunar'].includes(theme)) {
   const mobile=await browser.newPage({viewport:{width:375,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
   await mobile.goto(`${base}/generator/${theme==='lunar'?'lunar':'ruler'}/?colorMode=${theme}`);
   await mobile.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
   await mobile.locator('#mobile-menu-toggle').click();
   await mobile.locator('#mobile-controls-close').waitFor({state:'visible'});
   assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await mobile.screenshot({path:`${evidence}/${engine}-${theme}-phone-controls.png`,scale:'css'});
   await mobile.locator('#mobile-controls-close').click();await mobile.close();
  }
  assert.deepEqual(errors,[]);results.push({theme,...data,svg:undefined});await page.close();
 }
 await fs.writeFile(`${evidence}/${engine}-results.json`,JSON.stringify(results,null,2));console.log(`${engine}: 8 palettes, neutral surfaces/contrast, transparent exports and 375 px controls passed.`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
