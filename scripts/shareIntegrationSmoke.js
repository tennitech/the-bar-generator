// Reconciliation coverage for actual current-main controls, not injected fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
async function ready(page) { await page.waitForFunction(() => window.barShareController && window.quantumControls); }
async function svg(page) {
  const waiting = page.waitForEvent('download'); await page.evaluate(() => saveSVG());
  return fs.readFile(await (await waiting).path(), 'utf8');
}
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/generator/wave-quantum/?quantumPhase=0.73&quantumSpeed=0.8&quantumReverse=true`); await ready(page);
    const legacy = page.url();
    const oldQuery = {phase:await page.inputValue('#quantum-phase'),speed:await page.inputValue('#quantum-speed-slider'),reverse:await page.isChecked('#quantum-reverse-toggle')};
    assert.deepEqual(oldQuery,{phase:'0.73',speed:'0.8',reverse:true});
    await page.locator('#quantum-phase').evaluate(field=>{field.value='0.375';field.dispatchEvent(new Event('input',{bubbles:true}));});
    const before = await svg(page);
    const link=await page.evaluate(()=>barShareController.buildLink());
    await page.goto(link); await ready(page);
    assert.equal(await page.inputValue('#quantum-phase'),'0.375');
    assert.equal(await page.inputValue('#quantum-speed-slider'),'0.8');
    assert.equal(await page.isChecked('#quantum-reverse-toggle'),true);
    assert.equal(await page.isChecked('#quantum-motion-toggle'),false);
    assert.equal(await svg(page),before,'Quantum same-phase actual SVG roundtrip');
    // Same-document restoration must parse legacy Quantum query state too.
    await page.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));},legacy);
    assert.equal(await page.inputValue('#quantum-phase'),'0.73');
    assert.equal(await page.inputValue('#quantum-speed-slider'),'0.8');
    assert.equal(await page.isChecked('#quantum-reverse-toggle'),true);
    assert.equal(await page.isChecked('#quantum-motion-toggle'),false);
    const moving=await page.evaluate(()=>{const state=barShareController.capture();state.controls['quantum-motion-toggle']=true;return location.href.split('?')[0]+BarShareState.encodeState(state,barShareController.manifest);});
    await page.goto(moving); await ready(page);
    assert.equal(await page.isChecked('#quantum-motion-toggle'),false,'shared Quantum never auto-starts');
    await page.selectOption('#style-select','circles',{force:true});
    const circleSvg=await svg(page);const circleLink=await page.evaluate(()=>barShareController.buildLink());
    await page.goto(circleLink);await ready(page);assert.equal(await svg(page),circleSvg,'seeded circles retain SVG on reconciled main');
    assert.deepEqual(errors,[]);
    console.log('PASS integrated Quantum phase/rate/reverse/query history/no-auto-start + actual SVG roundtrip; seeded circles SVG unchanged');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
