const vm = require('node:vm');
const fs = require('node:fs');
function fixture(reduce = false) {
  const media = { matches: reduce, addEventListener: jest.fn() };
  const document = { hidden: false, addEventListener: jest.fn() };
  const scope = { matchMedia: () => media, addEventListener: jest.fn() };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/parameterControls'), 'utf8'), { window: scope, document });
  const animations = [];
  const target = { animate: jest.fn(() => { const animation = { cancel: jest.fn(), finished: new Promise(() => {}) }; animations.push(animation); return animation; }) };
  const button = { querySelector: jest.fn(() => target) };
  return { api: scope.ParameterControls, button, target, animations, media, document, scope };
}
test('one bounded response per action; repeated presses replace rather than accumulate', () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize'); f.api.feedback(f.button, 'randomize');
  expect(f.animations[0].cancel).toHaveBeenCalledTimes(1);
  expect(f.target.animate.mock.calls[1][1].duration).toBe(220);
  f.api.cancelFeedback(); expect(f.animations[1].cancel).toHaveBeenCalledTimes(1);
});
test('reduced motion and background pages do not animate', () => {
  const f = fixture(true); f.api.feedback(f.button, 'randomize'); expect(f.target.animate).not.toHaveBeenCalled();
  f.media.matches = false; f.document.hidden = true; f.api.feedback(f.button, 'undo'); expect(f.target.animate).not.toHaveBeenCalled();
});
test('a live reduction preference cancels active feedback immediately', () => {
  const f = fixture(); f.api.feedback(f.button, 'reset');
  f.media.addEventListener.mock.calls[0][1]({ matches: true });
  expect(f.animations[0].cancel).toHaveBeenCalledTimes(1);
});

test('page exit and backgrounding cancel active responses', () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  f.scope.addEventListener.mock.calls.find(([name]) => name === 'pagehide')[1]();
  expect(f.animations[0].cancel).toHaveBeenCalledTimes(1);
  f.api.feedback(f.button, 'undo'); f.document.hidden = true;
  f.document.addEventListener.mock.calls.find(([name]) => name === 'visibilitychange')[1]();
  expect(f.animations[1].cancel).toHaveBeenCalledTimes(1);
});
