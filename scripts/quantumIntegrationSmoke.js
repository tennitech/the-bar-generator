const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const name = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_INTEGRATION_EVIDENCE;
async function file(page, type) {
  const wait = page.waitForEvent('download');
  await page.evaluate(type => window[`save${type}`](), type);
  return fs.readFile(await (await wait).path());
}
async function ready(page) {
  await page.waitForFunction(() => window.barShareController && window.quantumControls);
  await page.locator('#p5-container canvas').waitFor();
}
(async () => {
  const browser = await ({ chromium, webkit }[name]).launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/wave-quantum/?quantumView=density&quantumPhase=0.137`); await ready(page);
    assert.equal(await page.locator('#quantum-view').count(), 0);
    assert.equal(await page.locator('#quantum-motion-toggle').isChecked(), false);
    assert.equal(await page.inputValue('#quantum-phase'), '0.137');
    assert.ok(!page.url().includes('quantumView'));
    const firstSVG = await file(page, 'SVG'), firstPNG = await file(page, 'PNG');
    assert.equal((firstSVG.toString().match(/<polygon /g) || []).length, 3);
    await page.evaluate(() => {
      window.__quantumSnapshots = 0;
      const original = getCanonicalBarImage;
      window.getCanonicalBarImage = (...args) => { window.__quantumSnapshots++; return original(...args); };
    });
    const headerRect = await page.locator('#header-logo-preview').boundingBox();
    const letterClip = { x: headerRect.x, y: headerRect.y, width: headerRect.width, height: headerRect.height * 0.73 };
    const letterPixels = await page.screenshot({ clip: letterClip, scale: 'css' });
    await page.locator('#quantum-motion-toggle').focus(); await page.keyboard.press('Space');
    await page.waitForFunction(() => quantumControls.values().quantumPhase > 0.1375);
    const persistentHeader = await page.evaluate(async () => {
      const root = document.getElementById('header-logo-preview');
      const stage = root.firstElementChild, letters = root.querySelector('svg'), canvas = root.querySelector('canvas');
      const markup = letters.outerHTML, hashes = [];
      let mutations = 0; const observer = new MutationObserver(events => mutations += events.length);
      observer.observe(root, { childList: true, subtree: true, attributes: true });
      for (let frame = 0; frame < 45; frame++) {
        await new Promise(requestAnimationFrame);
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let hash = 0; for (let i = 3; i < pixels.length; i += 4) hash = (hash * 31 + pixels[i]) >>> 0;
        hashes.push(hash);
      }
      observer.disconnect();
      const rootRect = root.getBoundingClientRect(), barRect = canvas.getBoundingClientRect();
      const g = RPI_LOGO_GEOMETRY, scale = Math.min(rootRect.width / g.width, rootRect.height / g.totalHeight);
      const expectedTop = rootRect.y + (rootRect.height - g.totalHeight * scale) / 2 + g.barY * scale;
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let leftInk = 0, rightInk = 0;
      for (let y = 0; y < canvas.height; y++) {
        leftInk += pixels[(y * canvas.width) * 4 + 3];
        rightInk += pixels[(y * canvas.width + canvas.width - 1) * 4 + 3];
      }
      return { mutations, viewBox: letters.getAttribute('viewBox'), headerBarPositionError: Math.abs(barRect.y - expectedTop),
        leftInk, rightInk, stable: root.firstElementChild === stage && root.querySelector('svg') === letters,
        lettersUnchanged: letters.outerHTML === markup, uniqueBarFrames: new Set(hashes).size };
    });
    assert.deepEqual([persistentHeader.mutations, persistentHeader.stable, persistentHeader.lettersUnchanged], [0, true, true]);
    assert.ok(persistentHeader.uniqueBarFrames > 1);
    assert.equal(persistentHeader.viewBox, '0 0 250 150.4885');
    assert.ok(persistentHeader.headerBarPositionError < 0.02);
    assert.ok(persistentHeader.leftInk > 8 && persistentHeader.rightInk > 8);
    assert.ok((await page.screenshot({ clip: letterClip, scale: 'css' })).equals(letterPixels), 'Quantum header letter pixels stay exact');
    await page.keyboard.press('Space');
    const forward = await page.evaluate(() => quantumControls.values().quantumPhase);
    assert.equal(await page.evaluate(() => window.__quantumSnapshots), 0, 'moving Quantum must bypass asynchronous snapshots');
    await page.locator('#quantum-reverse-toggle').focus(); await page.keyboard.press('Space');
    await page.locator('#quantum-motion-toggle').focus(); await page.keyboard.press('Space');
    await page.waitForFunction(forward => quantumControls.values().quantumPhase < forward - 0.0005, forward);
    await page.keyboard.press('Space');
    await page.evaluate(() => {
      const input = document.getElementById('quantum-phase'); input.value = '0.137';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.ok((await file(page, 'SVG')).equals(firstSVG), 'seek restores exact SVG bytes');
    assert.ok((await file(page, 'PNG')).equals(firstPNG), 'seek restores exact PNG bytes');
    const oldLink = await page.evaluate(() => {
      const state = barShareController.capture();
      state.controls['quantum-motion-toggle'] = true;
      state.controls['quantum-phase'] = '0.137'; state.controls['quantum-view'] = 'density';
      const bytes = new TextEncoder().encode(JSON.stringify(state));
      const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return `${location.origin}/generator/wave-quantum/#bar=${encoded}`;
    });
    await page.goto(oldLink); await ready(page);
    assert.equal(await page.isChecked('#quantum-motion-toggle'), false, 'old LOOP=true share restores paused');
    assert.equal(await page.inputValue('#quantum-phase'), '0.137');
    assert.ok((await file(page, 'SVG')).equals(firstSVG));
    assert.ok(!await page.evaluate(() => Object.hasOwn(barShareController.capture().controls, 'quantum-view')));
    await page.evaluate(base => {
      history.pushState({}, '', `${base}/generator/wave-quantum/?quantumPhase=0.371&quantumSpeed=0.2&quantumReverse=true`);
      dispatchEvent(new PopStateEvent('popstate'));
    }, base);
    assert.equal(await page.inputValue('#quantum-phase'), '0.371');
    assert.equal(await page.inputValue('#quantum-speed-slider'), '0.2');
    assert.equal(await page.isChecked('#quantum-reverse-toggle'), true);
    assert.equal(await page.isChecked('#quantum-motion-toggle'), false);
    await page.locator('#quantum-motion-toggle').focus(); await page.keyboard.press('Space');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.getElementById('quantum-motion-toggle').checked);
    const mobile = [];
    for (const width of [320, 390]) {
      const phone = await browser.newPage({ viewport: { width, height: 664 }, isMobile: true,
        hasTouch: true, reducedMotion: 'reduce' });
      phone.on('pageerror', error => errors.push(error.message));
      await phone.goto(`${base}/generator/wave-quantum/`); await ready(phone);
      await phone.locator('#mobile-menu-toggle').tap();
      await phone.locator('#quantum-phase-display').scrollIntoViewIfNeeded();
      await phone.locator('#quantum-phase-display').tap();
      await phone.locator('.slider_value-input').fill('37.1');
      await phone.locator('.slider_value-input').press('Enter');
      assert.equal(await phone.inputValue('#quantum-phase'), '0.371');
      const metrics = await phone.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        targets: ['quantum-motion-toggle', 'quantum-reverse-toggle', 'quantum-speed-slider', 'quantum-phase']
          .map(id => { const input = document.getElementById(id);
            const rect = (input.type === 'checkbox' ? input.parentElement : input).getBoundingClientRect();
            return { id, width: rect.width, height: rect.height }; })
      }));
      assert.equal(metrics.overflow, false);
      for (const target of metrics.targets) assert.ok(target.width >= 44 && target.height >= 44);
      mobile.push({ width, ...metrics });
      if (evidence) await phone.screenshot({ path: `${evidence}/${name}-quantum-mobile-${width}.png` });
      await phone.close();
    }
    assert.deepEqual(errors, []);
    if (evidence) {
      await page.screenshot({ path: `${evidence}/${name}-quantum-integrated.png` });
      await fs.writeFile(`${evidence}/${name}-quantum-integration.json`, JSON.stringify({ forward, nativeSnapshotBypass: true, persistentHeader,
        repeatedSVGAndPNG: true, oldDensityMigration: true, pausedShare: true, queryHistory: true, reducedMotion: true, mobile, errors }, null, 2));
    }
    console.log(`${name}: native Quantum motion, reverse, deterministic SVG/PNG seek, legacy paused share, query history and reduced motion passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
