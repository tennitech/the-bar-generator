// Real Numeric control interactions, sharing and downloaded vector/raster parity.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8778';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/rpi-numeric-${engine}`;
async function ready(page) { await page.waitForFunction(() => window.barShareController && window.logoExportUI, null, {timeout:60000}); }
async function choose(page, id, value) {
  // Hidden desktop native controls are intentionally operated through their visible keyboard UI.
  const trigger = page.locator(`#${id}`).locator('..').locator('.custom-select-trigger');
  if (await trigger.isVisible()) {
    await trigger.focus(); await page.keyboard.press('Enter');
    const row = page.locator(`#${id}`).locator('..').locator(`.custom-option[data-value="${value}"]`);
    await row.click();
  } else await page.selectOption(`#${id}`, value);
}
async function file(page, type) {
  const waiting = page.waitForEvent('download');
  await page.evaluate(type => { void window[`save${type}`](); }, type);
  return fs.readFile(await (await waiting).path());
}
(async () => {
  await fs.mkdir(evidence,{recursive:true});
  const browser = await ({chromium,webkit}[engine]).launch();
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    if (!process.env.RPI_NUMERIC_TOUCH_ONLY) {
    await page.goto(`${base}/generator/numeric/`); await ready(page);
    await page.locator('#numeric-input').fill('-001.20');
    assert.equal(await page.inputValue('#numeric-input'),'-001.20');
    await page.locator('#numeric-input').fill('12text34');
    assert.equal(await page.inputValue('#numeric-input'),'-001.20');
    assert.match(await page.locator('#numeric-input-error').innerText(),/decimal/);
    for (const bad of ['NaN','Infinity','1/0','1e3','1..2','2+3','9'.repeat(201)]) {
      await page.evaluate(bad=>{const f=document.getElementById('numeric-input'); f.value=bad;f.dispatchEvent(new Event('input',{bubbles:true}));},bad);
      assert.equal(await page.inputValue('#numeric-input'),'-001.20');
    }
    for (const draft of ['', '-', '.', '-.']) {
      await page.locator('#numeric-input').fill(draft);
      assert.deepEqual(await page.evaluate(()=>parseNumericString(getNumericSourceValue())),[]);
    }
    await page.locator('#numeric-input').press('Tab');
    assert.equal(await page.getAttribute('#numeric-input','aria-invalid'),'true');
    await page.locator('#numeric-input').fill('9'.repeat(200));
    assert.equal((await page.inputValue('#numeric-input')).length,200);
    await page.locator('#numeric-input').fill('001.20');
    const valuesSVG=await file(page,'SVG');
    await page.screenshot({path:path.join(evidence,'values-desktop.png')});
    const sourceTrigger=page.locator('#numeric-source-select').locator('..').locator('.custom-select-trigger');
    await sourceTrigger.focus();await page.keyboard.press('Enter');await page.keyboard.press('End');await page.keyboard.press('Enter');
    assert.equal(await page.locator('#numeric-values-control').isVisible(),false);
    assert.equal(await page.locator('#numeric-formula-control').isVisible(),true);
    const presets=await page.evaluate(()=>NumericControls.presets.map(x=>x.id));
    for (const id of presets) {
      await choose(page,'numeric-formula-select',id);
      for (const mode of ['dotmatrix','height']) {
        await choose(page,'numeric-mode-select',mode);
        const snapshot=await page.evaluate(()=>{
          const s=captureLogoExportSnapshot();
          return {svg:s.svgSource,value:s.values.numericValue,dimensions:s.dimensions};
        });
        assert.ok(!/NaN|Infinity/.test(snapshot.svg));
        const svg=await file(page,'SVG'); assert.equal(svg.toString(),snapshot.svg);
        const png=await file(page,'PNG');
        assert.equal(png.readUInt32BE(16),1160);assert.equal(png.readUInt32BE(20),762);
        // Decode the downloaded PNG and independently rasterize its captured SVG at export dimensions.
        const parity=await page.evaluate(async ({svg,png,width,height})=>{
          // Standard export uses a uniform 4× scale and a whole-pixel viewport.
          const xml=new DOMParser().parseFromString(svg,'image/svg+xml');
          xml.documentElement.setAttribute('width',width);xml.documentElement.setAttribute('height',height);
          xml.documentElement.setAttribute('viewBox',`-20 -20 ${width/4} ${height/4}`);
          svg=new XMLSerializer().serializeToString(xml);
          async function pixels(source) { const image=new Image();image.src=source;await image.decode();const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.drawImage(image,0,0,width,height);return g.getImageData(0,0,width,height).data; }
          const vector=await pixels('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg))));
          const raster=await pixels('data:image/png;base64,'+png);
          let different=0,ink=0;for(let i=0;i<vector.length;i++){if(vector[i]!==raster[i])different++;if(i%4===3&&raster[i])ink++;}
          return {different,ink};
        },{svg:snapshot.svg,png:png.toString('base64'),width:1160,height:762});
        assert.equal(parity.different,0,`${id}/${mode}: PNG differs from captured SVG`);assert.ok(parity.ink>1000);
        const link=await page.evaluate(()=>barShareController.buildLink());
        await page.goto(link);await ready(page);
        assert.equal(await page.inputValue('#numeric-source-select'),'formula');
        assert.equal(await page.inputValue('#numeric-formula-select'),id);
        assert.deepEqual(await file(page,'SVG'),svg);
        if(id==='pi'&&mode==='dotmatrix') await fs.writeFile(path.join(evidence,'pi.svg'),svg);
      }
    }
    await page.screenshot({path:path.join(evidence,'formula-desktop.png')});
    await choose(page,'numeric-source-select','values');
    assert.equal(await page.inputValue('#numeric-input'),'001.20');
    await choose(page,'numeric-mode-select','dotmatrix');
    assert.deepEqual(await file(page,'SVG'),valuesSVG,'inactive values retained across presets');
    await page.reload();await ready(page);
    assert.equal(await page.inputValue('#numeric-source-select'),'values');
    assert.equal(await page.inputValue('#numeric-input'),'001.20');
    await page.getByRole('button',{name:'Reset numeric parameters',exact:true}).click();
    assert.equal(await page.inputValue('#numeric-source-select'),'values');
    assert.equal(await page.inputValue('#numeric-input'),await page.evaluate(()=>NumericControls.DEFAULT_VALUE));
    await page.getByRole('button',{name:'Randomize numeric parameters',exact:true}).click();
    assert.equal(await page.inputValue('#numeric-source-select'),'formula');
    assert.ok(presets.includes(await page.inputValue('#numeric-formula-select')));
    for(const [legacy,expected] of [['PI','3.141592653589793'],['Math.pow(3,5)','243'],['bad123',''],['constructor',''],['toString',''],['__proto__',''],['hasOwnProperty','']]) {
      await page.goto(`${base}/generator/numeric/?numericValue=${encodeURIComponent(legacy)}`);await ready(page);
      assert.equal(await page.evaluate(()=>getNumericSourceValue()),expected);
    }
    const legacy=await page.evaluate(()=>{
      const state=barShareController.capture();delete state.controls['numeric-source-select'];delete state.controls['numeric-formula-select'];state.controls['numeric-input']='Math.sqrt(2)';
      return location.href.split('#')[0]+'#bar='+btoa(JSON.stringify(state)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    });
    await page.goto(legacy);await ready(page);
    assert.equal(await page.inputValue('#numeric-source-select'),'formula');assert.equal(await page.inputValue('#numeric-formula-select'),'sqrt2');
    const unknownLegacy = await page.evaluate(() => {
      const state = barShareController.capture();
      delete state.controls['numeric-source-select']; delete state.controls['numeric-formula-select'];
      state.controls['numeric-input'] = 'constructor';
      return location.href.split('#')[0] + '#bar=' + btoa(JSON.stringify(state)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    });
    await page.goto(unknownLegacy); await ready(page);
    assert.equal(await page.inputValue('#numeric-source-select'), 'values');
    assert.equal(await page.inputValue('#numeric-input'), '');
    assert.equal(await page.evaluate(() => getNumericSourceValue()), '');

    assert.deepEqual(errors,[]);
    }
    const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    const mobile=await touch.newPage();mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.goto(`${base}/generator/numeric/`);await ready(mobile);
    const toggle=mobile.locator('#mobile-menu-toggle');if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
    await mobile.locator('#numeric-input').fill('.25');
    await choose(mobile,'numeric-source-select','formula');await choose(mobile,'numeric-formula-select','half-life');
    await mobile.locator('#numeric-formula-value').scrollIntoViewIfNeeded();
    await mobile.screenshot({path:path.join(evidence,'formula-touch-390.png')});
    await mobile.setViewportSize({width:320,height:700});
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await mobile.locator('#numeric-formula-value').scrollIntoViewIfNeeded();
    await mobile.screenshot({path:path.join(evidence,'formula-touch-320.png')});
    assert.deepEqual(errors,[]);
    console.log(`PASS ${engine}: ${process.env.RPI_NUMERIC_TOUCH_ONLY ? '390/320px touch layouts' : 'decimal edits, Reset/Randomize, 8 presets × 2 encodings with actual SVG/PNG pixel parity and share restore, legacy query/share migration, desktop keyboard/custom controls and 390/320px touch layouts'}. Evidence: ${evidence}`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
