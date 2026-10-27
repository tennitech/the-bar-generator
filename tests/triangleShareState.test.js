const { encodeState, decodeState } = require('../js/utils/shareState');

// BAR-02 native control contract; v1 derives these constraints from the loaded shell.
const manifest = {
  'style-select': { options: ['solid', 'triangles'] },
  'triangles-variant-slider': { type: 'range', min: 1, max: 2, step: 1 },
  'triangles-direction-select': { options: ['down', 'up'] },
  'triangles-count-slider': { type: 'range', min: 6, max: 28, step: 1 }
};
const cases = [1, 2].flatMap(variant => ['down', 'up'].flatMap(direction => [6, 14, 28].map(count => [variant, direction, count])));

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
    'triangles-direction-select': 'down', 'triangles-count-slider': '14', [id]: value };
  expect(() => encodeState({ v: 1, controls }, manifest)).toThrow();
});
