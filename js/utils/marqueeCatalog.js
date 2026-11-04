/* Current implemented families only. Every still is captured offline from the
   shared preview/export path by scripts/generateMarqueeAssets.js. The homepage
   selects these URLs once; optional live previews reuse shared model utilities
   without importing the generator runtime. */
(function (scope) {
  // Deliberately bounded, real controls, not arbitrary decorative mutations.
  // Fixed-art families retain their sole canonical sample. Circle packing keeps
  // seed 1: that seed is reproducible via plain query links, unlike share hashes.
  const configurations = {
    ruler: ['rulerRepeats=6&rulerUnits=2', 'rulerRepeats=16&rulerUnits=8'],
    ticker: ['tickerRepeats=12&tickerRatio=3&tickerWidthRatio=2', 'tickerRepeats=24&tickerRatio=4&tickerWidthRatio=3'],
    binary: ['binaryText=1824', 'binaryText=WHY+NOT'],
    waveform: ['waveformType=1&waveformFrequency=12', 'waveformType=0&waveformFrequency=36&waveformEnvelope=true&waveformEnvelopeWaves=2'],
    circles: ['circlesFill=fill&circlesDensity=35&circlesSizeVariation=60', 'circlesFill=stroke&circlesDensity=75&circlesSizeVariation=35'],
    numeric: ['numericSource=formula&numericFormula=e&numericMode=dotmatrix', 'numericSource=formula&numericFormula=phi&numericMode=dotmatrix'],
    nucleotide: ['nucleotideVariant=backbone', 'nucleotideSequence=ATGGTGCATCTGACTCCTGAGGAGAAGTCT'],
    morse: ['morseText=1824', 'morseText=WHY+NOT'],
    'circles-gradient': ['circlesGradientVariant=2', 'circlesGradientVariant=3'],
    gradient: ['gradientVariant=2'],
    grid: ['gridVariant=2', 'gridVariant=3'],
    lines: ['linesVariant=1'],
    'point-connect': ['pointConnectVariant=2'],
    'neural-network': ['neuralNetworkHiddenLayers=2&neuralNetworkUnits=4&neuralNetworkSeed=7', 'neuralNetworkHiddenLayers=4&neuralNetworkUnits=5&neuralNetworkSeed=13&neuralNetworkConnectivity=local'],
    'triangle-grid': ['triangleGridVariant=1', 'triangleGridVariant=3'],
    triangles: ['trianglesDirection=up-left&trianglesCount=8', 'trianglesDirection=up-right&trianglesCount=20'],
    'wave-quantum': ['quantumPhase=0.125', 'quantumPhase=0.375']
  };
  const entries = [
    ['solid', 'Solid'], ['ruler', 'Ruler'], ['ticker', 'Ticker'],
    ['binary', 'Binary'], ['waveform', 'Waveform'], ['circles', 'Circles'],
    ['nucleotide', 'Nucleotide'], ['numeric', 'Numeric'], ['morse', 'Morse Code'],
    ['circles-gradient', 'Circles Gradient'], ['gradient', 'Gradient'],
    ['grid', 'Grid'], ['lines', 'Lines'], ['point-connect', 'Point Connect'],
    ['neural-network', 'Neural Network'], ['triangle-grid', 'Triangle Grid'],
    ['triangles', 'Triangles'], ['fibonacci-sequence', 'Fibonacci Sequence'],
    ['union', 'Union'], ['wave-quantum', 'Quantum'],
    ['runway', 'Runway — RPI Flying Club'], ['lunar', 'Artemis II']
  ].map(([value, label]) => {
    const variants = ['', ...(configurations[value] || [])].map((query, variant) => Object.freeze({
      value, label, query, variant,
      path: `assets/images/marquee-bars/${value}${variant ? `-${variant}` : ''}.svg?v=${value === 'ruler' ? '20261103-resting-motion-ruler' : value === 'binary' ? '20261103-binary-seams' : '20261103-configurations'}`
    }));
    return Object.freeze({ ...variants[0], variants: Object.freeze(variants) });
  });
  const samples = Object.freeze(entries.flatMap(entry => entry.variants));
  // Inject randomness for reproducible tests. Independent loads may repeat a
  // sample by chance; no storage, history, timers or background work is needed.
  function selectEntries(random = Math.random) {
    const selected = entries.map(entry => entry.variants[Math.floor(random() * entry.variants.length)]);
    for (let index = selected.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [selected[index], selected[other]] = [selected[other], selected[index]];
    }
    return selected;
  }
  const api = Object.freeze({ entries: Object.freeze(entries), samples, selectEntries });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.MarqueeCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis);
