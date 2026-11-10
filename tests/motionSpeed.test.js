const speed = require('../js/utils/motionSpeed');
const { normalizeLoopSpeed, getLoopingGifFramePlan, getDefaultLoopSpeed } = require('../js/utils/loopingGif');

test.each(['ticker', 'waveform', 'gradient', 'wave-quantum'])('%s displays one times its original default and edits multipliers without changing stored units', style => {
  const original = speed.defaults[style];
  expect(speed.format(style, original)).toBe('1×');
  const slider = { value: String(original), dataset: {}, setAttribute: jest.fn(), addEventListener: jest.fn() };
  const editor = speed.editor(style, slider);
  expect(editor.getEditorValue()).toBe('1');
  expect(editor.parseValue('2×')).toBeCloseTo(original * 2, 9);
  expect(editor.parseValue('0.25')).toBeCloseTo(original / 4, 3);
  expect(editor.parseValue('oops')).toBeNull();
  expect(editor.parseValue('')).toBeNull();
  expect(editor.parseValue('100')).toBeCloseTo(original * 4, 9);
  const listeners = {};
  slider.addEventListener = (name, fn) => { listeners[name] = fn; };
  slider.dispatchEvent = jest.fn(); const display = {};
  speed.sync(style, slider, display); speed.sync(style, slider, display);
  expect(display.textContent).toBe('1×');
  listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  expect(Number(slider.value)).toBeCloseTo(original * 1.05, 3);
  expect(slider.dispatchEvent).toHaveBeenCalledTimes(1);
  listeners.keydown({ key: 'End', preventDefault() {} });
  expect(Number(slider.value)).toBeCloseTo(original * 4, 9);
  listeners.keydown({ key: 'Home', preventDefault() {} });
  expect(Number(slider.value)).toBeCloseTo(original * .2, 9);
});

test('all formerly valid rates keep their physical meaning, including fractional new speeds', () => {
  for (const [style, maximum] of [['ticker', .8], ['waveform', 1], ['gradient', .3]]) {
    for (let value = .2; value <= maximum + 1e-9; value += .1) {
      expect(normalizeLoopSpeed(style, value)).toBeCloseTo(value, 9);
    }
    expect(getDefaultLoopSpeed(style)).toBe(speed.defaults[style]);
    const slow = speed.rate(style, .25);
    expect(normalizeLoopSpeed(style, slow)).toBe(slow);
    expect(getLoopingGifFramePlan(style, { [`${style}Speed`]: slow }).periodSeconds).toBeCloseTo(1 / slow, 9);
  }
});

test('retained Waveform LFO settings cannot alter Gradient or Ticker GIFs', () => {
  const settings = { waveformLfo: true, waveformLfoRate: .07, waveformLfoDepth: 100 };
  for (const style of ['ticker', 'gradient']) {
    const actual = getLoopingGifFramePlan(style, settings), expected = getLoopingGifFramePlan(style, {});
    for (const key of ['periodSeconds', 'frameCount', 'repeatWidth', 'frameDelayMs']) expect(actual[key]).toBe(expected[key]);
    for (const phase of [0, .25, .5, 1]) {
      expect(actual.getLoopOffsetX(phase)).toBe(expected.getLoopOffsetX(phase));
      if (actual.getTimeSeconds) expect(actual.getTimeSeconds(phase)).toBe(expected.getTimeSeconds(phase));
    }
  }
});

test('fine speeds close the joint LFO loop or explicitly average within the bounded capture budget', () => {
  for (const waveformSpeed of [.06, .075, .105, .3, 1.2]) for (const waveformLfoRate of [.07, .33, 2, 4.99, 1300]) {
    const plan = getLoopingGifFramePlan('waveform', { waveformSpeed, waveformLfoRate, waveformLfo: true, waveformLfoDepth: 100 });
    expect(plan.periodSeconds).toBeLessThanOrEqual(100);
    expect(plan.frameCount).toBeLessThanOrEqual(3000);
    expect(plan.periodSeconds * waveformSpeed).toBeCloseTo(Math.round(plan.periodSeconds * waveformSpeed), 8);
    if (!plan.lfoAveraged) expect(plan.periodSeconds * waveformLfoRate).toBeCloseTo(Math.round(plan.periodSeconds * waveformLfoRate), 8);
  }
});


test('routed generator bootstrap loads the head-only speed helper before main setup', () => {
  const fs = require('node:fs');
  const bootstrap = fs.readFileSync(require.resolve('../js/generatorBootstrap'), 'utf8');
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  expect(html).toMatch(/<script src="js\/utils\/motionSpeed\.js\?v=/);
  const early = bootstrap.slice(bootstrap.indexOf('const earlySources'), bootstrap.indexOf('await Promise.all(earlySources'));
  expect(early).toContain("'motionSpeed'");
  expect(bootstrap.indexOf('await Promise.all(earlySources')).toBeLessThan(bootstrap.indexOf('document.body.replaceChildren'));
});
