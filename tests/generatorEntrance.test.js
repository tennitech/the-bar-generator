const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require.resolve('../js/utils/asciiEntrance'), 'utf8');
function setup({ fail = false, pending = false } = {}) {
  const frames = new Map(), decoded = [], operations = [];
  let frameId = 0, cancelled = false, time = 0;
  const context = { scale() {}, clearRect() {}, fillText() {},
    drawImage(image) { this.image = image; operations.push('paint'); },
    getImageData: () => ({ data: new Uint8Array(8 * 2 * 4).fill(255) }) };
  function element(tag) {
    const classes = new Set();
    return { tagName: tag.toUpperCase(), style: { opacity: '' }, dataset: {},
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
      setAttribute() {}, getContext: () => ({ ...context }), remove: jest.fn(),
      getBoundingClientRect: () => ({ left: 42.125, top: 16.375, width: 56, height: 20 }) };
  }
  const parent = { clientLeft: 1, clientTop: 2, scrollLeft: 3, scrollTop: 4,
    getBoundingClientRect: () => ({ left: 40, top: 10 }),
    appendChild: jest.fn(layer => operations.push(`append:${layer.tagName}`)) };
  const canvas = element('canvas'); canvas.parentElement = parent; canvas.style.opacity = '0.9';
  const mark = () => ({ children: ['p', 'i', 'r', 'bar'].map(id => ({ id, tagName: 'path', setAttribute(name, value) { this[name] = value; } })) });
  const source = () => {
    const group = mark();
    return { documentElement: { style: { color: '#d6001c' } },
      querySelector: () => group, cloneNode: source };
  };
  class Image {
    decode() {
      if (fail) return Promise.reject(new Error('decode'));
      if (pending) return new Promise(resolve => decoded.push(resolve));
      return Promise.resolve();
    }
  }
  const scope = { devicePixelRatio: 2, Image, DOMParser: class { parseFromString() { return source(); } },
    XMLSerializer: class { serializeToString(doc) { return JSON.stringify(doc.querySelector().children); } },
    document: { createElement: element }, performance: { now: () => time },
    setTimeout, clearTimeout, requestAnimationFrame: cb => { frames.set(++frameId, cb); return frameId; },
    cancelAnimationFrame: id => frames.delete(id), window: null };
  scope.window = scope;
  vm.runInNewContext(code, scope);
  return { api: scope.AsciiEntrance, canvas, parent, operations, decoded,
    prepare: () => scope.AsciiEntrance.prepareGenerator([canvas], [], () => cancelled, () => '<svg/>'),
    cancel: () => { cancelled = true; },
    tick(now) { time = now; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(now)); }, frames };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('generator uses exact fractional placement and canonical whole-path groups', async () => {
  const s = setup(), pass = await s.prepare();
  expect(s.canvas.style.opacity).toBe('0.9');
  expect(s.parent.appendChild).not.toHaveBeenCalled();
  const finish = jest.fn(); pass.start(580, jest.fn(), finish);
  expect(s.operations[0]).toBe('paint');
  const layers = s.parent.appendChild.mock.calls.map(([layer]) => layer);
  const copies = layers.filter(layer => layer.tagName === 'IMG');
  expect(copies).toHaveLength(4);
  expect(copies.map(copy => JSON.parse(decodeURIComponent(copy.src.split(',').slice(1).join(',')))
    .filter(node => node.visibility !== 'hidden').map(node => node.id))).toEqual([['r'], ['p'], ['i'], ['bar']]);
  for (const layer of copies) expect(layer.style).toMatchObject({ left: '4.125px', top: '8.375px', width: '56px', height: '20px' });
  const rectangles = copies.map(copy => ({ left: copy.style.left, top: copy.style.top, width: copy.style.width, height: copy.style.height }));
  s.tick(100); s.tick(332);
  expect(Number(copies[0].style.opacity)).toBe(1);
  expect(Number(copies[1].style.opacity)).toBeGreaterThan(0);
  expect(Number(copies[2].style.opacity)).toBe(0);
  expect(copies.map(copy => ({ left: copy.style.left, top: copy.style.top, width: copy.style.width, height: copy.style.height }))).toEqual(rectangles);
  s.tick(680);
  expect(finish).toHaveBeenCalledTimes(1);
  expect(s.canvas.style.opacity).toBe('0.9');
  expect(s.canvas.classList.contains('is-ascii-original')).toBe(false);
  expect(s.frames.size).toBe(0);
  expect(layers.every(layer => layer.remove.mock.calls.length === 1)).toBe(true);
  pass.cleanup();
  expect(layers.every(layer => layer.remove.mock.calls.length === 1)).toBe(true);
});

test('layout change cancels the sampled frame and exposes the original immediately', async () => {
  const s = setup(), pass = await s.prepare(), finish = jest.fn();
  pass.start(580, null, finish);
  s.canvas.getBoundingClientRect = () => ({ left: 42.25, top: 16.375, width: 56, height: 20 });
  s.tick(16);
  expect(finish).toHaveBeenCalledTimes(1);
  expect(s.canvas.style.opacity).toBe('0.9');
  expect(s.frames.size).toBe(0);
});

test('decode failure or deadline never conceals or changes the real artwork', async () => {
  const failed = setup({ fail: true });
  expect(await failed.prepare()).toBeNull();
  expect(failed.canvas.style.opacity).toBe('0.9');
  expect(failed.parent.appendChild).not.toHaveBeenCalled();
  const slow = setup({ pending: true }), prepared = slow.prepare();
  jest.advanceTimersByTime(350);
  expect(await prepared).toBeNull();
  slow.decoded.forEach(resolve => resolve()); await Promise.resolve();
  expect(slow.parent.appendChild).not.toHaveBeenCalled();
  expect(slow.canvas.style.opacity).toBe('0.9');
});

test('interruption during decoding cannot attach late layers or restart', async () => {
  const s = setup({ pending: true }), prepared = s.prepare();
  s.cancel(); s.decoded.forEach(resolve => resolve());
  expect(await prepared).toBeNull();
  expect(s.parent.appendChild).not.toHaveBeenCalled();
  expect(s.frames.size).toBe(0);
});
