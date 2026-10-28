/* Still, default-parameter samples rendered with the shared export geometry.
   Samples describe the family; they do not mutate or animate the current mark. */
(function (scope) {
  const shaders = { ruler: 1, ticker: 2, binary: 3, waveform: 4, circles: 5,
    numeric: 6, morse: 7, runway: 8, lines: 13, 'point-connect': 14,
    'triangle-grid': 15, 'circles-gradient': 16, gradient: 17, grid: 18,
    triangles: 19, 'fibonacci-sequence': 20, union: 21, 'wave-quantum': 22,
    'neural-network': 23, lunar: 24 };
  function sample(style) {
    if (style === 'solid') return '<rect width="250" height="18" fill="currentColor"/>';
    if (!Object.hasOwn(shaders, style)) return '';
    const values = { timeSeconds: 0, loopOffsetX: 0, quantumPhase: 0,
      rulerRepeats: 10, rulerUnits: 4, tickerRepeats: 34, tickerRatio: 2, tickerWidthRatio: 2,
      waveformType: 0, waveformFrequency: 24, waveformSpeed: .3, waveformPoints: 750,
      circlesDensity: 50, circlesSizeVariation: 0, circlesFill: 'stroke',
      binaryText: 'RPI', morseText: 'RPI', numericMode: 'dotmatrix',
      linesVariant: 2, triangleGridVariant: 2, trianglesCount: 14, trianglesDirection: 'down-right' };
    return scope.createBarPatternSVG({ currentShader: shaders[style], currentColorMode: 'black',
      barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18, fgColor: 'currentColor', values,
      textToBinary: scope.textToBinary, textToMorse: scope.textToMorse,
      parseNumericString: scope.parseNumericString,
      generateStaticPackedCircles: scope.generateStaticPackedCircles });
  }
  function decorate(row, select, option) {
    const isStyle = select.id === 'style-select';
    const isDirection = select.id === 'triangles-direction-select';
    if ((!isStyle && !isDirection) || option.disabled) return;
    const visual = document.createElement('span');
    visual.className = isStyle ? 'select_style-preview' : 'select_direction-arrow';
    visual.setAttribute('aria-hidden', 'true');
    if (isStyle && option.value === 'lunar') {
      visual.classList.add('is-artemis');
    } else if (isStyle) {
      const markup = sample(option.value);
      if (!markup) return;
      // Isolate fragment IDs so samples cannot collide with header/export SVGs.
      const prefix = `sample-${option.value}-`;
      const isolated = markup.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
        .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`);
      visual.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 18" focusable="false">${isolated}</svg>`;
    } else {
      const transforms = { 'down-right': '', 'up-right': 'translate(0 24) scale(1 -1)',
        'up-left': 'translate(24 24) scale(-1 -1)', 'down-left': 'translate(24 0) scale(-1 1)' };
      visual.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><g transform="${transforms[option.value] || ''}"><path d="M5 5 19 19M5 19h14V5"/></g></svg>`;
    }
    row.classList.add('select_visual-option');
    row.appendChild(visual);
  }
  scope.SelectorPreviews = { decorate };
})(window);
