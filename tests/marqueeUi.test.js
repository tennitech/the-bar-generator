const {
  updateRowLayout,
  advanceRowSpeed,
  createRowPatterns,
  syncRowTargetFactor,
  computeRowTopPositions,
  fitRowsAboveHero,
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


describe('marquee hover motion and fixed per-load samples', () => {
  test('hover stops immediately and stays exactly still', () => {
    const state = { isHovered: true, isPressed: false, currentFactor: 1 };
    syncRowTargetFactor(state);
    expect(state.targetFactor).toBe(0);
    expect(state.currentFactor).toBe(0);
    expect(advanceRowSpeed(state.currentFactor, state.targetFactor, 1 / 60)).toBe(0);
  });

  test('press and release remain still while hovered; leaving resumes smoothly', () => {
    const state = { isHovered: true, isPressed: true, currentFactor: 0.7 };
    syncRowTargetFactor(state);
    expect(state.targetFactor).toBe(0);
    expect(state.currentFactor).toBe(0);
    state.isPressed = false;
    syncRowTargetFactor(state);
    expect(state.targetFactor).toBe(0);
    state.isHovered = false;
    syncRowTargetFactor(state);
    expect(state.targetFactor).toBe(1);
    const resumed = advanceRowSpeed(0, state.targetFactor, 0.2);
    expect(resumed).toBeGreaterThan(0.5);
    expect(resumed).toBeLessThan(1);
  });

  test('smooth resume is frame-rate independent', () => {
    const simulate = hz => Array.from({ length: hz / 2 }).reduce(
      speed => advanceRowSpeed(speed, 1, 1 / hz), 0);
    expect(simulate(60)).toBeCloseTo(simulate(120), 12);
    expect(simulate(120)).toBeCloseTo(simulate(240), 12);
  });

  test('bounded lane patterns cover every selected family without altering the sample set', () => {
    const entries = Array.from({ length: 21 }, (_, i) => ({ path: `sample-${i}` }));
    const patterns = createRowPatterns(entries);
    expect(patterns).toHaveLength(10);
    expect(patterns.every(row => row.length === 7 && new Set(row).size === 7)).toBe(true);
    expect(new Set(patterns.flat())).toEqual(new Set(entries.map(entry => entry.path)));
    expect(createRowPatterns(entries)).toEqual(patterns);
    expect(createRowPatterns([...entries].reverse())).not.toEqual(patterns);
  });
});


describe('lane-level marquee rendering', () => {
  test('updates one transform per row regardless of repeated bar count', () => {
    const write = jest.fn();
    const style = { set transform(value) { write(value); } };
    const state = { slotWidth: 100, patternSpan: 700, direction: -1, travel: 25,
      track: { style }, items: Array.from({ length: 23 }, () => ({ element: { style: Object.freeze({ left: '0px' }) } })) };
    updateRowLayout(state);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenLastCalledWith('translate3d(-725px, 0, 0)');
    updateRowLayout(state);
    expect(write).toHaveBeenCalledTimes(1);
    state.travel = 26;
    updateRowLayout(state);
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith('translate3d(-726px, 0, 0)');
    state.travel = 726;
    updateRowLayout(state);
    expect(write).toHaveBeenCalledTimes(2);
    state.direction = 1;
    updateRowLayout(state);
    expect(write).toHaveBeenLastCalledWith('translate3d(-1374px, 0, 0)');
  });
});


describe('measured desktop hero clearance', () => {
  const geometry = {
    rowStart: -100, rowStep: 80, rowHeight: 62,
    firstBounds: { left: -900, top: -450 }, tiltRadians: 17 * Math.PI / 180,
    heroRects: [{ left: 30, right: 118, top: 1100, width: 88, height: 53 },
      { left: 680, right: 975, top: 1320, width: 295, height: 44 }]
  };
  test.each([400, 768, 900, 1200, 1470, 2000, 4320])('fills to the text at %ipx without changing pitch', height => {
    const heroRects = geometry.heroRects.map(rect => ({ ...rect, top: rect.top + height - 1470 }));
    const result = fitRowsAboveHero({ ...geometry, heroRects });
    const finalShift = result.rowStart - geometry.rowStart + (result.rowCount - 1) * geometry.rowStep;
    const gaps = heroRects.map(rect => rect.top - geometry.firstBounds.top
      - (rect.right - geometry.firstBounds.left) * Math.tan(geometry.tiltRadians)
      - geometry.rowHeight * Math.cos(geometry.tiltRadians) - finalShift);
    expect(Math.min(...gaps)).toBeCloseTo(geometry.rowStep * 0.6, 8);
    expect(result.rowCount).toBeGreaterThan(0);
    expect(result.rowStart).toBeLessThanOrEqual(geometry.rowStart + 1e-7);
    expect(result.rowStart).toBeGreaterThanOrEqual(geometry.rowStart - geometry.rowStep - 1e-7);
  });
  test('the lower boundary follows one-pixel text movement without a lane-size jump', () => {
    const before = fitRowsAboveHero(geometry);
    const after = fitRowsAboveHero({ ...geometry,
      heroRects: geometry.heroRects.map(rect => ({ ...rect, top: rect.top + 1 })) });
    const end = layout => layout.rowStart + (layout.rowCount - 1) * geometry.rowStep;
    expect(end(after) - end(before)).toBeCloseTo(1, 8);
  });
  test('hidden credit rectangles do not constrain the field', () => {
    const rect = geometry.heroRects[0];
    expect(fitRowsAboveHero({ ...geometry, heroRects: [rect, { top: 0, left: 0, right: 0, width: 0, height: 0 }] }))
      .toEqual(fitRowsAboveHero({ ...geometry, heroRects: [rect] }));
    expect(fitRowsAboveHero({ ...geometry, heroRects: [] })).toBeNull();
  });
});
