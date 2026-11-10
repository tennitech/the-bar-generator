const fs = require('fs');
const path = require('path');
const { STORAGE_KEY, readPreference, start } = require('../js/utils/editorAccessibility');

function emitter(extra = {}) {
  const listeners = {};
  return { ...extra, addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    emit(type, event) { for (const fn of listeners[type] || []) fn(event); } };
}
function setup({ saved = null, loading = false, routed = false, denied = false } = {}) {
  const attributes = {};
  const frames = [];
  let observer;
  const state = { textContent: '' };
  const documentRef = emitter({ readyState: loading ? 'loading' : 'complete',
    documentElement: { dataset: {} }, body: {}, activeElement: null,
    getElementById: id => !routed ? (id === 'editor-size-toggle' ? button : id === 'editor-size-state' ? state : null) : null });
  const button = emitter({ setAttribute: (name, value) => { attributes[name] = value; },
    focus: jest.fn(() => { documentRef.activeElement = button; }), scrollIntoView: jest.fn() });
  const storage = { getItem: jest.fn(() => saved), setItem: jest.fn((key, value) => { saved = value; }) };
  if (denied) {
    storage.getItem.mockImplementation(() => { throw new Error('Storage blocked'); });
    storage.setItem.mockImplementation(() => { throw new Error('Storage blocked'); });
  }
  const windowRef = emitter({ localStorage: storage, requestAnimationFrame: fn => frames.push(fn),
    MutationObserver: class {
      constructor(callback) { observer = { callback, observe: jest.fn(), disconnect: jest.fn() }; return observer; }
    } });
  const controller = start(documentRef, windowRef);
  return { documentRef, windowRef, button, state, storage, attributes, controller,
    flush: () => { while (frames.length) frames.shift()(); },
    insertShell() { routed = false; observer.callback(); }, get observer() { return observer; } };
}

test.each([null, '', 'false', 'TRUE', 'large', '{}'])('missing or invalid saved preference %p keeps standard controls', saved => {
  const s = setup({ saved });
  expect(s.documentRef.documentElement.dataset.editorSize).toBe('standard');
  expect(s.attributes['aria-checked']).toBe('false'); expect(s.state.textContent).toBe('Off');
  expect(s.storage.setItem).not.toHaveBeenCalled();
});
test('restores before DOM readiness and binds when the shell is ready', () => {
  const s = setup({ saved: 'true', loading: true });
  expect(s.documentRef.documentElement.dataset.editorSize).toBe('large');
  s.button.emit('click');
  expect(s.storage.setItem).not.toHaveBeenCalled();
  s.documentRef.emit('DOMContentLoaded');
  expect(s.attributes['aria-checked']).toBe('true'); expect(s.state.textContent).toBe('On');
});
test('toggle persists both directions without moving focus to another control', () => {
  const s = setup();
  s.button.emit('click'); s.flush();
  expect(s.storage.setItem).toHaveBeenLastCalledWith(STORAGE_KEY, 'true');
  expect(s.documentRef.documentElement.dataset.editorSize).toBe('large');
  expect(s.attributes['aria-checked']).toBe('true'); expect(s.state.textContent).toBe('On');
  expect(s.documentRef.activeElement).toBe(s.button);
  expect(s.button.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  s.button.emit('click'); s.flush();
  expect(s.storage.setItem).toHaveBeenLastCalledWith(STORAGE_KEY, 'false');
  expect(s.documentRef.documentElement.dataset.editorSize).toBe('standard');
});
test('does not scroll back after the user moves focus away during reflow', () => {
  const s = setup(); s.button.emit('click'); s.documentRef.activeElement = {}; s.flush();
  expect(s.button.scrollIntoView).not.toHaveBeenCalled();
});
test('blocked storage leaves the switch usable for this page session', () => {
  const s = setup({ denied: true });
  expect(() => s.button.emit('click')).not.toThrow();
  expect(s.attributes['aria-checked']).toBe('true');
  s.button.emit('click'); expect(s.attributes['aria-checked']).toBe('false');
  expect(readPreference({ get localStorage() { throw new Error('Denied'); } })).toBe(false);
});
test('routed shell insertion binds once and disconnects its temporary observer', () => {
  const s = setup({ saved: 'true', routed: true });
  expect(s.observer.observe).toHaveBeenCalledWith(s.documentRef.body, { childList: true });
  s.insertShell();
  expect(s.attributes['aria-checked']).toBe('true'); expect(s.observer.disconnect).toHaveBeenCalledTimes(1);
  s.controller.bind(); s.controller.bind(); s.button.emit('click');
  expect(s.storage.setItem).toHaveBeenCalledTimes(1); expect(s.attributes['aria-checked']).toBe('false');
});
test('cross-tab local preference and clearing storage synchronize without stealing focus', () => {
  const s = setup();
  const notify = event => s.windowRef.emit('storage', { storageArea: s.storage, key: STORAGE_KEY, newValue: 'true', ...event });
  notify({ storageArea: {} }); notify({ key: 'unrelated' });
  expect(s.attributes['aria-checked']).toBe('false');
  notify({}); expect(s.attributes['aria-checked']).toBe('true');
  notify({ newValue: 'false' }); expect(s.state.textContent).toBe('Off');
  notify({}); notify({ key: null }); expect(s.state.textContent).toBe('Off');
  expect(s.button.focus).not.toHaveBeenCalled(); expect(s.storage.setItem).not.toHaveBeenCalled();
});
test('every route loads sizing assets early and fetches the matching shell', () => {
  const root = path.join(__dirname, '../generator');
  const pages = [path.join(root, 'index.html'), ...fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => path.join(root, entry.name, 'index.html'))];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    expect(html.indexOf('js/utils/editorAccessibility.js')).toBeGreaterThan(0);
    expect(html.indexOf('js/utils/editorAccessibility.js')).toBeLessThan(html.indexOf('</head>'));
    expect(html.indexOf('css/editor-accessibility.css')).toBeGreaterThan(html.indexOf('css/style.css'));
    expect(html).toMatch(/css\/editor-accessibility\.css\?v=[^"']+/);
    if (page !== path.join(root, 'index.html')) expect(html).toMatch(/__RPI_GENERATOR_PAGE_SOURCE__ = 'generator\/index\.html\?v=[^']+'/);
  }
  const shell = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  expect(shell).toMatch(/id="editor-size-toggle"[^>]*role="switch"[^>]*aria-checked="false"[^>]*aria-labelledby="editor-size-label"[^>]*aria-describedby="editor-size-description"/);
});
