const fs = require('node:fs');
const path = require('node:path');
const { MARQUEE_MOTION_STORAGE_KEY, createMarqueeMotionPreference, bindMarqueeMotionShortcut } = require('../js/marqueeUi');

function storage(value = null) {
  return { getItem: jest.fn(() => value), setItem: jest.fn((key, next) => { value = next; }) };
}

describe('Home motion preference', () => {
  test('defaults to running and persists explicit Pause and Resume across visits', () => {
    const saved = storage();
    const state = createMarqueeMotionPreference(() => saved);
    expect(state.paused).toBe(false);
    expect(state.setPaused(true)).toBe(true);
    expect(state.paused).toBe(true);
    expect(saved.setItem).toHaveBeenLastCalledWith(MARQUEE_MOTION_STORAGE_KEY, 'paused');
    const revisited = createMarqueeMotionPreference(() => saved);
    expect(revisited.paused).toBe(true);
    expect(revisited.setPaused(false)).toBe(true);
    expect(revisited.paused).toBe(false);
    expect(createMarqueeMotionPreference(() => saved).paused).toBe(false);
  });

  test.each([null, '', 'false', 'true', 'unexpected', 'running'])('does not treat %p as an explicit pause', value => {
    expect(createMarqueeMotionPreference(() => storage(value)).paused).toBe(false);
  });

  test.each(['get-storage', 'read', 'write'])('blocked %s leaves the current visit usable', failure => {
    const saved = storage();
    const getStorage = () => { if (failure === 'get-storage') throw new Error('SecurityError'); return saved; };
    if (failure === 'read') saved.getItem = () => { throw new Error('SecurityError'); };
    if (failure === 'write') saved.setItem = () => { throw new Error('QuotaExceededError'); };
    const state = createMarqueeMotionPreference(getStorage);
    expect(() => state.setPaused(true)).not.toThrow(); expect(state.paused).toBe(true);
    expect(() => state.setPaused(false)).not.toThrow(); expect(state.paused).toBe(false);
  });

  test.each([null, 'running', 'paused'])('OS reduced motion wins over saved %p and cannot be overridden', value => {
    const saved = storage(value);
    const state = createMarqueeMotionPreference(() => saved, true);
    expect(state.paused).toBe(true); expect(state.reduced).toBe(true);
    expect(state.setPaused(false)).toBe(false); expect(state.paused).toBe(true);
    expect(saved.setItem).not.toHaveBeenCalled();
    state.setReducedMotion(false);
    expect(state.paused).toBe(true); expect(state.reduced).toBe(false);
    expect(saved.setItem).not.toHaveBeenCalled();
    state.setPaused(false); expect(state.paused).toBe(false);
  });

  test('turning the OS preference on and off never silently resumes or overwrites the saved choice', () => {
    const saved = storage('running');
    const state = createMarqueeMotionPreference(() => saved);
    expect(state.paused).toBe(false);
    state.setReducedMotion(true); expect(state.paused).toBe(true);
    state.setReducedMotion(false); expect(state.paused).toBe(true);
    expect(saved.setItem).not.toHaveBeenCalled();
    state.setPaused(false); expect(state.paused).toBe(false);
  });

  test('cross-tab pauses are honored but remote resumes and clears never start motion', () => {
    const saved = storage();
    const state = createMarqueeMotionPreference(() => saved);
    state.acceptStoredPause('paused'); expect(state.paused).toBe(true);
    state.acceptStoredPause('running'); expect(state.paused).toBe(true);
    state.acceptStoredPause(null); expect(state.paused).toBe(true);
    expect(saved.setItem).not.toHaveBeenCalled();
    state.setPaused(false); expect(state.paused).toBe(false);
  });
});

test.each(['index.html', 'marquee-ui.html'])('%s removes the motion button and retains keyboard guidance', file => {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  expect(html).toMatch(/class="marquee_skip-link" href="generator\/solid\/"/);
  expect(html).not.toContain('hero_generator-link');
  expect(html).not.toContain('Enter generator');
  expect(html).not.toContain('marquee-motion-toggle');
  expect(html).not.toContain('hero_controls');
  expect(html).toContain('aria-keyshortcuts="Space"');
  expect(html).toContain('aria-describedby="marquee-motion-description"');
  expect(html).toContain('Press Space to pause or resume scrolling.');
});

