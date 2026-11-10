const theme = require('../js/utils/themeMode');
const guidance = require('../js/utils/secondaryColorGuidance');

function fixture() {
  function node(extra = {}) {
    const listeners = {};
    return Object.assign({
      hidden: false, focus: jest.fn(),
      addEventListener: (name, listener) => (listeners[name] ||= []).push(listener),
      emit(name, event = {}) { for (const listener of listeners[name] || []) listener(event); }
    }, extra);
  }
  const trigger = node(), close = node(), title = node(), menuTrigger = node();
  const select = node({ value: 'black', parentElement: { querySelector: () => menuTrigger } });
  const panel = { scrollTop: 123 };
  const dialog = node({
    open: false,
    showModal: jest.fn(() => { dialog.open = true; }),
    close: jest.fn(() => { dialog.open = false; dialog.emit('close'); }),
    querySelector: () => panel,
    getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, bottom: 100 })
  });
  const nodes = { 'secondary-color-help': trigger, 'secondary-color-close': close,
    'secondary-color-title': title, 'secondary-color-dialog': dialog, 'color-mode-select': select };
  const root = { getElementById: id => nodes[id] };
  return { root, trigger, close, title, select, panel, dialog, menuTrigger };
}

test('guidance stays contextual and restores focus across dismissal, mode changes, and reopen', () => {
  const h = fixture();
  const controller = guidance.setup(h.root);
  expect(guidance.setup(h.root)).toBe(controller);
  expect(h.trigger.hidden).toBe(true);
  h.trigger.emit('click');
  expect(h.dialog.showModal).not.toHaveBeenCalled();

  for (const [mode, scheme] of Object.entries(theme.COLOR_SCHEMES)) {
    h.select.value = mode;
    h.select.emit('change');
    expect(h.trigger.hidden).toBe(!scheme.secondary);
  }
  h.select.value = 'blue';
  h.select.emit('change');
  h.trigger.emit('click');
  expect(h.dialog.open).toBe(true);
  expect(h.dialog.showModal).toHaveBeenCalledTimes(1); // repeated setup adds no listeners
  expect(h.title.focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(h.panel.scrollTop).toBe(0);

  const stopPropagation = jest.fn();
  h.dialog.emit('keydown', { stopPropagation });
  expect(stopPropagation).toHaveBeenCalled();
  const preventDefault = jest.fn();
  h.dialog.emit('cancel', { preventDefault });
  expect(preventDefault).toHaveBeenCalled();
  expect(h.dialog.open).toBe(false);
  expect(h.trigger.focus).toHaveBeenCalledWith({ preventScroll: true });

  h.panel.scrollTop = 500;
  h.trigger.emit('click');
  expect(h.panel.scrollTop).toBe(0);
  const pointer = (x, y) => ({ target: h.dialog, clientX: x, clientY: y });
  h.dialog.emit('pointerdown', pointer(20, 20)); // inside-to-outside drags don't dismiss
  h.dialog.emit('click', pointer(1, 1));
  expect(h.dialog.open).toBe(true);
  h.dialog.emit('pointerdown', pointer(1, 1));
  h.dialog.emit('click', pointer(1, 1));
  expect(h.dialog.open).toBe(false);

  h.trigger.emit('click');
  h.close.emit('click');
  expect(h.dialog.open).toBe(false);
  h.trigger.emit('click');
  guidance.sync('black'); // programmatic restore/Undo, without a native change event
  expect(h.trigger.hidden).toBe(true);
  expect(h.dialog.open).toBe(false);
  expect(h.menuTrigger.focus).toHaveBeenCalledWith({ preventScroll: true });
  guidance.sync('gold');
  h.trigger.emit('click');
  expect(h.dialog.open).toBe(true);
  h.dialog.emit('close'); // a queued close cannot steal focus after reopening
  expect(h.dialog.open).toBe(true);
});
