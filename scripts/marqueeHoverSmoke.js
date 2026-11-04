/* Native off-row capture, lightweight hover focus, touch and reduced motion. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-hover-evidence';
const axis = { x: Math.cos(17 * Math.PI / 180), y: Math.sin(17 * Math.PI / 180) };
async function ready(page) {
  await page.waitForFunction(() => document.images.length > 100
    && [...document.images].every(i => i.complete && i.naturalWidth)
    && !window.PageEntrance?.isActive());
}
async function target(page, direction) {
  return page.evaluate(direction => {
    document.querySelector('#hover-test')?.removeAttribute('id');
    for (let y = 95; y < 350; y += 12) for (let x = 280; x < 700; x += 20) {
      const a = document.elementFromPoint(x, y)?.closest('.bar_asset_wrap');
      if (!a || a.closest('.is-measure') || !a.closest('.marquee_row').classList.contains(direction)) continue;
      if (![-8,8].every(dx => [-4,4].every(dy => document.elementFromPoint(x+dx,y+dy)?.closest('.bar_asset_wrap') === a))) continue;
      a.id = 'hover-test'; return { x, y };
    }
  }, direction);
}
const position = page => page.locator('#hover-test').evaluate(a => new DOMMatrixReadOnly(a.closest('.marquee_track').style.transform).m41);
async function focusState(page) {
  return page.evaluate(() => {
    const a = document.querySelector('#hover-test');
    const row = a.closest('.marquee_row');
    const others = [...document.querySelectorAll('.marquee_row')].filter(r => r !== row);
    const visual = [...a.querySelectorAll('.bar_asset')].find(n => getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden');
    return { focused: row.classList.contains('is-focus-row'), stage: row.parentElement.classList.contains('has-bar-focus'),
      lift: new DOMMatrixReadOnly(getComputedStyle(visual).transform).m42,
      others: others.map(r => getComputedStyle(r).filter), selected: getComputedStyle(a).filter,
      siblings: [...row.querySelectorAll('.bar_asset_wrap')].filter(n => n !== a).map(n => getComputedStyle(n).filter),
      extraCanvas: document.querySelectorAll('canvas').length,
      layout: [a.getBoundingClientRect().width,a.getBoundingClientRect().height] };
  });
}
(async () => {
  const browser = await ({chromium,webkit}[engine]).launch({headless:true});
  const results = [], errors = [];
  try {
    await fs.mkdir(evidence,{recursive:true});
    const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base); await ready(page);
    await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0);
    for (const direction of ['is-forward','is-backward']) {
      await page.locator('#marquee-motion-toggle').click();
      await page.mouse.move(1400,880);
      const p = await target(page,direction); assert.ok(p);
      const beforeFocus = await focusState(page);
      await page.mouse.move(p.x,p.y); await page.waitForTimeout(250);
      const focus = await focusState(page);
      assert.ok(focus.focused && focus.stage);
      assert.ok(focus.lift < -1 && focus.lift > -7, 'artwork lifts without scaling');
      assert.deepEqual(focus.layout,beforeFocus.layout,'native hit area stays fixed');
      assert.equal(focus.selected,'none');
      assert.ok(focus.others.every(v=>v==='blur(1.5px)'));
      assert.ok(focus.siblings.every(v=>v==='blur(1.5px)'));
      assert.equal(focus.extraCanvas,beforeFocus.extraCanvas,'focus creates no canvas');
      await page.screenshot({path:`${evidence}/${engine}-${direction}-focus.png`});
      await page.locator('#marquee-motion-toggle').click();
      await page.mouse.move(p.x,p.y);
      await page.mouse.down();
      for (let i=1;i<=6;i++) { await page.mouse.move(p.x-axis.x*25*i,p.y-axis.y*25*i); await page.waitForTimeout(12); }
      const along = await position(page);
      for (let i=1;i<=6;i++) { await page.mouse.move(p.x-axis.x*150-axis.y*16*i,p.y-axis.y*150+axis.x*16*i); await page.waitForTimeout(12); }
      assert.ok(Math.abs(await position(page)-along)<1,'perpendicular exit does not jump the lane');
      assert.ok(await page.locator('#hover-test').evaluate(a=>a.hasPointerCapture(1) && a.closest('.marquee_row').classList.contains('is-dragging')),'capture survives off-row travel');
      await page.mouse.up();
      const release=await position(page);
      await page.evaluate(()=>new Promise(resolve=>{let n=0; const next=()=>++n>=8?resolve():requestAnimationFrame(next);requestAnimationFrame(next);}));
      assert.ok(await position(page)<release-4,'off-row release continues the negative throw');
      assert.equal(page.url(),`${base}/`,'drag does not navigate');
      await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
      assert.equal((await focusState(page)).stage,false);
      results.push(`${direction}: lift, grouped blur, unchanged hit area, captured off-row throw, no click, blur cleanup`);
    }
    const p=await target(page,'is-forward');
    await page.mouse.move(p.x,p.y); await page.waitForTimeout(220);
    // Decorative duplicate links stay outside the Tab order; also protect a
    // programmatically focused sample when keyboard modality is active.
    await page.keyboard.press('Tab');
    await page.locator('#hover-test').focus();
    await page.waitForFunction(() => [...document.querySelectorAll('.marquee_row,.bar_asset_wrap')].every(n => getComputedStyle(n).filter === 'none'), null, {timeout:3000});
    const keyboard=await page.evaluate(()=>({focused:document.activeElement.matches('.bar_asset_wrap:focus-visible'),
      filters:[...document.querySelectorAll('.marquee_row,.bar_asset_wrap')].map(n=>getComputedStyle(n).filter)}));
    assert.ok(keyboard.focused,'programmatic keyboard focus is visible');
    assert.ok(keyboard.filters.every(v=>v==='none'),'keyboard focus overrides pointer blur');
    results.push('programmatic keyboard focus remains crisp; duplicate-link Tab policy is unchanged');
    await page.evaluate(()=>document.activeElement.blur());
    await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(100);
    const reduced=await focusState(page);
    assert.equal(reduced.lift,0); assert.ok(reduced.others.every(v=>v==='none'));
    assert.ok(reduced.siblings.every(v=>v==='none'));
    results.push('reduced motion clears lift and blur immediately');
    await page.close();
    const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
    await phone.goto(base); await ready(phone);
    const touch=await phone.evaluate(()=>{
      const a=document.querySelector('.marquee_item:not(.is-measure) .bar_asset_wrap'); a.id='hover-test';
      a.dispatchEvent(new PointerEvent('pointerenter',{bubbles:true,pointerType:'mouse'}));
      const hadFocus=a.closest('.marquee_stage').classList.contains('has-bar-focus');
      a.closest('.marquee_stage').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',isPrimary:true}));
      return {hadFocus, stage:a.closest('.marquee_stage').classList.contains('has-bar-focus'),
        filters:[...document.querySelectorAll('.marquee_row,.bar_asset_wrap')].map(n=>getComputedStyle(n).filter),
        lift:getComputedStyle(a.querySelector('.bar_asset')).transform,
        touchAction:getComputedStyle(a).touchAction};
    });
    assert.ok(touch.hadFocus && !touch.stage,'touch clears stale hybrid mouse focus');
    assert.ok(touch.filters.every(v=>v==='none'),'coarse touch has no blur');
    assert.equal(touch.lift,'none'); assert.ok(touch.touchAction.includes('pan-y') && touch.touchAction.includes('pinch-zoom'));
    results.push('phone touch has no sticky hover, blur or lift; native pan/pinch remain available');
    await phone.screenshot({path:`${evidence}/${engine}-phone.png`});
    await phone.close(); assert.deepEqual(errors,[]);
    const result={engine,passed:true,results,errors};
    await fs.writeFile(`${evidence}/${engine}.json`,JSON.stringify(result,null,2)); console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
