// Observe actual canvas pixels for translational bars; Quantum changes shape,
// so verify painted change and the explicitly documented model-time direction.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8841';
const evidence = process.env.RPI_EVIDENCE_DIR || `/tmp/animated-directions-${engine}`;
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [];
  try {
    for (const style of ['ruler', 'ticker', 'waveform', 'wave-quantum']) {
      const quantum = style === 'wave-quantum', prefix = quantum ? 'quantum' : style;
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/generator/${style}/`);
      await page.waitForFunction(() => window.logoExportUI && window.barShareController && !window.PageEntrance?.isActive?.());
      assert.equal(await page.locator(`#${prefix}-motion-toggle`).isChecked(), true);
      assert.equal(await page.locator(`#${prefix}-reverse-toggle`).isChecked(), false);
      const motion = enabled => page.evaluate(({ prefix, enabled, quantum }) => {
        const input = document.getElementById(`${prefix}-motion-toggle`);
        input.checked = enabled; input.dispatchEvent(new Event('change', { bubbles: true }));
      }, { prefix, enabled, quantum });
      await motion(false);
      await page.evaluate(quantum => {
        if (quantum) { const input = document.getElementById('quantum-phase'); input.value = '.37'; input.dispatchEvent(new Event('input', { bubbles: true })); }
        else liveMotionPhase = .37;
        // Track Waveform's sharp painted edges at a legible spatial frequency.
        if (currentShader === 4) {
          waveformTypeSlider.value = 2; waveformTypeSlider.dispatchEvent(new Event('input', { bubbles: true }));
          waveformFrequencySlider.value = 10; waveformFrequencySlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
        requestUpdate();
      }, quantum);
      const capture = async () => {
        await page.evaluate(async () => { for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame); });
        return page.evaluate(quantum => {
          const source = document.querySelector('#p5-container canvas');
          const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(source, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let hash = 2166136261;
          for (let i = 0; i < data.length; i++) hash = Math.imul(hash ^ data[i], 16777619) >>> 0;
          const painted = (x, y) => { const i = (y * width + x) * 4; return data[i + 3] > 128 && data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128; };
          let row = -1;
          for (let y = height - 1; y >= 0; y--) {
            let count = 0; for (let x = 0; x < width; x++) if (painted(x, y)) count++;
            if (count > width / 100) { row = y - 3; break; }
          }
          const edges = [];
          if (row >= 0) for (let x = 1; x < width; x++) if (painted(x, row) && !painted(x - 1, row)) edges.push(x);
          return { phase: quantum ? quantumControls.values().quantumPhase : liveMotionPhase, row, edges, width, hash };
        }, quantum);
      };
      for (const reverse of [false, true]) {
        const positionBeforeToggle = await capture();
        await page.evaluate(({ prefix, reverse }) => {
          const input = document.getElementById(`${prefix}-reverse-toggle`);
          input.checked = reverse; input.dispatchEvent(new Event('change', { bubbles: true }));
        }, { prefix, reverse });
        const before = await capture();
        assert.equal(before.phase, positionBeforeToggle.phase, `${style}: Reverse preserves phase`);
        assert.equal(before.hash, positionBeforeToggle.hash, `${style}: Reverse preserves actual painted pixels`);
        await page.screenshot({ path: `${evidence}/${style}-${reverse ? 'reverse' : 'default'}-before.png` });
        await motion(true); await page.waitForTimeout(250); await motion(false);
        const after = await capture();
        await page.screenshot({ path: `${evidence}/${style}-${reverse ? 'reverse' : 'default'}-after.png` });
        assert.notEqual(after.hash, before.hash, `${style}: artwork actually moved`);
        if (quantum) assert.equal(Math.sign(after.phase - before.phase), reverse ? 1 : -1, 'Quantum earlier/later model time');
        const deltas = quantum ? [] : before.edges.filter(x => x > before.width * .2 && x < before.width * .8)
          .map(x => after.edges.reduce((nearest, current) => Math.abs(current - x) < Math.abs(nearest - x) ? current : nearest) - x);
        const expected = (style === 'ticker' ? -1 : 1) * (reverse ? -1 : 1);
        if (!quantum) {
          assert.ok(deltas.length >= 3, JSON.stringify({ style, before, after }));
          assert.ok(deltas.every(delta => Math.sign(delta) === expected), JSON.stringify({ style, reverse, deltas, before, after }));
        }
        await page.waitForTimeout(100); const paused = await capture();
        assert.equal(paused.phase, after.phase); assert.equal(paused.hash, after.hash);
        results.push({ style, reverse, pixelDeltas: deltas, beforePhase: before.phase, afterPhase: after.phase, paintedChange: true });
      }
      assert.deepEqual(errors, []); await page.close();
    }
    await fs.writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
    console.log(`${engine}: ${JSON.stringify(results)}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
