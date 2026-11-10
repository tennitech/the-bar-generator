const {
  advanceLiveLoopPhase,
  normalizeLoopSpeed,
  normalizeMotionSpeedControls,
  getLoopSpeedLimits,
  clampLiveAnimationDeltaMs,
  getPreferredLiveRenderFps,
  getLoopingAnimationState,
  isLoopingGifEligibleStyle,
  getLoopingGifFramePlan
} = require('../js/utils/loopingGif');

describe('loopingGif utils', () => {
  test.each(['ticker', 'waveform'])('normalizes %s speed safely at every boundary', style => {
    const limits = getLoopSpeedLimits(style);
    for (const value of [null, undefined, '', ' ', false, true, {}, [], 'NaN', 'Infinity', '0.5junk', '0xFF', '1e309']) {
      expect(normalizeLoopSpeed(style, value)).toBe(limits.default);
    }
    for (const value of [5, '999', Number.MAX_VALUE]) expect(normalizeLoopSpeed(style, value)).toBe(limits.max);
    for (const value of [-999, 0, '1e-99']) expect(normalizeLoopSpeed(style, value)).toBe(limits.min);
    expect(normalizeLoopSpeed(style, ' 0.2 ')).toBe(0.2);
    expect(normalizeLoopSpeed(style, '2e-1')).toBe(0.2);
    expect(getLoopingGifFramePlan(style, { [`${style}Speed`]: 999 }).periodSeconds).toBeCloseTo(1 / limits.max);
  });

  test('legacy share speed migration is bounded and leaves unrelated fields untouched', () => {
    const source = { 'ruler-speed-slider': '5', 'ticker-speed-slider': '-999', 'waveform-speed-slider': '0.35', 'other-slider': '999', text: 'RPI' };
    expect(normalizeMotionSpeedControls(source)).toEqual({ ...source,
      'ruler-speed-slider': '5', 'ticker-speed-slider': '0.08', 'waveform-speed-slider': '0.35' });
    expect(source['ruler-speed-slider']).toBe('5');
  });

  test('allows display-driven rendering above 120 Hz', () => {
    expect(getPreferredLiveRenderFps()).toBe(1000);
    expect(getPreferredLiveRenderFps(90)).toBe(90);
    expect(getPreferredLiveRenderFps(240)).toBe(240);
    expect(getPreferredLiveRenderFps(20)).toBe(60);
  });

  test('clamps live animation deltas to avoid giant jumps after stalls', () => {
    expect(clampLiveAnimationDeltaMs(-5)).toBe(0);
    expect(clampLiveAnimationDeltaMs(16.67)).toBeCloseTo(16.67);
    expect(clampLiveAnimationDeltaMs(500)).toBeCloseTo(50);
  });

  test('keeps speed consistent across 60, 120, 144 and 240 Hz frames', () => {
    for (const hz of [60, 120, 144, 240]) {
      let phase = 0;
      for (let frame = 0; frame < hz / 2; frame++) {
        phase = advanceLiveLoopPhase(phase, 'ticker', { tickerSpeed: 0.4, tickerRatio: 4 }, 1000 / hz);
      }
      expect(phase).toBeCloseTo(0.8, 9);
    }
  });

  test('speed changes preserve current phase instead of rescaling elapsed time', () => {
    let phase = advanceLiveLoopPhase(0.3, 'waveform', { waveformSpeed: 1 }, 10);
    phase = advanceLiveLoopPhase(phase, 'waveform', { waveformSpeed: 5 }, 10);
    expect(phase).toBeCloseTo(0.322);
    const state = getLoopingAnimationState('waveform', { waveformSpeed: 5 }, { phase });
    expect(((state.timeSeconds * normalizeLoopSpeed('waveform', 5)) % 1 + 1) % 1).toBeCloseTo(phase);
  });

  test('bounds fast dense tick motion even after a delayed frame', () => {
    for (const style of ['ticker']) {
      const values = { rulerSpeed: 5, rulerUnits: 10, tickerSpeed: 5, tickerRatio: 5 };
      const subdivisions = style === 'ruler' ? 10 : 5;
      const next = advanceLiveLoopPhase(0.4, style, values, 500);
      expect(Math.abs(next - 0.4)).toBeLessThanOrEqual(0.25 / subdivisions + 1e-12);
    }
  });

  test('changing direction preserves the rendered position modulo one repeat', () => {
    for (const style of ['ticker', 'waveform']) {
      const phase = 0.7;
      const states = [false, true].map(reverse => getLoopingAnimationState(style, {
        [`${style}Reverse`]: reverse
      }, { phase }));
      const position = state => state.repeatWidth
        ? ((state.loopOffsetX / state.repeatWidth) % 1 + 1) % 1
        : ((state.timeSeconds / state.periodSeconds) % 1 + 1) % 1;
      expect(position(states[0])).toBeCloseTo(position(states[1]));
    }
  });

  test('limits looping GIF eligibility to repeating styles', () => {
    expect(isLoopingGifEligibleStyle('ruler')).toBe(false);
    expect(isLoopingGifEligibleStyle('ticker')).toBe(true);
    expect(isLoopingGifEligibleStyle('waveform')).toBe(true);
    expect(isLoopingGifEligibleStyle('binary')).toBe(false);
  });

  test('Ruler cannot animate or create a GIF even with legacy motion values', () => {
    expect(getLoopingGifFramePlan('ruler', {rulerSpeed: 1})).toBeNull();
    expect(getLoopingAnimationState('ruler', {}, {phase: .4})).toBeNull();
    expect(advanceLiveLoopPhase(.4, 'ruler', {}, 100)).toBe(0);
  });

  test('builds a ticker loop plan from the bottom repeat count', () => {
    const plan = getLoopingGifFramePlan('ticker', {
      tickerRepeats: 25,
      tickerSpeed: 0.5
    }, {
      barWidth: 250
    });

    expect(plan.style).toBe('ticker');
    expect(plan.periodSeconds).toBeCloseTo(2);
    expect(plan.repeatWidth).toBeCloseTo(10);
    expect(plan.getLoopOffsetX(0.25)).toBeCloseTo(-2.5);
  });

  test('flips ticker loop offsets when reverse is enabled', () => {
    const plan = getLoopingGifFramePlan('ticker', {
      tickerRepeats: 25,
      tickerSpeed: 1,
      tickerReverse: true
    }, {
      barWidth: 250
    });

    expect(plan.getLoopOffsetX(0.25)).toBeCloseTo(2.5);
  });

  test('builds a waveform loop plan from waveform speed', () => {
    const plan = getLoopingGifFramePlan('waveform', {
      waveformSpeed: 2
    });

    expect(plan.style).toBe('waveform');
    expect(plan.periodSeconds).toBeCloseTo(1 / (plan.style === 'ticker' ? 1.6 : 1.2));
    expect(plan.frameCount).toBe(Math.round(Math.round(plan.periodSeconds * 100) * 0.3));
    expect(plan.getTimeSeconds(0.5)).toBeCloseTo(0.5 / 1.2);
  });

  test('reverses waveform time progression when reverse is enabled', () => {
    const plan = getLoopingGifFramePlan('waveform', {
      waveformSpeed: 2,
      waveformReverse: true
    });

    expect(plan.getTimeSeconds(0.5)).toBeCloseTo(-0.5 / 1.2);
  });

  test('caps very fast loop exports to viewer-safe frame delays', () => {
    const plan = getLoopingGifFramePlan('ticker', {
      tickerRepeats: 20,
      tickerSpeed: 5
    }, {
      barWidth: 200
    });

    expect(plan.periodSeconds).toBeCloseTo(1 / (plan.style === 'ticker' ? 1.6 : 1.2));
    expect(plan.frameCount).toBe(Math.round(Math.round(plan.periodSeconds * 100) * 0.3));
    expect(plan.frameDelayMs).toBeGreaterThanOrEqual(20);
  });

  test('derives live loop state from elapsed time and style speed', () => {
    const state = getLoopingAnimationState('ticker', {
      tickerRepeats: 20,
      tickerSpeed: 2
    }, {
      barWidth: 200,
      elapsedSeconds: 0.125
    });

    expect(state.periodSeconds).toBeCloseTo(0.625);
    expect(state.progress).toBeCloseTo(0.2);
    expect(state.loopOffsetX).toBeCloseTo(-2);
  });
});