function shortcutFixture() {
  let handler;
  const motion = createMarqueeMotionPreference(() => storage());
  bindMarqueeMotionShortcut({ addEventListener: (_, fn) => { handler = fn; } }, () => motion.setPaused(!motion.paused));
  const send = (overrides = {}) => {
    const event = { key: ' ', code: 'Space', preventDefault: jest.fn(), ...overrides };
    handler(event); return event;
  };
  return { motion, send };
}

test('Space stops and resumes all motion without a button and respects reduced motion', () => {
  const { motion, send } = shortcutFixture();
  expect(send().preventDefault).toHaveBeenCalled();
  expect(motion.paused).toBe(true);
  send(); expect(motion.paused).toBe(false);
  motion.setReducedMotion(true);
  send(); expect(motion.paused).toBe(true);
  motion.setReducedMotion(false);
  expect(motion.paused).toBe(true);
  send(); expect(motion.paused).toBe(false);
});

test.each([{repeat:true}, {defaultPrevented:true}, {altKey:true}, {ctrlKey:true}, {metaKey:true}, {shiftKey:true},
  {key:'Enter', code:'Enter'}, {target:{closest:()=>({})}}])('shortcut leaves other interactions alone: %p', overrides => {
  const { motion, send } = shortcutFixture();
  expect(send(overrides).preventDefault).not.toHaveBeenCalled();
  expect(motion.paused).toBe(false);
});

// Exercise the actual startup scheduler with saved pause, rather than merely
// asserting the preference helper. This caught the second entrance cancellation
// that used to occur after pageEntrance's early head-script check.
test.each([false, true])('saved scrolling pause holds lanes without cancelling entrance; reduced=%s', reduced => {
  const vm = require('node:vm');
  const cancel = jest.fn(), raf = jest.fn(() => 1);
  const root = { dataset: {} };
  const stage = { append() {}, addEventListener() {} };
  const rows = [];
  const media = { matches: reduced, addEventListener() {} };
  const context = vm.createContext({
    window: { MarqueeCatalog: require('../js/utils/marqueeCatalog'), localStorage: storage('paused'),
      matchMedia: () => media, addEventListener() {}, requestAnimationFrame: raf,
      cancelAnimationFrame() {}, PageEntrance: { cancel } },
    document: { documentElement: root, querySelector: () => null,
      getElementById: () => null, addEventListener() {}, hidden: false },
    performance: { now: () => 0 }, rows
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/marqueeUi.js'), 'utf8'), context);
  vm.runInContext(`
    document.querySelector = () => stage;
    createRow = () => { const row = { element: {}, inertiaVelocity: 100, currentFactor: 1 }; rows.push(row); return row; };
    bindStageFocus = () => () => {};
    syncViewportHeightVar = () => {};
    syncMarqueeSizing = () => ({});
    syncHeroScale = () => {};
    syncRowMeasurements = () => {};
    syncRowVerticalLayout = () => {};
    initMarqueeScene();
  `, Object.assign(context, { stage }));
  expect(root.dataset.marqueeMotionPaused).toBe('true');
  expect(rows).toHaveLength(10);
  expect(rows.every(row => row.inertiaVelocity === 0 && row.currentFactor === 0)).toBe(true);
  expect(cancel).toHaveBeenCalledTimes(reduced ? 1 : 0);
  // Only the layout request runs. No lane-animation frame is scheduled.
  expect(raf).toHaveBeenCalledTimes(1);
});

test('scrolling pause does not blanket-disable hover fades, while reduced motion still does', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/marquee-ui.css'), 'utf8');
  expect(css).not.toMatch(/\[data-marquee-motion-paused[^}]+transition:\s*none/s);
  expect(css).toMatch(/\.bar_asset_wrap\s*\{[^}]*transition:\s*opacity 240ms/);
  expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*transition:\s*none !important/);
});


test('orphaned pause-button state is ignored; new Space choices remain persistent', () => {
  const values = new Map([['rpi-marquee-motion', 'paused']]);
  const saved = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const current = createMarqueeMotionPreference(() => saved);
  expect(current.paused).toBe(false);
  expect(values.get('rpi-marquee-motion')).toBe('paused');
  expect(values.has(MARQUEE_MOTION_STORAGE_KEY)).toBe(false);
  current.setPaused(true);
  expect(createMarqueeMotionPreference(() => saved).paused).toBe(true);
  current.setPaused(false);
  expect(createMarqueeMotionPreference(() => saved).paused).toBe(false);
  expect(createMarqueeMotionPreference(() => saved, true).paused).toBe(true);
});
