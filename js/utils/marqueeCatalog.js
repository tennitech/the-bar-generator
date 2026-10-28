/* Current, implemented families only. SVGs are captured from the generator's
   shared preview/export path by scripts/generateMarqueeAssets.js. */
(function (scope) {
  const entries = [
    ['solid', 'Solid'], ['ruler', 'Ruler'], ['ticker', 'Ticker'],
    ['binary', 'Binary'], ['waveform', 'Waveform'], ['circles', 'Circles'],
    ['numeric', 'Numeric'], ['morse', 'Morse Code'],
    ['circles-gradient', 'Circles Gradient'], ['gradient', 'Gradient'],
    ['grid', 'Grid'], ['lines', 'Lines'], ['point-connect', 'Point Connect'],
    ['neural-network', 'Neural Network'], ['triangle-grid', 'Triangle Grid'],
    ['triangles', 'Triangles'], ['fibonacci-sequence', 'Fibonacci Sequence'],
    ['union', 'Union'], ['wave-quantum', 'Quantum'],
    ['runway', 'Runway — RPI Flying Club'], ['lunar', 'Artemis II']
  ].map(([value, label]) => Object.freeze({ value, label,
    path: `assets/images/marquee-bars/${value}.svg?v=20261028` }));
  const api = Object.freeze({ entries: Object.freeze(entries) });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.MarqueeCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis);
