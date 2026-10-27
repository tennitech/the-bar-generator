const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,webkit,devices}=require('playwright');
const base=process.env.RPI_SITE_URL||'http://127.0.0.1:8000';
const engine=process.env.RPI_BROWSER||'chromium';
const evidence=process.env.RPI_PUBLISH_EVIDENCE;
async function main(){
 const browser=await({chromium,webkit}[engine]).launch({headless:true});const results=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1200,height:800}});page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
  for(const [style,field,maximum,fallback] of [['ruler','rulerSpeed',0.6,0.3],['ticker','tickerSpeed',0.8,0.4],['waveform','waveformSpeed',1,0.3],['wave-quantum','quantumSpeed',1,1]]){
   for(const [entry,value,expected] of [['canonical','999',maximum],['legacy','999',maximum],['canonical','Infinity',fallback],['canonical','0.2',0.2]]){
    const url=entry==='legacy'?`${base}/?style=${style}&${field}=${value}`:`${base}/generator/${style}/?${field}=${value}`;
    await page.goto(url);await page.locator('.header_motion-letters').waitFor();
    const family=style==='wave-quantum'?'quantum':style;
    const result=await page.evaluate(({family,style})=>{
      const value=Number(document.querySelector(`#${family}-speed-slider`).value);
      return{value,period:style==='wave-quantum'?quantumModel.PERIOD_SECONDS/value:getCurrentLoopAnimationState().periodSeconds,
        quantumPlaying:document.querySelector('#quantum-motion-toggle').checked};
    },{family,style});
    assert.equal(result.value,expected,`${entry} ${field}=${value}`);assert.ok(Math.abs(result.period-(family==='quantum'?120:1)/expected)<1e-8);
    if(family==='quantum')assert.equal(result.quantumPlaying,false);
    results.push({style,entry,input:value,...result});
   }
  }
  await page.goto(`${base}/generator/ruler/`);await page.locator('.header_motion-letters').waitFor();await page.waitForLoadState('networkidle');
  for(const theme of ['black','white','red','blue','gold','silver','gray']){
   await page.evaluate(theme=>{const input=document.querySelector('#color-mode-select');input.value=theme;input.dispatchEvent(new Event('change'));},theme);
   await page.waitForFunction(theme=>document.body.classList.contains(`theme-${theme}`)&&!document.querySelector('.theme_scan'),theme);
   const colors=await page.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(document.querySelector('.header_motion-letters')).color;return{letters:c.fillStyle,bar:headerMotionContext.fillStyle};});
   assert.equal(colors.bar,colors.letters,theme);results.push({theme,...colors});
  }
  await page.evaluate(()=>{const s=document.querySelector('#color-mode-select');s.value='black';s.dispatchEvent(new Event('change'));});
  await page.waitForFunction(()=>document.body.classList.contains('theme-black')&&!document.querySelector('.theme_scan'));
  if(process.env.RPI_REVIEW_IMAGES)await page.screenshot({path:path.resolve('references/review-images/motion-desktop.png'),scale:'css'});
  const mobile=await browser.newPage({...devices['iPhone 13'],viewport:{width:390,height:664},reducedMotion:'reduce'});mobile.setDefaultTimeout(30000);mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(`${base}/generator/wave-quantum/?colorMode=white&quantumPhase=0.375`);await mobile.locator('.header_motion-letters').waitFor();await mobile.waitForLoadState('networkidle');
  await mobile.locator('#mobile-menu-toggle').tap();
  await mobile.waitForFunction(()=>!document.querySelector('#app-sidebar').inert);
  await mobile.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const quantum=await mobile.evaluate(()=>({phase:quantumControls.values().quantumPhase,playing:document.querySelector('#quantum-motion-toggle').checked,
    period:quantumModel.PERIOD_SECONDS,modes:quantumModel.MODES,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(quantum.phase,0.375);assert.equal(quantum.playing,false);assert.equal(quantum.period,120);assert.equal(quantum.overflow,false);
  if(process.env.RPI_REVIEW_IMAGES)await mobile.screenshot({path:path.resolve('references/review-images/motion-mobile.png'),scale:'css'});
  results.push({mobileQuantum:quantum});await mobile.close();
  await page.goto(`${base}/generator/lunar/?colorMode=lunar`);await page.locator('#p5-container canvas').waitFor();
  await page.waitForFunction(()=>document.body.classList.contains('theme-lunar'));results.push({lunarTheme:true});
  assert.deepEqual(errors,[]);if(evidence){await fs.mkdir(evidence,{recursive:true});await fs.writeFile(path.join(evidence,`${engine}-publication.json`),JSON.stringify(results,null,2));}
  console.log(`${engine}: canonical/legacy extreme+malformed speed imports, four families, seven themes+Lunar and static mobile Quantum passed.`);
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
