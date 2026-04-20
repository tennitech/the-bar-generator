const {
  applyTickerWidthRatioBounds,
  getTickerWidthRatioMax,
  setTickerWidthRatioDisplayValue
} = require('../js/utils/tickerDisplay');

describe('Ticker Width Ratio Display', () => {
  test('updates the display label text from slider value', () => {
    const slider = { value: '5' };
    const display = { textContent: '' };

    setTickerWidthRatioDisplayValue(slider, display);

    expect(display.textContent).toBe('1:5');
  });

  test('does nothing when elements are missing', () => {
    expect(() => setTickerWidthRatioDisplayValue(null, null)).not.toThrow();
  });

  test('uses count-ratio-specific width ratio maximums', () => {
    expect(getTickerWidthRatioMax(1)).toBe(2);
    expect(getTickerWidthRatioMax(2)).toBe(3);
    expect(getTickerWidthRatioMax(3)).toBe(5);
    expect(getTickerWidthRatioMax(4)).toBe(7);
    expect(getTickerWidthRatioMax(5)).toBe(10);
  });

  test('updates the slider max and clamps invalid width ratios', () => {
    const countRatio = { value: '1' };
    const widthRatio = { max: '5', value: '5' };

    applyTickerWidthRatioBounds(countRatio, widthRatio);

    expect(widthRatio.max).toBe('2');
    expect(widthRatio.value).toBe('2');

    countRatio.value = '5';
    applyTickerWidthRatioBounds(countRatio, widthRatio);

    expect(widthRatio.max).toBe('10');
    expect(widthRatio.value).toBe('2');
  });
});
