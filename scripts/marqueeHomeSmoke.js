const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');
const { entries } = require('../js/utils/marqueeCatalog');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8779').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-home-evidence';
const palette = { black:'#000000', white:'#ffffff', red:'#d6001c', blue:'#0081ce',
  gold:'#cdac38', silver:'#e1edf5', gray:'#b9ccd8', lunar:'#f4f7fb' };
const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(n => parseInt(n,16)).join(', ')})`;
async function close(page) {
  await page.keyboard.press('Escape');
  await page.locator('#logo-animation-overlay').waitFor({ state:'hidden' });
}
async function main() {
  assert.ok({ chromium, webkit }[engine], `Unsupported RPI_BROWSER: ${engine}`);
  if (process.env.RPI_ASCII_MODE) assert.ok(Object.hasOwn(palette,process.env.RPI_ASCII_MODE),'Unknown RPI_ASCII_MODE');
  const browser = await ({ chromium, webkit }[engine]).launch({ headless:true });
  const checks = [];
  await fs.mkdir(evidence, { recursive:true });
  try {
    for (const touch of (process.argv.includes('--palette-only') ? [] : [false,true])) {
      const context = await browser.newContext(touch ? { ...devices['iPhone 13'], reducedMotion:'reduce' }
        : { viewport:{ width:1440,height:900 }, reducedMotion:'reduce' });
      const page = await context.newPage();
      const errors=[]; page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.waitForFunction(() => document.querySelectorAll('.marquee_item:not(.is-measure) img').length>100
        && [...document.images].every(image => image.complete && image.naturalWidth>0));
      const inventory = await page.evaluate(() => ({
        styles:[...new Set([...document.querySelectorAll('[data-bar-style]')].map(e => e.dataset.barStyle))],
        background:getComputedStyle(document.querySelector('.section_marquee_hero')).backgroundColor,
        image:getComputedStyle(document.querySelector('.section_marquee_hero')).backgroundImage,
        sourceCount:new Set([...document.images].map(image => image.src)).size,
        count:document.images.length, overflow:document.documentElement.scrollWidth>innerWidth
      }));
      assert.deepEqual(inventory.styles.sort(),entries.map(entry => entry.value).sort());
      assert.equal(inventory.background,rgb('#000000')); assert.equal(inventory.image,'none');
      assert.equal(inventory.sourceCount,21); assert.equal(inventory.overflow,false); assert.ok(inventory.count<300);
      await page.screenshot({ path:path.join(evidence,`${engine}-${touch?'touch':'desktop'}-home.png`) });
      checks.push({ touch,inventory });
      await page.goto(`${base}/generator/solid/?colorMode=black`);
      await page.locator('#p5-container canvas').waitFor(); await page.waitForLoadState('networkidle');
      const home = page.getByRole('link',{ name:'RPI — Home' });
      assert.equal(await home.getAttribute('href'),'./'); assert.equal(await home.getAttribute('role'),null);
      assert.equal(await home.evaluate(element => element.href),`${base}/`);
      assert.equal(await home.getAttribute('aria-haspopup'),null);
      assert.equal(await home.evaluate(element => getComputedStyle(element).color),rgb('#000000'));
      if (!touch && !process.argv.includes('--skip-native-popup')) {
        const popupWait = context.waitForEvent('page');
        await home.click({ modifiers:[process.platform==='darwin'?'Meta':'Control'] });
        const popup = await popupWait;
        // Chromium headless can retain about:blank in the driver's cached URL
        // after a native SVG-anchor new tab has fully committed. Verify the
        // browser's actual document/location and home landmark instead.
        await popup.waitForFunction(expected => {
          const stage=document.querySelector('[data-marquee-stage]');
          const rect=stage?.getBoundingClientRect();
          return location.href===expected && document.readyState==='complete'
            && document.title.includes('The Bar Generator') && rect?.width>0 && rect.height>0
            && getComputedStyle(stage).visibility==='visible' && getComputedStyle(stage).display!=='none'
            && document.images.length>100 && [...document.images].every(image=>image.complete&&image.naturalWidth>0);
        },`${base}/`);
        assert.equal(new URL(await popup.evaluate(() => location.href)).pathname,'/'); await popup.close();
        assert.match(page.url(),/generator\/solid/);
      } else if (!touch) {
        checks.push({ nativePopup:'Not run here; separate native-anchor diagnostic required.' });
      }
      if (touch) await home.tap(); else { await home.focus(); await page.keyboard.press('Enter'); }
      await page.waitForURL(`${base}/`); await page.goBack(); await page.locator('#p5-container canvas').waitFor();
      assert.equal(await page.evaluate(() => currentColorMode),'black');
      await page.goForward(); await page.waitForURL(`${base}/`);
      await page.goBack(); await page.locator('#p5-container canvas').waitFor();
      const target = page.getByRole('button', { name:'The Bar Generator: Play ASCII intro', exact:true });
      await target.waitFor({ state:'visible' });
      assert.equal(await target.getAttribute('title'),'Play ASCII intro');
      assert.equal(await target.getAttribute('aria-haspopup'),'dialog');
      assert.equal(await target.getAttribute('aria-expanded'),'false');
      assert.ok((await target.boundingBox()).height>=44);
      assert.equal(await target.locator('.brand_intro-icon').isVisible(),true);
      const originalUrl = page.url();
      await target.focus(); await page.keyboard.type('rpi182x4');
      assert.equal(await page.locator('#logo-animation-overlay').count(),0);
      const editor = await page.evaluateHandle(() => {
        const input = document.createElement('input'); input.id='secret-smoke-input';
        document.body.append(input); input.focus(); return input;
      });
      await page.keyboard.type('rpi1824'); assert.equal(await page.locator('#logo-animation-overlay').count(),0);
      await editor.evaluate(element => element.remove());
      await page.screenshot({ path:path.join(evidence,`${engine}-${touch?'touch':'desktop'}-intro-trigger.png`) });
      if (touch) await target.tap(); else await target.click();
      await page.locator('.logo_animation_static-artwork > svg').waitFor();
      assert.equal(await target.getAttribute('aria-expanded'),'true');
      assert.equal(page.url(),originalUrl);
      assert.equal(await page.locator('.logo_animation_frame').count(),0);
      await page.getByRole('button',{ name:'Play animation once' }).click();
      await page.frameLocator('.logo_animation_frame').locator('#animation-projection').filter({ hasText:/\S/ }).waitFor();
      await page.waitForTimeout(2300);
      await page.screenshot({ path:path.join(evidence,`${engine}-${touch?'touch':'desktop'}-secret.png`) });
      await close(page);
      assert.equal(await page.evaluate(() => document.activeElement.id),'brand-title');
      assert.equal(await target.getAttribute('aria-expanded'),'false');
      for (const key of ['Enter','Space']) {
        await target.focus(); await page.keyboard.press(key);
        await page.locator('.logo_animation_static-artwork > svg').waitFor();
        await close(page);
        assert.equal(await page.evaluate(() => document.activeElement.id),'brand-title');
      }
      // Rapid repeated activation must not stack dialogs or change history.
      const box = await target.boundingBox();
      await page.mouse.click(box.x+box.width/2,box.y+box.height/2,{clickCount:2});
      await page.locator('.logo_animation_static-artwork > svg').waitFor();
      assert.equal(await page.locator('#logo-animation-overlay').count(),1);
      await close(page);
      await target.focus(); await page.keyboard.type('rpi1824');
      await page.locator('.logo_animation_static-artwork > svg').waitFor(); await close(page);
      assert.equal(page.url(),originalUrl);
      assert.deepEqual(errors,[]); checks.push({ touch,navigation:true,clickTap:true,keyboard:true,repeat:true,shortcut:true }); await context.close();
    }
    const page = await browser.newPage({ reducedMotion:'reduce',viewport:{ width:1440,height:900 } });
    for (const [mode,ink] of Object.entries(palette)) {
      if (process.env.RPI_ASCII_MODE && mode!==process.env.RPI_ASCII_MODE) continue;
      await page.goto(`${base}/generator/${mode==='lunar'?'lunar':'solid'}/?colorMode=${mode}`);
      await page.locator('#p5-container canvas').waitFor();
      const result = await page.evaluate(async () => {
        const snapshot=captureLogoExportSnapshot();
        const blob=await createRasterExportBlob(snapshot,new AbortController().signal);
        const image=new Image(); image.src=URL.createObjectURL(blob); await image.decode();
        const canvas=document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
        const ctx=canvas.getContext('2d'); ctx.drawImage(image,0,0);
        // A point in the fixed official R stem, independent of bar family.
        const px=[...ctx.getImageData((20+5)*4,(20+20)*4,1,1).data]; URL.revokeObjectURL(image.src);
        return { fg:snapshot.foreground.toLowerCase(),source:snapshot.svgSource.includes(`fill="${snapshot.foreground}"`),px };
      });
      assert.equal(result.fg,ink); assert.equal(result.source,true);
      assert.deepEqual(result.px,[...ink.slice(1).match(/../g).map(n => parseInt(n,16)),255]);
      await page.locator('#brand-title').focus(); await page.keyboard.type('rpi1824');
      await page.locator('.logo_animation_static-artwork > svg').waitFor();
      const background=mode==='black'?'#ffffff':'#000000';
      await page.waitForFunction(expected => getComputedStyle(document.querySelector('#logo-animation-overlay')).backgroundColor===expected,rgb(background));
      assert.equal(await page.evaluate(() => document.documentElement.style.colorScheme),mode==='black'?'light':'dark');
      assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'),background);
      assert.equal(await page.locator('.logo_animation_static-artwork').evaluate(element => getComputedStyle(element).color),rgb(ink));
      await page.getByRole('button',{ name:'Play animation once' }).click();
      const projection=page.frameLocator('.logo_animation_frame').locator('#animation-projection');
      await projection.filter({ hasText:/\S/ }).waitFor();
      await page.waitForTimeout(2300);
      assert.equal(await projection.evaluate(element => getComputedStyle(element).color),rgb(ink));
      // Neither hostile origin nor another same-origin window can close it.
      await page.evaluate(() => {
        const source=document.querySelector('.logo_animation_frame').contentWindow;
        for (const type of ['rpi-logo-animation-close','rpi-logo-animation-ready','rpi-logo-animation-complete']) {
          window.dispatchEvent(new MessageEvent('message',{ origin:'https://other.test',source,data:{type} }));
          window.dispatchEvent(new MessageEvent('message',{ origin:location.origin,source:window,data:{type} }));
        }
      });
      assert.equal(await page.locator('#logo-animation-overlay').isVisible(),true);
      await page.screenshot({ path:path.join(evidence,`${engine}-ascii-${mode}.png`) });
      await close(page);
      // A later selection must not reuse the lazy controller's previous ink.
      if (mode==='black') {
        await page.selectOption('#color-mode-select','red',{ force:true });
        await page.locator('#brand-title').focus(); await page.keyboard.type('rpi1824');
        await page.locator('.logo_animation_static-artwork > svg').waitFor();
        assert.equal(await page.locator('.logo_animation_static-artwork').evaluate(element => getComputedStyle(element).color),rgb(palette.red));
        await close(page);
      }
      checks.push({ mode,...result,ascii:true,background });
    }
    await page.close();
    // A failed optional download can recover; blocked storage preserves ink
    // without exposing captured SVG/user text in the iframe URL.
    const recovery = await browser.newPage({ reducedMotion:'reduce' });
    await recovery.addInitScript(() => {
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value) {
        if (key.startsWith('rpi-logo-animation-')) throw new DOMException('Blocked','SecurityError');
        return original.call(this,key,value);
      };
    });
    let loads=0;
    await recovery.route('**/js/utils/logoAnimationOverlay.js*',route => ++loads===1 ? route.abort() : route.continue());
    await recovery.goto(`${base}/generator/solid/?colorMode=black`);
    await recovery.locator('#p5-container canvas').waitFor(); await recovery.locator('#brand-title').focus();
    const failed=recovery.waitForEvent('console',{ predicate:message => message.text().includes('Unable to launch the header logo animation.') });
    await recovery.keyboard.type('rpi1824'); await failed;
    assert.equal(await recovery.locator('#logo-animation-overlay').count(),0);
    await recovery.keyboard.type('rpi1824'); await recovery.locator('.logo_animation_static-artwork > svg').waitFor();
    await recovery.getByRole('button',{name:'Play animation once'}).click();
    const recoveredProjection=recovery.frameLocator('.logo_animation_frame').locator('#animation-projection');
    await recoveredProjection.filter({hasText:/\S/}).waitFor();
    assert.equal(await recoveredProjection.evaluate(element=>getComputedStyle(element).color),rgb('#000000'));
    assert.match(await recovery.locator('.logo_animation_frame').getAttribute('src'),/foreground=%23000000$/);
    assert.equal(loads,2); await close(recovery); await recovery.close();
    checks.push({ lazyRetry:true,blockedStorageInk:true });
    // A normal-motion click enters the actual ASCII sequence, then returns to
    // the same editable design and trigger after the visible close action.
    const normal = await browser.newPage({ reducedMotion:'no-preference',viewport:{width:390,height:844},hasTouch:true,isMobile:true });
    await normal.goto(`${base}/generator/ruler/?colorMode=black&rulerRepeats=7`);
    await normal.locator('#p5-container canvas').waitFor();
    const designUrl = normal.url();
    const headerBounds = await normal.locator('.header-actions').boundingBox();
    assert.ok(headerBounds.x>=0 && headerBounds.x+headerBounds.width<=390,JSON.stringify(headerBounds));
    await normal.locator('#brand-title').tap();
    await normal.frameLocator('.logo_animation_frame').locator('#animation-projection').filter({hasText:/\S/}).waitFor();
    await normal.waitForFunction(() => !document.getElementById('logo-animation-close').disabled);
    assert.equal(await normal.locator('.logo_animation_frame').count(),1);
    assert.equal(await normal.locator('.app-header').evaluate(element=>element.inert),true);
    const closeBounds = await normal.locator('#logo-animation-close').boundingBox();
    assert.ok(closeBounds.x>=0 && closeBounds.x+closeBounds.width<=390,JSON.stringify(closeBounds));
    await normal.locator('#logo-animation-close').tap();
    await normal.locator('#logo-animation-overlay').waitFor({state:'hidden'});
    assert.equal(await normal.evaluate(()=>document.activeElement.id),'brand-title');
    assert.equal(await normal.locator('#brand-title').getAttribute('aria-expanded'),'false');
    assert.equal(await normal.locator('.app-header').evaluate(element=>element.inert),false);
    assert.equal(await normal.locator('#ruler-repeats-slider').inputValue(),'7');
    assert.equal(normal.url(),designUrl);
    checks.push({ normalMotionTap:true,closeReturnsToDesign:true }); await normal.close();

    await fs.writeFile(path.join(evidence,`${engine}-results.json`),JSON.stringify(checks,null,2));
    console.log(JSON.stringify({ engine,checks:checks.length,passed:true,evidence,
      scope:{ flows:!process.argv.includes('--palette-only'),nativePopup:!process.argv.includes('--palette-only')
        && !process.argv.includes('--skip-native-popup'),asciiMode:process.env.RPI_ASCII_MODE || 'all' } }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
