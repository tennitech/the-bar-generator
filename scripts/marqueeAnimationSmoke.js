/* Real-HTTP animation, canonical pixels, bounded work and pause/resume checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-animation-evidence';
const styles = ['ticker', 'waveform', 'wave-quantum'];
async function ready(page) {
  await page.waitForFunction(() => !window.PageEntrance?.isActive() && document.querySelector('.is-animated canvas'));
}
async function phases(page) { return page.evaluate(() => [...marqueeAnimation.settings.values()].map(state => state.phase)); }
async function frozen(page, action, undo) {
  await page.evaluate(action); const before = await phases(page); await page.waitForTimeout(180);
  assert.deepEqual(await phases(page), before, 'all three phases stay still');
  await page.evaluate(undo);
  await page.waitForFunction(before => [...marqueeAnimation.settings.values()].some((state, index) => state.phase !== before[index]), before, { timeout: 5000 });
}
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [];
  await fs.mkdir(evidence, { recursive: true });
  try {
    for (const [width, height, dpr] of [[1440, 900, 1], [390, 844, 2], [1230, 1470, 1], [3840, 2160, 1]]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
      const errors = [], heavy = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (/\/third_party\/p5\/|\/js\/(main|drawing)\.js/.test(request.url())) heavy.push(request.url()); });
      await page.addInitScript(() => Math.random = () => 0.37);
      await page.goto(base); await ready(page);
      const inventory = await page.evaluate(() => ({
        settings: [...marqueeAnimation.settings.values()].map(({ style, phase, query }) => ({ style, phase, query })),
        active: [...document.querySelectorAll('.is-animated canvas')].map(canvas => ({ style: canvas.dataset.motionPreview, width: canvas.width, height: canvas.height })),
        registry: [...document.querySelectorAll('[data-bar-style]')].filter(a => !a.closest('.is-measure')).length,
        sources: new Set([...document.images].map(i => i.src)).size,
        overflow: document.documentElement.scrollWidth > innerWidth
      }));
      assert.deepEqual(inventory.settings.map(item => item.style).sort(), styles.slice().sort());
      assert.equal(await page.locator('[data-bar-style="ruler"] canvas').count(), 0, 'Ruler remains static');
      assert.equal(inventory.sources, 21); assert.equal(inventory.overflow, false);
      assert.ok(inventory.active.length > 0 && inventory.active.length < 30);
      for (const canvas of inventory.active) {
        assert.ok(canvas.width >= 500 && canvas.width <= 2000);
        assert.equal(canvas.width / canvas.height, 250 / 18);
      }
      const initialPixels = await page.locator('.is-animated canvas').first().evaluate(canvas => canvas.toDataURL());
      const before = await phases(page); await page.waitForTimeout(250);
      assert.notEqual(await page.locator('.is-animated canvas').first().evaluate(canvas => canvas.toDataURL()), initialPixels, 'visible sample pixels animate');
      const after = await phases(page); after.forEach((phase, i) => assert.notEqual(phase, before[i]));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.getByRole('button', { name: 'Motion paused', exact: true }).waitFor();
      const held = await phases(page); await page.waitForTimeout(180); assert.deepEqual(await phases(page), held);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('.is-animated canvas')].every(canvas => {
        const state = [...marqueeAnimation.settings.values()].find(state => state.style === canvas.dataset.motionPreview);
        return canvas.toDataURL() === state.surface.toDataURL();
      })), true, 'every visible copy has the shared complete frame');
      await page.screenshot({ path: path.join(evidence, `${engine}-${width}.png`), scale: 'css' });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.getByRole('button', { name: 'Resume motion', exact: true }).click();
      const choices = inventory.settings.map(({style, query}) => ({style, query}));
      await page.setViewportSize({ width: 800, height: 700 }); await page.waitForTimeout(100);
      await page.setViewportSize({ width, height }); await page.waitForTimeout(100);
      assert.deepEqual(await page.evaluate(() => [...marqueeAnimation.settings.values()].map(({style,query})=>({style,query}))), choices);
      if (width === 1440) {
        await frozen(page, () => { document.body.classList.add('has-logo-animation'); }, () => document.body.classList.remove('has-logo-animation'));
        await frozen(page, () => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); }, () => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
        await frozen(page, () => window.dispatchEvent(new Event('pagehide')), () => window.dispatchEvent(new Event('pageshow')));
        const performance = await page.evaluate(() => new Promise(resolve => {
          const original = marqueeAnimation.tick; let frames = 0, work = 0, updates = 0, elapsed = 0, previous = performance.now();
          const observed = new Map();
          const callbacks = ['createTickerPatternGeometry', 'createWaveformPatternGeometry', 'createWaveQuantumPatternGeometry'];
          callbacks.forEach(name => { const fn = window[name]; observed.set(name, fn); window[name] = options => { updates++; return fn(options); }; });
          marqueeAnimation.tick = dt => { const start = performance.now(); original(dt); work += performance.now() - start; elapsed += dt; };
          const gaps = [];
          function sample(now) {
            gaps.push(now - previous); previous = now;
            if (++frames < 60) return requestAnimationFrame(sample);
            marqueeAnimation.tick = original; observed.forEach((fn, name) => { window[name] = fn; });
            resolve({ frames, work, updates, elapsed, median: gaps.sort((a,b)=>a-b)[30], max: Math.max(...gaps) });
          }
          requestAnimationFrame(sample);
        }));
        assert.ok(performance.updates > 0 && performance.updates <= (Math.ceil(performance.elapsed / (1000 / 30)) + 1) * 3, 'no more than three model builds per30fps interval');
        results.push({ performance });
        // Compare the live canvas painter to actual canonical SVG rasterization.
        const parity = await page.evaluate(async () => {
          const summaries = [];
          for (const state of marqueeAnimation.settings.values()) {
            const live = document.createElement('canvas'); live.width = 1000; live.height = 72;
            MarqueeAnimation.paintGeometry(live.getContext('2d'), MarqueeAnimation.createGeometry(state), 1000);
            const motion = state.style === 'wave-quantum' ? {quantumPhase:state.phase} : loopingGifUtils.getLoopingAnimationState(state.style,state.values,{phase:state.phase});
            const markup = createBarPatternSVG({ currentShader: {ticker:2,waveform:4,'wave-quantum':22}[state.style], barStartX:0,barY:0,exactBarWidth:250,barHeight:18,fgColor:'#fff',values:{...state.values,...motion} });
            const image = new Image(); image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 18" width="1000" height="72">${markup}</svg>`); await image.decode();
            const reference = document.createElement('canvas'); reference.width = 1000; reference.height = 72; reference.getContext('2d').drawImage(image,0,0);
            const a = live.getContext('2d').getImageData(0,0,1000,72).data, b = reference.getContext('2d').getImageData(0,0,1000,72).data;
            let error = 0, painted = 0;
            for(let i=3;i<a.length;i+=4) { error += Math.abs(a[i]-b[i]); if(a[i]) painted++; }
            summaries.push({style:state.style,meanAlphaError:error/72000,painted});
          }
          return summaries;
        });
        parity.forEach(item => { assert.ok(item.painted > 500); assert.ok(item.meanAlphaError < 2, JSON.stringify(item)); });
        results.push({ parity });
      }
      if (width === 1440) {
        await page.evaluate(() => document.querySelector('.is-animated canvas').dispatchEvent(new Event('contextlost')));
        assert.equal(await page.locator('.is-animated').count(), 0);
      } else if (width === 390) {
        await page.evaluate(() => { for (const name of ['createTickerPatternGeometry', 'createWaveformPatternGeometry', 'createWaveQuantumPatternGeometry']) window[name] = () => { throw new Error('Simulated unavailable model'); }; });
        await page.waitForFunction(() => !document.querySelector('.is-animated'));
        const heldRow = await page.locator('.marquee_track').first().getAttribute('style');
        await page.waitForFunction(held => document.querySelector('.marquee_track').getAttribute('style') !== held,
          heldRow, { timeout: 5000 }); // Progress, not a headless-browser frame-rate requirement.
      }
      assert.deepEqual(errors, []); assert.deepEqual(heavy, []);
      results.push({width,height,dpr,inventory}); await page.close();
    }
    // Real generator routes restore every motion/shape control from the links.
    const controls = await browser.newPage({ reducedMotion: 'reduce' });
    const selected = results.find(item => item.inventory)?.inventory.settings || [];
    for (const setting of selected) {
      await controls.goto(`${base}/generator/${setting.style}/?${setting.query}`);
      await controls.waitForFunction(() => document.querySelector('#p5-container canvas') && typeof getCurrentBarPatternValues === 'function');
      const restored = await controls.evaluate(query => {
        const output = {};
        for (const [key] of new URLSearchParams(query)) {
          const field = document.querySelector(`[data-url-parameter="${key}"]`)
            || document.getElementById({quantumPhase:'quantum-phase',quantumSpeed:'quantum-speed-slider',quantumReverse:'quantum-reverse-toggle'}[key]);
          output[key] = field ? String(field.type === 'checkbox' ? field.checked : field.value) : null;
        }
        return output;
      }, setting.query);
      for (const [key,value] of new URLSearchParams(setting.query)) assert.equal(restored[key], value, `${setting.style} restores ${key}`);
    }
    await controls.close();
    // Reduced motion does not even fetch or initialize the optional models.
    const reduced = await browser.newPage({reducedMotion:'reduce'}); const requests=[];
    reduced.on('request',r=>requests.push(r.url())); await reduced.goto(base); await reduced.waitForTimeout(250);
    assert.equal(await reduced.locator('canvas').count(),0);
    assert.equal(requests.some(url=>/\/utils\/(rulerScale|barPattern|quantumModel|loopingGif)\.js/.test(url)),false);
    await reduced.close();
    // A blocked optional model preserves the original stills and selection.
    const fallback = await browser.newPage(); await fallback.route('**/barPattern.js?*',route=>route.abort());
    await fallback.goto(base); await fallback.waitForFunction(()=>!window.PageEntrance?.isActive()); await fallback.waitForTimeout(100);
    assert.equal(await fallback.locator('.is-animated').count(),0);
    assert.ok(await fallback.locator('.bar_asset_wrap img').count()>100); await fallback.close();
    await fs.writeFile(path.join(evidence, `${engine}-results.json`),JSON.stringify(results,null,2));
    console.log(JSON.stringify({engine,passed:true,results},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
