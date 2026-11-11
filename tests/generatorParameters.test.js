const vm = require('node:vm');
const fs = require('node:fs');
const pattern = require('../js/utils/barPattern');
const routes = require('../js/utils/generatorRoutes');
const theme = require('../js/utils/themeMode');
const loopingGifUtils = require('../js/utils/loopingGif');
function read(search, pathname = '/generator/waveform/') {
  const window = {NucleotidePattern:require('../js/utils/nucleotidePattern'),location:{search,pathname},GeneratorRoutes:routes,loopingGifUtils,RulerScale:require('../js/utils/rulerScale'),NumericControls:require('../js/utils/numericControls')};
  window.GeneratorInitialState = {resolveTheme: query => theme.normalizeColorModeValue(new URLSearchParams(query).get('colorMode'))};
  const context = vm.createContext({window,URLSearchParams,...pattern});
  vm.runInContext(fs.readFileSync(require.resolve('../js/utils/musicStyle'),'utf8'),context);
  context.normalizeMusicNoteShape = window.normalizeMusicNoteShape;
  vm.runInContext(fs.readFileSync(require.resolve('../js/utils/generatorParameters'),'utf8'),context);
  return window.GeneratorParameters.read();
}
test('startup and runtime share query precedence, typed controls and existing normalization', () => {
  const state = read('?style=solid&colorMode=white&waveformEnvelope=true&waveformEnvelopeWaves=99&waveformSpeed=999');
  expect(state.style).toBe('waveform');
  expect(state.colorMode).toBe('white');
  expect(state.waveformEnvelope).toBeUndefined();
  expect(state.waveformEnvelopeWaves).toBeUndefined();
  expect(state.waveformSpeed).toBe(1.2);
  expect(read('?trianglesDirection=up&trianglesCount=99','/generator/triangles/').trianglesDirection).toBe('up-right');
  expect(read('?trussFamily=pratt','/generator/truss/').trussFamily).toBe('queen-post');
});

test('legacy triangle variant folds into direction without exposing a variant parameter', () => {
  const opposites = { 'down-right': 'up-left', 'up-right': 'down-left', 'up-left': 'down-right', 'down-left': 'up-right' };
  for (const [direction, expected] of Object.entries(opposites)) {
    const state = read(`?trianglesVariant=2&trianglesDirection=${direction}`, '/generator/triangles/');
    expect(state.trianglesDirection).toBe(expected);
    expect(state.trianglesVariant).toBeUndefined();
  }
});


test('Numeric query modes migrate historical expressions and retain decimal drafts', () => {
  expect(read('?numericValue=PI','/generator/numeric/').numericSource).toBe('formula');
  expect(read('?numericValue=PI','/generator/numeric/').numericFormula).toBe('pi');
  expect(read('?numericValue=2%2B3','/generator/numeric/').numericValue).toBe('5');
  const source = read('?numericSource=values&numericValue=&numericFormula=rms','/generator/numeric/');
  expect(source.numericValue).toBe('');
  expect(source.numericSource).toBe('values');
  expect(source.numericFormula).toBe('rms');
  expect(read('?numericSource=formula&numericFormula=bad','/generator/numeric/').numericFormula).toBe('pi');
});

test('Neural Network query state retains zero input, bounds model controls and preserves explicit legacy layers', () => {
  expect(read('?neuralNetworkHiddenLayers=1', '/generator/neural-network/')).toMatchObject({ neuralNetworkHiddenLayers: 1,
    neuralNetworkUnits: 3, neuralNetworkInput: 65, neuralNetworkSeed: 1, neuralNetworkConnectivity: 'dense', neuralNetworkActivation: 'tanh' });
  expect(read('?neuralNetworkHiddenLayers=99&neuralNetworkUnits=99&neuralNetworkInput=0&neuralNetworkSeed=99&neuralNetworkConnectivity=local&neuralNetworkActivation=sigmoid', '/generator/neural-network/')).toMatchObject({
    neuralNetworkHiddenLayers: 5, neuralNetworkUnits: 5, neuralNetworkInput: 0, neuralNetworkSeed: 16, neuralNetworkConnectivity: 'local', neuralNetworkActivation: 'sigmoid' });
});


