/* Homepage-only real-HTTP checks: bounded static variety, hover, prompt, history. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { entries, samples } = require('../js/utils/marqueeCatalog');
const base = (process.env.RPI_SITE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_MARQUEE_EVIDENCE || '/tmp/marquee-refinement-evidence';

async function ready(page) {
  await page.waitForFunction(() => document.images.length > 100 && [...document.images].every(image => image.complete && image.naturalWidth > 0));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !window.PageEntrance?.isActive());
}
async function inventory(page) {
  return page.evaluate(() => ({
    samples: [...new Map([...document.querySelectorAll('[data-bar-style]')].map(link => [link.dataset.barStyle,
      { value: link.dataset.barStyle, variant: link.dataset.barVariant, href: link.getAttribute('href'), path: link.querySelector('img').dataset.assetPath }])).values()],
    order: [...document.querySelectorAll('.marquee_row')].slice(0, 3).map(row => [...row.querySelectorAll('.marquee_item:not(.is-measure) img')].slice(0, 7).map(image => image.dataset.assetPath)),
    offsets: [...document.querySelectorAll('.marquee_row')].map(row => row.querySelector('.marquee_track').style.transform),
    sources: [...new Set([...document.images].map(image => image.src))],
    completeLaneBounds: [...document.querySelectorAll('.marquee_track')].every(track =>
      [...track.querySelectorAll('.marquee_item:not(.is-measure)')].every(item => item.offsetLeft + item.offsetWidth <= track.offsetWidth + 2)),
    count: document.images.length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    heavy: [...document.scripts].some(script => /\/p5|\/main\.js|\/drawing\.js/.test(script.src)),
    canvases: document.querySelectorAll('canvas').length
  }));
}
async function visibleLink(page) {
  const point = await page.evaluate(() => {
    document.querySelector('#marquee-motion-test')?.removeAttribute('id');
    for (let y = 100; y < Math.min(innerHeight - 150, 500); y += 20) {
      for (let x = 100; x < innerWidth - 100; x += 30) {
        const link = document.elementFromPoint(x, y)?.closest('.bar_asset_wrap');
        if (!link || link.parentElement.classList.contains('is-measure')) continue;
        // Test a genuine interior point rather than a rotated bounding-box edge.
        if ([-15, 15].every(dx => [-6, 6].every(dy => document.elementFromPoint(x + dx, y + dy)?.closest('.bar_asset_wrap') === link))) {
          link.id = 'marquee-motion-test';
          return { x, y };
        }
      }
    }
  });
  assert.ok(point, 'a visible bar interior is reachable');
  return point;
}
async function movement(page, duration = 400) {
  return page.locator('#marquee-motion-test').evaluate((link, duration) => new Promise(resolve => {
    const x = () => new DOMMatrixReadOnly(link.closest('.marquee_track').style.transform).m41;
    requestAnimationFrame(started => {
      const before = x();
      let previous = started, steps = 0, simulatedSeconds = 0;
      function sample(now) {
        // The app caps delayed frames at 40ms. Normalize using the same elapsed
        // presentation time so a busy headless engine is not a speed comparison.
        simulatedSeconds += Math.min(0.04, (now - previous) / 1000);
        previous = now; steps++;
        if (now - started >= duration && steps >= 12) {
          resolve({ distance: Math.abs(x() - before), ms: now - started, simulatedSeconds, steps });
        } else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
  }), duration);
}

(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [];
  await fs.mkdir(evidence, { recursive: true });
  try {
    let previous;
    for (const [width, height] of (process.argv.includes('--motion-only') ? [] : [[1440, 900], [390, 844], [320, 568], [3840, 2160]])) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [], requests = new Set(), heavyRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.url().includes('/marquee-bars/')) requests.add(request.url());
        if (/\/third_party\/p5\/|\/js\/(main|drawing)\.js/.test(request.url())) heavyRequests.push(request.url());
      });
      await page.goto(base); await ready(page);
      const current = await inventory(page);
      assert.deepEqual(current.samples.map(sample => sample.value).sort(), entries.map(entry => entry.value).sort());
      assert.equal(current.sources.length, 21); assert.equal(requests.size, 21);
      assert.equal(current.heavy, false); assert.equal(current.canvases, 0);
      assert.deepEqual(heavyRequests, [], 'home does not request the generator renderer');
      assert.equal(current.overflow, false); assert.ok(current.count < 300);
      assert.equal(current.completeLaneBounds, true, 'moving lane contains every repeated bar');
      for (const item of current.samples) {
        const sample = samples.find(sample => sample.path === item.path);
        assert.ok(sample, 'sample is pre-rendered from the catalog');
        assert.equal(new URL(item.href, base + '/').search.slice(1), sample.query);
        assert.match(new URL(item.href, base + '/').pathname, new RegExp(`/generator/${sample.value}/$`));
      }
      if (previous) {
        assert.notDeepEqual(current.order, previous.order, 'new page randomizes family order');
        assert.notDeepEqual(current.samples.map(item => [item.value, item.variant]).sort(), previous.samples.map(item => [item.value, item.variant]).sort(), 'new page selects different configurations');
        assert.notDeepEqual(current.offsets, previous.offsets, 'initial lane positions vary');
      }
      previous = current;
      await page.evaluate(() => document.querySelector('.startup_prompt').classList.add('is-visible'));
      const prompt = await page.evaluate(() => {
        const inner = document.querySelector('.startup_prompt_inner').getBoundingClientRect();
        const range = document.createRange(); range.selectNodeContents(document.querySelector('.startup_prompt_text'));
        const text = range.getBoundingClientRect();
        return { left: text.left - inner.left, right: inner.right - text.right,
          top: text.top - inner.top, bottom: inner.bottom - text.bottom,
          bounds: inner.toJSON(), viewport: innerWidth };
      });
      assert.ok(prompt.left >= 20 && prompt.right >= 20, `prompt side padding at ${width}`);
      assert.ok(prompt.top >= 9 && prompt.bottom >= 9, `prompt vertical padding at ${width}`);
      assert.ok(prompt.bounds.left >= 8 && prompt.bounds.right <= width - 8);
      await page.screenshot({ path: path.join(evidence, `${engine}-${width}-prompt.png`), scale: 'css' });
      await page.setViewportSize({ width: 800, height: 700 }); await page.waitForTimeout(150);
      await page.setViewportSize({ width, height }); await page.waitForTimeout(150);
      const resized = await inventory(page);
      assert.deepEqual(resized.order, current.order, 'resizing does not reroll choices');
      assert.equal(requests.size, 21, 'resize does not download more variants');
      assert.deepEqual(errors, []);
      results.push({ width, height, sampleCount: current.sources.length, imageCount: current.count, prompt });
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base); await ready(page);
    await page.waitForTimeout(100);
    const writes = await page.evaluate(() => new Promise(resolve => {
      let items = 0, tracks = 0, frames = 0;
      const observer = new MutationObserver(records => records.forEach(record => {
        if (record.target.classList.contains('marquee_item')) items++;
        if (record.target.classList.contains('marquee_track')) tracks++;
      }));
      observer.observe(document.querySelector('[data-marquee-stage]'), { subtree: true, attributes: true, attributeFilter: ['style'] });
      function sample() {
        if (++frames < 20) return requestAnimationFrame(sample);
        observer.disconnect();
        resolve({ items, tracks, frames, rows: document.querySelectorAll('.marquee_row').length });
      }
      requestAnimationFrame(sample);
    }));
    assert.equal(writes.items, 0, 'animation must not rewrite individual repeated bars');
    assert.ok(writes.tracks > 0 && writes.tracks <= writes.frames * writes.rows, 'at most one transform per lane per frame');
    results.push({ laneWrites: writes });
    let point = await visibleLink(page);
    const normal = await movement(page);
    await page.mouse.move(point.x, point.y);
    await page.waitForFunction(() => document.querySelector('#marquee-motion-test').classList.contains('is-hovered'));
    await page.waitForTimeout(250);
    const slowed = await movement(page, 600);
    const ratio = (slowed.distance / slowed.simulatedSeconds) / (normal.distance / normal.simulatedSeconds);
    assert.ok(slowed.distance > 0.15, `hover continues moving: ${JSON.stringify({normal, slowed, ratio})}`);
    assert.ok(ratio > 0.025 && ratio < 0.2, `hover brakes to a strong crawl: ${ratio}`);
    await page.screenshot({ path: path.join(evidence, `${engine}-hover.png`) });
    await page.evaluate(() => { window.__pointerLog = []; for (const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture','dragstart','dragend','mouseup']) document.addEventListener(type, event => window.__pointerLog.push({ type, target: event.target.className, pointerId: event.pointerId }), true); });
    await page.locator('#marquee-motion-test').evaluate(link => {
      window.__marqueeSuppressClick = event => event.preventDefault();
      link.addEventListener('click', window.__marqueeSuppressClick, { once: true });
    });
    await page.mouse.down();
    const pressed = await movement(page, 250);
    assert.equal(pressed.distance, 0, 'press locks target for click/touch');
    // Keep this hold test on the homepage; test unmodified native click below.
    await page.mouse.move(20, 880); await page.mouse.up();
    await page.locator('#marquee-motion-test').evaluate(link => link.removeEventListener('click', window.__marqueeSuppressClick));
    await page.waitForTimeout(700);
    const resumed = await movement(page);
    assert.ok(resumed.distance / resumed.simulatedSeconds > normal.distance / normal.simulatedSeconds * 0.7, `leaving resumes normal motion: ${JSON.stringify({normal, resumed, events: await page.evaluate(() => window.__pointerLog), state: await page.locator('#marquee-motion-test').evaluate(link => ({class:link.className,hover:link.matches(':hover'),atPointer:document.elementFromPoint(20,880)?.className}))})}`);
    for (let i = 0; i < 2; i++) {
      point = await visibleLink(page); await page.mouse.move(point.x, point.y);
      await page.waitForTimeout(250);
      assert.ok((await movement(page, 200)).distance > 0, 'repeated hover does not freeze');
      await page.mouse.move(20, 880); await page.waitForTimeout(400);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal((await movement(page, 250)).distance, 0, 'reduced motion remains still');
    point = await visibleLink(page); await page.mouse.move(point.x, point.y);
    assert.equal((await movement(page, 250)).distance, 0, 'hover does not override reduced motion');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.move(20, 880); await page.waitForTimeout(400);
    assert.ok((await movement(page)).distance > 1, 'motion preference recovery resumes');
    results.push({ normal, slowed, hoverRatio: ratio, pressed, resumed, repeatedHover: true, reducedMotion: true });

    // Native clicks restore a shown variant. Keyboard users retain the stable skip link.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    point = await visibleLink(page);
    const target = await page.locator('#marquee-motion-test').evaluate(link => ({ href: link.href, style: link.dataset.barStyle }));
    await page.mouse.click(point.x, point.y);
    await page.waitForURL(target.href); await page.locator('#p5-container canvas').waitFor();
    assert.equal(await page.locator('#style-select').inputValue(), target.style);
    await page.goBack(); await ready(page);
    await page.locator('.marquee_skip-link').focus(); await page.keyboard.press('Enter');
    await page.waitForURL('**/generator/solid/'); await page.locator('#p5-container canvas').waitFor();
    await page.goBack(); await ready(page); await page.goForward(); await page.locator('#p5-container canvas').waitFor();
    assert.deepEqual(errors, []);
    results.push({ nativeVariantNavigation: target, keyboardAndHistory: true });
    await context.close();
    await fs.writeFile(path.join(evidence, `${engine}-results.json`), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ engine, passed: true, checks: results.length, evidence }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
