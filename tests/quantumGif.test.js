const vm = require('node:vm');
const { createRuntime, read } = require('./helpers/exportCompositionRuntime');
const model = require('../js/utils/quantumModel');
const { createWaveQuantumPatternGeometry } = require('../js/utils/barPattern');
const loops = require('../js/utils/loopingGif');
const gif = require('../js/utils/transparentGif');

function setup() {
  const calls = [];
  const ctx = Object.fromEntries(['setTransform', 'clearRect', 'save', 'scale', 'translate', 'beginPath', 'rect', 'clip', 'fillRect', 'restore', 'moveTo', 'lineTo', 'closePath', 'fill']
    .map(name => [name, (...args) => calls.push([name, ...args])]));
  ctx.getImageData = () => ({ width: 1160, height: 232 });
  const canvas = { getContext: () => ctx };
  const r = createRuntime({ Path2D: class { constructor(d) { this.d = d; } } });
  r.document.createElement = () => canvas;
  const elements = { 'quantum-speed-slider': { value: '4' }, 'quantum-reverse-toggle': { checked: false } };
  r.document.getElementById = id => elements[id];
  const main = read('js/main.js');
  // Exercise the real speed/direction collector with neighboring controls absent.
  for (const name of ['gradientSpeedSlider', 'gradientReverseToggle', 'rulerRepeatsSlider', 'rulerDivisionsSelect', 'rulerThicknessSlider', 'tickerSlider', 'tickerRatioSlider', 'tickerWidthRatioSlider', 'tickerSpeedSlider', 'tickerReverseToggle', 'waveformSpeedSlider', 'waveformReverseToggle']) r[name] = null;
  r.normalizeLoopSpeed = loops.normalizeLoopSpeed;
  vm.runInContext(main.slice(main.indexOf('function getLoopRuntimeValues('), main.indexOf('function isMotionEnabledForStyle(')), r);
  r.loopingGifUtils = loops;
  r.select('wave-quantum');
  Object.assign(r.state, { composition: 'bar', size: 'standard' });
  r.state.values.quantumPhase = 0.37123456789;
  return { r, calls, canvas, elements };
}

test.each([false, true])('ring frame plan matches current live rate/direction and exact phase (%s)', reverse => {
  expect(loops.isLoopingGifEligibleStyle('wave-quantum')).toBe(true);
  for (const speed of [0.2, 1, 1.2, 1.237, 2, 4]) {
    const phase = 0.37123456789;
    const plan = loops.getLoopingGifFramePlan('wave-quantum', { quantumSpeed: speed, quantumReverse: reverse, quantumPhase: phase });
    expect(plan.periodSeconds).toBe(model.PERIOD_SECONDS / speed);
    expect(plan.getQuantumPhase(0)).toBe(model.normalizePhase(phase));
    expect(plan.getQuantumPhase(0.02 / plan.periodSeconds)).toBeCloseTo(model.advancePhase(phase, 20, { speed, reverse }), 12);
    expect(plan.getQuantumPhase(1)).toBeCloseTo(phase, 12);
    const timing = gif.frameTiming(plan.periodSeconds, plan.frameCount);
    expect(Math.abs(timing.durationMs - plan.periodSeconds * 1000)).toBeLessThanOrEqual(5);
    expect(Math.abs(plan.frameCount - timing.durationMs * 0.05)).toBeLessThanOrEqual(1);
    expect(Math.min(...timing.delays)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...timing.delays)).toBeLessThanOrEqual(30);
    // An incomplete final frame must leave one ordinary time step to the seam.
    const last = timing.progress.at(-1), lastDelay = timing.delays.at(-1);
    const delta = reverse ? -1 : 1;
    expect(model.normalizePhase(plan.getQuantumPhase(last) + delta * lastDelay / timing.durationMs)).toBeCloseTo(phase, 12);
  }
});

