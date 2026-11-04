const { normalizeCirclesGradientSettings: normalize, createCirclesGradientPatternGeometry: geometry } = require('../js/utils/barPattern');
test('legacy variants and explicit preset settings have identical geometry', () => {
  for (const variant of [1, 2, 3]) expect(geometry(normalize({ variant }))).toEqual(geometry({ variant }));
  expect(geometry({ variant: 1 }).circles).toHaveLength(86);
  expect(geometry({ variant: 2 }).circles).toHaveLength(48);
  expect(geometry({ variant: 3 }).circles).toHaveLength(84);
});
test('controls are finite, bounded and zero values remain meaningful', () => {
  expect(normalize({ columns: Infinity, rows: -100, size: 999, contrast: 0, stagger: 0 })).toMatchObject({ columns: 29, rows: 1, size: 100, contrast: 0, stagger: 0 });
  expect(normalize({ circlesGradientVariant: 2, circlesGradientRows: '5', circlesGradientReverse: 'false' })).toMatchObject({ variant: 2, columns: 24, rows: 5, reverse: false });
});
test('every control changes geometry, and reversing twice recovers the baseline', () => {
  const original = geometry();
  for (const values of [{ columns: 35 }, { rows: 5 }, { size: 50 }, { contrast: 0 }, { stagger: 0 }, { reverse: true }]) expect(geometry(values)).not.toEqual(original);
  for (const variant of [1, 2, 3]) {
    const a = geometry({ variant, size: 80 });
    const b = geometry({ variant, size: 80, reverse: true });
    expect(b.circles.map(c => ({ ...c, cx: variant === 1 ? c.cx : 250 - c.cx, cy: variant === 1 ? 18 - c.cy : c.cy })))
      .toEqual(a.circles.map(c => ({ ...c, cx: variant === 1 ? c.cx : 250 - (250 - c.cx), cy: variant === 1 ? 18 - (18 - c.cy) : c.cy })));
  }
});
test('all parameter extremes stay circular and wholly bounded with a 240-dot budget', () => {
  for (const variant of [1, 2, 3]) for (const columns of [8, 29, 48]) for (const rows of [1, 3, 5])
    for (const size of [25, 100]) for (const contrast of [0, 100]) for (const stagger of [0, 100]) for (const reverse of [false, true]) {
      const circles = geometry({ variant, columns, rows, size, contrast, stagger, reverse, barStartX: 20, barY: 40 }).circles;
      expect(circles.length).toBeLessThanOrEqual(240);
      expect(circles.every(c => Number.isFinite(c.r) && c.r > 0 && c.cx - c.r >= 20 - 1e-8 && c.cx + c.r <= 270 + 1e-8 && c.cy - c.r >= 40 - 1e-8 && c.cy + c.r <= 58 + 1e-8)).toBe(true);
    }
});
