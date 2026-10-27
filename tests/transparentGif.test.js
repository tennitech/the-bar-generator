const { createPalette, frameTiming, preparePixels } = require('../js/utils/transparentGif');

test('reserves a distinct transparent color even when the ink matches the usual key', () => {
  for (const ink of [[0, 0, 0], [255, 255, 255], [214, 0, 28], [255, 0, 255]]) {
    const palette = createPalette(ink);
    expect(palette.key).not.toEqual(ink);
    expect(palette.globalPalette.slice(3)).toEqual(ink);
    expect(palette.transparent).toBe((palette.key[0] << 16) | (palette.key[1] << 8) | palette.key[2]);
  }
});

test('binary alpha uses exact un-matted ink and preserves half-pixel coverage spatially', async () => {
  const palette = createPalette([255, 255, 255]);
  const data = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([12, 20, 30, 128], i);
  await preparePixels({ data, width: 4, height: 4 }, palette);
  let ink = 0, transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pixel = [...data.slice(i, i + 3)];
    if (pixel.every((value, c) => value === palette.foreground[c])) ink++;
    else { expect(pixel).toEqual(palette.key); transparent++; }
  }
  expect(ink).toBe(8); expect(transparent).toBe(8);
});

test('fully transparent and fully opaque pixels never become a matte or wrong transparent index', async () => {
  const palette = createPalette([214, 0, 28]);
  const data = new Uint8ClampedArray([0, 0, 0, 0, 90, 80, 70, 255]);
  await preparePixels({ data, width: 2, height: 1 }, palette);
  expect([...data.slice(0, 3)]).toEqual(palette.key);
  expect([...data.slice(4, 7)]).toEqual([214, 0, 28]);
});

test('centisecond timing preserves complete loop duration and uses actual elapsed-time phases', () => {
  for (const [period, count] of [[1, 24], [5, 72], [0.2, 10], [1 / 3, 16]]) {
    const result = frameTiming(period, count);
    expect(Math.abs(result.durationMs - period * 1000)).toBeLessThanOrEqual(5);
    expect(result.delays.reduce((sum, value) => sum + value, 0)).toBe(result.durationMs);
    let elapsed = 0;
    result.delays.forEach((delay, i) => {
      expect(delay).toBeGreaterThanOrEqual(20); expect(delay % 10).toBe(0);
      expect(result.progress[i]).toBeCloseTo(elapsed / result.durationMs, 12); elapsed += delay;
    });
  }
  expect(frameTiming(1, 24).durationMs).toBe(1000); // old per-frame rounding produced960ms
  expect(frameTiming(5, 72).durationMs).toBe(5000); // old per-frame rounding produced5040ms
});

test('cancellation is observed before a prepared frame is delivered', async () => {
  const controller = new AbortController(); controller.abort();
  await expect(preparePixels({ data: new Uint8ClampedArray(4), width: 1, height: 1 }, createPalette([0, 0, 0]),
    { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
});

test('actual vendored palette encoder preserves moving transparent pixels and disposal on every frame', async () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const { parseGif, decodeFrames } = require('./helpers/gifDecoder');
  const worker = { postMessage: value => { worker.result = value; } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../third_party/gif.js/gif.worker.js'), 'utf8'),
    { self: worker, Uint8Array, Uint8ClampedArray, Int32Array, Float64Array, ArrayBuffer, console });
  for (const foreground of [[0, 0, 0], [255, 255, 255], [214, 0, 28]]) {
    const palette = createPalette(foreground), parts = [];
    for (let frame = 0; frame < 3; frame++) {
      const data = new Uint8ClampedArray(6 * 3 * 4);
      const x = frame * 2;
      for (let y = 0; y < 3; y++) data.set([...foreground, 255], (y * 6 + x) * 4);
      await preparePixels({ data, width: 6, height: 3 }, palette);
      worker.onmessage({ data: { index: frame, last: frame === 2, data, width: 6, height: 3,
        transparent: palette.transparent, globalPalette: palette.globalPalette, delay: 40, quality: 1, dither: false, repeat: 0, canTransfer: false } });
      const encoded = worker.result;
      parts.push(...encoded.data.map((page, i) => Buffer.from(i === encoded.data.length - 1 ? page.subarray(0, encoded.cursor) : page)));
    }
    const gif = parseGif(Buffer.concat(parts));
    expect(gif.frames).toHaveLength(3);
    let index = 0;
    for (const decoded of decodeFrames(gif)) {
      expect(decoded.frame).toMatchObject({ transparent: true, transparentIndex: 0, disposal: 2, delayMs: 40 });
      expect([...decoded.frame.palette.subarray(3, 6)]).toEqual(foreground);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) {
        const pixel = [...decoded.rgba.subarray((y * 6 + x) * 4, (y * 6 + x) * 4 + 4)];
        expect(pixel).toEqual(x === index * 2 ? [...foreground, 255] : [0, 0, 0, 0]);
      }
      index++;
    }
  }
});

function installCodecWorker(options = {}) {
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require.resolve('../third_party/gif.js/gif.worker.js'), 'utf8');
  const instances = [], previous = global.Worker;
  global.Worker = class {
    constructor() {
      this.terminated = false; instances.push(this);
      const self = { postMessage: value => { this.output = value; } };
      vm.runInNewContext(source, { self, Uint8Array, Uint8ClampedArray, Int32Array, Float64Array, ArrayBuffer, console });
      this.worker = self;
    }
    postMessage(message, transfers) {
      const task = structuredClone(message, { transfer: transfers });
      this.timer = setTimeout(() => {
        if (this.terminated) return;
        if (options.fail) this.onerror?.({ preventDefault() {} });
        else { this.worker.onmessage({ data: task }); this.onmessage?.({ data: this.output }); }
      }, options.delay || (task.index === 0 ? 6 : 1));
    }
    terminate() { this.terminated = true; clearTimeout(this.timer); }
  };
  return { instances, restore() { if (previous === undefined) delete global.Worker; else global.Worker = previous; } };
}

