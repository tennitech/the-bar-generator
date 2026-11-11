const model = require('../js/utils/quantumStudyModel');
const { createQuantumStudyPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');

const integral = (fn, bins = 600) => {
  let sum = (fn(0) + fn(1)) / 2;
  for (let i = 1; i < bins; i++) sum += fn(i / bins);
  return sum / bins;
};

test('normalization preserves zero, enforces distinct bounded modes and recovers malformed values', () => {
  expect(model.normalize('well-modes')).toEqual({ wellN1: 2, wellN2: 3, wellPopulation: .5, wellPhase: expect.closeTo(.15, 12) });
  expect(model.normalize(26, { wellN1: 6, wellN2: 6, wellPopulation: 0, wellPhase: 0 })).toEqual({ wellN1: 6, wellN2: 5, wellPopulation: 0, wellPhase: 0 });
  expect(model.normalize(26, { wellN1: -5, wellN2: 99, wellPopulation: 2, wellPhase: -.25 })).toEqual({ wellN1: 1, wellN2: 6, wellPopulation: 1, wellPhase: .75 });
  expect(model.normalize(27, { rabiDetuning: 0, rabiSpan: 99, rabiPhase: 0 })).toEqual({ rabiDetuning: 0, rabiSpan: 8, rabiPhase: 0 });
  for (const bad of [undefined, null, '', NaN, Infinity, 'not a number', true]) {
    expect(model.normalize(26, { wellN1: bad, wellPopulation: bad })).toEqual(model.normalize(26));
    expect(model.normalize(27, { rabiDetuning: bad, rabiSpan: bad })).toEqual(model.normalize(27));
  }
});

test('well density is normalized for all mode pairs, populations and phases', () => {
  for (let n1 = 1; n1 <= 6; n1++) for (let n2 = 1; n2 <= 6; n2++) {
    for (const p of [0, .23, .5, 1]) for (const phase of [0, .37, .5]) {
      const opts = { wellN1: n1, wellN2: n2, wellPopulation: p, wellPhase: phase };
      expect(integral(u => model.sampleWell(u, opts))).toBeCloseTo(1, 11);
      expect(model.sampleWell(0, opts)).toBe(0);
      expect(model.sampleWell(1, opts)).toBe(0);
    }
  }
});

test('well agrees with independent interference formula and stationary eigenstates', () => {
  for (let i = 0; i <= 240; i++) {
    const u = i / 240;
    for (const phase of [0, .15, .5, .77]) {
      const expected = 1.4 * Math.sin(2 * Math.PI * u) ** 2 + .6 * Math.sin(3 * Math.PI * u) ** 2 +
        4 * Math.sqrt(.21) * Math.sin(2 * Math.PI * u) * Math.sin(3 * Math.PI * u) * Math.cos(2 * Math.PI * phase);
      const density = model.sampleWell(u, { wellPopulation: .3, wellPhase: phase });
      expect(density).toBeCloseTo(expected, 12);
      expect(density).toBeGreaterThanOrEqual(0);
      expect(density).toBeLessThanOrEqual(4);
      expect(model.sampleWell(u, { wellPopulation: 0, wellPhase: phase })).toBeCloseTo(2 * Math.sin(2 * Math.PI * u) ** 2, 12);
      expect(model.sampleWell(u, { wellPopulation: 1, wellPhase: phase })).toBeCloseTo(2 * Math.sin(3 * Math.PI * u) ** 2, 12);
    }
  }
  expect(model.sampleWell(.5, { wellN1: 2, wellN2: 4 })).toBe(0);
});

test('Rabi benchmarks recover ground, resonant pi pulse and detuned maximum', () => {
  expect(model.sampleRabi(0, { rabiPhase: 0 })).toEqual({ pe: 0, pg: 1 });
  expect(model.sampleRabi(.25, { rabiDetuning: 0, rabiSpan: 4, rabiPhase: 0 })).toEqual({ pe: 1, pg: 0 });
  for (const detuning of [0, .45, 1, 3]) {
    const frequency = Math.sqrt(1 + detuning ** 2);
    const opts = { rabiDetuning: detuning, rabiSpan: 4, rabiPhase: 0 };
    expect(model.sampleRabi(1 / (4 * frequency), opts).pe).toBeCloseTo(1 / (1 + detuning ** 2), 14);
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const { pe, pg } = model.sampleRabi(u, opts);
      expect(pe).toBeCloseTo(Math.sin(frequency * u * 4 * Math.PI / 2) ** 2 / (1 + detuning ** 2), 14);
      expect(pe + pg).toBe(1);
      expect(pe).toBeGreaterThanOrEqual(0);
      expect(pg).toBeGreaterThanOrEqual(0);
    }
  }
});

