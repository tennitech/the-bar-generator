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
      for (const style of ['wave-quantum', 'ruler']) {
        await page.goto(`${base}/generator/${style}/`);
        await page.waitForFunction(() => window.barShareController && window.GeneratorInitialState, null, { timeout: 60000 });
        await page.locator('#p5-container canvas').waitFor();
        assert.equal(await page.locator('#style-select').inputValue(), style);
        assert.equal(await page.locator('#bar-information-title').textContent(), style === 'wave-quantum' ? 'Quantum' : 'Ruler');
      }
      assert.deepEqual(errors, [], 'routed startup page errors');
      assert.deepEqual(failedRequests, [], 'routed startup network failures');
      assert.deepEqual(badResponses, [], 'routed startup bad HTTP responses');
      results.push({ width, reducedMotion, styles: ['wave-quantum', 'ruler'], errors, failedRequests, badResponses });
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
    console.log(`${engine}: 12 real-HTTP routed starts passed at 320/390/1440px with normal/reduced motion; missing-script fault reproduced GeneratorInitialState error and Retry recovered.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
