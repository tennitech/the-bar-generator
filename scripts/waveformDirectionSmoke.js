const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8841';
const expectedDefault = Number(process.env.RPI_EXPECTED_DIRECTION || 1);
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/waveform-direction-${engine}`;
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    for (const fallback of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      if (fallback) await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /^webgl/.test(type) ? null : getContext.call(this, type, ...args); };
      });
      await page.goto(`${base}/generator/waveform/`);
      await page.waitForFunction(() => window.logoExportUI && window.barShareController && !window.PageEntrance?.isActive?.());
      assert.equal(await page.locator('#waveform-motion-toggle').isChecked(), true);
      assert.equal(await page.locator('#waveform-reverse-toggle').isChecked(), false);
      await page.evaluate(() => {
        setMotionEnabledForStyle('waveform', false);
        waveformTypeSlider.value = 2; waveformTypeSlider.dispatchEvent(new Event('input', { bubbles: true }));
        waveformFrequencySlider.value = 10; waveformFrequencySlider.dispatchEvent(new Event('input', { bubbles: true }));
        liveMotionPhase = .37; requestUpdate();
      });
      const capture = async () => {
        await page.evaluate(async () => { for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame); });
        return page.evaluate(() => {
          const source = document.querySelector('#p5-container canvas');
          const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(source, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const painted = (x, y) => { const i = (y * width + x) * 4; return data[i + 3] > 128 && data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128; };
          let row = -1;
          for (let y = height - 1; y >= 0; y--) {
            let count = 0; for (let x = 0; x < width; x++) if (painted(x, y)) count++;
            if (count > width / 20) { row = y - 4; break; }
          }
          const edges = [];
          if (row >= 0) for (let x = 1; x < width; x++) if (painted(x, row) && !painted(x - 1, row)) edges.push(x);
          return { phase: liveMotionPhase, row, edges, width, height };
        });
      };
      for (const reverse of [false, true]) {
        const beforeReverse = await page.evaluate(() => liveMotionPhase);
        await page.evaluate(reverse => {
          waveformReverseToggle.checked = reverse;
          waveformReverseToggle.dispatchEvent(new Event('change', { bubbles: true }));
        }, reverse);
        assert.equal(await page.evaluate(() => liveMotionPhase), beforeReverse, 'Reverse does not jump phase');
        const before = await capture();
        await page.screenshot({ path: `${evidence}/${fallback ? '2d' : 'webgl'}-${reverse ? 'reverse' : 'default'}-before.png` });
        await page.evaluate(() => setMotionEnabledForStyle('waveform', true));
        await page.waitForTimeout(300);
        await page.evaluate(() => setMotionEnabledForStyle('waveform', false));
        const after = await capture();
        await page.screenshot({ path: `${evidence}/${fallback ? '2d' : 'webgl'}-${reverse ? 'reverse' : 'default'}-after.png` });
        const deltas = before.edges.filter(x => x > before.width * .2 && x < before.width * .8)
          .map(x => after.edges.reduce((nearest, current) => Math.abs(current - x) < Math.abs(nearest - x) ? current : nearest) - x);
        assert.ok(deltas.length >= 3, JSON.stringify({ before, after }));
        const expected = expectedDefault * (reverse ? -1 : 1);
        assert.ok(deltas.every(delta => Math.sign(delta) === expected), JSON.stringify({ reverse, deltas, before, after }));
        const stopped = await page.evaluate(() => liveMotionPhase); await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => liveMotionPhase), stopped, 'Loop pause holds phase');
        results.push({ fallback, reverse, pixelDeltas: deltas, beforePhase: before.phase, afterPhase: after.phase });
      }
      assert.deepEqual(errors, []); await page.close();
    }
    await fs.writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
    console.log(`${engine}: actual rendered waveform edges: ${JSON.stringify(results)}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
