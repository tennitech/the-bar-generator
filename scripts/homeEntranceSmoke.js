/* Home first paint, coordinated reveal, slow loading and interrupted navigation. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_ENTRANCE_EVIDENCE || '/tmp/home-entrance-evidence';
function observe() {
  Math.random = () => 0.37;
  window.__entrySamples = [];
  const start = performance.now();
  function sample(now) {
    const page = document.querySelector('[data-entrance-page="selector"]');
    if (page) {
      window.__entrySamples.push({ time: now, opacity: Number(getComputedStyle(page).opacity),
        active: Boolean(window.PageEntrance?.isActive()), hold: Boolean(window.PageEntrance?.isHoldingArtwork()),
        mode: document.querySelector('[data-entrance-plane]')?.dataset.entryMode,
        ready: [...document.images].every(image => image.complete), fonts: document.fonts?.status,
        tracks: [...document.querySelectorAll('.marquee_track')].slice(0, 3).map(item => item.style.transform) });
    }
    if (now - start < 6000) requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}
async function finished(page) {
  await page.waitForFunction(() => window.PageEntrance && !PageEntrance.isActive() && document.querySelector('[data-entrance-plane].is-entry-complete'));
}
async function verifyFade(page) {
  await finished(page);
  const samples = await page.evaluate(() => window.__entrySamples);
  assert.equal(samples[0].opacity, 0, 'first painted Home is concealed as a single composition');
  // Emulated WebKit may deliver only a few rAF callbacks while its compositor
  // continues the transition. Require real intermediate paint, not a hardware FPS.
  const faded = samples.filter(s => s.opacity > 0 && s.opacity < 1);
  assert.ok(faded.length >= 1, `must paint intermediate opacity frames, not pop (${faded.length})`);
  assert.ok(faded.every(s => s.active && s.hold), 'lane/model clocks hold throughout entrance');
  const stable = faded.filter(s => s.tracks.length === 3);
  assert.ok(stable.length >= 1); stable.forEach(s => assert.deepEqual(s.tracks, stable[0].tracks));
  assert.equal(await page.locator('[data-entrance-plane]').getAttribute('data-entry-mode'), 'fade');
  assert.equal(await page.locator('[data-entrance-page]').evaluate(e => getComputedStyle(e).opacity), '1');
  assert.equal(await page.locator('[data-entrance-plane]').evaluate(e => getComputedStyle(e).maskImage), 'none');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  return { frames: faded.length, firstFade: faded[0].time, complete: samples.find(s => s.opacity === 1)?.time };
}
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({chromium, webkit}[engine]).launch({headless:true});
  const results = [];
  const errors = [];
  async function context(options = {}) {
    const ctx = await browser.newContext(options); await ctx.addInitScript(observe);
    ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return ctx;
  }
  try {
    for (const width of [1440, 390]) {
      const ctx = await context({viewport:{width,height:width === 390 ? 844 : 900}}), page = await ctx.newPage();
      await page.goto(base, {waitUntil:'domcontentloaded'});
      const cold = await verifyFade(page);
      await page.screenshot({path:path.join(evidence, `${engine}-${width}-complete.png`)});
      await page.reload({waitUntil:'domcontentloaded'}); const warm = await verifyFade(page);
      assert.equal(await page.locator('[data-entrance-plane]').getAttribute('data-entry-duration'), '400');
      results.push({kind:'cold-and-cached',width,cold,warm}); await ctx.close();
    }
    // Force the previously unanimated fallback and a harmless resize before load.
    const slow = await context({viewport:{width:1230,height:1470}});
    await slow.addInitScript(() => { document.startViewTransition = undefined; });
    await slow.route('**/assets/images/marquee-bars/**', async route => { await new Promise(r=>setTimeout(r,1000)); await route.continue(); });
    await slow.route('**/*.woff2', async route => { await new Promise(r=>setTimeout(r,1100)); await route.continue(); });
    const page = await slow.newPage(); await page.goto(base,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('[data-entrance-page]').evaluate(e=>getComputedStyle(e).opacity),'0');
    assert.equal(await page.evaluate(()=>PageEntrance.isHoldingArtwork()),true);
    await page.setViewportSize({width:1231,height:1470});
    // Chromium provides a useful intermediate still. WebKit's emulated rAF
    // cadence can miss this narrow screenshot window; verify its recorded
    // intermediate frames below rather than imposing a hardware FPS limit.
    if (engine === 'chromium') {
      await page.waitForFunction(()=>{ const e=document.querySelector('[data-entrance-page]'); const opacity=e&&Number(getComputedStyle(e).opacity); return opacity>0.05&&opacity<0.95; });
      await page.screenshot({path:path.join(evidence,`${engine}-mid-reveal.png`)});
    }
    results.push({kind:'delayed-fonts-assets-no-native-resize',...await verifyFade(page)});
    await slow.close();
    // A never-resolving decode must not hide Browse/identity forever. Its image
    // remains a graceful fallback; no optional animation is required to navigate.
    const stalled = await context();
    await stalled.addInitScript(()=>{ HTMLImageElement.prototype.decode = () => new Promise(()=>{}); });
    const stalledPage=await stalled.newPage(); await stalledPage.goto(base,{waitUntil:'domcontentloaded'});
    const bounded=await verifyFade(stalledPage); assert.ok(bounded.firstFade<3500);
    assert.equal(await stalledPage.locator('.marquee_skip-link').count(),1);
    results.push({kind:'bounded-unresolved-decode',...bounded}); await stalled.close();
    for (const mode of ['reduced','interaction','live-reduced','history']) {
      const ctx=await context({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
      if(['interaction','live-reduced','history'].includes(mode)) await ctx.route('**/assets/images/marquee-bars/**',async route=>{await new Promise(r=>setTimeout(r,700));await route.continue();});
      const page=await ctx.newPage(); await page.goto(base,{waitUntil:'domcontentloaded'});
      if(mode==='interaction') await page.keyboard.press('Tab');
      if(mode==='live-reduced') await page.emulateMedia({reducedMotion:'reduce'});
      if(mode==='history') await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
      await finished(page);
      assert.equal(await page.locator('[data-entrance-page]').evaluate(e=>getComputedStyle(e).opacity),'1');
      if(mode==='interaction') assert.equal(await page.locator('.marquee_skip-link').evaluate(e=>e===document.activeElement),true);
      if(mode==='reduced') assert.ok((await page.evaluate(()=>window.__entrySamples)).every(s=>s.opacity===1));
      await page.waitForTimeout(900); assert.equal(await page.evaluate(()=>PageEntrance.isActive()),false);
      results.push({kind:mode,visible:true,noReplay:true}); await ctx.close();
    }
    // Native keyboard navigation and real history still reveal the destination.
    const nav=await context(), native=await nav.newPage();
    await native.goto(base,{waitUntil:'domcontentloaded'}); await native.locator('.marquee_skip-link').focus();
    await Promise.all([native.waitForURL('**/generator/solid/'),native.keyboard.press('Enter')]);
    await native.locator('#p5-container canvas').waitFor();
    await native.waitForFunction(()=>!PageEntrance.isActive());
    await native.goBack(); await native.locator('.hero_title').waitFor(); await finished(native);
    await native.goForward(); await native.locator('#p5-container canvas').waitFor(); await native.waitForFunction(()=>!PageEntrance.isActive());
    results.push({kind:'native-keyboard-history',visible:true}); await nav.close();
    // Shared utility retains the generator's original print path and fallback.
    for(const supported of [true,false]) {
      const ctx=await context();
      if(!supported) await ctx.addInitScript(()=>{document.startViewTransition=undefined;});
      const page=await ctx.newPage(); await page.goto(base+'/generator/solid/',{waitUntil:'domcontentloaded'});
      await page.locator('#p5-container.is-entry-complete').waitFor(); await page.waitForFunction(()=>!PageEntrance.isActive());
      const mode=await page.locator('#p5-container').getAttribute('data-entry-mode');
      assert.equal(mode,supported?'native':'fallback');
      assert.equal(await page.locator('.app-header').evaluate(e=>getComputedStyle(e).opacity),'1');
      results.push({kind:'generator-preserved',mode}); await ctx.close();
    }
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify({results,errors},null,2));
    console.log(`${engine}: ${results.length} Home entrance cases passed. Evidence: ${evidence}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
