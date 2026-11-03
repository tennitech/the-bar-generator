const fs = require('node:fs');
const path = require('node:path');
const { MARQUEE_MOTION_STORAGE_KEY, createMarqueeMotionPreference } = require('../js/marqueeUi');

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

test.each(['index.html', 'marquee-ui.html'])('%s retains native browse and skip routes plus a labelled motion button', file => {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  expect(html).toMatch(/class="marquee_skip-link" href="generator\/solid\/"/);
  expect(html).toMatch(/class="hero_browse-link" href="generator\/solid\/">Browse styles<\/a>/);
  expect(html).toMatch(/<button[^>]+id="marquee-motion-toggle"[^>]+type="button"[^>]+aria-controls="marquee-stage"[^>]+aria-describedby="marquee-motion-description"[^>]*>Pause motion<\/button>/);
});