test.each(['ticker', 'waveform'])('%s retains historical rates and offers a four-times-default maximum', style => {
  for (const speed of [0.2, 0.3, 0.4, 0.8, ...(style === 'waveform' ? [1] : [])]) {
    expect(normalizeLoopSpeed(style, String(speed))).toBe(speed);
    const control = `${style}-speed-slider`;
    expect(normalizeMotionSpeedControls({ [control]: String(speed) })[control]).toBe(String(speed));
  }
  expect(getLoopSpeedLimits(style).max).toBeCloseTo(getLoopSpeedLimits(style).default * 4);
  for (const hz of [60, 120, 144, 240]) {
    let phase = 0;
    for (let i = 0; i < hz / 4; i++) {
      phase = advanceLiveLoopPhase(phase, style, { [`${style}Speed`]: getLoopSpeedLimits(style).max, tickerRatio: 5 }, 1000 / hz);
    }
    expect(phase).toBeCloseTo(style === 'ticker' ? 1 - getLoopSpeedLimits(style).max / 4 : getLoopSpeedLimits(style).max / 4, 9);
  }
});


test.each(['ticker', 'waveform'])('%s fastest loop retains encoded timing within GIF quantization', style => {
  const { frameTiming } = require('../js/utils/transparentGif');
  const plan = getLoopingGifFramePlan(style, { [`${style}Speed`]: 2 });
  const timing = frameTiming(plan.periodSeconds, plan.frameCount);
  expect(Math.abs(timing.durationMs - plan.periodSeconds * 1000)).toBeLessThanOrEqual(5);
  expect(timing.delays.reduce((sum, delay) => sum + delay, 0)).toBe(timing.durationMs);
  expect(Math.min(...timing.delays)).toBeGreaterThanOrEqual(20);
});

