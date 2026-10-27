(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.viewportZoomUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MARK_WIDTH = 250;
  const MARK_HEIGHT = 150.911;
  const STOPS = [100, 125, 150, 200, 250, 300, 400];
  const clampZoom = value => Math.max(1, Math.min(4, Number(value) || 1));

  function getFitLayout(width, height, reservedControlSpace = 88) {
    width = Math.max(1, Number(width) || 1);
    height = Math.max(1, Number(height) || 1);
    const controlSpace = Math.min(Math.max(0, reservedControlSpace), Math.max(0, height - 1));
    const padding = Math.min(80, Math.max(20, Math.min(width, height) * 0.08),
      width * 0.2, (height - controlSpace) * 0.2);
    const usableWidth = Math.max(1, width - padding * 2);
    const usableHeight = Math.max(1, height - controlSpace - padding * 2);
    return {
      scale: Math.min(usableWidth / MARK_WIDTH, usableHeight / MARK_HEIGHT),
      centerX: width / 2,
      centerY: (height - controlSpace) / 2,
      controlSpace, padding, usableWidth, usableHeight
    };
  }

  function getNextZoom(level, direction) {
    const percent = clampZoom(level) * 100;
    const next = direction > 0
      ? STOPS.find(stop => stop > percent + 0.1)
      : [...STOPS].reverse().find(stop => stop < percent - 0.1);
    return (next || (direction > 0 ? 400 : 100)) / 100;
  }

  function getPanBounds(layout, level) {
    const scale = Math.max(0.0001, layout.scale);
    const x = Math.max(0, (MARK_WIDTH * scale * clampZoom(level) - layout.usableWidth) / (2 * scale));
    const y = Math.max(0, (MARK_HEIGHT * scale * clampZoom(level) - layout.usableHeight) / (2 * scale));
    return { minX: -x, maxX: x, minY: -y, maxY: y };
  }

  function anchorPan(pan, anchor, oldZoom, newZoom, scale) {
    const ratio = newZoom / Math.max(0.0001, oldZoom);
    return {
      x: anchor.x / scale - (anchor.x / scale - pan.x) * ratio,
      y: anchor.y / scale - (anchor.y / scale - pan.y) * ratio
    };
  }

  return { getFitLayout, getNextZoom, getPanBounds, anchorPan, clampZoom };
});
