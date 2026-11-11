const fs = require('node:fs');
const path = require('node:path');
const { entries, samples, selectEntries } = require('../js/utils/marqueeCatalog');
const { ROUTABLE_STYLE_VALUES, UNAVAILABLE_STYLE_VALUES } = require('../js/utils/generatorRoutes');
// Live experiments remain discoverable in the editor without being promoted on Home.
const shell = fs.readFileSync(path.join(__dirname, '../generator/index.html'), 'utf8');
const construction = new Set([...shell.match(/<optgroup label="Under Construction">([\s\S]*?)<\/optgroup>/)[1].matchAll(/value="([^"]+)"/g)].map(match => match[1]));
const promoted = new Set([...ROUTABLE_STYLE_VALUES].filter(style => !construction.has(style)));

test('every promoted route has one canonical Home entry and bounded real samples', () => {
  expect(new Set(entries.map(entry => entry.value))).toEqual(promoted);
  expect(entries).toHaveLength(promoted.size);
  expect(new Set(samples.map(sample => sample.path)).size).toBe(samples.length);
  for (const entry of entries) {
    expect(UNAVAILABLE_STYLE_VALUES.has(entry.value)).toBe(false);
    expect(construction.has(entry.value)).toBe(false);
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
test('selection chooses exactly one sample per promoted family with unique asset URLs', () => {
  for (const random of [() => 0, () => 0.5, () => 0.999999]) {
    const selection = selectEntries(random);
    expect(selection).toHaveLength(entries.length);
    expect(new Set(selection.map(sample => sample.value))).toEqual(promoted);
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

test('Triangle Grid samples contain both diagonal directions, not only a frame', () => {
  for (const sample of entries.find(entry => entry.value === 'triangle-grid').variants) {
    const svg = fs.readFileSync(path.join(__dirname, '..', sample.path.split('?')[0]), 'utf8');
    const lines = [...svg.matchAll(/M\s+([-\d.e]+)\s+([-\d.e]+)\s+L\s+([-\d.e]+)\s+([-\d.e]+)/g)]
      .map(match => match.slice(1).map(Number));
    const diagonals = lines.filter(([x1, y1, x2, y2]) => Math.abs(x2 - x1) > 0.01 && Math.abs(y2 - y1) > 0.01);
    expect(diagonals.length).toBeGreaterThanOrEqual(100);
    expect(diagonals.some(([x1, y1, x2, y2]) => (x2 - x1) * (y2 - y1) > 0)).toBe(true);
    expect(diagonals.some(([x1, y1, x2, y2]) => (x2 - x1) * (y2 - y1) < 0)).toBe(true);
  }
});
