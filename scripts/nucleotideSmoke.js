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
  assert.equal((await svg()).match(/data-base=/g).length,30);
  await page.locator('#nucleotide-input').fill('a t-CgU!N123');
  assert.equal(await page.locator('#nucleotide-input').inputValue(),'ATCGU');
  assert.equal(await page.locator('#nucleotide-preset').inputValue(),'custom');
  assert.match(await page.locator('#nucleotide-status').innerText(),/Mixed/);
  assert.equal((await svg()).match(/data-base=/g).length,5);
  await page.locator('#nucleotide-input').fill('');
  assert.match(await page.locator('#nucleotide-status').innerText(),/Enter/);
  assert.doesNotMatch(await svg(),/data-base=/);
  await select('#nucleotide-preset','1');
  assert.equal(await page.locator('#nucleotide-input').inputValue(),'ATGGTGCATCTGACTCCTGAGGAGAAGTCT');
  assert.match(await page.locator('#nucleotide-source').innerText(),/NM_000518.5/);
  await select('#nucleotide-variant','backbone');
  const expected = await svg();
  await page.waitForTimeout(300);
  await page.reload();await page.waitForFunction(()=>typeof buildCurrentBarOnlySVG==='function' && document.querySelector('#p5-container canvas'));
  assert.equal(await svg(),expected,'query reload parity');
  await page.locator('#save-button').click();
  const download=page.waitForEvent('download');await page.locator('#save-svg').click();
  const exported=await fs.readFile(await (await download).path(),'utf8');
  assert.equal((exported.match(/data-base=/g)||[]).length,30);
  assert.match(exported,/viewBox="-20 -20 290 /);
  assert.doesNotMatch(exported,/NaN|undefined/);
  if (!await page.locator('#save-png').isVisible()) await page.locator('#save-button').click();
  await page.locator('#export-size-standard').check();
  const [pngEvent] = await Promise.all([page.waitForEvent('download'), page.locator('#save-png').click()]);
  const png=Promise.resolve(pngEvent);
  const bytes=await fs.readFile(await (await png).path());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  await page.keyboard.press('Escape');
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
  await open('?nucleotideSequence=acgtn123&nucleotideVariant=invalid');
  assert.equal(await page.locator('#nucleotide-input').inputValue(),'ACGT');
  assert.equal(await page.locator('#nucleotide-variant').inputValue(),'separate');
  await open('?nucleotideSequence='+ 'A'.repeat(100));
  assert.equal((await page.locator('#nucleotide-input').inputValue()).length,60);
  // URL and shared snapshots both use the restricted alphabet.
  assert.equal(await page.evaluate(()=>BarShareState.normalizeState({v:1,name:'',controls:{'nucleotide-input':'acgtN!U'},runtime:{}},{'nucleotide-input':{type:'text',maxLength:60}}).controls['nucleotide-input']),'ACGTU');
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
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({engine,passed:true,coverage:'routes, alphabet, empty, presets, provenance, variants, reload parity, SVG/PNG, reset/randomize, keyboard, query/share normalization, 320/390/768 layout'}));
 } catch(error) { console.log(await page.evaluate(()=>document.body.innerText.slice(-2500))); await page.screenshot({path:`/tmp/nucleotide-${engine}-failure.png`,fullPage:true}); throw error; } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
