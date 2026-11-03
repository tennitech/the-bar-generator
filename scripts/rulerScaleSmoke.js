// Real HTTP, rendered controls, captured exports and independent GIF decoding.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium, webkit } = require('playwright');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8856';
const engine = process.env.RPI_BROWSER || 'chromium';
const output = process.env.RPI_EVIDENCE_DIR || `/tmp/ruler-scale-${engine}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const divisions = [2, 4, 8, 10, 16];
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true,
    ...(process.env.RPI_BROWSER_EXECUTABLE ? { executablePath: process.env.RPI_BROWSER_EXECUTABLE } : {}) });
  const results = [];
  try {
    const page = await browser.newPage({ viewport: {width:1440,height:1000}, reducedMotion:'reduce' });
    const errors=[]; page.on('pageerror', e => errors.push(e.message));
    const ready = async () => page.waitForFunction(() => window.logoExportUI && window.barShareController && !window.PageEntrance?.isActive?.());
    await page.goto(`${base}/generator/ruler/`); await ready();
    assert.equal(await page.locator('#ruler-divisions-select').inputValue(), '10');
    assert.equal(await page.locator('#ruler-motion-toggle').isChecked(), false);
    assert.equal(await page.locator('#ruler-repeats-slider').getAttribute('min'), '1');
    for (const count of divisions) for (const units of [1,10,20]) {
      const state = await page.evaluate(({count,units}) => {
        const set=(id,value,type) => {const field=document.getElementById(id);field.value=value;field.dispatchEvent(new Event(type,{bubbles:true}));};
        set('ruler-repeats-slider',units,'input');set('ruler-divisions-select',count,'change');
        const geometry = createRulerPatternGeometry(getCurrentBarPatternValues(250));
        return {count:geometry.rects.length,first:geometry.rects[0],last:geometry.rects.at(-1),phase:liveMotionPhase,
          divisions:getLoopRuntimeValues().rulerUnits,svg:buildCurrentBarOnlySVG(),loop:document.getElementById('ruler-motion-toggle').checked};
      },{count,units});
      assert.equal(state.count,count*units+1); assert.equal(state.first.height,18); assert.equal(state.last.height,18);
      assert.equal(state.first.x,0); assert.ok(Math.abs(state.last.x+state.last.width-250)<1e-8);
      assert.equal(state.phase,0);assert.equal(state.loop,false);assert.equal(Number(state.divisions),count);
      assert.doesNotMatch(state.svg,/NaN|undefined/);
      results.push({divisions:count,units,majorEndpoints:true});
    }
    // Native and enhanced controls stay synchronized through keyboard dismissal.
    const trigger=page.locator('#ruler-divisions-select + .custom-select-trigger');
    await trigger.focus(); await page.keyboard.press('Enter');
    assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape'); assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#ruler-divisions-select + .custom-select-trigger')),true);
    await trigger.press('Enter'); await page.locator('#ruler-divisions-select-options .custom-option[data-value="8"]').click();
    assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'8');
    await page.locator('#ruler-group .control-reset-btn').click();
    assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'10');
    assert.equal(await page.evaluate(()=>liveMotionPhase),0);
    assert.equal(await page.locator('#ruler-group .control-reset-btn').isDisabled(),true);
    await page.screenshot({path:path.join(output,'decimal-desktop.png')});
    // All random choices are supported; Reset deliberately returns the whole-unit origin.
    for(let i=0;i<5;i++){
      await page.locator('#ruler-group .control-surprise-btn').click();
      assert.ok(divisions.includes(Number(await page.locator('#ruler-divisions-select').inputValue())));
      assert.equal(await page.evaluate(()=>liveMotionPhase),0);
    }
    await page.goto(`${base}/generator/ruler/?rulerRepeats=4&rulerUnits=16`);await ready();
    assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'16');
    await page.reload();await ready();assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'16');
    await page.screenshot({path:path.join(output,'fractional-desktop.png')});
    await page.goto(`${base}/generator/ruler/?rulerUnits=6`);await ready();
    assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'8');
    await page.goBack();await ready();assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'16');
    const legacy={v:1,controls:{'style-select':'ruler','ruler-repeats-slider':'4','ruler-units-slider':'6','ruler-motion-toggle':false},runtime:{phase:.37}};
    await page.goto(`${base}/generator/ruler/#bar=${Buffer.from(JSON.stringify(legacy)).toString('base64url')}`);await ready();
    assert.equal(await page.locator('#ruler-divisions-select').inputValue(),'8');
    assert.equal(await page.evaluate(()=>liveMotionPhase),.37);
    results.push({keyboard:true,reset:true,randomize:true,reload:true,history:true,legacySixths:true,legacyPhase:true});
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${base}/generator/ruler/`);await ready();
    await page.locator('#mobile-menu-toggle').click();
    await page.screenshot({path:path.join(output,'decimal-mobile-controls.png')});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    assert.equal(overflow,false);
    await page.locator('#ruler-divisions-select + .custom-select-trigger').click();
    await page.locator('#ruler-divisions-select-options .custom-option[data-value="16"]').click();
    await page.locator('#mobile-menu-toggle').click();
    await page.screenshot({path:path.join(output,'fractional-mobile-preview.png')});
    results.push({mobileWidth:390,noPageOverflow:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(`${base}/generator/ruler/?rulerRepeats=10&rulerUnits=16&rulerSpeed=.6`);await ready();
    const transport=await page.evaluate(async()=>{
      setMotionEnabledForStyle('ruler',true);liveMotionPhase=.37;
      const samples=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);samples.push(liveMotionPhase);}
      setMotionEnabledForStyle('ruler',false);const paused=liveMotionPhase;
      await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
      const kept=paused===liveMotionPhase;
      const beforeReverse=liveMotionPhase;document.getElementById('ruler-reverse-toggle').checked=true;
      document.getElementById('ruler-reverse-toggle').dispatchEvent(new Event('change',{bubbles:true}));
      const afterReverse=liveMotionPhase;setMotionEnabledForStyle('ruler',true);
      const resumed=liveMotionPhase;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
      const reverseMoved=liveMotionPhase;setMotionEnabledForStyle('ruler',false);
      return {samples,kept,beforeReverse,afterReverse,resumed,reverseMoved};
    });
    assert.ok(transport.samples.some((v,i)=>i&&v!==transport.samples[i-1]));assert.equal(transport.kept,true);
    assert.equal(transport.beforeReverse,transport.afterReverse);assert.equal(transport.resumed,transport.afterReverse);
    assert.ok(transport.reverseMoved>transport.resumed);
    for(let i=1;i<transport.samples.length;i++)assert.ok((transport.samples[i-1]-transport.samples[i]+1)%1<=.25/16+1e-9);
    results.push({motion:true,reverseContinuous:true,pauseResumeContinuous:true});
    // Snapshot PNG/SVG and real GIF downloads keep the selected ruler and alpha.
    await page.evaluate(()=>{
      liveMotionPhase=0;document.getElementById('ruler-reverse-toggle').checked=false;
      document.getElementById('export-size-select').value='standard';requestUpdate();
      window.rulerExpected=[];
      const original=createCapturedGifRenderer;
      createCapturedGifRenderer=(snapshot,plan)=>{
        const renderer=original(snapshot,plan),render=renderer.renderFrame;
        renderer.renderFrame=async(index,progress)=>{
          const image=render(index,progress),alpha=new Uint8Array(image.width*image.height);
          const thresholds=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
          for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
            const i=y*image.width+x;alpha[i]=image.data[i*4+3]>(thresholds[(y%4)*4+x%4]+.5)*255/16?255:0;
          }
          rulerExpected[index]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha)),v=>v.toString(16).padStart(2,'0')).join('');
          return image;
        };return renderer;
      };
    });
    for(const [format,method] of [['svg','saveSVG'],['png','savePNG'],['gif','saveLoopingGIF']]){
      const pending=page.waitForEvent('download',{timeout:180000});
      await page.evaluate(method=>window[method](),method);
      const artifact=await pending,bytes=await fs.readFile(await artifact.path());
      await fs.writeFile(path.join(output,`ruler-sixteenths.${format}`),bytes);
      if(format==='svg'){
        assert.match(bytes.toString(),/viewBox="-20 -20 290 190.4885"/);
        assert.doesNotMatch(bytes.toString(),/NaN|undefined/);
        assert.equal(bytes.toString(),await page.evaluate(()=>captureLogoExportSnapshot().svgSource));
      }else if(format==='png'){
        assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
        assert.equal(bytes.readUInt32BE(16),1160);assert.equal(bytes.readUInt32BE(20),762);
        const alpha = await page.evaluate(async source => {
          const image=new Image();image.src=source;await image.decode();
          const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
          const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
          let transparent=0,partial=0,opaque=0;for(let i=3;i<pixels.length;i+=4){if(!pixels[i])transparent++;else if(pixels[i]===255)opaque++;else partial++;}
          return {transparent,partial,opaque};
        },`data:image/png;base64,${bytes.toString('base64')}`);
        assert.ok(alpha.transparent>0&&alpha.partial>0&&alpha.opaque>0);
        results.push({pngDecoded:true,pngTransparencyAndAntialiasing:true});
      }else{
        const gif=parseGif(bytes),expected=await page.evaluate(()=>rulerExpected);
        assert.equal(gif.width,1160);assert.equal(gif.height,762);assert.equal(gif.frames.length,64);
        const duration=gif.frames.reduce((sum,frame)=>sum+frame.delayMs,0);
        assert.equal(duration,1670);
        assert.ok(gif.frames.every(frame=>16*frame.delayMs/duration<.5));
        let count=0;const hashes=[];
        for(const frame of decodeFrames(gif)){
          const alpha=Buffer.alloc(gif.width*gif.height);
          for(let i=0;i<alpha.length;i++)alpha[i]=frame.rgba[i*4+3];
          hashes.push(hash(alpha));assert.equal(hash(alpha),expected[count]);count++;
        }
        assert.equal(count,64);assert.ok(new Set(hashes).size>1);
        assert.ok(gif.frames.every(frame=>frame.transparent&&frame.disposal===2));
        results.push({gifFrames:64,allDecodedCoverageHashesMatch:true,transparent:true});
      }
    }
    await page.emulateMedia({ reducedMotion:'no-preference' });
    const normal = page;
    await normal.goto(`${base}/generator/ruler/`);
    await normal.waitForFunction(() => window.logoExportUI && !window.PageEntrance?.isActive?.());
    assert.equal(await normal.locator('#ruler-motion-toggle').isChecked(),true);
    results.push({normalMotionAutoplays:true,reducedMotionStartsStill:true});
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(output,'results.json'),JSON.stringify({engine,passed:true,results},null,2));
    console.log(JSON.stringify({engine,passed:true,results}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
