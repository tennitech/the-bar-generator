const { cells, frontier, noise } = require('../js/utils/asciiEntrance');
test('ASCII sampling stays bounded at large viewport sizes', () => {
  expect(cells(10000, 10000)).toEqual({ columns: 100, rows: 56 });
  const dense = cells(700, 10000);
  expect(dense.columns * dense.rows).toBeLessThanOrEqual(6400);
});
test('small bars retain a minimum of two glyph rows', () => {
  expect(cells(500, 18).rows).toBe(2);
  expect(cells(20, 1)).toEqual({ columns: 8, rows: 2 });
});

test('wake frontier is bounded, monotone and commits all artwork', () => {
  expect(frontier(0)).toBe(0);
  expect(frontier(1)).toBe(1);
  let previous = 0;
  for (let p = 0; p <= 1; p += 0.01) {
    const next = frontier(p); expect(next).toBeGreaterThanOrEqual(previous);
    expect(next).toBeLessThanOrEqual(1); previous = next;
  }
});
test('terminal noise stays stable within a beat and bounded across cells', () => {
  for (let k = 0; k < 1000; k++) {
    expect(noise(k, 1)).toBe(noise(k, 1));
    expect(noise(k, 1)).toBeGreaterThanOrEqual(0);
    expect(noise(k, 1)).toBeLessThan(1);
  }
  expect(noise(5, 1)).not.toBe(noise(5, 2));
});
