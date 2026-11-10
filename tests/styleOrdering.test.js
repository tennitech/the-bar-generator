const fs = require('node:fs');
const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
test('style dropdown stays alphabetical within Dynamic and Static without duplicate values', () => {
  const seen = [];
  for (const match of html.matchAll(/<optgroup label="(Dynamic|Static)">([\s\S]*?)<\/optgroup>/g)) {
    const options = [...match[2].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)];
    const names = options.map(option => option[2]);
    expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b,'en')));
    seen.push(...options.map(option=>option[1]));
    if (match[1] === 'Dynamic') {
      expect(options.map(option=>option[1])).toContain('circles-gradient');
      expect(options.map(option=>option[1])).toContain('gradient');
      expect(options.map(option=>option[1])).toContain('triangle-grid');
    }
  }
  expect(seen.length).toBe(20);expect(new Set(seen).size).toBe(seen.length);
});
