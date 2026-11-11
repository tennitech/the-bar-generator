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
function setup({ selector = true, supported = true, reduced = false, stored = null, nav = 'navigate', fonts = Promise.resolve(), storageThrows = false, ascii = null, repeat = false } = {}) {
  const root = element(), plane = element(), reveal = element();
  const canvas = { ...element(), tagName: 'CANVAS', parentElement: plane };
  canvas.dataset.previewReady = 'true';
  plane.querySelectorAll = () => [canvas];
  const windowEvents = {}, documentEvents = {}, mediaEvents = {};
  const media = { matches: reduced, addEventListener: (name, cb) => { mediaEvents[name] = cb; } };
  const document = {
    documentElement: root, currentScript: { dataset: { entryKind: selector ? 'selector' : '' } }, hidden: false, body: element(), fonts: { ready: fonts },
    querySelector: query => query === '#p5-container > canvas' ? canvas
      : query === '[data-entrance-plane="selector"]' ? plane
      : query === '[data-entrance-page="selector"]' ? reveal : null,
    querySelectorAll: () => [],
    addEventListener: (name, cb) => { documentEvents[name] = cb; },
    startViewTransition: supported ? jest.fn() : undefined
  };
  const window = {
    AsciiEntrance: ascii, matchMedia: () => media, addEventListener: (name, cb) => { windowEvents[name] = cb; },
    localStorage: { getItem: () => { if (storageThrows) throw new Error('storage unavailable'); return stored; } },
    sessionStorage: { getItem: () => repeat ? 'seen' : null, setItem: jest.fn() }
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
test.each([[false, 640], [true, 440]])('Home ASCII repeat=%s uses %i ms and retains its bounded cleanup', async (repeat, duration) => {
  const start = jest.fn(), cleanup = jest.fn();
  const ascii = { prepare: jest.fn(() => Promise.resolve({ start, cleanup })) };
  const s = setup({ repeat, ascii });
  s.api.revealAsset(s.image('loaded')); await flush();
  jest.advanceTimersByTime(32); await flush();
  expect(start).toHaveBeenCalledTimes(1);
  expect(start.mock.calls[0][0]).toBe(duration);
  expect(s.plane.dataset.entryDuration).toBe(String(duration));
  expect(s.plane.dataset.entryMode).toBe('ascii');
  start.mock.calls[0][1]();
  jest.advanceTimersByTime(duration + 99);
  expect(s.api.isHoldingArtwork()).toBe(true);
  jest.advanceTimersByTime(1);
  expect(s.api.isActive()).toBe(false);
  expect(cleanup).toHaveBeenCalledTimes(1);
});

test.each([[false, 580], [true, 400]])('Home plain fade repeat=%s keeps %i ms with or without ASCII preparation', async (repeat, duration) => {
  for (const ascii of [null, { prepare: jest.fn(() => Promise.resolve(null)) }]) {
    const s = setup({ repeat, ascii });
    s.api.revealAsset(s.image('loaded')); await flush();
    jest.advanceTimersByTime(32); await flush();
    expect(s.plane.dataset.entryMode).toBe('fade');
    expect(s.plane.dataset.entryDuration).toBe(String(duration));
    expect(s.root.style.setProperty).toHaveBeenCalledWith('--selector-entry-duration', `${duration}ms`);
    s.api.cancel();
  }
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
test.each([{ reduced: true }, { nav: 'back_forward' }])('Home has no conceal or motion for %j', async options => {
  const ascii = { prepare: jest.fn() };
  const s = setup({ ...options, ascii }); s.api.revealAsset(s.image('slow', new Promise(() => {}))); await flush();
  expect(ascii.prepare).not.toHaveBeenCalled();
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


test.each([false, true])('generator repeat=%s retains 580 ms and releases its hold in the same frame', async repeat => {
  const cleanup = jest.fn(), start = jest.fn();
  const ascii = { prepareGenerator: jest.fn(() => Promise.resolve({ cleanup, start })) };
  const s = setup({ selector: false, ascii, repeat });
  s.api.revealGenerator(() => '<svg/>', () => true);
  expect(s.api.isHoldingArtwork()).toBe(true);
  await flush();
  expect(s.plane.dataset.entryMode).toBe('ascii');
  expect(start.mock.calls[0][0]).toBe(580);
  const [, onStart, onFinish] = start.mock.calls[0];
  onStart(); onFinish();
  expect(s.api.isHoldingArtwork()).toBe(false);
  expect(s.plane.dataset.entryActive).toBe('false');
  expect(cleanup).toHaveBeenCalledTimes(1);
  s.api.revealGenerator(() => '<svg/>');
  expect(ascii.prepareGenerator).toHaveBeenCalledTimes(1);
});

test.each(['input', 'change'])('generator %s during decode cancels without late reentry', async name => {
  const source = deferred(), cleanup = jest.fn(), start = jest.fn();
  const ascii = { prepareGenerator: jest.fn(() => source.promise) };
  const s = setup({ selector: false, ascii });
  // Setup events before the first mark must not disable the entrance.
  s.documentEvents[name]({ target: { id: 'a-parameter' } });
  s.api.revealGenerator(() => '<svg/>', () => true);
  expect(s.api.isActive()).toBe(true);
  s.documentEvents[name]({ target: { id: 'a-parameter' } });
  expect(s.api.isActive()).toBe(false);
  source.resolve({ cleanup, start }); await flush();
  expect(cleanup).toHaveBeenCalledTimes(1); expect(start).not.toHaveBeenCalled();
  s.api.revealGenerator(() => '<svg/>');
  expect(ascii.prepareGenerator).toHaveBeenCalledTimes(1);
});


test.each([false, true])('saved scrolling pause retains Home entrance (ASCII=%s)', async useAscii => {
  const start = jest.fn(), cleanup = jest.fn();
  const ascii = useAscii ? { prepare: jest.fn(() => Promise.resolve({ start, cleanup })) } : null;
  const s = setup({ stored: 'paused', ascii });
  expect(s.api.isActive()).toBe(true);
  s.api.revealAsset(s.image('loaded')); await flush();
  jest.advanceTimersByTime(32); await flush();
  expect(s.plane.dataset.entryMode).toBe(useAscii ? 'ascii' : 'fade');
  expect(s.root.classList.contains('is-selector-entering')).toBe(true);
  if (useAscii) expect(start.mock.calls[0][0]).toBe(640);
  jest.advanceTimersByTime(1800);
  expect(s.api.isActive()).toBe(false);
  expect(s.root.classList.contains('has-selector-entrance')).toBe(false);
});
