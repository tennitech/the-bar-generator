const {
  normalizeTrianglesPatternSettings,
  normalizeTrianglePatternDirection,
  createTrianglesPatternGeometry,
  createBarPatternSVG
} = require('../js/utils/barPattern');
const { hasGeneratorQueryState } = require('../js/utils/generatorRoutes');

const contains = (point, triangle) => {
  const signs = triangle.map((a, i) => {
    const b = triangle[(i + 1) % 3];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
  });
  return signs.every(v => v > 0) || signs.every(v => v < 0);
};

describe('triangle configurability', () => {
  test('retains defaults and normalizes invalid or out-of-range values', () => {
    expect(normalizeTrianglesPatternSettings()).toEqual({ variant: 1, count: 14, direction: 'up-left' });
    expect(normalizeTrianglesPatternSettings({ variant: 9, count: 100, direction: 'up' }))
      .toEqual({ variant: 2, count: 28, direction: 'up-right' });
    expect(normalizeTrianglesPatternSettings({ count: -1, direction: 'sideways' }).count).toBe(6);
    expect(normalizeTrianglesPatternSettings({ count: 'bad', direction: 'sideways' }))
      .toEqual({ variant: 1, count: 14, direction: 'up-left' });
    expect(hasGeneratorQueryState('?trianglesCount=8')).toBe(true);
    expect(hasGeneratorQueryState('?trianglesDirection=up')).toBe(true);
  });

  test.each(['up-left', 'up-right', 'down-left', 'down-right'])('preserves exact painted width and complementarity for every count facing %s', direction => {
    for (let count = 6; count <= 28; count++) {
      const bounds = { count, direction, barStartX: -20, barY: 132.4885, exactBarWidth: 250, barHeight: 18 };
      const a = createTrianglesPatternGeometry({ ...bounds, variant: 1 }).polygons;
      const b = createTrianglesPatternGeometry({ ...bounds, variant: 2 }).polygons;
      for (const polygons of [a, b]) {
        expect(polygons).toHaveLength(count);
        const points = polygons.flat();
        expect(Math.min(...points.map(p => p.x))).toBeCloseTo(-20);
        expect(Math.max(...points.map(p => p.x))).toBeCloseTo(230);
        expect(Math.min(...points.map(p => p.y))).toBeCloseTo(132.4885);
        expect(Math.max(...points.map(p => p.y))).toBeCloseTo(150.4885);
      }
      for (let cell = 0; cell < count; cell++) {
        for (const [tx, ty] of [[0.2, 0.4], [0.7, 0.2], [0.3, 0.8], [0.9, 0.6]]) {
          const p = { x: -20 + (cell + tx) * 250 / count, y: 132.4885 + ty * 18 };
          expect(Number(contains(p, a[cell])) + Number(contains(p, b[cell]))).toBe(1);
        }
      }
    }
  });

  test('explicitly migrates legacy direction values and preserves their geometry', () => {
    expect(normalizeTrianglePatternDirection('up')).toBe('up-right');
    expect(normalizeTrianglePatternDirection('down')).toBe('down-right');
    for (const count of [6, 14, 28]) for (const variant of [1, 2]) {
      for (const [oldValue, newValue] of [['up', 'up-right'], ['down', 'down-right']]) {
        expect(createTrianglesPatternGeometry({ count, variant, direction: oldValue }))
          .toEqual(createTrianglesPatternGeometry({ count, variant, direction: newValue }));
      }
    }
  });

  test('left directions reflect right directions within each cell without changing spacing', () => {
    const options = { count: 9, variant: 1, barStartX: -20, exactBarWidth: 250 };
    for (const vertical of ['up', 'down']) {
      const right = createTrianglesPatternGeometry({ ...options, direction: vertical + '-right' }).polygons;
      const left = createTrianglesPatternGeometry({ ...options, direction: vertical + '-left' }).polygons;
      right.forEach((polygon, i) => polygon.forEach((point, j) => {
        expect(left[i][j].y).toBe(point.y);
        expect(left[i][j].x + point.x).toBeCloseTo(2 * (options.barStartX + i * 250 / 9) + 250 / 9);
      }));
    }
  });

  test('direction is an exact vertical reflection with no density or spacing changes', () => {
    const options = { count: 9, variant: 2, barY: 132.4885 };
    const down = createTrianglesPatternGeometry({ ...options, direction: 'down-right' }).polygons;
    const up = createTrianglesPatternGeometry({ ...options, direction: 'up-right' }).polygons;
    down.forEach((p, i) => p.forEach((point, j) => {
      expect(up[i][j].x).toBe(point.x);
      expect(up[i][j].y + point.y).toBeCloseTo(2 * options.barY + 18);
    }));
  });

  test.each(['up-left', 'up-right', 'down-left', 'down-right'])('SVG serializes the same selected preview geometry facing %s', direction => {
    for (const count of [6, 14, 28]) for (const variant of [1, 2]) {
      const geometry = createTrianglesPatternGeometry({ count, direction, variant, barY: 132.4885 }).polygons;
      const svg = createBarPatternSVG({ currentShader: 19, barStartX: 0, barY: 132.4885,
        exactBarWidth: 250, barHeight: 18, fgColor: '#000',
        values: { trianglesCount: count, trianglesDirection: direction, trianglesVariant: variant } });
      const serialized = Array.from(svg.matchAll(/<polygon points="([^"]+)"/g), m => m[1]);
      expect(serialized).toEqual(geometry.map(p => p.map(point => `${point.x},${point.y}`).join(' ')));
    }
  });
});
