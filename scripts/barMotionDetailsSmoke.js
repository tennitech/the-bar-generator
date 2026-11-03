// Focused owner corrections: motion defaults, Ruler units, natural edges and Binary cap.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8776';
const evidence = process.env.RPI_MOTION_EVIDENCE;
const styles = ['ruler', 'ticker', 'waveform', 'wave-quantum'];
async function ready(page) {
  await page.waitForFunction(() => window.barShareController && window.quantumControls && document.querySelector('#p5-container canvas'));
  await page.waitForFunction(() => !window.PageEntrance?.isActive?.());
}
async function select(page, style) { await page.selectOption('#style-select', style, { force: true }); }
async function toggle(page, locator, value) { if (await locator.isChecked() !== value) { await locator.focus(); await page.keyboard.press('Space'); } }
async function frames(page) { await page.evaluate(async () => { for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame); }); }
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const errors = [], results = [];
  try {
    for (const reduce of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/generator/solid/`); await ready(page);
      for (const style of styles) {
        if (!reduce && style === 'ruler') {
          const picker = page.locator('#style-select').locator('..');
          await picker.locator('.custom-select-trigger').click();
          await picker.locator('.custom-option[data-value="ruler"]').click();
        } else await select(page, style);
        const prefix = style === 'wave-quantum' ? 'quantum' : style;
        const loop = page.locator(`#${prefix}-motion-toggle`), reverse = page.locator(`#${prefix}-reverse-toggle`);
        assert.equal(await loop.isChecked(), !reduce, `${style} selects default loop`);
        await toggle(page, loop, false); await select(page, 'solid'); await select(page, style);
        assert.equal(await loop.isChecked(), !reduce, `${style} reselection resets loop`);
        // Explicit playback remains possible under the user's reduced-motion setting.
        await toggle(page, loop, true);
        for (const reversed of [false, true]) {
          await toggle(page, reverse, reversed);
          await page.evaluate(prefix => {
            if (prefix === 'quantum') {
              const phase = document.getElementById('quantum-phase'); phase.value = .5; phase.dispatchEvent(new Event('input', { bubbles: true }));
            } else { liveMotionPhase = .5; }
          }, prefix);
          await frames(page);
          const phase = await page.evaluate(prefix => prefix === 'quantum' ? quantumControls.values().quantumPhase : liveMotionPhase, prefix);
          assert.equal(Math.sign(phase - .5), (style === 'ticker' ? 1 : -1) * (reversed ? -1 : 1), `${style} direction ${reversed}`);
          await toggle(page, loop, false);
          const stopped = await page.evaluate(prefix => prefix === 'quantum' ? quantumControls.values().quantumPhase : liveMotionPhase, prefix);
          await frames(page);
          assert.equal(await page.evaluate(prefix => prefix === 'quantum' ? quantumControls.values().quantumPhase : liveMotionPhase, prefix), stopped);
          await toggle(page, loop, true);
        }
        await toggle(page, loop, false);
        results.push({ style, reduce, menuDefault: true, reverse: true, pause: true });
      }
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/generator/binary/?binaryText=abcdefghijklmnop`); await ready(page);
    assert.equal(await page.inputValue('#binary-input'), 'abcdefghij');
    assert.equal(await page.locator('#binary-audio-btn').count(), 0);
    assert.equal(await page.evaluate(() => getCurrentAudioPreviewType()), null);
    await page.locator('#binary-input').fill('');
    assert.equal(await page.inputValue('#binary-input'), '', 'empty edit remains editable');
    await page.locator('#binary-input').fill('🚀'.repeat(11));
    assert.equal(await page.inputValue('#binary-input'), '🚀'.repeat(10));
    assert.equal(await page.evaluate(() => binaryData.binary.length), 320);
    const legacyLink = await page.evaluate(() => {
      const state = barShareController.capture(); state.controls['binary-input'] = 'abcdefghijklmnop';
      const bytes = new TextEncoder().encode(JSON.stringify(state));
      return `${location.origin}/generator/binary/#bar=` + btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    });
    await page.goto(legacyLink); await ready(page);
    assert.equal(await page.inputValue('#binary-input'), 'abcdefghij');
    await page.locator('#binary-input').fill('123456damnation');
    assert.equal(await page.inputValue('#binary-input'), '123456damn'); // Whole-word filtering does not mask substrings in digits.
    await page.locator('#binary-input').fill('damn');
    assert.equal(await page.inputValue('#binary-input'), '****');
    results.push({ binaryQuery: true, binaryInput: true, unicode10: true, legacyShare: true, profanity: true, noAudio: true });
    for (const style of ['ruler', 'ticker', 'waveform', 'numeric']) {
      await page.goto(`${base}/generator/${style}/`); await ready(page);
      const checks = await page.evaluate(style => {
        const source = buildCurrentBarPatternSVGFragment({ barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 });
        const root = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${source}</svg>`, 'image/svg+xml');
        const paint = Array.from(root.querySelectorAll('path,rect')).filter(el => !el.closest('defs,clipPath'));
        const markers = paint.filter(el => el.tagName === 'rect' && ((Number(el.getAttribute('width')) === 250 && Number(el.getAttribute('height')) === 1) || (Number(el.getAttribute('height')) === 18 && Number(el.getAttribute('width')) <= 1)));
        return { noFit: !source.includes('data-bar-edge-fit'), markers: markers.length,
          natural: style === 'ruler' || style === 'ticker' ? (() => {
            const options = { ...getCurrentBarPatternValues(250), shader: currentShader, barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 };
            return JSON.stringify(createBoundedTickGeometry(options)) === JSON.stringify((style === 'ruler' ? createRulerPatternGeometry : createTickerPatternGeometry)(options));
          })() : true };
      }, style);
      assert.equal(checks.noFit, true); assert.equal(checks.natural, true);
      // Default ruler ticks can themselves be narrow; only Numeric and Waveform have no boundary geometry at all.
      if (style === 'numeric' || style === 'waveform') assert.equal(checks.markers, 0, `${style}: no artificial strips`);
      if (evidence) { await fs.mkdir(evidence, { recursive: true }); await page.screenshot({ path: `${evidence}/${engine}-${style}.png` }); }
      results.push({ style, ...checks });
    }
    assert.deepEqual(errors, []);
    if (evidence) await fs.writeFile(`${evidence}/${engine}-results.json`, JSON.stringify(results, null, 2));
    console.log(`${engine}: 8 motion selection/direction/pause cases, Binary input/query/legacy share, 4 natural-edge render paths passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
