const { dimensions, safeTitle, filename } = require('../js/utils/exportOptions');
const { RPI_LOGO_GEOMETRY } = require('../js/utils/logoGeometry');

test('Standard and Large are actual1000/2000pixel marks with proportionate clear space', () => {
  expect(dimensions('standard', RPI_LOGO_GEOMETRY)).toEqual({ logoWidth: 1000, scale: 4, width: 1160, height: 762 });
  expect(dimensions('large', RPI_LOGO_GEOMETRY)).toEqual({ logoWidth: 2000, scale: 8, width: 2320, height: 1524 });
});

test('filenames preserve design identity and append a safe optional Unicode name before the extension', () => {
  const snapshot = { family: 'triangles', inkName: 'black', title: 'Solar / Car: Équipe',
    values: { trianglesVariant: 2, trianglesDirection: 'up-left', trianglesCount: 28 }, dimensions: { logoWidth: 2000 } };
  expect(filename(snapshot, 'png')).toBe('rpi-bar-triangles-up-left-n28-black-clear-2000w--solar-car-équipe.png');
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
