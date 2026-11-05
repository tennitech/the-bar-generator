const { cells, resolveAt, artworkRegions, noise } = require('../js/utils/asciiEntrance');
test('ASCII sampling stays bounded at large viewport sizes', () => {
  expect(cells(10000, 10000)).toEqual({ columns: 100, rows: 56 });
  expect(cells(700, 10000).columns * cells(700, 10000).rows).toBeLessThanOrEqual(6400);
});
test('small bars retain a minimum of two glyph rows', () => {
  expect(cells(500, 18).rows).toBe(2);
  expect(cells(20, 1)).toEqual({ columns: 8, rows: 2 });
});
test('whole letters settle in sequence with bounded opacity, never by an x-coordinate', () => {
  expect(resolveAt(0, 0, 3)).toBe(0);
  expect(resolveAt(0.4, 0, 3)).toBe(1);
  expect(resolveAt(0.4, 1, 3)).toBeGreaterThan(0);
  expect(resolveAt(0.4, 1, 3)).toBeLessThan(1);
  expect(resolveAt(0.4, 2, 3)).toBe(0);
  for (let count = 1; count <= 30; count++) for (let index = 0; index < count; index++) {
    expect(resolveAt(1, index, count, 0.1)).toBe(1);
    let previous = 0;
    for (let p = 0; p <= 1; p += 0.05) { const next = resolveAt(p, index, count); expect(next).toBeGreaterThanOrEqual(previous); expect(next).toBeLessThanOrEqual(1); previous = next; }
  }
});
test('sampled whitespace separates complete mark letters and its bar', () => {
  const columns = 24, rows = 12, pixels = new Uint8Array(columns * rows * 4);
  for (const [left, right] of [[2, 7], [10, 15], [19, 21]]) for (let y = 1; y < 7; y++) for (let x = left; x < right; x++) pixels[(y * columns + x) * 4 + 3] = 255;
  for (let y = 9; y < 11; y++) for (let x = 2; x < 21; x++) pixels[(y * columns + x) * 4 + 3] = 255;
  const groups = artworkRegions(pixels, columns, rows);
  expect(groups).toHaveLength(4);
  expect(groups[0].x + groups[0].w).toBeLessThan(groups[1].x);
  expect(groups[1].x + groups[1].w).toBeLessThan(groups[2].x);
  expect(groups[3].y).toBeGreaterThan(groups[2].y);
});
test('terminal noise holds within each beat and stays bounded', () => {
  for (let k = 0; k < 1000; k++) { expect(noise(k, 1)).toBe(noise(k, 1)); expect(noise(k, 1)).toBeGreaterThanOrEqual(0); expect(noise(k, 1)).toBeLessThan(1); }
  expect(noise(5, 1)).not.toBe(noise(5, 2));
});
