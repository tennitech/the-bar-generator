const fs = require('node:fs');
const vm = require('node:vm');
function fixture({ embedded = false, policy, legacyPolicy } = {}) {
  const context = { document: { permissionsPolicy: policy, featurePolicy: legacyPolicy } };
  context.self = context; context.top = embedded ? {} : context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/embedSupport'), 'utf8'), context);
  return { api: context.embedSupport, context };
}
test('embedding detection is read-only and does not add an external navigation path', () => {
  expect(fixture().api.isEmbedded()).toBe(false);
  expect(fixture({ embedded: true }).api.isEmbedded()).toBe(true);
  expect(Object.keys(fixture().api).sort()).toEqual(['clipboardBlocked', 'isEmbedded']);
});
test('an inaccessible top context is treated as embedded', () => {
  const h = fixture();
  Object.defineProperty(h.context, 'top', { get: () => { throw Error('Blocked'); } });
  expect(h.api.isEmbedded()).toBe(true);
});
test.each(['policy', 'legacyPolicy'])('explicit %s denial is detected without requesting permission', key => {
  const allowsFeature = jest.fn(() => false);
  const h = fixture({ [key]: { allowsFeature, features: () => ['clipboard-write'] } });
  expect(h.api.clipboardBlocked()).toBe(true);
  expect(allowsFeature).toHaveBeenCalledWith('clipboard-write');
});
test.each([
  undefined,
  {},
  { allowsFeature: () => true },
  { allowsFeature: () => { throw Error('Unsupported'); } },
  { features: () => ['camera'], allowsFeature: () => false }
])('missing, unknown or unavailable policy introspection remains inconclusive', policy => {
  expect(fixture({ policy }).api.clipboardBlocked()).toBe(false);
});
test('cached shells cannot restore the removed share trigger', () => {
  const { prepareTrigger } = require('../js/utils/shareState');
  expect(prepareTrigger()).toBe(null);
});
