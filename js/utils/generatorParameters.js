/* Canonical legacy query parser, shared by initial chrome and renderer setup. */
(function (window) {
function migrateTriangleDirection(direction, variant) {
  const normalized = normalizeTrianglePatternDirection(direction);
  return Number(variant) === 2
    ? { 'down-right': 'up-left', 'up-left': 'down-right', 'up-right': 'down-left', 'down-left': 'up-right' }[normalized]
    : normalized;
}
function read() {
  const params = new URLSearchParams(window.location.search);
  const routeStyle = window.GeneratorRoutes
    ? window.GeneratorRoutes.getGeneratorRouteStyleFromPathname(window.location.pathname)
    : window.__RPI_GENERATOR_ROUTE_STYLE__;
  const style = window.GeneratorRoutes.normalizeStyleValue(routeStyle || params.get('style') || 'solid');
  const requestedColorMode = (window.GeneratorInitialState
    ? window.GeneratorInitialState.resolveTheme(window.location.search, style)
    : normalizeColorModeValue(params.get('colorMode') || DEFAULT_COLOR_MODE));
  const colorMode = style === 'lunar' || requestedColorMode !== 'lunar'
    ? requestedColorMode
    : DEFAULT_COLOR_MODE;

  const neural = normalizeNeuralNetworkSettings({
    hiddenLayers: params.get('neuralNetworkHiddenLayers'), units: params.get('neuralNetworkUnits'),
    input: params.get('neuralNetworkInput'), seed: params.get('neuralNetworkSeed'),
    connectivity: params.get('neuralNetworkConnectivity'), activation: params.get('neuralNetworkActivation')
  });

  const triangleGrid = normalizeTriangleGridSettings(Object.fromEntries(
    ['variant', 'rows', 'density', 'stroke', 'stagger'].map(key => [key, params.get(`triangleGrid${key[0].toUpperCase()}${key.slice(1)}`)])));

  const circlesGradient = normalizeCirclesGradientSettings(Object.fromEntries(
    ['variant', 'columns', 'rows', 'size', 'contrast', 'stagger', 'reverse'].map(key => [key, params.get(`circlesGradient${key[0].toUpperCase()}${key.slice(1)}`)])));

  const truss = normalizeTrussSettings({ family: params.get('trussFamily'), segments: params.get('trussSegments'),
    thickness: params.get('trussThickness'), depth: params.get('trussDepth') });

  return {
    style,
    colorMode,

    nucleotideSequence: window.NucleotidePattern.normalize(params.has('nucleotideSequence') ? params.get('nucleotideSequence') : window.NucleotidePattern.DEFAULT_SEQUENCE),
    nucleotideVariant: params.get('nucleotideVariant') === 'backbone' ? 'backbone' : 'separate',

    // Binary parameters
    binaryText: normalizeBinaryText(params.get('binaryText') || 'RPI'),

    // Numeric parameters
    ...window.NumericControls.readQuery(params),
    numericMode: params.get('numericMode') || 'dotmatrix',
    ...Object.fromEntries(Object.entries(circlesGradient).map(([key, value]) => [`circlesGradient${key[0].toUpperCase()}${key.slice(1)}`, value])),
    gradientSpeed: window.loopingGifUtils.normalizeLoopSpeed('gradient', params.get('gradientSpeed')),
    gradientReverse: params.get('gradientReverse') === 'true',
    gradientVariant: Math.max(1, Math.min(2, parseInt(params.get('gradientVariant')) || 1)),
    gridVariant: Math.max(1, Math.min(3, parseInt(params.get('gridVariant')) || 1)),

    // Reference pattern parameters
    linesVariant: Math.max(1, Math.min(2, parseInt(params.get('linesVariant')) || 2)),
    pointConnectVariant: Math.max(1, Math.min(2, parseInt(params.get('pointConnectVariant')) || 1)),
    neuralNetworkHiddenLayers: neural.hiddenLayers,
    neuralNetworkUnits: neural.units,
    neuralNetworkInput: neural.input,
    neuralNetworkSeed: neural.seed,
    neuralNetworkConnectivity: neural.connectivity,
    neuralNetworkActivation: neural.activation,
    ...Object.fromEntries(Object.entries(triangleGrid).map(([key, value]) => [`triangleGrid${key[0].toUpperCase()}${key.slice(1)}`, value])),
    trianglesDirection: migrateTriangleDirection(params.get('trianglesDirection'), params.get('trianglesVariant')),
    trianglesCount: normalizeTrianglesPatternSettings({ count: params.has('trianglesCount') ? params.get('trianglesCount') : undefined }).count,

    // Ruler parameters
    rulerRepeats: window.RulerScale.normalizeUnits(params.get('rulerRepeats')),
    rulerUnits: window.RulerScale.normalizeDivisions(params.get('rulerUnits')),
    rulerThickness: window.RulerScale.normalizeThickness(params.get('rulerThickness')),

    // Ticker parameters
    tickerRepeats: parseInt(params.get('tickerRepeats')) || 34,
    tickerRatio: parseInt(params.get('tickerRatio')) || 2,
    tickerWidthRatio: parseInt(params.get('tickerWidthRatio')) || 2,
    tickerSpeed: window.loopingGifUtils.normalizeLoopSpeed('ticker', params.get('tickerSpeed')),
    tickerReverse: params.get('tickerReverse') === 'true',

    // Waveform parameters
    waveformType: parseFloat(params.get('waveformType')) || 0,
    waveformNote: params.has('waveformNote') ? window.WaveformNotes.normalize(params.get('waveformNote'))
      : window.WaveformNotes.fromLegacy(params.get('waveformFrequency')),
    waveformSpeed: window.loopingGifUtils.normalizeLoopSpeed('waveform', params.get('waveformSpeed')),
    waveformReverse: params.get('waveformReverse') === 'true',


    // Circles parameters
    circlesFill: params.get('circlesFill') || 'stroke',
    circlesDensity: parseInt(params.get('circlesDensity')) || 50,
    circlesSizeVariation: parseInt(params.get('circlesSizeVariation')) || 0,

    // Truss parameters
    trussFamily: truss.family,
    trussSegments: truss.segments,
    trussThickness: truss.thickness,
    trussDepth: truss.depth,

    // Staff parameters
    staffNotes: window.MusicStyle.serialize(params.has('staffNotes') ? params.get('staffNotes') : window.MusicStyle.presets.rise),
    staffTempo: Math.max(60, Math.min(240, Math.round(Number(params.get('staffTempo')) || 120))),
    staffInstrument: ['piano', 'synth', 'marimba'].includes(params.get('staffInstrument')) ? params.get('staffInstrument') : 'piano',
    staffNoteShape: normalizeMusicNoteShape(params.get('staffNoteShape') || 'square'),
    staffReverb: params.get('staffReverb') === 'true',
    staffTremolo: params.get('staffTremolo') === 'true',

    // Pulse parameters
    pulseText: params.get('pulseText') || 'RPI',
    pulseIntensity: parseFloat(params.get('pulseIntensity')) || 5,

    // Graph parameters
    graphText: params.get('graphText') || 'RPI',
    graphText2: params.get('graphText2') || '',
    graphText3: params.get('graphText3') || '',
    graphText4: params.get('graphText4') || '',
    graphText5: params.get('graphText5') || '',
    graphMulti: params.get('graphMulti') === 'true',
    graphScale: Math.max(4, parseInt(params.get('graphScale')) || 10),

    // Additional parameters
    morseText: normalizeBinaryText(params.has('morseText') ? params.get('morseText') : 'RPI')
  };
}

  window.GeneratorParameters = { read };
})(window);
