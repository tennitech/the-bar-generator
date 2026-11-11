const { advanceFocusFade, createMarqueeFocusFade } = require('../js/marqueeUi');

function advance(motion, duration, hz = 120) {
  for (let i = 0; i < Math.round(duration * hz); i++) motion = advanceFocusFade(motion, 1 / hz);
  return motion;
}

test('fade is brisk, bounded, non-oscillating, and identical in both directions', () => {
  let down = { value: 1, velocity: 0, target: .2 }, up = { value: .2, velocity: 0, target: 1 };
  for (let i = 0; i < 120; i++) {
    const next = advanceFocusFade(down, 1 / 120), other = advanceFocusFade(up, 1 / 120);
    expect(next.value).toBeLessThanOrEqual(down.value);
    expect(other.value).toBeGreaterThanOrEqual(up.value);
    expect(next.value + other.value).toBeCloseTo(1.2, 10);
    if (i === 23) expect(next.value).toBeLessThan(.24);
    down = next; up = other;
  }
  expect(down).toEqual({ value: .2, velocity: 0, target: .2 });
  expect(up).toEqual({ value: 1, velocity: 0, target: 1 });
});

test('rapid gap reversals retain velocity instead of restarting a compressed fade', () => {
  const gap = advanceFocusFade({ value: .2, velocity: 0, target: 1 }, .02);
  expect(gap.value).toBeGreaterThan(.2); // Release is immediate, not held dim.
  expect(gap.value).toBeLessThan(.28);
  const reversed = { ...gap, target: .2 };
  const next = advanceFocusFade(reversed, .001);
  expect(next.velocity).toBeGreaterThan(0); // Momentum is continuous at reversal.
  expect(Math.abs(next.value - gap.value)).toBeLessThan(.01);
  const settled = advance(reversed, 1);
  expect(settled.value).toBe(.2);
  expect(settled.velocity).toBe(0);
});

test('brightness response agrees across display refresh rates', () => {
  const start = { value: 1, velocity: 0, target: .2 };
  expect(advance(start, .2, 30).value).toBeCloseTo(advance(start, .2, 120).value, 12);
  expect(advance(start, .2, 60).velocity).toBeCloseTo(advance(start, .2, 240).velocity, 12);
});

function fixture() {
  let now = 0, sequence = 0, keyboard = null;
  const frames = new Map(), handlers = {}, mediaHandlers = {};
  const reduced = { matches: false, addEventListener: (name, fn) => { mediaHandlers.reduced = fn; } };
  const hover = { matches: true, addEventListener: (name, fn) => { mediaHandlers.hover = fn; } };
  const style = () => ({ values: {}, setProperty(k,v) { this.values[k] = v; }, removeProperty(k) { delete this.values[k]; } });
  const a = { style: style() }, b = { style: style() };
  const stage = { style: style(), dataset: {}, contains: e => e === a || e === b,
    querySelector: () => keyboard, addEventListener: (name, fn) => { handlers[name] = fn; } };
  global.window = { requestAnimationFrame: fn => { frames.set(++sequence, fn); return sequence; },
    cancelAnimationFrame: id => frames.delete(id), addEventListener: (name, fn) => { handlers[name] = fn; },
    matchMedia: q => q.includes('reduced') ? reduced : hover };
  global.document = { hidden: false, addEventListener: (name, fn) => { handlers[name] = fn; } };
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  const fade = createMarqueeFocusFade(stage);
  return { a,b,stage,fade,frames,reduced,handlers,mediaHandlers,
    field: () => Number(stage.style.values['--marquee-focus-field']),
    opacity: el => Math.max(Number(stage.style.values['--marquee-focus-field']), Number(el.style.values['--marquee-focus-local'] || .2)),
    keyboard(el) { keyboard = el; handlers[el ? 'focusin' : 'focusout'](); },
    tick(dt = 16) { now += dt; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); },
    settle() { for (let i = 0; i < 100 && frames.size; i++) this.tick(); } };
}

afterEach(() => { delete global.window; delete global.document; jest.restoreAllMocks(); });

