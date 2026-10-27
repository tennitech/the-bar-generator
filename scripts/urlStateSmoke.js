const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const ready = () => page.waitForFunction(() => window.barShareController && window.URLState);
    const burst = async (count, direction) => page.evaluate(({ count, direction }) => {
      window.__historyWrites = 0; window.__historyWriteTimes = [];
      if (!window.__historyOriginal) {
        window.__historyOriginal = history.replaceState.bind(history);
        history.replaceState = (...args) => { __historyWrites++; __historyWriteTimes.push(performance.now()); return __historyOriginal(...args); };
      }
      const slider = document.getElementById('triangles-count-slider');
      for (let i = 0; i < 500; i++) {
        slider.value = String(6 + i % 23); slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
      slider.value = String(count); slider.dispatchEvent(new Event('input', { bubbles: true }));
      const field = document.getElementById('triangles-direction-select'); field.value = direction;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }, { count, direction });
    await page.goto(`${base}/generator/triangles/`); await ready();
    await burst(28, 'up-left');
    await page.waitForFunction(() => new URLSearchParams(location.search).get('trianglesCount') === '28'
      && new URLSearchParams(location.search).get('trianglesDirection') === 'up-left');
    assert.equal(await page.evaluate(() => __historyWriteTimes.every((time, index, times) => !index || time - times[index - 1] >= 199)), true, 'History writes remain at least200ms apart during rapid edits');
    const link = await page.evaluate(() => barShareController.buildLink());
    await page.goto(link); await ready();
    await burst(6, 'down-left');
    await page.waitForFunction(() => {
      const saved = BarShareState.decodeState(location.hash, barShareController.manifest);
      return saved.controls['triangles-count-slider'] === '6' && saved.controls['triangles-direction-select'] === 'down-left';
    });
    assert.equal(await page.evaluate(() => __historyWriteTimes.every((time, index, times) => !index || time - times[index - 1] >= 199)), true, 'History writes remain at least200ms apart during rapid edits');
    // Navigation wins over an older pending edit.
    await page.evaluate(() => {
      const input = document.getElementById('triangles-count-slider');
      input.value = '18'; input.dispatchEvent(new Event('input', { bubbles: true }));
      input.value = '19'; input.dispatchEvent(new Event('input', { bubbles: true }));
      history.pushState({}, '', location.pathname + '?trianglesCount=10&trianglesDirection=up-right');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(300);
    assert.equal(await page.inputValue('#triangles-count-slider'), '10');
    assert.equal(new URL(page.url()).searchParams.get('trianglesCount'), '10');
    // Reload flushes the final edit instead of restoring the penultimate slider value.
    await page.evaluate(() => {
      const input = document.getElementById('triangles-count-slider');
      for (const value of ['11', '19']) { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.reload(); await ready();
    assert.equal(await page.inputValue('#triangles-count-slider'), '19');
    // Simulate bfcache lifecycle callbacks, then use a real reload to expose stale handoffs.
    await page.evaluate(() => {
      const input = document.getElementById('triangles-count-slider');
      for (const value of ['20', '22']) { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); }
      dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await page.waitForFunction(() => new URLSearchParams(location.search).get('trianglesCount') === '22');
    await page.evaluate(() => {
      const input = document.getElementById('triangles-count-slider'); input.value = '20';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => new URLSearchParams(location.search).get('trianglesCount') === '20');
    await page.reload(); await ready();
    assert.equal(await page.inputValue('#triangles-count-slider'), '20', 'Consumed bfcache handoff must not restore an obsolete edit');

    assert.deepEqual(errors, []);
    console.log(`${engine}: 500-edit query and fragment bursts stayed bounded, final values restored, navigation cancelled stale writes and immediate reload retained the last edit; simulated bfcache handoff did not revive stale state`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
