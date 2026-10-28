const vm = require('node:vm');
const fs = require('node:fs');
const pattern = require('../js/utils/barPattern');
const routes = require('../js/utils/generatorRoutes');
const theme = require('../js/utils/themeMode');
const loopingGifUtils = require('../js/utils/loopingGif');
function read(search, pathname = '/generator/waveform/') {
  const window = {location:{search,pathname},GeneratorRoutes:routes,loopingGifUtils};
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
  expect(state.waveformEnvelope).toBe('true');
  expect(state.waveformEnvelopeWaves).toBe(10);
  expect(state.waveformSpeed).toBe(1);
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
