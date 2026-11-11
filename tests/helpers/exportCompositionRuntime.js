// Source-level fixture: real pattern/export code with controlled current values.
// It does not simulate layout, browser activation or an operating-system clipboard.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(base, file), 'utf8');
const main = read('js/main.js');
const shaders = { solid: 0, ruler: 1, ticker: 2, binary: 3, waveform: 4, circles: 5,
  numeric: 6, morse: 7, runway: 8, lines: 13, 'point-connect': 14, 'triangle-grid': 15,
  'circles-gradient': 16, gradient: 17, grid: 18, triangles: 19, 'fibonacci-sequence': 20,
  union: 21, 'wave-quantum': 22, 'neural-network': 23, lunar: 24, nucleotide: 25 };
function createRuntime(overrides = {}) {
  const state = { composition: 'logo', size: 'large', title: 'Test <bar> & RPI',
    values: { numericValue: '3.14159265', numericMode: 'height', binaryText: 'RPI', morseText: 'RPI',
      circlesDensity: 10, circlesSizeVariation: 30, circlesFill: 'stroke', waveformType: 0,
      waveformFrequency: 17, waveformSpeed: 0.3, waveformPoints: 750,
      tickerRepeats: 17, tickerRatio: 3, tickerWidthRatio: 2, tickerSpeed: 0.4,
      trianglesDirection: 'up-left', trianglesCount: 23, gradientVariant: 2, gradientSpeed: 0.1,
      circlesGradientVariant: 3, gridVariant: 2, linesVariant: 2, triangleGridVariant: 2,
      nucleotideSequence: 'ATGGTGATGGTGATGGTGATGGTGATGGTG', nucleotideVariant: 'backbone',
      neuralNetworkSeed: 7, neuralNetworkUnits: 9, neuralNetworkHiddenLayers: 2 } };
  const r = { state, console: { ...console, log() {} }, TextEncoder, TextDecoder, Blob, DOMException,
    AbortController, performance, setTimeout, clearTimeout, sharePatternSeed: 1,
    RPI_LOGO_GEOMETRY: require('../../js/utils/logoGeometry').RPI_LOGO_GEOMETRY,
    clipBarSVG: require('../../js/utils/logoGeometry').clipBarSVG,
    REFERENCE_WIDTH: 250, REFERENCE_BAR_HEIGHT: 18, REFERENCE_BAR_Y: 132.4885,
    currentShader: 0, currentColorMode: 'black', styleSelect: { value: 'solid' },
    themeModeUtils: require('../../js/utils/themeMode'),
    logoExportOptions: require('../../js/utils/exportOptions'),
    logoExportUI: { size: () => state.size, composition: () => state.composition },
    barShareController: { getName: () => state.title },
    BarShareState: require('../../js/utils/shareState'),
    RulerScale: require('../../js/utils/rulerScale'),
    NumericControls: require('../../js/utils/numericControls'),
    NucleotidePattern: require('../../js/utils/nucleotidePattern'),
    quantumModel: require('../../js/utils/quantumModel'),
    sanitizeBarText: require('../../js/utils/profanityFilter').sanitizeText,
    document: { querySelector: selector => selector === '#style-select' ? r.styleSelect
      : selector === '#nucleotide-input' ? { value: state.values.nucleotideSequence } : null },
    normalizeStyleValue: value => value,
    getCurrentBarPatternValues: () => state.values,
    getLoopRuntimeValues: () => ({ loopOffsetX: 42, timeSeconds: 98, quantumPhase: 0.7 }),
    parseNumericString: value => r.NumericControls.digits(value), ...overrides };
  r.window = r;
  vm.createContext(r);
  const run = source => vm.runInContext(source, r);
  run(main.slice(main.indexOf('const colors ='), main.indexOf('function padCounterValue(')));
  run(read('js/utils/lunarBarAsset.js'));
  run(read('js/utils/barPattern.js'));
  run(main.slice(main.indexOf('const MORSE_DICT'), main.indexOf('// Viewport & Playback State')));
  run(main.slice(main.indexOf('function textToBinary('), main.indexOf('// Numeric inputs are validated')));
  run(main.slice(main.indexOf('function getSharePatternRandom('), main.indexOf('function setupShareLinks(')));
  run(main.slice(main.indexOf('function calculatePhaseParameters('), main.indexOf('// Audio functions')));
  run(read('js/drawing.js'));
  run(main.slice(main.indexOf('function buildCurrentBarPatternSVGFragment('), main.indexOf('function buildCurrentBarOnlySVG(')));
  r.select = family => { r.currentShader = shaders[family]; r.styleSelect.value = family; };
  return r;
}
module.exports = { createRuntime, shaders, read, base };
