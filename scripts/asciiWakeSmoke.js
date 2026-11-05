const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
 const browser = await ({ chromium, webkit }[process.env.RPI_BROWSER || 'chromium']).launch();
 try {
  for (const [route,width] of [['/',1280],['/',390],['/generator/solid/',1280]]) {
   const page = await browser.newPage({ viewport: { width, height: 800 } });
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(() => {
    window.__letterSamples=[];
    const start=performance.now();
    function sample(t){
     const originals=[...document.querySelectorAll('.is-ascii-original')];
     if(originals.length){
      const rects=[...document.querySelectorAll('[data-ascii-letter]')];
      window.__letterSamples.push({
       rects:rects.map(r=>r.style.clipPath),
       typeSizes:rects.filter(r=>r.tagName==='SPAN').map(r=>parseFloat(getComputedStyle(r).fontSize)),
       expectedSizes:[...document.querySelectorAll('.hero_title-line:not([data-ascii-letter])')].map(r=>parseFloat(getComputedStyle(r).fontSize)*r.getBoundingClientRect().width/r.offsetWidth),
       alpha:rects.map(r=>0.18 + 0.82 * Number(r.style.opacity)),
       clips:originals.map(e=>getComputedStyle(e).clipPath),
       text:document.querySelector('.hero_title')?.textContent,
       brand:document.querySelector('.hero_brand')?.classList.contains('is-ascii-original'),
       visibleBars:[...document.querySelectorAll('.bar_asset')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight}).map(e=>e.classList.contains('is-ascii-original')),
       chrome:[...document.querySelectorAll('.hero_credit,.hero_controls')].filter(e=>e.getBoundingClientRect().width>0).map(e=>getComputedStyle(e).opacity)
      });
     }
     if(t-start<4000)requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
   });
   await page.goto(base+route,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.AsciiEntrance?.lastPreparation);
   await page.waitForFunction(()=>!PageEntrance.isActive());
   const samples=await page.evaluate(()=>window.__letterSamples);
   if(samples.length<3)console.log(route,await page.evaluate(()=>({prep:AsciiEntrance.lastPreparation,animation:AsciiEntrance.lastAnimation,samples:window.__letterSamples})));
   assert.ok(samples.length>2,'several real rendered frames observed');
   console.log('Frame metrics',route,width,samples.length,await page.evaluate(()=>AsciiEntrance.lastAnimation));
   const first=samples[0];
   assert.ok(first.alpha.length>=4);
   for(const sample of samples){
    assert.deepEqual(sample.rects,first.rects,'whole-letter masks stay fixed; no moving wipe edge');
    assert.ok(sample.alpha.every(a=>a>=0.18&&a<=1),'real artwork remains present through transition');
    assert.ok(sample.clips.every(c=>c==='none'),'no clipping frontier on any original');
    assert.equal(sample.text,first.text,'semantic heading remains unchanged');
   }
   if(!samples.some(s=>s.alpha.some(a=>a>0.18&&a<1))) console.log('Blend diagnostic', route, width, samples.map(s=>s.alpha.slice(0,12)), await page.evaluate(()=>({prep:AsciiEntrance.lastPreparation,animation:AsciiEntrance.lastAnimation})));
   assert.ok(samples.some(s=>s.alpha.some(a=>a>0.18&&a<1)),'complete letters blend rather than pop');
   if(!samples.some(s=>s.alpha.some(a=>a>0.95)&&s.alpha.some(a=>a<0.5))) console.log('Independent diagnostic',route,width,samples.map(s=>s.alpha.slice(0,12)),await page.evaluate(()=>({prep:AsciiEntrance.lastPreparation,animation:AsciiEntrance.lastAnimation})));
   assert.ok(samples.some(s=>s.alpha.some(a=>a>0.95)&&s.alpha.some(a=>a<0.5)),'letters settle independently');
   if(route==='/'){
    assert.equal(first.brand,true,'red RPI mark participates');
    assert.ok(first.typeSizes.every(size=>first.expectedSizes.some(expected=>Math.abs(size-expected)<0.1)), 'letter overlays match responsive title scale');
    assert.ok(first.visibleBars.length>0&&first.visibleBars.every(Boolean),'all visible bars participate');
    assert.ok(samples.some(s=>s.chrome.every(a=>Number(a)<1)),'supporting controls and credits animate');
   }
   assert.equal(await page.locator('.entrance_ascii,.entrance_ascii-artwork,.entrance_ascii-text,.entrance_ascii-defs,.is-ascii-original').count(),0);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Whole-letter resolve, no moving edge, full Home coverage, continuous artwork and cleanup passed.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
