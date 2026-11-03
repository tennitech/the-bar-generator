const {
  computeRowTopPositions,
  getEdgeCaseRowLiftPx,
  getNarrowPortraitHeroScaleCap,
  getMarqueeBarStyle,
  getResponsiveMarqueeMetrics,
  getRowStepPx
} = require('../js/marqueeUi.js');

describe('marquee row layout helpers', () => {
  test.each([
    ['Style=Default.svg', 'solid'],
    ['Style=Ruler CM.svg', 'ruler'],
    ['Style=Ticker Md.svg', 'ticker'],
    ['Style=Grid 1.svg', 'grid'],
    ['Style=Lines Md.svg', 'lines'],
    ['Style=Point Connect 2.svg', 'point-connect'],
    ['Style=Triangle Grid 1.svg', 'triangle-grid']
  ])('opens the matching generator for %s', (filename, expectedStyle) => {
    expect(getMarqueeBarStyle(`assets/bar references/${filename}`).value).toBe(expectedStyle);
  });

  test('keeps a constant vertical step across all computed rows', () => {
    const positions = computeRowTopPositions({
      rowCount: 4,
      rowStart: -51,
      rowStep: 60.417
    });

    expect(positions).toHaveLength(4);
    expect(positions[1] - positions[0]).toBeCloseTo(60.417, 3);
    expect(positions[2] - positions[1]).toBeCloseTo(60.417, 3);
    expect(positions[3] - positions[2]).toBeCloseTo(60.417, 3);
  });

  test('uses the original wider-layout pitch when the stage is tall enough', () => {
    expect(getRowStepPx(900)).toBeCloseTo((7.35 / 100) * 900, 3);
  });

  test('locks to the reference minimum pitch on shorter stages', () => {
    expect(getRowStepPx(419)).toBeCloseTo((7.35 / 100) * 822, 3);
  });

  test.each([[1440, 900, 1], [1920, 1080, 1.2], [3840, 2160, 2.4],
    [7680, 4320, 4.8], [5120, 1440, 1.6], [390, 844, 1]])(
    'sizes the complete composition continuously at %ix%i', (width, height, scale) => {
      const metrics = getResponsiveMarqueeMetrics(width, height);
      expect(metrics.scale).toBeCloseTo(scale);
      expect(parseFloat(metrics.assetWidth)).toBeCloseTo(28 * scale);
      expect(parseFloat(metrics.rowGap)).toBeCloseTo(1.45 * scale);
      expect(parseFloat(metrics.rowHeight)).toBeCloseTo(3.9 * scale);
      expect(metrics.heroMaxScale).toBeCloseTo(scale);
    });

  test('does not jump at the former desktop breakpoint', () => {
    const before = getResponsiveMarqueeMetrics(1919, 1080);
    const after = getResponsiveMarqueeMetrics(1920, 1080);
    expect(parseFloat(after.assetWidth) - parseFloat(before.assetWidth)).toBeLessThan(0.01);
  });

  test('bounds vertical spacing by actual row size on tall and large screens', () => {
    expect(getRowStepPx(4000, 62)).toBeCloseTo(62 * 1.32);
    expect(getRowStepPx(5000, 150)).toBeCloseTo(150 * 1.32);
  });

  test('applies extra row lift for near-square tall viewports that collide with the title', () => {
    expect(getEdgeCaseRowLiftPx(887, 820)).toBeGreaterThan(0);
  });

  test('does not lift rows for wider desktop-like viewports', () => {
    expect(getEdgeCaseRowLiftPx(1133, 744)).toBe(0);
  });

  test('adds a narrow portrait clearance lift for crowded logo cases', () => {
    expect(getEdgeCaseRowLiftPx(464, 877)).toBeGreaterThan(0);
  });

  test('does not keep increasing that narrow clearance lift on very small widths', () => {
    expect(getEdgeCaseRowLiftPx(340, 877)).toBe(0);
  });

  test('lifts rows away from the title on short phones', () => {
    expect(getEdgeCaseRowLiftPx(320, 568)).toBeGreaterThan(80);
  });

  test('shrinks the hero sooner for narrow portrait edge cases like 547x879', () => {
    expect(getNarrowPortraitHeroScaleCap(547, 879)).toBeLessThan(0.9);
  });

  test('does not shrink the hero early for wider layouts', () => {
    expect(getNarrowPortraitHeroScaleCap(760, 879)).toBe(1);
  });
});
