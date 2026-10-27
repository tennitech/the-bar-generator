const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { icons, getIconMarkup, source } = require('../js/utils/featherIcons');
const hashes = require('../third_party/feather/manifest.json').icons;
test.each(Object.keys(hashes))('%s uses exact pinned Feather SVG, not redrawn geometry', name => {
  const raw = fs.readFileSync(path.join(__dirname, '../third_party/feather/icons', `${name}.svg`));
  expect(crypto.createHash('sha256').update(raw).digest('hex')).toBe(hashes[name]);
  expect(icons[name]).toBe(raw.toString().trim());
  const markup = getIconMarkup(name, 'header_icon');
  expect(markup.replace('class="header_icon" aria-hidden="true" focusable="false" ', '')).toBe(icons[name]);
  expect(markup).toContain('stroke-width="2"');
});
test('source and accessibility metadata are explicit; unknown icons fail closed', () => {
  expect(source).toBe('feathericons/feather@v4.29.2');
  expect(() => getIconMarkup('invented')).toThrow();
  expect(getIconMarkup('share', 'safe" onclick="bad')).not.toContain('onclick="');
});


test('static action icons use the same exact Feather child geometry and decorative semantics', () => {
  const html = fs.readFileSync(path.join(__dirname, '../generator/index.html'), 'utf8');
  const matches = Array.from(html.matchAll(/<svg data-feather="([a-z-]+)"[^>]*>([\s\S]*?)<\/svg>/g));
  expect(matches).toHaveLength(8);
  for (const [markup, name, children] of matches) {
    const expected = icons[name].match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
    expect(children).toBe(expected);
    expect(markup).toContain('stroke-width="2"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('focusable="false"');
  }
  expect(html).not.toMatch(/[↘↗↖↙]/);
});
