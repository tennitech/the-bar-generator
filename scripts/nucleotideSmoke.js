const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8797';
const engine = process.env.RPI_BROWSER || 'chromium';
const bases = count => 'ATCGU'.repeat(11).slice(0,count);
function assertSpacing(markup) {
 const teeth=[...markup.matchAll(/data-base="[ATCGU]" d="M([\d.e+-]+) [\d.e+-]+ H([\d.e+-]+)/g)];
 assert.equal(teeth.length,(markup.match(/data-base=/g)||[]).length);
 for(let index=1;index<teeth.length;index++) {
  const gap=Number(teeth[index][1])-Number(teeth[index-1][2]);
  assert.ok(Math.abs(gap-4/3)<1e-9,'The gap must stay equal to the 30-base gap');
 }
}
async function main() {
 const browser = await ({ chromium, webkit }[engine]).launch({ headless:true });
 const page = await browser.newPage({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const input=page.locator('#nucleotide-input');
 const state=()=>page.evaluate(()=>({sequence:document.querySelector('#nucleotide-input').value,markup:buildCurrentBarOnlySVG()}));
 const borderColor=()=>input.evaluate(async el=>{getComputedStyle(el).borderColor;await Promise.all(el.getAnimations().filter(animation=>'transitionProperty' in animation).map(animation=>animation.finished.catch(()=>{})));return getComputedStyle(el).borderColor});
 async function open(query='') {
  await page.goto(`${base}/generator/nucleotide/${query}`);
  await page.waitForFunction(()=>window.NucleotidePattern?.bindInput && typeof buildCurrentBarOnlySVG==='function' && document.querySelector('#p5-container canvas'));
  await page.locator('#p5-container.is-entry-complete').waitFor();
 }
 async function select(id,value) { await page.locator(id).selectOption(value,{force:true}); }
 async function triggerExport() {
  const box=await page.locator('#save-button').boundingBox();
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
 }
 async function paste(target,text) {
  await target.evaluate((el,text)=>{
   const data=new DataTransfer();data.setData('text/plain',text);
   const event=new Event('paste',{bubbles:true,cancelable:true});
   Object.defineProperty(event,'clipboardData',{value:data});el.dispatchEvent(event);
  },text);
 }
 try {
  await open();
  assert.equal(await page.locator('#nucleotide-length').count(),0);
  assert.equal((await state()).sequence.length,50);
  assert.equal(await input.getAttribute('maxlength'),'50');
  for (const variant of ['separate','backbone']) {
   await select('#nucleotide-variant',variant);
   for (const count of [0,1,5,29,30,31,40,49,50]) {
    await input.fill(bases(count));
    const {markup}=await state();
    assert.equal((markup.match(/data-base=/g)||[]).length,count);
    assert.equal((markup.match(/data-placeholder=/g)||[]).length,Math.max(0,30-count));
    assertSpacing(markup);
    if (count<30) assert.match(markup,/stroke-dasharray=/);
    assert.equal(await page.locator('#nucleotide-progress').evaluate(el=>el.max),50);
    assert.equal(await page.locator('#nucleotide-progress').evaluate(el=>el.value),count);
    assert.equal(await page.locator('#nucleotide-sequence-control').getAttribute('data-ready'),String(count>=30));
    assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),String(count<30));
    assert.equal(await page.locator('#save-svg').isDisabled(),count<30);
    assert.equal(await page.locator('#copy-png').isDisabled(),count<30);
    if (count<30) {
     assert.match(await page.evaluate(()=>{try{captureLogoExportSnapshot();return ''}catch(error){return error.message}}),/to export/);
     assert.equal(await page.evaluate(()=>logoExportUI.begin('svg')),null);
    } else assert.doesNotMatch(await page.evaluate(()=>captureLogoExportSnapshot().svgSource),/data-placeholder/);
   }
  }
  await input.fill('a t-CgU!N123');assert.equal(await input.inputValue(),'ATCGU');
  assert.match(await page.locator('#nucleotide-status').innerText(),/Mixed/);
  await input.fill(bases(29));await triggerExport();
  assert.ok(await page.locator('#export-blocked-note').isVisible());
  assert.match(await page.locator('#export-blocked-note').innerText(),/Add 1 base/);
  await page.screenshot({path:`/tmp/nucleotide-${engine}-incomplete.png`,fullPage:true});
  await page.locator('#save-button').focus();await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await input.fill('A'.repeat(29));
  const incompleteBorder=await borderColor();
  await input.pressSequentially('A');
  const readyBorder=await borderColor();
  assert.notEqual(readyBorder,incompleteBorder);
  assert.equal((await input.inputValue()).length,30);
  assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'false');
  assert.equal(await input.evaluate(el=>getComputedStyle(el).animationName),'nucleotideInputReady');
  await input.pressSequentially('A');assert.equal((await input.inputValue()).length,31);
  assert.equal(await input.getAttribute('maxlength'),'50');
  assert.doesNotMatch((await state()).markup,/data-placeholder/);
  await input.fill('A'.repeat(50));await input.pressSequentially('A');
  assert.equal((await input.inputValue()).length,50);
  assert.ok(await page.locator('#nucleotide-limit-error').isVisible());
  assert.match(await page.locator('#nucleotide-limit-error').innerText(),/50-base limit/);
  assert.match(await input.evaluate(el=>getComputedStyle(el).animationName),/nucleotideLimitShake/);
  assert.equal(await input.evaluate(el=>getComputedStyle(el).borderColor),incompleteBorder);
  assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'false');
  await page.screenshot({path:`/tmp/nucleotide-${engine}-limit.png`,fullPage:true});
  await page.waitForFunction(()=>!document.querySelector('#nucleotide-sequence-control').classList.contains('is-limit-error'));
  assert.equal(await borderColor(),readyBorder);
  assert.ok(await page.locator('#nucleotide-limit-error').isVisible());
  assert.notEqual(await page.locator('#nucleotide-limit-error').evaluate(el=>getComputedStyle(el).color),incompleteBorder);
  await page.waitForFunction(()=>document.querySelector('#nucleotide-limit-error').hidden);
  assert.equal((await input.inputValue()).length,50);
  assert.match(await page.locator('#nucleotide-status').innerText(),/Maximum reached\. Ready to export/);
  assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'false');
  assert.notEqual(await input.getAttribute('aria-invalid'),'true');
  await page.screenshot({path:`/tmp/nucleotide-${engine}-limit-settled.png`,fullPage:true});
  await input.pressSequentially('A');
  assert.equal(await page.locator('#nucleotide-limit-error').getAttribute('role'),'status');
  assert.equal(await page.locator('#nucleotide-limit-error').getAttribute('aria-live'),'polite');
  await input.press('Tab');assert.ok(!await page.locator('#nucleotide-limit-error').isVisible());
  await input.focus();await input.evaluate(el=>el.setSelectionRange(el.value.length,el.value.length));
  await input.pressSequentially('A');
  await input.press('Backspace');assert.equal((await input.inputValue()).length,49);
  assert.ok(!await page.locator('#nucleotide-limit-error').isVisible());
  assert.doesNotMatch(await page.locator('#nucleotide-status').innerText(),/Maximum reached/);
  await input.fill('A'.repeat(50));
  await input.evaluate(el=>el.setSelectionRange(45,50));
  await input.pressSequentially('CGTAC');
  assert.equal(await input.inputValue(),'A'.repeat(45)+'CGTAC');
  assert.ok(!await page.locator('#nucleotide-limit-error').isVisible());
  await input.fill('');await paste(input,'a t c g u '.repeat(10));
  assert.equal(await input.inputValue(),'ATCGU'.repeat(10));
  assert.ok(!await page.locator('#nucleotide-limit-error').isVisible());
  await input.fill('A'.repeat(45));await paste(input,'C'.repeat(10));
  assert.equal(await input.inputValue(),'A'.repeat(45)+'C'.repeat(5));
  assert.ok(await page.locator('#nucleotide-limit-error').isVisible());
  await input.fill('A'.repeat(49));
  await input.evaluate(el=>{
   el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
   el.value='A'.repeat(51);
   el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,inputType:'insertCompositionText',data:'AA'}));
   el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'AA'}));
   el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'AA'}));
  });
  assert.equal((await input.inputValue()).length,50);
  assert.ok(await page.locator('#nucleotide-limit-error').isVisible());
  await page.emulateMedia({reducedMotion:'reduce'});
  await input.fill('A'.repeat(50));await input.pressSequentially('A');
  assert.equal(await input.evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await input.evaluate(el=>getComputedStyle(el).transform),'none');
  assert.ok(await page.locator('#nucleotide-limit-error').isVisible());
  await input.fill('A'.repeat(29));assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'true');
  await input.pressSequentially('A');assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'false');
  for (const count of [30,31,50]) {
   await input.fill(bases(count));await page.locator('#save-button').click();
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-svg').click()]);
   const output=await fs.readFile(await download.path(),'utf8');
   assert.equal((output.match(/data-base=/g)||[]).length,count);
   assertSpacing(output);
   assert.doesNotMatch(output,/data-placeholder|NaN|undefined/);
   await page.locator('#save-button').focus();await page.keyboard.press('Escape');
  }
  await input.fill(bases(50));await page.locator('#save-button').click();
  await page.locator('#export-size-standard').check();
  await page.evaluate(()=>{const render=createRasterExportBlob;createRasterExportBlob=(snapshot,...args)=>{window.__nucleotidePNGSource=snapshot.svgSource;return render(snapshot,...args)}});
  const [png]=await Promise.all([page.waitForEvent('download'),page.locator('#save-png').click()]);
  const bytes=await fs.readFile(await png.path());
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),1160);assert.equal(bytes.readUInt32BE(20),762);
  const pngSource=await page.evaluate(()=>window.__nucleotidePNGSource);
  assert.doesNotMatch(pngSource,/data-placeholder/);
  assert.equal((pngSource.match(/data-base=/g)||[]).length,50);
  assertSpacing(pngSource);
  await page.waitForFunction(()=>!logoExportUI.isBusy());
  await page.locator('#save-button').focus();await page.keyboard.press('Escape');
  for (let repeat=0;repeat<5;repeat++) {
   const before=await state();
   await page.locator('[data-parameter-style="nucleotide"][data-parameter-action="randomize"]').click();
   const after=await state();assert.ok(after.sequence.length>=30 && after.sequence.length<=50);
   assert.notEqual(after.sequence.length,before.sequence.length);
   assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'false');
   if (repeat===0) {
    await page.locator('[data-randomize-undo="nucleotide"]').click();
    assert.deepEqual(await state(),before);
   }
  }
  const randomized=await state();await page.evaluate(()=>URLState.flush());await page.reload();
  await page.waitForFunction(()=>typeof buildCurrentBarOnlySVG==='function' && document.querySelector('#p5-container canvas'));
  assert.deepEqual(await state(),randomized);
  await page.locator('[data-parameter-style="nucleotide"][data-parameter-action="reset"]').click();
  assert.equal((await input.inputValue()).length,50);
  assert.equal(await page.locator('#nucleotide-preset').inputValue(),'0');
  await page.screenshot({path:`/tmp/nucleotide-${engine}-desktop.png`,fullPage:true});
  await open('?nucleotideLength=30&nucleotideSequence='+ 'A'.repeat(40));
  assert.equal((await input.inputValue()).length,40);
  await input.pressSequentially('A');await page.evaluate(()=>URLState.flush());
  assert.equal(new URL(page.url()).searchParams.has('nucleotideLength'),false);
  for (const width of [320,390,768]) {
   await page.setViewportSize({width,height:844});await open();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  const touch=await browser.newPage({viewport:{width:320,height:700},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  touch.on('pageerror',error=>errors.push(error.message));
  await touch.goto(`${base}/generator/nucleotide/?nucleotideSequence=ATCGU`);
  await touch.waitForFunction(()=>window.randomizeHistory && document.querySelector('#p5-container canvas'));
  const trigger=await touch.locator('#save-button').boundingBox();
  await touch.touchscreen.tap(trigger.x+trigger.width/2,trigger.y+trigger.height/2);
  assert.ok(await touch.locator('#export-blocked-note').isVisible());
  await touch.screenshot({path:`/tmp/nucleotide-${engine}-mobile-blocked.png`,fullPage:true});
  await touch.locator('#mobile-menu-toggle').tap();
  const mobileInput=touch.locator('#nucleotide-input');
  await mobileInput.fill('A'.repeat(29));await mobileInput.pressSequentially('A');
  assert.equal(await touch.locator('#save-button').getAttribute('aria-disabled'),'false');
  await mobileInput.pressSequentially('A');assert.equal((await mobileInput.inputValue()).length,31);
  await touch.locator('#nucleotide-progress').evaluate(el=>el.scrollIntoView({block:'center'}));
  await touch.screenshot({path:`/tmp/nucleotide-${engine}-mobile-controls.png`,fullPage:true});
  await mobileInput.fill('A'.repeat(50));await mobileInput.pressSequentially('A');
  assert.ok(await touch.locator('#nucleotide-limit-error').isVisible());
  assert.equal((await mobileInput.inputValue()).length,50);
  await mobileInput.fill('A'.repeat(5));
  await touch.locator('[data-parameter-style="nucleotide"][data-parameter-action="randomize"]').tap();
  assert.equal(await touch.locator('#save-button').getAttribute('aria-disabled'),'false');
  await touch.locator('[data-randomize-undo="nucleotide"]').tap();
  assert.equal((await mobileInput.inputValue()).length,5);
  assert.equal(await touch.locator('#save-button').getAttribute('aria-disabled'),'true');
  assert.ok(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await touch.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({engine,passed:true,coverage:'30 minimum / 50 maximum, no length selector, 0/1/5/29/30/31/40/49/50, dashed slots, wide teeth and small gaps, red/green progress, native overflow typing, formatted/overlong paste, selection replacement, composition commit, reduced motion, SVG/PNG, Randomize/Undo/Reset, reload/legacy query, responsive and touch'}));
 } catch(error) {
  console.log(await page.evaluate(()=>document.body.innerText.slice(-2500)));
  await page.screenshot({path:`/tmp/nucleotide-${engine}-failure.png`,fullPage:true});throw error;
 } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1});
