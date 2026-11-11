// Native offline SVG raster evidence, not browser layout or interaction QA.
// NODE_PATH=/tmp/rpi-lfo-qa/node_modules node scripts/trussRenderLocal.js [output]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { createBarPatternSVG } = require('../js/utils/barPattern');
const { createRuntime } = require('../tests/helpers/exportCompositionRuntime');
const out = process.argv[2] || '/tmp/truss-render-evidence';
fs.mkdirSync(out, { recursive: true });
const families = ['warren', 'pratt', 'howe', 'cross'];
const labels = ['Warren zigzag', 'Pratt', 'Howe', 'X-braced'];
const svgFor = (family, values = {}, ink = '#000000') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 18" width="1000" height="72">${createBarPatternSVG({
  currentShader: 9, barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18, fgColor: ink,
  values: { trussFamily: family, trussSegments: 16, trussDepth: 100, trussThickness: 1.25, ...values }
})}</svg>`;
(async () => {
  const sheet = createCanvas(1120, 1100), ctx = sheet.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sheet.width, sheet.height);
  ctx.fillStyle = '#000000'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('Truss / geometry review', 44, 48);
  ctx.font = '16px sans-serif'; ctx.fillText('Native SVG rasterization. Not a browser screenshot or structural analysis.', 44, 77);
  for (const [i, family] of families.entries()) {
    const y = 112 + i * 170;
    ctx.fillStyle = '#000000'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(`${labels[i]} · 16 panels · 100% depth · 1.25 weight`, 44, y);
    const svg = svgFor(family); fs.writeFileSync(path.join(out, `${family}.svg`), svg);
    ctx.drawImage(await loadImage(Buffer.from(svg)), 44, y + 16, 1000, 72);
    ctx.fillStyle = '#000000'; ctx.fillRect(44, y + 102, 1000, 44);
    ctx.drawImage(await loadImage(Buffer.from(svgFor(family, {}, '#ffffff'))), 58, y + 106, 500, 36);
    ctx.fillStyle = '#ffffff'; ctx.font = '14px sans-serif'; ctx.fillText('500 px actual bar width', 684, y + 130);
  }
  ctx.fillStyle = '#000000'; ctx.font = 'bold 17px sans-serif'; ctx.fillText('Depth / density / weight studies', 44, 823);
  for (const [i, value] of [{ trussSegments: 8, trussDepth: 50, trussThickness: 0.75 }, { trussSegments: 24, trussDepth: 75, trussThickness: 1.5 }, { trussSegments: 32, trussDepth: 50, trussThickness: 2 }].entries()) {
    ctx.drawImage(await loadImage(Buffer.from(svgFor('pratt', value))), 44, 842 + i * 76, 700, 50.4);
    ctx.font = '14px sans-serif'; ctx.fillText(`${value.trussSegments} panels / ${value.trussDepth}% / ${value.trussThickness}`, 785, 875 + i * 76);
  }
  fs.writeFileSync(path.join(out, 'truss-contact-sheet.png'), sheet.toBuffer('image/png'));
  const runtime = createRuntime(); runtime.select('truss');
  const report = [];
  for (const family of families) for (const composition of ['logo', 'bar']) for (const size of ['standard', 'large']) {
    Object.assign(runtime.state, { composition, size });
    Object.assign(runtime.state.values, { trussFamily: family, trussSegments: 16, trussDepth: 100, trussThickness: 1.25 });
    const snapshot = runtime.captureLogoExportSnapshot();
    const canvas = createCanvas(snapshot.dimensions.width, snapshot.dimensions.height), context = canvas.getContext('2d');
    context.drawImage(await loadImage(Buffer.from(snapshot.svgSource)), 0, 0, canvas.width, canvas.height);
    const png = canvas.toBuffer('image/png');
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    const decoded = await loadImage(png); assert.equal(decoded.width, canvas.width); assert.equal(decoded.height, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0; for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) painted++;
    assert.ok(painted > 0); assert.equal(pixels[3], 0); assert.equal(pixels.at(-1), 0);
    if (composition === 'logo' && size === 'standard') {
      fs.writeFileSync(path.join(out, `${family}-logo.png`), png);
      const review = createCanvas(canvas.width, canvas.height), reviewContext = review.getContext('2d');
      reviewContext.fillStyle = '#ffffff'; reviewContext.fillRect(0, 0, canvas.width, canvas.height);
      reviewContext.drawImage(canvas, 0, 0);
      fs.writeFileSync(path.join(out, `${family}-logo-review.png`), review.toBuffer('image/png'));
    }
    report.push({ family, composition, size, width: canvas.width, height: canvas.height, paintedPixels: painted, bytes: png.length });
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ type: 'native offline raster/codec; not browser QA', results: report }, null, 2));
  console.log(`Verified ${report.length} SVG-to-PNG composition/size/family exports. Evidence: ${out}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
