const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/utils/themeMotion'), 'utf8');
function setup({ reduced = false, hidden = false } = {}) {
 const classes = new Set(), listeners = {}, effects = [];
 const media = { matches: reduced, addEventListener: (name, callback) => { listeners.media = callback; } };
 const document = {
  hidden, documentElement: {}, startViewTransition: jest.fn(() => { throw Error('Snapshot must not delay colors'); }),
  body: { append: jest.fn(), classList: { add: v => classes.add(v), remove: v => classes.delete(v), contains: v => classes.has(v) } },
  addEventListener: (name, callback) => { listeners[name] = callback; },
  createElement: () => {
   const effect = { cancel: jest.fn(), finished: Promise.resolve() };
   const strip = { setAttribute: jest.fn(), remove: jest.fn(), animate: jest.fn(() => effect) };
   effects.push({ effect, strip }); return strip;
  }
 };
 const window = { innerHeight: 800, matchMedia: () => media, addEventListener: (name, callback) => { listeners[name] = callback; } };
 vm.runInNewContext(source, { document, window, getComputedStyle: () => ({ color: '#000', getPropertyValue: () => '120ms' }) });
 return { document, classes, listeners, effects, api: window.ThemeMotion };
}
test('a selected palette commits synchronously without a full-page snapshot', () => {
 const h = setup(), update = jest.fn(); h.api.run(update);
 expect(update).toHaveBeenCalledTimes(1); expect(h.document.startViewTransition).not.toHaveBeenCalled();
 expect(h.classes.has('has-theme-snapshot')).toBe(false);
 expect(h.effects[0].strip.animate.mock.calls[0][1]).toEqual({ duration: 120, easing: 'linear' });
});
test('rapid changes cancel old display effects without delaying or dropping the newest state', () => {
 const h = setup(); let value = '';
 h.api.run(() => { value = 'red'; }); h.api.run(() => { value = 'white'; });
 expect(value).toBe('white'); expect(h.effects[0].effect.cancel).toHaveBeenCalledTimes(1);
 expect(h.effects[0].strip.remove).toHaveBeenCalled();
 h.listeners.resize(); expect(h.effects[1].effect.cancel).toHaveBeenCalledTimes(1);
});
test.each([{reduced:true},{hidden:true}])('reduced/hidden states commit with no display animation: %j', options => {
 const h = setup(options), update = jest.fn(); h.api.run(update);
 expect(update).toHaveBeenCalledTimes(1); expect(h.effects).toHaveLength(0);
});
test('a failing update does not leave interaction transitions disabled', () => {
 const h = setup(); expect(() => h.api.run(() => { throw Error('test'); })).toThrow('test');
 expect(h.classes.has('has-theme-snapshot')).toBe(false);
});
