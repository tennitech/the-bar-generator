const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit } = require('playwright');

const baseUrl = process.env.RPI_SITE_URL || 'http://127.0.0.1:8765';
const browserName = process.env.RPI_BROWSER || 'chromium';
const evidence = process.env.RPI_PATTERN_EVIDENCE;
const cases = [
  ...[1, 2].map(linesVariant => ({ style: 'lines', linesVariant })),
  ...[1, 2].map(gradientVariant => ({ style: 'gradient', gradientVariant })),
  ...[1, 2, 3].map(circlesGradientVariant => ({ style: 'circles-gradient', circlesGradientVariant })),
  { style: 'triangles' }
];
for (const trianglesCount of [6, 28]) {
  for (const trianglesDirection of ['down-right', 'up-right', 'up-left', 'down-left']) {
    cases.push({ style: 'triangles', trianglesCount, trianglesDirection });
  }
}
const selectedCases = process.env.RPI_PATTERN_QUICK === '1' ? [...cases.slice(0, 9), cases[9], cases.at(-1)] : cases;
const circleCases = [1, 2, 3].map(circlesGradientVariant => ({ style: 'circles-gradient', circlesGradientVariant }));
for (const circlesDensity of [10, 100]) for (const circlesSizeVariation of [0, 100]) {
  for (const circlesFill of ['fill', 'stroke']) circleCases.push({ style: 'circles', circlesDensity, circlesSizeVariation, circlesFill });
}
const activeCases = process.env.RPI_PATTERN_CIRCLES === '1' ? circleCases
  : process.env.RPI_PATTERN_LIMIT ? selectedCases.slice(0, Number(process.env.RPI_PATTERN_LIMIT)) : selectedCases;

async function download(page, kind) {
  await page.locator('#save-button').click();
  const pending = page.waitForEvent('download');
  await page.locator(`#save-${kind}`).click();
  const artifact = await pending;
  return fs.readFile(await artifact.path());
}

