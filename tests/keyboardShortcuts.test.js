const fs = require('node:fs');
const vm = require('node:vm');
const { shouldIgnore, actionFor, initialize } = require('../js/utils/keyboardShortcuts');

function element() {
  const handlers = {};
  const attributes = {};
  return { handlers, attributes, checked: true, open: false, isConnected: true,
    addEventListener: (name, callback) => { handlers[name] = callback; },
    setAttribute: (name, value) => { attributes[name] = value; },
    getAttribute: name => attributes[name], removeAttribute: name => { delete attributes[name]; },
    focus: jest.fn(), closest: () => null,
    showModal() { this.open = true; }, close() { this.open = false; handlers.close?.(); },
    getBoundingClientRect: () => ({ left: 10, top: 10, right: 100, bottom: 100 }) };
}
function fixture(storage = { getItem: () => null, setItem: jest.fn() }) {
  const elements = Object.fromEntries(['keyboard-shortcuts-trigger', 'keyboard-shortcuts-dialog',
    'keyboard-shortcuts-close', 'keyboard-shortcuts-enabled', 'zoom-in-btn'].map(id => [id, element()]));
  elements['zoom-in-btn'].attributes['aria-keyshortcuts'] = '+';
  const doc = element();
  doc.getElementById = id => elements[id];
  doc.querySelector = jest.fn(() => null);
  doc.activeElement = element();
  const actions = Object.fromEntries(['randomize', 'undo', 'export', 'playback', 'zoomIn', 'zoomOut', 'fit',
    'nextStyle', 'previousColor', 'nextColor'].map(action => [action, jest.fn()]));
  const controller = initialize({ document: doc, actions, storage });
  const key = (key, extra = {}) => ({ key, preventDefault: jest.fn(), target: {}, ...extra });
  const send = (name, extra) => { const event = key(name, extra); doc.handlers.keydown(event); return event; };
  return { elements, doc, actions, controller, send, storage };
}

test.each([
  ['n', 'randomize'], ['u', 'undo'], ['e', 'export'], ['?', 'help'], [' ', 'playback'],
  ['+', 'zoomIn'], ['=', 'zoomIn'], ['-', 'zoomOut'], ['0', 'fit']
])('%s invokes only its intended action', (key, action) => {
  const f = fixture();
  expect(f.send(key).preventDefault).toHaveBeenCalledTimes(1);
  if (action === 'help') expect(f.elements['keyboard-shortcuts-dialog'].open).toBe(true);
  else expect(f.actions[action]).toHaveBeenCalledTimes(1);
});

test('preserves shifted legacy bindings and leaves other shifted keys alone', () => {
  expect(actionFor({ key: '?', shiftKey: true })).toBe('help');
  expect(actionFor({ key: '+', shiftKey: true })).toBe('zoomIn');
  expect(actionFor({ code: 'Space', shiftKey: true })).toBe('nextStyle');
  expect(actionFor({ key: 'ArrowUp', shiftKey: true })).toBe('previousColor');
  expect(actionFor({ key: 'ArrowDown', shiftKey: true })).toBe('nextColor');
  expect(actionFor({ key: 'R', shiftKey: true })).toBeNull();
  expect(actionFor({ key: 'ArrowDown' })).toBeNull();
});

test.each(['metaKey', 'ctrlKey', 'altKey', 'isComposing', 'repeat', 'defaultPrevented'])(
  'never intercepts %s events', modifier => {
    const f = fixture();
    expect(f.send('n', { [modifier]: true }).preventDefault).not.toHaveBeenCalled();
    expect(f.actions.randomize).not.toHaveBeenCalled();
  });

test('respects composition lifecycle, IME sentinel and AltGraph', () => {
  const f = fixture();
  f.doc.handlers.compositionstart();
  f.send('n');
  f.doc.handlers.compositionend();
  f.send('n', { keyCode: 229 });
  f.send('n', { getModifierState: name => name === 'AltGraph' });
  expect(f.actions.randomize).not.toHaveBeenCalled();
  f.send('n');
  expect(f.actions.randomize).toHaveBeenCalledTimes(1);
});

