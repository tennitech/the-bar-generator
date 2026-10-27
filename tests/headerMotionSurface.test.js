const { getSurfaceLayout } = require('../js/utils/headerMotionSurface');
const geometry = { width: 250, height: 150.4885, barY: 132.4885, barHeight: 18 };
test.each([1, 2, 3])('keeps the bar in the same uniform official vector transform at DPR %s', dpr => {
  const box = getSurfaceLayout(geometry, 60, 36.25, dpr);
  const scale = 60 / 250;
  const top = (36.25 - geometry.height * scale) / 2;
  expect(box.left).toBe(0);
  expect(box.top).toBeCloseTo(top + geometry.barY * scale, 10);
  expect(box.height).toBeCloseTo(18 * scale, 10);
  expect(box.width).toBe(60);
  expect(box.pixelWidth).toBe(60 * dpr);
  expect(box.pixelHeight).toBe(Math.round(box.height * dpr));
  expect(box.top + box.height).toBeLessThanOrEqual(36.25);
});
