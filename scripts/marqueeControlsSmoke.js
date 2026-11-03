/* Home motion preference, native navigation, layout and storage recovery. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-controls-evidence';
const key = 'rpi-marquee-motion';
const pause = page => page.getByRole('button', { name: 'Pause motion', exact: true });
const resume = page => page.getByRole('button', { name: 'Resume motion', exact: true });
async function ready(page) {
  await page.waitForFunction(() => [...document.images].length > 0
    && [...document.images].every(image => image.complete)
    && !window.PageEntrance?.isActive());
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}
const snapshot = page => page.evaluate(() => ({
  rows: [...document.querySelectorAll('.marquee_track')].map(row => row.style.transform),
  phases: [...marqueeAnimation.settings.values()].map(state => state.phase),
  pixels: [...document.querySelectorAll('.is-animated canvas')].map(canvas => canvas.toDataURL())
}));
async function frozen(page) {
  const before = await snapshot(page); await page.waitForTimeout(220);
  assert.deepEqual(await snapshot(page), before, 'rows, phases and painted pixels remain still');
}
async function running(page) {
  const before = await snapshot(page);
  await page.waitForFunction(before => [...document.querySelectorAll('.marquee_track')].some((row, i) => row.style.transform !== before.rows[i])
    && [...marqueeAnimation.settings.values()].every((state, i) => state.phase !== before.phases[i]), before);
}
async function dragWhilePaused(page, pauseDuringCoast = false) {
  const point = await page.evaluate(() => {
    for (let y = 60; y < 360; y += 12) for (let x = 80; x < innerWidth - 120; x += 20) {
      const asset = document.elementFromPoint(x, y)?.closest('.bar_asset_wrap');
      if (asset && !asset.closest('.is-measure')) { asset.id = 'paused-drag'; return { x, y }; }
    }
  });
  assert.ok(point, 'reachable bar while paused');
  const track = page.locator('#paused-drag').locator('xpath=..').locator('xpath=..');
  const before = await track.getAttribute('style');
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(point.x + i * 12 * Math.cos(17 * Math.PI / 180), point.y + i * 12 * Math.sin(17 * Math.PI / 180));
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  assert.notEqual(await track.getAttribute('style'), before, 'direct drag remains available');
  if (pauseDuringCoast) {
    const released = await track.getAttribute('style');
    await page.waitForTimeout(80);
    assert.notEqual(await track.getAttribute('style'), released, 'the test begins with active momentum');
    await pause(page).evaluate(button => button.click());
    await resume(page).waitFor();
  }
  await frozen(page); assert.equal(page.url(), `${base}/`, 'drag does not activate link');
}
async function geometry(page) {
  return page.evaluate(() => {
    const rect = element => { const r = element.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }; };
    const controls = [...document.querySelectorAll('.hero_controls a,.hero_controls button')].map(element => ({...rect(element),text:element.textContent,
      font:getComputedStyle(element).fontSize, hit:document.elementFromPoint(element.getBoundingClientRect().x + 8, element.getBoundingClientRect().y + 8)?.closest('.hero_controls') === element.parentElement}));
    const hero = [...document.querySelectorAll('.hero_title-line,.hero_brand,.hero_credit,.hero_controls')].filter(e => e.getBoundingClientRect().width).map(rect);
    const row = [...document.querySelectorAll('.marquee_row')].at(-1), r = row.getBoundingClientRect(), angle = 17 * Math.PI / 180;
    const gaps = hero.map(h => h.y - (r.top + (h.right - r.left) * Math.tan(angle) + row.offsetHeight * Math.cos(angle)));
    return {controls,hero,gaps,overflow:document.documentElement.scrollWidth > innerWidth,width:innerWidth,height:innerHeight};
  });
}
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless:true });
  const results = [], errors = [];
  await fs.mkdir(evidence, {recursive:true});
  try {
    for (const [width,height] of [[1440,900],[375,812],[320,568],[844,390],[1230,1470],[3840,2160]]) {
      const context = await browser.newContext({viewport:{width,height}});
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => Math.random = () => 0.37);
      await page.goto(base); await ready(page); await running(page);
      const beforePause = await page.locator('[data-marquee-controls]').boundingBox();
      await pause(page).click(); await resume(page).waitFor(); await page.waitForTimeout(100); await frozen(page);
      assert.deepEqual(await page.locator('[data-marquee-controls]').boundingBox(), beforePause, 'labels never reflow the hero or lanes');
      const bounds = await geometry(page);
      assert.equal(bounds.overflow,false);
      for (const control of bounds.controls) {
        assert.ok(control.x >= 0 && control.y >= 0 && control.right <= width && control.bottom <= height, JSON.stringify(bounds));
        assert.ok(control.height >= 44 && parseFloat(control.font) >= 16, 'unscaled accessible target and text');
        assert.equal(control.hit,true, 'controls are not covered');
      }
      assert.ok(Math.min(...bounds.gaps) >= 20, `measured lane clearance: ${JSON.stringify(bounds)}`);
      assert.ok(Math.max(...bounds.hero.filter(h => h !== bounds.hero.at(-1)).map(h=>h.bottom)) <= bounds.hero.at(-1).y, 'title and credits stay above controls');
      await page.screenshot({path:path.join(evidence,`${engine}-${width}.png`),scale:'css'});
      if(width === 1440) {
        await dragWhilePaused(page);
        await resume(page).click(); await running(page);
        await dragWhilePaused(page, true);
        await page.evaluate(() => { document.body.classList.add('has-logo-animation'); window.dispatchEvent(new Event('pagehide')); });
        await page.evaluate(() => { document.body.classList.remove('has-logo-animation'); window.dispatchEvent(new Event('pageshow')); });
        await frozen(page);
        await page.reload(); await ready(page); await resume(page).waitFor(); await frozen(page);
        assert.equal(await page.locator('.is-animated').count(),0,'restored pause does not start optional previews');
        assert.equal(await page.evaluate(() => PageEntrance.isActive()),false,'restored pause bypasses entrance');
        assert.notEqual(await page.locator('[data-entrance-plane="selector"]').getAttribute('data-entry-mode'),'native');
        // Normal keyboard order retains skip first, then visible navigation and motion.
        await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.className),'marquee_skip-link');
        await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.textContent),'Browse styles');
        await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id),'marquee-motion-toggle');
        assert.notEqual(await resume(page).evaluate(e=>getComputedStyle(e).outlineStyle),'none');
        await page.keyboard.press('Space'); await pause(page).waitFor(); await running(page);
        await page.keyboard.press('Enter'); await resume(page).waitFor(); await frozen(page);
        await page.getByRole('link',{name:'Browse styles',exact:true}).click();
        await page.waitForURL(`${base}/generator/solid/`); await page.locator('#p5-container canvas').waitFor();
        assert.equal(await page.locator('#style-select').inputValue(),'solid');
        await page.goBack(); await ready(page); await resume(page).waitFor(); await frozen(page);
        await page.goForward(); await page.waitForURL(`${base}/generator/solid/`); await page.locator('#p5-container canvas').waitFor();
        await page.goBack(); await ready(page); await resume(page).click(); await running(page);
        await page.emulateMedia({reducedMotion:'reduce'}); await page.getByRole('button',{name:'Motion paused',exact:true}).waitFor();
        assert.equal(await page.locator('#marquee-motion-toggle').isDisabled(),true); await frozen(page);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'running','OS preference never overwrites explicit choice');
        await dragWhilePaused(page);
        await page.emulateMedia({reducedMotion:'no-preference'}); await resume(page).waitFor(); await frozen(page);
        await resume(page).click(); await running(page);
        const other = await page.context().newPage(); await other.goto(base); await ready(other);
        await pause(other).click(); await resume(page).waitFor(); await frozen(page);
        await resume(other).click(); await frozen(page);
        await other.close(); await resume(page).click(); await running(page);
      }
      results.push({width,height,bounds}); await context.close();
    }
    // Blocked storage getters, reads and writes leave session controls usable.
    for(const blocked of ['getter','read','write']) {
      const page=await browser.newPage(); page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(blocked=>{
        if(blocked==='getter') Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Blocked','SecurityError');}});
        else Storage.prototype[blocked==='read'?'getItem':'setItem']=function(){throw new DOMException('Blocked','SecurityError');};
      },blocked);
      await page.goto(base); await ready(page); await running(page);
      await pause(page).click(); await frozen(page); await resume(page).click(); await running(page);
      results.push({blockedStorage:blocked}); await page.close();
    }
    // A saved running preference never overrides reduced motion on initial load.
    const reduced=await browser.newPage({reducedMotion:'reduce'});
    await reduced.addInitScript(key=>localStorage.setItem(key,'running'),key);
    await reduced.goto(base); await ready(reduced); await frozen(reduced);
    assert.equal(await reduced.locator('#marquee-motion-toggle').isDisabled(),true);
    assert.equal(await reduced.locator('canvas').count(),0);
    await reduced.close();
    const noScript=await browser.newPage({javaScriptEnabled:false}); await noScript.goto(base);
    await noScript.getByRole('link',{name:'Browse styles',exact:true}).click(); await noScript.waitForURL(`${base}/generator/solid/`);
    await noScript.close();
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify({engine,results},null,2));
    console.log(JSON.stringify({engine,passed:true,cases:results.length,errors,evidence}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
