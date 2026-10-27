const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.RPI_ENTRANCE_EVIDENCE || '/tmp/bar-generator-first-paint-evidence/entrances';
fs.mkdirSync(evidence, { recursive: true });
function observe() {
  window.__entranceEvents = [];
  window.__entranceSamples = [];
  addEventListener('pageshow', e => window.__entranceEvents.push({ name: 'pageshow', persisted: e.persisted }));
  const begin = performance.now();
  function sample(now) {
    const plane = document.querySelector('[data-entrance-plane]');
    const chrome = document.querySelector('.app-header, .hero_cluster');
    window.__entranceSamples.push({ time: now, cursors: document.querySelectorAll('[data-entry-active=true]').length,
      complete: plane?.classList.contains('is-entry-complete'), position: null,
      chromeOpacity: chrome && getComputedStyle(chrome).opacity });
    if (now - begin < 2500) requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}

async function geometry(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('[data-page-entrance]')).map(e => {
    const r = e.getBoundingClientRect();
    return { class: e.className, x: r.x, y: r.y, width: r.width, height: r.height };
  }));
}
(async () => {
  const results = [];
  for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await type.launch({ headless: true });
    try {
      for (const width of [1440, 390]) for (const reduced of [false, true]) {
        const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
        await context.addInitScript(observe);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        for (const theme of ['black', 'white']) {
          await page.goto(`${base}/generator/ruler/?colorMode=${theme}`);
          await page.locator('#p5-container canvas').waitFor();
          if (!reduced) {
            await page.waitForFunction(() => PageEntrance.isHoldingArtwork());
            const held = await page.evaluate(() => window.animationTime);
            await page.waitForTimeout(100);
            assert.equal(await page.evaluate(() => window.animationTime), held, 'live phase must hold during the captured print');
          }
          const before = await geometry(page);
          await page.locator('#p5-container.is-entry-complete').waitFor();
          await page.waitForFunction(() => !window.PageEntrance.isActive());
          assert.deepEqual(await geometry(page), before, 'entrance must not move the page layout');
          const info = await page.evaluate(() => ({ events: window.__entranceEvents, samples: window.__entranceSamples, active: document.documentElement.classList.contains('has-page-entrance'), opacity: getComputedStyle(document.querySelector('.app-header')).opacity, plane: document.querySelector('#p5-container').dataset, complete: document.querySelector('#p5-container').classList.contains('is-entry-complete') }));
          assert.equal(info.active, false);
          assert.equal(info.opacity, '1');
          assert.equal(info.complete, true);
          assert.ok(info.samples.every(s => s.cursors <= 1 && (s.chromeOpacity === null || s.chromeOpacity === '1')));
          if (!reduced) {
            assert.equal(info.plane.entryDuration, theme === 'black' ? '680' : '400');
            assert.ok(['native', 'fallback'].includes(info.plane.entryMode));
          }
          await page.screenshot({ path: path.join(evidence, `${name}-${width}-${theme}-${reduced ? 'reduced' : 'motion'}.png`) });
          // Existing action handlers remain single, even after repeated early preparation.
          assert.equal(await page.locator('#ruler-group .control-header-actions button').count(), 2);
          assert.equal(await page.locator('#triangles-group .control-header-actions').count(), 0);
          results.push({ engine: name, width, reduced, theme, ...info, errors });
        }
        await page.goto(base + '/');
        await page.locator('.bar_asset.is-entrance-ready').first().waitFor({ state: 'attached' });
        if (!reduced) {
          await page.waitForFunction(() => PageEntrance.isHoldingArtwork());
          const positions = await page.locator('.marquee_item').evaluateAll(items => items.slice(0, 4).map(e => e.style.transform));
          await page.waitForTimeout(100);
          assert.deepEqual(await page.locator('.marquee_item').evaluateAll(items => items.slice(0, 4).map(e => e.style.transform)), positions, 'marquee must hold its captured position');
        }
        await page.locator('[data-entrance-plane].is-entry-complete').waitFor();
        await page.waitForFunction(() => !window.PageEntrance.isActive());
        assert.equal(await page.locator('.startup_prompt_text').textContent(), 'Select a bar design below to get started');
        const scene = await page.evaluate(() => ({ events: window.__entranceEvents, active: document.documentElement.classList.contains('has-page-entrance'), imageReady: document.querySelector('.bar_asset.is-entrance-ready').complete, complete: document.querySelector('[data-entrance-plane]').classList.contains('is-entry-complete'), samples: window.__entranceSamples }));
        assert.equal(scene.active, false);
        assert.equal(scene.complete, true);
        assert.ok(scene.samples.every(s => s.cursors <= 1 && (s.chromeOpacity === null || s.chromeOpacity === '1')));
        await page.screenshot({ path: path.join(evidence, `${name}-${width}-selector-${reduced ? 'reduced' : 'motion'}.png`) });
        await page.reload();
        await page.locator('.bar_asset').first().waitFor({ state: 'attached' });
        // Use the existing keyboard navigation link to enter, then exercise history quickly.
        await page.locator('.marquee_skip-link').focus();
        await Promise.all([page.waitForURL('**/generator/solid/'), page.keyboard.press('Enter')]);
        await page.locator('#p5-container canvas').waitFor();
        await page.goBack(); await page.locator('.hero_cluster').waitFor();
        await page.goForward(); await page.locator('#p5-container canvas').waitFor();
        await page.goBack(); await page.goForward();
        await page.locator('#p5-container canvas').waitFor();
        assert.deepEqual(errors, []);
        results.push({ engine: name, width, reduced, kind: 'selector-reload-navigation-history', scene, errors });
        // Explicit theme interaction cancels any remaining arrival before its scan.
        await page.evaluate(() => document.getElementById('color-mode-select').dispatchEvent(new Event('change', { bubbles: true })));
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('has-page-entrance')), false);
        await context.close();
      }
      const slow = await browser.newContext();
      await slow.addInitScript(observe);
      await slow.route('**/assets/**', async route => { await new Promise(r => setTimeout(r, route.request().url().includes('solid') ? 950 : 250)); await route.continue(); });
      const page = await slow.newPage();
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('.hero_cluster').isVisible(), true);
      await page.locator('.bar_asset.is-entrance-ready').first().waitFor({ state: 'attached' });
      await page.waitForTimeout(850);
      assert.equal(await page.locator('.marquee_skip-link').count(), 1);
      results.push({ engine: name, kind: 'slow-selector-assets', events: await page.evaluate(() => window.__entranceEvents) });
      await slow.close();
      // Repeated calls create neither duplicate actions nor duplicate runtime callbacks.
      const check = await browser.newPage();
      await check.goto(base + '/generator/ruler/'); await check.locator('#p5-container canvas').waitFor();
      await check.evaluate(() => {
        ParameterControls.prepare(document); ParameterControls.prepare(document);
        window.__actionCalls = 0;
        ParameterControls.bindActions({ reset: () => window.__actionCalls++, randomize: () => window.__actionCalls++ });
      });
      await check.locator('#ruler-group .control-reset-btn').click();
      assert.equal(await check.evaluate(() => window.__actionCalls), 1);
      await check.evaluate(() => ParameterControls.bindActions({ reset: resetStyleParameters, randomize: randomizeStyleParameters }));
      await check.locator('#ruler-repeats-display').click();
      await check.locator('.slider_value-input').fill('12');
      await check.locator('.slider_value-input').press('Enter');
      assert.equal(await check.locator('#ruler-repeats-slider').inputValue(), '12');
      await check.locator('#ruler-group .control-reset-btn').click();
      assert.equal(await check.locator('#ruler-repeats-slider').inputValue(), '10');
      results.push({ engine: name, kind: 'parameter-action-idempotence', calls: 1, typedEditorAndReset: true });
      await check.close();
      const fallback = await browser.newContext();
      await fallback.addInitScript(() => { document.startViewTransition = undefined; });
      const simple = await fallback.newPage();
      await simple.goto(base + '/generator/solid/');
      await simple.locator('#p5-container.is-entry-complete').waitFor();
      await simple.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await simple.locator('#p5-container').getAttribute('data-entry-mode'), 'fallback');
      assert.equal(await simple.locator('#p5-container').evaluate(e => getComputedStyle(e).clipPath), 'none');
      results.push({ engine: name, kind: 'non-native-fallback', clean: true });
      await fallback.close();
      const interrupt = await browser.newContext();
      const immediate = await interrupt.newPage();
      await immediate.goto(base + '/generator/solid/');
      await immediate.waitForFunction(() => document.getAnimations().some(a => a.animationName === 'pagePrint' && a.effect.getComputedTiming().progress > 0.1));
      await immediate.mouse.click(300, 20);
      await immediate.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await immediate.locator('#p5-container').evaluate(e => getComputedStyle(e).maskImage), 'none');
      await immediate.reload();
      await immediate.waitForFunction(() => document.getAnimations().some(a => a.animationName === 'pagePrint' && a.effect.getComputedTiming().progress > 0.1));
      await immediate.emulateMedia({ reducedMotion: 'reduce' });
      await immediate.waitForFunction(() => !PageEntrance.isActive());
      results.push({ engine: name, kind: 'interaction-and-live-reduced-cancel', immediate: true });
      await interrupt.close();
      const early = await browser.newContext();
      await early.route('**/js/main.js*', async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue(); });
      const intent = await early.newPage();
      const navigation = intent.goto(base + '/generator/ruler/?rulerRepeats=20');
      await intent.locator('#ruler-group .control-reset-btn').waitFor();
      assert.equal(await intent.locator('#p5-container canvas').count(), 0);
      await intent.locator('#ruler-group .control-reset-btn').click();
      await navigation; await intent.locator('#p5-container canvas').waitFor();
      assert.equal(await intent.locator('#ruler-repeats-slider').inputValue(), '10');
      results.push({ engine: name, kind: 'early-reset-intent', resetAppliedAfterUrlState: true });
      await early.close();
    } finally { await browser.close(); fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2)); }
  }
  console.log(`Passed ${results.length} entrance/navigation/control scenarios. Evidence: ${evidence}`);
})().catch(e => { console.error(e); process.exitCode = 1; });
