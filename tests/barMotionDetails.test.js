const fs = require('node:fs');
const vm = require('node:vm');
const { createRulerPatternGeometry, normalizeBinaryText } = require('../js/utils/barPattern');
const { getLoopingGifFramePlan, getLoopingAnimationState, advanceLiveLoopPhase } = require('../js/utils/loopingGif');
const { normalizeState } = require('../js/utils/shareState');

for (const divisions of [2, 4, 8, 10, 16]) test(`Ruler ${divisions} divisions represent exact fractions without duplicate ticks`, () => {
  const options = { rulerRepeats: 10, rulerUnits: divisions, exactBarWidth: 250, barHeight: 18 };
  const still = createRulerPatternGeometry(options);
  expect(still.repeatWidth).toBeCloseTo((250 - still.tickWidth) / 10);
  expect(still.tickSpacing).toBeCloseTo(still.repeatWidth / divisions);
  expect(still.rects).toHaveLength(10 * divisions + 1);
  expect(still.rects.filter(tick => tick.height === 18)).toHaveLength(11);
  expect(still.rects[0].width).toBeCloseTo(still.tickWidth);
  expect(still.rects.at(-1).width).toBeCloseTo(still.tickWidth);
  expect(createRulerPatternGeometry({ ...options, loopOffsetX: 0 })).toEqual(still);
  expect(getLoopingGifFramePlan('ruler', options)).toBeNull();
  for (const phase of [-.31, 0, .17, .5, .99, 1]) {
    const moving = createRulerPatternGeometry({ ...options, loopOffsetX: phase * still.repeatWidth });
    const positions = moving.rects.map(tick => tick.x.toFixed(8));
    expect(new Set(positions).size).toBe(positions.length);
    expect(moving.tickSpacing).toBe(still.tickSpacing);
    for (const rect of moving.rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(250 + 1e-8);
    }
  }
});

test('Ruler halves, quarters and eighths have a consistent height hierarchy', () => {
  const ticks = createRulerPatternGeometry({ rulerRepeats: 10, rulerUnits: 8 }).rects.slice(0, 9);
  ticks.forEach((tick, index) => expect(tick.height / 18).toBeCloseTo([1, .35, .5, .35, .7, .35, .5, .35, 1][index]));
});

test.each(['ticker', 'waveform'])('%s transport uses the selected direction in live and GIF rendering', style => {
  const sign = style === 'ticker' ? -1 : 1;
  for (const reverse of [false, true]) {
    const values = { [`${style}Reverse`]: reverse };
    const expected = sign * (reverse ? -1 : 1);
    const next = advanceLiveLoopPhase(.5, style, values, 10);
    expect(Math.sign(next - .5)).toBe(expected);
    const plan = getLoopingGifFramePlan(style, values);
    expect(Math.sign(style === 'waveform' ? plan.getTimeSeconds(.1) : plan.getLoopOffsetX(.1))).toBe(expected);
  }
});

test('Binary keeps ten complete Unicode code points at every encoding entry', () => {
  const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
  const functionSource = source.slice(source.indexOf('function textToBinary('), source.indexOf('// Numeric inputs are validated'));
  const context = { normalizeBinaryText, sanitizeBarText: require('../js/utils/profanityFilter').sanitizeText, TextEncoder };
  vm.runInNewContext(functionSource, context);
  for (const text of ['abcdefghijklm', '🚀'.repeat(11), 'Café 東京 🚀 abcdef', '123456damnation']) {
    const normalized = normalizeBinaryText(text);
    expect(Array.from(normalized)).toHaveLength(10);
    const clean = context.sanitizeBarText(normalized);
    const expected = [...new TextEncoder().encode(clean)].flatMap(byte => [...byte.toString(2).padStart(8, '0')].map(Number));
    expect(context.textToBinary(text)).toEqual(expected);
  }
  expect(normalizeBinaryText('ab\ncd\t')).toBe('abcd');
  expect(source).not.toMatch(/binaryAudioBtn|scheduleBinaryNote|startSequenceAudio\('binary'\)/);
});

test('old long Binary shares migrate only Binary and retain other controls', () => {
  const manifest = { 'binary-input': { type: 'text', maxLength: 10 }, 'morse-input': { type: 'text', maxLength: 100 } };
  const result = normalizeState({ v: 1, controls: { 'binary-input': '🚀'.repeat(20), 'morse-input': 'ABCDEFGHIJKLM' } }, manifest);
  expect(result.controls).toEqual({ 'binary-input': '🚀'.repeat(10), 'morse-input': 'ABCDEFGHIJKLM' });
  expect(() => normalizeState({ v: 1, controls: { 'binary-input': 'a'.repeat(101) } }, manifest)).toThrow('too long');
});

test('canonical render paths do not add synthetic side or bottom paint or force an edge fit', () => {
  for (const file of ['../js/main', '../js/drawing']) {
    const source = fs.readFileSync(require.resolve(file), 'utf8');
    expect(source).not.toMatch(/createWaveformBaselineGeometry|createEncodedBarBoundaryGeometry|fitBarSVGToEdges|isBoundary/);
  }
});


test.each([false, true])('Ticker major ticks move right by default and left with reverse=%s', reverse => {
  const { createTickerPatternGeometry } = require('../js/utils/barPattern');
  const values = { tickerRepeats: 10, tickerRatio: 2, tickerSpeed: .4, tickerReverse: reverse };
  const positions = phase => {
    const motion = getLoopingAnimationState('ticker', values, { phase });
    return createTickerPatternGeometry({ ...values, loopOffsetX: motion.loopOffsetX }).rects
      .filter(rect => rect.y === 9 && rect.x > 100 && rect.x < 125).map(rect => rect.x);
  };
  const before = positions(.5), after = positions(advanceLiveLoopPhase(.5, 'ticker', values, 16));
  expect(before).toHaveLength(1); expect(after).toHaveLength(1);
  expect(Math.sign(after[0] - before[0])).toBe(reverse ? -1 : 1);
});
