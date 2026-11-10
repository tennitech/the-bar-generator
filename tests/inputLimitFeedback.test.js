const feedback = require('../js/utils/inputLimitFeedback');
const fs = require('node:fs');
const vm = require('node:vm');
function field(value = 'abcdefghij', codePoints = '10', maxLength = 20) {
  const handlers = {}, classes = new Set(), notes = [];
  const attrs = { 'aria-describedby': 'existing-hint' };
  const control = { appendChild: note => notes.push(note) };
  const input = { value, dataset: { maxCodePoints: codePoints }, maxLength,
    selectionStart: value.length, selectionEnd: value.length,
    ownerDocument: { createElement: () => ({ textContent: '', setAttribute: jest.fn(), remove: jest.fn() }) },
    closest: () => control, getAttribute: key => attrs[key], setAttribute: (key, val) => { attrs[key] = val; },
    classList: { add: key => classes.add(key), remove: key => classes.delete(key) },
    addEventListener: (key, handler) => { handlers[key] = handler; } };
  feedback.bindLength(input);
  return { input, handlers, classes, notes, attrs };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
test.each([[1,1,20,''], [20,1,20,''], [0,1,20,'Use'], [21,1,20,'Use'], [.2,.2,4,''], [4,.2,4,''], [4.1,.2,4,'Use'], [NaN,1,20,'']])('range attempt %s in %s–%s', (value,min,max,result) => {
  expect(feedback.rangeMessage(value,min,max).startsWith(result)).toBe(true);
  if (!result) expect(feedback.rangeMessage(value,min,max)).toBe('');
});
test('full Unicode count allows selection replacement and ignores navigation/shortcuts', () => {
  const state = field('😀'.repeat(10));
  state.handlers.keydown({ key: 'ArrowRight' });
  state.handlers.keydown({ key: 'a', ctrlKey: true });
  state.input.selectionStart = 18;
  state.handlers.beforeinput({ inputType: 'insertText', data: '😀' });
  expect(state.notes).toHaveLength(0);
  state.input.selectionStart = 20;
  state.handlers.beforeinput({ inputType: 'insertText', data: '😀' });
  expect(state.notes[0].textContent).toContain('10-character limit');
  expect(state.input.value).toBe('😀'.repeat(10));
  expect(state.attrs['aria-describedby']).toContain('existing-hint input-limit-');
});
test('paste is measured before native truncation; exact fit is quiet', () => {
  const state = field('abc');
  state.handlers.paste({ clipboardData: { getData: () => '1234567' } });
  expect(state.notes).toHaveLength(0);
  state.handlers.paste({ clipboardData: { getData: () => '12345678' } });
  expect(state.classes.has('is-input-limit')).toBe(true);
  expect(state.input.value).toBe('abc');
});
test('native length controls cover Numeric and report fields without changing their validation', () => {
  const state = field('1'.repeat(100), '', 100);
  state.handlers.keydown({ key: '2' });
  expect(state.notes[0].textContent).toContain('100-character limit');
  expect(state.input.value).toHaveLength(100);
  expect(state.attrs['aria-invalid']).toBeUndefined();
});
test('repeated attempts renew visual feedback, reuse the notice and expire without focus changes', () => {
  const state = field();
  state.handlers.keydown({ key: 'x' });
  jest.advanceTimersByTime(600);
  state.handlers.keydown({ key: 'x' });
  jest.advanceTimersByTime(100);
  expect(state.classes.has('is-input-limit')).toBe(true);
  expect(state.notes).toHaveLength(1);
  jest.advanceTimersByTime(550);
  expect(state.classes.has('is-input-limit')).toBe(false);
  expect(state.notes[0].textContent).toContain('10-character');
  jest.advanceTimersByTime(3350);
  expect(state.notes[0].textContent).toBe('');
  state.handlers.keydown({ key: 'x' });
  state.handlers.blur();
  expect(state.classes.has('is-input-limit')).toBe(false);
  expect(state.notes[0].textContent).toBe('');
});
test('input fallback detects overflow and composition drafts are left to validators', () => {
  const state = field();
  state.input.value += 'x';
  state.handlers.input({ isComposing: true });
  expect(state.notes).toHaveLength(0);
  state.handlers.input({ isComposing: false });
  expect(state.notes).toHaveLength(1);
  feedback.dispose(state.input);
  expect(state.notes[0].remove).toHaveBeenCalled();
});
test('inline editor feedback reads true multiplier bounds and the width ratio last token', () => {
  const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
  const parse = source.slice(source.indexOf('function parseSliderNumericInput('), source.indexOf('function normalizeSliderValue('));
  const limit = source.slice(source.indexOf('function sliderEditorLimit('), source.indexOf('function commitSliderValueEditor('));
  const context = { window: { InputLimitFeedback: feedback } };
  vm.runInNewContext(parse + limit, context);
  expect(context.sliderEditorLimit({slider:{min:'.08',max:'1.6'},editorMin:.2,editorMax:4}, '4×')).toBe('');
  expect(context.sliderEditorLimit({slider:{min:'.08',max:'1.6'},editorMin:.2,editorMax:4}, '4.1×')).toContain('0.2 to 4');
  expect(context.sliderEditorLimit({slider:{min:'1',max:'3'},limitToken:'last'}, '1:4')).toContain('1 to 3');
  expect(context.sliderEditorLimit({slider:{min:'1',max:'3'},limitToken:'last'}, '1:3')).toBe('');
});
test('shake uses independent translation so the positioned editor keeps its vertical transform, with static reduced-motion feedback', () => {
  const css = fs.readFileSync(require.resolve('../css/style.css'), 'utf8');
  expect(css).toMatch(/@keyframes controlLimitShake[\s\S]*?translate: -2px/);
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.is-input-limit, \.is-input-limit:focus \{ animation: none !important/);
});
