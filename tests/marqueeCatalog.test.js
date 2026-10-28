const fs = require('node:fs');
const path = require('node:path');
const { entries } = require('../js/utils/marqueeCatalog');
const { ROUTABLE_STYLE_VALUES, UNAVAILABLE_STYLE_VALUES } = require('../js/utils/generatorRoutes');
test('every implemented route has exactly one current marquee sample', () => {
  expect(new Set(entries.map(entry => entry.value))).toEqual(ROUTABLE_STYLE_VALUES);
  expect(entries).toHaveLength(ROUTABLE_STYLE_VALUES.size);
  for (const entry of entries) {
    expect(UNAVAILABLE_STYLE_VALUES.has(entry.value)).toBe(false);
    const svg = fs.readFileSync(path.join(__dirname, '..', entry.path.split('?')[0]), 'utf8');
    expect(svg).toContain('viewBox="0 0 250 18"');
    expect(svg).not.toContain('<image');
    expect(svg).toMatch(/<(path|rect|circle|polygon)\b/);
  }
});
