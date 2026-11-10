// Local gradient QA: shared geometry, native controls, motion preferences and real exports.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium, webkit } = require('playwright');
const { parseGif, decodeFrames } = require('../tests/helpers/gifDecoder');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8791';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/gradient-motion-${engine}`;
const hash = data => createHash('sha256').update(data).digest('hex');
(async () => {
  await fs.mkdir(evidence, { recursive:true });
  const browser = await ({chromium,webkit}[engine]).launch({headless:true,
    ...(engine === 'chromium' && process.env.RPI_CHROMIUM_PATH ? {executablePath:process.env.RPI_CHROMIUM_PATH} : {})});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:1489,height:974}, reducedMotion:'no-preference'});
    page.on('pageerror', error => errors.push(error.message));
    const ready = async () => { await page.waitForFunction(() => window.barShareController && window._renderer?.canvas?.dataset.previewReady === 'true'); await page.locator('#p5-container.is-entry-complete').waitFor(); };
    const open = async query => { await page.goto(`${base}/generator/gradient/${query || ''}`); await ready(); };
    const phase = () => page.evaluate(() => liveMotionPhase);
    const set = (id,value,event='input') => page.locator(`#${id}`).evaluate((el,{value,event}) => {
      if (el.type === 'checkbox') el.checked = value; else el.value = value;
      el.dispatchEvent(new Event(event,{bubbles:true}));
    },{value,event});
    const pause = () => set('gradient-motion-toggle',false,'change');
    await open();
    assert.equal(await page.locator('#style-select option[value="gradient"]').evaluate(el => el.parentElement.label), 'Dynamic');
    assert.ok(await page.isChecked('#gradient-motion-toggle'));
    const initial = await phase(); await page.waitForTimeout(350); assert.notEqual(await phase(),initial);
    await pause(); const held = await phase(); await page.waitForTimeout(200); assert.equal(await phase(),held,'pause holds coverage');
    await page.evaluate(() => {
      liveMotionPhase = .27;
      const speed = document.getElementById('gradient-speed-slider');speed.value = '.3';speed.dispatchEvent(new Event('input',{bubbles:true}));
      const reverse = document.getElementById('gradient-reverse-toggle');reverse.checked=true;reverse.dispatchEvent(new Event('change',{bubbles:true}));
      if (liveMotionPhase !== .27) throw new Error('Speed/reverse changed current phase');
    });
    await set('gradient-motion-toggle',true,'change'); const beforeReverse=await phase();await page.waitForTimeout(180);assert.ok(await phase()<beforeReverse,'reverse retraces coverage');await pause();
    await page.locator('#gradient-speed-slider').focus();await page.keyboard.press('Home');assert.equal(await page.inputValue('#gradient-speed-slider'),'0.02');
    for (const variant of ['1','2']) {
      await set('gradient-variant-slider',variant);
      const staticSource = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
      const sampled = await page.evaluate(() => {
        const result=[];
        for (const value of [0,.25,.75,1]) {
          liveMotionPhase=value;requestUpdate();draw();
          result.push({phase:value,preview:buildCurrentBarOnlySVG(),still:captureLogoExportSnapshot().svgSource});
        }
        return result;
      });
      assert.equal(sampled[0].preview,sampled[3].preview,'loop seam');
      assert.notEqual(sampled[0].preview,sampled[1].preview);assert.notEqual(sampled[1].preview,sampled[2].preview);
      sampled.forEach(sample => assert.equal(sample.still,staticSource,'still exports use original resting artwork'));
      await page.evaluate(() => {liveMotionPhase=.25;requestUpdate();draw();});
      await page.screenshot({path:path.join(evidence,`variant-${variant}-desktop.png`)});
    }
    await set('gradient-speed-slider','.2');await set('gradient-reverse-toggle',true,'change');
    const link = await page.evaluate(() => {liveMotionPhase=.37;return barShareController.buildLink();});
    await page.goto(link);await ready();assert.equal(await page.isChecked('#gradient-motion-toggle'),false);assert.equal(await phase(),.37);
    assert.equal(await page.inputValue('#gradient-variant-slider'),'2');assert.equal(await page.inputValue('#gradient-speed-slider'),'0.2');assert.ok(await page.isChecked('#gradient-reverse-toggle'));
    await page.evaluate(() => barShareController.restoreLocal({v:1,controls:{'style-select':'gradient','gradient-variant-slider':'2'},runtime:{seed:1}}));
    assert.equal(await page.inputValue('#gradient-variant-slider'),'2');assert.equal(await page.inputValue('#gradient-speed-slider'),'0.1');
    await open('?gradientVariant=2&gradientSpeed=0.3&gradientReverse=true');await pause();
    assert.equal(await page.inputValue('#gradient-speed-slider'),'0.3');assert.ok(await page.isChecked('#gradient-reverse-toggle'));
    const configured = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    await page.locator('[data-parameter-action="randomize"][data-parameter-style="gradient"]').click();
    assert.notEqual(await page.inputValue('#gradient-variant-slider'),'2');
    await page.locator('[data-randomize-undo="gradient"]').click();assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource),configured);
    await page.locator('[data-parameter-action="reset"][data-parameter-style="gradient"]').click();
    assert.equal(await page.inputValue('#gradient-variant-slider'),'1');assert.equal(await page.inputValue('#gradient-speed-slider'),'0.1');assert.equal(await page.isChecked('#gradient-reverse-toggle'),false);
    await page.emulateMedia({reducedMotion:'reduce'});await open('?gradientVariant=2');
    assert.equal(await page.isChecked('#gradient-motion-toggle'),false);const reduced=await phase();await page.waitForTimeout(150);assert.equal(await phase(),reduced);
    await set('gradient-motion-toggle',true,'change');await page.waitForTimeout(150);assert.notEqual(await phase(),reduced,'explicit loop under reduced motion');
    await page.emulateMedia({reducedMotion:'no-preference'});await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.isChecked('#gradient-motion-toggle'),false);
    await page.emulateMedia({reducedMotion:'no-preference'});assert.equal(await page.isChecked('#gradient-motion-toggle'),false,'relaxing preference does not restart');
    await page.evaluate(() => {document.getElementById('export-size-select').value='standard';logoExportUI.sync(false);});
    const still = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
    await page.evaluate(() => setZoomLevel(4,{immediate:true}));assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource),still);
    await page.evaluate(() => setZoomLevel(1,{immediate:true}));
    const exportInfo=[];
    for (const [format,method] of [['svg','saveSVG'],['png','savePNG'],['gif','saveLoopingGIF']]) {
      const pending=page.waitForEvent('download',{timeout:120000});
      assert.ok(await page.evaluate(method => window[method](),method));
      const file=await pending;const target=path.join(evidence,`gradient.${format}`);await file.saveAs(target);
      exportInfo.push({format,filename:file.suggestedFilename(),bytes:(await fs.stat(target)).size});
    }
    assert.equal(await fs.readFile(path.join(evidence,'gradient.svg'),'utf8'),still);
    const png=await fs.readFile(path.join(evidence,'gradient.png'));assert.equal(png.readUInt32BE(16),1160);assert.equal(png.readUInt32BE(20),762);
    const gif=parseGif(await fs.readFile(path.join(evidence,'gradient.gif')));
    assert.equal(gif.width,1160);assert.equal(gif.height,762);assert.equal(gif.frames.length,72);
    assert.equal(gif.frames.reduce((sum,f)=>sum+f.delayMs,0),10000);
    const frameHashes=[];for (const decoded of decodeFrames(gif)) {assert.equal(decoded.frame.disposal,2);assert.ok(decoded.frame.transparent);frameHashes.push(hash(decoded.rgba));}
    assert.ok(new Set(frameHashes).size>20,'encoded GIF contains changing geometry');
    await page.setViewportSize({width:390,height:844});await page.locator('#mobile-menu-toggle').click();
    await page.locator('#gradient-speed-slider').scrollIntoViewIfNeeded();await page.locator('#gradient-speed-slider').focus();await page.keyboard.press('End');assert.equal(await page.inputValue('#gradient-speed-slider'),'0.4');
    await page.screenshot({path:path.join(evidence,'mobile-controls.png')});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth));
    // Gradient must remain a still image in Home, independent of generator eligibility.
    await page.goto(`${base}/`);await page.waitForSelector('img[src*="marquee-bars/gradient"]');
    const marquee = await page.evaluate(() => ({settings:window.MarqueeAnimation?.createSettings({value:'gradient',query:'gradientVariant=2'}) ?? null,
      images:[...document.querySelectorAll('img')].filter(el => /marquee-bars\/gradient/.test(el.src)).map(el => ({src:el.src,canvas:!!el.parentElement.querySelector('canvas')}))}));
    assert.equal(marquee.settings,null);assert.ok(marquee.images.length>0);assert.ok(marquee.images.every(image=>!image.canvas));
    const fallback = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});
    fallback.on('pageerror',e=>errors.push(e.message));
    await fallback.addInitScript(() => {const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/.test(kind)?null:getContext.call(this,kind,...args);};});
    await fallback.goto(`${base}/generator/gradient/?gradientVariant=2`);await fallback.waitForFunction(()=>window._renderer?.canvas?.dataset.previewReady==='true');
    assert.equal(await fallback.evaluate(()=>liveCanvasUsesWebGL),false);
    await fallback.locator('#mobile-menu-toggle').click();await fallback.locator('label[for="gradient-motion-toggle"]').tap();
    const fallbackPhase=await fallback.evaluate(()=>liveMotionPhase);await fallback.waitForTimeout(180);assert.notEqual(await fallback.evaluate(()=>liveMotionPhase),fallbackPhase);
    await fallback.locator('label[for="gradient-motion-toggle"]').tap();await fallback.locator('#mobile-menu-toggle').click();
    await fallback.screenshot({path:path.join(evidence,'mobile-2d-preview.png')});await fallback.close();
    assert.deepEqual(errors,[]);
    const result={engine,passed:true,variants:2,pause:true,reverse:true,keyboard:true,query:true,share:true,legacyShare:true,resetRandomizeUndo:true,reducedMotion:true,staticMarquee:true,touch2d:true,exports:exportInfo,gifFrames:gif.frames.length,evidence};
    await fs.writeFile(path.join(evidence,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
