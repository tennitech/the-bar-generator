const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeBinaryText } = require('../js/utils/barPattern');
const { sanitizeText } = require('../js/utils/profanityFilter');
const { normalizeState } = require('../js/utils/shareState');
const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
const context = { normalizeBinaryText, sanitizeBarText: sanitizeText, TextEncoder };
vm.runInNewContext(source.slice(source.indexOf('const MORSE_DICT'), source.indexOf('// Viewport & Playback State')), context);
vm.runInNewContext(source.slice(source.indexOf('function textToBinary('), source.indexOf('// Numeric inputs are validated')), context);

test.each(['textToBinary', 'textToMorse'])('%s rejects profanity and persisted redactions but accepts hello', encoder => {
  for (const value of ['hell', 'f*ck', '****', 'Hi ****']) expect(context[encoder](value)).toEqual([]);
  expect(context[encoder]('hello').length).toBeGreaterThan(0);
  expect(context[encoder]('abcdefghijklm')).toEqual(context[encoder]('abcdefghij'));
});

test('Morse counts input code points before transliteration and preserves timing', () => {
  expect(context.textToMorse('é'.repeat(11))).toEqual(context.textToMorse('e'.repeat(10)));
  expect(context.textToMorse('E E')).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 1]);
});

test('legacy Morse and Binary shares both migrate to ten characters', () => {
  const manifest = { 'binary-input': { type: 'text', maxLength: 10 }, 'morse-input': { type: 'text', maxLength: 10 } };
  const controls = { 'binary-input': '🚀'.repeat(11), 'morse-input': 'abcdefghijklm' };
  expect(normalizeState({ v: 1, controls }, manifest).controls).toEqual({ 'binary-input': '🚀'.repeat(10), 'morse-input': 'abcdefghij' });
});

test('blocked field feedback persists through repeated input and clears on correction', () => {
  const errors = { 'binary-input-error': {}, 'morse-input-error': {} };
  const local = { ...context, document: { getElementById: id => errors[id] } };
  vm.runInNewContext(source.slice(source.indexOf('function updateEncodedTextInput('), source.indexOf('function updateBinaryData(')), local);
  const field = { setAttribute(name, value) { this[name] = value; } };
  local.updateEncodedTextInput(field, 'hell', 'binary');
  expect(field.value).toBe('hell');
  expect(field['aria-invalid']).toBe('true');
  expect(errors['binary-input-error'].textContent).toContain('not allowed');
  local.updateEncodedTextInput(field, field.value, 'binary');
  expect(field['aria-invalid']).toBe('true');
  local.updateEncodedTextInput(field, field.value + 'o', 'binary');
  expect(field['aria-invalid']).toBe('false');
  expect(errors['binary-input-error'].textContent).toBe('');
});