test('GIF freezes the current phase, model speed, direction, theme, size and composition before yielding', async () => {
  const { r, elements } = setup();
  elements['quantum-reverse-toggle'].checked = true;
  r.currentColorMode = 'white';
  const still = r.captureLogoExportSnapshot();
  expect(still.values.quantumPhase).toBe(0);
  const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
  expect(snapshot.values).toMatchObject({ quantumPhase: model.normalizePhase(0.37123456789), quantumSpeed: 4, quantumReverse: true });
  const finished = jest.fn(), describe = jest.fn();
  r.document.getElementById = id => elements[id] || { classList: { contains: () => false } };
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }), describe, ready() {}, message() {}, report() {}, finish: finished };
  r.loopingGifUtils = loops;
  const blob = new Blob(['GIF'], { type: 'image/gif' });
  r.transparentGifUtils = { ...gif, encode: jest.fn(async request => {
    expect(request).toMatchObject({ width: 1160, height: 232, foreground: [255, 255, 255], periodSeconds: 1.07, frameCount: 53 });
    request.renderFrame(0, 0);
    return { blob, metrics: {} };
  }) };
  r.startLogoDownload = jest.fn();
  const pending = r.saveLoopingGIF();
  elements['quantum-speed-slider'].value = '.2'; elements['quantum-reverse-toggle'].checked = false;
  r.state.values.quantumPhase = 0.9; r.state.size = 'large'; r.state.composition = 'logo'; r.currentColorMode = 'black';
  const result = await pending;
  expect(describe.mock.calls[0][1]).toMatchObject({ values: snapshot.values, composition: 'bar', foreground: '#ffffff' });
  expect(result.filename).toContain('wave-quantum');
  expect(r.startLogoDownload).toHaveBeenCalledWith(blob, result.filename);
  expect(finished).toHaveBeenCalledWith(expect.anything(), 'requested', 'GIF download requested.');
  expect(r.state.values.quantumPhase).toBe(0.9); // Export never seeks or pauses live controls.
});

test.each(['bar', 'logo'])('GIF draws the same three fixed model polygons at the captured %s viewport', composition => {
  const { r, calls, canvas } = setup();
  r.state.composition = composition;
  const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
  const plan = loops.getLoopingGifFramePlan(snapshot.family, snapshot.values);
  const renderer = r.createCapturedGifRenderer(snapshot, plan);
  for (const progress of [0, 0.037, 0.5, 0.999, 1]) {
    calls.length = 0; renderer.renderFrame(0, progress);
    const expected = createWaveQuantumPatternGeometry({ barStartX: 0, barY: 132.4885, exactBarWidth: 250, barHeight: 18, quantumPhase: plan.getQuantumPhase(progress) });
    const points = calls.filter(([name]) => ['moveTo', 'lineTo'].includes(name)).map(([, x, y]) => ({ x, y }));
    expect(points).toEqual(expected.polygons.flat());
    expect(calls.filter(([name]) => name === 'closePath')).toHaveLength(3);
    expect(calls).toContainEqual(['rect', 0, 132.4885, 250, 18]);
    expect(calls).toContainEqual(['translate', 20, composition === 'bar' ? -112.4885 : 20]);
  }
  renderer.release(); expect(canvas.width).toBe(0);
});

test('all supported speeds retain their full cycle inside encoder budgets', () => {
  for (const speed of [.2, .5, 1, 4]) {
    const plan = loops.getLoopingGifFramePlan('wave-quantum', { quantumSpeed: speed });
    expect(plan.periodSeconds).toBeLessThanOrEqual(21.4);
    expect(plan.frameCount).toBeLessThanOrEqual(1070);
    expect(gif.frameTiming(plan.periodSeconds, plan.frameCount).delays.every(delay => delay >= 20)).toBe(true);
  }
});

test('GIF eligibility does not make the shared transport use a different ring phase rule', () => {
  for (const reverse of [false, true]) {
    const values = { quantumSpeed: 1.237, quantumReverse: reverse, quantumPhase: 0.371 };
    expect(loops.advanceLiveLoopPhase(0.371, 'wave-quantum', values, 50)).toBe(model.advancePhase(0.371, 50, { speed: 1.237, reverse }));
    expect(loops.getLoopSpeed('wave-quantum', values)).toBe(1.237 / model.PERIOD_SECONDS);
    expect(loops.getLoopReverse('wave-quantum', values)).toBe(reverse);
    expect(loops.getLoopingAnimationState('wave-quantum', values, { phase: 0.731 }).quantumPhase).toBe(model.normalizePhase(0.731));
  }
});

