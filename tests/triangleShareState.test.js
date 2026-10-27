const { encodeState, decodeState } = require('../js/utils/shareState');

// BAR-02 native control contract; v1 derives these constraints from the loaded shell.
const manifest = {
  'style-select': { options: ['solid', 'triangles'] },
  'triangles-variant-slider': { type: 'range', min: 1, max: 2, step: 1 },
  'triangles-direction-select': { options: ['up-left', 'up-right', 'down-left', 'down-right'] },
  'triangles-count-slider': { type: 'range', min: 6, max: 28, step: 1 }
};
const cases = [1, 2].flatMap(variant => ['up-left', 'up-right', 'down-left', 'down-right'].flatMap(direction => [6, 14, 28].map(count => [variant, direction, count])));

test.each(cases)('v1 shares triangle variant %s, direction %s, count %s', (variant, direction, count) => {
  const controls = { 'style-select': 'triangles', 'triangles-variant-slider': String(variant),
    'triangles-direction-select': direction, 'triangles-count-slider': String(count) };
  const snapshot = { v: 1, name: 'Triangle study', controls };
  const fragment = encodeState(snapshot, manifest);
  expect(decodeState(fragment, manifest).controls).toEqual(controls);
  expect(encodeState(decodeState(fragment, manifest), manifest)).toBe(fragment);
});

test.each([
  ['triangles-count-slider', '5'], ['triangles-count-slider', '29'],
  ['triangles-count-slider', '14.5'], ['triangles-direction-select', 'left'],
  ['triangles-variant-slider', '3']
])('rejects triangle contract violation %s=%s', (id, value) => {
  const controls = { 'style-select': 'triangles', 'triangles-variant-slider': '1',
    'triangles-direction-select': 'up-left', 'triangles-count-slider': '14', [id]: value };
  expect(() => encodeState({ v: 1, controls }, manifest)).toThrow();
});

const legacyCases = [1, 2].flatMap(variant => [['up', 'up-right'], ['down', 'down-right'], [undefined, 'down-right']].map(([old, expected]) => [variant, old, expected]));
test.each(legacyCases)('migrates historical v1 variant%s direction %s to %s before validation', (variant, old, expected) => {
  const controls = { 'style-select': 'triangles', 'triangles-variant-slider': String(variant), 'triangles-count-slider': '14' };
  if (old !== undefined) controls['triangles-direction-select'] = old;
  // Construct raw historical JSON rather than calling today's encoder, which canonicalizes it.
  const fragment = '#bar=' + Buffer.from(JSON.stringify({ v: 1, controls })).toString('base64url');
  const restored = decodeState(fragment, manifest);
  expect(restored.controls['triangles-direction-select']).toBe(expected);
  expect(decodeState(encodeState(restored, manifest), manifest).controls['triangles-direction-select']).toBe(expected);
});

test('old omitted inactive triangle direction remains Down right; explicit new default stays Up left', () => {
  const old = { v: 1, controls: { 'style-select': 'solid' } };
  expect(decodeState('#bar=' + Buffer.from(JSON.stringify(old)).toString('base64url'), manifest).controls['triangles-direction-select']).toBe('down-right');
  const fresh = { v: 1, controls: { ...old.controls, 'triangles-direction-select': 'up-left' } };
  expect(decodeState(encodeState(fresh, manifest), manifest).controls['triangles-direction-select']).toBe('up-left');
});
