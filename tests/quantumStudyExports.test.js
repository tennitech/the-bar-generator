const { createRuntime } = require('./helpers/exportCompositionRuntime');
const model = require('../js/utils/quantumStudyModel');
const { createQuantumStudyPatternGeometry } = require('../js/utils/barPattern');
const loops = require('../js/utils/loopingGif');
const gif = require('../js/utils/transparentGif');

function setup(style, composition) {
  const calls = [];
  const ctx = Object.fromEntries(['setTransform', 'clearRect', 'save', 'scale', 'translate', 'beginPath', 'rect', 'clip', 'fillRect', 'restore', 'moveTo', 'lineTo', 'closePath', 'fill']
    .map(name => [name, (...args) => calls.push([name, ...args])]));
  ctx.getImageData = () => ({ width: 1160, height: 232 });
  const canvas = { getContext: () => ctx };
  const values = { ...model.normalize('well'), ...model.normalize('rabi'),
    wellPhase: .37123456789, rabiPhase: .28345678901, wellSpeed: .2, rabiSpeed: .2, wellReverse: true, rabiReverse: true };
  const r = createRuntime({ quantumStudyModel: model, quantumStudyControls: { values: () => values },
    getLoopRuntimeValues: () => values, Path2D: class { constructor(d) { this.d = d; } } });
  r.document.createElement = () => canvas;
  r.currentShader = style === 'well-modes' ? 26 : 27;
  r.styleSelect.value = style;
  r.state.values = values;
  Object.assign(r.state, { composition, size: 'standard' });
  return { r, calls, canvas, values };
}

test.each(['well-modes', 'rabi'])('%s plans capture full speed range, reverse and phase within encoder budget', style => {
  const prefix = style === 'well-modes' ? 'well' : 'rabi';
  expect(loops.isLoopingGifEligibleStyle(style)).toBe(true);
  for (const speed of [.2, .5, 1, 1.237, 4]) for (const reverse of [false, true]) {
    const phase = .37123456789;
    const values = { [`${prefix}Speed`]: speed, [`${prefix}Reverse`]: reverse, [`${prefix}Phase`]: phase };
    const plan = loops.getLoopingGifFramePlan(style, values);
    expect(plan.periodSeconds).toBe(8 / speed);
    expect(plan.periodSeconds).toBeLessThanOrEqual(40);
    expect(plan.frameCount).toBeLessThanOrEqual(2000);
    if (speed === .2) expect(plan.frameCount).toBe(2000);
    expect(plan.frameCount).toBeLessThanOrEqual(gif.MAX_CAPTURE_FRAMES);
    expect(plan.getQuantumStudyPhase(0)).toBe(model.normalizePhase(phase));
    expect(plan.getQuantumStudyPhase(.02 / plan.periodSeconds)).toBeCloseTo(model.advancePhase(phase, 20, { speed, reverse }), 12);
    expect(loops.advanceLiveLoopPhase(phase, style, values, 20)).toBeCloseTo(model.advancePhase(phase, 20, { speed, reverse }), 12);
    const timing = gif.frameTiming(plan.periodSeconds, plan.frameCount);
    expect(timing.progress[0]).toBe(0);
    expect(timing.progress.at(-1)).toBeLessThan(1);
    expect(new Set(timing.progress).size).toBe(plan.frameCount);
    expect(Math.min(...timing.delays)).toBeGreaterThanOrEqual(20);
    expect(Math.abs(timing.durationMs - plan.periodSeconds * 1000)).toBeLessThanOrEqual(5);
    const direction = reverse ? -1 : 1;
    expect(model.normalizePhase(plan.getQuantumStudyPhase(timing.progress.at(-1)) + direction * timing.delays.at(-1) / timing.durationMs)).toBeCloseTo(phase, 12);
  }
});

test.each([['well-modes', 'bar'], ['well-modes', 'logo'], ['rabi', 'bar'], ['rabi', 'logo']])('%s %s captures current phase and rasterizes exact shared SVG polygons', (style, composition) => {
  const { r, calls, canvas, values } = setup(style, composition);
  const prefix = style === 'well-modes' ? 'well' : 'rabi';
  const snapshot = r.captureLogoExportSnapshot({ format: 'gif' });
  const still = r.captureLogoExportSnapshot();
  expect(snapshot.values[`${prefix}Phase`]).toBe(values[`${prefix}Phase`]);
  expect(still.values[`${prefix}Phase`]).toBe(values[`${prefix}Phase`]);
  expect(Object.isFrozen(snapshot.values)).toBe(true);
  const capturedPhase = values[`${prefix}Phase`];
  values[`${prefix}Phase`] = .9;
  values[`${prefix}Speed`] = 4;
  values[`${prefix}Reverse`] = false;
  const plan = loops.getLoopingGifFramePlan(snapshot.family, snapshot.values);
  expect(plan.periodSeconds).toBe(40);
  expect(plan.getQuantumStudyPhase(0)).toBeCloseTo(capturedPhase, 12);
  const renderer = r.createCapturedGifRenderer(snapshot, plan);
  for (const progress of [0, .037, .5, .9995]) {
    calls.length = 0;
    renderer.renderFrame(0, progress);
    const expected = createQuantumStudyPatternGeometry({ ...snapshot.values, currentShader: snapshot.currentShader,
      barStartX: 0, barY: 132.4885, exactBarWidth: 250, barHeight: 18, [`${prefix}Phase`]: plan.getQuantumStudyPhase(progress) });
    const points = calls.filter(([name]) => ['moveTo', 'lineTo'].includes(name)).map(([, x, y]) => ({ x, y }));
    expect(points).toEqual(expected.polygons.flat());
    expect(calls.filter(([name]) => name === 'closePath')).toHaveLength(expected.polygons.length);
    expect(calls).toContainEqual(['rect', 0, 132.4885, 250, 18]);
    expect(calls).toContainEqual(['translate', 20, composition === 'bar' ? -112.4885 : 20]);
  }
  renderer.release();
  expect(canvas.width).toBe(0);
  expect(values[`${prefix}Phase`]).toBe(.9);
});
