const {
  isLoopingGifEligibleStyle,
  getLoopingGifFramePlan
} = require('../js/utils/loopingGif');

describe('loopingGif utils', () => {
  test('limits looping GIF eligibility to repeating styles', () => {
    expect(isLoopingGifEligibleStyle('ruler')).toBe(true);
    expect(isLoopingGifEligibleStyle('ticker')).toBe(true);
    expect(isLoopingGifEligibleStyle('waveform')).toBe(true);
    expect(isLoopingGifEligibleStyle('binary')).toBe(false);
  });

  test('builds a ruler loop plan from repeat settings', () => {
    const plan = getLoopingGifFramePlan('ruler', {
      rulerRepeats: 10,
      rulerUnits: 4
    }, {
      barWidth: 250
    });

    expect(plan.style).toBe('ruler');
    expect(plan.frameCount).toBe(24);
    expect(plan.frameDelayMs).toBeGreaterThan(0);
    expect(plan.repeatWidth).toBeCloseTo((250 / (2 * (10 * 4 + 1) - 1)) * 8);
    expect(plan.getLoopOffsetX(0.5)).toBeCloseTo(plan.repeatWidth / 2);
  });

  test('builds a ticker loop plan from the bottom repeat count', () => {
    const plan = getLoopingGifFramePlan('ticker', {
      tickerRepeats: 25
    }, {
      barWidth: 250
    });

    expect(plan.style).toBe('ticker');
    expect(plan.repeatWidth).toBeCloseTo(10);
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
});
