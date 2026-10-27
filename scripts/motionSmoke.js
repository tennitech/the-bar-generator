const assert = require('node:assert/strict');
const { chromium, firefox, webkit } = require('playwright');

const baseUrl = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const name = process.env.RPI_BROWSER || 'chromium';

async function main() {
  const browser = await ({ chromium, firefox, webkit }[name]).launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const style of ['ruler', 'ticker', 'waveform']) {
      await page.goto(`${baseUrl}/generator/${style}/?${style}Speed=5&rulerUnits=10&tickerRatio=5`);
      await page.locator('#header-logo-preview canvas').waitFor();
      const result = await page.evaluate(async style => {
        const canvas = document.querySelector('#header-logo-preview canvas');
        const original = window.draw;
        let draws = 0;
        let headerDraws = 0;
        const headerRender = renderHeaderMotionPreview;
        window.renderHeaderMotionPreview = function () { headerDraws++; return headerRender(); };
        window.draw = function () { draws++; return original(); };
        const phases = [];
        for (let frame = 0; frame < 45; frame++) {
          await new Promise(requestAnimationFrame);
          phases.push(liveMotionPhase);
        }
        window.draw = original;
        window.renderHeaderMotionPreview = headerRender;
        const sameCanvas = canvas === document.querySelector('#header-logo-preview canvas');
        const beforeSpeed = liveMotionPhase;
        const slider = document.getElementById(`${style}-speed-slider`);
        slider.value = '0.7';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        const afterSpeed = liveMotionPhase;
        const beforeReverse = getCurrentLoopAnimationState();
        const reverse = document.getElementById(`${style}-reverse-toggle`);
        reverse.checked = !reverse.checked;
        reverse.dispatchEvent(new Event('change', { bubbles: true }));
        const afterReverse = getCurrentLoopAnimationState();
        setMotionEnabledForStyle(style, false);
        const paused = liveMotionPhase;
        for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
        const afterPause = liveMotionPhase;
        setMotionEnabledForStyle(style, true);
        const afterResume = liveMotionPhase;
        return { draws, headerDraws, sameCanvas, phases, beforeSpeed, afterSpeed,
          beforeReverse, afterReverse, paused, afterPause, afterResume };
      }, style);
      assert.ok(result.draws >= 35, `${style}: renderer skipped browser frames (${result.draws}/45)`);
      assert.equal(result.headerDraws, result.draws, `${style}: header and preview cadence differ`);
      assert.equal(result.sameCanvas, true, `${style}: header canvas was replaced`);
      assert.ok(result.phases.some((phase, i) => i > 0 && phase !== result.phases[i - 1]), `${style}: phase did not move`);
      assert.equal(result.afterSpeed, result.beforeSpeed, `${style}: speed change jumped phase`);
      const position = state => state.repeatWidth
        ? ((state.loopOffsetX / state.repeatWidth) % 1 + 1) % 1
        : ((state.timeSeconds / state.periodSeconds) % 1 + 1) % 1;
      assert.ok(Math.abs(position(result.beforeReverse) - position(result.afterReverse)) < 1e-9,
        `${style}: reverse change jumped position`);
      assert.equal(result.paused, result.afterPause, `${style}: paused phase advanced`);
      assert.equal(result.paused, result.afterResume, `${style}: resume reset phase`);
      const direction = style === 'ticker' ? -1 : 1;
      const subdivisions = style === 'ruler' ? 10 : style === 'ticker' ? 5 : 1;
      for (let i = 1; i < result.phases.length; i++) {
        const step = ((result.phases[i] - result.phases[i - 1]) * direction + 1) % 1;
        assert.ok(step <= 0.25 / subdivisions + 1e-9, `${style}: unsafe phase step ${step}`);
      }
      console.log(`${name} ${style}: ${result.draws} draws / 45 browser frames; header synchronized, speed/reverse/pause continuous`);
      for (const theme of ['white', 'red', 'black']) {
        const colorMatches = await page.evaluate(async theme => {
          const select = document.getElementById('color-mode-select');
          select.value = theme;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise(requestAnimationFrame);
          return headerMotionColor === getComputedStyle(document.getElementById('header-logo-preview')).color;
        }, theme);
        assert.equal(colorMatches, true, `${style}: header theme color is stale`);
      }
      const hiddenPhaseKept = await page.evaluate(async () => {
        const phase = liveMotionPhase;
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
        for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
        const kept = liveMotionPhase === phase;
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
        return kept;
      });
      assert.equal(hiddenPhaseKept, true, `${style}: hidden preview advanced`);
      await page.locator('#header-logo-preview').click();
      await page.locator('.logo_animation_overlay.is-open').waitFor();
      const overlayPhaseKept = await page.evaluate(async () => {
        const phase = liveMotionPhase;
        for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
        return liveMotionPhase === phase;
      });
      assert.equal(overlayPhaseKept, true, `${style}: background moved during overlay`);
      await page.keyboard.press('Escape');
      await page.locator('.logo_animation_overlay').waitFor({ state: 'hidden' });
      await page.locator('#header-logo-preview canvas').waitFor();
      assert.deepEqual(errors, [], `${style}: browser errors`);
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
