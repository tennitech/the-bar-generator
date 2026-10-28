const numeric = require('../js/utils/numericControls');
const fs = require('node:fs');
const vm = require('node:vm');

test('decimal data retains leading zeros and precision, encodes only digits and point', () => {
  expect(numeric.digits('-001.20')).toEqual([0,0,1,10,2,0]);
  expect(numeric.digits(numeric.DEFAULT_VALUE)).toHaveLength(numeric.DEFAULT_VALUE.length);
  expect(numeric.isValue('9'.repeat(200))).toBe(true);
  for (const value of ['', '-', '+', '.', '-.']) {
    expect(numeric.isDraft(value)).toBe(true);
    expect(numeric.digits(value)).toEqual([]);
  }
  for (const value of ['12abc34', 'PI', '1e3', 'NaN', 'Infinity', '1/0', '1..2', '1,2', '9'.repeat(201), '١٢', '<script>']) {
    expect(numeric.isDraft(value)).toBe(false);
    expect(numeric.digits(value)).toEqual([]);
  }
});

test('all curated sources are finite decimal approximations and source mode is exclusive', () => {
  for (const item of numeric.presets) {
    expect(numeric.isValue(item.value)).toBe(true);
    expect(numeric.resolve({numericSource:'formula',numericFormula:item.id,numericValue:'999'})).toBe(item.value);
    expect(numeric.resolve({numericSource:'values',numericFormula:item.id,numericValue:'001.23'})).toBe('001.23');
  }
  expect(Number(numeric.preset('phi').value) ** 2).toBeCloseTo(Number(numeric.preset('phi').value) + 1, 14);
  expect(Number(numeric.preset('rms').value) ** 2).toBeCloseTo(.5, 14);
  expect(Math.exp(-Number(numeric.preset('half-life').value))).toBeCloseTo(.5, 14);
});

test('historical arithmetic migrates without compiling or executing source text', () => {
  expect(numeric.migrate('Math.PI').numericFormula).toBe('pi');
  expect(numeric.migrate('sqrt(2)').numericFormula).toBe('sqrt2');
  expect(numeric.migrate('000.30').numericValue).toBe('000.30');
  expect(numeric.legacyValue('Math.pow(3,5)')).toBe('243');
  expect(numeric.legacyValue('2^3^2')).toBe('512');
  expect(numeric.legacyValue('1/100000000')).toBe('0.00000001');
  for (const value of ['window.alert(1)', 'constructor.constructor(1)', 'Infinity', '1/0', 'NaN', '(()=>1)()', 'Math.random()', 'a12b', '('.repeat(201)+'1'+')'.repeat(201)]) {
    expect(numeric.legacyValue(value)).toBeNull();
  }
  expect(numeric.migrate('garbage123').numericValue).toBe('');
  expect(fs.readFileSync(require.resolve('../js/main'),'utf8')).not.toMatch(/new Function\(/);
});

test('legacy shares migrate sources; new numeric shares reject text before applying controls', () => {
  const context = {globalThis: {}, NumericControls:numeric, TextEncoder, TextDecoder, btoa, atob};
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/shareState'),'utf8'), context);
  const manifest = {'numeric-input':{type:'text',maxLength:200},'numeric-source-select':{options:['values','formula']},'numeric-formula-select':{options:numeric.presets.map(x=>x.id)}};
  const state = controls => ({v:1,name:'',controls,runtime:{}});
  const restored = context.BarShareState.normalizeState(state({'numeric-input':'Math.PI'}),manifest);
  expect(restored.controls['numeric-source-select']).toBe('formula');
  expect(restored.controls['numeric-formula-select']).toBe('pi');
  expect(() => context.BarShareState.normalizeState(state({'numeric-input':'1abc2','numeric-source-select':'values'}),manifest)).toThrow(/numeric/);
  expect(() => context.BarShareState.normalizeState(state({'numeric-input':'123','numeric-source-select':'formula','numeric-formula-select':'eval'}),manifest)).toThrow(/unavailable/);
});
