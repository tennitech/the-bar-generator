const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/utils/mobileBrowser'),'utf8');
function setup() {
  let observerCallback;
  let overlay = false;
  let background = '#000000';
  const root = { hasAttribute:()=>false,dataset:{},style:{} };
  const body = { classList:{ contains:()=>overlay },style:{ setProperty:jest.fn() } };
  const themeColor = { content:'' };
  const document = { documentElement:root,body,addEventListener:jest.fn(),querySelector:()=>themeColor,
    getElementById:id => id==='logo-animation-overlay' ? {style:{getPropertyValue:()=>background}} : null };
  const window = { matchMedia:()=>({matches:false,addEventListener:jest.fn()}),addEventListener:jest.fn() };
  function MutationObserver(callback) { observerCallback=callback; this.observe=jest.fn(); }
  vm.runInNewContext(source,{document,window,MutationObserver,getComputedStyle:()=>({backgroundColor:'rgb(16, 22, 29)'})});
  return {root,themeColor,change(value) { overlay=true;background=value;observerCallback(); },close() {overlay=false;observerCallback();} };
}
test.each([['#000000','dark'],['#ffffff','light'],['rgb(0, 0, 0)','dark'],['rgb(255, 255, 255)','light']])('%s keeps browser hint and scheme aligned with the intro', (background,scheme) => {
  const s=setup();s.change(background);
  expect(s.root.style.backgroundColor).toBe(background);expect(s.themeColor.content).toBe(background);
  expect(s.root.style.colorScheme).toBe(scheme);
  s.close();expect(s.root.style.colorScheme).toBe('dark');expect(s.themeColor.content).toBe('rgb(16, 22, 29)');
});

test.each([
  ['rgb(255, 255, 255)', 'rgb(245, 245, 245)', 'light'],
  ['rgb(0, 0, 0)', 'rgb(22, 22, 22)', 'dark'],
  ['rgb(16, 22, 29)', 'rgb(32, 38, 45)', 'dark'],
])('mobile header %s stays independent of the open controls', (top, bottom, scheme) => {
  let callback;
  let active = false;
  const root = { hasAttribute: () => false, dataset: {}, style: {} };
  const body = { backgroundColor: top, classList: { contains: () => false },
    style: { setProperty: jest.fn() } };
  const header = { backgroundColor: top };
  const canvas = { backgroundColor: top };
  const panel = { backgroundColor: bottom, classList: { contains: () => active } };
  const hint = { content: '' };
  const document = { documentElement: root, body, addEventListener: jest.fn(),
    querySelector: selector => selector === '.app-header' ? header
      : selector === '.logo-container' ? canvas : hint,
    getElementById: id => id === 'app-sidebar' ? panel : null };
  const media = { matches: true, addEventListener: jest.fn() };
  const window = { matchMedia: () => media, addEventListener: jest.fn() };
  function MutationObserver(fn) { callback = fn; this.observe = jest.fn(); }
  vm.runInNewContext(source, { document, window, MutationObserver, getComputedStyle: element => element });
  for (const open of [true, false, true, false]) {
    active = open;
    callback();
    expect(hint.content).toBe(top);
    expect(root.style.backgroundColor).toBe(top);
    expect(root.style.colorScheme).toBe(scheme);
    expect(body.style.setProperty).toHaveBeenLastCalledWith('--browser-surface', open ? bottom : top);
  }
  active = true;
  header.backgroundColor = 'rgb(220, 220, 220)';
  panel.backgroundColor = 'rgb(200, 200, 200)';
  callback();
  expect(hint.content).toBe(header.backgroundColor);
  expect(root.style.colorScheme).toBe('light');
  expect(body.style.setProperty).toHaveBeenLastCalledWith('--browser-surface', panel.backgroundColor);
});

test('only a trusted direct parent can subscribe to surface colors, including later theme changes', () => {
  const listeners = new Map();
  const sent = [];
  const parent = { postMessage: (...args) => sent.push(args) };
  let observerCallback;
  let color = 'rgb(0, 0, 0)';
  const root = { hasAttribute: () => false, dataset: {}, style: {} };
  const body = { classList: { contains: () => false }, style: { setProperty() {} } };
  const hint = { content: '' };
  const document = { documentElement: root, body, addEventListener() {},
    querySelector: () => hint, getElementById: () => null };
  const window = { parent, matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener: (name, callback) => listeners.set(name, callback) };
  function MutationObserver(callback) { observerCallback = callback; this.observe = () => {}; }
  vm.runInNewContext(source, { document, window, URL, MutationObserver,
    getComputedStyle: () => ({ backgroundColor: color }) });
  const request = { type: 'rpi-generator:surface-request', version: 1 };
  const receive = listeners.get('message');
  receive({ source: parent, origin: 'https://untrusted.example', data: request });
  receive({ source: {}, origin: 'https://brand.rpi.edu', data: request });
  receive({ source: parent, origin: 'https://brand.rpi.edu', data: { ...request, version: 2 } });
  expect(sent).toHaveLength(0);
  receive({ source: parent, origin: 'https://brand.rpi.edu', data: request });
  expect(sent[0][1]).toBe('https://brand.rpi.edu');
  expect(sent[0][0]).toMatchObject({ type: 'rpi-generator:surface', version: 1,
    topColor: color, bottomColor: color, colorScheme: 'dark' });
  for (const next of ['rgb(255, 255, 255)', 'rgb(225, 237, 245)', 'rgb(0, 0, 0)']) {
    color = next;
    observerCallback();
    expect(sent.at(-1)[0]).toMatchObject({ topColor: next, bottomColor: next });
  }
  expect(Object.keys(sent.at(-1)[0]).sort()).toEqual(['bottomColor', 'colorScheme', 'topColor', 'type', 'version']);
});
