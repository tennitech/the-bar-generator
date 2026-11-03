const fs = require('node:fs');
const vm = require('node:vm');
const { RPI_LOGO_GEOMETRY } = require('../js/utils/logoGeometry');

function renderer(maxTextureSize) {
  const context = { RPI_LOGO_GEOMETRY, REFERENCE_WIDTH: 250, REFERENCE_BAR_HEIGHT: 18,
    colors: { black: { fg: '#000000' } }, currentColorMode: 'black', zoomLevel: 4,
    getRenderedResponsiveLogoScale: () => 6, devicePixelRatio: 3,
    buildCurrentBarPatternSVGFragment: () => '<path d="M0 0h250v1H0z"/>',
    requestUpdate: jest.fn(), CORNER: 'corner', console,
    loadImage: (url, success) => {
      const svg = decodeURIComponent(url.split(',')[1]);
      const [, width, height] = svg.match(/width="([\d.]+)" height="([\d.]+)"/);
      queueMicrotask(() => success({ width: Number(width), height: Number(height), svg }));
    },
    push: jest.fn(), pop: jest.fn(), imageMode: jest.fn(), image: jest.fn() };
  if (maxTextureSize) context._renderer = { GL: { MAX_TEXTURE_SIZE: 3379,
    getParameter: () => maxTextureSize } };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/drawing.js'), 'utf8'), context);
  context.render = () => vm.runInContext('drawCanonicalBarPattern(window, 0, 0, 250, 18)', context);
  return context;
}

test.each([2048, 4096, 8192, 16384])('never uploads snapshots above a %i px GPU limit', async limit => {
  const r = renderer(limit);
  r.render();
  // Wait for the actual asynchronous snapshot load, then draw it.
  await Promise.resolve();
  r.render();
  const [image, x, y, width, height] = r.image.mock.calls.at(-1);
  expect(image.width).toBeLessThanOrEqual(limit);
  expect(image.width / image.height).toBe(125 / 9);
  expect(image.width).toBe(Math.floor(limit / 125) * 125);
  expect([x, y, width, height]).toEqual([0, 0, 250, 18]);
  expect(image.svg).toContain('viewBox="0 0 250 18"');
});

test('does not reuse an oversized ready snapshot while a safe one decodes', async () => {
  const r = renderer(2048);
  await r.getCanonicalBarImage(10000).ready;
  r.render();
  expect(r.image).not.toHaveBeenCalled();
  await Promise.resolve();
  r.render();
  expect(r.image.mock.calls[0][0].width).toBe(2000);
});

test('2D export snapshots keep their resolution independently of viewer zoom', async () => {
  const r = renderer();
  const image = await r.getCanonicalBarImage(10000).ready;
  expect(image.width).toBe(10000);
  const target = { push: jest.fn(), pop: jest.fn(), imageMode: jest.fn(), image: jest.fn() };
  r.drawCanonicalBarPattern(target, 20, 30, 250, 18);
  await Promise.resolve();
  r.drawCanonicalBarPattern(target, 20, 30, 250, 18);
  expect(target.image.mock.calls.at(-1)[0].width).toBe(1000);
});


test('first preview waits for the exact image and changes remain atomic', async () => {
  const r = renderer(4096);
  expect(r.getReadyCanonicalBarImage(r)).toBeNull();
  expect(r.image).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(r.getReadyCanonicalBarImage(r)).toBeTruthy();
  r.buildCurrentBarPatternSVGFragment = () => '<path d="M0 0h250v18H0z"/>';
  expect(r.getReadyCanonicalBarImage(r)).toBeNull();
  await Promise.resolve();
  expect(r.getReadyCanonicalBarImage(r).svg).toContain('h250v18');
});

test('the committed draw reuses its prepared image without rebuilding the snapshot', () => {
  const r = renderer(4096);
  const prepared = { width: 1000, height: 72 };
  r.loadImage = jest.fn();
  r.drawCanonicalBarPattern(r, 0, 0, 250, 18, prepared);
  expect(r.image).toHaveBeenCalledWith(prepared, 0, 0, 250, 18);
  expect(r.loadImage).not.toHaveBeenCalled();
});
