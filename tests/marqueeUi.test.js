const {
  computeRowTopPositions,
  getEdgeCaseRowLiftPx,
  getNarrowPortraitHeroScaleCap,
  getResponsiveMarqueeMetrics,
  getRowStepPx
} = require('../js/marqueeUi.js');

describe('marquee row layout helpers', () => {
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

  test('uses the larger desktop sizing tier at 1920x1080 and above', () => {
    expect(getResponsiveMarqueeMetrics(1920, 1080)).toEqual({
      assetWidth: '32rem',
      rowHeight: '4.45rem',
      rowGap: '1.7rem',
      heroMaxScale: 1.16
    });
  });

  test('keeps the baseline sizing below the large-desktop breakpoint', () => {
    expect(getResponsiveMarqueeMetrics(1919, 1080)).toEqual({
      assetWidth: '28rem',
      rowHeight: '3.9rem',
      rowGap: '1.45rem',
      heroMaxScale: 1
    });
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

  test('shrinks the hero sooner for narrow portrait edge cases like 547x879', () => {
    expect(getNarrowPortraitHeroScaleCap(547, 879)).toBeLessThan(0.9);
  });

  test('does not shrink the hero early for wider layouts', () => {
    expect(getNarrowPortraitHeroScaleCap(760, 879)).toBe(1);
  });
});
