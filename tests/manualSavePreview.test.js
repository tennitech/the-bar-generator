const { isLightInk, formatInfo, validateBlob, enabled } = require('../js/utils/manualSavePreview');
test('transparent preview chooses a contrasting surface without changing image ink', () => {
  expect(isLightInk([255, 255, 255])).toBe(true);
  expect(isLightInk([0, 0, 0])).toBe(false);
  expect(isLightInk([214, 0, 28])).toBe(false);
  expect(isLightInk(null)).toBe(false);
});
test('metadata distinguishes true vector from captured raster dimensions', () => {
  const dimensions = { width: 1160, height: 762 };
  expect(formatInfo('svg', dimensions)).toBe('SVG · Scalable vector · Transparent');
  expect(formatInfo('png', dimensions)).toBe('PNG · 1160 × 762 px · Transparent');
});
test('preview never accepts raster data as SVG or an unsupported format', () => {
  expect(() => validateBlob(new Blob(['svg'], { type: 'image/svg+xml' }), 'svg')).not.toThrow();
  expect(() => validateBlob(new Blob(['png'], { type: 'image/png' }), 'png')).not.toThrow();
  expect(() => validateBlob(new Blob(['png'], { type: 'image/png' }), 'svg')).toThrow(/format/);
  expect(() => validateBlob(new Blob(['gif'], { type: 'image/gif' }), 'gif')).toThrow(/format/);
});
test('prototype does not intercept export outside a supported embedded dialog', () => {
  expect(enabled('svg')).toBeFalsy();
  expect(enabled('gif')).toBe(false);
});
