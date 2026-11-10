const vm = require('node:vm');
const { createRuntime, shaders, read } = require('./helpers/exportCompositionRuntime');
const options = require('../js/utils/exportOptions');
const geometry = require('../js/utils/logoGeometry').RPI_LOGO_GEOMETRY;

test('both compositions retain identical current bar content for every selectable family and ink', () => {
  const r = createRuntime();
  for (const family of Object.keys(shaders)) for (const ink of Object.keys(require('../js/utils/themeMode').COLOR_SCHEMES)) {
    r.select(family); r.currentColorMode = ink;
    r.state.composition = 'logo'; const logo = r.captureLogoExportSnapshot();
    r.state.composition = 'bar'; const bar = r.captureLogoExportSnapshot();
    for (const path of Object.values(geometry.paths)) {
      expect(logo.svgSource).toContain(`d="${path}"`);
      expect(bar.svgSource).not.toContain(`d="${path}"`);
    }
    // Remove only title, root viewport and the official letters: the complete
    // selected pattern fragment (including nested artwork and clips) is identical.
    const content = source => source.slice(source.indexOf('</title>') + 8, -6);
    const letters = Object.values(geometry.paths).map(path => `<path d="${path}" fill="${logo.foreground}"/>`).join('');
    expect(content(logo.svgSource)).toBe(letters + content(bar.svgSource));
    expect(bar.svgSource).not.toMatch(/NaN|undefined/);
    expect(bar.values).toEqual(logo.values);
    expect(bar.values).toMatchObject({ loopOffsetX: 0, timeSeconds: 0, quantumPhase: 0 });
    expect(bar.dimensions).toMatchObject({ width: 2320, height: 464 });
    expect(logo.dimensions).toMatchObject({ width: 2320, height: 1524 });
  }
});

test('a request freezes composition, viewport, size, data and ink before asynchronous preparation', () => {
  const r = createRuntime(); r.select('triangles'); r.state.composition = 'bar'; r.state.size = 'standard';
  const snapshot = r.captureLogoExportSnapshot();
  r.state.composition = 'logo'; r.state.size = 'large'; r.currentColorMode = 'red';
  r.state.values.trianglesCount = 7; r.state.title = 'Changed';
  expect(snapshot).toMatchObject({ composition: 'bar', foreground: '#000000',
    title: 'Test <bar> & RPI', values: { trianglesCount: 23 }, dimensions: { width: 1160, height: 232 } });
  expect(snapshot.svgSource).toContain('<title>Test &lt;bar&gt; &amp; RPI</title>');
  for (const value of [snapshot, snapshot.values, snapshot.viewport, snapshot.dimensions]) expect(Object.isFrozen(value)).toBe(true);
  expect(r.captureLogoExportSnapshot()).toMatchObject({ composition: 'logo', foreground: '#d6001c' });
});

test.each(['logo', 'bar'])('empty/blocked encoded content still rejects %s exports', composition => {
  const r = createRuntime(); r.state.composition = composition;
  r.select('numeric'); r.state.values.numericValue = '000'; r.state.values.numericMode = 'dotmatrix';
  expect(() => r.captureLogoExportSnapshot()).toThrow(/no visible bar/);
  r.select('nucleotide'); r.state.values.nucleotideSequence = 'ATG';
  expect(() => r.captureLogoExportSnapshot()).toThrow(/Add 27 bases/);
  r.select('binary'); r.state.values.binaryText = '****';
  expect(() => r.captureLogoExportSnapshot()).toThrow(/no visible bar/);
});

test.each(['logo', 'bar'])('GIF draws %s at the selected viewport with current controls on every frame', composition => {
  const calls = [];
  const ctx = Object.fromEntries(['setTransform', 'clearRect', 'save', 'scale', 'translate', 'beginPath', 'rect', 'clip', 'fillRect', 'restore']
    .map(name => [name, (...args) => calls.push([name, ...args])]));
  ctx.fill = path => calls.push(['fill', path.d]);
  ctx.getImageData = () => 'frame';
  const canvas = { getContext: () => ctx };
  const r = createRuntime({ Path2D: class { constructor(d) { this.d = d; } }, document: { querySelector: () => null, createElement: () => canvas } });
  r.select('ticker'); r.state.composition = composition;
  const snapshot = r.captureLogoExportSnapshot();
  const plan = { getLoopOffsetX: p => p * 7, getTimeSeconds: p => p * 2 };
  const renderer = r.createCapturedGifRenderer(snapshot, plan);
  for (const progress of [0, 0.3, 0.9]) {
    calls.length = 0; expect(renderer.renderFrame(0, progress)).toBe('frame');
    expect(calls.filter(([name]) => name === 'fill')).toHaveLength(composition === 'bar' ? 0 : 3);
    expect(calls).toContainEqual(['translate', 20, composition === 'bar' ? -112.4885 : 20]);
    expect(calls).toContainEqual(['rect', 0, 132.4885, 250, 18]);
    expect(calls.some(([name]) => name === 'fillRect')).toBe(true);
  }
  expect(canvas).toMatchObject({ width: 2320, height: composition === 'bar' ? 464 : 1524 });
  renderer.release(); expect(canvas).toMatchObject({ width: 0, height: 0 });
});

