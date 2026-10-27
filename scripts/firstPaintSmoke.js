/* Local first-paint regression: no build/runtime dependencies added. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_FIRST_PAINT_EVIDENCE || path.join(require('node:os').tmpdir(), 'rpi-first-paint-evidence');
fs.mkdirSync(evidence, { recursive: true });
const themes = ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar'];
async function state(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.app-header');
    const select = document.querySelector('#color-mode-select');
    const trigger = select?.parentElement.querySelector('.custom-select-trigger');
    const sidebar = document.querySelector('#app-sidebar');
    const nativeVisible = select && getComputedStyle(select).display !== 'none';
    const surface = nativeVisible ? select : trigger;
    return {
      time: Math.round(performance.now()), theme: document.body.className,
      header: header && getComputedStyle(header).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      selected: select?.value, label: nativeVisible ? select.options[select.selectedIndex]?.textContent : trigger?.textContent,
      trigger: surface && { width: surface.offsetWidth, height: surface.offsetHeight },
      toolbar: Array.from(document.querySelectorAll('.header-actions > button, .header-actions > .save-section > button')).map(e => ({ id: e.id, x: e.offsetLeft, y: e.offsetTop, width: e.offsetWidth, height: e.offsetHeight })),
      // Ignore subpixel glyph rounding below 0.1 CSS px; retain visible layout shifts.
      parameters: Array.from(document.querySelectorAll('[data-parameter-actions] .slider_label-row, [data-parameter-actions] .control-header-actions, [data-parameter-actions] .control-header-actions button, [data-slider-value]')).filter(e => e.getBoundingClientRect().height).map(e => { const r = e.getBoundingClientRect(); const tenth = value => Math.round(value * 10) / 10; return { id: e.id || e.className, x: tenth(r.x), y: tenth(r.y), width: tenth(r.width), height: tenth(r.height) }; }),
      sidebarInert: sidebar?.inert,
      expanded: document.querySelector('#mobile-menu-toggle')?.getAttribute('aria-expanded'),
      canvas: !!document.querySelector('#p5-container canvas'),
      overflow: document.documentElement.scrollWidth > innerWidth,
      paints: performance.getEntriesByType('paint').map(e => ({ name: e.name, time: e.startTime })),
      samples: window.__firstPaintSamples,
      resources: performance.getEntriesByType('resource').filter(e => /style.css|generatorBootstrap|main.js/.test(e.name)).map(e => ({ name: e.name, transfer: e.transferSize }))
    };
  });
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 664 }, { width: 844, height: 390 }]) {
      for (const theme of themes) {
        const name = `${viewport.width}-${theme}`;
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        await context.addInitScript(() => {
          window.__firstPaintSamples = [];
          let signature = '';
          function sample() {
            const header = document.querySelector('.app-header');
            const item = { time: Math.round(performance.now()), theme: document.body?.className,
              header: header && getComputedStyle(header).backgroundColor,
              custom: document.querySelectorAll('.custom-select-trigger').length,
              canvas: !!document.querySelector('#p5-container canvas') };
            const next = JSON.stringify({ ...item, time: 0 });
            if (next !== signature) { window.__firstPaintSamples.push(item); signature = next; }
            if (performance.now() < 5000) requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
        await context.route('**/js/main.js*', async route => {
          await new Promise(resolve => setTimeout(resolve, 750));
          await route.continue();
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const navigation = page.goto(`${base}/generator/${theme === 'lunar' ? 'lunar' : 'ruler'}/?colorMode=${theme}`);
        await page.locator('.custom-select-trigger').first().waitFor({ state: 'attached' });
        await page.waitForTimeout(100);
        const early = await state(page);
        assert.equal(early.canvas, false, `${name}: delay must expose the pre-renderer state`);
        assert.equal(early.selected, theme);
        assert.ok(early.theme.includes(`theme-${theme}`));
        await page.screenshot({ path: path.join(evidence, `${name}-early.png`), fullPage: true });
        await navigation;
        await page.locator('#p5-container canvas').waitFor();
        await page.waitForTimeout(100);
        const ready = await state(page);
        assert.equal(early.header, ready.header, `${name}: header changes during startup`);
        assert.equal(early.body, ready.body, `${name}: body changes during startup`);
        assert.deepEqual(early.trigger, ready.trigger, `${name}: control dimensions change`);
        assert.deepEqual(early.parameters, ready.parameters, `${name}: parameter/action chrome shifts during setup`);
        assert.deepEqual(early.toolbar, ready.toolbar, `${name}: toolbar changes during startup`);
        assert.equal(early.label, ready.label, `${name}: control label changes`);
        assert.equal(early.sidebarInert, ready.sidebarInert);
        assert.equal(early.expanded, ready.expanded);
        assert.equal(ready.overflow, false);
        assert.deepEqual(errors, []);
        await page.locator('#p5-container.is-entry-complete').waitFor();
        await page.screenshot({ path: path.join(evidence, `${name}-ready.png`), fullPage: true });
        results.push({ name, kind: 'delayed-main', early, ready, errors });
        await context.close();
      }
    }
    for (const route of ['/generator/wave-quantum/?quantumPhase=0.35&quantumSpeed=0.8&quantumReverse=true', '/generator/ruler/?rulerRepeats=23&rulerSpeed=0.8', '/generator/ticker/?tickerRatio=5&tickerWidthRatio=10', '/generator/lines/?linesVariant=1', '/generator/waveform/?waveformType=3', '/generator/waveform/?waveformEnvelope=true&waveformFrequency=37&waveformEnvelopeWaves=4', '/generator/index.html?style=waveform&waveformEnvelope=true']) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      await context.route('**/js/main.js*', async request => { await new Promise(resolve => setTimeout(resolve, 900)); await request.continue(); });
      const page = await context.newPage();
      const navigation = page.goto(base + route);
      await page.locator('.custom-select-trigger').first().waitFor({ state: 'attached' });
      const controls = () => page.evaluate(() => Array.from(document.querySelectorAll('#app-sidebar [data-url-parameter], #quantum-phase, #quantum-speed-slider, #quantum-reverse-toggle'), field => ({id:field.id, value:field.value, checked:field.checked, label:document.getElementById(field.id.replace(/-slider$/, '-display'))?.textContent})).filter(field => !/style-select|color-mode-select/.test(field.id)));
      const early = await controls();
      const envelopeEarly = await page.locator('#envelope-settings-group').isVisible();
      await navigation; await page.locator('#p5-container canvas').waitFor();
      assert.deepEqual(early, await controls(), `${route}: restored control values and labels must stay stable`);
      assert.equal(envelopeEarly, await page.locator('#envelope-settings-group').isVisible(), `${route}: envelope visibility`);
      results.push({ route, kind: 'nondefault-delayed-controls', stable: true });
      await context.close();
    }
    const tablet = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await tablet.route('**/js/main.js*', async route => {
      await new Promise(resolve => setTimeout(resolve, 750));
      await route.continue();
    });
    const tabletPage = await tablet.newPage();
    const tabletNavigation = tabletPage.goto(`${base}/generator/ruler/?colorMode=white`);
    await tabletPage.locator('.custom-select-trigger').first().waitFor({ state: 'attached' });
    const tabletEarly = await state(tabletPage);
    assert.equal(tabletEarly.canvas, false);
    assert.equal(tabletEarly.sidebarInert, true, 'Coarse 1024px sidebar must start compact');
    assert.equal(tabletEarly.expanded, 'false');
    await tabletNavigation; await tabletPage.locator('#p5-container canvas').waitFor();
    const tabletReady = await state(tabletPage);
    assert.equal(tabletEarly.sidebarInert, tabletReady.sidebarInert);
    assert.equal(tabletEarly.expanded, tabletReady.expanded);
    assert.deepEqual(tabletEarly.toolbar, tabletReady.toolbar);
    results.push({ name: 'coarse-tablet-delayed', kind: 'delayed-main', early: tabletEarly, ready: tabletReady });
    await tablet.close();
    const quantum = await browser.newContext({ reducedMotion: 'reduce' });
    await quantum.route('**/js/main.js*', async route => {
      await new Promise(resolve => setTimeout(resolve, 750));
      await route.continue();
    });
    const quantumPage = await quantum.newPage();
    const quantumNavigation = quantumPage.goto(`${base}/generator/wave-quantum/`);
    await quantumPage.locator('#quantum-group').waitFor();
    const quantumEarly = await state(quantumPage);
    assert.equal(quantumEarly.canvas, false, 'Quantum controls must precede renderer initialization');
    assert.equal(await quantumPage.locator('#quantum-phase-display').evaluate(e => e.closest('label').dataset.sliderValueLayout), 'ready');
    await quantumNavigation; await quantumPage.locator('#p5-container canvas').waitFor();
    const quantumReady = await state(quantumPage);
    assert.deepEqual(quantumEarly.parameters, quantumReady.parameters, 'Quantum labels must keep their initial layout');
    results.push({ name: 'quantum-delayed', kind: 'delayed-main', early: quantumEarly, ready: quantumReady });
    await quantum.close();
    for (const route of ['/generator/solid/', '/generator/ruler/?colorMode=dark', '/generator/lunar/?colorMode=lunar', '/generator/index.html?style=ruler&colorMode=white', '/generator/solid/?colorMode=lunar', '/generator/solid/?colorMode=invalid', '/generator/wave-quantum/']) {
      const context = await browser.newContext();
      const page = await context.newPage();
      for (const kind of ['cold', 'warm']) {
        await page.goto(base + route);
        await page.locator('#p5-container canvas').waitFor();
        const current = await state(page);
        const expected = /colorMode=(white|dark)/.test(route) ? 'white' : route.includes('/lunar/') ? 'lunar' : 'black';
        assert.equal(current.selected, expected);
        results.push({ route, kind, ...current });
      }
      await context.close();
    }
    // Runtime failure keeps navigation/chrome and exposes a keyboard reachable retry.
    for (const failure of ['main', 'shell']) {
      const context = await browser.newContext();
      await context.route(failure === 'main' ? '**/js/main.js*' : '**/generator/index.html*', route => route.abort());
      const page = await context.newPage();
      await page.goto(`${base}/generator/solid/`);
      await page.locator('#retry-generator').waitFor();
      if (failure === 'main') await page.locator('.app-header').waitFor();
      await page.locator('#retry-generator').focus();
      assert.equal(await page.locator('#retry-generator').evaluate(e => e === document.activeElement), true);
      await page.screenshot({ path: path.join(evidence, `${failure}-error.png`) });
      results.push({ failure, retryVisible: true });
      await context.close();
    }
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const page = await nojs.newPage();
    await page.goto(`${base}/generator/solid/`);
    assert.ok(await page.locator('noscript p').isVisible());
    assert.match(await page.locator('noscript p').textContent(), /Enable JavaScript/);
    await nojs.close();
    for (const width of [1440, 390]) {
      const slow = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
      await slow.route('**/*.woff2', async route => { await new Promise(r => setTimeout(r, 500)); await route.continue(); });
      await slow.route('**/js/main.js*', async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue(); });
      const page = await slow.newPage();
      const nav = page.goto(`${base}/generator/ruler/?colorMode=white`);
      await page.locator('.custom-select-trigger').first().waitFor({ state: 'attached' });
      const early = await state(page);
      await page.screenshot({ path: path.join(evidence, `${width}-slow-font-early.png`) });
      await nav; await page.locator('#p5-container canvas').waitFor();
      const ready = await state(page);
      assert.equal(early.header, ready.header);
      assert.equal(early.body, ready.body);
      assert.deepEqual(early.trigger, ready.trigger);
      results.push({ width, kind: 'slow-font', early, ready });
      await slow.close();
    }
    // A cached old route stub must reconcile to the fetched shell's stylesheet before paint.
    const stale = await browser.newContext();
    await stale.route('**/generator/solid/', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace('css/style.css?v=20261027-integration-final', 'css/style.css?v=stale-route-test') });
    });
    const stalePage = await stale.newPage();
    await stalePage.goto(`${base}/generator/solid/`);
    await stalePage.locator('#p5-container canvas').waitFor();
    assert.match(await stalePage.locator('link[rel=stylesheet][href*="css/style.css"]').getAttribute('href'), /20261027-integration-final/);
    results.push({ kind: 'stale-route-css', recovered: true });
    await stale.close();
    // Keyboard semantics survive the early enhancement and later p5 setup.
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const keyboard = await context.newPage();
    await keyboard.goto(`${base}/generator/solid/`);
    await keyboard.locator('#p5-container canvas').waitFor();
    const trigger = keyboard.locator('#color-mode-select').locator('..').locator('.custom-select-trigger');
    await trigger.focus(); await keyboard.keyboard.press('ArrowDown'); await keyboard.keyboard.press('ArrowDown'); await keyboard.keyboard.press('Enter');
    assert.equal(await keyboard.locator('#color-mode-select').inputValue(), 'white');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await keyboard.waitForFunction(() => document.body.classList.contains('theme-white'));
    assert.ok(await keyboard.locator('body').getAttribute('class').then(s => s.includes('theme-white')));
    await context.close();
    fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2));
    console.log(`Passed ${results.length} first-paint/load/error cases, no-JS and keyboard checks. Evidence: ${evidence}`);
  } finally { fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
