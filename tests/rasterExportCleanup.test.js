const { createRuntime } = require('./helpers/exportCompositionRuntime');

function fixture({ context = true, blob = new Blob(['png'], { type: 'image/png' }), decode } = {}) {
  const attributes = {};
  const canvas = { width: 0, height: 0, getContext: () => context ? { drawImage: jest.fn() } : null,
    toBlob: jest.fn(callback => callback(blob)) };
  let image;
  const revokeObjectURL = jest.fn();
  const r = createRuntime({
    Image: class { constructor() { image = this; } decode() { return decode ? decode() : Promise.resolve(); } },
    DOMParser: class { parseFromString() { return { querySelector: () => null,
      documentElement: { setAttribute: (key, value) => { attributes[key] = value; } } }; } },
    XMLSerializer: class { serializeToString() { return '<svg/>'; } },
    URL: { createObjectURL: () => 'blob:raster-test', revokeObjectURL }
  });
  r.document.createElement = () => canvas;
  return { r, canvas, attributes, revokeObjectURL, image: () => image };
}

test.each(['logo', 'bar'])('PNG %s uses uniform 4096-pixel scale, then releases temporary resources', async composition => {
  const f = fixture(); f.r.state.composition = composition;
  const snapshot = f.r.captureLogoExportSnapshot({ format: 'png' });
  f.r.state.size = 'standard';
  expect((await f.r.createRasterExportBlob(snapshot, new AbortController().signal)).type).toBe('image/png');
  expect(f.attributes.width).toBe(4752);
  expect(f.attributes.height).toBe(composition === 'bar' ? 951 : 3121);
  const box = f.attributes.viewBox.split(' ').map(Number);
  expect(box.slice(0, 2)).toEqual([-20, composition === 'bar' ? 112.4885 : -20]);
  expect(box[2] * snapshot.dimensions.scale).toBeCloseTo(4752);
  expect(box[3] * snapshot.dimensions.scale).toBeCloseTo(f.attributes.height);
  expect(f.canvas).toMatchObject({ width: 0, height: 0 });
  expect(f.image().src).toBe(''); expect(f.revokeObjectURL).toHaveBeenCalledWith('blob:raster-test');
});

test.each([{ context: false }, { blob: null }, { blob: new Blob(['wrong'], { type: 'image/jpeg' }) }])('failed PNG offers smaller-file recovery and frees resources: %j', async settings => {
  const f = fixture(settings);
  await expect(f.r.createRasterExportBlob(f.r.captureLogoExportSnapshot(), new AbortController().signal)).rejects.toThrow(/Smaller file/);
  expect(f.canvas).toMatchObject({ width: 0, height: 0 });
  expect(f.image().src).toBe(''); expect(f.revokeObjectURL).toHaveBeenCalledTimes(1);
});

test('cancelling during decode releases resources and never encodes a PNG', async () => {
  let release;
  const f = fixture({ decode: () => new Promise(resolve => { release = resolve; }) });
  const controller = new AbortController();
  const pending = f.r.createRasterExportBlob(f.r.captureLogoExportSnapshot(), controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(f.canvas).toMatchObject({ width: 0, height: 0 });
  expect(f.canvas.toBlob).not.toHaveBeenCalled(); expect(f.revokeObjectURL).toHaveBeenCalledTimes(1);
  release();
});
