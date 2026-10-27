const fs = require('node:fs');
const vm = require('node:vm');
const { createRulerPatternGeometry, createTickerPatternGeometry } = require('../js/utils/barPattern');

const context = vm.createContext({ createRulerPatternGeometry, createTickerPatternGeometry,
  RPI_LOGO_GEOMETRY: require('../js/utils/logoGeometry').RPI_LOGO_GEOMETRY,
  REFERENCE_WIDTH: 250, REFERENCE_BAR_HEIGHT: 18 });
vm.runInContext(fs.readFileSync(require.resolve('../js/drawing'), 'utf8'), context);

test.each([[250, 18, 0, 132.4885], [500, 36, -25, 40], [125, 9, 20, -18]])(
  'Ruler retains natural ticks within a fixed %s × %s viewport', (width, height, x, y) => {
    for (const rulerRepeats of [1, 10, 20]) for (const rulerUnits of [2, 4, 10]) {
      const base = { shader: 1, barStartX: x, barY: y, exactBarWidth: width, barHeight: height,
        rulerRepeats, rulerUnits };
      const repeatWidth = createRulerPatternGeometry(base).repeatWidth;
      for (const phase of [undefined, 0, 0.07, 0.23, 0.49, 0.73, 0.99, -0.23]) {
        const options = { ...base, loopOffsetX: phase === undefined ? undefined : phase * repeatWidth };
        const natural = createRulerPatternGeometry(options);
        const bounded = context.createBoundedTickGeometry(options);
        expect(bounded).toEqual(natural);
        expect(bounded.rects.length).toBeGreaterThan(0);
        for (const rect of bounded.rects) {
          expect(rect.isBoundary).toBeUndefined();
          expect(rect.x).toBeGreaterThanOrEqual(x - 1e-8);
          expect(rect.x + rect.width).toBeLessThanOrEqual(x + width + 1e-8);
          expect(rect.y).toBeGreaterThanOrEqual(y - 1e-8);
          expect(rect.y + rect.height).toBeLessThanOrEqual(y + height + 1e-8);
        }
      }
    }
  }
);

test('Ruler allows a natural gap at either edge without changing spacing', () => {
  const options = { shader: 1, exactBarWidth: 250, barHeight: 18, rulerRepeats: 10, rulerUnits: 4 };
  const natural = createRulerPatternGeometry(options);
  const shifted = context.createBoundedTickGeometry({ ...options, loopOffsetX: natural.tickWidth * 1.5 });
  expect(Math.min(...shifted.rects.map(rect => rect.x))).toBeCloseTo(natural.tickWidth * 0.5);
  expect(shifted.tickSpacing).toBe(natural.tickSpacing);
  expect(shifted.tickWidth).toBe(natural.tickWidth);
  expect(context.createBoundedTickGeometry({ shader: 2 }).rects.filter(rect => rect.isBoundary)).toHaveLength(4);
});
