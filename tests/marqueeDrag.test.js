const { projectLaneDelta, sampleDragVelocity, advanceRowInertia,
  bindAssetInteractions, bindStageFocus, resetRowInteraction } = require('../js/marqueeUi');

const angle = 17 * Math.PI / 180;
const axis = { x: Math.cos(angle), y: Math.sin(angle) };

describe('lane drag physics', () => {
  test('projects screen movement onto the rotated lane without a vertical jump', () => {
    expect(projectLaneDelta(100 * axis.x, 100 * axis.y, axis)).toBeCloseTo(100);
    expect(projectLaneDelta(-100 * axis.y, 100 * axis.x, axis)).toBeCloseTo(0);
    expect(projectLaneDelta(100, 0, axis)).toBeCloseTo(95.6305);
  });

  test('bounds fling speed, filters event noise, and ignores invalid time samples', () => {
    expect(sampleDragVelocity(0, 100000, 0.1, 1800)).toBeLessThanOrEqual(1800);
    expect(sampleDragVelocity(0, -100000, 0.1, 1800)).toBeGreaterThanOrEqual(-1800);
    expect(sampleDragVelocity(100, 100, 0, 1800)).toBe(100);
    expect(sampleDragVelocity(0, 1, 0.01, 1800)).toBeGreaterThan(0);
    expect(sampleDragVelocity(0, 1, 0.01, 1800)).toBeLessThan(100);
  });

  test.each([1800, -1800])('inertia has bounded travel and reaches rest for velocity %i', initial => {
    let velocity = initial, distance = 0, steps = 0;
    while (velocity && steps++ < 1000) {
      const next = advanceRowInertia(velocity, 1 / 120);
      expect(Math.abs(next.velocity)).toBeLessThan(Math.abs(velocity));
      velocity = next.velocity; distance += next.distance;
    }
    expect(velocity).toBe(0);
    expect(steps).toBeLessThan(130);
    expect(Math.abs(distance)).toBeLessThan(Math.abs(initial) / 5.5);
    expect(Math.sign(distance)).toBe(Math.sign(initial));
  });

  test('inertia integrates the same distance at different frame rates', () => {
    const simulate = hz => Array.from({ length: hz / 2 }).reduce(({ velocity, distance }) => {
      const next = advanceRowInertia(velocity, 1 / hz);
      return { velocity: next.velocity, distance: distance + next.distance };
    }, { velocity: 1800, distance: 0 });
    expect(simulate(60).distance).toBeCloseTo(simulate(120).distance, 10);
    expect(simulate(120).distance).toBeCloseTo(simulate(240).distance, 10);
  });
});

function fixture(direction = -1) {
  function node() {
    const listeners = new Map(), classes = new Set(), captures = new Set();
    return { style: {}, listeners,
      classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
      addEventListener: (name, callback) => listeners.set(name, callback),
      setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id),
      releasePointerCapture: id => captures.delete(id),
      closest() { return this; } };
  }
  const asset = node();
  const state = { element: node(), track: node(), items: [{ asset }], direction,
    slotWidth: 472, patternSpan: 3304, travel: 400, currentFactor: 1, targetFactor: 1,
    isHovered: false, isPressed: false, hoveredAsset: null, pressedAsset: null,
    inertiaVelocity: 0, drag: null, suppressClick: false };
  global.window = { matchMedia: () => ({ matches: false }) };
  global.document = { elementFromPoint: () => asset };
  global.getComputedStyle = () => ({ transform: 'test matrix' });
  global.DOMMatrixReadOnly = class { constructor() { this.a = axis.x; this.b = axis.y; } };
  bindAssetInteractions(asset, state);
  const send = (type, params = {}) => {
    const event = { type, pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true,
      clientX: 100, clientY: 100, timeStamp: 0, cancelable: true, detail: 1,
      preventDefault: jest.fn(), stopImmediatePropagation: jest.fn(), ...params };
    asset.listeners.get(type)(event); return event;
  };
  return { state, asset, send };
}

afterEach(() => {
  delete global.window; delete global.document; delete global.getComputedStyle; delete global.DOMMatrixReadOnly;
});

