const { createBinaryPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');
const utf8Bits = text => [...new TextEncoder().encode(text)].flatMap(byte => [...byte.toString(2).padStart(8, '0')].map(Number));
const inside = (rect, x, y) => x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height;

test('adjacent identical bits become one continuous run without overlap', () => {
  const geometry = createBinaryPatternGeometry({ bits: [0, 0, 1, 1, 1, 0, 1, 1], exactBarWidth: 80, barHeight: 18 });
  expect(geometry.rects).toEqual([
    { x: 0, y: 6, width: 20, height: 6 },
    { x: 20, y: 0, width: 30, height: 6 }, { x: 20, y: 12, width: 30, height: 6 },
    { x: 50, y: 6, width: 10, height: 6 },
    { x: 60, y: 0, width: 20, height: 6 }, { x: 60, y: 12, width: 20, height: 6 }
  ]);
});

test.each([0, 1])('a uniform %s run has no interior edges', bit => {
  const { rects } = createBinaryPatternGeometry({ bits: Array(320).fill(bit) });
  expect(rects).toHaveLength(bit ? 2 : 1);
  rects.forEach(rect => { expect(rect.x).toBe(0); expect(rect.width).toBe(250); expect(rect.height).toBe(6); });
});

test('every byte preserves its exact encoded cell occupancy and total ink area', () => {
  const width = 317.23, height = 22.8, startX = 7.41, startY = -3.6;
  for (let byte = 0; byte < 256; byte++) {
    const bits = [...byte.toString(2).padStart(8, '0')].map(Number);
    const { rects } = createBinaryPatternGeometry({ bits, exactBarWidth: width, barHeight: height, barStartX: startX, barY: startY });
    bits.forEach((bit, i) => { for (let row = 0; row < 3; row++) {
      const painted = rects.filter(rect => inside(rect, startX + (i + .5) * width / 8, startY + (row + .5) * height / 3)).length;
      expect(painted).toBe(bit === 1 ? Number(row !== 1) : Number(row === 1));
    } });
    const area = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
    expect(area).toBeCloseTo(bits.reduce((sum, bit) => sum + (bit ? 2 : 1), 0) * width / 8 * height / 3, 8);
    rects.forEach(rect => {
      expect(rect.x).toBeGreaterThanOrEqual(startX); expect(rect.x + rect.width).toBeLessThanOrEqual(startX + width + 1e-9);
      expect(rect.y).toBeGreaterThanOrEqual(startY); expect(rect.y + rect.height).toBeLessThanOrEqual(startY + height + 1e-9);
    });
  }
});

test.each(['RPI', '0000000000', 'WHY NOT', '🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀', 'Café 東京'])('SVG serializes the identical run geometry for %s', binaryText => {
  const options = { barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 };
  const { rects } = createBinaryPatternGeometry({ ...options, bits: utf8Bits(binaryText) });
  const svg = createBarPatternSVG({ ...options, currentShader: 3, fgColor: '#000', values: { binaryText }, textToBinary: utf8Bits });
  expect(svg.match(/<rect /g)).toHaveLength(rects.length);
  rects.forEach(rect => expect(svg).toContain(`x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"`));
});

test('empty encoded data stays empty rather than gaining boundary paint', () => {
  expect(createBinaryPatternGeometry({ bits: [] })).toEqual({ rects: [] });
  expect(createBarPatternSVG({ currentShader: 3, values: { binaryText: 'RPI' }, textToBinary: () => [] })).toBe('');
});
