const fs = require('node:fs');
const vm = require('node:vm');
function fixture({ secure = true, supports, write = () => {} } = {}) {
  const context = { isSecureContext: secure, navigator: { clipboard: { write } }, ClipboardItem: { supports } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/logoClipboard'), 'utf8'), context);
  return context.logoClipboard;
}
test('SVG requires positive capability evidence; older Safari can attempt PNG', () => {
  const api = fixture();
  expect(api.mode('svg')).toBe('source'); expect(api.mode('png')).toBe('image');
});
test('native detection respects secure contexts, explicit rejection and unsupported errors', () => {
  expect(fixture({ secure: false, supports: () => true }).native('image/png')).toBe(false);
  expect(fixture({ supports: () => false }).mode('png')).toBe('unavailable');
  expect(fixture({ supports: () => { throw Error(); } }).mode('svg')).toBe('source');
  expect(fixture({ supports: type => type === 'image/svg+xml' }).mode('svg')).toBe('image');
});
test('unsupported copy requests cannot enter an image or export path', async () => {
  const api = fixture({ supports: () => true });
  expect(api.mode('unsupported')).toBe('unavailable');
  expect(await api.copy('unsupported')).toBe(null);
});
