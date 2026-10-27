const model = require('../js/utils/quantumModel');
const { createWaveQuantumPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');

test('three-mode probability remains normalized, bounded and periodic', () => {
  for (const phase of [0, 0.0001, 0.125, 0.371, 0.5, 0.999999]) {
    let integral = 0;
    for (let i = 0; i < 2048; i++) {
      const u = i / 2048;
      const state = model.sample(u, phase);
      expect(state.density).toBeGreaterThanOrEqual(0);
      expect(state.density).toBeLessThanOrEqual(3 + 1e-12);
      integral += state.density / 2048;
      // Independent pair-interference formula for momentum modes -4,3,7.
      const rho = 1 + 2 / 3 * (
        Math.cos(2 * Math.PI * (7 * u + 7 * phase)) +
        Math.cos(2 * Math.PI * (11 * u - 33 * phase)) +
        Math.cos(2 * Math.PI * (4 * u - 40 * phase))
      );
      expect(state.density).toBeCloseTo(rho, 10);
    }
    expect(integral).toBeCloseTo(1, 12);
    expect(model.sample(1, phase).re).toBeCloseTo(model.sample(0, phase).re, 12);
    expect(model.sample(1, phase).im).toBeCloseTo(model.sample(0, phase).im, 12);
  }
});

test('state solves the dimensionless free Schrodinger equation numerically', () => {
  const dx = 1e-5, dp = 1e-6;
  for (const u of [0.03, 0.17, 0.43, 0.81]) {
    const p = 0.137;
    const c = model.sample(u, p), xp = model.sample(u + dx, p), xm = model.sample(u - dx, p);
    const tp = model.sample(u, p + dp), tm = model.sample(u, p - dp);
    const temporalRe = -(tp.im - tm.im) / (2 * dp * 2 * Math.PI);
    const temporalIm = (tp.re - tm.re) / (2 * dp * 2 * Math.PI);
    const spatialRe = -(xp.re - 2 * c.re + xm.re) / (dx * dx * (2 * Math.PI) ** 2);
    const spatialIm = -(xp.im - 2 * c.im + xm.im) / (dx * dx * (2 * Math.PI) ** 2);
    expect(temporalRe).toBeCloseTo(spatialRe, 4);
    expect(temporalIm).toBeCloseTo(spatialIm, 4);
  }
});

test('each occupied momentum mode has weight one third and exact n-squared phase evolution', () => {
  for (const n of model.MODES) {
    for (const phase of [0, 0.013, 0.137]) {
      let re = 0, im = 0;
      for (let i = 0; i < 1024; i++) {
        const u = i / 1024, state = model.sample(u, phase), angle = -2 * Math.PI * n * u;
        re += (state.re * Math.cos(angle) - state.im * Math.sin(angle)) / 1024;
        im += (state.re * Math.sin(angle) + state.im * Math.cos(angle)) / 1024;
      }
      expect(re).toBeCloseTo(Math.cos(-2 * Math.PI * n * n * phase) / Math.sqrt(3), 11);
      expect(im).toBeCloseTo(Math.sin(-2 * Math.PI * n * n * phase) / Math.sqrt(3), 11);
      expect(re * re + im * im).toBeCloseTo(1 / 3, 12);
    }
  }
});

test('projection ribbons keep fixed scale, exact endpoints and bounded paint at all sampled times', () => {
  for (let frame = 0; frame <= 64; frame++) {
    const options = { barStartX: 3, barY: 9, exactBarWidth: 250, barHeight: 18, quantumPhase: frame / 64 };
    const geometry = createWaveQuantumPatternGeometry(options);
    expect(geometry.polygons).toHaveLength(3);
    for (const polygon of geometry.polygons) {
      expect(Math.min(...polygon.map(p => p.x))).toBe(3);
      expect(Math.max(...polygon.map(p => p.x))).toBe(253);
      expect(Math.min(...polygon.map(p => p.y))).toBeGreaterThanOrEqual(9 - 1e-12);
      expect(Math.max(...polygon.map(p => p.y))).toBeLessThanOrEqual(27 + 1e-12);
    }
    const state = model.sample(0, options.quantumPhase);
    expect(geometry.paths[0][0].y).toBeCloseTo(18 - state.re / Math.sqrt(3) * (18 - geometry.thickness) / 2, 12);
    const svg = createBarPatternSVG({ currentShader: 22, ...options, fgColor: '#000', values: options });
    expect((svg.match(/<polygon/g) || []).length).toBe(3);
  }
});

test('obsolete density requests safely map to the single projection visualization', () => {
  const options = { quantumPhase: 0.137 };
  expect(createWaveQuantumPatternGeometry({ ...options, quantumView: 'density' })).toEqual(createWaveQuantumPatternGeometry(options));
  expect(createBarPatternSVG({ currentShader: 22, values: { ...options, quantumView: 'density' } }))
    .toBe(createBarPatternSVG({ currentShader: 22, values: options }));
});

test('speed and reverse change only phase rate, with bounded stalls and deterministic recurrence', () => {
  expect(model.normalizePhase(NaN)).toBe(0);
  expect(model.normalizePhase(-0.25)).toBe(0.75);
  expect(model.normalizeSpeed(Infinity)).toBe(1);
  expect(model.normalizeSpeed(5)).toBe(1);
  expect(model.normalizeSpeed(0)).toBe(.2);
  expect(model.advancePhase(.25, 50, { speed: .5 })).toBeCloseTo(.25 + .5 * .05 / 120, 12);
  expect(model.advancePhase(.25, 50, { speed: .5, reverse: true })).toBeCloseTo(.25 - .5 * .05 / 120, 12);
  expect(model.advancePhase(.99, 5000)).toBe(model.advancePhase(.99, 50));
  expect(model.advancePhase(.25, -50)).toBe(.25);
  expect(model.sample(.413, .37).re).toBeCloseTo(model.sample(.413, 1.37).re, 12);
  expect(model.sample(.413, .37).im).toBeCloseTo(model.sample(.413, 1.37).im, 12);
});

// Hardcoded analytic reference deliberately does not call normalizePhase or use model.MODES.
function unwrappedAnalyticState(position, phase) {
  let re = 0, im = 0;
  for (const n of [-4, 3, 7]) {
    const angle = 2 * Math.PI * (n * position - n * n * phase);
    re += Math.cos(angle) / Math.sqrt(3);
    im += Math.sin(angle) / Math.sqrt(3);
  }
  return { re, im };
}

test('all projection endpoints and ribbon edges match independent non-dyadic analytic samples', () => {
  for (const phase of [.013, .137, .371, .683, .997]) {
    for (const barHeight of [18, 36]) {
      const geometry = createWaveQuantumPatternGeometry({ barStartX: 3, barY: 9, exactBarWidth: 250, barHeight, quantumPhase: phase });
      for (const [projectionIndex, alpha] of [0, Math.PI / 3, 2 * Math.PI / 3].entries()) {
        const path = geometry.paths[projectionIndex];
        for (const [position, index] of [[0, 0], [1, path.length - 1]]) {
          const state = unwrappedAnalyticState(position, phase);
          const projection = (state.re * Math.cos(alpha) - state.im * Math.sin(alpha)) / Math.sqrt(3);
          const expectedY = 9 + barHeight / 2 - (barHeight - geometry.thickness) / 2 * projection;
          expect(path[index].x).toBe(3 + position * 250);
          expect(path[index].y).toBeCloseTo(expectedY, 10);
          const edge = geometry.polygons[projectionIndex].filter(point => point.x === path[index].x);
          expect(edge).toHaveLength(2);
          expect(Math.min(...edge.map(point => point.y))).toBeCloseTo(expectedY - geometry.thickness / 2, 10);
          expect(Math.max(...edge.map(point => point.y))).toBeCloseTo(expectedY + geometry.thickness / 2, 10);
        }
      }
    }
  }
});

test('full state recurrence agrees with an unwrapped analytic reference rather than only modulo wrapping', () => {
  for (const position of [.037, .173, .431, .887]) {
    for (const phase of [.013, .137, .371, .683]) {
      const initial = unwrappedAnalyticState(position, phase);
      const recurring = unwrappedAnalyticState(position, phase + 1);
      expect(recurring.re).toBeCloseTo(initial.re, 11);
      expect(recurring.im).toBeCloseTo(initial.im, 11);
      expect(model.sample(position, phase).re).toBeCloseTo(initial.re, 11);
      expect(model.sample(position, phase).im).toBeCloseTo(initial.im, 11);
      expect(model.sample(position, phase + 1).re).toBeCloseTo(recurring.re, 11);
      expect(model.sample(position, phase + 1).im).toBeCloseTo(recurring.im, 11);
    }
  }
  // A recurrence of only the fastest component is not a recurrence of the whole state.
  const initial = unwrappedAnalyticState(.173, .137);
  const partial = unwrappedAnalyticState(.173, .137 + 1 / 49);
  expect(Math.hypot(initial.re - partial.re, initial.im - partial.im)).toBeGreaterThan(.1);
  let phase = 0;
  for (let frame = 0; frame < 7200; frame++) phase = model.advancePhase(phase, 1000 / 60);
  expect(Math.min(phase, 1 - phase)).toBeLessThan(1e-10);
});