test('gap starts brightening immediately; highlighted bar stays bright and returning smoothly reverses', () => {
  const f = fixture();
  f.fade.setPointer(f.a); f.settle();
  expect(f.opacity(f.a)).toBe(1); expect(f.opacity(f.b)).toBe(.2);
  f.fade.setPointer(null); f.tick();
  expect(f.field()).toBeGreaterThan(.2);
  expect(f.opacity(f.a)).toBe(1);
  const first = f.field();
  f.fade.setPointer(f.b); f.tick();
  expect(Math.abs(f.field() - first)).toBeLessThan(.15);
  f.settle();
  expect(f.opacity(f.a)).toBe(.2); expect(f.opacity(f.b)).toBe(1);
  expect(f.a.style.values['--marquee-focus-local']).toBeUndefined();
  f.fade.setPointer(null); f.settle();
  expect(f.field()).toBe(1); expect(f.frames.size).toBe(0);
  expect(f.b.style.values['--marquee-focus-local']).toBeUndefined();
});

test('keyboard selection wins; reduced motion and page exit settle without extra frames', () => {
  const f = fixture();
  f.fade.setPointer(f.a); f.keyboard(f.b); f.settle();
  expect(f.opacity(f.a)).toBe(.2); expect(f.opacity(f.b)).toBe(1);
  f.keyboard(null); f.tick();
  f.reduced.matches = true; f.mediaHandlers.reduced();
  expect(f.opacity(f.a)).toBe(1); expect(f.opacity(f.b)).toBe(.2);
  expect(f.frames.size).toBe(0);
  f.reduced.matches = false; f.fade.setPointer(null); f.tick();
  f.handlers.pagehide();
  expect(f.field()).toBe(1); expect(f.frames.size).toBe(0);
});

test('re-entering a recent bar starts from displayed field brightness, not its stale local fade', () => {
  const f = fixture();
  f.fade.setPointer(f.a); f.settle();
  f.fade.setPointer(f.b);
  for (let i = 0; i < 13; i++) f.tick();
  f.fade.setPointer(null);
  for (let i = 0; i < 5; i++) f.tick();
  f.fade.setPointer(f.a); f.tick();
  expect(Number(f.a.style.values['--marquee-focus-local'])).toBeGreaterThanOrEqual(f.field());
  f.settle(); expect(f.opacity(f.a)).toBe(1);
});

test('short real gaps brighten immediately with much less whole-field flash', () => {
  for (const seconds of [.016, .032, .05]) {
    const start = { value: .2, velocity: 0, target: 1 };
    const previous = advanceFocusFade(start, seconds);
    const next = advanceFocusFade(start, seconds, 12);
    expect(next.value).toBeGreaterThan(.2);
    expect(next.value - .2).toBeLessThan((previous.value - .2) * .35);
  }
});

test('directional lookahead brightens the next bar before entry and expires at rest', () => {
  const f = fixture();
  f.fade.setPointer(f.a); f.settle();
  document.elementFromPoint = jest.fn(() => ({ closest: () => f.b }));
  const move = x => f.handlers.pointermove({ pointerType: 'mouse', buttons: 0, clientX: x, clientY: 100 });
  move(100); f.tick(); move(120); f.tick(); f.tick();
  expect(f.opacity(f.b)).toBeGreaterThan(.2);
  expect(f.field()).toBe(.2);
  expect(document.elementFromPoint.mock.calls.length).toBeLessThanOrEqual(3);
  f.settle();
  expect(f.opacity(f.b)).toBe(.2);
  expect(f.frames.size).toBe(0);
});

test('lookahead never owns gap dimming and does not interfere with focus, touch or drag', () => {
  const f = fixture();
  f.fade.setPointer(f.a); f.settle();
  document.elementFromPoint = jest.fn(() => ({ closest: () => f.b }));
  const move = (x, extra = {}) => f.handlers.pointermove({ pointerType: 'mouse', buttons: 0, clientX: x, clientY: 100, ...extra });
  move(100); f.tick(); move(120); f.tick();
  f.fade.setPointer(null); f.tick();
  expect(f.field()).toBeGreaterThan(.2);
  f.keyboard(f.a); f.settle();
  expect(f.opacity(f.b)).toBe(.2);
  document.elementFromPoint.mockClear();
  move(140, { pointerType: 'touch' }); f.tick();
  move(160, { buttons: 1 }); f.tick();
  expect(document.elementFromPoint).not.toHaveBeenCalled();
  f.keyboard(null); f.handlers.pointerleave(); f.settle();
  expect(f.field()).toBe(1); expect(f.frames.size).toBe(0);
});