async function main() {
  const browser = await ({ chromium, webkit }[browserName]).launch({ headless: true });
  const results = [];
  const errors = [];
  try {
    if (evidence) await fs.mkdir(evidence, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/generator/lines/`, { waitUntil: 'networkidle' });
    await page.locator('#p5-container canvas').waitFor();
    await page.evaluate(() => {
      noLoop();
      const original = createRasterExportBlob;
      createRasterExportBlob = (snapshot, signal) => {
        window.__patternPNGSource = snapshot.svgSource;
        return original(snapshot, signal);
      };
    });
    for (const colorMode of ['black', 'white']) for (const config of activeCases) {
      const { style, ...values } = config;
      await page.evaluate(({ style, values, colorMode }) => {
        const set = (id, value, event = 'input') => {
          const field = document.getElementById(id);
          field.value = String(value);
          field.dispatchEvent(new Event(event, { bubbles: true }));
        };
        set('style-select', style, 'change');
        set('color-mode-select', colorMode, 'change');
        if (style === 'circles') {
          set('circles-density-slider', values.circlesDensity);
          set('circles-size-variation-slider', values.circlesSizeVariation);
          set('circles-fill-select', values.circlesFill, 'change');
        }
        if (style === 'lines') set('lines-variant-slider', values.linesVariant);
        if (style === 'gradient') set('gradient-variant-slider', values.gradientVariant);
        if (style === 'circles-gradient') set('circles-gradient-variant-slider', values.circlesGradientVariant);
        if (style === 'triangles') {
          set('triangles-count-slider', values.trianglesCount || 14);
          set('triangles-direction-select', values.trianglesDirection || 'down-right', 'change');
        }
      }, { style, values, colorMode });
      await page.evaluate(() => { noLoop(); redraw(); });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const svg = (await download(page, 'svg')).toString('utf8');
      const png = await download(page, 'png');
      const result = await page.evaluate(async ({ svg, png }) => {
        const parse = markup => new DOMParser().parseFromString(markup, 'image/svg+xml');
        const shapes = node => Array.from(node.querySelectorAll('path,rect,circle,polygon,line'))
          .filter(shape => !shape.closest('defs,clipPath,mask')).slice(3)
          .map(shape => [shape.tagName, ...Array.from(shape.attributes)
            .filter(a => a.name !== 'fill').map(a => [a.name, a.name === 'stroke' && a.value !== 'none' ? 'ink' : a.value])]);
        const doc = parse(svg);
        const header = document.querySelector('#header-logo-preview svg');
        const expected = parse(buildHeaderPreviewSVG());
        if ([5, 16].includes(currentShader)) {
          const circles = [...doc.querySelectorAll('circle')];
          for (const circle of circles) {
            const x = +circle.getAttribute('cx'), y = +circle.getAttribute('cy');
            const radius = +circle.getAttribute('r') + +(circle.getAttribute('stroke-width') || 0) / 2;
            if (x - radius < -1e-7 || x + radius > 250 + 1e-7 ||
                y - radius < REFERENCE_BAR_Y - 1e-7 || y + radius > REFERENCE_BAR_Y + 18 + 1e-7) {
              throw new Error('Circle artwork extends beyond the bar before clipping');
            }
            if (circle.closest('[data-bar-edge-fit]')) throw new Error('Circle artwork must not be stretched: ' + circle.closest('[data-bar-edge-fit]').getAttribute('transform'));
          }
        }
        const svgGeometry = shapes(doc);
        const headerGeometry = shapes(header);
        const expectedGeometry = shapes(expected);
        const pngImage = new Image();
        pngImage.src = 'data:image/png;base64,' + png;
        await pngImage.decode();
        const target = document.createElement('canvas');
        target.width = pngImage.naturalWidth;
        target.height = pngImage.naturalHeight;
        // SVG is scalable; choose the same whole-pixel viewport and uniform
        // reference-unit scale as PNG. Stretching the fractional default SVG
        // height into a different rectangle compares different transforms.
        const referenceDocument = doc.cloneNode(true);
        const reference = referenceDocument.documentElement;
        const box = doc.documentElement.viewBox.baseVal;
        reference.setAttribute('width', target.width);
        reference.setAttribute('height', target.height);
        reference.setAttribute('viewBox', `${box.x} ${box.y} ${target.width / PNG_EXPORT_SCALE} ${target.height / PNG_EXPORT_SCALE}`);
        const image = new Image();
        // Preserve the downloaded XML declaration and standalone SVG resource.
        // Compare the same complete document that PNG rasterization receives.
        const referenceURL = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(referenceDocument)], { type: 'image/svg+xml' }));
        image.src = referenceURL;
        await image.decode();
        // Match the production canvas backend; WebKit's read-optimized backend
        // uses different edge antialiasing from its default drawing surface.
        const ctx = target.getContext('2d');
        ctx.drawImage(image, 0, 0);
        URL.revokeObjectURL(referenceURL);
        const expectedPixels = ctx.getImageData(0, 0, target.width, target.height).data;
        const expectedPNG = target.toDataURL('image/png').split(',')[1];
        ctx.clearRect(0, 0, target.width, target.height);
        ctx.drawImage(pngImage, 0, 0);
        const pngPixels = ctx.getImageData(0, 0, target.width, target.height).data;
        let pixelDifferences = 0, maxChannelDifference = 0, maxAlphaDifference = 0;
        let alphaIntersection = 0, alphaUnion = 0, exportInteriorDifferences = 0;
        let firstOpaqueRGB = null;
        for (let i = 0; i < pngPixels.length; i++) {
          if (pngPixels[i] !== expectedPixels[i]) pixelDifferences++;
          maxChannelDifference = Math.max(maxChannelDifference, Math.abs(pngPixels[i] - expectedPixels[i]));
          if (i % 4 === 3) {
            maxAlphaDifference = Math.max(maxAlphaDifference, Math.abs(pngPixels[i] - expectedPixels[i]));
            const a = pngPixels[i] > 127, b = expectedPixels[i] > 127;
            if (a || b) alphaUnion++;
            if (a && b) alphaIntersection++;
            if ([0, 1, 2, 3].some(offset => pngPixels[i - 3 + offset] !== expectedPixels[i - 3 + offset])) {
              const pixel = (i - 3) / 4, col = pixel % target.width, row = Math.floor(pixel / target.width);
              let stable = col > 0 && row > 0 && col < target.width - 1 && row < target.height - 1;
              for (let dy = -1; dy <= 1 && stable; dy++) for (let dx = -1; dx <= 1; dx++) {
                if ((expectedPixels[((row + dy) * target.width + col + dx) * 4 + 3] > 127) !== b) stable = false;
              }
              if (stable) exportInteriorDifferences++;
            }
          }
          if (!firstOpaqueRGB && i % 4 === 3 && pngPixels[i] === 255) firstOpaqueRGB = Array.from(pngPixels.slice(i - 3, i));
        }
        const barLeft = SVG_EXPORT_PADDING * PNG_EXPORT_SCALE;
        const barTop = (SVG_EXPORT_PADDING + REFERENCE_BAR_Y) * PNG_EXPORT_SCALE;
        const barRight = barLeft + REFERENCE_WIDTH * PNG_EXPORT_SCALE;
        const barBottom = barTop + REFERENCE_BAR_HEIGHT * PNG_EXPORT_SCALE;
        let barPixels = 0, leftPixels = 0, rightPixels = 0;
        for (let y = Math.floor(barTop); y < Math.ceil(barBottom); y++) {
          for (let x = barLeft; x < barRight; x++) {
            if (pngPixels[(y * target.width + x) * 4 + 3]) barPixels++;
          }
          if (pngPixels[(y * target.width + barLeft) * 4 + 3]) leftPixels++;
          if (pngPixels[(y * target.width + barRight - 1) * 4 + 3]) rightPixels++;
        }
        // Compare the actual main-canvas bar against the selected canonical SVG
        // at the same screen transform, allowing only edge-rasterization variation.
        draw();
        const live = document.querySelector('#p5-container canvas');
        const preview = document.createElement('canvas');
        preview.width = live.width;
        preview.height = live.height;
        const previewCtx = preview.getContext('2d', { willReadFrequently: true });
        previewCtx.drawImage(live, 0, 0);
        const ratio = live.width / width;
        const scale = getRenderedResponsiveLogoScale();
        const x = (width / 2 + scale * panOffset.x - scale * zoomLevel * REFERENCE_WIDTH / 2) * ratio;
        const y = (height / 2 - getPreviewFitLayout().controlSpace / 2 + scale * panOffset.y
          + scale * zoomLevel * (LOGO_VERTICAL_OFFSET + REFERENCE_BAR_Y)) * ratio;
        const w = REFERENCE_WIDTH * scale * zoomLevel * ratio;
        const h = REFERENCE_BAR_HEIGHT * scale * zoomLevel * ratio;
        const rect = { x: Math.floor(x), y: Math.floor(y), w: Math.ceil(x + w) - Math.floor(x), h: Math.ceil(y + h) - Math.floor(y) };
        const livePixels = previewCtx.getImageData(rect.x, rect.y, rect.w, rect.h).data;
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        const barImage = new Image();
        barImage.src = 'data:image/svg+xml;base64,' + btoa(buildCurrentBarOnlySVG());
        await barImage.decode();
        previewCtx.drawImage(barImage, x, y, w, h);
        const referencePixels = previewCtx.getImageData(rect.x, rect.y, rect.w, rect.h).data;
        let intersection = 0, union = 0;
        for (let i = 3; i < livePixels.length; i += 4) {
          const a = livePixels[i] > 127, b = referencePixels[i] > 127;
          if (a || b) union++;
          if (a && b) intersection++;
        }
        let stablePixels = 0, stableDifferences = 0;
        const solid = (x, y) => referencePixels[(y * rect.w + x) * 4 + 3] > 127;
        for (let row = 1; row < rect.h - 1; row++) for (let col = 1; col < rect.w - 1; col++) {
          const expected = solid(col, row);
          if (![-1, 0, 1].every(dy => [-1, 0, 1].every(dx => solid(col + dx, row + dy) === expected))) continue;
          stablePixels++;
          if ((livePixels[(row * rect.w + col) * 4 + 3] > 127) !== expected) stableDifferences++;
        }
        return { capturedSourceMatches: window.__patternPNGSource === svg, expectedPNG, referenceSVG: new XMLSerializer().serializeToString(referenceDocument), svgGeometry, headerGeometry, expectedGeometry, pixelDifferences, maxChannelDifference, maxAlphaDifference, exportMaskOverlap: alphaIntersection / alphaUnion, exportInteriorDifferences, firstOpaqueRGB,
          previewInteriorAgreement: 1 - stableDifferences / stablePixels,
          pngWidth: target.width, pngHeight: target.height, barPixels, leftPixels, rightPixels,
          previewOverlap: intersection / union };
      }, { svg, png: png.toString('base64') });
      if (process.env.RPI_PATTERN_CIRCLES === '1') {
        await page.evaluate(() => setZoomLevel(4, { immediate: true }));
        await page.evaluate(() => getCanonicalBarImage(4000).ready);
        await page.evaluate(() => { noLoop(); redraw(); });
        const zoomSVG = (await download(page, 'svg')).toString('utf8');
        const zoomPNG = await download(page, 'png');
        assert.equal(zoomSVG, svg, 'Inspection zoom must not change circle SVG');
        assert.deepEqual(zoomPNG, png, 'Inspection zoom must not change circle PNG');
        if (evidence && colorMode === 'black') await page.screenshot({ path: path.join(evidence, `${browserName}-${style}-${JSON.stringify(values).replace(/[^a-z0-9]/gi, '')}-400.png`) });
        await page.evaluate(() => setZoomLevel(1, { immediate: true }));
      }
      const label = `${browserName} ${style} ${JSON.stringify(values)} ${colorMode}`;
      assert.equal(result.capturedSourceMatches, true, `${label}: PNG captures the exact downloaded SVG source`);
      assert.deepEqual(result.svgGeometry, result.expectedGeometry, `${label}: SVG selected geometry`);
      assert.deepEqual(result.headerGeometry, result.expectedGeometry, `${label}: header selected geometry`);
      if (evidence && result.pixelDifferences && (result.exportInteriorDifferences || result.exportMaskOverlap <= 0.999)) {
        await fs.writeFile(path.join(evidence, `${browserName}-raster-diagnostic.json`), JSON.stringify(result, null, 2));
        await fs.writeFile(path.join(evidence, `${browserName}-raster-diagnostic.svg`), svg);
        await fs.writeFile(path.join(evidence, `${browserName}-raster-diagnostic.png`), png);
        await fs.writeFile(path.join(evidence, `${browserName}-raster-reference.png`), Buffer.from(result.expectedPNG, 'base64'));
        await fs.writeFile(path.join(evidence, `${browserName}-raster-reference.svg`), result.referenceSVG);
        console.log(JSON.stringify({ pixelDifferences: result.pixelDifferences, maxChannelDifference: result.maxChannelDifference,
          maxAlphaDifference: result.maxAlphaDifference, exportMaskOverlap: result.exportMaskOverlap,
          exportInteriorDifferences: result.exportInteriorDifferences }));
      }
      if (browserName === 'chromium') assert.equal(result.pixelDifferences, 0, `${label}: PNG raster must equal downloaded SVG`);
      else {
        assert.equal(result.exportInteriorDifferences, 0, `${label}: SVG/PNG interiors must match`);
        assert.ok(result.exportMaskOverlap > 0.999, `${label}: SVG/PNG mask overlap ${result.exportMaskOverlap}`);
      }
      assert.deepEqual(result.firstOpaqueRGB, colorMode === 'white' ? [255, 255, 255] : [0, 0, 0], `${label}: export foreground color`);
      assert.ok(result.barPixels > 0 && result.leftPixels > 0 && result.rightPixels > 0, `${label}: actual PNG bar and both painted edges`);
      assert.ok(result.previewInteriorAgreement > 0.995,
        `${label}: preview interior agreement ${result.previewInteriorAgreement}, raw overlap ${result.previewOverlap}`);
      if (style === 'triangles') assert.equal(result.svgGeometry.length, values.trianglesCount || 14, `${label}: triangle count`);
      results.push({ style, ...values, colorMode, ...result, expectedPNG: undefined, referenceSVG: undefined, svgGeometry: undefined, headerGeometry: undefined, expectedGeometry: undefined });
      if (results.length % 10 === 0) console.log(`${browserName}: ${results.length} selected states verified`);
      if (evidence && (results.length <= 9 || (style === 'triangles' && values.trianglesCount === 28 && values.trianglesDirection === 'up-left'))) {
        const name = `${browserName}-${results.length}-${style}`;
        await fs.writeFile(path.join(evidence, `${name}.svg`), svg);
        await fs.writeFile(path.join(evidence, `${name}.png`), png);
        await page.screenshot({ path: path.join(evidence, `${name}-preview.png`) });
      }
    }
    assert.deepEqual(errors, []);
    if (evidence) await fs.writeFile(path.join(evidence, `${browserName}-results.json`), JSON.stringify(results, null, 2));
    console.log(`${browserName}: ${results.length} selected states passed actual SVG/header geometry, PNG ${browserName === 'chromium' ? 'pixel' : 'interior/mask'} parity, painted edges and rendered preview comparison.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
