// Isolated browser checks for complete client-side snapshots and actual downloaded SVGs.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const styles = [...require('../js/utils/generatorRoutes').ROUTABLE_STYLE_VALUES];
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:4315';
const evidence = process.env.RPI_EVIDENCE_DIR;
async function ready(page) { await page.waitForFunction(() => window.barShareController); }
async function svg(page) {
  const waiting = page.waitForEvent('download');
  await page.evaluate(() => saveSVG());
  const download = await waiting;
  const value = await fs.readFile(await download.path(), 'utf8');
  assert.match(value, /<svg[\s>]/);
  assert.match(value, /<path/);
  return value;
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: {width: 1440, height: 1000} });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto(`${base}/generator/waveform/`); await ready(page);
    await page.evaluate(() => {
      for (const [id, spec] of Object.entries(barShareController.manifest)) {
        const field = document.getElementById(id);
        if (id === 'style-select' || id === 'color-mode-select') continue;
        if (spec.type === 'checkbox') field.checked = !id.includes('motion');
        else if (spec.options) field.value = spec.options[spec.options.length - 1];
        else if (spec.type === 'range') field.value = spec.min + Math.floor((spec.max - spec.min) / spec.step / 2) * spec.step;
        else field.value = id === 'numeric-input' ? '31415926' : 'Café 東京 🚀';
        field.dispatchEvent(new Event(spec.type === 'range' || spec.type === 'text' ? 'input' : 'change', { bubbles: true }));
      }
      currentStaffNotes = [{note:'C#4',duration:0.25},{note:'E4',duration:2}]; currentNoteDuration = 0.25;
      liveMotionPhase = 0.375; window.animationTime = 23;
    });
    for (const style of styles) {
      await page.selectOption('#style-select', style, {force:true});
      await page.evaluate(() => {
        liveMotionPhase = 0.375; window.animationTime = 23;
        document.getElementById('share-button').click();
        const input = document.getElementById('share-name'); input.value = 'Exploration α 🚀 <img onerror=alert(1)>';
        input.dispatchEvent(new Event('input', {bubbles:true}));
      });
      const before = await page.evaluate(() => barShareController.capture());
      const exported = await svg(page);
      const link = await page.evaluate(() => barShareController.buildLink());
      assert.equal(new URL(link).search, ''); assert.ok(link.includes('#bar='));
      await page.goto(link); await ready(page);
      assert.deepEqual(await page.evaluate(() => barShareController.capture()), before, `${style} complete snapshot round-trip`);
      assert.equal(await svg(page), exported, `${style} actual SVG export round-trip`);
      assert.equal(await page.locator('#share-loaded-name img').count(), 0);
      assert.equal(await page.locator('#share-loaded-name').textContent(), 'Shared configuration: Exploration α 🚀 <img onerror=alert(1)>');
      console.log(`PASS ${style}: complete controls + paused phase + actual SVG`);
    }
    // Approved palette choices restore alongside complete controls; no arbitrary colors.
    for (const color of ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar']) {
      await page.selectOption('#color-mode-select', color, {force:true});
      const link = await page.evaluate(() => barShareController.buildLink());
      await page.goto(link); await ready(page);
      assert.equal(await page.inputValue('#color-mode-select'), color);
    }
    // Toolbar popover supports keyboard entry, Escape, outside dismissal and focus exit.
    await page.keyboard.press('Escape');
    await page.locator('#share-button').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#share-button').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share-copy');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share-name');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#share-popover').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share-button');
    await page.click('#share-button');
    await page.mouse.click(20, 400);
    assert.equal(await page.locator('#share-popover').isVisible(), false);
    await page.click('#share-button');
    await page.evaluate(() => document.getElementById('mobile-menu-toggle').focus());
    assert.equal(await page.locator('#share-popover').isVisible(), false);
    // Successful clipboard feedback without changing the host system clipboard.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text=>{window.__copiedShareLink=text;}}}));
    await page.click('#share-button'); await page.click('#share-copy');
    assert.equal(await page.locator('#share-copy').textContent(), 'Copied');
    assert.equal(await page.locator('#share-status').textContent(), 'Link copied.');
    assert.ok(await page.evaluate(() => window.__copiedShareLink.includes('#bar=')));
    assert.equal(await page.locator('#share-fallback').isVisible(), false);
    await page.keyboard.press('Escape');
    // Same-document Back/Forward restores fields and the canonical route style, not the boot route.
    const original = page.url();
    const second = await page.evaluate(() => {
      const state = barShareController.capture(); state.controls['style-select'] = 'binary'; state.controls['color-mode-select'] = 'black'; state.controls['binary-input'] = '';
      return `${location.origin}/generator/binary/${BarShareState.encodeState(state, barShareController.manifest)}`;
    });
    await page.evaluate(url => { history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate')); }, second);
    assert.equal(await page.inputValue('#binary-input'), '');
    await page.goBack(); await page.waitForURL(original);
    assert.equal(await page.inputValue('#style-select'), 'lunar');
    await page.goForward(); await page.waitForURL(second);
    assert.equal(await page.inputValue('#style-select'), 'binary');
    assert.equal(await page.inputValue('#binary-input'), '');
    // Force clipboard rejection and verify an accessible manual copy path.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {value:{writeText:async()=>{throw Error('blocked')}}}));
    await page.click('#share-button');
    await page.locator('#share-copy').click();
    assert.match(await page.locator('#share-status').textContent(), /Copy the selected link/);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'share-url');
    // Changed values update an existing shared fragment so reload cannot silently revert edits.
    await page.fill('#binary-input', 'New settings');
    await page.reload(); await ready(page);
    assert.equal(await page.inputValue('#binary-input'), 'New settings');
    // Legacy query remains supported; empty shared fields remain empty.
    await page.goto(`${base}/generator/morse/?morseText=Legacy&colorMode=red`); await ready(page);
    assert.equal(await page.inputValue('#morse-input'), 'Legacy');
    assert.equal(await page.inputValue('#color-mode-select'), 'red');
    await page.goto(`${base}/generator/solid/#bar=broken!`); await ready(page);
    assert.match(await page.locator('#share-status').textContent(), /malformed/);
    assert.equal(await page.locator('#p5-container canvas').count(), 1);
    // Mobile + reduced motion respect receiver preference even if sender enabled animation.
    const reduced = await browser.newPage({ viewport:{width:390,height:844}, reducedMotion:'reduce' });
    await reduced.goto(`${base}/generator/ruler/`); await ready(reduced);
    const movingLink = await reduced.evaluate(() => {
      const state = barShareController.capture(); state.controls['ruler-motion-toggle'] = true;
      state.name = 'Mobile shared bar'; return location.href.split('#')[0] + BarShareState.encodeState(state, barShareController.manifest);
    });
    await reduced.goto(movingLink); await ready(reduced);
    assert.equal(await reduced.isChecked('#ruler-motion-toggle'), false);
    assert.equal(await reduced.locator('#share-loaded-name').isVisible(), true);
    assert.ok(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const phase = await reduced.evaluate(() => barShareController.capture().runtime.phase);
    await reduced.waitForTimeout(150);
    assert.equal(await reduced.evaluate(() => barShareController.capture().runtime.phase), phase);
    if (evidence) {
      await reduced.screenshot({path:`${evidence}/bar-05-toolbar-mobile-closed.png`});
      await reduced.click('#share-button');
      await reduced.screenshot({path:`${evidence}/bar-05-toolbar-mobile.png`});
      await page.goto(original); await ready(page);
      await page.click('#share-button');
      await page.screenshot({path:`${evidence}/bar-05-toolbar-desktop.png`});
    }
    if (!await reduced.locator('#share-popover').isVisible()) await reduced.click('#share-button');
    for (const width of [320, 390, 768, 1440]) {
      await reduced.setViewportSize({width,height:844});
      const bounds = await reduced.locator('#share-popover').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, `popover fits ${width}px`);
      assert.ok(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const target = await reduced.locator('#share-button').boundingBox();
      if (width <= 900) {
        const inset = await reduced.locator('#share-button').evaluate(button => parseFloat(getComputedStyle(button, '::before').top));
        assert.ok(target.width - inset * 2 >= 44 && target.height - inset * 2 >= 44);
      }
    }
    assert.deepEqual(errors, []);
    assert.ok(requests.every(url => url.startsWith(base) || url.startsWith('blob:') || url.startsWith('data:')), 'no external server requests');
    console.log('PASS history, edited-fragment reload, legacy links, malformed recovery, clipboard fallback, Unicode/XSS, reduced motion, mobile');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
