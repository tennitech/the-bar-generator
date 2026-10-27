/* Canonical legacy query parser, shared by initial chrome and renderer setup. */
(function (window) {
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

  return {
    style,
    colorMode,

    // Binary parameters
    binaryText: params.get('binaryText') || 'RPI',

    // Numeric parameters
    numericValue: params.get('numericValue') || '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679',
    numericMode: params.get('numericMode') || 'dotmatrix',
    circlesGradientVariant: Math.max(1, Math.min(3, parseInt(params.get('circlesGradientVariant')) || 1)),
    gradientVariant: Math.max(1, Math.min(2, parseInt(params.get('gradientVariant')) || 1)),
    gridVariant: Math.max(1, Math.min(3, parseInt(params.get('gridVariant')) || 1)),

    // Reference pattern parameters
    linesVariant: Math.max(1, Math.min(2, parseInt(params.get('linesVariant')) || 2)),
    pointConnectVariant: Math.max(1, Math.min(2, parseInt(params.get('pointConnectVariant')) || 1)),
    neuralNetworkHiddenLayers: Math.max(1, Math.min(5, parseInt(params.get('neuralNetworkHiddenLayers')) || 1)),
    triangleGridVariant: Math.max(1, Math.min(3, parseInt(params.get('triangleGridVariant')) || 2)),
    trianglesVariant: Math.max(1, Math.min(2, parseInt(params.get('trianglesVariant')) || 1)),
    trianglesDirection: normalizeTrianglePatternDirection(params.get('trianglesDirection')),
    trianglesCount: normalizeTrianglesPatternSettings({ count: params.has('trianglesCount') ? params.get('trianglesCount') : undefined }).count,

    // Ruler parameters
    rulerRepeats: parseInt(params.get('rulerRepeats')) || 10,
    rulerUnits: parseInt(params.get('rulerUnits')) || 4,
    rulerSpeed: window.loopingGifUtils.normalizeLoopSpeed('ruler', params.get('rulerSpeed')),
    rulerReverse: params.get('rulerReverse') === 'true',

    // Ticker parameters
    tickerRepeats: parseInt(params.get('tickerRepeats')) || 34,
    tickerRatio: parseInt(params.get('tickerRatio')) || 2,
    tickerWidthRatio: parseInt(params.get('tickerWidthRatio')) || 2,
    tickerSpeed: window.loopingGifUtils.normalizeLoopSpeed('ticker', params.get('tickerSpeed')),
    tickerReverse: params.get('tickerReverse') === 'true',

    // Waveform parameters
    waveformType: parseFloat(params.get('waveformType')) || 0,
    waveformFrequency: parseInt(params.get('waveformFrequency')) || 24,
    waveformSpeed: window.loopingGifUtils.normalizeLoopSpeed('waveform', params.get('waveformSpeed')),
    waveformReverse: params.get('waveformReverse') === 'true',

    waveformEnvelope: params.get('waveformEnvelope') || 'false',
    waveformEnvelopeType: params.get('waveformEnvelopeType') || 'sine',
    waveformEnvelopeWaves: typeof normalizeWaveformEnvelopeWaves === 'function'
      ? normalizeWaveformEnvelopeWaves(params.get('waveformEnvelopeWaves'))
      : Math.max(1, Math.min(10, Math.round(parseFloat(params.get('waveformEnvelopeWaves'))) || 1)),
    waveformEnvelopeCenter: typeof normalizeWaveformEnvelopeCenter === 'function'
      ? normalizeWaveformEnvelopeCenter(params.get('waveformEnvelopeCenter'))
      : Math.max(-0.5, Math.min(0.5, parseFloat(params.get('waveformEnvelopeCenter')) || 0)),
    waveformEnvelopeBipolar: params.get('waveformEnvelopeBipolar') || 'false',

    // Circles parameters
    circlesFill: params.get('circlesFill') || 'stroke',
    circlesDensity: parseInt(params.get('circlesDensity')) || 50,
    circlesSizeVariation: parseInt(params.get('circlesSizeVariation')) || 0,

    // Truss parameters
    trussFamily: normalizeTrussFamily(params.get('trussFamily') || 'flat'),
    trussSegments: parseInt(params.get('trussSegments')) || 15,
    trussThickness: parseFloat(params.get('trussThickness')) || 2,

    // Staff parameters
    staffNotes: params.get('staffNotes') || '',
    staffTempo: parseInt(params.get('staffTempo')) || 120,
    staffInstrument: params.get('staffInstrument') || 'piano',
    staffNoteShape: normalizeMusicNoteShape(params.get('staffNoteShape') || 'circle'),
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
    morseText: params.has('morseText') ? params.get('morseText') : 'RPI'
  };
}

  window.GeneratorParameters = { read };
})(window);
