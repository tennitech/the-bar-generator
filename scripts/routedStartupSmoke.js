const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium, webkit } = require('playwright');
const base = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const engine = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_INTEGRATION_EVIDENCE;
(async () => {
  const browser = await ({ chromium, webkit }[engine]).launch({ headless: true });
  const results = [];
  try {
    for (const width of [320, 390, 1440]) for (const reducedMotion of ['reduce', 'no-preference']) {
      const context = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: width < 500,
        isMobile: width < 500, reducedMotion });
      const page = await context.newPage();
      const errors = [], failedRequests = [], badResponses = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
      page.on('response', response => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });
      for (const style of ['wave-quantum', 'ruler', 'numeric']) {
        await page.goto(`${base}/generator/${style}/${style === 'numeric' ? '?numericSource=formula&numericFormula=sqrt2&numericValue=001.20' : ''}`);
        await page.waitForFunction(() => window.barShareController && window.GeneratorInitialState, null, { timeout: 60000 });
        await page.locator('#p5-container canvas').waitFor();
        assert.equal(await page.locator('#style-select').inputValue(), style);
        assert.equal(await page.locator('#style-select option[value="wave-quantum"]').evaluate(option => option.parentElement.label), 'Dynamic');
        if (style === 'numeric') {
          assert.equal(await page.inputValue('#numeric-source-select'), 'formula');
          assert.equal(await page.inputValue('#numeric-formula-select'), 'sqrt2');
          assert.equal(await page.inputValue('#numeric-input'), '001.20');
          assert.equal(await page.evaluate(() => getNumericSourceValue()), String(Math.SQRT2));
        }

        assert.equal(await page.locator('#bar-information-title').textContent(), ({ 'wave-quantum': 'Quantum', ruler: 'Ruler', numeric: 'Numeric' })[style]);
      }
      assert.deepEqual(errors, [], 'routed startup page errors');
      assert.deepEqual(failedRequests, [], 'routed startup network failures');
      assert.deepEqual(badResponses, [], 'routed startup bad HTTP responses');
      results.push({ width, reducedMotion, styles: ['wave-quantum', 'ruler', 'numeric'], errors, failedRequests, badResponses });
      await context.close();
    }
    // Card copy must be ready with the selected controls, before the renderer starts.
    const firstPaint = await browser.newPage();
    await firstPaint.route('**/js/main.js?*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.continue();
    });
    const navigation = firstPaint.goto(`${base}/generator/wave-quantum/`);
    await firstPaint.locator('#bar-information').waitFor();
    assert.equal(await firstPaint.locator('#p5-container canvas').count(), 0);
    assert.equal(await firstPaint.locator('#bar-information-title').textContent(), 'Quantum');
    assert.match(await firstPaint.locator('#bar-information-description').textContent(), /wavefunction/);
    await navigation;
    await firstPaint.close();
    results.push({ cardReadyBeforeRenderer: true });
    const numericPaint = await browser.newPage();
    await numericPaint.route('**/js/main.js?*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await route.continue();
    });
    const numericNavigation = numericPaint.goto(`${base}/generator/numeric/?numericSource=formula&numericFormula=sqrt2&numericValue=001.20`);
    await numericPaint.locator('#bar-information').waitFor();
    assert.equal(await numericPaint.locator('#p5-container canvas').count(), 0);
    assert.equal(await numericPaint.inputValue('#numeric-source-select'), 'formula');
    assert.equal(await numericPaint.inputValue('#numeric-formula-select'), 'sqrt2');
    assert.equal(await numericPaint.inputValue('#numeric-input'), '001.20');
    assert.equal(await numericPaint.locator('#numeric-values-control').isHidden(), true);
    assert.equal(await numericPaint.locator('#numeric-formula-control').isVisible(), true);
    assert.ok((await numericPaint.locator('#numeric-formula-value').textContent()).includes(String(Math.SQRT2)));
    await numericNavigation;
    await numericPaint.close();
    results.push({ numericFormulaReadyBeforeRenderer: true });
    // Establish the reported missing-global failure mechanism, then verify real Retry recovery.
    const page = await browser.newPage({ viewport: { width: 320, height: 664 }, isMobile: true, hasTouch: true });
    const expectedErrors = [], failedRequests = [];
    page.on('pageerror', error => expectedErrors.push(error.message));
    page.on('requestfailed', request => failedRequests.push(request.url()));
    await page.route('**/js/utils/generatorInitialState.js?*', route => route.abort('connectionreset'));
    await page.goto(`${base}/generator/wave-quantum/`);
    await page.getByRole('heading', { name: 'Unable to load the generator' }).waitFor();
    assert.ok(expectedErrors.some(error => /GeneratorInitialState/.test(error)), 'missing dependency must explain the reference error');
    assert.ok(failedRequests.some(url => url.includes('/generatorInitialState.js')));
    await page.unroute('**/js/utils/generatorInitialState.js?*');
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.waitForFunction(() => window.barShareController && window.GeneratorInitialState, null, { timeout: 60000 });
    await page.locator('#p5-container canvas').waitFor();
    results.push({ forcedMissingInitialState: true, expectedErrors, failedRequests, retryRecovered: true });
    await page.close();
    if (evidence) {
      await fs.mkdir(evidence, { recursive: true });
      await fs.writeFile(`${evidence}/${engine}-routed-startup.json`, JSON.stringify(results, null, 2));
    }
    console.log(`${engine}: 18 real-HTTP routed starts passed at 320/390/1440px with normal/reduced motion; missing-script fault reproduced GeneratorInitialState error and Retry recovered.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