function smallFrame(index) {
  const data = new Uint8ClampedArray(24 * 12 * 4);
  data.set([255, 255, 255, 255], index * 4);
  return { data, width: 24, height: 12 };
}

test('streaming uses at most two transferred frames and joins out-of-order encoded chunks correctly', async () => {
  const { encode } = require('../js/utils/transparentGif');
  const { parseGif, decodeFrames } = require('./helpers/gifDecoder');
  const workers = installCodecWorker(), progress = [], inputBuffers = [];
  try {
    const result = await encode({ width: 24, height: 12, frameCount: 8, periodSeconds: 0.32,
      foreground: [255, 255, 255], workerScript: 'vendored-worker', onProgress: value => progress.push(value),
      renderFrame: index => { const image = smallFrame(index); inputBuffers.push(image.data.buffer); return image; } });
    expect(workers.instances).toHaveLength(2);
    expect(workers.instances.every(worker => worker.terminated)).toBe(true);
    expect(inputBuffers.every(buffer => buffer.byteLength === 0)).toBe(true);
    expect(result.metrics.peakInFlight).toBeLessThanOrEqual(2);
    expect(progress.at(-1)).toEqual({ prepared: 8, encoded: 8, total: 8 });
    const gif = parseGif(Buffer.from(await result.blob.arrayBuffer()));
    let index = 0;
    for (const decoded of decodeFrames(gif)) {
      expect(decoded.rgba[index * 4 + 3]).toBe(255);
      expect(decoded.rgba.filter((value, i) => i % 4 === 3 && value > 0)).toHaveLength(1);
      index++;
    }
    expect(index).toBe(8);
  } finally { workers.restore(); }
});

test('cancellation and worker errors terminate every encoder and reject rather than emitting a broken GIF', async () => {
  const { encode } = require('../js/utils/transparentGif');
  for (const fail of [false, true]) {
    const workers = installCodecWorker({ fail, delay: 5 }), controller = new AbortController();
    try {
      const task = encode({ width: 24, height: 12, frameCount: 8, periodSeconds: 0.32,
        foreground: [0, 0, 0], workerScript: 'vendored-worker', signal: controller.signal,
        onProgress(value) { if (!fail && value.prepared === 1) controller.abort(); }, renderFrame: smallFrame });
      await expect(task).rejects.toMatchObject(fail ? { message: expect.stringMatching(/could not finish/) } : { name: 'AbortError' });
      expect(workers.instances.every(worker => worker.terminated)).toBe(true);
    } finally { workers.restore(); }
  }
});

test('invalid frame size is rejected before allocating workers or registering cancellation handlers', async () => {
  const { encode } = require('../js/utils/transparentGif');
  const signal = { addEventListener: jest.fn(), removeEventListener: jest.fn() };
  await expect(encode({ width: 65536, height: 1, frameCount: 2, periodSeconds: 1,
    foreground: [0, 0, 0], signal })).rejects.toThrow('Invalid GIF frame dimensions');
  expect(signal.addEventListener).not.toHaveBeenCalled();
  const workers = installCodecWorker();
  try {
    await expect(encode({ width: 24, height: 12, frameCount: 2, periodSeconds: 1,
      foreground: [0, 0, 0], renderFrame: () => smallFrame(0).data,
      workerScript: 'vendored-worker' })).rejects.toThrow('GIF frame dimensions changed');
    expect(workers.instances.every(worker => worker.terminated)).toBe(true);
  } finally { workers.restore(); }
});
