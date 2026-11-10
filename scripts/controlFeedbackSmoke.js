const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:4460';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/control-feedback-${engine}`;
const active = ['ruler', 'binary', 'morse', 'ticker', 'waveform', 'wave-quantum', 'circles', 'numeric',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles'];
const ready = page => page.waitForFunction(() => window.barShareController && window.logoExportUI);
const select = (page, style) => page.selectOption('#style-select', style, { force: true });
const reset = (page, style) => page.locator(`[data-parameter-style="${style}"][data-parameter-action="reset"]`);
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const errors = [], results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/circles/`); await ready(page);
    for (const style of (process.env.RPI_CONTROLS_PHASE === 'integration' ? [] : active)) {
      await select(page, style);
      const before = await page.evaluate(style => {
        const fields = ParameterControls.fieldsFor(style);
        return fields.map(field => ({ id: field.id, described: (field.getAttribute('aria-describedby') || '').includes(`${field.id}-default-note`),
          note: document.getElementById(`${field.id}-default-note`)?.textContent }));
      }, style);
      assert.ok(before.every(item => item.described && item.note), `${style}: ${JSON.stringify(before)}`);
      const summary = page.locator(`[data-parameter-actions="${style}"] [data-parameter-summary]`);
      assert.equal(await summary.textContent(), 'Default settings', style);
      await page.locator(`[data-parameter-style="${style}"][data-parameter-action="randomize"]`).click();
      assert.match(await summary.textContent(), /\d+ changed from defaults/);
      assert.ok(await page.locator(`[data-parameter-actions="${style}"] .has-parameter-change`).count() > 0);
      await reset(page, style).click();
      assert.equal(await summary.textContent(), 'Default settings');
      assert.equal(await page.locator(`[data-parameter-actions="${style}"] .has-parameter-change`).count(), 0);
      assert.equal(await reset(page, style).isDisabled(), true);
      results.push(`${style}: defaults, descriptions, Randomize and Reset`);
    }
    await select(page, 'circles');
    const live = await page.evaluate(() => {
      const field = document.getElementById('circles-density-slider');
      const original = field.value;
      field.value = String(Number(original) + 1);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      return { value: field.value, label: document.getElementById('circles-density-display').textContent,
        summary: document.querySelector('#circles-group [data-parameter-summary]').textContent,
        url: new URL(URLState.pendingURL() || location.href).searchParams.get('circlesDensity'),
        title: document.querySelector('label[for="circles-density-slider"]').title };
    });
    assert.equal(live.value, live.label);
    assert.equal(live.url, live.value, 'URL writer receives the new state immediately; its browser-history throttle is preserved');
    assert.equal(live.summary, '1 changed from defaults');
    assert.match(live.title, /^Changed\. Default: /);
    const display = page.locator('#circles-density-display');
    await display.focus();
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    assert.equal(await display.evaluate(el => getComputedStyle(el).outlineWidth), '2px');
    await display.press('Enter');
    await page.locator('.slider_value-input').fill('24');
    await page.locator('.slider_value-input').press('Enter');
    assert.equal(await page.locator('#circles-density-slider').inputValue(), '24');
    assert.match(await page.locator('#circles-density-slider-default-note').textContent(), /^Changed/);
    const beforeFill = await page.locator('#p5-container canvas').evaluate(canvas => canvas.toDataURL());
    await page.selectOption('#circles-fill-select', 'fill', { force: true });
    await page.waitForFunction(before => document.querySelector('#p5-container canvas').toDataURL() !== before, beforeFill);
    assert.equal(await page.locator('#circles-group [data-parameter-summary]').textContent(), '2 changed from defaults');
    const undo = page.locator('[data-randomize-undo="circles"]');
    if (await undo.count()) {
      const expected = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
      await page.locator('[data-parameter-style="circles"][data-parameter-action="randomize"]').click();
      await undo.click();
      assert.equal(await page.evaluate(() => captureLogoExportSnapshot().svgSource), expected);
      assert.equal(await page.locator('#circles-group [data-parameter-summary]').textContent(), '2 changed from defaults');
      assert.equal(await undo.isDisabled(), true);
      await page.waitForFunction(() => document.getElementById('toast-status').textContent === 'Previous variation restored.');
      assert.equal(await page.locator('#toast-container .toast').count(), 0, 'normal Undo has no visible toast');
      results.push('Undo quietly restores artwork, changed markers and accessible outcome');
    }
    await page.screenshot({ path: `${evidence}/light-controls.png` });
    await page.selectOption('#color-mode-select', 'white', { force: true });
    await page.screenshot({ path: `${evidence}/dark-controls.png` });
    // Updates do not add motion when the operating system requests less motion.
    await select(page, 'ticker');
    assert.equal(await page.locator('#ticker-group').evaluate(el => el.getAnimations().length), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // WebKit applies the media-query change asynchronously across rendering frames.
    await page.waitForFunction(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(() => {
      window.feedbackAnimations = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        const animation = animate.call(this, frames, options);
        if (this.hasAttribute('data-parameter-actions')) feedbackAnimations.push({ id: this.id, duration: options.duration, animation });
        return animation;
      };
    });
    await select(page, 'grid');
    await page.waitForFunction(() => window.feedbackAnimations.length > 0);
    await select(page, 'triangles');
    await page.waitForFunction(() => window.feedbackAnimations.some(item => item.id === 'triangles-group'));
    assert.ok(await page.evaluate(() => feedbackAnimations.every(item => item.duration === 120)));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches &&
      [...document.querySelectorAll('[data-parameter-actions]')].flatMap(el => el.getAnimations()).length === 0);
    // Outcomes are text, keyboard-dismissible and removed even with no animation.
    await page.evaluate(() => { Toast.show('<strong>Unchanged</strong>', 'error', 0); });
    assert.equal(await page.locator('.toast-message').last().textContent(), '<strong>Unchanged</strong>');
    assert.equal(await page.locator('#toast-alert').getAttribute('role'), 'alert');
    await page.waitForFunction(() => document.getElementById('toast-alert').textContent === '<strong>Unchanged</strong>');
    assert.equal(await page.locator('.toast-message strong').count(), 0);
    await page.locator('.toast_dismiss').last().click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => { Toast.show('Complete', 'success', 150); Toast.show('Complete', 'success', 150); });
    assert.equal(await page.locator('.toast').count(), 1);
    await page.waitForFunction(() => !document.querySelector('.toast'));
    results.push('Immediate slider state, editable values, focus, coherent/reduced motion, accessible outcome messages');
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(`${base}/generator/circles/`); await ready(mobile);
    await mobile.locator('#mobile-menu-toggle').click();
    await mobile.locator('#circles-density-display').waitFor({ state: 'visible' });
    const bounds = await mobile.evaluate(() => {
      const group = document.querySelector('#circles-group');
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        targets: [...group.querySelectorAll('.control-slider, .slider_value-display, .control-header-actions button')].map(el => ({ id: el.id, height: el.getBoundingClientRect().height })),
        labels: [...group.querySelectorAll('.control-label')].map(el => Number.parseFloat(getComputedStyle(el).fontSize)) };
    });
    assert.equal(bounds.overflow, false);
    assert.ok(bounds.targets.every(item => item.height >= 44), JSON.stringify(bounds));
    assert.ok(bounds.labels.every(size => size >= 12));
    await mobile.evaluate(() => {
      const scroll = document.querySelector('.sidebar-scroll');
      const group = document.getElementById('circles-group');
      scroll.scrollTop += group.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 16;
    });
    await mobile.screenshot({ path: `${evidence}/phone-controls.png` });
    await mobile.setViewportSize({ width: 320, height: 812 });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const narrowActions = await mobile.locator('#circles-group .control-header-actions').boundingBox();
    assert.ok(narrowActions.x >= 0 && narrowActions.x + narrowActions.width <= 320);
    await mobile.screenshot({ path: `${evidence}/narrow-controls.png` });
    assert.deepEqual(errors, []);
    await fs.writeFile(`${evidence}/results.json`, JSON.stringify({ engine, results, bounds, errors }, null, 2));
    console.log(`${engine}: ${results.length} checks passed; ${evidence}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
