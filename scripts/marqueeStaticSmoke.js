/* Real HTTP regression: static artwork, intact neighbors, focus and navigation. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-static-evidence';
const { samples } = require('../js/utils/marqueeCatalog');
const results = [], errors = [];
async function ready(page) {
  await page.waitForFunction(() => document.images.length > 100
    && [...document.images].every(image => image.complete && image.naturalWidth)
    && !window.PageEntrance?.isActive());
  await page.evaluate(() => document.fonts.ready);
}
async function target(page, direction) {
  return page.evaluate(direction => {
    document.querySelector('#static-test')?.removeAttribute('id');
    for (let y = 90; y < 350; y += 12) for (let x = 280; x < 700; x += 20) {
      const a = document.elementFromPoint(x, y)?.closest('.bar_asset_wrap');
      if (!a || a.closest('.is-measure') || !a.closest('.marquee_row').classList.contains(direction)) continue;
      if (![-8,8].every(dx => [-4,4].every(dy => document.elementFromPoint(x+dx,y+dy)?.closest('.bar_asset_wrap') === a))) continue;
      a.id = 'static-test'; return {x,y};
    }
  }, direction);
}
async function bottomTarget(page) {
  return page.evaluate(() => {
    const lanes = [...document.querySelectorAll('.marquee_row')];
    for (let index = lanes.length - 1; index >= 0; index--) {
      const bounds = lanes[index].getBoundingClientRect();
      for (let y = Math.max(20, bounds.top); y < Math.min(innerHeight - 20, bounds.bottom); y += 12)
        for (let x = 20; x < innerWidth - 20; x += 20) {
          const a = document.elementFromPoint(x, y)?.closest('.bar_asset_wrap');
          if (a && !a.closest('.is-measure') && a.closest('.marquee_row') === lanes[index]) {
            a.id = 'static-test'; return { x, y, index, rowCount: lanes.length };
          }
        }
    }
  });
}
const rows = page => page.locator('.marquee_track').evaluateAll(nodes => nodes.map(n => n.style.transform));
const position = page => page.locator('#static-test').evaluate(a => a.closest('.marquee_track').style.transform);
async function artwork(page) {
  return page.evaluate(() => [...document.querySelectorAll('.bar_asset_wrap img')].map(image => ({
    src:image.src, width:image.naturalWidth, height:image.naturalHeight,
    transform:getComputedStyle(image).transform
  })));
}
async function assertStatic(page) {
  assert.equal(await page.locator('.bar_asset_wrap canvas,.bar_motion_asset,.is-animated').count(),0);
  assert.equal(await page.evaluate(() => typeof window.MarqueeAnimation),'undefined');
  assert.ok((await artwork(page)).every(image => image.transform === 'none'));
}
async function inspectFocus(page, id = 'static-test') {
  return page.evaluate(id => {
    const selected = document.getElementById(id);
    const links = [...document.querySelectorAll('.marquee_item:not(.is-measure) .bar_asset_wrap')];
    return { selected:getComputedStyle(selected).opacity,
      others:links.filter(a => a !== selected).map(a => getComputedStyle(a).opacity),
      filters:[...document.querySelectorAll('.marquee_row,.bar_asset_wrap')].map(n => getComputedStyle(n).filter),
      rects:links.map(a => {
        const r=a.querySelector('img').getBoundingClientRect(); return [r.x,r.y,r.width,r.height];
      }) };
  }, id);
}
(async () => {
  const browser = await ({chromium,webkit}[engine]).launch({headless:true,
    ...(process.env.RPI_BROWSER_EXECUTABLE ? {executablePath:process.env.RPI_BROWSER_EXECUTABLE} : {})});
  await fs.mkdir(evidence,{recursive:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    page.on('pageerror',e=>errors.push(e.message));
    // Observe actual prompt appearance relative to DOM readiness, without faking its timer.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => window.__promptReady = performance.now());
      new MutationObserver(() => {
        if (!window.__promptShown && document.querySelector('#startup-style-prompt.is-visible')) window.__promptShown = performance.now();
      }).observe(document,{subtree:true,attributes:true,attributeFilter:['class']});
    });
    await page.goto(base); await ready(page);
    await page.waitForFunction(() => window.__promptShown);
    const promptDelay=await page.evaluate(() => window.__promptShown-window.__promptReady);
    assert.ok(promptDelay >= 0 && promptDelay < 1500,`prompt appears promptly: ${promptDelay}ms`);
    assert.equal(await page.getByRole('link',{name:'Enter generator',exact:true}).count(),0);
    await assertStatic(page);
    await page.screenshot({path:path.join(evidence,`${engine}-home.png`)});
    const sources=await artwork(page), moving=await rows(page);
    await page.waitForFunction(before=>[...document.querySelectorAll('.marquee_track')].some((n,i)=>n.style.transform!==before[i]),moving);
    assert.deepEqual(await artwork(page),sources,'row scrolling never mutates internal sample artwork');
    const inventory=await page.locator('[data-bar-style]').evaluateAll(nodes=>nodes.map(a=>({
      style:a.dataset.barStyle,variant:Number(a.dataset.barVariant),href:a.getAttribute('href'),src:a.querySelector('img').getAttribute('src')
    })));
    for(const item of inventory) {
      const sample=samples.find(s=>s.value===item.style && s.variant===item.variant);
      assert.equal(item.href,`/generator/${sample.value}/${sample.query ? `?${sample.query}` : ''}`);
      assert.equal(decodeURI(item.src),decodeURI(sample.path));
    }
    results.push({promptDelayMs:Math.round(promptDelay),scrollingWithStaticSources:true,canonicalLinks:inventory.length});
    await page.keyboard.press('Space');
    await page.mouse.move(1400,880); await page.waitForTimeout(200);
    for(const direction of ['is-forward','is-backward']) {
      const point=await target(page,direction); assert.ok(point);
      const before=await inspectFocus(page);
      for(let repeat=0;repeat<4;repeat++) {
        await page.mouse.move(point.x,point.y); await page.waitForTimeout(270);
        const focused=await inspectFocus(page);
        assert.equal(focused.selected,'1');
        assert.ok(focused.others.every(opacity=>opacity==='0.2'),'each other complete bar is at 20% opacity');
        assert.ok(focused.filters.every(filter=>filter==='none'),'no row or bar blur');
        assert.deepEqual(focused.rects,before.rects,'hover never splits, scales or lifts any part of any bar');
        await assertStatic(page);
        await page.screenshot({path:path.join(evidence,`${engine}-${direction}-hover.png`)});
        await page.mouse.move(1400,880); await page.waitForTimeout(270);
        const cleared=await inspectFocus(page);
        assert.ok([cleared.selected,...cleared.others].every(opacity=>opacity==='1'));
      }
      results.push({direction,repeatedHovers:4,opacity:0.2,allImageBoundsUnchanged:true});
    }
    const point=await target(page,'is-forward');
    await page.mouse.move(point.x,point.y);
    await page.keyboard.press('Tab');
    const keyboard=await page.evaluate(() => {
      const hovered=document.getElementById('static-test');
      const a=[...document.querySelectorAll('.marquee_item:not(.is-measure) .bar_asset_wrap')].find(a=>a!==hovered && a.closest('.marquee_row')!==hovered.closest('.marquee_row'));
      a.id='keyboard-test'; a.focus(); return {visible:a.matches(':focus-visible'),outline:getComputedStyle(a).outlineStyle};
    });
    assert.ok(keyboard.visible); assert.notEqual(keyboard.outline,'none');
    await page.waitForTimeout(270);
    const focused=await inspectFocus(page,'keyboard-test');
    assert.equal(focused.selected,'1'); assert.ok(focused.others.every(opacity=>opacity==='0.2'),'keyboard selection takes priority over parked pointer');
    await page.screenshot({path:path.join(evidence,`${engine}-keyboard.png`)});
    await page.evaluate(()=>document.activeElement.blur()); await page.mouse.move(1400,880);
    await page.keyboard.press('Space');
    await page.locator('#static-test').focus();
    const held=await position(page); await page.waitForTimeout(220); assert.equal(await position(page),held,'focused lane stays still');
    await page.evaluate(()=>document.activeElement.blur());
    await page.waitForFunction(before=>document.getElementById('static-test').closest('.marquee_track').style.transform!==before,held);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(() => document.documentElement.dataset.marqueeMotionPaused === 'true');
    const stopped=await rows(page); await page.waitForTimeout(220); assert.deepEqual(await rows(page),stopped);
    await assertStatic(page);
    assert.equal(await page.locator('#marquee-motion-toggle').count(), 0);
    results.push({keyboardSelection:true,focusHoldsLane:true,reducedMotion:true});
    // The actual native bar anchor and its parameters survive button removal.
    const native=await target(page,'is-forward'); assert.ok(native);
    const href=await page.locator('#static-test').getAttribute('href');
    const style=await page.locator('#static-test').getAttribute('data-bar-style');
    await page.mouse.click(native.x,native.y); await page.waitForURL(`${base}${href}`);
    await page.locator('#style-select').waitFor(); assert.equal(await page.locator('#style-select').inputValue(),style);
    await page.goBack(); await ready(page);
    await page.locator('.marquee_skip-link').focus(); await page.keyboard.press('Enter');
    await page.waitForURL(`${base}/generator/solid/`); await page.locator('#style-select').waitFor();
    await page.goBack(); await ready(page); await assertStatic(page);
    results.push({selectedBarNavigation:href,keyboardSkipNavigation:true,history:true});
    await page.close();
    for (const [width,height,dpr,extra] of [[1230,1470,1,true],[1230,1470,2,true],
      [5120,1440,2,true],[3840,2160,2,false]]) {
      const wide = await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'no-preference'});
      wide.on('pageerror',e=>errors.push(e.message));
      await wide.goto(base); await ready(wide); await assertStatic(wide);
      const transition = await wide.locator('.bar_asset_wrap').first().evaluate(a => ({
        duration:getComputedStyle(a).transitionDuration, delay:getComputedStyle(a).transitionDelay
      }));
      assert.equal(transition.duration,'0.24s'); assert.equal(transition.delay,'0s');
      await wide.keyboard.press('Space');
      const point = await bottomTarget(wide); assert.ok(point,'native bottom-row hit target');
      if (extra) assert.ok(point.index >= 10,'hit a row created after the initial ten');
      await wide.mouse.move(point.x,point.y); await wide.waitForTimeout(270);
      const focused = await inspectFocus(wide);
      assert.equal(focused.selected,'1');
      assert.ok(focused.others.every(opacity=>opacity==='0.2'),'bottom-row hover dims every other bar');
      await wide.mouse.move(width-2,height-2); await wide.waitForTimeout(270);
      results.push({width,height,dpr,bottomRow:point.index,rowCount:point.rowCount,nativeHitTesting:true,opacity:0.2});
      await wide.close();
    }
    for(const [width,height] of [[390,844],[320,568],[844,390]]) {
      const phone=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
      phone.on('pageerror',e=>errors.push(e.message));
      await phone.goto(base); await ready(phone); await assertStatic(phone);
      assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await phone.keyboard.press('Space');
      const mobilePoint=await phone.evaluate(()=>{
        for(let y=80;y<innerHeight/2;y+=12) for(let x=20;x<innerWidth-20;x+=16) {
          const a=document.elementFromPoint(x,y)?.closest('.bar_asset_wrap');
          if(a&&!a.closest('.is-measure')){a.id='static-test';return{x,y};}
        }
      });
      assert.ok(mobilePoint,'visible native mobile target');
      const touch=await phone.evaluate(()=>{
        const a=document.getElementById('static-test');
        a.dispatchEvent(new PointerEvent('pointerenter',{bubbles:true,pointerType:'mouse'}));
        a.closest('.marquee_stage').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',isPrimary:true}));
        return {hovered:a.classList.contains('is-hovered'),touchAction:getComputedStyle(a).touchAction};
      });
      assert.equal(touch.hovered,false); assert.ok(touch.touchAction.includes('pan-y')&&touch.touchAction.includes('pinch-zoom'));
      await phone.waitForTimeout(270);
      const untouched=await inspectFocus(phone); assert.ok([untouched.selected,...untouched.others].every(opacity=>opacity==='1'));
      await phone.screenshot({path:path.join(evidence,`${engine}-phone-${width}.png`)});
      // Real tap, rather than a synthetic click, still opens the chosen generator.
      const destination=await phone.locator('#static-test').getAttribute('href');
      await phone.touchscreen.tap(mobilePoint.x,mobilePoint.y); await phone.waitForURL(`${base}${destination}`);
      results.push({width,height,noStickyHover:true,nativeTapNavigation:destination}); await phone.close();
    }
    assert.deepEqual(errors,[]);
    const result={engine,passed:true,results,errors,evidence};
    await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
