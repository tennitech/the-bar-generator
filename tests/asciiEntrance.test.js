const { cells } = require('../js/utils/asciiEntrance');
test('ASCII sampling stays bounded at large viewport sizes', () => {
  expect(cells(10000, 10000)).toEqual({ columns: 100, rows: 56 });
  const dense = cells(700, 10000);
  expect(dense.columns * dense.rows).toBeLessThanOrEqual(6400);
});
test('small bars retain a minimum of two glyph rows', () => {
  expect(cells(500, 18).rows).toBe(2);
  expect(cells(20, 1)).toEqual({ columns: 8, rows: 2 });
});
