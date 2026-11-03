const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
const functions = source.slice(source.indexOf('function cancelSliderValueEditor('), source.indexOf('function activateSliderValueEditor('));
function fixture() {
  const context = { parseSliderNumericInput: Number, normalizeSliderValue: (_, value) => String(value) };
  vm.runInNewContext(functions, context);
  const config = { display: { parentElement: { classList: { remove: jest.fn() } }, removeAttribute: jest.fn() },
    slider: { value: '10' }, refreshDisplay: jest.fn(), commit: jest.fn() };
  config.editorInput = { value: '18', remove: jest.fn(() => context.commitSliderValueEditor(config)) };
  return { context, config };
}

test('Escape removal cannot commit through a synchronous blur', () => {
  const { context, config } = fixture();
  context.cancelSliderValueEditor(config);
  expect(config.slider.value).toBe('10');
  expect(config.commit).not.toHaveBeenCalled();
  expect(config.editorInput).toBeNull();
  expect(config.refreshDisplay).toHaveBeenCalledTimes(1);
});

test('committing a focused editor cannot re-enter through removal blur', () => {
  const { context, config } = fixture();
  context.commitSliderValueEditor(config);
  expect(config.slider.value).toBe('18');
  expect(config.commit).toHaveBeenCalledTimes(1);
  expect(config.editorInput).toBeNull();
});
