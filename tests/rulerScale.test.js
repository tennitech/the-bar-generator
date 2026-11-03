const fs = require('node:fs');
const { DIVISIONS, normalizeUnits, normalizeDivisions, tickLevel } = require('../js/utils/rulerScale');
const { createRulerPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');
const { getLoopingGifFramePlan, advanceLiveLoopPhase } = require('../js/utils/loopingGif');
const { normalizeState } = require('../js/utils/shareState');

test('ruler defaults to decimal tenths and offers only conventional subdivisions', () => {
  expect(DIVISIONS).toEqual([2, 4, 8, 10, 16]);
  for (const value of [undefined, null, '', 'bad', Infinity, -2, 3]) expect(normalizeDivisions(value)).toBe(10);
  expect(normalizeDivisions('6')).toBe(8);
  expect(normalizeUnits()).toBe(10);
  expect(normalizeUnits(0)).toBe(10);
  expect(normalizeUnits(1)).toBe(1);
  expect(normalizeUnits(90)).toBe(20);
});

test('decimal ruler distinguishes the whole unit, half unit and equal tenth marks', () => {
  expect(Array.from({length: 11}, (_, i) => tickLevel(i, 10))).toEqual([0, 3, 3, 3, 3, 1, 3, 3, 3, 3, 0]);
  const rects = createRulerPatternGeometry({ rulerRepeats: 1, rulerUnits: 10 }).rects;
  expect(new Set(rects.filter((_, i) => i !== 0 && i !== 5 && i !== 10).map(r => r.height)).size).toBe(1);
  expect(rects[0].height).toBeGreaterThan(rects[5].height);
  expect(rects[5].height).toBeGreaterThan(rects[1].height);
});

test('fractional ruler gives halves, quarters, eighths and sixteenths distinct hierarchy', () => {
  const ticks = createRulerPatternGeometry({ rulerRepeats: 1, rulerUnits: 16 }).rects;
  const levels = [ticks[0], ticks[8], ticks[4], ticks[2], ticks[1]];
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i - 1].height).toBeGreaterThan(levels[i].height);
    // Compare unclipped interior strokes, not the half-width endpoint.
    if (i > 1) expect(levels[i - 1].width).toBeGreaterThan(levels[i].width);
  }
  for (let i = 0; i <= 16; i++) expect(ticks[i].height).toBe(ticks[16 - i].height);
});

test.each(DIVISIONS)('%s subdivisions preserve exact major endpoints, equal coordinates and seamless loops', divisions => {
  for (const units of [1, 4, 10, 20]) {
    const values = { rulerRepeats: units, rulerUnits: divisions };
    const geometry = createRulerPatternGeometry(values);
    expect(geometry.rects).toHaveLength(units * divisions + 1);
    expect(geometry.rects[0]).toMatchObject({ x: 0, y: 0, height: 18 });
    const last = geometry.rects.at(-1);
    expect(last.x + last.width).toBeCloseTo(250);
    expect(last.height).toBe(18);
    for (let i = 1; i < geometry.rects.length - 1; i++) {
      const tick = geometry.rects[i];
      expect(tick.x + tick.width / 2).toBeCloseTo(i * 250 / (units * divisions));
    }
    expect(createRulerPatternGeometry({ ...values, loopOffsetX: geometry.repeatWidth })).toEqual(geometry);
    for (const phase of [.13, .51, .99]) {
      const a = createRulerPatternGeometry({ ...values, loopOffsetX: phase * geometry.repeatWidth });
      const b = createRulerPatternGeometry({ ...values, loopOffsetX: (phase + 1) * geometry.repeatWidth });
      a.rects.forEach((rect, i) => { expect(rect.x).toBeCloseTo(b.rects[i].x); expect(rect.height).toBeCloseTo(b.rects[i].height); });
    }
  }
});

test('dense GIF plans and live frames retain the nominal quarter-division motion bound', () => {
  for (const divisions of DIVISIONS) for (const rulerSpeed of [.2, .3, .6]) {
    const values = { rulerUnits: divisions, rulerSpeed };
    const plan = getLoopingGifFramePlan('ruler', values);
    expect(divisions / plan.frameCount).toBeLessThanOrEqual(.25);
    expect(plan.frameCount).toBeLessThanOrEqual(72);
    expect(plan.periodSeconds).toBeCloseTo(1 / rulerSpeed);
    expect(Math.abs(advanceLiveLoopPhase(.5, 'ruler', values, 100) - .5) * divisions).toBeLessThanOrEqual(.25 + 1e-12);
  }
});

test('historical division sliders migrate narrowly without changing transport or unrelated controls', () => {
  const manifest = { 'ruler-divisions-select': { options: DIVISIONS.map(String) }, 'ruler-motion-toggle': { type: 'checkbox' } };
  for (const old of ['2','4','6','8','10']) {
    const controls = { 'ruler-units-slider': old, 'ruler-motion-toggle': false };
    const result = normalizeState({v:1,controls,runtime:{phase:.37}},manifest);
    expect(result.controls).toEqual({ 'ruler-divisions-select': old === '6' ? '8' : old, 'ruler-motion-toggle': false });
    expect(result.runtime.phase).toBe(.37);
    expect(controls['ruler-units-slider']).toBe(old);
  }
  expect(() => normalizeState({v:1,controls:{'ruler-units-slider':'999'}},manifest)).toThrow(/invalid ruler/);
  expect(() => normalizeState({v:1,controls:{'ruler-divisions-select':'6'}},manifest)).toThrow(/unavailable option/);
});

test('route bootstrap loads scale normalizers before motion, shared state, and initial parameter parsing', () => {
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  for (const script of ['loopingGif', 'shareState', 'barPattern', 'generatorParameters']) {
    expect(html.indexOf('js/utils/rulerScale.js')).toBeLessThan(html.indexOf(`js/utils/${script}.js`));
  }
  const bootstrap = fs.readFileSync(require.resolve('../js/generatorBootstrap'), 'utf8');
  expect(bootstrap.indexOf("'rulerScale'")).toBeLessThan(bootstrap.indexOf("'loopingGif'"));
});


test('GIF centisecond rounding retains duration and stays below half a subdivision per frame', () => {
  const { frameTiming } = require('../js/utils/transparentGif');
  for (const rulerUnits of DIVISIONS) for (const rulerSpeed of [.2,.3,.4,.5,.6]) {
    const plan = getLoopingGifFramePlan('ruler', {rulerUnits,rulerSpeed});
    const timing = frameTiming(plan.periodSeconds,plan.frameCount);
    expect(timing.durationMs).toBe(Math.round(plan.periodSeconds*100)*10);
    for(const delay of timing.delays) expect(delay/timing.durationMs*rulerUnits).toBeLessThan(.5);
  }
});
