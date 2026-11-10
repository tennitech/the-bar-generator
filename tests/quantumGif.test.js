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
    expect(plan.periodSeconds).toBe(120 / speed);
    expect(plan.getQuantumPhase(0)).toBe(model.normalizePhase(phase));
    expect(plan.getQuantumPhase(0.02 / plan.periodSeconds)).toBeCloseTo(model.advancePhase(phase, 20, { speed, reverse }), 12);
    expect(plan.getQuantumPhase(1)).toBeCloseTo(phase, 12);
    const timing = gif.frameTiming(plan.periodSeconds, plan.frameCount);
    expect(Math.abs(timing.durationMs - plan.periodSeconds * 1000)).toBeLessThanOrEqual(5);
    expect(Math.abs(plan.frameCount - timing.durationMs * 0.03)).toBeLessThanOrEqual(0.5);
    expect(new Set(timing.delays)).toEqual(new Set([30, 40]));
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
    expect(request).toMatchObject({ width: 1160, height: 232, foreground: [255, 255, 255], periodSeconds: 30, frameCount: 900 });
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

test('long natural ring loops retain encoder limits and fail before rendering, without speeding up or shortening', async () => {
  const { r, elements } = setup(); elements['quantum-speed-slider'].value = '1';
  const finish = jest.fn();
  r.document.getElementById = id => elements[id] || { classList: { contains: () => false } };
  r.logoExportUI = { ...r.logoExportUI, begin: () => ({ controller: new AbortController() }), describe() {}, message() {}, finish };
  r.loopingGifUtils = loops; r.transparentGifUtils = gif; r.console.error = jest.fn();
  r.createCapturedGifRenderer = jest.fn(); r.startLogoDownload = jest.fn();
  expect(await r.saveLoopingGIF()).toBeNull();
  expect(finish).toHaveBeenCalledWith(expect.anything(), 'error', expect.stringContaining('Set SPEED to 1.2× or higher'));
  expect(r.createCapturedGifRenderer).not.toHaveBeenCalled(); expect(r.startLogoDownload).not.toHaveBeenCalled();
  expect(elements['quantum-speed-slider'].value).toBe('1');
  const plan = loops.getLoopingGifFramePlan('wave-quantum', { quantumSpeed: 1 });
  await expect(gif.encode({ width: 1, height: 1, frameCount: plan.frameCount, periodSeconds: plan.periodSeconds })).rejects.toThrow(/limit/);
});


test('GIF eligibility does not make the shared transport use a different ring phase rule', () => {
  for (const reverse of [false, true]) {
    const values = { quantumSpeed: 1.237, quantumReverse: reverse, quantumPhase: 0.371 };
    expect(loops.advanceLiveLoopPhase(0.371, 'wave-quantum', values, 50)).toBe(model.advancePhase(0.371, 50, { speed: 1.237, reverse }));
    expect(loops.getLoopSpeed('wave-quantum', values)).toBe(1.237 / 120);
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
