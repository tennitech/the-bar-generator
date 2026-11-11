const { getHorizontalWheelDelta, bindRowWheel } = require('../js/marqueeUi');

function wheel(overrides = {}) {
  return { deltaX: 30, deltaY: 2, deltaMode: 0, cancelable: true,
    preventDefault: jest.fn(), ...overrides };
}

test.each([
  [{}, 30], [{ deltaX: -12.5 }, -12.5],
  [{ deltaX: 2, deltaMode: 1 }, 0],
  [{ deltaX: 3, deltaMode: 1 }, 48],
  [{ deltaX: 1, deltaY: 0, deltaMode: 2 }, 800],
  [{ shiftKey: true, deltaX: 0, deltaY: -40 }, -40],
])('normalizes explicit horizontal scroll without adding momentum: %j', (overrides, expected) => {
  expect(getHorizontalWheelDelta(wheel(overrides), 800)).toBe(expected);
});

test.each([
  { deltaX: 0, deltaY: 60 }, { deltaX: 20, deltaY: 60 }, { deltaX: 20, deltaY: 20 },
  { ctrlKey: true }, { metaKey: true }, { altKey: true }, { defaultPrevented: true },
  { cancelable: false }, { deltaX: Infinity }, { deltaY: NaN }, { deltaX: NaN },
])('leaves vertical, zoom, modified or unavailable native input alone: %j', overrides => {
  expect(getHorizontalWheelDelta(wheel(overrides), 800)).toBe(0);
});

function fixture(direction = 1) {
  let handle, options;
  const state = { direction, slotWidth: 400, patternSpan: 2800, travel: 400,
    currentFactor: 1, items: [{}], track: { style: {} },
    inertiaVelocity: 800, inertiaOffset: -200, inertiaOrigin: {}, drag: null,
    element: { addEventListener(name, listener, opts) { expect(name).toBe('wheel'); handle = listener; options = opts; } } };
  global.window = { innerWidth: 800 };
  bindRowWheel(state);
  return { state, options, send(overrides) { const event = wheel(overrides); handle(event); return event; } };
}

afterEach(() => { delete global.window; });

test.each([-1, 1])('moves only the receiving row in native scroll direction, lane %i', direction => {
  const { state, options, send } = fixture(direction);
  expect(options).toEqual({ passive: false });
  expect(send({ deltaX: 60 }).preventDefault).toHaveBeenCalledTimes(1);
  expect(state.travel).toBe(400 - 60 * direction);
  expect(state.track.style.transform).toContain('translate3d(');
  expect(state.inertiaVelocity).toBe(0);
  expect(state.inertiaOffset).toBe(0);
  expect(state.inertiaOrigin).toBe(null);
  expect(state.currentFactor).toBe(0);
  // OS momentum events are applied directly, without a second synthetic fling.
  [20, 10, 5].forEach(deltaX => send({ deltaX, deltaY: 0 }));
  expect(state.travel).toBe(400 - 95 * direction);
  expect(state.inertiaVelocity).toBe(0);
  send({ deltaX: -10 });
  expect(state.travel).toBe(400 - 85 * direction);
});

test('does not consume vertical scrolling or compete with an active pointer drag', () => {
  const { state, send } = fixture();
  expect(send({ deltaX: 1, deltaY: 30 }).preventDefault).not.toHaveBeenCalled();
  state.drag = {};
  expect(send({ deltaX: 50 }).preventDefault).not.toHaveBeenCalled();
  expect(state.travel).toBe(400);
  expect(state.inertiaVelocity).toBe(800);
});

test('direct wheel manipulation remains available with reduced motion or keyboard pause', () => {
  const { state, send } = fixture();
  window.matchMedia = () => ({ matches: true });
  global.document = { documentElement: { dataset: { marqueeMotionPaused: 'true' } } };
  try {
    send({ deltaX: 40 });
    expect(state.travel).toBe(360);
    expect(state.inertiaVelocity).toBe(0);
    expect(state.inertiaOffset).toBe(0);
  } finally { delete global.document; }
});
