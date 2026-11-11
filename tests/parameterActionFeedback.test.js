const vm = require('node:vm');
const fs = require('node:fs');
function fixture(reduce = false) {
  const media = { matches: reduce, addEventListener: jest.fn() };
  const document = { hidden: false, addEventListener: jest.fn() };
  const scope = { matchMedia: () => media, addEventListener: jest.fn(),
    getComputedStyle: jest.fn(target => ({ transform: target.liveTransform || 'none' })) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/parameterControls'), 'utf8'), { window: scope, document });
  const animations = [];
  function target(name) {
    const node = { name };
    node.animate = jest.fn((frames, options) => {
      const animation = { target: node, frames, options, cancel: jest.fn() };
      animation.finished = new Promise(resolve => { animation.finish = resolve; });
      animations.push(animation); return animation;
    });
    return node;
  }
  const back = target('back'), front = target('front'), label = target('label'), root = target('root');
  const button = { querySelector: jest.fn(selector => ({ '[data-die-face="back"]': back,
    '[data-die-face="front"]': front, '.parameter_action-label': label, '.parameter_action-icon': root })[selector]) };
  return { api: scope.ParameterControls, button, back, front, label, root, animations, media, document, scope };
}

test('Randomize moves each die independently, with clear lateral swings and different settling times, then returns to rest', () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  expect(f.back.animate).toHaveBeenCalledTimes(1); expect(f.front.animate).toHaveBeenCalledTimes(1);
  expect(f.root.animate).not.toHaveBeenCalled(); expect(f.label.animate).not.toHaveBeenCalled();
  const [back, front] = f.animations;
  expect(back.frames).not.toEqual(front.frames);
  expect(back.options.duration).toBeLessThan(front.options.duration);
  expect(back.options.duration).toBeGreaterThanOrEqual(400);
  expect(front.options.duration).toBeLessThanOrEqual(600);
  expect(back.frames[1].transform).toMatch(/rotate\(-[1-9]/);
  expect(front.frames[1].transform).toMatch(/rotate\([1-9]/);
  for (const animation of f.animations) {
    expect(animation.frames.at(-1)).toEqual(animation.frames[0]);
    expect(animation.options.fill).toBeUndefined();
    expect(animation.frames.every(frame => Object.keys(frame).every(key => ['transform', 'offset', 'easing'].includes(key)))).toBe(true);
  }
});

test('both dice reverse left/right repeatedly with decreasing excursions and a smooth final settle', () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  for (const { frames, options } of f.animations) {
    const x = frames.map(frame => Number(frame.transform.match(/translateX\(([-.\d]+)px\)/)[1]));
    const swings = x.slice(1, -1);
    expect(swings.length).toBeGreaterThanOrEqual(6);
    expect(Math.abs(swings[0])).toBeGreaterThanOrEqual(2.4);
    expect(Math.max(...swings.map(Math.abs))).toBeLessThanOrEqual(3);
    for (let i = 1; i < swings.length; i++) {
      expect(Math.sign(swings[i])).toBe(-Math.sign(swings[i - 1]));
      expect(Math.abs(swings[i])).toBeLessThan(Math.abs(swings[i - 1]));
    }
    expect(x[0]).toBe(0); expect(x.at(-1)).toBe(0);
    expect(Math.abs(swings.at(-1))).toBeLessThan(0.2);
    expect(options.easing).toBe('linear');
    expect(frames.every(frame => frame.easing === 'cubic-bezier(0.37, 0, 0.63, 1)')).toBe(true);
  }
});

test('rapid activations replace both face animations and continue from their individual displayed poses', () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  f.back.liveTransform = 'matrix(1, 0.1, -0.1, 1, 0, -0.4)';
  f.front.liveTransform = 'matrix(1, -0.1, 0.1, 1, 0, 0.3)';
  for (let i = 0; i < 9; i++) f.api.feedback(f.button, 'randomize');
  expect(f.animations).toHaveLength(20);
  for (const old of f.animations.slice(0, -2)) expect(old.cancel).toHaveBeenCalledTimes(1);
  expect(f.animations[2].frames[0].transform).toBe(f.back.liveTransform);
  expect(f.animations[3].frames[0].transform).toBe(f.front.liveTransform);
  f.api.cancelFeedback();
  for (const latest of f.animations.slice(-2)) expect(latest.cancel).toHaveBeenCalledTimes(1);
  expect(f.media.addEventListener).toHaveBeenCalledTimes(1);
});

test('late completion of replaced animations cannot remove the currently active pair', async () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  const old = [...f.animations]; f.api.feedback(f.button, 'randomize');
  old.forEach(animation => animation.finish()); await Promise.resolve();
  f.api.cancelFeedback();
  f.animations.slice(-2).forEach(animation => expect(animation.cancel).toHaveBeenCalledTimes(1));
});

test('naturally finished animations are released without retained transforms or stale cancellation', async () => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  f.animations.forEach(animation => animation.finish()); await Promise.resolve();
  f.api.cancelFeedback();
  f.animations.forEach(animation => expect(animation.cancel).not.toHaveBeenCalled());
  f.api.feedback(f.button, 'randomize'); expect(f.scope.getComputedStyle).not.toHaveBeenCalled();
});

test('reduced motion and background pages leave both dice still', () => {
  const f = fixture(true); f.api.feedback(f.button, 'randomize'); expect(f.animations).toHaveLength(0);
  f.media.matches = false; f.document.hidden = true; f.api.feedback(f.button, 'randomize');
  expect(f.animations).toHaveLength(0);
});

test.each(['reduced-motion', 'pagehide', 'hidden'])('%s cancels both active face responses', cause => {
  const f = fixture(); f.api.feedback(f.button, 'randomize');
  if (cause === 'reduced-motion') { f.media.matches = true; f.media.addEventListener.mock.calls[0][1]({ matches: true }); }
  if (cause === 'pagehide') f.scope.addEventListener.mock.calls.find(([name]) => name === 'pagehide')[1]();
  if (cause === 'hidden') { f.document.hidden = true; f.document.addEventListener.mock.calls[0][1](); }
  f.animations.forEach(animation => expect(animation.cancel).toHaveBeenCalledTimes(1));
});

test('missing or unsupported SVG animation targets degrade to a still icon', () => {
  const f = fixture(); f.back.animate = undefined; f.front.animate = undefined;
  expect(() => f.api.feedback(f.button, 'randomize')).not.toThrow(); expect(f.animations).toHaveLength(0);
  f.button.querySelector = () => null;
  expect(() => f.api.feedback(f.button, 'randomize')).not.toThrow();
});

test.each(['undo', 'reset'])('%s retains the existing label response and does not move dice', action => {
  const f = fixture(); f.api.feedback(f.button, action);
  expect(f.label.animate).toHaveBeenCalledTimes(1);
  expect(f.animations[0].options.duration).toBe(160);
  expect(f.back.animate).not.toHaveBeenCalled(); expect(f.front.animate).not.toHaveBeenCalled();
});

test('face transforms use their own centers inside a fixed-size, unclipped icon slot', () => {
  const css = fs.readFileSync(require.resolve('../css/style.css'), 'utf8');
  expect(css).toMatch(/\.parameter_action-glyph\s*\{[^}]*width: 1.125rem;[^}]*height: 1.125rem/s);
  expect(css).toMatch(/\.parameter_action-icon\s*\{[^}]*overflow: visible/s);
  expect(css).toMatch(/\.parameter_action-icon \[data-die-face\]\s*\{ transform-box: fill-box; transform-origin: center;/);
});