test('Rabi phase slides duration scan one population period and repeats exactly', () => {
  const opts = { rabiDetuning: .45, rabiSpan: 4, rabiPhase: .17 };
  const shift = 2 * .17 / (4 * Math.sqrt(1 + .45 ** 2));
  expect(model.sampleRabi(.3, opts).pe).toBeCloseTo(model.sampleRabi(.3 + shift, { ...opts, rabiPhase: 0 }).pe, 14);
  expect(model.sampleRabi(.3, opts).pe).toBeCloseTo(model.sampleRabi(.3, { ...opts, rabiPhase: 1.17 }).pe, 14);
});

test('phase clock is bounded, reversible, eight seconds at unit speed and numerically safe', () => {
  expect(model.PERIOD_SECONDS).toBe(8);
  expect(model.normalizePhase(-.25)).toBe(.75);
  expect(model.normalizeSpeed(0)).toBe(.2);
  expect(model.normalizeSpeed(10)).toBe(4);
  expect(model.normalizeSpeed(Infinity)).toBe(1);
  expect(model.advancePhase(.3, 50, { speed: 2 })).toBeCloseTo(.3125, 14);
  expect(model.advancePhase(.3, 50, { speed: 2, reverse: true })).toBeCloseTo(.2875, 14);
  expect(model.advancePhase(.3, 5000)).toBe(model.advancePhase(.3, 50));
  expect(model.advancePhase(.3, -100)).toBeCloseTo(.3, 14);
  expect(Number.isFinite(model.advancePhase(NaN, Infinity))).toBe(true);
});

test.each([26, 27])('style %s has deterministic bounded shared geometry and identical SVG primitives', currentShader => {
  for (const phase of [0, .15, .37, .5, .999]) {
    const options = { currentShader, barStartX: 7, barY: 11, exactBarWidth: 500, barHeight: 36,
      wellPhase: phase, rabiPhase: phase, wellN1: 6, wellN2: 5, rabiDetuning: 3, rabiSpan: 8 };
    const geometry = createQuantumStudyPatternGeometry(options);
    expect(geometry).toEqual(model.createGeometry(options));
    expect(geometry).toEqual(model.createGeometry(options));
    const svg = createBarPatternSVG({ ...options, values: options, fgColor: '#000000' });
    const svgPolygons = [...svg.matchAll(/<polygon points="([^"]+)"/g)].map(match => match[1].split(' ').map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    }));
    expect(svgPolygons).toEqual(geometry.polygons);
    for (const polygon of geometry.polygons) for (const point of polygon) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(7);
      expect(point.x).toBeLessThanOrEqual(507);
      expect(point.y).toBeGreaterThanOrEqual(11);
      expect(point.y).toBeLessThanOrEqual(47);
    }
    expect(svg).toContain('dimensionless');
    expect(svg).not.toContain('<pattern');
    expect(svg).not.toContain('<image');
  }
});

test('well fixed density bound preserves nodes, without a baseline or fitted peak', () => {
  const geometry = model.createGeometry({ currentShader: 26, exactBarWidth: 500, barHeight: 36,
    wellN1: 2, wellN2: 4, wellPopulation: 0 });
  expect(geometry.polygons).toHaveLength(1);
  const polygon = geometry.polygons[0];
  expect(polygon[0]).toEqual({ x: 0, y: 18 });
  expect(polygon[300]).toEqual({ x: 250, y: 18 });
  expect(Math.min(...polygon.map(p => p.y))).toBeCloseTo(9, 12);
  expect(Math.max(...polygon.map(p => p.y))).toBeCloseTo(27, 12);
});

test('zero-sized domains are empty and invalid geometry inputs remain finite', () => {
  expect(model.createGeometry({ currentShader: 26, exactBarWidth: 0 }).polygons).toEqual([]);
  expect(model.createGeometry({ currentShader: 27, barHeight: -1 }).polygons).toEqual([]);
  for (const currentShader of [26, 27]) {
    const geometry = model.createGeometry({ currentShader, barStartX: Infinity, barY: NaN, exactBarWidth: 'bad', barHeight: null });
    expect(geometry.polygons.flat().every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  }
});


test('Rabi solid area equals integrated excited population and hatches stay above its boundary', () => {
  const opts = { currentShader: 27, exactBarWidth: 500, barHeight: 36, rabiDetuning: .45, rabiSpan: 8, rabiPhase: .12 };
  const geometry = model.createGeometry(opts);
  const solid = geometry.polygons[geometry.polygons.length - 1];
  let twiceArea = 0;
  for (let i = 0; i < solid.length; i++) {
    const a = solid[i], b = solid[(i + 1) % solid.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  expect(Math.abs(twiceArea) / (2 * 500 * 36)).toBeCloseTo(integral(u => model.sampleRabi(u, opts).pe), 12);
  for (const hatch of geometry.polygons.slice(0, -1)) for (const point of hatch) {
    const sampleIndex = Math.min(599, Math.floor(point.x / 500 * 600));
    const t = point.x / 500 * 600 - sampleIndex;
    const a = solid[sampleIndex], b = solid[sampleIndex + 1];
    const boundaryY = a.y + t * (b.y - a.y);
    expect(point.y).toBeLessThanOrEqual(boundaryY + 1e-10);
  }
});
