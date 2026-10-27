const { bindViewerTouch } = require('../js/utils/viewerTouch');

function setup() {
  const element = new EventTarget();
  const windowRef = new EventTarget();
  const captures = new Set();
  element.setPointerCapture = id => captures.add(id);
  element.hasPointerCapture = id => captures.has(id);
  element.releasePointerCapture = id => captures.delete(id);
  const callbacks = { onStart: jest.fn(), onEnd: jest.fn(), onPan: jest.fn(), onPinch: jest.fn() };
  const controller = bindViewerTouch(element, callbacks, windowRef);
  const send = (type, id, x = 0, y = 0, pointerType = 'touch', interactive = false) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerId: id, clientX: x, clientY: y, pointerType });
    Object.defineProperty(event, 'target', { value: { closest: () => interactive } });
    element.dispatchEvent(event);
    return event;
  };
  return { element, windowRef, captures, callbacks, controller, send };
}

test('two fingers emit distance ratio and moving centroid, then rebase to one-finger pan', () => {
  const { send, callbacks } = setup();
  send('pointerdown', 1, 10, 20);
  send('pointermove', 1, 20, 20);
  expect(callbacks.onPan).toHaveBeenLastCalledWith({ x: 10, y: 0 });
  send('pointerdown', 2, 40, 20);
  send('pointermove', 2, 60, 20);
  expect(callbacks.onPinch).toHaveBeenLastCalledWith({ ratio: 2,
    anchor: { clientX: 30, clientY: 20 }, delta: { x: 10, y: 0 } });
  send('pointerup', 2, 60, 20);
  send('pointermove', 1, 25, 30);
  expect(callbacks.onPan).toHaveBeenLastCalledWith({ x: 5, y: 10 });
  expect(callbacks.onStart).toHaveBeenCalledTimes(1);
  send('pointerup', 1);
  expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
});

for (const interruption of ['pointercancel', 'lostpointercapture', 'resize', 'orientationchange']) {
  test(`${interruption} clears all gesture/capture state and the next pinch starts fresh`, () => {
    const { send, callbacks, captures, windowRef } = setup();
    send('pointerdown', 1, 10, 10);
    send('pointerdown', 2, 30, 10);
    if (interruption === 'resize' || interruption === 'orientationchange') windowRef.dispatchEvent(new Event(interruption));
    else send(interruption, 1);
    expect(captures.size).toBe(0);
    send('pointermove', 2, 300, 100);
    expect(callbacks.onPinch).not.toHaveBeenCalled();
    send('pointerdown', 3, 50, 50);
    send('pointermove', 3, 55, 50);
    expect(callbacks.onPan).toHaveBeenLastCalledWith({ x: 5, y: 0 });
    expect(callbacks.onStart).toHaveBeenCalledTimes(2);
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
  });
}

test('mouse and native controls are untouched; coincident fingers cannot create infinite zoom', () => {
  const { send, callbacks, controller, captures } = setup();
  expect(send('pointerdown', 1, 10, 20, 'mouse').defaultPrevented).toBe(false);
  expect(send('pointerdown', 1, 10, 20, 'touch', true).defaultPrevented).toBe(false);
  send('pointerdown', 1, 10, 20);
  send('pointerdown', 2, 10, 20);
  send('pointermove', 2, 20, 20);
  expect(callbacks.onPinch.mock.lastCall[0].ratio).toBe(1);
  controller.dispose();
  expect(captures.size).toBe(0);
  send('pointerdown', 3);
  expect(callbacks.onStart).toHaveBeenCalledTimes(1);
});

test('only a stationary single-finger tap invokes dismissal; a pinch or drag does not', () => {
  const { send, callbacks } = setup();
  callbacks.onTap = jest.fn();
  send('pointerdown', 1, 10, 10);
  send('pointerup', 1, 10, 10);
  expect(callbacks.onTap).toHaveBeenCalledTimes(1);
  send('pointerdown', 1, 10, 10);
  send('pointermove', 1, 30, 10);
  send('pointerup', 1);
  send('pointerdown', 1, 10, 10);
  send('pointerdown', 2, 30, 10);
  send('pointerup', 2);
  send('pointerup', 1);
  expect(callbacks.onTap).toHaveBeenCalledTimes(1);
});
