const { createWriter } = require('../js/utils/urlState');
function fixture() {
  let url = 'https://example.test/generator/triangles/';
  const writes = [], errors = [];
  const writer = createWriter({ currentURL: () => url, now: () => Date.now(),
    schedule: setTimeout, unschedule: clearTimeout,
    write: next => { url = next; writes.push(next); }, onError: error => errors.push(error) });
  return { writer, writes, errors, current: () => url };
}
beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(0); });
afterEach(() => jest.useRealTimers());
test('rapid control edits stay below browser history limits and retain the final state', () => {
  const { writer, writes, current } = fixture();
  for (let i = 0; i < 300; i++) { writer.replace(`?count=${i}`); jest.advanceTimersByTime(10); }
  jest.advanceTimersByTime(200);
  expect(writes.length).toBeLessThanOrEqual(16);
  expect(current()).toBe('https://example.test/generator/triangles/?count=299');
});
test('unchanged state does not consume history writes or leave a stale trailing update', () => {
  const { writer, writes, current } = fixture();
  writer.replace('?count=6'); writer.replace('?count=28'); writer.replace(current());
  jest.advanceTimersByTime(500);
  expect(writes).toHaveLength(1);
  expect(current()).toContain('count=6');
});
test('history navigation cancels an older edit; explicit exit flush preserves the last edit', () => {
  const { writer, writes, current } = fixture();
  writer.replace('?count=6'); writer.replace('?count=28'); writer.cancel();
  jest.advanceTimersByTime(500); expect(writes).toHaveLength(1);
  writer.replace('?count=10'); writer.replace('?count=19'); writer.flush();
  expect(current()).toContain('count=19');
});
test('a failed browser write reports a recoverable error and permits a later edit', () => {
  let fail = true; const errors = [], writes = [];
  const writer = createWriter({ currentURL: () => 'https://example.test/', now: () => Date.now(),
    schedule: setTimeout, unschedule: clearTimeout, onError: error => errors.push(error.message),
    write: url => { if (fail) throw new Error('History unavailable'); writes.push(url); } });
  writer.replace('?count=6'); fail = false; writer.replace('?count=28'); jest.advanceTimersByTime(200);
  expect(errors).toEqual(['History unavailable']); expect(writes[0]).toContain('count=28');
});

test('a bfcache handoff cannot restore an obsolete edit after returning to the original URL', () => {
  const vm = require('node:vm'), fs = require('node:fs');
  const listeners = {}, stored = new Map();
  const location = { href: 'https://example.test/generator/triangles/?count=0' };
  const context = { URL, setTimeout, clearTimeout, performance: { now: () => Date.now() }, location,
    history: { state: null, replaceState: (_, __, url) => { location.href = url; } },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    dispatchEvent() {}, CustomEvent: class {},
    sessionStorage: { setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/urlState'), 'utf8'), context);
  const api = context.URLState;
  api.replace('?count=20'); api.replace('?count=22');
  listeners.pagehide(); expect(stored.has('rpi-pending-url')).toBe(true);
  jest.advanceTimersByTime(1000); listeners.pageshow({ persisted: true });
  expect(location.href).toContain('count=22'); expect(stored.has('rpi-pending-url')).toBe(false);
  api.replace('?count=20'); jest.advanceTimersByTime(200);
  listeners.pagehide(); expect(stored.has('rpi-pending-url')).toBe(false);
  expect(location.href).toContain('count=20');
});
