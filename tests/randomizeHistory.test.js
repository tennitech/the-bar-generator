const { createController } = require('../js/utils/randomizeHistory');

function fixture() {
  let current = { controls: { style: 'circles', density: '35', inactiveText: '0.123456789', loop: false }, runtime: { seed: 12345, phase: 0.75, time: 12 } };
  let restoring = false;
  const changes = jest.fn();
  let history;
  const restore = jest.fn(value => { current = value; history.clear(); });
  history = createController({ capture: () => current, restore, onChange: changes, isRestoring: () => restoring });
  return { history, restore, changes, get: () => current, set: value => { current = value; }, restoring: value => { restoring = value; } };
}

test('Undo restores exact configuration, inactive values, seed, phase and time', () => {
  const f = fixture(), previous = structuredClone(f.get());
  f.history.randomize('circles', () => { f.get().runtime.seed = 999; f.get().controls.density = '80'; f.history.clear(); });
  expect(f.history.canUndo('circles')).toBe(true);
  expect(f.history.undo('circles')).toBe(true);
  expect(f.get()).toEqual(previous);
  expect(f.history.canUndo('circles')).toBe(false);
  expect(f.history.undo('circles')).toBe(false);
});

test('repeated randomize replaces the undo slot with the immediately preceding variation', () => {
  const f = fixture();
  f.history.randomize('circles', () => { f.get().runtime.seed = 111; });
  f.history.randomize('circles', () => { f.get().runtime.seed = 222; });
  f.history.undo('circles');
  expect(f.get().runtime.seed).toBe(111);
});

test('a subsequent edit or navigation expires Undo and another style cannot use it', () => {
  const f = fixture();
  f.history.randomize('circles', () => {});
  expect(f.history.undo('ruler')).toBe(false);
  expect(f.restore).not.toHaveBeenCalled();
  f.history.clear();
  expect(f.history.canUndo('circles')).toBe(false);
});

test('restoration events do not expire a pending snapshot; explicit clear afterward does', () => {
  const f = fixture();
  f.history.randomize('circles', () => {});
  f.restoring(true); f.history.clear();
  expect(f.history.canUndo('circles')).toBe(true);
  f.restoring(false); f.history.clear();
  expect(f.history.canUndo('circles')).toBe(false);
});

test('a failed restoration retains an independent snapshot for retry', () => {
  let current = { controls: { count: 5 }, runtime: { seed: 10 } };
  const restore = jest.fn(value => { value.runtime.seed = 0; throw new Error('temporary'); });
  const h = createController({ capture: () => current, restore });
  h.randomize('grid', () => { current.controls.count = 9; });
  expect(() => h.undo('grid')).toThrow('temporary');
  expect(h.canUndo('grid')).toBe(true);
  restore.mockImplementation(value => { current = value; });
  h.undo('grid');
  expect(current).toEqual({ controls: { count: 5 }, runtime: { seed: 10 } });
});

test('failed randomization leaves no misleading undo and later actions still work', () => {
  const f = fixture();
  expect(() => f.history.randomize('circles', () => { throw new Error('failed'); })).toThrow('failed');
  expect(f.history.canUndo('circles')).toBe(false);
  f.history.randomize('circles', () => {});
  expect(f.history.canUndo('circles')).toBe(true);
});