test('the existing native GIF action is visible for the legacy ring style', () => {
  const { r } = setup(); r.GIF = function () {}; r.loopingGifUtils = loops; r.saveLoopGifButton = { hidden: true };
  const main = read('js/main.js');
  vm.runInContext(main.slice(main.indexOf('function updateLoopingGifSaveOption('), main.indexOf('function syncSidebarToggleState(')), r);
  r.updateLoopingGifSaveOption(); expect(r.saveLoopGifButton.hidden).toBe(false);
});


test.each(['logo', 'bar'])('default 1× GIF preserves %s composition, actual phase and honest resolution policy', composition => {
  const { r, elements } = setup(); elements['quantum-speed-slider'].value = '1';
  Object.assign(r.state, { composition, size: 'large' });
  const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
  const plan = loops.getLoopingGifFramePlan(snapshot.family, snapshot.values);
  expect(plan).toMatchObject({ periodSeconds: 4.28, frameCount: 214 });
  expect(snapshot.values.quantumSpeed).toBe(1);
  expect(snapshot.values.quantumPhase).toBe(model.normalizePhase(0.37123456789));
  expect(snapshot.composition).toBe(composition);
  expect(snapshot.dimensions.width).toBe(2320);
  expect(snapshot.gifPolicy).toMatchObject({ supported: true, requestedSize: 'large', size: 'large' });
  expect(Object.isFrozen(snapshot.gifPolicy)).toBe(true);
  expect(r.state.size).toBe('large'); expect(elements['quantum-speed-slider'].value).toBe('1');
  expect(r.captureLogoExportSnapshot().dimensions.width).toBe(2320); // PNG/SVG selection stays Large.
});

test('ring retains requested resolution and supports every speed', () => {
  for (const speed of [.2, 1, 4]) for (const composition of ['logo', 'bar']) {
    expect(loops.getRingGifExportPolicy({ quantumSpeed: speed }, { size: 'large', composition })).toMatchObject({ supported: true, size: 'large', note: '' });
  }
});

test.each(['logo', 'bar'])('default %s download forwards the short cycle and captured actual dimensions', async composition => {
  const { r, elements } = setup(); elements['quantum-speed-slider'].value = '1';
  Object.assign(r.state, { composition, size: 'large' });
  r.document.getElementById = id => elements[id] || { classList: { contains: () => false } };
  const finished = jest.fn();
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }), describe() {}, ready() {}, message() {}, report() {}, finish: finished };
  const blob = new Blob(['GIF'], { type: 'image/gif' });
  r.transparentGifUtils = { ...gif, encode: jest.fn(async request => {
    expect(request).toMatchObject({ style: 'wave-quantum', periodSeconds: 4.28, frameCount: 214,
      width: 2320, height: composition === 'logo' ? 1524 : 464 });
    return { blob, metrics: {} };
  }) };
  r.startLogoDownload = jest.fn();
  const pending = r.saveLoopingGIF();
  elements['quantum-speed-slider'].value = '4'; r.state.values.quantumPhase = 0.8;
  r.state.composition = composition === 'bar' ? 'logo' : 'bar'; r.state.size = 'standard';
  const result = await pending;
  expect(result.filename).toContain(composition === 'logo' ? '2320x1524' : '2320x464');
  expect(r.startLogoDownload).toHaveBeenCalledWith(blob, result.filename);
  expect(finished).toHaveBeenCalledWith(expect.anything(), 'requested', 'GIF download requested.');
  expect(elements['quantum-speed-slider'].value).toBe('4');
});


test('the ring uses uniform 50 fps for its exact default cycle', () => {
  expect(loops.DEFAULT_CAPTURE_FPS).toBe(50);
  for (const options of [{}, { fps: 50 }]) {
    const plan = loops.getLoopingGifFramePlan('wave-quantum', { quantumSpeed: 1 }, options);
    expect(plan).toMatchObject({ periodSeconds: 4.28, frameCount: 214 });
    expect(new Set(gif.frameTiming(plan.periodSeconds, plan.frameCount).delays)).toEqual(new Set([20]));
  }
  const ticker = loops.getLoopingGifFramePlan('ticker', { tickerSpeed: .4 });
  expect(ticker.frameCount).toBe(125);
});
