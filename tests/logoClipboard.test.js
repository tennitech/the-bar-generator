const fs = require('node:fs');
const vm = require('node:vm');
function fixture({ secure = true, supports, write = () => {} } = {}) {
  const context = { isSecureContext: secure, navigator: { clipboard: { write } }, ClipboardItem: { supports } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/logoClipboard'), 'utf8'), context);
  return context.logoClipboard;
}
test('SVG and JPEG require positive capability evidence; PNG works without supports in older Safari', () => {
  const api = fixture();
  expect(api.mode('svg')).toBe('source'); expect(api.mode('jpeg')).toBe('download'); expect(api.mode('png')).toBe('image');
});
test('native detection respects secure contexts, explicit rejection and unsupported errors', () => {
  expect(fixture({ secure: false, supports: () => true }).native('image/png')).toBe(false);
  expect(fixture({ supports: () => false }).mode('png')).toBe('unavailable');
  expect(fixture({ supports: () => { throw Error(); } }).mode('jpeg')).toBe('download');
  expect(fixture({ supports: type => type === 'image/jpeg' }).mode('jpeg')).toBe('image');
});
test.each([['#ffffff', '#000000'], ['#000000', '#ffffff'], ['#d6001c', '#ffffff'], ['#a7a9ac', '#000000'], ['#c99700', '#000000']])('JPEG backdrop preserves contrast for %s', (ink, backdrop) => {
  expect(fixture().background(ink)).toBe(backdrop);
});