test.each(['input', 'textarea', 'select', 'button', 'summary', 'a[href]',
  '[contenteditable]:not([contenteditable="false"])', '[role="combobox"]', '[role="slider"]'])(
  'excludes %s and descendants through the event path', selector => {
    const doc = { querySelector: () => null };
    const target = { closest: selectors => selectors.split(', ').includes(selector) };
    expect(shouldIgnore({ composedPath: () => [{}, target] }, doc)).toBe(true);
    expect(shouldIgnore({ target: { isContentEditable: true } }, doc)).toBe(true);
  });

test('open dialogs, menus and pickers suppress shortcuts', () => {
  const f = fixture();
  f.doc.querySelector.mockReturnValue({});
  expect(f.send('n').preventDefault).not.toHaveBeenCalled();
  expect(f.actions.randomize).not.toHaveBeenCalled();
  const selector = f.doc.querySelector.mock.calls[0][0];
  for (const required of ['dialog[open]', 'details.sidebar_more[open]', '#save-menu:not(.hidden)',
    '.custom-select-trigger[aria-expanded="true"]', '[aria-modal="true"]:not([hidden]):not([aria-hidden="true"])']) expect(selector).toContain(required);
});

test('unavailable and unknown actions keep native behavior', () => {
  const f = fixture();
  f.actions.undo.mockReturnValue(false);
  expect(f.send('u').preventDefault).not.toHaveBeenCalled();
  expect(f.send('x').preventDefault).not.toHaveBeenCalled();
});

test('preference disables every binding, survives reload, and leaves menu guide usable', () => {
  const values = {};
  const storage = { getItem: key => values[key], setItem: (key, value) => { values[key] = value; } };
  const f = fixture(storage);
  f.elements['keyboard-shortcuts-enabled'].checked = false;
  f.elements['keyboard-shortcuts-enabled'].handlers.change();
  for (const key of ['n', 'u', 'e', '?', '+', '-', '=', '0', ' ']) expect(f.send(key).preventDefault).not.toHaveBeenCalled();
  expect(f.controller.isEnabled()).toBe(false);
  expect(f.elements['zoom-in-btn'].attributes['aria-keyshortcuts']).toBeUndefined();
  const next = fixture(storage);
  expect(next.controller.isEnabled()).toBe(false);
  next.elements['keyboard-shortcuts-trigger'].handlers.click();
  expect(next.elements['keyboard-shortcuts-dialog'].open).toBe(true);
  next.elements['keyboard-shortcuts-enabled'].checked = true;
  next.elements['keyboard-shortcuts-enabled'].handlers.change();
  next.send('n');
  expect(next.actions.randomize).toHaveBeenCalledTimes(1);
  expect(next.elements['zoom-in-btn'].attributes['aria-keyshortcuts']).toBe('+');
});

