const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await ({ chromium, webkit }[process.env.RPI_BROWSER || 'chromium']).launch();
  try {
    for (const route of ['/', '/generator/solid/']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.addInitScript(() => {
        window.__wakeSamples = [];
        const capture = () => {
          const original = document.querySelector('.is-ascii-original');
          if (!original || !original.style.clipPath) return;
          if (window.__wakeSamples.at(-1)?.clip === getComputedStyle(original).clipPath) return;
          const fields = [...document.querySelectorAll('.entrance_ascii-artwork,.entrance_ascii-text')].slice(-1);
          window.__wakeSamples.push({ clip: getComputedStyle(original).clipPath,
            text: document.querySelector('.hero_title')?.textContent,
            pixels: fields.map(canvas => {
              const sample = document.createElement('canvas'); sample.width = 64; sample.height = 32;
              const ctx = sample.getContext('2d'); ctx.drawImage(canvas, 0, 0, 64, 32);
              const bytes = ctx.getImageData(0, 0, 64, 32).data;
              let sum = 0; for (let i = 3; i < bytes.length; i += 4) sum += bytes[i]; return sum;
            }) });
        };
        const observer = new MutationObserver(() => {
          if (document.querySelector('.is-ascii-original')?.style.clipPath) {
            observer.disconnect();
            const sample = () => { capture(); if (window.__wakeSamples.length < 2) requestAnimationFrame(sample); };
            requestAnimationFrame(sample);
          }
        });
        observer.observe(document, { subtree: true, attributes: true, childList: true });
      });
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__wakeSamples.length === 2, null, { timeout: 5000 }).catch(async error => { console.log(route, await page.evaluate(() => ({ samples: window.__wakeSamples, preparation: window.AsciiEntrance?.lastPreparation, animation: window.AsciiEntrance?.lastAnimation, active: window.PageEntrance?.isActive(), mode: document.querySelector('[data-entrance-plane]')?.dataset }))); throw error; });
      const [before, after] = await page.evaluate(() => window.__wakeSamples);
      assert.notEqual(before.clip, after.clip, 'real artwork resolves automatically without pointer movement');
      assert.notDeepEqual(before.pixels, after.pixels, 'the wake is animated, not a frozen crossfade');
      assert.equal(before.text, after.text, 'semantic heading text remains unchanged');
      await page.waitForFunction(() => !PageEntrance.isActive());
      assert.equal(await page.locator('.entrance_ascii-artwork,.entrance_ascii-text,.is-ascii-original').count(), 0);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('canvas,img,.hero_title-line')].some(el => el.getAnimations().some(a => a.effect?.getKeyframes().some(k => k.clipPath)))), false);
      await page.close();
    }
    console.log('Automatic moving wake, complementary reveal, semantic text, and animation cleanup passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
