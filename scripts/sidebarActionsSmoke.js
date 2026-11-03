// Real-browser checks complement the DOM/action unit fixture. No browser security
// flags, fake HTTP fulfillment, or mutation of external services is needed.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8784';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/sidebar-actions-${engine}`;
const quantumOnly = process.env.RPI_ACTIONS_PHASE === 'quantum';
const layoutOnly = quantumOnly || process.env.RPI_ACTIONS_PHASE === 'layout';
const active = ['ruler', 'binary', 'morse', 'ticker', 'waveform', 'wave-quantum', 'circles', 'numeric',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles'];
const fixed = ['solid', 'fibonacci-sequence', 'union', 'runway', 'lunar'];
const action = (page, style, name) => page.locator(`[data-parameter-style="${style}"][data-parameter-action="${name}"]`);
const ready = async page => {
  await page.waitForFunction(() => window.barShareController && window.logoExportUI);
  await page.locator('#p5-container canvas').waitFor();
};
const snapshot = (page, style) => page.evaluate(style => JSON.stringify([
  ParameterControls.fieldsFor(style).map(field => field.type === 'checkbox' ? field.checked : field.value),
  style === 'circles' ? barShareController.capture().runtime.seed : null
]), style);
const source = page => page.evaluate(() => captureLogoExportSnapshot().svgSource);
const selectStyle = (page, style) => page.selectOption('#style-select', style, { force: true });
const labelsAgree = page => page.evaluate(() => [...document.querySelectorAll('.control-select')].every(field => {
  const trigger = field.parentElement.querySelector('.custom-select-trigger');
  return !trigger || trigger.textContent === field.options[field.selectedIndex].textContent;
}));
let layoutNumber = 0;
async function download(page, kind) {
  const waiting = page.waitForEvent('download');
  await page.evaluate(kind => { void (kind === 'svg' ? saveSVG() : savePNG()); }, kind);
  return fs.readFile(await (await waiting).path());
}
async function checkLayout(page, compact) {
  await page.locator('#save-button').click();
  await page.locator('#save-menu').evaluate(async menu => {
    await Promise.all(menu.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  const layout = await page.evaluate(() => {
    const box = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const trigger = document.querySelector('#save-button');
    return { sidebar: box('#app-sidebar'), trigger: box('#save-button'), menu: box('#save-menu'),
      content: box('.sidebar-content'), overflow: document.documentElement.scrollWidth > innerWidth,
      collapsed: trigger.classList.contains('is-icon-only'), viewport: { width: innerWidth, height: innerHeight } };
  });
  assert.equal(layout.overflow, false, JSON.stringify(layout));
  assert.ok(layout.menu.x >= 0 && layout.menu.right <= layout.viewport.width + 1, JSON.stringify(layout));
  assert.ok(layout.menu.width >= Math.min(272, layout.viewport.width - 16), JSON.stringify(layout));
  assert.ok(layout.menu.bottom <= layout.viewport.height + 1, JSON.stringify(layout));
  if (!compact && !layout.collapsed) {
    assert.ok(Math.abs(layout.trigger.width - layout.menu.width) < 1, JSON.stringify(layout));
    assert.equal(Math.round(layout.sidebar.width), 352);
  }
  await page.screenshot({ path: `${evidence}/menu-${++layoutNumber}.png` });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#save-button').getAttribute('aria-expanded'), 'false');
  return layout;
}
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [], errors = [];
  const watch = page => page.on('pageerror', error => errors.push(error.message));
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    watch(page);
    if (!layoutOnly) {
      for (const style of [...active, ...fixed]) {
        await page.goto(`${base}/generator/${style}/`); await ready(page);
        assert.equal(await page.inputValue('#style-select'), style);
        const visible = page.locator('[data-parameter-action]:visible');
        assert.equal(await visible.count(), active.includes(style) ? 2 : 0, style);
        const initialSVG = await source(page);
        if (active.includes(style)) {
          const baseline = await snapshot(page, style);
          assert.equal(await action(page, style, 'reset').isDisabled(), true, `${style} initial Reset`);
          for (let repeat = 0; repeat < 3; repeat++) {
            const before = await snapshot(page, style);
            await action(page, style, 'randomize').click();
            assert.notEqual(await snapshot(page, style), before, `${style} Randomize ${repeat}`);
            assert.equal(await labelsAgree(page), true, `${style} selected labels`);
          }
          const randomized = await snapshot(page, style), randomizedSVG = await source(page);
          const link = await page.evaluate(() => barShareController.buildLink());
          await page.evaluate(style => resetStyleParameters(style), style);
          assert.equal(await snapshot(page, style), baseline, `${style} Reset values`);
          assert.equal(await source(page), initialSVG, `${style} Reset source`);
          assert.equal(await action(page, style, 'reset').isDisabled(), true);
          await page.evaluate(link => {
            history.pushState({}, '', link); dispatchEvent(new PopStateEvent('popstate'));
          }, link);
          assert.equal(await snapshot(page, style), randomized, `${style} same-page share restore`);
          assert.equal(await source(page), randomizedSVG, `${style} restored SVG`);
          assert.equal(await labelsAgree(page), true);
          // The actual SVG download is the same frozen model, not a different renderer.
          assert.equal((await download(page, 'svg')).toString('utf8'), randomizedSVG);
          const png = await download(page, 'png');
          assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
          assert.equal(png.readUInt32BE(16), 1160); assert.equal(png.readUInt32BE(20), 762);
          await page.evaluate(style => resetStyleParameters(style), style);
          assert.equal(await snapshot(page, style), baseline);
          assert.equal(await labelsAgree(page), true);
        }
        results.push({ style, initial: true, actions: active.includes(style), shareAndExports: active.includes(style) });
      }
      // Keyboard actions keep a visible focus indicator; disabled Reset is skipped.
      await page.goto(`${base}/generator/triangles/`); await ready(page);
      const random = action(page, 'triangles', 'randomize'), reset = action(page, 'triangles', 'reset');
      await random.focus(); await page.keyboard.press('Enter'); assert.equal(await reset.isDisabled(), false);
      assert.ok(await random.evaluate(element => getComputedStyle(element).outlineStyle !== 'none'));
      await reset.focus(); await page.keyboard.press('Space'); assert.equal(await reset.isDisabled(), true);
      // Numeric retains source, inactive data and encoding, with matching visible labels.
      for (const mode of ['dotmatrix', 'height']) {
        await selectStyle(page, 'numeric');
        await page.selectOption('#numeric-mode-select', mode, { force: true });
        await page.selectOption('#numeric-source-select', 'values', { force: true });
        await page.locator('#numeric-input').fill('0001.25');
        await page.selectOption('#numeric-formula-select', 'half-life', { force: true });
        await action(page, 'numeric', 'randomize').click();
        const generated = await page.inputValue('#numeric-input'); assert.match(generated, /^[0-9]{24}$/);
        assert.equal(await page.inputValue('#numeric-mode-select'), mode);
        assert.equal(await page.inputValue('#numeric-formula-select'), 'half-life');
        await page.selectOption('#numeric-source-select', 'formula', { force: true });
        await action(page, 'numeric', 'randomize').click();
        assert.notEqual(await page.inputValue('#numeric-formula-select'), 'half-life');
        assert.equal(await page.inputValue('#numeric-input'), generated);
        assert.equal(await labelsAgree(page), true);
      }
      // Repeated same-page style switches never duplicate actions or show fixed-art actions.
      for (let repeat = 0; repeat < 2; repeat++) for (const style of [...active, ...fixed].reverse()) {
        await selectStyle(page, style);
        assert.equal(await page.locator('[data-parameter-action]:visible').count(), active.includes(style) ? 2 : 0, style);
      }
      await fs.writeFile(`${evidence}/actions-results.json`, JSON.stringify({ engine, results }, null, 2));
      console.log(`${engine}: all21style actions, all16families Randomize/Reset/share/SVG/PNG, Numeric modes and repeated switches passed`);
    }
    if (!quantumOnly) {
      // Theme surfaces and desktop export/sidebar geometry.
      for (const theme of ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar']) {
        await page.goto(`${base}/generator/${theme === 'lunar' ? 'lunar' : 'triangles'}/?colorMode=${theme}`); await ready(page);
        results.push({ theme, layout: await checkLayout(page, false) });
        await page.screenshot({ path: `${evidence}/desktop-${theme}.png` });
      }
      for (const viewport of [{ width: 901, height: 640 }, { width: 1024, height: 360 },
        { width: 1280, height: 500 }, { width: 768, height: 1024 }, { width: 320, height: 568 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/generator/neural-network/`); await ready(page);
        results.push({ viewport, layout: await checkLayout(page, viewport.width <= 900) });
        if (viewport.width <= 900) await page.locator('#mobile-menu-toggle').click();
        await action(page, 'neural-network', 'randomize').click(); await action(page, 'neural-network', 'reset').click();
        await page.screenshot({ path: `${evidence}/fine-${viewport.width}x${viewport.height}.png` });
      }
      // Real emulated touch input, portrait sheet and landscape rail, all21 families.
      const touch = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true,
        hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' }); watch(touch);
      for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
        await touch.setViewportSize(viewport); await touch.goto(`${base}/generator/solid/`); await ready(touch);
        results.push({ touch: viewport, layout: await checkLayout(touch, true) });
        await touch.locator('#mobile-menu-toggle').tap();
        for (const style of [...active, ...fixed]) {
          await selectStyle(touch, style);
          assert.equal(await touch.locator('[data-parameter-action]:visible').count(), active.includes(style) ? 2 : 0, style);
          if (active.includes(style)) {
            await action(touch, style, 'randomize').tap();
            // Randomize can intentionally land on a discrete family's default.
            if (!await action(touch, style, 'reset').isDisabled()) await action(touch, style, 'reset').tap();
            assert.equal(await action(touch, style, 'reset').isDisabled(), true);
            assert.equal(await labelsAgree(touch), true);
          }
        }
        await selectStyle(touch, 'neural-network');
        await touch.screenshot({ path: `${evidence}/touch-${viewport.width}x${viewport.height}.png` });
      }
      await touch.close();
      await fs.writeFile(`${evidence}/layout-results.json`, JSON.stringify({ engine, results }, null, 2));
      console.log(`${engine}: 8themes, 5fine-pointer layouts and 3touch layouts/all21touch actions passed`);
    }
    // Running Quantum: Reset reflects changing model time, preserves LOOP, and
    // restarts from phase zero without consuming an old timestamp.
    const motion = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' }); watch(motion);
    await motion.goto(`${base}/generator/wave-quantum/`); await ready(motion);
    const loop = motion.locator('label.switch:has(#quantum-motion-toggle)');
    assert.equal(await motion.locator('#quantum-motion-toggle').isChecked(), true, 'fresh route defaults to Loop');
    await motion.waitForFunction(() => !document.querySelector('[data-parameter-style="wave-quantum"][data-parameter-action="reset"]').disabled);
    const resetState = await motion.evaluate(() => {
      document.getElementById('quantum-phase').value = .5;
      document.getElementById('quantum-speed-slider').value = .2;
      document.getElementById('quantum-reverse-toggle').checked = true;
      document.getElementById('quantum-phase').dispatchEvent(new Event('input', { bubbles: true }));
      resetStyleParameters('wave-quantum');
      return { phase: quantumControls.values().quantumPhase, loop: document.getElementById('quantum-motion-toggle').checked,
        speed: document.getElementById('quantum-speed-slider').value, reverse: document.getElementById('quantum-reverse-toggle').checked,
        disabled: document.querySelector('[data-parameter-style="wave-quantum"][data-parameter-action="reset"]').disabled };
    });
    // Preserved playback may already advance during requestUpdate's synchronous
    // redraws. It must restart near zero, not retain/catch up from the old half-cycle.
    assert.ok(resetState.phase >= 0 && resetState.phase < 1 && Math.min(resetState.phase, 1 - resetState.phase) < .005, JSON.stringify(resetState));
    assert.equal(resetState.loop, true); assert.equal(resetState.speed, '1'); assert.equal(resetState.reverse, false);
    assert.equal(resetState.disabled, resetState.phase === 0);
    await motion.waitForFunction(() => !document.querySelector('[data-parameter-style="wave-quantum"][data-parameter-action="reset"]').disabled);
    await loop.click();
    assert.equal(await motion.locator('#quantum-motion-toggle').isChecked(), false);
    const paused = await motion.evaluate(() => {
      resetStyleParameters('wave-quantum');
      return { phase: quantumControls.values().quantumPhase,
        disabled: document.querySelector('[data-parameter-style="wave-quantum"][data-parameter-action="reset"]').disabled };
    });
    assert.deepEqual(paused, { phase: 0, disabled: true });
    await motion.close();
    assert.deepEqual(errors, []);
    await fs.writeFile(`${evidence}/${quantumOnly ? 'quantum-results' : 'results'}.json`, JSON.stringify({ engine, results }, null, 2));
    console.log(`${engine}: ${quantumOnly ? 'running Quantum phase' : layoutOnly ? 'layout phase, running Quantum' : 'complete suite'} passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
