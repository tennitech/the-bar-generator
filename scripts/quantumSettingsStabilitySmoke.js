const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async()=>{
 const browser=await ({chromium,webkit}[process.env.RPI_BROWSER||'chromium']).launch();
 try{
  const page=await browser.newPage();
  await page.addInitScript(()=>{window.__summary=[];new MutationObserver(()=>{const e=document.querySelector('[data-parameter-actions="wave-quantum"] [data-parameter-summary]');if(e?.textContent&&window.__summary.at(-1)!==e.textContent)window.__summary.push(e.textContent)}).observe(document,{subtree:true,childList:true,characterData:true})});
  await page.goto(base+'/generator/wave-quantum/');
  await page.waitForFunction(()=>window.barShareController&&document.querySelector('#p5-container canvas')?.dataset.previewReady==='true'&&!PageEntrance.isActive());
  const phase=await page.inputValue('#quantum-phase');await page.waitForTimeout(500);
  assert.notEqual(await page.inputValue('#quantum-phase'),phase,'model phase still advances');
  assert.deepEqual(await page.evaluate(()=>window.__summary),['Default settings'],'playback does not masquerade as edited settings');
  await page.evaluate(()=>{const e=document.querySelector('#quantum-phase');e.value='.37';e.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.waitForTimeout(500);
  assert.deepEqual(await page.evaluate(()=>window.__summary),['Default settings','1 changed from defaults']);
  const chosen=await page.evaluate(()=>quantumControls.settingPhase());assert.ok(Math.abs(chosen-.37)<1e-9);
  await page.evaluate(()=>{const e=document.querySelector('#quantum-phase');e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-parameter-actions="wave-quantum"] [data-parameter-summary]').textContent(),'Default settings');
  await page.reload();await page.waitForFunction(()=>window.barShareController&&document.querySelector('#p5-container canvas')?.dataset.previewReady==='true'&&!PageEntrance.isActive());await page.waitForTimeout(350);
  assert.deepEqual(await page.evaluate(()=>window.__summary),['Default settings']);
  console.log('Quantum initial/repeated entry, automatic phase and intentional phase setting counts passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