test.each(['svg', 'png'])('clipboard %s shares the selected frozen export and keeps native MIME', async format => {
  const elements = { 'export-cancel': {}, 'export-message': { focus() {} }, 'save-menu': { classList: { contains: () => false } } };
  const r = createRuntime(); r.select('waveform'); r.state.composition = 'bar';
  r.document.getElementById = id => elements[id];
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }), describe() {}, ready() {}, message() {}, finish() {} };
  let captured, written, synchronous = false;
  r.createRasterExportBlob = async snapshot => { captured = snapshot; return new Blob(['PNG'], { type: 'image/png' }); };
  r.isSecureContext = true;
  r.ClipboardItem = class { static supports() { return true; } constructor(data) { this.data = data; } };
  r.navigator = { clipboard: { write: async items => { synchronous = true; written = await Promise.all(Object.values(items[0].data)); } } };
  vm.runInContext(read('js/utils/logoClipboard.js'), r);
  const pending = r.logoClipboard.copy(format);
  expect(synchronous).toBe(true);
  r.state.composition = 'logo'; r.state.values.waveformFrequency = 3;
  const result = await pending;
  expect(result).toMatchObject({ mime: format === 'svg' ? 'image/svg+xml' : 'image/png' });
  expect(written[0].type).toBe(result.mime);
  if (format === 'svg') {
    const xml = await written[0].text();
    expect(xml).toContain('viewBox="-20 112.4885 290 58"');
    expect(xml).not.toContain(geometry.paths.r);
  } else expect(captured).toMatchObject({ composition: 'bar', dimensions: { width: 2320, height: 464 }, values: { waveformFrequency: 17 } });
});

test('composition choices have native radio semantics, visible labels and hidden diagrams', () => {
  const html = read('generator/index.html');
  expect(html).toContain('<legend class="export_size-label">Export composition</legend>');
  for (const value of ['logo', 'bar']) {
    expect(html).toContain(`id="export-composition-${value}" type="radio" name="export-composition"`);
    expect(html).toContain(`id="export-composition-preview-${value}"`);
  }
  expect(html).toContain('class="export_composition-art" aria-hidden="true"');
  expect(options.dimensions('large', geometry)).toEqual(options.dimensions('large', geometry, 'logo'));
});

test.each(['ticker', 'waveform', 'gradient'])('%s bar-only GIF remains offered and uses the download-request path', async family => {
  const fills = [];
  const ctx = Object.fromEntries(['setTransform', 'clearRect', 'save', 'scale', 'translate', 'beginPath', 'rect', 'clip', 'fillRect', 'restore']
    .map(name => [name, () => {}]));
  ctx.fill = path => fills.push(path.d); ctx.getImageData = () => ({ width: 1160, height: 232 });
  const r = createRuntime({ Path2D: class { constructor(d) { this.d = d; } } });
  r.document.createElement = () => ({ getContext: () => ctx });
  r.document.getElementById = () => ({ classList: { contains: () => false } });
  r.select(family); Object.assign(r.state, { composition: 'bar', size: 'standard' });
  const finished = jest.fn();
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }),
    describe() {}, ready() {}, message() {}, report() {}, finish: finished };
  r.loopingGifUtils = require('../js/utils/loopingGif');
  r.saveLoopGifButton = {}; r.GIF = function () {};
  const main = read('js/main.js');
  vm.runInContext(main.slice(main.indexOf('function updateLoopingGifSaveOption('), main.indexOf('function syncSidebarToggleState(')), r);
  r.updateLoopingGifSaveOption(); expect(r.saveLoopGifButton.hidden).toBe(false);
  const blob = new Blob(['codec payload'], { type: 'image/gif' });
  r.transparentGifUtils = { encode: jest.fn(async request => {
    expect(request).toMatchObject({ width: 1160, height: 232, foreground: [0, 0, 0] });
    expect(request.frameCount).toBeGreaterThan(1);
    request.renderFrame(0, 0); request.renderFrame(1, 0.5);
    return { blob, metrics: {} };
  }) };
  r.startLogoDownload = jest.fn();
  const result = await r.saveLoopingGIF();
  expect(result.filename).toContain('bar-only'); expect(result.filename).toMatch(/1160x232-loop.*\.gif$/);
  expect(result.metrics).toMatchObject({ width: 1160, height: 232 });
  expect(r.startLogoDownload).toHaveBeenCalledWith(blob, result.filename);
  expect(finished).toHaveBeenCalledWith(expect.anything(), 'requested', 'GIF download requested.');
  for (const path of Object.values(geometry.paths)) expect(fills).not.toContain(path);
});
