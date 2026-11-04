const { measure } = require('../js/utils/sidebarScrollCue');
const base = { scrollHeight: 1000, clientHeight: 600, scrollTop: 0, scrollerTop: 56,
  scrollerBottom: 656, contentBottom: 856, footerTop: 456, footerSticky: true, sidebarTop: 56 };
test('remaining parameters cue sits above the sticky footer', () => {
  expect(measure(base)).toEqual({ visible: true, top: 376 });
});
test('no cue when all content fits or scroll reaches the end', () => {
  expect(measure({ ...base, scrollHeight: 600, contentBottom: 400 }).visible).toBe(false);
  expect(measure({ ...base, scrollTop: 399 }).visible).toBe(false);
});
test('information below the viewport alone is not more parameters', () => {
  expect(measure({ ...base, contentBottom: 456 }).visible).toBe(false);
});
test('short layouts position the cue at the scroller edge, not a flowing footer', () => {
  expect(measure({ ...base, footerSticky: false, footerTop: 900 })).toEqual({ visible: true, top: 576 });
});
test('hidden or completely covered control areas have no cue', () => {
  expect(measure({ ...base, clientHeight: 0 }).visible).toBe(false);
  expect(measure({ ...base, footerTop: 80 }).visible).toBe(false);
});