test('blocked storage still allows changing the preference for this page', () => {
  const f = fixture({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  f.send('n');
  expect(f.actions.randomize).toHaveBeenCalledTimes(1);
  f.elements['keyboard-shortcuts-enabled'].checked = false;
  expect(() => f.elements['keyboard-shortcuts-enabled'].handlers.change()).not.toThrow();
  f.send('n');
  expect(f.actions.randomize).toHaveBeenCalledTimes(1);
});

test('guide closes its menu and returns focus to summary on close', () => {
  const f = fixture();
  const summary = element();
  const menu = { open: true, querySelector: () => summary };
  f.elements['keyboard-shortcuts-trigger'].closest = () => menu;
  f.elements['keyboard-shortcuts-trigger'].handlers.click();
  expect(menu.open).toBe(false);
  expect(f.elements['keyboard-shortcuts-close'].focus).toHaveBeenCalled();
  expect(f.elements['keyboard-shortcuts-trigger'].attributes['aria-expanded']).toBe('true');
  f.elements['keyboard-shortcuts-close'].handlers.click();
  expect(summary.focus).toHaveBeenCalled();
  expect(f.elements['keyboard-shortcuts-trigger'].attributes['aria-expanded']).toBe('false');
});

test('guide only dismisses a click outside its bounds', () => {
  const f = fixture();
  const dialog = f.elements['keyboard-shortcuts-dialog'];
  f.controller.openGuide();
  dialog.handlers.click({ target: dialog, clientX: 50, clientY: 50 });
  expect(dialog.open).toBe(true);
  dialog.handlers.click({ target: dialog, clientX: 0, clientY: 0 });
  expect(dialog.open).toBe(false);
});

test('runtime parameter commands reuse selected native buttons and skip disabled actions', () => {
  const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
  const action = source.slice(source.indexOf('function clickSelectedParameterAction'), source.indexOf('function cycleKeyboardColor'));
  const button = { click: jest.fn(), disabled: false };
  const document = { querySelector: jest.fn(() => button) };
  const context = { document, styleSelect: { value: 'wave-quantum' } };
  vm.createContext(context);
  vm.runInContext(action, context);
  expect(context.clickSelectedParameterAction('randomize')).toBe(true);
  expect(document.querySelector).toHaveBeenLastCalledWith('[data-parameter-action="randomize"][data-parameter-style="wave-quantum"]');
  expect(context.clickSelectedParameterAction('undo')).toBe(true);
  expect(document.querySelector).toHaveBeenLastCalledWith('[data-randomize-undo="wave-quantum"]');
  button.disabled = true;
  expect(context.clickSelectedParameterAction('undo')).toBe(false);
  expect(button.click).toHaveBeenCalledTimes(2);
  document.querySelector.mockReturnValue(null);
  expect(context.clickSelectedParameterAction('randomize')).toBe(false);
});

// Routed pages inject body script sources, so head-only utilities are unavailable.
test('the routed shell loads shortcuts before the main runtime, without an Easter egg key conflict', () => {
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  const body = html.slice(html.indexOf('<body'));
  const scripts = Array.from(body.matchAll(/<script src="([^"]+)"/g), match => match[1].split('?')[0]);
  expect(scripts.indexOf('js/utils/keyboardShortcuts.js')).toBeGreaterThanOrEqual(0);
  expect(scripts.indexOf('js/utils/keyboardShortcuts.js')).toBeLessThan(scripts.indexOf('js/main.js'));
  expect(actionFor({ key: 'r' })).toBeNull();
});


test('guide dismissal falls back to the visible design control after layout changes', () => {
  const f = fixture();
  const original = f.doc.activeElement;
  const fallback = element();
  const byId = f.doc.getElementById;
  f.doc.getElementById = id => id === 'mobile-menu-toggle' ? fallback : byId(id);
  f.controller.openGuide();
  original.checkVisibility = () => false;
  f.elements['keyboard-shortcuts-dialog'].close();
  expect(original.focus).not.toHaveBeenCalled();
  expect(fallback.focus).toHaveBeenCalled();
});

test('interacting with guide chrome keeps compact design controls open for return focus', () => {
  const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
  const handler = source.slice(source.indexOf('function handleClickOutside'), source.indexOf('function hideSaveMenu'));
  const dialog = { open: true };
  const context = { document: { body: { classList: { contains: () => false } }, getElementById: () => dialog },
    isCompactLayoutViewport: () => true, mobileMenuToggle: { contains: () => false },
    appSidebar: { contains: () => false, classList: { contains: () => true } }, toggleMobileMenu: jest.fn() };
  vm.createContext(context);
  vm.runInContext(handler, context);
  context.handleClickOutside({ target: {} });
  expect(context.toggleMobileMenu).not.toHaveBeenCalled();
  dialog.open = false;
  context.handleClickOutside({ target: {} });
  expect(context.toggleMobileMenu).toHaveBeenCalledTimes(1);
});


test('parameter shortcuts preserve workspace focus after native Undo moves it', () => {
  const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
  const action = source.slice(source.indexOf('function clickSelectedParameterAction'), source.indexOf('function cycleKeyboardColor'));
  const original = { focus: jest.fn() };
  const after = { blur: jest.fn() };
  const document = { activeElement: original, querySelector: () => ({ click: () => { document.activeElement = after; } }) };
  const context = { document, styleSelect: { value: 'ticker' } };
  vm.createContext(context);
  vm.runInContext(action, context);
  expect(context.clickSelectedParameterAction('undo')).toBe(true);
  expect(after.blur).toHaveBeenCalled();
  expect(original.focus).toHaveBeenCalledWith({ preventScroll: true });
});