test('Ruler query controls share the conventional scale normalizer', () => {
  expect(read('', '/generator/ruler/')).toMatchObject({rulerRepeats:10,rulerUnits:10});
  expect(read('?rulerRepeats=1&rulerUnits=16','/generator/ruler/')).toMatchObject({rulerRepeats:1,rulerUnits:16});
  expect(read('?rulerRepeats=99&rulerUnits=6','/generator/ruler/')).toMatchObject({rulerRepeats:20,rulerUnits:8});
  expect(read('?rulerRepeats=-1&rulerUnits=99','/generator/ruler/')).toMatchObject({rulerRepeats:10,rulerUnits:10});
});

test('ruler thickness restores with bounds and obsolete motion query keys are ignored', () => {
  expect(read('?rulerThickness=2.4&rulerSpeed=5&rulerReverse=true', '/generator/ruler/')).toMatchObject({rulerThickness:2.4});
  expect(read('?rulerThickness=99', '/generator/ruler/').rulerThickness).toBe(3);
  expect(read('?rulerSpeed=5', '/generator/ruler/').rulerSpeed).toBeUndefined();
});

test('triangle grid legacy and custom queries restore bounded settings',()=>{
  expect(read('?triangleGridVariant=3','/generator/triangle-grid/')).toMatchObject({triangleGridVariant:3,triangleGridRows:4,triangleGridDensity:100,triangleGridStroke:100,triangleGridStagger:50});
  expect(read('?triangleGridRows=99&triangleGridDensity=50&triangleGridStroke=0&triangleGridStagger=0','/generator/triangle-grid/')).toMatchObject({triangleGridRows:6,triangleGridDensity:50,triangleGridStroke:40,triangleGridStagger:0});
});

test('circle gradient URLs restore preset defaults and customized numeric controls', () => {
  expect(read('?circlesGradientVariant=2', '/generator/circles-gradient/')).toMatchObject({circlesGradientVariant:2,circlesGradientColumns:24,circlesGradientRows:2,circlesGradientStagger:0});
  expect(read('?circlesGradientColumns=48&circlesGradientRows=5&circlesGradientSize=25&circlesGradientContrast=0&circlesGradientStagger=0&circlesGradientReverse=true', '/generator/circles-gradient/')).toMatchObject({circlesGradientColumns:48,circlesGradientRows:5,circlesGradientSize:25,circlesGradientContrast:0,circlesGradientStagger:0,circlesGradientReverse:true});
});


test('Gradient retains historical variants and normalizes motion parameters', () => {
  expect(read('?gradientVariant=2', '/generator/gradient/')).toMatchObject({gradientVariant:2,gradientSpeed:0.1,gradientReverse:false});
  expect(read('?gradientVariant=2&gradientSpeed=999&gradientReverse=true', '/generator/gradient/')).toMatchObject({gradientVariant:2,gradientSpeed:0.4,gradientReverse:true});
  expect(read('?gradientSpeed=bad', '/generator/gradient/').gradientSpeed).toBe(0.1);
});

test('retired LFO query fields are ignored while carrier and motion settings survive', () => {
  const state = read('?waveformType=2.5&waveformFrequency=70&waveformSpeed=.6&waveformReverse=true&waveformLfo=true&waveformLfoRate=.07&waveformLfoType=1.25&waveformLfoDepth=100');
  expect(state).toMatchObject({waveformType:2.5,waveformFrequency:70,waveformSpeed:.6,waveformReverse:true});
  for(const key of ['waveformLfo','waveformLfoRate','waveformLfoDepth','waveformLfoType']) expect(state).not.toHaveProperty(key);
});
