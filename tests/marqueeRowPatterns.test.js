const { createRowPatterns } = require('../js/marqueeUi');
const { entries, samples, selectEntries } = require('../js/utils/marqueeCatalog');

function expectSeparated(patterns, catalog) {
  const styleByPath = new Map(catalog.map(entry => [entry.path, entry.value]));
  expect(patterns).toHaveLength(10);
  for (const row of patterns) {
    expect(row.length).toBeGreaterThanOrEqual(2);
    expect(row.length).toBeLessThanOrEqual(7);
    const styles = row.map(path => {
      expect(styleByPath.has(path)).toBe(true);
      return styleByPath.get(path);
    });
    // This includes the circular seam, which is also every repeated DOM seam.
    styles.forEach((style, index) => {
      expect(style).not.toBe(styles[(index + 1) % styles.length]);
    });
    expect(new Set(styles).size).toBe(styles.length);
  }
  if (new Set(catalog.map(entry => entry.value)).size >= 4) {
    patterns.forEach((row, index) => {
      const neighbors = new Set(patterns[(index + 1) % patterns.length].map(path => styleByPath.get(path)));
      row.forEach(path => expect(neighbors.has(styleByPath.get(path))).toBe(false));
    });
  }

}

describe('bounded circular marquee style separation', () => {
  test.each([2, 3, 4, 5, 6, 7, 10, 15, 20, 21, 22, 25, 30, 35, 70])(
    '%i families never collide internally or across the repeat seam', count => {
      const catalog = Array.from({ length: count }, (_, i) => ({
        value: `style-${i}`, path: `sample-${i}`
      }));
      const patterns = createRowPatterns(catalog);
      expectSeparated(patterns, catalog);
      // Retain the exact lane length from the consolidated 21-family regression.
      if (count === 21) expect(patterns.every(row => row.length === 7)).toBe(true);
      expect(new Set(patterns.flat())).toEqual(new Set(catalog.map(entry => entry.path)));
      expect(createRowPatterns(catalog)).toEqual(patterns);
    });

  test('different assets and configurations of one family are not different styles', () => {
    const variants = Array.from({ length: 20 }, (_, i) => ({ value: 'ruler', path: `ruler-${i}` }));
    const catalog = [...variants, { value: 'ticker', path: 'ticker' }, { value: 'grid', path: 'grid' }];
    const before = JSON.stringify(catalog);
    const patterns = createRowPatterns(catalog);
    expectSeparated(patterns, catalog);
    expect(new Set(patterns.flat().filter(path => path.startsWith('ruler-'))).size).toBe(10);
    expect(JSON.stringify(catalog)).toBe(before);
  });

  test('canonical and full variant catalogs both remain separated', () => {
    const patterns = createRowPatterns(entries);
    expectSeparated(patterns, entries);
    expect(createRowPatterns([...entries].reverse())).not.toEqual(patterns);
    expectSeparated(createRowPatterns(samples), samples);
  });

  test('fresh random selections and repeated regeneration preserve the invariant', () => {
    let seed = 1;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const catalogBefore = JSON.stringify(samples);
    for (let load = 0; load < 100; load++) {
      const selection = selectEntries(random);
      const before = JSON.stringify(selection);
      const patterns = createRowPatterns(selection);
      expectSeparated(patterns, selection);
      expect(createRowPatterns(selection)).toEqual(patterns);
      expect(new Set(patterns.flat())).toEqual(new Set(selection.map(entry => entry.path)));
      expect(JSON.stringify(selection)).toBe(before);
    }
    expect(JSON.stringify(samples)).toBe(catalogBefore);
  });

  test.each([[], [{ value: 'solid', path: 'solid' }], [
    { value: 'ruler', path: 'ruler-1' }, { value: 'ruler', path: 'ruler-2' }
  ]])('rejects catalogs where a separated circular lane is impossible: %j', (...catalog) => {
    expect(() => createRowPatterns(catalog)).toThrow(RangeError);
  });
});
