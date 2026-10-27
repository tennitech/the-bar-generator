const fs = require('node:fs');
const path = require('node:path');
const { RPI_LOGO_GEOMETRY: geometry, clipBarSVG, getBarEdgeTransform } = require('../js/utils/logoGeometry');

test('letter commands preserve the complete official vector at uniform half scale', () => {
  const source = fs.readFileSync(path.join(__dirname, '../assets/images/RPI Logo.svg'), 'utf8');
  const sourcePaths = [...source.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]);
  [...Object.values(geometry.paths), geometry.barPath].forEach((letter, index) => {
    expect(letter.replace(/-?\d*\.?\d+/g, '')).toBe(sourcePaths[index].replace(/-?\d*\.?\d+/g, ''));
    const numbers = [...letter.matchAll(/-?\d*\.?\d+/g)].map(match => Number(match[0]));
    const official = [...sourcePaths[index].matchAll(/-?\d*\.?\d+/g)].map(match => Number(match[0]));
    numbers.forEach((number, coordinate) => expect(number * 2).toBeCloseTo(official[coordinate], 8));
  });
  // These independent source coordinates catch a return to the mixed-wordmark layout.
  expect(geometry.barY * 2).toBe(264.977);
  expect(geometry.letterHeight * 2).toBe(222.977);
  expect(geometry.barY - geometry.letterHeight).toBeCloseTo(21, 10);
  expect(geometry.width * 2).toBe(500);
  expect(geometry.barHeight * 2).toBe(36);
  expect(geometry.totalHeight).toBe(geometry.barY + geometry.barHeight);
});

test('stroke-inclusive SVG clipping preserves caller bounds and fragment', () => {
  const fragment = '<line x1="-5" y1="0" x2="255" y2="18" stroke-width="8"/>';
  const clipped = clipBarSVG(fragment, 0, 132.4885, 250, 18);
  expect(clipped).toContain('<rect x="0" y="132.4885" width="250" height="18"/>');
  expect(clipped).toContain(`>${fragment}</g>`);
  expect(clipped).toMatch(/<g clip-path="url\(#bar-bounds-/);
});

test('fits real painted extents to both edges at translated and scaled sizes', () => {
  for (const width of [60, 250, 500]) for (const start of [-20, 0, 37]) {
    const left = start + width * 0.02, right = start + width * 0.98;
    const fit = getBarEdgeTransform(left, right, start, width);
    expect(left * fit.scale + fit.offset).toBeCloseTo(start, 10);
    expect(right * fit.scale + fit.offset).toBeCloseTo(start + width, 10);
    // Uniform horizontal mapping preserves the relative data/spacing ratios.
    expect((right - left) * fit.scale).toBeCloseTo(width, 10);
  }
  expect(getBarEdgeTransform(0, 0, 0, 250)).toEqual({ offset: 0, scale: 1 });
});
