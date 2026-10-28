const { encodeState, decodeState } = require('../js/utils/shareState');

// Native triangle control contract; v1 derives these constraints from the loaded shell.
const manifest = {
  'style-select': { options: ['solid', 'triangles'] },
  'triangles-variant-slider': { type: 'range', min: 1, max: 2, step: 1 },
  'triangles-direction-select': { options: ['down-right', 'up-right', 'up-left', 'down-left'] },
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

test('old omitted inactive triangle direction remains Down right; explicit previously saved Up left stays Up left', () => {
  const old = { v: 1, controls: { 'style-select': 'solid' } };
  expect(decodeState('#bar=' + Buffer.from(JSON.stringify(old)).toString('base64url'), manifest).controls['triangles-direction-select']).toBe('down-right');
  const fresh = { v: 1, controls: { ...old.controls, 'triangles-direction-select': 'up-left' } };
  expect(decodeState(encodeState(fresh, manifest), manifest).controls['triangles-direction-select']).toBe('up-left');
});

test.each(['down-right', 'up-right', 'up-left', 'down-left'])('variant-free shell preserves legacy variant 2 artwork facing %s', direction => {
  const currentManifest = { ...manifest };
  delete currentManifest['triangles-variant-slider'];
  const state = { v: 1, controls: { 'style-select': 'triangles', 'triangles-variant-slider': '2', 'triangles-direction-select': direction } };
  const old = '#bar=' + Buffer.from(JSON.stringify(state)).toString('base64url');
  const restored = decodeState(old, currentManifest);
  const expected = { 'down-right': 'up-left', 'up-right': 'down-left', 'up-left': 'down-right', 'down-left': 'up-right' }[direction];
  expect(restored.controls['triangles-direction-select']).toBe(expected);
  expect(restored.controls['triangles-variant-slider']).toBeUndefined();
  expect(decodeState(encodeState(restored, currentManifest), currentManifest).controls).toEqual(restored.controls);
});

test('variant-free migration preserves every triangle polygon for all supported counts', () => {
  const { createTrianglesPatternGeometry } = require('../js/utils/barPattern');
  const currentManifest = { ...manifest }; delete currentManifest['triangles-variant-slider'];
  const vertices = geometry => geometry.polygons.map(polygon => polygon
    .map(({x,y}) => [x.toFixed(8),y.toFixed(8)].join(',')).sort().join('|'));
  for (const variant of [1, 2]) for (const direction of ['down-right','up-right','up-left','down-left']) {
    for (let count=6;count<=28;count++) {
      const controls = { 'triangles-variant-slider': String(variant), 'triangles-direction-select': direction };
      const old = '#bar=' + Buffer.from(JSON.stringify({v:1,controls})).toString('base64url');
      const restored = decodeState(old, currentManifest).controls['triangles-direction-select'];
      expect(vertices(createTrianglesPatternGeometry({variant,count,direction})))
        .toEqual(vertices(createTrianglesPatternGeometry({variant:1,count,direction:restored})));
    }
  }
});
