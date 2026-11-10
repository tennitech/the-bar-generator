const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8842';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/visual-lfo-${engine}`;
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({chromium,webkit}[engine]).launch(engine === 'chromium' && process.env.RPI_CHROMIUM_PATH ? {executablePath:process.env.RPI_CHROMIUM_PATH} : {});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/generator/waveform/?waveformLfo=true&waveformLfoDepth=100`);
    await page.waitForFunction(()=>window.barShareController && window.logoExportUI);
    assert.equal(await page.locator('label[for="waveform-lfo-toggle"]').innerText(),'LFO');
    assert.equal(await page.locator('#waveform-motion-toggle').isChecked(),false);
    const set = async (id,value) => page.evaluate(({id,value})=>{const field=document.getElementById(id);field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));},{id,value});
    const frame = () => page.evaluate(()=>({ ...waveformLfoFrame, playing:isAudioPlaying, time:waveformLfoTime }));
    const held = await frame(); await page.waitForTimeout(150); assert.equal((await frame()).phase,held.phase);
    await page.locator('label.switch:has(#waveform-motion-toggle)').click();
    await page.waitForFunction(()=>waveformLfoTime>.1);
    const silent=await frame(); await page.waitForTimeout(180); assert.notEqual((await frame()).phase,silent.phase);
    assert.equal((await frame()).playing,false);
    // All renderers consume the same current amplitude and fixed coordinates.
    const geometry = await page.evaluate(()=>{
      noLoop(); const values=getCurrentBarPatternValues(250);
      const live=getLiveWaveformGeometry(0,0,250,18,values.timeSeconds);
      const shared=createWaveformPatternGeometry({...values,barStartX:0,barY:0,exactBarWidth:250,barHeight:18});
      const markup=createBarPatternSVG({currentShader:4,fgColor:'#000',barStartX:0,barY:0,exactBarWidth:250,barHeight:18,values});
      const path=shared.polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z';
      loop();return {equal:JSON.stringify(live)===JSON.stringify(shared),svg:markup.includes(`d="${path}"`)};
    }); assert.deepEqual(geometry,{equal:true,svg:true});
    await page.locator('#waveform-audio-btn').click(); await page.waitForFunction(()=>isAudioPlaying);
    assert.ok(await page.evaluate(()=>Math.abs(waveformLfoVoice.sample().phase-waveformLfoFrame.phase)<.2));
    await set('waveform-lfo-type',1.5); await set('waveform-lfo-rate',.07);
    assert.equal(await page.locator('[data-lfo-rate-position]').inputValue(),'0');
    await set('waveform-lfo-rate',1300);
    assert.equal(await page.locator('[data-lfo-rate-position]').inputValue(),'1');
    await page.waitForTimeout(150);
    const fast=[];for(let i=0;i<5;i++){fast.push((await frame()).amplitude);await page.waitForTimeout(35);}
    assert.ok(fast.every(v=>Math.abs(v-.5)<1e-3),JSON.stringify(fast));
    await page.locator('#waveform-audio-btn').click();await page.waitForFunction(()=>!isAudioPlaying);
    await set('waveform-lfo-type',3);await page.waitForTimeout(100);
    assert.ok(Math.abs((await frame()).amplitude-.2)<1e-4);
    // Real offline audio confirms every waveform and a folded midpoint share
    // the visual model (away from discontinuities, allowing Fourier edge error).
    const audio=await page.evaluate(async()=>{
      const out=[];
      for(const type of [0,.5,1,1.5,2,2.5,3]) {
        const context=new OfflineAudioContext(1,48000,48000);
        const voice=WaveformLfo.create(context,context.destination,{enabled:true,rate:2,depth:100,type});
        const carrier=context.createConstantSource();carrier.offset.value=1;carrier.connect(voice.input);carrier.start();
        const buffer=await context.startRendering(),data=buffer.getChannelData(0);
        let error=0,min=1,max=0;
        for(let i=1000;i<data.length;i++) {const t=i/48000,p=((2*t+.25)%1);min=Math.min(min,data[i]);max=Math.max(max,data[i]);
          if([0,.5,.8,1].every(edge=>Math.abs(p-edge)>.03)) error=Math.max(error,Math.abs(data[i]-WaveformLfo.amplitude(t,{enabled:true,rate:2,depth:100,type})));}
        out.push({type,error,min,max});
      } return out;
    });
    for(const sample of audio){assert.ok(sample.error<.08,JSON.stringify(sample));assert.ok(sample.min>=-1e-4&&sample.max<=1.0001,JSON.stringify(sample));}
    // Blur stops audio, leaves the visual transport available, and never autoplays.
    await page.locator('#waveform-audio-btn').click();await page.waitForFunction(()=>isAudioPlaying);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>!isAudioPlaying);
    assert.equal(await page.evaluate(()=>waveformLfoVoice),null);
    await page.locator('label.switch:has(#waveform-motion-toggle)').click();
    const paused=await frame();await page.waitForTimeout(100);assert.equal((await frame()).phase,paused.phase);
    await set('waveform-lfo-rate',.33);await set('waveform-lfo-type',2.5);
    const shared=await page.evaluate(()=>barShareController.buildLink());await page.goto(shared);
    await page.waitForFunction(()=>window.barShareController&&window.logoExportUI);
    assert.equal(await page.locator('#waveform-lfo-rate').inputValue(),'0.33');
    assert.equal(await page.locator('#waveform-lfo-type').inputValue(),'2.5');
    assert.equal((await frame()).playing,false);
    const snapshot=await page.evaluate(()=>{
      const a=captureLogoExportSnapshot(),plan=loopingGifUtils.getLoopingGifFramePlan('waveform',a.values);
      const renderer=createCapturedGifRenderer(a,plan);const first=renderer.renderFrame(0,0),last=renderer.renderFrame(plan.frameCount,1);
      const equal=first.data.every((v,i)=>v===last.data[i]);renderer.release();return {equal,period:plan.periodSeconds,frames:plan.frameCount};
    });assert.equal(snapshot.equal,true);
    await page.locator('[data-parameter-style="waveform"][data-parameter-action="randomize"]').click();
    await page.locator('#waveform-group .control_undo-button').click();
    assert.equal(await page.locator('#waveform-lfo-type').inputValue(),'2.5');
    await page.locator('[data-parameter-style="waveform"][data-parameter-action="reset"]').click();
    assert.equal(await page.locator('#waveform-lfo-toggle').isChecked(),false);assert.equal((await frame()).amplitude,1);
    assert.equal(await page.locator('#waveform-lfo-type').inputValue(),'0');
    await page.locator('label.switch:has(#waveform-lfo-toggle)').click();
    // Keyboard access uses a logarithmic native range; numerical editor accepts Hz.
    await page.locator('[data-lfo-rate-position]').focus();await page.keyboard.press('End');
    assert.equal(await page.locator('#waveform-lfo-rate').inputValue(),'1300');
    await page.keyboard.press('Home');assert.equal(await page.locator('#waveform-lfo-rate').inputValue(),'0.07');
    await page.locator('#waveform-lfo-rate-display').click();
    const editor=page.locator('#waveform-lfo-rate-display').locator('..').locator('input');await editor.fill('2');await editor.press('Enter');
    assert.equal(await page.locator('#waveform-lfo-rate').inputValue(),'2');
    for(const width of [1440,390]) {
      await page.setViewportSize({width,height:1000});
      if(width===390) await page.locator('#mobile-menu-toggle').click();
      await page.locator('[data-lfo-rate-position]').scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:`${evidence}/${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);const result={engine,result:'PASS',audio,snapshot,fast};
    await fs.writeFile(`${evidence}/results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
