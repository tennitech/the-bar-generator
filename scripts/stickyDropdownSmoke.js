const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit, devices } = require('playwright');
const engine = process.env.RPI_BROWSER || 'chromium';
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8027';
const evidence = process.env.RPI_EVIDENCE_DIR || '/tmp/rpi-sticky-themes';
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  const browser = await ({ chromium, webkit }[engine]).launch();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 360 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/generator/solid/`);
    await page.waitForFunction(() => window.barShareController);
    const trigger = page.locator('#color-mode-select + button');
    const menu = page.locator('#color-mode-select-options');
    const scroll = menu.locator('.custom-select-options-scroll');
    const geometry = () => menu.evaluate(menu => {
      const viewport = menu.querySelector('.custom-select-options-scroll');
      const top = viewport.getBoundingClientRect().top;
      return { top, height: viewport.clientHeight, max: viewport.scrollHeight - viewport.clientHeight,
        labels: [...viewport.querySelectorAll('.custom-option-group-label')].map(label => {
          const box = label.getBoundingClientRect(); const style = getComputedStyle(label);
          return { top: box.top, bottom: box.bottom, height: box.height, opacity: style.opacity, background: style.backgroundColor };
        }) };
    });
    for (const theme of ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar']) {
      if (theme === 'lunar') {
        await page.setViewportSize({ width: 1024, height: 600 });
        await page.selectOption('#style-select', 'lunar', { force: true });
      }
      // Legacy/query state can restore secondary themes, whose new selection is disabled.
      await page.locator('#color-mode-select').evaluate((select, theme) => {
        select.value = theme; select.dispatchEvent(new Event('change', { bubbles: true }));
      }, theme);
      await trigger.click();
      await page.waitForTimeout(180);
      // Constrain the actual scroll viewport to exercise the complete takeover
      // even when menu placement finds more room above the trigger.
      await scroll.evaluate(viewport => { viewport.style.maxHeight = '140px'; });
      await scroll.evaluate(viewport => { viewport.scrollTop = 0; });
      const initial = await geometry();
      assert.ok(initial.max > initial.labels[0].height, JSON.stringify(initial));
      for (let position = 0; position <= initial.max; position += 8) {
        await scroll.evaluate((viewport, position) => { viewport.scrollTop = position; }, position);
        const state = await geometry();
        const [primary, secondary] = state.labels;
        assert.ok(primary.bottom <= secondary.top + 1, 'section headings must never overlap');
        if (secondary.top >= state.top + primary.height) assert.ok(Math.abs(primary.top - state.top) <= 1, JSON.stringify(state));
        else if (secondary.top > state.top) assert.ok(Math.abs(primary.bottom - secondary.top) <= 1, 'next heading must push the previous heading');
        else assert.ok(Math.abs(secondary.top - state.top) <= 1, 'Secondary must remain sticky');
        assert.ok(state.labels.every(label => label.opacity === '1' && !/rgba\(.*0\)$/.test(label.background)));
        if (['black', 'white'].includes(theme) && [0, 112].includes(position)) {
          await page.screenshot({ path: `${evidence}/${engine}-${theme}-${position === 0 ? 'primary' : 'takeover'}.png` });
        }
      }
      await page.screenshot({ path: `${evidence}/${engine}-${theme}-scrolled.png` });
      // Reverse scrolling must restore Primary, including after repeated opens.
      await scroll.evaluate(viewport => { viewport.scrollTop = 20; });
      assert.ok(Math.abs((await geometry()).labels[0].top - (await geometry()).top) <= 1);
      await page.keyboard.press('Escape');
      await trigger.click(); await page.keyboard.press('Home');
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('ArrowDown');
        const active = await trigger.getAttribute('aria-activedescendant');
        const bounds = await page.locator(`#${active}`).boundingBox();
        const state = await geometry();
        assert.ok(bounds.y >= state.top + state.labels[0].height - 1, `focused row hidden under heading: ${active}`);
        assert.ok(bounds.y + bounds.height <= state.top + state.height + 1);
      }
      await page.keyboard.press('Enter');
      assert.equal(await page.inputValue('#color-mode-select'), theme, 'Coming soon cannot be selected');
      await page.keyboard.press('Escape');
    }
    // Every grouped selector uses the shared section behavior. Style samples
    // remain decorated after options gain section wrappers.
    await page.selectOption('#style-select', 'solid', { force: true });
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 500 }]) {
      await page.setViewportSize(viewport);
      const styleTrigger = page.locator('#style-select + button');
      await styleTrigger.click(); await page.keyboard.press('Home');
      const styleMenu = page.locator('#style-select-options');
      assert.deepEqual(await styleMenu.locator('.custom-option-group-label').allTextContents(),
        ['Dynamic', 'Static', 'Organizations', 'Special', 'Under Construction']);
      assert.equal(await styleMenu.locator('.select_style-preview').count(), 21);
      const styleScroll = styleMenu.locator('.custom-select-options-scroll');
      const max = await styleScroll.evaluate(viewport => viewport.scrollHeight - viewport.clientHeight);
      for (const position of [...Array.from({ length: Math.ceil(max / 24) }, (_, i) => i * 24), max, 0]) {
        await styleScroll.evaluate((viewport, position) => { viewport.scrollTop = position; }, position);
        const state = await styleMenu.evaluate(menu => {
          const viewport = menu.querySelector('.custom-select-options-scroll');
          const top = viewport.getBoundingClientRect().top;
          return [...viewport.querySelectorAll('.select_option-group')].map(group => {
            const heading = group.firstElementChild.getBoundingClientRect();
            const bounds = group.getBoundingClientRect();
            return { top, headingTop: heading.top, headingBottom: heading.bottom, groupTop: bounds.top, groupBottom: bounds.bottom };
          });
        });
        for (const group of state) {
          if (group.groupTop <= group.top && group.groupBottom >= group.top) {
            assert.ok(Math.abs(group.headingTop - Math.min(group.top, group.groupBottom - 28)) <= 1, JSON.stringify(group));
          }
        }
      }
      await page.keyboard.press('Home');
      for (let i = 0; i < 23; i++) {
        await page.keyboard.press('ArrowDown');
        const active = await styleTrigger.getAttribute('aria-activedescendant');
        const row = await page.locator(`#${active}`).boundingBox();
        const box = await styleScroll.boundingBox();
        assert.ok(row.y >= box.y + 27 && row.y + row.height <= box.y + box.height + 1, active);
      }
      assert.equal(await styleMenu.locator('.is-active').getAttribute('data-value'), 'truss');
      await page.screenshot({ path: `${evidence}/${engine}-styles-${viewport.height}.png` });
      await page.keyboard.press('Enter');
      assert.equal(await page.inputValue('#style-select'), 'solid');
      await page.keyboard.press('Escape');
    }
    // Narrow desktop pointer remains usable; actual touch retains native select.
    await page.selectOption('#style-select', 'solid', { force: true });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.locator('#mobile-menu-toggle').click();
    await trigger.click(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.equal(await page.inputValue('#color-mode-select'), 'white');
    await page.screenshot({ path: `${evidence}/${engine}-narrow.png` });
    const mobile = await browser.newPage({ ...devices['iPhone 13'], viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    await mobile.goto(`${base}/generator/solid/`); await mobile.waitForFunction(() => window.barShareController);
    await mobile.locator('#mobile-menu-toggle').tap();
    assert.equal(await mobile.locator('#color-mode-select').isVisible(), true);
    assert.equal(await mobile.locator('#color-mode-select + button').isVisible(), false);
    await mobile.selectOption('#color-mode-select', 'red');
    assert.equal(await mobile.inputValue('#color-mode-select'), 'red');
    assert.deepEqual(errors, []);
    console.log(`${engine}: sticky section push/return, opaque backing in eight themes, five style sections, previews, keyboard visibility, disabled choices, repeated opening, short/narrow and native touch passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
