// Real controls, persisted rates, request-time exports and optional static Home integration.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { parseGif } = require('../tests/helpers/gifDecoder');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8767';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/rpi-speed-icon-${engine}`;
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch(engine === 'chromium' && process.env.RPI_CHROMIUM_PATH
    ? { executablePath: process.env.RPI_CHROMIUM_PATH } : {});
  try {
    const results = [];
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const ready = () => page.waitForFunction(() => window.barShareController && window.randomizeHistory && window.logoExportUI);
      for (const [style, prefix, initial] of [['ticker', 'ticker', '0.4'], ['waveform', 'waveform', '0.3'], ['wave-quantum', 'quantum', '1'], ['gradient', 'gradient', '0.1']]) {
        const slider = page.locator(`#${prefix}-speed-slider`);
        const open = async query => {
          await page.goto(`${base}/generator/${style}/${query || ''}`); await ready();
          if (width < 900) await page.locator('#mobile-menu-toggle').click();
        };
        await open();
        assert.equal(await slider.inputValue(), initial, `${style} default`);
        const minimum = Number(initial) * .2, maximum = Number(initial) * 4;
        assert.equal(Number(await slider.getAttribute('min')), minimum);
        assert.equal(Number(await slider.getAttribute('max')), maximum);
        assert.equal(await slider.getAttribute('step'), '0.001');
        assert.equal(await page.locator(`#${prefix}-speed-display`).innerText(), '1×');
        await slider.focus(); await page.keyboard.press('ArrowRight');
        assert.equal(Number(await slider.inputValue()), Number((Number(initial) * 1.05).toFixed(3)));
        await page.locator(`#${prefix}-speed-display`).click();
        const editor = page.locator(`#${prefix}-speed-display`).locator('..').locator('input');
        await editor.fill('0.25'); await editor.press('Enter');
        assert.equal(Number(await slider.inputValue()), Number((Number(initial) / 4).toFixed(3)));
        assert.equal(await page.locator(`#${prefix}-motion-toggle`).isChecked(), false, 'reduced motion stays paused');
        await slider.focus(); await page.keyboard.press('End');
        assert.equal(Number(await slider.inputValue()), maximum, 'keyboard maximum');
        assert.equal(await page.locator(`#${prefix}-speed-display`).innerText(), '4×');
        await page.evaluate(() => URLState.flush());
        await page.reload(); await ready();
        if (width < 900) await page.locator('#mobile-menu-toggle').click();
        assert.equal(Number(await slider.inputValue()), maximum, 'URL reload retains higher rate');
        const link = await page.evaluate(() => barShareController.buildLink());
        await page.goto(link); await ready();
        if (width < 900) await page.locator('#mobile-menu-toggle').click();
        assert.equal(Number(await slider.inputValue()), maximum, 'snapshot retains higher rate');
        const group = page.locator(`#${prefix}-group`);
        const randomize = group.locator('[data-parameter-action="randomize"]');
        assert.equal(await randomize.locator('svg').evaluate(el => {
          const reference = document.createElement('div');
          reference.innerHTML = FeatherIcons.getIconMarkup('shuffle', 'parameter_action-icon');
          return el.outerHTML === reference.firstElementChild.outerHTML;
        }), true, 'exact pinned icon and semantics');
        await randomize.click();
        assert(Number(await slider.inputValue()) >= minimum && Number(await slider.inputValue()) <= maximum);
        await group.locator('[data-randomize-undo]').click();
        assert.equal(Number(await slider.inputValue()), maximum, 'Undo preserves selected rate');
        await group.locator('[data-parameter-action="reset"]').click();
        assert.equal(await slider.inputValue(), initial, 'Reset preserves original default');
        const legacy = prefix === 'gradient' ? '0.3' : '0.8';
        await open(`?${prefix}Speed=${legacy}`);
        assert.equal(await slider.inputValue(), legacy, 'old URL retains original rate');
        await slider.focus(); await page.keyboard.press('End');
        await slider.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(evidence, `${style}-${width}.png`) });
        if (width === 1440) {
          const snapshot = await page.evaluate(() => captureLogoExportSnapshot().svgSource);
          for (const [method, extension] of [['saveSVG', 'svg'], ['savePNG', 'png'], ...(prefix === 'quantum' ? [] : [['saveLoopingGIF', 'gif']])]) {
            const pending = page.waitForEvent('download', { timeout: 120000 });
            await page.evaluate(method => window[method](), method);
            const download = await pending, bytes = await fs.readFile(await download.path());
            await download.saveAs(path.join(evidence, `${style}.${extension}`));
            if (extension === 'svg') assert.equal(bytes.toString(), snapshot, 'SVG phase snapshot parity');
            if (extension === 'png') { assert.equal(bytes.readUInt32BE(16), 1160); assert.equal(bytes.readUInt32BE(20), 762); }
            if (extension === 'gif') {
              const gif = parseGif(bytes);
              assert.equal(gif.width, 1160); assert.equal(gif.height, 762);
              assert.ok(Math.abs(gif.frames.reduce((sum, frame) => sum + frame.delayMs, 0) - 1000 / maximum) <= 5, 'GIF retains selected physical rate');
              assert(gif.frames.every(frame => frame.transparent && frame.delayMs >= 20));
            }
          }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        results.push({ style, width, defaults: true, keyboard: true, url: true, snapshot: true, randomize: true, undo: true, reset: true, legacyRate: true });
      }
      assert.deepEqual(errors, []); await page.close();
    }
    for (const home of ['/', '/marquee-ui.html']) {
      const page = await browser.newPage(); await page.goto(base + home);
      await page.waitForFunction(() => document.querySelectorAll('.marquee_item img').length > 100);
      assert.equal(await page.locator('.bar_motion_asset').count(), 0);
      assert.equal(await page.evaluate(() => !!window.MarqueeAnimation?.mount), false);
      await page.close();
    }
    console.log(`PASS ${engine}: ${results.length} speed/control and optional static-marquee integration cases; SVG/PNG/GIF exports in ${evidence}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
