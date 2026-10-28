const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MOTION_EVIDENCE;

async function main() {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [];
  const errors = [];
  if (evidence) await fs.mkdir(evidence, { recursive: true });
  try {
    for (const mode of ['desktop', 'phone', 'landscape']) {
      const context = await browser.newContext(mode === 'desktop' ? { viewport: { width: 1440, height: 900 } }
        : { ...devices['iPhone 13'], viewport: mode === 'phone' ? { width: 390, height: 664 } : { width: 844, height: 290 } });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/ruler/`);
      await page.locator('#p5-container canvas').waitFor();
      await page.locator('#header-logo-preview canvas').waitFor();
      await page.waitForLoadState('networkidle');
      if (mode !== 'desktop') {
        assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
        await page.waitForFunction(() => document.querySelector('#mobile-menu-toggle').getBoundingClientRect().height >= 44);
      }
      const activate = selector => mode === 'desktop' ? page.locator(selector).click() : page.locator(selector).tap();
      const shot = async name => { if (evidence) await page.screenshot({ path: path.join(evidence, `${engine}-${mode}-${name}.png`), fullPage: mode === 'desktop', scale: 'css' }); };
      await shot('before');
      await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
      await page.locator('#logo-animation-close').waitFor();
      const measure = () => page.evaluate(() => {
        const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, bottom:r.bottom }; };
        return { replay:rect('#logo-animation-replay'), close:rect('#logo-animation-close'), github:rect('.header-actions a[aria-label*="GitHub"]'), menu:rect('#mobile-menu-toggle') };
      });
      let boxes = await measure();
      if (mode !== 'desktop') assert.ok(boxes.close.height >= 44, 'touch target stayed 44px after activation');
      assert.deepEqual(boxes.replay, boxes.github, `${mode} replay alignment`);
      assert.deepEqual(boxes.close, boxes.menu, `${mode} close alignment`);
      await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.querySelector('pre')?.textContent.trim().length > 0);
      await page.waitForTimeout(1600);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'intro has no horizontal overflow');
      await shot('intro');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'logo-animation-replay');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'logo-animation-close');
      await activate('#logo-animation-replay');
      assert.equal(await page.locator('.logo_animation_frame').count(), 1);
      await page.setViewportSize(mode === 'desktop' ? { width: 1100, height: 600 } : { width: 320, height: 568 });
      await page.waitForFunction(() => {
        const aligned = (a, b) => {
          const first = document.querySelector(a).getBoundingClientRect();
          const second = document.querySelector(b).getBoundingClientRect();
          return ['x', 'y', 'width', 'height'].every(key => Math.abs(first[key] - second[key]) < 0.01);
        };
        return aligned('#logo-animation-close', '#mobile-menu-toggle')
          && aligned('#logo-animation-replay', '.header-actions a[aria-label*="GitHub"]');
      });
      const resized = await measure();
      assert.deepEqual(resized.replay, resized.github);
      assert.deepEqual(resized.close, resized.menu);
      // Escape from inside the frame after a tap focuses it.
      await page.locator('.logo_animation_frame').focus();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#logo-animation-overlay').hidden);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'brand-title');
      assert.equal(await page.evaluate(() => document.querySelector('.app-header').inert), false);
      await page.setViewportSize(mode === 'desktop' ? { width:1440,height:900 } : mode === 'phone' ? { width:390,height:664 } : { width:844,height:290 });
      await page.waitForTimeout(300);
      if (mode !== 'desktop') {
        await activate('#mobile-menu-toggle');
        await page.waitForFunction(() => !document.querySelector('#app-sidebar').inert);
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => { const s = document.querySelector('#color-mode-select'); s.value='white'; s.dispatchEvent(new Event('change')); });
      await page.waitForTimeout(180);
      await shot('theme-scan');
      await page.waitForFunction(() => document.body.classList.contains('theme-white') && !document.querySelector('.theme_scan'));
      await shot('dark');
      await page.evaluate(() => {
        const s=document.querySelector('#color-mode-select');
        for(const value of ['red','black','white','blue','gold']) { s.value=value; s.dispatchEvent(new Event('change')); }
      });
      await page.waitForFunction(() => document.body.classList.contains('theme-gold') && !document.querySelector('.theme_scan'));
      assert.match(page.url(), /colorMode=gold/);
      await page.reload();
      await page.locator('#p5-container canvas').waitFor();
      assert.equal(await page.evaluate(() => document.body.classList.contains('theme-gold')), true);
      await page.emulateMedia({ reducedMotion:'reduce' });
      await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
      await page.evaluate(() => { const s=document.querySelector('#color-mode-select');s.value='black';s.dispatchEvent(new Event('change')); });
      assert.equal(await page.locator('.theme_scan').count(), 0);
      await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
      await page.locator('.logo_animation_static').waitFor();
      assert.equal(await page.locator('#logo-animation-replay').isVisible(), false);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'logo-animation-close');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.body.classList.contains('has-logo-animation'));
      await page.emulateMedia({ reducedMotion:'no-preference' });
      await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
      await page.locator('.logo_animation_frame').waitFor();
      await page.emulateMedia({ reducedMotion:'reduce' });
      await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
      await page.locator('.logo_animation_static').waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.body.classList.contains('has-logo-animation'));
      await page.emulateMedia({ reducedMotion:'no-preference' });
      await page.evaluate(() => { const s=document.querySelector('#color-mode-select');for (const value of ['white','black']) {s.value=value;s.dispatchEvent(new Event('change'));} });
      await page.waitForFunction(() => !document.querySelector('.theme_scan'));
      assert.equal(await page.evaluate(() => document.body.classList.contains('theme-black')), true);
      // Cancel a transition before its asynchronous update callback; selection must survive.
      await page.evaluate(() => { const s=document.querySelector('#color-mode-select');s.value='white';s.dispatchEvent(new Event('change'));window.ThemeMotion.cancel(); });
      assert.equal(await page.evaluate(() => document.body.classList.contains('theme-white')), true);
      await page.evaluate(() => { document.startViewTransition=undefined; const s=document.querySelector('#color-mode-select');s.value='red';s.dispatchEvent(new Event('change')); });
      await page.waitForFunction(() => !document.querySelector('.theme_scan'));
      assert.equal(await page.evaluate(() => document.body.classList.contains('theme-red')), true);
      // Exercise the real fourth action; older isolated shells use a temporary text control.
      await page.evaluate(() => {
        if (document.getElementById('share-button')) return;
        const slot=document.createElement('button');slot.id='qa-share-slot';
        slot.className='header_icon-button';slot.setAttribute('aria-label','Share placeholder');
        slot.textContent='Share';document.querySelector('#mobile-menu-toggle').before(slot);
      });
      await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
      await page.locator('#logo-animation-close').waitFor();
      const withShare = await measure();
      assert.deepEqual(withShare.replay, withShare.github);
      assert.deepEqual(withShare.close, withShare.menu);
      const toolbar = await page.evaluate(() => {
        const selectors=['.header-actions a[aria-label*="GitHub"]','#mobile-menu-toggle','#logo-animation-close'];
        return selectors.map(selector=> { const e=document.querySelector(selector), s=getComputedStyle(e), icon=Array.from(e.querySelectorAll('svg')).find(svg => svg.getBoundingClientRect().width > 0);
          return {selector,borderWidth:s.borderTopWidth,radius:s.borderRadius,iconWidth:icon.getBoundingClientRect().width}; });
      });
      toolbar.forEach(control => {
        assert.equal(control.borderWidth, '1px');assert.equal(control.radius,'2px');assert.equal(control.iconWidth,18);
      });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.body.classList.contains('has-logo-animation'));
      await page.evaluate(() => document.querySelector('#qa-share-slot')?.remove());
      if (mode === 'desktop') {
        await page.locator('#color-mode-select').evaluate(select => select.parentElement.querySelector('.custom-select-trigger').focus());
        await page.keyboard.press('End');await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.body.classList.contains('theme-gray'));
        assert.equal(await page.evaluate(() => document.activeElement.getAttribute('role')), 'combobox');
      }
      results.push({ mode, boxes, resized, withShare, toolbar, nativeViewTransitions: await page.evaluate(() => CSS.supports('view-transition-name: root')) });
      await context.close();
    }
    assert.deepEqual(errors, []);
    if(evidence) await fs.writeFile(path.join(evidence,`${engine}-measurements.json`), JSON.stringify(results,null,2));
    console.log(`${engine}: desktop/phone/landscape alignment, resize, replay, iframe Escape, focus trap, reduced motion, rapid themes, persistence, cancellation and fallback passed.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error);process.exitCode=1; });