test('native controls and runtime speed policy agree without changing saved defaults', () => {
  const html = require('node:fs').readFileSync(require.resolve('../generator/index.html'), 'utf8');
  for (const style of ['ticker', 'waveform']) {
    const input = html.match(new RegExp(`<input[^>]*id="${style}-speed-slider"[^>]*>`))[0];
    const limits = getLoopSpeedLimits(style);
    for (const [attribute, expected] of Object.entries({ min: limits.min, max: limits.max, step: limits.step, value: limits.default })) {
      expect(Number(input.match(new RegExp(` ${attribute}="([^" ]+)"`))[1])).toBe(expected);
    }
  }
  expect(getLoopSpeedLimits('ticker').default).toBe(0.4);
  expect(getLoopSpeedLimits('waveform').default).toBe(0.3);
});

// Exercise actual selectable rates rather than only the default frame count.
test.each(['ticker', 'waveform', 'gradient'])('%s exports near 30 fps across its speed range without shortening loops', style => {
  const { frameTiming } = require('../js/utils/transparentGif');
  const limits = getLoopSpeedLimits(style);
  for (const speed of [limits.min, limits.default, limits.max]) {
    const plan = getLoopingGifFramePlan(style, { [`${style}Speed`]: speed });
    const timing = frameTiming(plan.periodSeconds, plan.frameCount);
    expect(Math.abs(plan.frameCount - timing.durationMs * 0.03)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(timing.durationMs - plan.periodSeconds * 1000)).toBeLessThanOrEqual(5);
    expect(Math.min(...timing.delays)).toBeGreaterThanOrEqual(30);
    expect(Math.max(...timing.delays)).toBeLessThanOrEqual(40);
    expect(plan.frameCount).toBeLessThanOrEqual(3000);
  }
});
