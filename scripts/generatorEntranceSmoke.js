// Generator-only regression/evidence runner. Use a server rooted in this checkout.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const out = process.env.RPI_EVIDENCE_DIR || '/tmp/generator-ascii-alignment';
const layers = '.entrance_ascii,.entrance_ascii-artwork,.is-ascii-original';
(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch(process.env.RPI_BROWSER_EXECUTABLE
    ? { executablePath: process.env.RPI_BROWSER_EXECUTABLE } : {});
  const results = [];
  try {
    for (const [width, height, dpr] of [[1440, 900, 1], [901, 700, 1], [900, 700, 1], [390, 844, 2], [320, 568, 2], [844, 390, 2]]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__entranceFrames = [];
        const start = performance.now();
        function tick(t) {
          const canvas = document.querySelector('#p5-container > canvas');
          if (canvas?.dataset.previewReady === 'true' && window.PageEntrance?.isActive()) {
            const rect = canvas.getBoundingClientRect();
            const copies = [...document.querySelectorAll('[data-ascii-letter]')];
            const chrome = [...document.querySelectorAll('[data-parameter-summary], [data-url-parameter]')]
              .map(node => [node.id, node.value ?? node.textContent, node.checked]);
            __entranceFrames.push({ t, bounds: [rect.left, rect.top, rect.width, rect.height], chrome,
              copies: copies.map(node => { const r = node.getBoundingClientRect();
                return { opacity: Number(node.style.opacity), bounds: [r.left, r.top, r.width, r.height], src: node.src }; }) });
            if (copies.length === 4) window.__entranceSources = copies.map(node => node.src);
          }
          if (t - start < 6000) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      await page.goto(base + '/generator/triangles/?colorMode=black&trianglesCount=6&trianglesDirection=up-left');
      await page.waitForFunction(() => window.AsciiEntrance?.lastPreparation);
      // Snapshot intermediate UI when it exists, without extending production timing.
      if (await page.locator('[data-ascii-letter]').count()) await page.screenshot({ path: path.join(out, `${engine}-${width}x${height}-decode.png`) });
      await page.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await page.locator(layers).count(), 0);
      const evidence = await page.evaluate(() => ({ frames: __entranceFrames, prep: AsciiEntrance.lastPreparation, animation: AsciiEntrance.lastAnimation }));
      assert.equal(evidence.prep.outcome, 'ready', 'Rendering checks require a real decode, not deadline fallback');
      const frames = evidence.frames.filter(frame => frame.copies.length === 4);
      assert.ok(frames.length >= 3, 'Need multiple rendered decode frames');
      for (const frame of frames) {
        for (const copy of frame.copies) copy.bounds.forEach((value, i) => assert.ok(Math.abs(value - frame.bounds[i]) < 0.02, 'Overlay moved relative to canvas'));
        assert.deepEqual(frame.chrome, frames[0].chrome, 'Parameters/changed count changed during the entrance');
      }
      assert.ok(frames.some(frame => frame.copies[0].opacity > frame.copies[1].opacity && frame.copies[1].opacity >= frame.copies[2].opacity), 'Letters must resolve independently');
      // Compare actual live canvas alpha with the decoded canonical vector after
      // cleanup. This test-only synchronous draw avoids GPU readback in production.
      const alignment = await page.evaluate(async () => {
        const live = document.querySelector('#p5-container > canvas');
        const width = window.width, height = window.height;
        const sample = document.createElement('canvas'); sample.width = width; sample.height = height;
        const ctx = sample.getContext('2d', { willReadFrequently: true });
        const bounds = pixels => {
          let left = width, top = height, right = -1, bottom = -1, area = 0;
          for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (pixels[(y * width + x) * 4 + 3] > 64) {
            left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); area++;
          }
          return { box: [left, top, right, bottom], area };
        };
        window.draw(); ctx.drawImage(live, 0, 0, width, height);
        const actual = ctx.getImageData(0, 0, width, height).data;
        const expected = new Uint8ClampedArray(actual.length);
        const partBounds = [];
        for (const src of __entranceSources) {
          const image = new Image(); image.src = src; await image.decode();
          ctx.clearRect(0, 0, width, height); ctx.drawImage(image, 0, 0, width, height);
          const part = ctx.getImageData(0, 0, width, height).data;
          partBounds.push(bounds(part));
          for (let k = 3; k < part.length; k += 4) expected[k] = Math.max(expected[k], part[k]);
        }
        let mismatch = 0;
        for (let k = 3; k < actual.length; k += 4) if (Math.abs(actual[k] - expected[k]) > 64) mismatch++;
        return { actual: bounds(actual), expected: bounds(expected), parts: partBounds, mismatchFraction: mismatch / Math.max(1, bounds(expected).area) };
      });
      alignment.actual.box.forEach((value, i) => assert.ok(Math.abs(value - alignment.expected.box[i]) <= 1, 'Live/vector paint bounds differ'));
      assert.ok(alignment.mismatchFraction < 0.025, 'Live/vector alpha coverage differs');
      await page.screenshot({ path: path.join(out, `${engine}-${width}x${height}-final.png`) });
      // Reload means a fresh entrance; every interruption must leave a usable original.
      for (const interruption of ['keyboard', 'pointer', 'resize', 'reduced', 'pagehide', 'restore']) {
        await page.reload();
        await page.waitForFunction(() => document.querySelector('[data-ascii-letter]'));
        if (interruption === 'keyboard') await page.keyboard.press('Tab');
        if (interruption === 'pointer') await page.mouse.click(width / 2, height / 2);
        if (interruption === 'resize') await page.setViewportSize({ width: width - 1, height });
        if (interruption === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
        if (interruption === 'pagehide') await page.evaluate(() => dispatchEvent(new Event('pagehide')));
        if (interruption === 'restore') await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await page.waitForFunction(() => !PageEntrance.isActive());
        assert.equal(await page.locator(layers).count(), 0, interruption);
        await page.waitForTimeout(400);
        assert.equal(await page.locator(layers).count(), 0, `${interruption}: late reentry`);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.setViewportSize({ width, height });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
      await page.waitForFunction(() => document.querySelector('#p5-container>canvas')?.dataset.previewReady === 'true');
      assert.equal(await page.locator(layers).count(), 0);
      assert.equal(await page.evaluate(() => PageEntrance.isActive()), false);
      assert.deepEqual(errors, []);
      results.push({ width, height, dpr, alignment, ...evidence });
      await page.close();
    }
    await fs.writeFile(path.join(out, `${engine}-results.json`), JSON.stringify(results, null, 2));
    console.log(`${engine}: ${results.length} responsive layouts, per-frame alignment/chrome, alpha parity, interruption/reentry and reduced motion passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
