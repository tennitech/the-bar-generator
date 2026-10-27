const model = require('../js/utils/quantumModel');
const { createWaveQuantumPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');

test('probability stays normalized, nonnegative and periodic for all sampled times', () => {
  for (const phase of [0, 0.0001, 0.125, 0.371, 0.5, 0.999999]) {
    let integral = 0;
    for (let i = 0; i < 2048; i++) {
      const state = model.sample(i / 2048, phase);
      expect(state.density).toBeGreaterThanOrEqual(0);
      expect(state.density).toBeLessThanOrEqual(2 + 1e-12);
      integral += state.density / 2048;
      // Independent closed-form interference check: delta n=3, delta n²=33.
      expect(state.density).toBeCloseTo(1 + Math.cos(2 * Math.PI * (3 * i / 2048 - 33 * phase)), 10);
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
    // i dpsi/dtau = -(1/(2*pi)^2) d²psi/du², tau=2*pi*p.
    const temporalRe = -(tp.im - tm.im) / (2 * dp * 2 * Math.PI);
    const temporalIm = (tp.re - tm.re) / (2 * dp * 2 * Math.PI);
    const spatialRe = -(xp.re - 2 * c.re + xm.re) / (dx * dx * (2 * Math.PI) ** 2);
    const spatialIm = -(xp.im - 2 * c.im + xm.im) / (dx * dx * (2 * Math.PI) ** 2);
    expect(temporalRe).toBeCloseTo(spatialRe, 4);
    expect(temporalIm).toBeCloseTo(spatialIm, 4);
  }
});

test('ribbons span exact fixed domain and stay bounded without fitting in both views', () => {
  for (const quantumView of ['projections', 'density']) {
    for (let frame = 0; frame <= 64; frame++) {
      const options = { barStartX: 3, barY: 9, exactBarWidth: 250, barHeight: 18, quantumView, quantumPhase: frame / 64 };
      const geometry = createWaveQuantumPatternGeometry(options);
      for (const polygon of geometry.polygons) {
        expect(Math.min(...polygon.map(p => p.x))).toBe(3);
        expect(Math.max(...polygon.map(p => p.x))).toBe(253);
        expect(Math.min(...polygon.map(p => p.y))).toBeGreaterThanOrEqual(9 - 1e-12);
        expect(Math.max(...polygon.map(p => p.y))).toBeLessThanOrEqual(27 + 1e-12);
      }
      const svg = createBarPatternSVG({ currentShader: 22, ...options, fgColor: '#000', values: options });
      expect((svg.match(/<polygon/g) || []).length).toBe(quantumView === 'density' ? 1 : 3);
    }
  }
});

test('phase wraps deterministically, advances continuously and limits stalled frames', () => {
  expect(model.normalizePhase(NaN)).toBe(0);
  expect(model.normalizePhase(-0.25)).toBe(0.75);
  expect(model.advancePhase(0.99, 50)).toBeCloseTo(0.9904166666666667, 12);
  expect(model.advancePhase(0.99, 5000)).toBe(model.advancePhase(0.99, 50));
  expect(model.advancePhase(0.25, -50)).toBe(0.25);
  expect(model.sample(0.413, 0.37)).toEqual(model.sample(0.413, 1.37));
});
