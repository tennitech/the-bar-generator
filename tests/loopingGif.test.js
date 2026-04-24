const {
  clampLiveAnimationDeltaMs,
  getPreferredLiveRenderFps,
  getLoopingAnimationState,
  isLoopingGifEligibleStyle,
  getLoopingGifFramePlan
} = require('../js/utils/loopingGif');

describe('loopingGif utils', () => {
  test('targets a high-refresh live render cap without exceeding 120 fps', () => {
    expect(getPreferredLiveRenderFps()).toBe(120);
    expect(getPreferredLiveRenderFps(90)).toBe(90);
    expect(getPreferredLiveRenderFps(240)).toBe(120);
    expect(getPreferredLiveRenderFps(20)).toBe(60);
  });

  test('clamps live animation deltas to avoid giant jumps after stalls', () => {
    expect(clampLiveAnimationDeltaMs(-5)).toBe(0);
    expect(clampLiveAnimationDeltaMs(16.67)).toBeCloseTo(16.67);
    expect(clampLiveAnimationDeltaMs(500)).toBeCloseTo(50);
  });

  test('limits looping GIF eligibility to repeating styles', () => {
    expect(isLoopingGifEligibleStyle('ruler')).toBe(true);
    expect(isLoopingGifEligibleStyle('ticker')).toBe(true);
    expect(isLoopingGifEligibleStyle('waveform')).toBe(true);
    expect(isLoopingGifEligibleStyle('binary')).toBe(false);
  });

  test('builds a ruler loop plan from repeat settings', () => {
    const plan = getLoopingGifFramePlan('ruler', {
      rulerRepeats: 10,
      rulerUnits: 4,
      rulerSpeed: 2
    }, {
      barWidth: 250
    });

    expect(plan.style).toBe('ruler');
    expect(plan.periodSeconds).toBeCloseTo(0.5);
    expect(plan.frameDelayMs).toBeGreaterThan(0);
    expect(plan.repeatWidth).toBeCloseTo((250 / (2 * (10 * 4 + 1) - 1)) * 8);
    expect(plan.getLoopOffsetX(0.5)).toBeCloseTo(plan.repeatWidth / 2);
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
    expect(plan.periodSeconds).toBeCloseTo(0.5);
    expect(plan.frameCount).toBe(24);
    expect(plan.getTimeSeconds(0.5)).toBeCloseTo(0.25);
  });

  test('reverses waveform time progression when reverse is enabled', () => {
    const plan = getLoopingGifFramePlan('waveform', {
      waveformSpeed: 2,
      waveformReverse: true
    });

    expect(plan.getTimeSeconds(0.5)).toBeCloseTo(-0.25);
  });

  test('caps very fast loop exports to viewer-safe frame delays', () => {
    const plan = getLoopingGifFramePlan('ticker', {
      tickerRepeats: 20,
      tickerSpeed: 5
    }, {
      barWidth: 200
    });

    expect(plan.periodSeconds).toBeCloseTo(0.2);
    expect(plan.frameCount).toBe(10);
    expect(plan.frameDelayMs).toBe(20);
  });

  test('derives live loop state from elapsed time and style speed', () => {
    const state = getLoopingAnimationState('ticker', {
      tickerRepeats: 20,
      tickerSpeed: 2
    }, {
      barWidth: 200,
      elapsedSeconds: 0.125
    });

    expect(state.periodSeconds).toBeCloseTo(0.5);
    expect(state.progress).toBeCloseTo(0.25);
    expect(state.loopOffsetX).toBeCloseTo(-2.5);
  });
});
