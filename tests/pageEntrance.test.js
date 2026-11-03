const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/utils/pageEntrance'), 'utf8');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function element() {
  const classes = new Set();
  const events = {};
  return { events, addEventListener: (name, cb) => { events[name] = cb; },
    removeEventListener: (name, cb) => { if (events[name] === cb) delete events[name]; }, dataset: {}, style: { setProperty: jest.fn() }, classList: {
    add: (...names) => names.forEach(name => classes.add(name)), remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name)
  } };
}
function setup({ selector = true, supported = true, reduced = false, stored = null, nav = 'navigate', fonts = Promise.resolve(), storageThrows = false } = {}) {
  const root = element(), plane = element(), reveal = element();
  const windowEvents = {}, documentEvents = {}, mediaEvents = {};
  const media = { matches: reduced, addEventListener: (name, cb) => { mediaEvents[name] = cb; } };
  const document = {
    documentElement: root, currentScript: { dataset: { entryKind: selector ? 'selector' : '' } }, hidden: false, body: element(), fonts: { ready: fonts },
    querySelector: query => query === '[data-entrance-plane="selector"]' ? plane
      : query === '[data-entrance-page="selector"]' ? reveal : null,
    addEventListener: (name, cb) => { documentEvents[name] = cb; },
    startViewTransition: supported ? jest.fn() : undefined
  };
  const window = {
    matchMedia: () => media, addEventListener: (name, cb) => { windowEvents[name] = cb; },
    localStorage: { getItem: () => { if (storageThrows) throw new Error('storage unavailable'); return stored; } },
    sessionStorage: { getItem: () => null, setItem: jest.fn() }
  };
  const observer = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
  vm.runInNewContext(source, { window, document, performance: { getEntriesByType: () => [{ type: nav }] },
    setTimeout, clearTimeout, requestAnimationFrame: cb => setTimeout(cb, 16), cancelAnimationFrame: clearTimeout, queueMicrotask, MutationObserver: observer });
  const image = (url, decoded = Promise.resolve()) => ({ ...element(), src: url, decode: jest.fn(() => decoded) });
  return { root, plane, reveal, window, document, media, mediaEvents, windowEvents, documentEvents, observer, image, api: window.PageEntrance };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
beforeEach(() => jest.useFakeTimers({ doNotFake: ['queueMicrotask'] }));
afterEach(() => jest.useRealTimers());

test('Home conceals the whole composition in the head and holds clocks even without View Transitions', () => {
  const s = setup({ supported: false });
  expect(s.root.classList.contains('has-selector-entrance')).toBe(true);
  expect(s.root.classList.contains('has-page-entrance')).toBe(false);
  expect(s.api.isActive()).toBe(true); expect(s.api.isHoldingArtwork()).toBe(true);
  expect(s.observer).not.toHaveBeenCalled();
});
test('Home decodes each unique image once, waits for fonts, and fades after two frames', async () => {
  const font = deferred(), asset = deferred(), s = setup({ fonts: font.promise });
  const first = s.image('same', asset.promise), repeated = s.image('same'), other = s.image('other');
  [first, repeated, other].forEach(s.api.revealAsset);
  asset.resolve(); await flush();
  expect(first.decode).toHaveBeenCalledTimes(1); expect(repeated.decode).not.toHaveBeenCalled(); expect(other.decode).toHaveBeenCalledTimes(1);
  expect(s.plane.dataset.entryActive).toBeUndefined();
  expect(s.api.isHoldingArtwork()).toBe(true);
  font.resolve(); await flush();
  expect(s.plane.dataset.entryMode).toBe('fade');
  expect(s.root.classList.contains('is-selector-entering')).toBe(false);
  jest.advanceTimersByTime(32);
  expect(s.root.classList.contains('is-selector-entering')).toBe(true);
  expect(s.api.isHoldingArtwork()).toBe(true);
  jest.advanceTimersByTime(930);
  expect(s.api.isActive()).toBe(false); expect(s.plane.classList.contains('is-entry-complete')).toBe(true);
  expect(s.root.classList.contains('has-selector-entrance')).toBe(false);
});
test('Home resize while sources load cannot turn its entrance into a pop', async () => {
  const source = deferred(), s = setup(); s.api.revealAsset(s.image('slow', source.promise));
  s.windowEvents.resize?.();
  expect(s.api.isHoldingArtwork()).toBe(true);
  source.resolve(); await flush(); jest.advanceTimersByTime(32);
  expect(s.root.classList.contains('is-selector-entering')).toBe(true);
});
test('readiness is bounded even when an asset or a later Home script never completes', async () => {
  const s = setup(); s.api.revealAsset(s.image('never', new Promise(() => {}))); await flush();
  jest.advanceTimersByTime(2200 + 32);
  expect(s.plane.dataset.entryMode).toBe('fade');
  jest.advanceTimersByTime(930);
  expect(s.api.isActive()).toBe(false); expect(s.root.classList.contains('has-selector-entrance')).toBe(false);
  const noRuntime = setup(); jest.advanceTimersByTime(3200);
  expect(noRuntime.api.isActive()).toBe(false); expect(noRuntime.plane.classList.contains('is-entry-complete')).toBe(true);
});
test.each(['pointerdown', 'keydown', 'focusin'])('%s immediately exposes pending Home and cannot replay after decode', async name => {
  const source = deferred(), s = setup(); s.api.revealAsset(s.image('slow', source.promise));
  s.documentEvents[name]();
  expect(s.api.isActive()).toBe(false); expect(s.root.classList.contains('has-selector-entrance')).toBe(false);
  source.resolve(); await flush(); jest.advanceTimersByTime(4000);
  expect(s.root.classList.contains('is-selector-entering')).toBe(false); expect(s.api.isActive()).toBe(false);
});
test.each([{ reduced: true }, { stored: 'paused' }, { nav: 'back_forward' }])('Home has no conceal or motion for %j', async options => {
  const s = setup(options); s.api.revealAsset(s.image('slow', new Promise(() => {}))); await flush();
  expect(s.api.isActive()).toBe(false); expect(s.root.classList.contains('has-selector-entrance')).toBe(false);
  expect(s.plane.classList.contains('is-entry-complete')).toBe(true);
});
test('storage restrictions do not block ordinary Home entrance', () => {
  expect(setup({ storageThrows: true }).api.isActive()).toBe(true);
});
test('a failed asset settles; live reduced motion cancels and never restarts', async () => {
  const s = setup(); s.api.revealAsset(s.image('broken', Promise.reject(new Error('failed image')))); await flush();
  expect(s.plane.dataset.entryMode).toBe('fade');
  s.media.matches = true; s.mediaEvents.change();
  expect(s.api.isActive()).toBe(false);
  s.media.matches = false; s.mediaEvents.change(); jest.advanceTimersByTime(4000);
  expect(s.api.isActive()).toBe(false); expect(s.root.classList.contains('has-selector-entrance')).toBe(false);
});
test('generator preserves native print eligibility and unsupported-browser fallback', () => {
  const native = setup({ selector: false });
  expect(native.root.classList.contains('has-page-entrance')).toBe(true); expect(native.observer).toHaveBeenCalledTimes(1);
  const fallback = setup({ selector: false, supported: false });
  expect(fallback.root.classList.contains('has-page-entrance')).toBe(false); expect(fallback.api.isActive()).toBe(false);
});

test('Home keeps clocks held until its own opacity transition ends and clears the listener', async () => {
  const s = setup(); s.api.revealAsset(s.image('loaded')); await flush(); jest.advanceTimersByTime(32);
  const complete = s.reveal.events.transitionend;
  complete({ target: s.plane, propertyName: 'opacity' });
  expect(s.api.isHoldingArtwork()).toBe(true);
  complete({ target: s.reveal, propertyName: 'transform' });
  expect(s.api.isHoldingArtwork()).toBe(true);
  complete({ target: s.reveal, propertyName: 'opacity' });
  expect(s.api.isActive()).toBe(false);
  expect(s.reveal.events.transitionend).toBeUndefined();
});
