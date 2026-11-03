/* Screenshot regression: fill the diagonal field toward the measured hero. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const evidence = process.env.RPI_SPACING_EVIDENCE || '/tmp/rpi-marquee-spacing';
async function settle(page, height) {
  await page.waitForFunction(height => Number.parseFloat(document.documentElement.style.getPropertyValue('--viewport-height')) === height, height);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function measure(page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.marquee_row')];
    const last = rows.at(-1), bounds = last.getBoundingClientRect();
    const angle = parseFloat(getComputedStyle(last).getPropertyValue('--marquee-tilt')) * Math.PI / 180;
    const hero = [...document.querySelectorAll('.hero_brand, .hero_title-line, .hero_credit')]
      .map(el => ({ selector: el.className, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width && rect.height)
      .map(({ selector, rect }) => ({ selector, top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom,
        gap: rect.top - bounds.top - (rect.right - bounds.left) * Math.tan(angle) - last.offsetHeight * Math.cos(angle) }));
    const brand = document.querySelector('.hero_brand').getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, rows: rows.length,
      step: parseFloat(rows[1].style.top) - parseFloat(rows[0].style.top), rowHeight: last.offsetHeight,
      brandGap: brand.top - bounds.top - (brand.left - bounds.left) * Math.tan(angle) - last.offsetHeight * Math.cos(angle),
      hero, assetWidth: document.querySelector('.bar_asset_wrap').offsetWidth,
      top: parseFloat(rows[0].style.top), lastTop: parseFloat(last.style.top),
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
}
function check(m) {
  assert.equal(m.overflow, false);
  assert.ok(m.step / m.rowHeight >= 0.95 && m.step / m.rowHeight <= 1.34, JSON.stringify(m));
  for (const rect of m.hero) assert.ok(rect.left >= 0 && rect.right <= m.width + 1 && rect.bottom <= m.height + 1, JSON.stringify(m));
  if (m.width >= 550) {
    const gap = Math.min(...m.hero.map(rect => rect.gap));
    assert.ok(Math.abs(gap - m.step * 0.6) <= 1, `clearance ${JSON.stringify(m)}`);
    assert.ok(m.brandGap < m.step * 2.05, `unused band ${JSON.stringify(m)}`);
  }
}
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [];
  await fs.mkdir(evidence, { recursive: true });
  try {
    const cases = [[1230,1470,1],[1230,1470,2],[1024,1224,1],[1200,1440,1],[1280,1024,2],
      [1280,1440,1],[768,1024,2],[900,1259,1],[900,1260,1],[900,1261,1],[900,1600,1],
      [550,700,1],[576,360,2.5],[720,450,2],[1024,768,2],[1440,900,1],[1920,1080,1],
      [2560,1440,2],[3840,2160,1],[5120,1440,1],[1440,2560,2],[7680,4320,1],[320,568,2],[375,812,2],[390,844,3]];
    for (const [width,height,dpr] of cases) {
      const context = await browser.newContext({ viewport:{width,height}, deviceScaleFactor:dpr, reducedMotion:'reduce' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base); await page.evaluate(() => document.fonts.ready); await settle(page, height);
      const m = await measure(page); check(m); assert.deepEqual(errors, []);
      if ([1230,768,576,1440].includes(width) && dpr === 1) await page.screenshot({ path:path.join(evidence,`${engine}-${width}x${height}.png`), scale:'css' });
      results.push(m);
      await page.setViewportSize({width:390,height:844}); await settle(page, 844);
      await page.setViewportSize({width,height}); await settle(page, height);
      const resized = await measure(page); check(resized); assert.equal(resized.rows, m.rows);
      assert.ok(Math.abs(resized.lastTop - m.lastTop) < 0.1, 'repeat resize restores lane boundary');
      await context.close();
    }
    const [one,two] = results;
    for (const key of ['rows','step','rowHeight','brandGap','assetWidth','top','lastTop']) assert.ok(Math.abs(one[key]-two[key])<0.6, `DPR cannot enlarge gap: ${key}`);
    // The former portrait gate produced a large jump at height = 1.4 × width.
    const threshold = results.filter(m => m.width === 900 && m.height < 1300);
    for (let i = 1; i < threshold.length; i++) assert.ok(Math.abs(threshold[i].brandGap - threshold[i-1].brandGap) < 1);
    const page = await browser.newPage({viewport:{width:1230,height:1470},reducedMotion:'no-preference'});
    await page.goto(base); await page.waitForFunction(() => !PageEntrance.isActive());
    await page.evaluate(() => document.fonts.ready); check(await measure(page));
    const before = await page.locator('.marquee_track').first().getAttribute('style');
    await page.waitForTimeout(350); assert.notEqual(await page.locator('.marquee_track').first().getAttribute('style'), before);
    await page.emulateMedia({reducedMotion:'reduce'}); const stopped = await page.locator('.marquee_track').first().getAttribute('style');
    await page.waitForTimeout(150); assert.equal(await page.locator('.marquee_track').first().getAttribute('style'), stopped);
    await page.close();
    await fs.writeFile(path.join(evidence, `${engine}-results.json`), JSON.stringify(results,null,2));
    console.log(`${engine}: ${cases.length} viewport/DPR/resize cases, continuous threshold, normal/reduced motion passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
