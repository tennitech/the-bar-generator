const fs = require('node:fs');
const {
  createWaveformPatternGeometry, createBarPatternSVG, generateWaveValue,
  applyWaveformEnvelope, mapWaveformToBarYFraction
} = require('../js/utils/barPattern');
const base = { exactBarWidth: 250, barHeight: 18, waveformFrequency: 24,
  waveformSpeed: 1, waveformPoints: 500 };
const area = polygon => Math.abs(polygon.reduce((sum, point, index) => {
  const next = polygon[(index + 1) % polygon.length];
  return sum + point.x * next.y - next.x * point.y;
}, 0) / 2);
const edges = curve => curve.slice(1).flatMap((point, index) =>
  Math.abs(point.x - curve[index].x) < 1e-9 && Math.abs(point.y - curve[index].y) > 1e-6 ? [point.x] : []);

test.each([1, 1.5, 2, 2.5, 3])('type %s keeps exact ink area through subpixel motion', waveformType => {
  const expected = waveformType <= 2 ? 2250 : 2250 + (900 - 2250) * (waveformType - 2);
  for (const waveformFrequency of [10, 24, 73, 100]) {
    for (let frame = 0; frame <= 120; frame++) {
      const geometry = createWaveformPatternGeometry({ ...base, waveformFrequency, waveformType, timeSeconds: frame / 120 });
      expect(area(geometry.polygon)).toBeCloseTo(expected, 7);
    }
  }
});

test.each([0.25, 1, 1.5, 2, 2.5, 3])('type %s moves jump edges continuously in either direction', waveformType => {
  for (const direction of [-1, 1]) {
    const before = edges(createWaveformPatternGeometry({ ...base, waveformType, timeSeconds: .231 }).curve);
    const after = edges(createWaveformPatternGeometry({ ...base, waveformType, timeSeconds: .231 + direction / 240 }).curve);
    expect(before.length).toBeGreaterThan(0);
    expect(after).toHaveLength(before.length);
    after.forEach((x, index) => expect(x - before[index]).toBeCloseTo(direction * 250 / 24 / 240, 9));
  }
});

test('exact square and pulse widths do not depend on the sampling budget', () => {
  for (const waveformType of [2, 3]) for (const waveformPoints of [120, 500, 1200, 7500]) {
    const curve = createWaveformPatternGeometry({ ...base, waveformType, waveformPoints, timeSeconds: .123 }).curve;
    const jumps = edges(curve);
    for (let i = 1; i < jumps.length; i += 2) {
      expect(jumps[i] - jumps[i - 1]).toBeCloseTo((waveformType === 2 ? .5 : .8) * 250 / 24, 8);
    }
  }
});

test('envelopes retain their fixed spatial coordinates, bounds and phase wrap', () => {
  for (const waveformType of [0, .5, 1, 1.5, 2, 2.5, 3]) {
    for (const waveformEnvelopeType of ['sine', 'cosine', 'linear', 'inverse']) {
      const values = { ...base, waveformType, timeSeconds: -.137, waveformEnvelope: true,
        waveformEnvelopeType, waveformEnvelopeWaves: 7, waveformEnvelopeBipolar: true, waveformEnvelopeCenter: -.3 };
      const first = createWaveformPatternGeometry(values);
      const looped = createWaveformPatternGeometry({ ...values, timeSeconds: values.timeSeconds + 1 });
      expect(first.curve).toHaveLength(looped.curve.length);
      first.curve.forEach((point, i) => {
        expect(point.x).toBeGreaterThanOrEqual(0); expect(point.x).toBeLessThanOrEqual(250);
        expect(point.y).toBeGreaterThanOrEqual(0); expect(point.y).toBeLessThanOrEqual(18);
        expect(point.x).toBeCloseTo(looped.curve[i].x, 8); expect(point.y).toBeCloseTo(looped.curve[i].y, 8);
      });
      // Non-jump samples preserve the original model, rather than smoothing its shape.
      const x = first.curve.find(point => Math.abs(point.x - 125) < 1e-8);
      const wave = applyWaveformEnvelope(generateWaveValue(12 + .137, waveformType), {
        applyEnvelope: true, envType: waveformEnvelopeType, envWaves: 7, bipolar: true, xPortion: .5
      });
      expect(x.y).toBeCloseTo(18 * mapWaveformToBarYFraction(wave, -.3), 8);
    }
  }
});

test('SVG serializes the same exact polygon used by both live renderers', () => {
  const values = { ...base, waveformType: 2.6, timeSeconds: .347 };
  const geometry = createWaveformPatternGeometry(values);
  const svg = createBarPatternSVG({ currentShader: 4, fgColor: '#000',
    barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18, values });
  const expected = geometry.polygon.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ') + ' Z';
  expect(svg).toContain(`d="${expected}"`);
  const main = fs.readFileSync(require.resolve('../js/main'), 'utf8');
  const drawing = fs.readFileSync(require.resolve('../js/drawing'), 'utf8');
  expect(main.match(/const geometry = getLiveWaveformGeometry\(/g)).toHaveLength(2);
  expect(drawing).toContain('const geometry = getLiveWaveformGeometry(');
});

// Assert painted coordinates rather than only transport-clock signs.
test.each([1, 2, 3])('type %s moves right by default and left with Reverse in live and GIF paths', waveformType => {
  const { advanceLiveLoopPhase, getLoopingAnimationState, getLoopingGifFramePlan } = require('../js/utils/loopingGif');
  for (const reverse of [false, true]) {
    const values = { ...base, waveformType, waveformReverse: reverse, waveformSpeed: .3 };
    const phase = .37;
    const beforeTime = getLoopingAnimationState('waveform', values, { phase }).timeSeconds;
    const afterPhase = advanceLiveLoopPhase(phase, 'waveform', values, 16);
    const afterTime = getLoopingAnimationState('waveform', values, { phase: afterPhase }).timeSeconds;
    const plan = getLoopingGifFramePlan('waveform', values);
    const initialEdges = edges(createWaveformPatternGeometry({ ...values, timeSeconds: beforeTime }).curve);
    for (const timeSeconds of [afterTime, beforeTime + plan.getTimeSeconds(16 / 1000 / plan.periodSeconds)]) {
      const next = edges(createWaveformPatternGeometry({ ...values, timeSeconds }).curve);
      expect(next).toHaveLength(initialEdges.length);
      next.forEach((x, i) => expect(x - initialEdges[i]).toBeCloseTo((reverse ? -1 : 1) * 250 / 24 * .3 * .016, 8));
    }
  }
});
