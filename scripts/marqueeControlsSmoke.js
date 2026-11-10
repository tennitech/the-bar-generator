/* Home button removal, keyboard motion stopping, reduced motion and persistence. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-controls-evidence';
const key = 'rpi-marquee-motion';
async function ready(page) {
  await page.waitForFunction(() => document.images.length > 100
    && [...document.images].every(image => image.complete && image.naturalWidth)
    && !window.PageEntrance?.isActive());
  await page.evaluate(() => document.fonts.ready);
}
const rows = page => page.locator('.marquee_track').evaluateAll(nodes => nodes.map(n => n.style.transform));
async function frozen(page) {
  const before = await rows(page); await page.waitForTimeout(220);
  assert.deepEqual(await rows(page), before);
}
async function running(page) {
  const before = await rows(page);
  await page.waitForFunction(before => [...document.querySelectorAll('.marquee_track')]
    .some((node, i) => node.style.transform !== before[i]), before);
}
const paused = page => page.evaluate(() => document.documentElement.dataset.marqueeMotionPaused === 'true');
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless:true,
    ...(process.env.RPI_BROWSER_EXECUTABLE ? {executablePath:process.env.RPI_BROWSER_EXECUTABLE} : {}) });
  const results = [], errors = [];
  await fs.mkdir(evidence, {recursive:true});
  try {
    for (const route of ['/', '/marquee-ui.html']) for (const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]) {
      const context = await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + route); await ready(page); await running(page);
      assert.equal(await page.locator('#marquee-motion-toggle,.hero_controls').count(),0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.className),'marquee_skip-link');
      await page.keyboard.press('Space'); assert.equal(await paused(page),true); await frozen(page);
      assert.match(await page.locator('#marquee-motion-description').textContent(),/paused.*Space to resume/);
      await page.reload(); await ready(page); await frozen(page);
      assert.equal(await paused(page),true);
      await page.keyboard.press('Space'); await running(page);
      await page.emulateMedia({reducedMotion:'reduce'}); await frozen(page);
      await page.keyboard.press('Space'); await frozen(page);
      assert.equal(await paused(page),true,'shortcut cannot override reduced motion');
      await page.emulateMedia({reducedMotion:'no-preference'}); await frozen(page);
      await page.keyboard.press('Space'); await running(page);
      assert.equal(await page.evaluate(key => localStorage.getItem(key),key),'running');
      await page.screenshot({path:path.join(evidence,`${engine}-${route === '/' ? 'home' : 'mirror'}-${width}.png`)});
      await page.locator('.marquee_skip-link').focus(); await page.keyboard.press('Enter');
      await page.waitForURL(`${base}/generator/solid/`);
      results.push({route,width,height,buttonRemoved:true,keyboardPauseResume:true,reducedMotion:true,persistence:true});
      await context.close();
    }
    for(const blocked of ['getter','read','write']) {
      const page=await browser.newPage(); page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(blocked=>{
        if(blocked==='getter') Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError');}});
        else Storage.prototype[blocked==='read'?'getItem':'setItem']=function(){throw new DOMException('Blocked','SecurityError');};
      },blocked);
      await page.goto(base); await ready(page); await running(page);
      await page.keyboard.press('Space'); await frozen(page);
      await page.keyboard.press('Space'); await running(page);
      results.push({blockedStorage:blocked}); await page.close();
    }
    assert.deepEqual(errors,[]);
    const result={engine,passed:true,results,errors,evidence};
    await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
