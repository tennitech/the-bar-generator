const fs = require('node:fs');
const vm = require('node:vm');
const catalog = require('../js/utils/marqueeCatalog');
const { getResponsiveMarqueeMetrics } = require('../js/marqueeUi');
const source = fs.readFileSync(require.resolve('../js/marqueeUi'), 'utf8');

function fixture(width, height, dpr = 1) {
  let size = { width, height, dpr };
  const metrics = () => getResponsiveMarqueeMetrics(size.width, size.height);
  function node() {
    const classes = new Set(), listeners = new Map();
    return { listeners, style: { setProperty: jest.fn() },
      classList: { add: v => classes.add(v), remove: v => classes.delete(v), contains: v => classes.has(v) },
      addEventListener: (name, fn) => listeners.set(name, fn), remove: jest.fn() };
  }
  const stage = { ...node(), append: jest.fn(), getBoundingClientRect: () => ({ height: size.height * 1.24 }) };
  function makeRow(index) {
    const element = node(), asset = node();
    Object.defineProperty(element, 'offsetHeight', { get: () => 3.9 * 16 * metrics().scale });
    element.getBoundingClientRect = () => {
      const angle = 17 * Math.PI / 180, rowWidth = 2.2 * size.width, rowHeight = element.offsetHeight;
      return { left: 0.42 * size.width - rowWidth / 2 * Math.cos(angle) - rowHeight / 2 * Math.sin(angle),
        top: -0.12 * size.height + parseFloat(element.style.top || 0) + rowHeight / 2
          - rowWidth / 2 * Math.sin(angle) - rowHeight / 2 * Math.cos(angle) };
    };
    return { index, element, asset, items: [{ asset }], direction: index % 2 ? 1 : -1,
      isHovered: false, isPressed: false, hoveredAsset: null, focusedAsset: null, pressedAsset: null,
      drag: null, inertiaVelocity: 0, inertiaOrigin: null, currentFactor: 1, targetFactor: 1 };
  }
  const root = node();
  const document = { documentElement: root, querySelector: () => null, getElementById: () => null,
    querySelectorAll: () => [{ getBoundingClientRect: () => ({ left: 32 * metrics().scale,
      right: 552 * metrics().scale, top: size.height - 330 * metrics().scale,
      width: 520 * metrics().scale, height: 230 * metrics().scale }) }] };
  const window = { innerWidth: width, innerHeight: height, devicePixelRatio: dpr,
    MarqueeCatalog: catalog, matchMedia: () => ({ matches: false }) };
  const context = vm.createContext({ window, document, makeRow, makeTestNode: node, stage,
    getComputedStyle: () => ({ getPropertyValue: () => '17' }) });
  vm.runInContext(source, context);
  // Supply measured row/hero bounds; retain the real responsive row fitting and
  // interaction/selection code. DOM image measurement is independent of this bug.
  vm.runInContext(`
    createRow = index => {
      const state = makeRow(index);
      bindAssetInteractions(state.asset, state);
      return state;
    };
    syncRowMeasurements = () => {};
    var rows = Array.from({ length: 10 }, (_, index) => createRow(index));
    var register = bindStageFocus(stage, rows);
    syncRowVerticalLayout(rows, stage, register);
  `, context);
  return { stage, rows: () => vm.runInContext('rows', context),
    pruneHoveredLink() {
      return vm.runInContext(`
        var row = rows.at(-1);
        Object.assign(row, { pattern: ['a', 'b'], slotWidth: 100, rowWidth: 100,
          patternSpan: 200, travel: 0, track: { style: {} } });
        row.items = Array.from({ length: 9 }, () => ({ element: makeTestNode(), asset: makeTestNode() }));
        var selected = row.items.at(-1).asset;
        bindAssetInteractions(selected, row);
        selected.listeners.get('pointerenter')({ pointerType: 'mouse' });
        ensureRowItems(row);
        ({ count: row.items.length, hovered: row.hoveredAsset,
          selectedClass: selected.classList.contains('is-hovered') });
      `, context);
    },
    resize(nextWidth, nextHeight, nextDpr = dpr) {
      size = { width: nextWidth, height: nextHeight, dpr: nextDpr };
      Object.assign(window, { innerWidth: nextWidth, innerHeight: nextHeight, devicePixelRatio: nextDpr });
      vm.runInContext('syncRowVerticalLayout(rows, stage, register)', context);
    } };
}
const enter = row => row.asset.listeners.get('pointerenter')({ pointerType: 'mouse' });
const leave = row => row.asset.listeners.get('pointerleave')();

test.each([[1440, 900, 1, false], [1920, 1080, 2, false], [1230, 1470, 2, true],
  [5120, 1440, 2, true], [3840, 2160, 2, false], [7680, 4320, 3, false]])(
  'the actual fitted bottom row selects and clears at %ix%i / DPR %i', (width, height, dpr, grows) => {
    const s = fixture(width, height, dpr), rows = s.rows(), bottom = rows.at(-1);
    if (grows) expect(rows.length).toBeGreaterThan(10);
    enter(bottom);
    expect(bottom.asset.classList.contains('is-hovered')).toBe(true);
    expect(s.stage.classList.contains('has-bar-focus')).toBe(true);
    expect(bottom.element.classList.contains('is-focus-row')).toBe(true);
    leave(bottom);
    expect(s.stage.classList.contains('has-bar-focus')).toBe(false);
  });

test('resize removes a selected extra row cleanly and newly grown rows share the same selection owner', () => {
  const s = fixture(1230, 1470, 2), oldBottom = s.rows().at(-1), originalCount = s.rows().length;
  enter(oldBottom);
  s.resize(1440, 900);
  expect(s.rows().length).toBeLessThan(originalCount);
  expect(s.stage.classList.contains('has-bar-focus')).toBe(false);
  expect(oldBottom.element.remove).toHaveBeenCalled();
  enter(s.rows().at(-1)); leave(oldBottom);
  expect(s.stage.classList.contains('has-bar-focus')).toBe(true);
  s.resize(5120, 1440, 2);
  expect(s.rows().length).toBeGreaterThan(10);
  const bottom = s.rows().at(-1);
  enter(bottom); leave(s.rows()[0]);
  expect(s.stage.classList.contains('has-bar-focus')).toBe(true);
  leave(bottom);
  expect(s.stage.classList.contains('has-bar-focus')).toBe(false);
});

test('DPR does not multiply composition size or change fitted row coverage', () => {
  const counts = [1, 2, 3].map(dpr => fixture(1230, 1470, dpr).rows().length);
  expect(counts[0]).toBeGreaterThan(10);
  expect(new Set(counts).size).toBe(1);
});

test('pruning a hovered repeated link during responsive resize clears global emphasis immediately', () => {
  const s = fixture(1230, 1470, 2), result = s.pruneHoveredLink();
  expect(result.count).toBe(8);
  expect(result.hovered).toBe(null);
  expect(result.selectedClass).toBe(false);
  expect(s.stage.classList.contains('has-bar-focus')).toBe(false);
});
