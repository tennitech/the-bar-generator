const { measure } = require('../js/utils/sidebarScrollCue');
const base = { scrollHeight: 1000, clientHeight: 600, scrollTop: 0, scrollerTop: 56,
  scrollerBottom: 656, contentBottom: 856, footerTop: 456, sidebarTop: 56 };
test('remaining parameters cue sits above the sticky footer', () => {
  expect(measure(base)).toEqual({ visible: true, top: 376, availableHeight: 400 });
});
test('no cue when all content fits or scroll reaches the end', () => {
  expect(measure({ ...base, scrollHeight: 600, contentBottom: 400 }).visible).toBe(false);
  expect(measure({ ...base, scrollTop: 399 }).visible).toBe(false);
});
test('information below the viewport alone is not more parameters', () => {
  expect(measure({ ...base, contentBottom: 456 }).visible).toBe(false);
});
test('the pinned footer boundary follows the resized controls viewport', () => {
  expect(measure({ ...base, scrollerBottom: 356, clientHeight: 300, footerTop: 356 }))
    .toEqual({ visible: true, top: 276, availableHeight: 300 });
  expect(measure({ ...base, footerTop: 900 })).toEqual({ visible: true, top: 576, availableHeight: 600 });
});
test('hidden or completely covered control areas have no cue', () => {
  expect(measure({ ...base, clientHeight: 0 }).visible).toBe(false);
  expect(measure({ ...base, footerTop: 80 }).visible).toBe(false);
});

test('fade space stops at the scroller heading even when the sticky footer leaves little room', () => {
  expect(measure({ ...base, scrollerTop: 112, footerTop: 164 }))
    .toEqual({ visible: true, top: 84, availableHeight: 52 });
  expect(measure({ ...base, footerTop: 40 }).availableHeight).toBe(0);
});


test('cue initializes with the footer outside the scroller and follows disclosure resize', () => {
  const vm = require('node:vm');
  const source = require('node:fs').readFileSync(require.resolve('../js/utils/sidebarScrollCue'), 'utf8');
  const frames = [];
  const handlers = {};
  let resize;
  let boundary = 456;
  let scrollTop = 0;
  let cue;
  const content = { getBoundingClientRect: () => ({ bottom: 856 - scrollTop }) };
  const footer = { getBoundingClientRect: () => ({ top: boundary }) };
  const scroller = {
    scrollHeight: 800,
    get clientHeight() { return boundary - 56; },
    get scrollTop() { return scrollTop; },
    querySelector: selector => selector === '.sidebar-content' ? content : null,
    getBoundingClientRect: () => ({ top: 56, bottom: boundary }),
    setAttribute: jest.fn(),
    addEventListener: (event, callback) => { handlers[event] = callback; }
  };
  const sidebar = {
    querySelector: selector => selector === '.sidebar-footer' ? footer : cue,
    appendChild: element => { cue = element; },
    getBoundingClientRect: () => ({ top: 56 }),
    addEventListener: (event, callback) => { handlers[event] = callback; }
  };
  const documentRef = {
    getElementById: id => id === 'app-sidebar' ? sidebar : scroller,
    createElement: () => ({ dataset: {}, style: { setProperty: jest.fn() }, setAttribute: jest.fn() })
  };
  const context = { module: { exports: {} }, FeatherIcons: { getIconMarkup: () => '' },
    requestAnimationFrame: callback => frames.push(callback),
    addEventListener: jest.fn(),
    ResizeObserver: class { constructor(callback) { resize = callback; } observe() {} }
  };
  vm.runInNewContext(source, context);
  const flush = () => { while (frames.length) frames.shift()(); };
  context.module.exports.init(documentRef);
  flush();
  expect(cue.hidden).toBe(false);
  expect(cue.style.top).toBe('376px');
  expect(scroller.tabIndex).toBe(0);
  const firstCue = cue;
  context.module.exports.init(documentRef);
  expect(cue).toBe(firstCue);
  // Opening About reduces the available controls area; it cannot cue its own text.
  boundary = 356;
  resize(); handlers.toggle();
  expect(frames).toHaveLength(1);
  flush();
  expect(cue.style.top).toBe('276px');
  scrollTop = 500;
  handlers.scroll(); flush();
  expect(cue.hidden).toBe(true);
  // Closing again leaves controls visible and cue state reversible.
  boundary = 456; scrollTop = 0;
  resize(); flush();
  expect(cue.hidden).toBe(false);
});
