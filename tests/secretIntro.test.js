const { bind } = require('../js/utils/secretIntro');

function emitter(extra = {}) {
  const listeners = {};
  return { ...extra, addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
    emit(type, event = {}) { for (const callback of listeners[type] || []) callback(event); } };
}
function setup() {
  let clock = 100;
  const target = emitter({ contains: element => element === target, setPointerCapture: jest.fn() });
  const mobile = emitter({ contains: element => element === mobile, setPointerCapture: jest.fn() });
  const documentRef = emitter({ hidden: false, body: { classList: { contains: jest.fn(() => false) } } });
  const windowRef = emitter({ performance: { now: () => clock } });
  const open = jest.fn();
  bind({ target, pointerTargets: [target, mobile], documentRef, windowRef, open });
  const wait = milliseconds => { clock += milliseconds; };
  const pointer = { pointerId: 1, button: 0, isPrimary: true, clientX: 10, clientY: 10 };
  function down(element = target, changes = {}) {
    const event = { ...pointer, target: element, ...changes };
    documentRef.emit('pointerdown', event); element.emit('pointerdown', event);
  }
  function up(element = target, changes = {}) {
    element.emit('pointerup', { ...pointer, target: element, ...changes });
    element.emit('lostpointercapture');
  }
  function press(milliseconds, element = target) { down(element); wait(milliseconds); up(element); }
  const tap = element => press(50, element);
  function type(text, changes = {}) {
    for (const key of text) documentRef.emit('keydown', { key, target: { closest: () => null }, ...changes });
  }
  return { target, mobile, documentRef, windowRef, open, wait, pointer, down, up, press, tap, type };
}

test.each([1824, 1900, 6000])('hold %ims and two taps deliberately reveal', duration => {
  const s = setup(); s.press(duration); s.tap(); expect(s.open).not.toHaveBeenCalled(); s.tap();
  expect(s.open).toHaveBeenCalledTimes(1); s.tap(); s.tap(); expect(s.open).toHaveBeenCalledTimes(1);
});
test('same deliberate sequence works on compact mobile heading without duplicate keyboard listeners', () => {
  const s = setup(); s.press(1900, s.mobile); s.tap(s.mobile); s.tap(s.mobile);
  expect(s.open).toHaveBeenCalledTimes(1); s.type('rpi1824'); expect(s.open).toHaveBeenCalledTimes(2);
});
test.each([0, 500, 1823, 6001])('ordinary clicks and invalid %ims holds do not reveal', duration => {
  const s = setup(); s.press(duration); s.tap(); s.tap(); expect(s.open).not.toHaveBeenCalled();
});
test.each(['movement', 'release movement', 'cancel', 'capture loss', 'outside', 'blur', 'pagehide', 'visibility', 'focus', 'other target', 'timeout', 'keyboard'])('%s cancels an armed sequence', action => {
  const s = setup();
  s.down(); s.wait(1900);
  if (action === 'movement') s.target.emit('pointermove', { ...s.pointer, clientX: 23 });
  if (action === 'cancel') s.target.emit('pointercancel');
  if (action === 'capture loss') s.target.emit('lostpointercapture');
  s.up(s.target, action === 'release movement' ? { clientX: 23 } : {});
  if (action === 'outside') s.documentRef.emit('pointerdown', { target: {} });
  if (action === 'blur' || action === 'pagehide') s.windowRef.emit(action);
  if (action === 'visibility') s.documentRef.emit('visibilitychange');
  if (action === 'focus') s.documentRef.emit('focusin', { target: {} });
  if (action === 'timeout') s.wait(2401);
  if (action === 'keyboard') s.type('r');
  if (action === 'other target') s.tap(s.mobile);
  s.tap(); s.tap(); expect(s.open).not.toHaveBeenCalled();
});
test('initial pointer focus does not cancel its hold', () => {
  const s = setup(); s.down(); s.documentRef.emit('focusin', { target: s.target });
  s.wait(1900); s.up(); s.tap(); s.tap(); expect(s.open).toHaveBeenCalledTimes(1);
});
test('different or secondary pointer and capture failure do not arm or throw', () => {
  const s = setup(); s.down(s.target, { isPrimary: false }); s.wait(1900); s.up(); s.tap(); s.tap();
  s.target.setPointerCapture.mockImplementation(() => { throw Error('inactive'); });
  expect(() => s.press(1900)).not.toThrow(); expect(s.open).not.toHaveBeenCalled();
});
test('keyboard accepts exact uninterrupted lowercase sequence, can repeat, and never cancels native keys', () => {
  const s = setup(); const preventDefault = jest.fn();
  s.type('rpi182x4', { preventDefault }); expect(s.open).not.toHaveBeenCalled();
  s.type('rpi1824rpi1824', { preventDefault }); expect(s.open).toHaveBeenCalledTimes(2);
  expect(preventDefault).not.toHaveBeenCalled();
});
test.each(['editable', 'repeat', 'composition', 'ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'timeout', 'pointer', 'focus'])('%s interrupts keyboard discovery', action => {
  const s = setup(); s.type('rpi');
  if (action === 'timeout') s.wait(2401);
  else if (action === 'pointer') s.tap();
  else if (action === 'focus') s.documentRef.emit('focusin', { target: {} });
  else s.type('1', action === 'editable' ? { target: { closest: () => ({}) } }
    : action === 'composition' ? { isComposing: true } : { [action]: true });
  s.type(action === 'timeout' || action === 'pointer' || action === 'focus' ? '1824' : '824');
  expect(s.open).not.toHaveBeenCalled();
});
test('hidden page or open dialog cannot trigger either route', () => {
  const s = setup(); s.documentRef.hidden = true; s.type('rpi1824'); s.press(1900); s.tap(); s.tap();
  s.documentRef.hidden = false; s.documentRef.body.classList.contains.mockReturnValue(true); s.type('rpi1824');
  expect(s.open).not.toHaveBeenCalled();
});
