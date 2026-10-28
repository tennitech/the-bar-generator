// Source and accessible-control checks; visual evidence still needs human review.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_ICON_EVIDENCE;
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch();
  const results = [], errors = [];
  try {
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const touch = viewport.width < 1100;
      const page = await browser.newPage({ viewport, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/generator/ticker/`);
      await page.waitForFunction(() => window.barShareController && window.FeatherIcons);
      for (const theme of ['black', 'white', 'red', 'blue', 'gold', 'silver', 'gray', 'lunar']) {
        await page.selectOption('#style-select', theme === 'lunar' ? 'lunar' : 'ticker', { force: true });
        await page.selectOption('#color-mode-select', theme, { force: true });
        if (theme === 'lunar') await page.waitForFunction(() => !!window.LUNAR_BAR_SVG_SOURCE);
        await page.waitForTimeout(80);
        await page.click('#share-button');
        await page.locator('#share-popover').evaluate(async menu => {
          await Promise.all(menu.getAnimations().map(animation => animation.finished.catch(() => {})));
        });
        const measured = await page.evaluate(() => {
          const signature = element => JSON.stringify(Array.from(element.children, child => ({
            tag: child.localName, attributes: Array.from(child.attributes, attr => [attr.name, attr.value]).sort(),
            children: signature(child)
          })));
          const known = new Map(Object.entries(FeatherIcons.icons).map(([name, markup]) =>
            [signature(new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement), name]));
          const selectors = '.header-actions svg, .workspace-controls svg, .report_dialog-close svg, .preview-control-btn svg, .share_menu-icon svg';
          const icons = Array.from(document.querySelectorAll(selectors), svg => {
            const control = svg.closest('button, a');
            const rect = svg.getBoundingClientRect();
            return { source: known.get(signature(svg)), decorative: svg.getAttribute('aria-hidden'),
              focusable: svg.getAttribute('focusable'), label: control?.getAttribute('aria-label') || control?.textContent.trim(),
              visible: rect.width > 0 && rect.height > 0, width: rect.width, height: rect.height };
          });
          const buttons = Array.from(document.querySelectorAll('.header-actions > button, .header-actions > a, .header-actions > .save-section > button'), button => {
            const r = button.getBoundingClientRect(); return { id: button.id, x: r.x, y: r.y, width: r.width, height: r.height };
          });
          return { icons, buttons, overflow: document.documentElement.scrollWidth > innerWidth,
            directionLabels: Array.from(document.getElementById('triangles-direction-select').options, option => option.textContent.trim()) };
        });
        assert.equal(measured.overflow, false);
        assert.equal(measured.buttons.length, 4);
        for (const button of measured.buttons) assert.ok(button.height >= (touch ? 44 : 38));
        for (const icon of measured.icons) {
          assert.ok(icon.source, 'Action SVG differs from the pinned source');
          assert.equal(icon.decorative, 'true'); assert.equal(icon.focusable, 'false');
          assert.ok(icon.label, 'Control retains an accessible label');
          // DOM rectangles may round transformed x/y edges independently to layout units.
          if (icon.visible) assert.ok(Math.abs(icon.width - icon.height) <= 1 / 64, JSON.stringify(icon));
        }
        assert.deepEqual(measured.directionLabels, ['Down right', 'Up right', 'Up left', 'Down left']);
        assert.equal(await page.evaluate(() => document.activeElement.id), 'share-copy');
        if (evidence) await page.screenshot({ path: path.join(evidence, `${engine}-${viewport.width}-${theme}-share.png`) });
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'share-button');
        if (touch && theme !== 'lunar') {
          await page.click('#save-button');
          await page.locator('#save-menu').evaluate(async menu => {
            await Promise.all(menu.getAnimations().map(animation => animation.finished.catch(() => {})));
          });
          const size = await page.locator('#export-size-select').evaluate(field => ({
            height: field.getBoundingClientRect().height, font: parseFloat(getComputedStyle(field).fontSize),
            label: field.labels[0]?.textContent.trim()
          }));
          assert.ok(size.height >= 44, JSON.stringify(size)); assert.ok(size.font >= 16, JSON.stringify(size)); assert.ok(size.label);
          await page.keyboard.press('Escape');
        }

        results.push({ viewport, theme, ...measured });
      }
      await page.evaluate(() => { document.querySelectorAll('.toast').forEach(toast => toast.remove()); Toast.show('Success state', 'success'); Toast.show('Error state', 'error'); Toast.show('Information state', 'info'); });
      assert.equal(await page.locator('.toast_icon[aria-hidden="true"][focusable="false"]').count(), 3);
      if (evidence) await page.screenshot({ path: path.join(evidence, `${engine}-${viewport.width}-toast-states.png`) });
      await page.evaluate(() => { document.getElementById('brand-title').focus(); return openHeaderLogoAnimation(); });
      await page.locator('#logo-animation-close').waitFor({ state: 'visible' });
      for (const id of ['logo-animation-close', 'logo-animation-replay']) {
        assert.ok(await page.locator(`#${id}`).getAttribute('aria-label'));
        assert.equal(await page.locator(`#${id} svg`).getAttribute('aria-hidden'), 'true');
        assert.equal(await page.locator(`#${id} svg`).getAttribute('focusable'), 'false');
      }
      if (evidence) await page.screenshot({ path: path.join(evidence, `${engine}-${viewport.width}-intro-icons.png`) });
      await page.keyboard.press('Escape');
      await page.close();
    }
    assert.deepEqual(errors, []);
    if (evidence) await fs.writeFile(path.join(evidence, `${engine}-icon-results.json`), JSON.stringify(results, null, 2));
    console.log(`${engine}: 24 theme/viewport icon-source, toolbar, label and focus cases passed; screenshots need visual review.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
