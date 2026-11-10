const assert = require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
 const engine=process.env.RPI_BROWSER||'chromium';const browser=await ({chromium,webkit}[engine]).launch(engine==='chromium'&&process.env.RPI_CHROMIUM_PATH?{executablePath:process.env.RPI_CHROMIUM_PATH}:{});
 try {
  const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  page.on('console',msg=>{if(msg.type()==='error')console.error(msg.text());});
  await page.goto((process.env.RPI_SITE_URL||'http://127.0.0.1:8826')+'/generator/waveform/?waveformLfo=true&waveformLfoRate=2&waveformLfoDepth=100');
  await page.waitForFunction(()=>window.barShareController&&window.logoExportUI);
  console.log('ready');
  assert.equal(await page.locator('#waveform-lfo-settings').isVisible(),true);
  assert.equal(await page.locator('#waveform-motion-toggle').isChecked(),false);
  const samples=await page.evaluate(async()=>{
   async function render(enabled){
    const context=new OfflineAudioContext(1,48000,48000);
    const voice=WaveformLfo.create(context,context.destination,{enabled,rate:2,depth:100});
    const carrier=context.createOscillator();carrier.frequency.value=200;carrier.connect(voice.input);carrier.start();
    const buffer=await context.startRendering();const data=buffer.getChannelData(0);
    const rms=t=>{const center=Math.round(t*48000),half=240;let sum=0;for(let i=center-half;i<center+half;i++)sum+=data[i]*data[i];return Math.sqrt(sum/(half*2));};
    return {peak:rms(.125),trough:rms(.375)};
   }
   return {on:await render(true),off:await render(false)};
  });
  console.log('rendered',JSON.stringify(samples));
  assert.ok(samples.on.peak>samples.on.trough*30,JSON.stringify(samples));
  assert.ok(Math.abs(samples.off.peak-samples.off.trough)<.01,JSON.stringify(samples));
  await page.locator('label.switch:has(#waveform-lfo-toggle)').click();assert.equal(await page.locator('#waveform-lfo-settings').isVisible(),false);
  await page.locator('label.switch:has(#waveform-lfo-toggle)').click();
  await page.locator('[data-lfo-rate-position]').focus();
  await page.keyboard.press('ArrowRight');
  const changedRate=await page.locator('#waveform-lfo-rate').inputValue();
  assert.ok(Number(changedRate)>2);
  assert.equal(await page.locator('[data-lfo-rate-position]').getAttribute('aria-valuetext'),`${changedRate} Hz`);
  const shared = await page.evaluate(()=>barShareController.capture());
  assert.equal(shared.controls['waveform-lfo-toggle'],true);
  assert.equal(shared.controls['waveform-lfo-rate'],changedRate);
  await page.locator('[data-parameter-style="waveform"][data-parameter-action="randomize"]').click();
  await page.locator('#waveform-group .control_undo-button').click();
  assert.equal(await page.locator('#waveform-lfo-rate').inputValue(),changedRate);
  assert.equal(await page.locator('#waveform-lfo-toggle').isChecked(),true);
  await page.locator('#waveform-lfo-depth-display').click();
  const editor = page.locator('#waveform-lfo-depth-display').locator('..').locator('input');
  await editor.fill('75'); await editor.press('Enter');
  assert.equal(await page.locator('#waveform-lfo-depth').inputValue(),'75');

  await page.locator('#waveform-audio-btn').click();await page.waitForFunction(()=>isAudioPlaying);
  await page.evaluate(()=>{const rate=document.getElementById('waveform-lfo-rate');rate.value=4;rate.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#waveform-audio-btn').click();await page.waitForFunction(()=>!isAudioPlaying);
  await page.locator('#waveform-audio-btn').click();await page.waitForFunction(()=>isAudioPlaying);
  await page.selectOption('#style-select','ticker',{force:true});await page.waitForFunction(()=>!isAudioPlaying);
  await page.selectOption('#style-select','waveform',{force:true});
  await page.locator('[data-parameter-style="waveform"][data-parameter-action="reset"]').click();
  assert.equal(await page.locator('#waveform-lfo-toggle').isChecked(),false);
  await page.locator('label.switch:has(#waveform-lfo-toggle)').click();
  for(const width of [1440,390]) {await page.setViewportSize({width,height:900});if(width===390)await page.locator('#mobile-menu-toggle').click();await page.locator('[data-lfo-rate-position]').scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/lfo-${engine}-${width}.png`});}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({engine,samples,result:'PASS'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
