const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { icons, getIconMarkup, source } = require('../js/utils/featherIcons');
const hashes = {
  share: 'effae7164671d39452a674f414ce0536e21e266632ddc7d8ec90d4fe7f1e7043',
  copy: 'a32de6b675efb2d05a19455cde9d7350706257069e0a52d0a99fdf51a565fe91',
  check: '1df722c1758fb0cb4868c38eb038fecf64c3717fe09ceaeb43783b70d027a1c4'
};
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
