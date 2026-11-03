const { bind } = require('../js/utils/secretIntro');

function emitter(extra = {}) {
  const listeners = {};
  return { ...extra, addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
    emit(type, event = {}) { for (const callback of listeners[type] || []) callback(event); } };
}
function setup() {
  let clock = 100;
  const target = emitter({ focus: jest.fn() });
  const documentRef = emitter({ hidden: false, body: { classList: { contains: jest.fn(() => false) } } });
  const windowRef = emitter({ performance: { now: () => clock } });
  const open = jest.fn();
  bind({ target, documentRef, windowRef, open });
  const wait = milliseconds => { clock += milliseconds; };
  function type(text, changes = {}) {
    for (const key of text) documentRef.emit('keydown', { key, target: { closest: () => null }, ...changes });
  }
  return { target, documentRef, windowRef, open, wait, type };
}

test('one native click opens the intro without any hold or tap sequence', () => {
  const s = setup(); s.target.emit('click'); expect(s.open).toHaveBeenCalledTimes(1);
  expect(s.target.focus).toHaveBeenCalledWith({ preventScroll: true });
});
test('native Enter and Space remain untouched rather than synthesizing a duplicate click', () => {
  const s = setup(); const preventDefault = jest.fn();
  for (const key of ['Enter', ' ']) {
    s.documentRef.emit('keydown', { key, target: { closest: () => s.target }, preventDefault });
    expect(s.open).not.toHaveBeenCalled();
  }
  expect(preventDefault).not.toHaveBeenCalled();
  s.target.emit('click'); expect(s.open).toHaveBeenCalledTimes(1);
});
test('keyboard accepts exact uninterrupted lowercase sequence, can repeat, and never cancels native keys', () => {
  const s = setup(); const preventDefault = jest.fn();
  s.type('rpi182x4', { preventDefault }); expect(s.open).not.toHaveBeenCalled();
  s.type('rpi1824rpi1824', { preventDefault }); expect(s.open).toHaveBeenCalledTimes(2);
  expect(preventDefault).not.toHaveBeenCalled();
});
test('the original shortcut remains available while the intro button has focus', () => {
  const s = setup(); s.type('rpi1824', { target: { closest: () => s.target } });
  expect(s.open).toHaveBeenCalledTimes(1);
});
test.each(['editable', 'repeat', 'composition', 'ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'timeout', 'pointer', 'focus', 'blur', 'pagehide', 'visibility'])('%s interrupts keyboard discovery', action => {
  const s = setup(); s.type('rpi');
  if (action === 'timeout') s.wait(2401);
  else if (action === 'pointer') s.documentRef.emit('pointerdown');
  else if (action === 'focus') s.documentRef.emit('focusin');
  else if (action === 'visibility') s.documentRef.emit('visibilitychange');
  else if (action === 'blur' || action === 'pagehide') s.windowRef.emit(action);
  else s.type('1', action === 'editable' ? { target: { closest: () => ({}) } }
    : action === 'composition' ? { isComposing: true } : { [action]: true });
  s.type(['timeout', 'pointer', 'focus', 'blur', 'pagehide', 'visibility'].includes(action) ? '1824' : '824');
  expect(s.open).not.toHaveBeenCalled();
});
test('hidden page or open dialog cannot trigger either route', () => {
  const s = setup(); s.documentRef.hidden = true; s.type('rpi1824'); s.target.emit('click');
  s.documentRef.hidden = false; s.documentRef.body.classList.contains.mockReturnValue(true);
  s.type('rpi1824'); s.target.emit('click'); expect(s.open).not.toHaveBeenCalled();
});
test('click clears a partial shortcut rather than reopening after dismissal', () => {
  const s = setup(); s.type('rpi'); s.target.emit('click'); s.type('1824');
  expect(s.open).toHaveBeenCalledTimes(1);
});
