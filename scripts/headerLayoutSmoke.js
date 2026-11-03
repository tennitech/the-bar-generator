/* Header order, title, sidebar alignment and compact interaction checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {
  chromium,
  webkit
} = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_HEADER_EVIDENCE || '/tmp/rpi-header-evidence';
async function measure(page) {
  return page.evaluate(() => {
    const box = e => {
      const r = e.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height
      };
    };
    const title = document.getElementById('brand-title'),
      button = document.getElementById('save-button');
    const content = document.querySelector('.sidebar-content'),
      c = getComputedStyle(content),
      cr = content.getBoundingClientRect();
    const counter = document.querySelector('.lunar_counter');
    return {
      title: box(title),
      text: title.querySelector('.brand_title-text').textContent.replace(/\s+/g, ' ').trim(),
      font: getComputedStyle(title).font,
      weight: getComputedStyle(title).fontWeight,
      opacity: getComputedStyle(title).opacity,
      overflow: title.scrollWidth > title.clientWidth + 1,
      ellipsis: getComputedStyle(title).textOverflow,
      brand: box(document.querySelector('.header-brand')),
      actions: box(document.querySelector('.header-actions')),
      counter: getComputedStyle(counter).display === 'none' ? null : box(counter),
      button: box(button),
      toggle: box(document.getElementById('mobile-menu-toggle')),
      actionOrder: [...document.querySelector('.header-actions').children].map(el => el.id || el.className),
      control: {
        x: cr.x + parseFloat(c.paddingLeft),
        right: cr.right - parseFloat(c.paddingRight)
      },
      icon: button.classList.contains('is-icon-only'),
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      viewport: {
        width: innerWidth,
        height: innerHeight
      },
      header: box(document.querySelector('.app-header'))
    };
  });
}
function check(m, compact) {
  assert.equal(m.text, 'The Bar Generator');
  assert.equal(m.weight, '700');
  assert.equal(m.opacity, '1');
  assert.equal(m.ellipsis, 'clip');
  assert.equal(m.overflow, false);
  assert.equal(m.pageOverflow, false);
  assert.deepEqual(m.actionOrder, ['header_icon-button', 'save-section', 'mobile-menu-toggle']);
  assert.ok(m.button.right <= m.toggle.x - 7, JSON.stringify(m));
  assert.ok(Math.abs(m.toggle.right - m.actions.right) < 0.6, JSON.stringify(m));
  assert.ok(m.title.x >= 0 && m.title.right <= m.viewport.width && m.title.y >= 0 && m.title.bottom <= m.header.bottom);
  assert.ok(m.brand.right <= m.actions.x - 8, JSON.stringify(m));
  if (m.counter) {
    assert.ok(m.brand.right <= m.counter.x - 8, JSON.stringify(m));
    assert.ok(m.counter.right <= m.actions.x - 8, JSON.stringify(m));
  }
  if (!compact) {
    assert.equal(m.icon, false, JSON.stringify(m));
    assert.ok(Math.abs(m.actions.x - m.control.x) < 0.6, JSON.stringify(m));
    assert.ok(Math.abs(m.toggle.right - m.control.right) < 0.6, JSON.stringify(m));
  }
}
(async () => {
  const b = await {
    chromium,
    webkit
  }[engine].launch({
    headless: true
  });
  const results = [];
  await fs.mkdir(evidence, {
    recursive: true
  });
  try {
    const cases = [...[[320, 568], [390, 844], [480, 700], [640, 700], [641, 700], [768, 800], [900, 800], [901, 800], [1024, 768], [1100, 800], [1101, 800], [1280, 900], [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160]].map(([width, height]) => ({
      width,
      height,
      touch: false,
      dpr: 1
    })), ...[[320, 568], [390, 844], [844, 390], [1024, 768]].map(([width, height]) => ({
      width,
      height,
      touch: true,
      dpr: 2
    })), {
      width: 1440,
      height: 900,
      touch: false,
      dpr: 2
    }];
    for (const c of (process.env.RPI_HEADER_FOCUS === 'order' ? [] : cases)) {
      const context = await b.newContext({
        viewport: {
          width: c.width,
          height: c.height
        },
        hasTouch: c.touch,
        isMobile: c.touch,
        deviceScaleFactor: c.dpr,
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const theme of ['black', 'lunar']) {
        await page.goto(`${base}/generator/${theme === 'lunar' ? 'lunar' : 'solid'}/?colorMode=${theme}`);
        await page.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
        await page.evaluate(() => {
          noLoop();
          return document.fonts.ready;
        });
        await page.waitForTimeout(60);
        const compact = c.width <= 900 || c.touch && c.width <= 1100;
        const m = await measure(page);
        check(m, compact);
        await page.locator('#save-button').click();
        await page.locator('#save-menu').evaluate(async el => {
          await Promise.allSettled(el.getAnimations().map(a => a.finished));
        });
        const menu = await page.locator('#save-menu').boundingBox();
        assert.ok(menu.x >= 0 && menu.x + menu.width <= c.width + 1 && menu.y + menu.height <= c.height + 1);
        if (!compact) {
          assert.ok(Math.abs(menu.x - m.control.x) < .6);
          assert.ok(Math.abs(menu.x + menu.width - m.control.right) < .6);
        }
        if ([320, 901, 1101, 1440].includes(c.width)) await page.screenshot({
          path: path.join(evidence, `${engine}-${c.width}-${theme}-${c.touch ? 'touch' : 'pointer'}.png`),
          scale: 'css'
        });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#save-button').getAttribute('aria-expanded'), 'false');
        await page.locator('#mobile-menu-toggle').click();
        await page.locator('#mobile-menu-toggle').click();
        await page.waitForTimeout(60);
        check(await measure(page), compact);
        await page.evaluate(() => {
          BarShareState.prepareNameContext(document, 'A deliberately long saved document title that must not crowd the product name');
          GeneratorInitialState.syncHeaderLayout();
        });
        check(await measure(page), compact);
        assert.deepEqual(errors, []);
        results.push({
          ...c,
          theme,
          legacyNameChecked: true,
          ...m
        });
      }
      await context.close();
    }
    for (const [width, theme, touch] of (process.env.RPI_HEADER_FOCUS === 'order' ? [] : [[1440, 'black', false], [390, 'black', true], [1024, 'lunar', true]])) {
      const context = await b.newContext({
        viewport: {
          width,
          height: 800
        },
        hasTouch: touch,
        isMobile: touch,
        reducedMotion: 'reduce'
      });
      await context.route('**/js/main.js*', async route => {
        await new Promise(r => setTimeout(r, 600));
        await route.continue();
      });
      const p = await context.newPage();
      const nav = p.goto(`${base}/generator/${theme === 'lunar' ? 'lunar' : 'solid'}/?colorMode=${theme}`);
      await p.locator('#brand-title').waitFor();
      await p.evaluate(() => document.fonts.ready);
      const early = await measure(p);
      await nav;
      await p.locator('#p5-container canvas').waitFor();
      await p.waitForTimeout(60);
      const ready = await measure(p);
      for (const key of ['title', 'button', 'toggle', 'brand', 'actions']) for (const axis of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(ready[key][axis] - early[key][axis]) < 0.6, `first-paint ${width} ${theme} ${key}.${axis}: ${early[key][axis]} → ${ready[key][axis]}`);
      results.push({
        delayedStartup: true,
        width,
        theme
      });
      await context.close();
    }
    // Larger touch targets and embedded Save labels must keep the same order.
    for (const c of [{ width: 1440, touch: true, embedded: false },
      { width: 390, touch: false, embedded: true }, { width: 320, touch: true, embedded: true }]) {
      const context = await b.newContext({ viewport: { width: c.embedded ? 1280 : c.width, height: 800 },
        hasTouch: c.touch, isMobile: c.touch, deviceScaleFactor: 2, reducedMotion: 'reduce' });
      const page = await context.newPage();
      let target = page;
      if (c.embedded) {
        await page.setContent(`<iframe style="width:${c.width}px;height:700px;border:0" sandbox="allow-scripts allow-same-origin" src="${base}/generator/solid/"></iframe>`);
        target = await (await page.locator('iframe').elementHandle()).contentFrame();
      } else await page.goto(`${base}/generator/lunar/?colorMode=lunar`);
      await target.locator('#p5-container canvas[data-preview-ready="true"]').waitFor();
      await target.evaluate(() => { noLoop(); return document.fonts.ready; });
      const compact = c.width <= 900 || (c.touch && c.width <= 1100);
      const m = await measure(target);
      check(m, compact);
      if (c.embedded) assert.equal(await target.locator('#save-button-label').innerText(), 'Save asset');
      await target.locator('#save-button').focus();
      await page.keyboard.press('Tab');
      assert.equal(await target.evaluate(() => document.activeElement.id), 'mobile-menu-toggle');
      const before = await target.locator('#mobile-menu-toggle').getAttribute('aria-expanded');
      await page.keyboard.press('Enter');
      assert.notEqual(await target.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), before);
      await target.locator('#save-button').click();
      await target.locator('#save-menu').evaluate(async el => { await Promise.allSettled(el.getAnimations().map(a => a.finished)); });
      const menu = await target.locator('#save-menu').evaluate(el => {
        const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, bottom: r.bottom };
      });
      assert.ok(menu.x >= 0 && menu.right <= c.width + 1);
      assert.ok(menu.bottom <= (c.embedded ? 700 : 800) + 1);
      await target.locator('#mobile-menu-toggle').click();
      assert.equal(await target.locator('#save-button').getAttribute('aria-expanded'), 'false');
      check(await measure(target), compact);
      results.push({ orderInteraction: true, ...c, ...m });
      await context.close();
    }
    const suffix = process.env.RPI_HEADER_FOCUS === 'order' ? '-order' : '';
    await fs.writeFile(path.join(evidence, `${engine}${suffix}-results.json`), JSON.stringify(results, null, 2));
    console.log(`${engine}: ${results.length} header/alignment/first-paint cases passed. ${evidence}`);
  } finally {
    await b.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
