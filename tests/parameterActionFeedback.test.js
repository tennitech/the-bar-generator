const vm = require('node:vm');
const fs = require('node:fs');
function fixture(reduce = false, random = () => 0.5) {
  const media = { matches: reduce, addEventListener: jest.fn() };
  const document = { hidden: false, addEventListener: jest.fn() };
  const scope = { matchMedia: () => media, addEventListener: jest.fn(),
    getComputedStyle: jest.fn(target => ({ transform: target.liveTransform || 'none' })) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/parameterControls'), 'utf8'), { window: scope, document, Math: Object.assign(Object.create(Math), { random }) });
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

function pose(frame) {
  const [, x, y, angle] = frame.transform.match(/translate\(([-.\d]+)px, ([-.\d]+)px\) rotate\(([-.\d]+)deg\)/);
  return { x: Number(x), y: Number(y), angle: Number(angle) };
}

test('Randomize rolls both separated dice independently without moving the slot or label', () => {
  const values = [0, 0.25, 0.5, 0.4, 0.99, 0.8, 0.2, 0.9];
  const f = fixture(false, () => values.shift()); f.api.feedback(f.button, 'randomize');
  expect(f.back.animate).toHaveBeenCalledTimes(1); expect(f.front.animate).toHaveBeenCalledTimes(1);
  expect(f.root.animate).not.toHaveBeenCalled(); expect(f.label.animate).not.toHaveBeenCalled();
  const [back, front] = f.animations;
  expect(back.frames).not.toEqual(front.frames);
  expect(back.options.duration).not.toEqual(front.options.duration);
  expect(pose(back.frames[8]).angle).toBeLessThan(0);
  expect(pose(front.frames[8]).angle).toBeGreaterThan(0);
  expect(pose(back.frames[12]).x).toBeGreaterThan(0);
  expect(pose(back.frames[12]).y).toBeLessThan(0);
  expect(pose(front.frames[12]).x).toBeLessThan(0);
  expect(pose(front.frames[12]).y).toBeGreaterThan(0);
});

test.each([0, 0.25, 0.5, 0.999999])('random sample %s keeps full rolls, outward travel and small recoil bounded', sample => {
  const f = fixture(false, () => sample); f.api.feedback(f.button, 'randomize');
  for (const { frames, options } of f.animations) {
    const poses = frames.map(pose), start = poses[0], end = poses.at(-1);
    expect(start.x).toBe(0); expect(start.y).toBe(0); expect(Math.abs(start.angle)).toBe(0);
    expect(end.x).toBe(0); expect(end.y).toBe(0); expect(Math.abs(end.angle)).toBe(360);
    const angles = poses.map(p => Math.abs(p.angle));
    // One recognizable full roll with a restrained overshoot, followed by rest.
    expect(Math.max(...angles)).toBeGreaterThan(360);
    expect(Math.max(...angles)).toBeLessThanOrEqual(367);
    expect(angles.at(-2)).toBeGreaterThan(angles.at(-1));
    expect(Math.max(...poses.map(p => Math.abs(p.x)))).toBeLessThanOrEqual(1.2);
    expect(Math.max(...poses.map(p => Math.abs(p.y)))).toBeLessThanOrEqual(0.66);
    expect(options.duration).toBeGreaterThanOrEqual(560);
    expect(options.duration).toBeLessThanOrEqual(700);
    expect(options.fill).toBeUndefined(); expect(options.easing).toBe('linear');
    expect(frames.every(frame => Object.keys(frame).every(key => ['transform', 'offset'].includes(key)))).toBe(true);
    for (let i = 1; i < frames.length; i++) expect(frames[i].offset).toBeGreaterThan(frames[i - 1].offset);
    // Smooth sampled motion cannot jump more than a small part of a turn per segment.
    for (let i = 1; i < poses.length; i++) expect(Math.abs(poses[i].angle - poses[i - 1].angle)).toBeLessThan(30);
  }
});

test('each activation samples a fresh bounded response for each face', () => {
  let index = 0;
  const random = jest.fn(() => ((index++ * 7) % 19) / 19);
  const f = fixture(false, random);
  f.api.feedback(f.button, 'randomize'); f.api.feedback(f.button, 'randomize');
  expect(f.animations[0].frames).not.toEqual(f.animations[2].frames);
  expect(f.animations[1].frames).not.toEqual(f.animations[3].frames);
  expect(f.animations[0].options.duration).not.toBe(f.animations[2].options.duration);
  const before = random.mock.calls.length;
  f.media.matches = true; f.api.feedback(f.button, 'randomize');
  expect(random).toHaveBeenCalledTimes(before);
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
