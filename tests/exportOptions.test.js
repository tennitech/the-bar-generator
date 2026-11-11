const { dimensions, safeTitle, filename, DEFAULT_SIZE } = require('../js/utils/exportOptions');
const { RPI_LOGO_GEOMETRY } = require('../js/utils/logoGeometry');

test('Smaller file and High resolution are 1000/4096 pixel PNG marks with proportionate clear space', () => {
  expect(dimensions('standard', RPI_LOGO_GEOMETRY)).toEqual({ logoWidth: 1000, scale: 4, width: 1160, height: 762 });
  expect(dimensions('large', RPI_LOGO_GEOMETRY)).toEqual({ logoWidth: 4096, scale: 16.384, width: 4752, height: 3121 });
});

test('filenames preserve design identity and append a safe optional Unicode name before the extension', () => {
  const snapshot = { family: 'triangles', inkName: 'black', title: 'Solar / Car: Équipe',
    values: { trianglesVariant: 2, trianglesDirection: 'up-left', trianglesCount: 28 }, dimensions: { logoWidth: 2000, width: 2320, height: 1524 } };
  expect(filename(snapshot, 'png')).toBe('rpi-bar-triangles-up-left-n28-black-clear-2320x1524--solar-car-équipe.png');
  expect(filename({ ...snapshot, title: '' }, 'svg')).toBe('rpi-bar-triangles-up-left-n28-black-clear-vector.svg');
  expect(safeTitle('..\\evil\u202Epng.exe/\u0000')).toBe('evilpng-exe');
  expect(safeTitle('CON')).toBe('name-con');
});

test('Unicode filenames normalize and respect UTF8 byte limits without splitting graphemes', () => {
  expect(safeTitle('Cafe\u0301')).toBe('café');
  const title = safeTitle('工程研究'.repeat(30));
  expect(Buffer.byteLength(title, 'utf8')).toBeLessThanOrEqual(64);
  expect(title).not.toContain('\ufffd');
});


test('Large is the recommended default, including missing or invalid size values', () => {
  expect(DEFAULT_SIZE).toBe('large');
  expect(dimensions(undefined, RPI_LOGO_GEOMETRY)).toEqual(dimensions('large', RPI_LOGO_GEOMETRY));
  expect(dimensions('invalid', RPI_LOGO_GEOMETRY)).toEqual(dimensions('large', RPI_LOGO_GEOMETRY));
});

test.each(['logo', 'bar'])('GIF retains its independent 1000/2000 pixel budget for %s', composition => {
  expect(dimensions('large', RPI_LOGO_GEOMETRY, composition, 'gif')).toEqual({
    logoWidth: 2000, scale: 8, width: 2320, height: composition === 'bar' ? 464 : 1524
  });
  expect(dimensions('standard', RPI_LOGO_GEOMETRY, composition, 'gif'))
    .toEqual(dimensions('standard', RPI_LOGO_GEOMETRY, composition, 'png'));
  for (const size of [undefined, null, 'invalid', '__proto__', 'constructor']) {
    expect(dimensions(size, RPI_LOGO_GEOMETRY, composition, 'png'))
      .toEqual(dimensions('large', RPI_LOGO_GEOMETRY, composition, 'png'));
    expect(dimensions(size, RPI_LOGO_GEOMETRY, composition, 'gif'))
      .toEqual(dimensions('large', RPI_LOGO_GEOMETRY, composition, 'gif'));
  }
});

test.each(['logo', 'bar'])('4096 pixel artwork uses uniform scale and rounds only the %s canvas upward', composition => {
  const d = dimensions('large', RPI_LOGO_GEOMETRY, composition);
  expect(RPI_LOGO_GEOMETRY.width * d.scale).toBe(4096);
  expect(RPI_LOGO_GEOMETRY.exportPadding * d.scale).toBe(327.68);
  expect(d.width * d.height).toBeLessThan(16 * 1024 * 1024);
  const frame = require('../js/utils/exportOptions').viewport(RPI_LOGO_GEOMETRY, composition);
  for (const axis of ['width', 'height']) {
    expect(d[axis] - frame[axis] * d.scale).toBeGreaterThanOrEqual(0);
    expect(d[axis] - frame[axis] * d.scale).toBeLessThan(1);
  }
});


test('bar-only keeps the same uniform width and padding with a cropped height', () => {
  const { viewport, normalizeComposition } = require('../js/utils/exportOptions');
  expect(dimensions('standard', RPI_LOGO_GEOMETRY, 'bar')).toEqual({ logoWidth: 1000, scale: 4, width: 1160, height: 232 });
  expect(dimensions('large', RPI_LOGO_GEOMETRY, 'bar')).toEqual({ logoWidth: 4096, scale: 16.384, width: 4752, height: 951 });
  expect(viewport(RPI_LOGO_GEOMETRY, 'bar')).toEqual({ x: -20, y: 112.4885, width: 290, height: 58 });
  for (const value of [undefined, null, 'invalid', 'logo', '__proto__']) {
    expect(normalizeComposition(value)).toBe('logo');
    expect(dimensions('large', RPI_LOGO_GEOMETRY, value)).toEqual(dimensions('large', RPI_LOGO_GEOMETRY));
  }
});

test.each(['svg', 'png', 'gif'])('bar-only %s filenames identify the crop without changing default filenames', format => {
  const snapshot = { family: 'solid', foreground: '#000000', inkName: 'black', composition: 'bar',
    dimensions: dimensions('large', RPI_LOGO_GEOMETRY, 'bar', format) };
  expect(filename(snapshot, format)).toContain('rpi-bar-solid-bar-only-black-clear-');
  expect(filename(snapshot, format)).toContain(format === 'svg' ? 'vector' : format === 'gif' ? '2320x464' : '4752x951');
  expect(filename({ ...snapshot, composition: 'logo' }, format)).not.toContain('bar-only');
});
