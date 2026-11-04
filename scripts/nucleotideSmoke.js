const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {chromium, webkit} = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8797';
const engine = process.env.RPI_BROWSER || 'chromium';
async function main() {
 const browser = await ({chromium,webkit}[engine]).launch({headless:true});
 const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 async function open(query='') { await page.goto(`${base}/generator/nucleotide/${query}`);await page.waitForFunction(()=>typeof buildCurrentBarOnlySVG==='function' && document.querySelector('#p5-container canvas'));await page.locator('#p5-container.is-entry-complete').waitFor(); }
 async function select(id,value) { await page.locator(id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));},value); }
 async function svg() { return page.evaluate(()=>buildCurrentBarOnlySVG()); }
 try {
  await open();
  assert.equal(await page.locator('#style-select').inputValue(),'nucleotide');
  assert.equal((await svg()).match(/data-base=/g).length,50);
  await page.locator('#nucleotide-input').fill('a t-CgU!N123');
  assert.equal(await page.locator('#nucleotide-input').inputValue(),'ATCGU');
  assert.equal(await page.locator('#nucleotide-preset').inputValue(),'custom');
  assert.match(await page.locator('#nucleotide-status').innerText(),/Mixed/);
  assert.equal((await svg()).match(/data-base=/g).length,5);
  await page.locator('#nucleotide-input').fill('');
  assert.match(await page.locator('#nucleotide-status').innerText(),/0\/50/);
  assert.doesNotMatch(await svg(),/data-base=/);
  for (const target of [30,40,50]) {
   await select('#nucleotide-length',String(target));
   for (const count of [0,1,5,target-1,target,target-1,0]) {
    await page.locator('#nucleotide-input').fill('ATCGU'.repeat(12).slice(0,count));
    const markup=await svg();
    assert.equal((markup.match(/data-base=/g)||[]).length,count);
    assert.equal((markup.match(/data-placeholder=/g)||[]).length,target-count);
    if (count<target) assert.match(markup,/stroke-dasharray=/);
    assert.equal(await page.locator('#nucleotide-input').getAttribute('maxlength'),String(target));
    assert.equal(await page.locator('#nucleotide-progress').getAttribute('aria-valuetext'),`${count} bases entered; ${count<target ? `${target-count} more needed` : 'ready to export'}`);
    const trigger=await page.locator('#save-button').boundingBox();
    await page.mouse.click(trigger.x+trigger.width/2,trigger.y+trigger.height/2);
    assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),String(count<target));
    assert.equal(await page.locator('#save-svg').isDisabled(),count<target);
    assert.equal(await page.locator('#save-png').isDisabled(),count<target);
    if (count<target) {
     assert.ok(await page.locator('#export-blocked-note').isVisible());
     assert.ok(!await page.locator('#save-menu').isVisible());
     assert.ok(await page.locator('#copy-png').isDisabled());
     assert.match(await page.locator('#export-blocked-note').innerText(),/to export/);
     assert.match(await page.evaluate(()=>{try{captureLogoExportSnapshot();return ''}catch(e){return e.message}}),/to export/);
     assert.equal(await page.evaluate(()=>window.logoExportUI.begin('svg')),null);
    } else assert.doesNotMatch(await page.evaluate(()=>captureLogoExportSnapshot().svgSource),/data-placeholder/);
    if (count===5 && target===50) await page.screenshot({path:`/tmp/nucleotide-${engine}-incomplete.png`,fullPage:true});
    await page.locator('#save-button').focus();
    await page.keyboard.press('Escape');
   }
  }
  await page.locator('#nucleotide-input').hover();
  await page.locator('#save-button').hover();
  assert.ok(await page.locator('#export-blocked-note').isVisible());
  await page.locator('#nucleotide-input').hover();
  assert.ok(!await page.locator('#export-blocked-note').isVisible());
  await page.locator('#nucleotide-input').focus();
  await page.locator('#save-button').focus();
  assert.ok(await page.locator('#export-blocked-note').isVisible());
  await page.keyboard.press('Escape');
  assert.ok(!await page.locator('#export-blocked-note').isVisible());
  await select('#nucleotide-length','30');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#nucleotide-input').fill('A'.repeat(29));
  await page.locator('#nucleotide-input').fill('A'.repeat(30));
  assert.equal(await page.locator('#nucleotide-sequence-control').getAttribute('data-ready'),'true');
  assert.equal(await page.locator('.nucleotide_feedback').evaluate(el=>getComputedStyle(el).animationName),'nucleotideReady');
  assert.equal(await page.locator('#nucleotide-input').evaluate(el=>getComputedStyle(el).animationName),'nucleotideInputReady');
  assert.equal(await page.locator('.nucleotide_ready').evaluate(el=>getComputedStyle(el).opacity),'1');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#nucleotide-input').fill('A'.repeat(29));
  await page.locator('#nucleotide-input').fill('A'.repeat(30));
  assert.equal(await page.locator('.nucleotide_feedback').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.locator('#nucleotide-input').pressSequentially('A');
  assert.equal((await page.locator('#nucleotide-input').inputValue()).length,30);
  assert.equal(await page.locator('#nucleotide-length').inputValue(),'30');
  await select('#nucleotide-length','40');
  assert.equal((await svg()).match(/data-placeholder=/g).length,10);
  assert.equal(await page.locator('#save-button').getAttribute('aria-disabled'),'true');
  await page.locator('#nucleotide-input').fill('A'.repeat(40));
  await page.evaluate(()=>URLState.flush());
  await page.reload();await page.waitForFunction(()=>typeof buildCurrentBarOnlySVG==='function' && document.querySelector('#p5-container canvas'));
  assert.equal(await page.locator('#nucleotide-length').inputValue(),'40');
  assert.equal((await page.locator('#nucleotide-input').inputValue()).length,40);
  await select('#nucleotide-length','30');
  assert.match(await page.locator('#nucleotide-status').innerText(),/Kept the first 30/);
  await select('#nucleotide-length','50');
  await select('#nucleotide-preset','1');
  assert.equal(await page.locator('#nucleotide-input').inputValue(),'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGG');
  assert.match(await page.locator('#nucleotide-source').innerText(),/NM_000518.5/);
  await select('#nucleotide-variant','backbone');
  const expected = await svg();
  await page.waitForTimeout(300);
  await page.reload();await page.waitForFunction(()=>typeof buildCurrentBarOnlySVG==='function' && document.querySelector('#p5-container canvas'));
  assert.equal(await svg(),expected,'query reload parity');
  await page.locator('#save-button').click();
  const download=page.waitForEvent('download');await page.locator('#save-svg').click();
  const exported=await fs.readFile(await (await download).path(),'utf8');
  assert.equal((exported.match(/data-base=/g)||[]).length,50);
  assert.match(exported,/viewBox="-20 -20 290 /);
  assert.doesNotMatch(exported,/NaN|undefined|data-placeholder/);
  if (!await page.locator('#save-png').isVisible()) await page.locator('#save-button').click();
  await page.locator('#export-size-standard').check();
  await page.evaluate(()=>{
   const render=createRasterExportBlob;
   createRasterExportBlob=(snapshot,...args)=>{window.__nucleotidePNGSource=snapshot.svgSource;return render(snapshot,...args)};
  });
  const [pngEvent] = await Promise.all([page.waitForEvent('download'), page.locator('#save-png').click()]);
  const png=Promise.resolve(pngEvent);
  const bytes=await fs.readFile(await (await png).path());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),1160);assert.equal(bytes.readUInt32BE(20),762);
  const pngSource=await page.evaluate(()=>window.__nucleotidePNGSource);
  assert.equal((pngSource.match(/data-base=/g)||[]).length,50);
  assert.doesNotMatch(pngSource,/data-placeholder/);
  await page.waitForFunction(()=>!window.logoExportUI.isBusy());
  // Native download UI can move WebKit focus outside the document.
  // Restore the menu trigger before checking its Escape dismissal path.
  await page.locator('#save-button').focus();
  await page.keyboard.press('Escape');
  await page.locator('#save-menu').waitFor({state:'hidden'});
  await page.locator('[data-parameter-style="nucleotide"][data-parameter-action="reset"]').click();
  assert.equal(await page.locator('#nucleotide-variant').inputValue(),'separate');
  assert.equal(await page.locator('#nucleotide-preset').inputValue(),'0');
  const before=await page.locator('#nucleotide-input').inputValue();
  await page.locator('[data-parameter-style="nucleotide"][data-parameter-action="randomize"]').click();
  assert.notEqual(await page.locator('#nucleotide-input').inputValue(),before);
  // Real custom picker keyboard path.
  await page.getByRole('combobox',{name:/STRUCTURE/}).click();
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await page.screenshot({path:`/tmp/nucleotide-${engine}-desktop.png`,fullPage:true});
  await open('?nucleotideLength=30&nucleotideSequence='+ 'A'.repeat(30));
  await page.locator('#save-button').click();
  const [minimumExport]=await Promise.all([page.waitForEvent('download'),page.locator('#save-svg').click()]);
  const minimumSVG=await fs.readFile(await minimumExport.path(),'utf8');
  assert.equal((minimumSVG.match(/data-base=/g)||[]).length,30);
  assert.doesNotMatch(minimumSVG,/data-placeholder/);
  await open('?nucleotideSequence=acgtn123&nucleotideVariant=invalid');
  assert.equal(await page.locator('#nucleotide-input').inputValue(),'ACGT');
  assert.equal(await page.locator('#nucleotide-variant').inputValue(),'separate');
  await open('?nucleotideSequence='+ 'A'.repeat(100));
  assert.equal((await page.locator('#nucleotide-input').inputValue()).length,50);
  // URL and shared snapshots both use the restricted alphabet.
  assert.equal(await page.evaluate(()=>BarShareState.normalizeState({v:1,name:'',controls:{'nucleotide-input':'acgtN!U'},runtime:{}},{'nucleotide-input':{type:'text',maxLength:50}}).controls['nucleotide-input']),'ACGTU');
  for (const width of [320,390,768]) {
   await page.setViewportSize({width,height:844});await open('?nucleotideVariant=backbone');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
  }
  await page.setViewportSize({width:390,height:844});await open('?nucleotideVariant=backbone');
  await page.screenshot({path:`/tmp/nucleotide-${engine}-mobile.png`,fullPage:true});
  await page.locator('#mobile-menu-toggle').click();
  await page.locator('#nucleotide-input').fill('AUGCAUGC');
  await page.locator('#nucleotide-variant').evaluate(el=>el.scrollIntoView());
  await page.screenshot({path:`/tmp/nucleotide-${engine}-mobile-controls.png`,fullPage:true});
  await page.locator('#mobile-menu-toggle').click();
  assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'),'false');
  const touch=await browser.newPage({viewport:{width:320,height:700},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  await touch.goto(`${base}/generator/nucleotide/?nucleotideSequence=ATCGU`);
  await touch.locator('#p5-container canvas').waitFor();
  const blockedTrigger=await touch.locator('#save-button').boundingBox();
  await touch.touchscreen.tap(blockedTrigger.x+blockedTrigger.width/2,blockedTrigger.y+blockedTrigger.height/2);
  assert.ok(await touch.locator('#export-blocked-note').isVisible());
  assert.ok(!await touch.locator('#save-menu').isVisible());
  assert.ok(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'touch explanation overflow');
  await touch.screenshot({path:`/tmp/nucleotide-${engine}-mobile-blocked.png`,fullPage:true});
  await touch.locator('#mobile-menu-toggle').tap();
  assert.ok(!await touch.locator('#export-blocked-note').isVisible());
  await touch.locator('#nucleotide-input').fill('AUGCAUGC');
  await touch.locator('#nucleotide-progress').evaluate(el=>el.scrollIntoView({block:'center'}));
  const progressBox=await touch.locator('#nucleotide-progress').boundingBox();
  assert.ok(progressBox.y>=0 && progressBox.y+progressBox.height<=700,'touch progress visible');
  await touch.screenshot({path:`/tmp/nucleotide-${engine}-mobile-controls.png`,fullPage:true});
  await touch.close();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({engine,passed:true,coverage:'routes, alphabet, chosen 30/40/50 targets, fixed slots, capped typing, target changes/reload, progress, blocked incomplete exports, capture guard, placeholder-free SVG/PNG, presets, provenance, variants, reload parity, reset/randomize, keyboard, query/share normalization, 320/390/768 layout'}));
 } catch(error) { console.log(await page.evaluate(()=>document.body.innerText.slice(-2500))); await page.screenshot({path:`/tmp/nucleotide-${engine}-failure.png`,fullPage:true}); throw error; } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