describe('native-link and gesture lifecycle', () => {
  test.each([-1, 1])('leaving row %i perpendicular to a captured flick preserves release momentum', direction => {
    const { state, asset, send } = fixture(direction);
    send('pointerdown');
    send('pointermove', { clientX: 100 + 120 * axis.x, clientY: 100 + 120 * axis.y, timeStamp: 70 });
    const velocity = state.drag.velocity;
    send('pointerleave');
    expect(asset.hasPointerCapture(1)).toBe(true);
    for (let i = 1; i <= 8; i++) {
      send('pointermove', { clientX: 100 + 120 * axis.x - 12 * i * axis.y,
        clientY: 100 + 120 * axis.y + 12 * i * axis.x, timeStamp: 70 + i * 15 });
    }
    expect(state.travel).toBeCloseTo(400 + 120 * direction);
    document.elementFromPoint = () => null;
    send('pointerup', { timeStamp: 200 });
    expect(state.inertiaVelocity).toBeGreaterThan(velocity * 0.5);
    expect(state.inertiaVelocity).toBeLessThan(velocity);
    expect(state.hoveredAsset).toBe(null);
    expect(asset.hasPointerCapture(1)).toBe(false);
    expect(send('click').preventDefault).toHaveBeenCalledTimes(1);
  });

  test('a stationary hold or browser cancellation after an off-row movement still stops the throw', () => {
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      const { state, send } = fixture();
      send('pointerdown');
      send('pointermove', { clientX: 200, timeStamp: 50 });
      send('pointermove', { clientX: 200 - 60 * axis.y, clientY: 100 + 60 * axis.x, timeStamp: 90 });
      send(type, { timeStamp: 300 });
      expect(state.inertiaVelocity).toBe(0);
    }
  });

  test('focus follows the latest hovered row and clears on reset without stale boundary events', () => {
    const first = fixture(), second = fixture();
    const stage = fixture().asset;
    bindStageFocus(stage, [first.state, second.state]);
    first.send('pointerenter');
    expect(stage.classList.contains('has-bar-focus')).toBe(true);
    expect(first.state.element.classList.contains('is-focus-row')).toBe(true);
    second.send('pointerenter');
    first.send('pointerleave');
    expect(first.state.element.classList.contains('is-focus-row')).toBe(false);
    expect(second.state.element.classList.contains('is-focus-row')).toBe(true);
    expect(stage.classList.contains('has-bar-focus')).toBe(true);
    resetRowInteraction(second.state);
    expect(stage.classList.contains('has-bar-focus')).toBe(false);
    expect(second.state.element.classList.contains('is-focus-row')).toBe(false);
  });

  test('a tap or tiny jitter preserves a native click and starts no momentum', () => {
    const { state, send } = fixture();
    send('pointerdown');
    send('pointermove', { clientX: 103, clientY: 102, timeStamp: 20 });
    send('pointerup', { clientX: 103, clientY: 102, timeStamp: 30 });
    expect(state.travel).toBe(400);
    expect(state.inertiaVelocity).toBe(0);
    expect(state.drag).toBe(null);
    expect(send('click').preventDefault).not.toHaveBeenCalled();
    expect(state.currentFactor).toBe(0);
  });

  test.each([-1, 1])('a meaningful drag follows the lane in either direction (%i)', direction => {
    const { state, asset, send } = fixture(direction);
    send('pointerdown');
    send('pointermove', { clientX: 100 + 120 * axis.x, clientY: 100 + 120 * axis.y, timeStamp: 70 });
    expect(state.travel).toBeCloseTo(400 + 120 * direction);
    expect(state.element.classList.contains('is-dragging')).toBe(true);
    send('pointerup', { timeStamp: 80 });
    expect(state.inertiaVelocity).toBeGreaterThan(100);
    expect(asset.hasPointerCapture(1)).toBe(false);
    expect(state.element.classList.contains('is-dragging')).toBe(false);
    expect(send('click').preventDefault).toHaveBeenCalledTimes(1);
    send('pointerdown', { timeStamp: 100 });
    expect(state.inertiaVelocity).toBe(0);
    send('pointerup', { timeStamp: 120 });
    expect(send('click').preventDefault).not.toHaveBeenCalled();
  });

  test.each(['pointercancel', 'lostpointercapture'])('%s drops the hold and momentum', type => {
    const { state, asset, send } = fixture();
    send('pointerdown'); send('pointermove', { clientX: 180, timeStamp: 40 });
    send(type, { timeStamp: 50 });
    expect(state.drag).toBe(null); expect(state.inertiaVelocity).toBe(0);
    expect(state.isPressed).toBe(false); expect(asset.hasPointerCapture(1)).toBe(false);
    expect(send('click').preventDefault).toHaveBeenCalledTimes(1);
  });

  test('moving the mouse to inspect a coasting bar catches it, but stationary boundary events do not', () => {
    const { state, send } = fixture();
    send('pointerdown'); send('pointermove', { clientX: 180, timeStamp: 40 });
    send('pointerup', { clientX: 180, timeStamp: 50 });
    const velocity = state.inertiaVelocity;
    send('pointerenter', { clientX: 180, timeStamp: 60 });
    expect(state.inertiaVelocity).toBe(velocity);
    send('pointermove', { clientX: 180, buttons: 0, timeStamp: 65 });
    expect(state.inertiaVelocity).toBe(velocity);
    send('pointermove', { clientX: 190, buttons: 0, timeStamp: 70 });
    expect(state.inertiaVelocity).toBe(0);
    expect(state.currentFactor).toBe(0);
  });

  test('holding after dragging releases without a throw', () => {
    const { state, send } = fixture();
    send('pointerdown'); send('pointermove', { clientX: 180, timeStamp: 40 });
    send('pointerup', { timeStamp: 300 });
    expect(state.inertiaVelocity).toBe(0);
  });

  test('reduced motion permits direct manipulation but never inertia', () => {
    const { state, send } = fixture();
    window.matchMedia = () => ({ matches: true });
    send('pointerdown'); send('pointermove', { clientX: 180, timeStamp: 40 });
    expect(state.travel).not.toBe(400);
    send('pointerup', { timeStamp: 50 }); expect(state.inertiaVelocity).toBe(0);
  });

  test('an explicit motion pause permits direct dragging but never inertia', () => {
    const { state, send } = fixture();
    document.documentElement = { dataset: { marqueeMotionPaused: 'true' } };
    send('pointerdown'); send('pointermove', { clientX: 180, timeStamp: 40 });
    expect(state.travel).not.toBe(400);
    send('pointerup', { timeStamp: 50 }); expect(state.inertiaVelocity).toBe(0);
  });

  test('vertical touch intent cancels without blocking native pan or pinch', () => {
    const { state, send } = fixture();
    send('pointerdown', { pointerType: 'touch' });
    const move = send('pointermove', { pointerType: 'touch', clientY: 180, timeStamp: 40 });
    expect(state.drag).toBe(null); expect(state.travel).toBe(400);
    expect(move.preventDefault).not.toHaveBeenCalled();
  });

  test('unrelated pointers and nonprimary or modified activation are ignored', () => {
    const { state, send } = fixture();
    for (const params of [{ button: 1 }, { button: 2 }, { isPrimary: false }, { ctrlKey: true }, { metaKey: true }]) {
      send('pointerdown', params); expect(state.drag).toBe(null);
    }
    send('pointerdown');
    send('pointermove', { pointerId: 2, clientX: 180, timeStamp: 40 });
    send('pointerup', { pointerId: 2, timeStamp: 50 });
    expect(state.travel).toBe(400); expect(state.drag.pointerId).toBe(1);
  });

  test('a reset releases capture, clears all visual state, and preserves keyboard activation', () => {
    const { state, asset, send } = fixture();
    send('pointerdown'); send('pointermove', { clientX: 180, timeStamp: 40 });
    resetRowInteraction(state);
    expect(state.drag).toBe(null); expect(state.inertiaVelocity).toBe(0);
    expect(state.isPressed).toBe(false); expect(state.isHovered).toBe(false);
    expect(asset.hasPointerCapture(1)).toBe(false);
    expect(send('click', { detail: 0 }).preventDefault).not.toHaveBeenCalled();
  });

  test.each(['mouse', 'pen'])('%s movement restores hover after an interruption without another enter event', pointerType => {
    const { state, asset, send } = fixture();
    send('pointerenter', { pointerType });
    resetRowInteraction(state);
    state.currentFactor = 0.5;
    expect(state.isHovered).toBe(false);
    expect(state.targetFactor).toBe(1);
    send('pointermove', { pointerType, buttons: 0, clientX: 105, timeStamp: 40 });
    expect(state.isHovered).toBe(true);
    expect(state.hoveredAsset).toBe(asset);
    expect(asset.classList.contains('is-hovered')).toBe(true);
    expect(state.currentFactor).toBe(0);
    expect(state.targetFactor).toBe(0);
    expect(state.inertiaVelocity).toBe(0);
  });

  test('uncaptured touch movement does not restore mouse hover after an interruption', () => {
    const { state, asset, send } = fixture();
    resetRowInteraction(state);
    send('pointermove', { pointerType: 'touch', clientX: 105, timeStamp: 40 });
    expect(state.isHovered).toBe(false);
    expect(state.hoveredAsset).toBe(null);
    expect(asset.classList.contains('is-hovered')).toBe(false);
    expect(state.targetFactor).toBe(1);
  });

  test('an interrupted stationary press cannot click after focus or layout changes', () => {
    const { state, send } = fixture();
    send('pointerdown'); resetRowInteraction(state);
    expect(send('click').preventDefault).toHaveBeenCalledTimes(1);
    send('pointerdown', { ctrlKey: true });
    expect(send('click', { ctrlKey: true }).preventDefault).not.toHaveBeenCalled();
  });

  test('a missed mouse release clears capture on the next button-free move', () => {
    const { state, send } = fixture();
    send('pointerdown'); send('pointermove', { buttons: 0, clientX: 180, timeStamp: 40 });
    expect(state.drag).toBe(null); expect(state.isPressed).toBe(false);
    expect(state.inertiaVelocity).toBe(0); expect(state.travel).toBe(400);
  });

  test('native link ghost dragging is disabled', () => {
    expect(fixture().send('dragstart').preventDefault).toHaveBeenCalledTimes(1);
  });
});
