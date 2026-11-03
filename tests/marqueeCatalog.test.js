const fs = require('node:fs');
const path = require('node:path');
const { entries, samples, selectEntries } = require('../js/utils/marqueeCatalog');
const { ROUTABLE_STYLE_VALUES, UNAVAILABLE_STYLE_VALUES } = require('../js/utils/generatorRoutes');
test('every implemented route has one canonical entry and bounded real samples', () => {
  expect(new Set(entries.map(entry => entry.value))).toEqual(ROUTABLE_STYLE_VALUES);
  expect(entries).toHaveLength(ROUTABLE_STYLE_VALUES.size);
  expect(new Set(samples.map(sample => sample.path)).size).toBe(samples.length);
  for (const entry of entries) {
    expect(UNAVAILABLE_STYLE_VALUES.has(entry.value)).toBe(false);
    expect(entry.variants.length).toBeGreaterThanOrEqual(1);
    expect(entry.variants.length).toBeLessThanOrEqual(3);
    expect(entry.variants[0].path).toBe(entry.path);
    expect(entry.query).toBe('');
    expect(Object.isFrozen(entry.variants)).toBe(true);
    const artwork = new Set();
    for (const sample of entry.variants) {
      expect(sample.value).toBe(entry.value);
      expect(sample.query.length).toBeLessThan(200);
      expect(sample.query).not.toMatch(/[?#]/);
      expect(Object.isFrozen(sample)).toBe(true);
      const svg = fs.readFileSync(path.join(__dirname, '..', sample.path.split('?')[0]), 'utf8');
      expect(svg).toContain('viewBox="0 0 250 18"');
      expect(svg).not.toMatch(/<image|NaN|undefined/);
      expect(svg).toMatch(/<(path|rect|circle|polygon)\b/);
      artwork.add(svg);
    }
    expect(artwork.size).toBe(entry.variants.length);
  }
});
test('selection chooses exactly one sample per family with only 21 unique asset URLs', () => {
  for (const random of [() => 0, () => 0.5, () => 0.999999]) {
    const selection = selectEntries(random);
    expect(selection).toHaveLength(entries.length);
    expect(new Set(selection.map(sample => sample.value))).toEqual(ROUTABLE_STYLE_VALUES);
    expect(new Set(selection.map(sample => sample.path)).size).toBe(entries.length);
    for (const sample of selection) expect(samples).toContain(sample);
  }
});
test('randomness changes configurations and order without modifying the catalog', () => {
  const before = JSON.stringify(entries);
  const first = selectEntries(() => 0);
  const last = selectEntries(() => 0.999999);
  expect(first.map(sample => sample.value)).not.toEqual(last.map(sample => sample.value));
  const firstByValue = new Map(first.map(sample => [sample.value, sample]));
  for (const sample of last) {
    const entry = entries.find(item => item.value === sample.value);
    expect(sample.variant).toBe(entry.variants.length - 1);
    if (entry.variants.length > 1) expect(sample.path).not.toBe(firstByValue.get(sample.value).path);
  }
  expect(JSON.stringify(entries)).toBe(before);
});
