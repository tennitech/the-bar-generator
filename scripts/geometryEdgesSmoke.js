const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const baseUrl = process.env.RPI_SITE_URL || 'http://127.0.0.1:8000';
const styles = ['solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles', 'numeric', 'morse',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network',
  'triangle-grid', 'triangles', 'fibonacci-sequence', 'union', 'wave-quantum', 'runway', 'lunar'];
async function checkEdges(page, label) {
  const result = await page.evaluate(async () => {
    if (![1, 2, 4].includes(currentShader)) await getCanonicalBarImage().ready;
    const pg = createExportGraphicsBuffer(4);
    drawExportLogoFrame(pg, { scale: 4 });
    const y = Math.floor((REFERENCE_BAR_Y + EXPORT_PADDING) * 4);
    const pixels = pg.drawingContext.getImageData(0, y, pg.width, 73).data;
    let left = Infinity, right = -1;
    for (let row = 0; row < 73; row++) for (let x = 0; x < pg.width; x++) {
      if (pixels[(row * pg.width + x) * 4 + 3] > 8) { left = Math.min(left, x); right = Math.max(right, x); }
    }
    pg.remove();
    return { left, right };
  });
  assert.equal(result.left, 80, `${label}: left painted extent ${result.left}`);
  assert.equal(result.right, 1079, `${label}: right painted extent ${result.right}`);
}
async function main() {
  const browser = await chromium.launch({ headless: true });
  let checked = 0;
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    for (const style of styles) {
      console.log(`Edge ranges: ${style}`);
      await page.goto(`${baseUrl}/generator/${style}/`);
      await page.locator('#p5-container canvas').waitFor({ state: 'attached' });
      if (style === 'lunar') await page.waitForFunction(() => !!window.LUNAR_BAR_SVG_SOURCE);
      await checkEdges(page, style); checked++;
      if (style === 'solid') {
        const fitting = await page.evaluate(() => {
          const line = '<line x1="0.5" y1="9" x2="249.5" y2="9" stroke="black" stroke-width="1"/>';
          const inset = '<defs><clipPath id="non-painting-frame"><rect width="250" height="18"/></clipPath></defs><rect x="5" width="240" height="18"/>';
          return { strokePreserved: fitBarSVGToEdges(line, 0, 0, 250, 18) === line,
            containerIgnored: fitBarSVGToEdges(inset, 0, 0, 250, 18).includes('data-bar-edge-fit="true"') };
        });
        assert.ok(fitting.strokePreserved, 'Centered stroke already spans both edges and must not be stretched');
        assert.ok(fitting.containerIgnored, 'A clip container must not conceal an actual painted inset');
      }
      const controls = await page.locator('input[type="range"]:visible').evaluateAll(inputs => inputs.map(input => ({
        id: input.id, min: input.min, max: input.max, value: input.value
      })));
      for (const control of controls) for (const value of [control.min, control.max]) {
        await page.evaluate(({ id, value }) => {
          const input = document.getElementById(id); input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }, { id: control.id, value });
        await checkEdges(page, `${style}/${control.id}=${value}`); checked++;
        await page.evaluate(({ id, value }) => {
          const input = document.getElementById(id); input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }, { id: control.id, value: control.value });
      }
      let referenceMarkers;
      if (style === 'ruler' || style === 'ticker') for (const phase of [0.07, 0.23, 0.49, 0.73, 0.99]) {
        await page.evaluate(phase => { liveMotionPhase = phase; requestUpdate(); }, phase);
        await checkEdges(page, `${style}/phase=${phase}`); checked++;
        const motion = await page.evaluate(() => {
          const options = { ...getCurrentBarPatternValues(250), shader: currentShader,
            barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 };
          const raw = (currentShader === 1 ? createRulerPatternGeometry : createTickerPatternGeometry)(options);
          const bounded = createBoundedTickGeometry(options);
          return { unchanged: JSON.stringify(raw.rects) === JSON.stringify(bounded.rects.filter(rect => !rect.isBoundary)),
            markers: bounded.rects.filter(rect => rect.isBoundary),
            hasFrameScale: /scale\(/.test(buildCurrentBarPatternSVGFragment()) };
        });
        assert.ok(motion.unchanged, `${style}: fitting changed interior tick positions or widths`);
        assert.equal(motion.hasFrameScale, false, `${style}: phase-dependent spatial scaling`);
        if (referenceMarkers) assert.deepEqual(motion.markers, referenceMarkers, `${style}: boundary marks breathe with phase`);
        referenceMarkers = motion.markers;
      }
      if (style === 'triangles') {
        const forwarded = await page.evaluate(() => {
          window.getTrianglePatternControlValues = () => ({ trianglesVariant: 2, trianglesDirection: 'up-left', trianglesCount: 28 });
          const values = getCurrentBarPatternValues(250);
          delete window.getTrianglePatternControlValues;
          return { trianglesVariant: values.trianglesVariant, trianglesDirection: values.trianglesDirection, trianglesCount: values.trianglesCount };
        });
        assert.deepEqual(forwarded, { trianglesVariant: 2, trianglesDirection: 'up-left', trianglesCount: 28 });
      }
      if (style === 'numeric') for (const mode of ['height', 'dotmatrix']) for (const value of ['1', '9', '0123456789', '0.0']) {
        await page.evaluate(({ mode, value }) => {
          numericModeSelect.value = mode; numericInput.value = value; requestUpdate();
        }, { mode, value });
        await checkEdges(page, `${style}/${mode}/${value}`); checked++;
      }
      if (style === 'numeric' || style === 'morse') {
        const blocked = await page.evaluate(async style => {
          if (style === 'numeric') { numericModeSelect.value = 'dotmatrix'; numericInput.value = '0'; }
          else morseInput.value = '☃';
          let svgBlocked = false;
          try { requirePaintedBarForExport(); } catch (error) { svgBlocked = /no visible bar/.test(error.message); }
          return svgBlocked;
        }, style);
        assert.ok(blocked, `${style}: empty encoding must not export a mark without its bar`);
        const downloads = [];
        const onDownload = download => downloads.push(download.suggestedFilename());
        page.on('download', onDownload);
        await page.evaluate(async () => { saveSVG(); await savePNG(); });
        await page.waitForTimeout(100);
        page.off('download', onDownload);
        assert.deepEqual(downloads, [], `${style}: empty encoding downloaded an invalid mark`);
        assert.match(await page.locator('body').innerText(), /no visible bar/);
      }
      if (style === 'circles') {
        await page.evaluate(() => { circlesFillSelect.value = 'fill'; requestUpdate(); });
        await checkEdges(page, `${style}/fill`); checked++;
      }
    }
    console.log(`${checked} rendered painted-edge/control-range cases passed.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
