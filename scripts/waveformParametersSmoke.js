const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8841';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/waveform-parameters-${engine}`;
const active = ['ruler', 'binary', 'morse', 'ticker', 'waveform', 'wave-quantum', 'circles', 'numeric',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles'];
const fixed = ['solid', 'fibonacci-sequence', 'union', 'runway', 'lunar'];
const ready = page => page.waitForFunction(() => window.logoExportUI && window.barShareController && document.querySelector('#p5-container canvas'));
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const errors = [], results = [];
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
        isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/generator/waveform/`); await ready(page);
      if (mobile) await page.locator('#mobile-menu-toggle').click();
      for (const style of [...active, ...fixed]) {
        await page.selectOption('#style-select', style, { force: true });
        const result = await page.evaluate(({ style, active }) => {
          const group = document.querySelector(`[data-parameter-actions="${style}"]`);
          if (!active.includes(style)) return { style, fixed: true, actions: [...document.querySelectorAll('[data-parameter-action]')].filter(el => el.getClientRects().length).length };
          const visible = el => el.getClientRects().length > 0;
          const fields = [...group.querySelectorAll('.control')].filter(visible);
          const gaps = fields.slice(1).map((field, i) => ({ previous: fields[i].querySelector('input,select')?.id,
            next: field.querySelector('input,select')?.id, gap: field.getBoundingClientRect().top - fields[i].getBoundingClientRect().bottom }));
          const font = [...group.querySelectorAll('.control-hint')].filter(visible).map(el => ({ size: getComputedStyle(el).fontSize, style: getComputedStyle(el).fontStyle }));
          const labels = [...group.querySelectorAll('.slider-control > label')].filter(visible).map(el => ({ id: el.htmlFor,
            layout: el.dataset.sliderValueLayout, gap: el.querySelector('.slider_value-group').getBoundingClientRect().left - el.querySelector('.slider_label-text').getBoundingClientRect().right }));
          return { style, gaps, font, labels, overflow: document.documentElement.scrollWidth > innerWidth,
            topHint: group.querySelector(':scope > .control-header + .control-hint') !== null };
        }, { style, active });
        if (result.fixed) assert.equal(result.actions, 0, `${style} has no parameter actions`);
        else {
          assert.equal(result.overflow, false, `${style} horizontal overflow`);
          assert.equal(result.topHint, false, `${style} redundant top hint`);
          for (const item of result.gaps) assert.ok(item.gap >= 15.9, `${style} ${JSON.stringify(item)}`);
          for (const font of result.font) { assert.equal(font.size, '12px'); assert.equal(font.style, 'normal'); }
          for (const label of result.labels) { assert.equal(label.layout, 'ready'); assert.ok(label.gap > 0); }
        }
        results.push({ mobile, ...result });
        if (!mobile) {
          await page.locator('.sidebar-scroll').evaluate(el => { el.scrollTop = 0; });
          await page.screenshot({ path: `${evidence}/layout-${style}.png`, clip: { x: 1088, y: 56, width: 352, height: 944 } });
        }
      }
      await page.selectOption('#style-select', 'waveform', { force: true });
      if (mobile && !await page.locator('#app-sidebar').evaluate(el => el.classList.contains('active'))) await page.locator('#mobile-menu-toggle').click();
      await page.locator('.sidebar-scroll').evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `${evidence}/${mobile ? 'mobile' : 'desktop'}-waveform.png` });
      assert.equal(await page.locator('[id^="waveform-lfo"]').count(), 0);
      const label = page.locator('#waveform-type-slider'); await label.focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await label.inputValue(), '.01'.replace(/^\./, '0.'));
      await page.locator('[data-parameter-style="waveform"][data-parameter-action="reset"]').click();
      assert.equal(await label.inputValue(), '0');
      await page.close();
    }
    // Real live render paths, every shape and the interpolated states, then static captures.
    for (const fallback of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.on('pageerror', e => errors.push(e.message));
      if (fallback) await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return /^webgl/.test(type) ? null : original.call(this, type, ...args);
        };
      });
      await page.goto(`${base}/generator/waveform/`); await ready(page);
      await page.waitForFunction(() => !window.PageEntrance?.isActive?.());
      for (const type of [0, .5, 1, 1.5, 2, 2.5, 3]) {
        const data = await page.evaluate(async type => {
          waveformTypeSlider.value = type; waveformTypeSlider.dispatchEvent(new Event('input', { bubbles: true }));
          const samples = [];
          for (let frame = 0; frame < 20; frame++) { await new Promise(requestAnimationFrame); samples.push(liveMotionPhase); }
          await window.waveformScopeController.ready();
          setMotionEnabledForStyle('waveform', false);
          const state = getCurrentLoopAnimationState();
          const live = getLiveWaveformGeometry(0, 0, 250, 18, state.timeSeconds);
          const exported = createWaveformPatternGeometry({ ...getCurrentBarPatternValues(250),
            barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 });
          const source = captureLogoExportSnapshot().svgSource;
          const result = { type, moved: samples[0] !== samples.at(-1), parity: JSON.stringify(live) === JSON.stringify(exported),
            finite: !/NaN|Infinity/.test(source), curvePoints: live.curve.length };
          setMotionEnabledForStyle('waveform', true);
          return result;
        }, type);
        assert.ok(data.moved); assert.ok(data.parity); assert.ok(data.finite); results.push({ fallback, ...data });
      }
      await page.close();
    }
    assert.deepEqual(errors, []);
    await fs.writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
    console.log(`${engine}: ${results.length} style/layout and waveform renderer cases passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
