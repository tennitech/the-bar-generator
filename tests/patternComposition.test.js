const {
  createBarPatternSVG,
  createLinesPatternGeometry,
  createGradientPatternGeometry,
  createCirclesGradientPatternGeometry,
  createTrianglesPatternGeometry
} = require('../js/utils/barPattern');

// Check painted extents, including translated and non-nominal caller dimensions.
describe('experimental pattern compositions', () => {
  test.each([[250, 18, 0, 0], [500, 36, -25, 132.4885], [125, 9, 20, 40]])(
    'keeps every filled primitive inside the %s × %s caller rectangle', (width, height, x, y) => {
      const bounds = { barStartX: x, barY: y, exactBarWidth: width, barHeight: height };
      const contains = (left, top, right, bottom) => {
        expect(left).toBeGreaterThanOrEqual(x - 1e-8);
        expect(top).toBeGreaterThanOrEqual(y - 1e-8);
        expect(right).toBeLessThanOrEqual(x + width + 1e-8);
        expect(bottom).toBeLessThanOrEqual(y + height + 1e-8);
      };
      for (const variant of [1, 2, 3]) {
        const circles = createCirclesGradientPatternGeometry({ ...bounds, variant });
        circles.circles.forEach(c => contains(c.cx - c.r, c.cy - c.r, c.cx + c.r, c.cy + c.r));
        if (variant > 2) continue;
        for (const helper of [createLinesPatternGeometry, createGradientPatternGeometry]) {
          helper({ ...bounds, variant }).rects.forEach(r => contains(r.x, r.y, r.x + r.width, r.y + r.height));
        }
        createTrianglesPatternGeometry({ ...bounds, variant }).polygons.forEach(polygon => {
          polygon.forEach(p => contains(p.x, p.y, p.x, p.y));
        });
      }
    }
  );

  test.each([[19, 'triangles'], [17, 'gradient'], [16, 'circlesGradient']])(
    'serializes the selected non-default variant for shader %s', (shader, key) => {
      const render = variant => createBarPatternSVG({
        currentShader: shader, barStartX: 0, barY: 132.4885,
        exactBarWidth: 250, barHeight: 18, fgColor: '#000000',
        values: { [key + 'Variant']: variant }
      });
      expect(render(2)).not.toEqual(render(1));
      expect(render(2)).not.toMatch(/NaN|undefined|opacity|linearGradient/);
    }
  );

  test('keeps nominal triangles and dots large enough to resolve', () => {
    const polygons = createTrianglesPatternGeometry({ variant: 2 }).polygons;
    for (const polygon of polygons) {
      expect(Math.max(...polygon.map(p => p.y)) - Math.min(...polygon.map(p => p.y))).toBeGreaterThanOrEqual(8);
    }
    for (const variant of [1, 2, 3]) {
      const circles = createCirclesGradientPatternGeometry({ variant }).circles;
      expect(Math.min(...circles.map(c => c.r * 2))).toBeGreaterThanOrEqual(2);
    }
  });

  test('circle variants encode vertical, directional, and symmetric area progressions', () => {
    const vertical = createCirclesGradientPatternGeometry({ variant: 1 }).circles;
    expect(vertical[0].r).toBeGreaterThan(vertical[28].r);
    expect(vertical[28].r).toBeGreaterThan(vertical[56].r);
    const directional = createCirclesGradientPatternGeometry({ variant: 2 }).circles.slice(0, 24);
    directional.slice(1).forEach((c, i) => expect(c.r).toBeGreaterThan(directional[i].r));
    const lens = createCirclesGradientPatternGeometry({ variant: 3 }).circles.slice(0, 28);
    lens.forEach((c, i) => expect(c.r).toBeCloseTo(lens[27 - i].r));
    expect(lens[13].r).toBeGreaterThan(lens[0].r * 2);
  });
});
