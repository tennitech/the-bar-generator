const { getFitLayout, getNextZoom, getPanBounds, anchorPan, clampZoom } = require('../js/utils/viewportZoom');

for (const [width, height] of [[320, 512], [390, 788], [844, 334], [1140, 844], [3140, 1384]]) {
  test(`Fit preserves the whole mark and control space in ${width}×${height}`, () => {
    const layout = getFitLayout(width, height);
    const markWidth = 250 * layout.scale;
    const markHeight = 150.911 * layout.scale;
    expect(markWidth).toBeLessThanOrEqual(layout.usableWidth + 1e-8);
    expect(markHeight).toBeLessThanOrEqual(layout.usableHeight + 1e-8);
    expect(layout.centerY + markHeight / 2).toBeLessThanOrEqual(height - layout.controlSpace - layout.padding + 1e-8);
    expect(markWidth).toBeGreaterThanOrEqual(60);
    expect(getPanBounds(layout, 1)).toEqual({ minX: -0, maxX: 0, minY: -0, maxY: 0 });
  });
}

test('a large display gets a larger fitted mark without an arbitrary size cap', () => {
  const large = getFitLayout(3140, 1384);
  expect(large.scale).toBeGreaterThan(getFitLayout(1140, 844).scale);
  expect(150.911 * large.scale).toBeCloseTo(large.usableHeight);
});

test('button stops remain useful from custom values and at both limits', () => {
  expect(getNextZoom(1, 1)).toBe(1.25);
  expect(getNextZoom(1.8, 1)).toBe(2);
  expect(getNextZoom(1.8, -1)).toBe(1.5);
  expect(getNextZoom(1, -1)).toBe(1);
  expect(getNextZoom(4, 1)).toBe(4);
  expect(clampZoom(0.5)).toBe(1);
  expect(clampZoom(5)).toBe(4);
});

test('zoom holds the same world point under the pointer', () => {
  const pan = anchorPan({ x: 0, y: 0 }, { x: 80, y: -40 }, 1, 2, 2);
  expect(2 * (pan.x + 2 * 40)).toBeCloseTo(80);
  expect(2 * (pan.y + 2 * -20)).toBeCloseTo(-40);
});

test('enlarged views allow bounded inspection on each overflowing axis', () => {
  const layout = getFitLayout(1000, 700);
  const bounds = getPanBounds(layout, 4);
  expect(bounds.maxX).toBeGreaterThan(0);
  expect(bounds.maxY).toBeGreaterThan(0);
  expect(bounds.minX).toBe(-bounds.maxX);
  expect(bounds.minY).toBe(-bounds.maxY);
});
