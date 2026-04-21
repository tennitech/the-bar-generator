(function (globalScope) {
  const AVAILABLE_STYLE_VALUES = new Set([
    'solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles',
    'numeric', 'morse', 'circles-gradient', 'gradient', 'grid',
    'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles',
    'fibonacci-sequence', 'union', 'wave-quantum',
    'runway', 'lunar', 'truss', 'music', 'graph'
  ]);

  const GENERATOR_QUERY_KEYS = new Set([
    'style',
    'colorMode',
    'binaryText',
    'morseText',
    'numericValue',
    'numericMode',
    'circlesGradientVariant',
    'gradientVariant',
    'gridVariant',
    'linesVariant',
    'pointConnectVariant',
    'neuralNetworkHiddenLayers',
    'triangleGridVariant',
    'trianglesVariant',
    'rulerRepeats',
    'rulerUnits',
    'tickerRepeats',
    'tickerRatio',
    'tickerWidthRatio',
    'waveformType',
    'waveformFrequency',
    'waveformSpeed',
    'waveformEnvelope',
    'waveformEnvelopeType',
    'waveformEnvelopeWaves',
    'waveformEnvelopeCenter',
    'waveformEnvelopeBipolar',
    'circlesMode',
    'circlesFill',
    'circlesDensity',
    'circlesSizeVariation',
    'circlesOverlap',
    'trussFamily',
    'trussSegments',
    'trussThickness',
    'staffNotes',
    'staffTempo',
    'staffInstrument',
    'staffNoteShape',
    'staffReverb',
    'staffTremolo',
    'pulseText',
    'pulseIntensity',
    'graphText',
    'graphText2',
    'graphText3',
    'graphText4',
    'graphText5',
    'graphMulti',
    'graphScale'
  ]);

  function normalizeStyleValue(style) {
    if (style === 'staff') return 'music';
    if (style === 'matrix') return 'solid';
    return AVAILABLE_STYLE_VALUES.has(style) ? style : 'solid';
  }

  function normalizePathname(pathname) {
    const value = typeof pathname === 'string' && pathname ? pathname : '/';
    const normalized = value
      .replace(/\/index\.html$/, '/')
      .replace(/\/{2,}/g, '/');

    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  function toSearchParams(search) {
    if (search instanceof URLSearchParams) {
      return new URLSearchParams(search.toString());
    }

    return new URLSearchParams(typeof search === 'string' ? search.replace(/^\?/, '') : '');
  }

  function getSitePrefixSegments(pathname) {
    const parts = normalizePathname(pathname).split('/').filter(Boolean);
    const generatorIndex = parts.indexOf('generator');

    if (generatorIndex !== -1) {
      return parts.slice(0, generatorIndex);
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart === 'marquee-ui.html' || lastPart === 'index.html') {
      return parts.slice(0, -1);
    }

    return parts;
  }

  function buildPathFromSegments(segments) {
    return segments.length ? `/${segments.join('/')}/` : '/';
  }

  function getGeneratorRouteStyleFromPathname(pathname) {
    const parts = normalizePathname(pathname).split('/').filter(Boolean);
    const generatorIndex = parts.indexOf('generator');

    if (generatorIndex === -1) {
      return null;
    }

    return normalizeStyleValue(parts[generatorIndex + 1] || 'solid');
  }

  function buildGeneratorPath(style, pathname) {
    const prefixSegments = getSitePrefixSegments(pathname);
    return buildPathFromSegments([...prefixSegments, 'generator', normalizeStyleValue(style)]);
  }

  function buildGeneratorUrl(style, search, pathname) {
    const params = toSearchParams(search);
    params.delete('style');

    const path = buildGeneratorPath(style, pathname);
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  function hasGeneratorQueryState(search) {
    const params = toSearchParams(search);
    return Array.from(params.keys()).some(key => GENERATOR_QUERY_KEYS.has(key));
  }

  function getLegacyGeneratorRedirectUrl(pathname, search) {
    if (getGeneratorRouteStyleFromPathname(pathname) !== null) {
      return null;
    }

    if (!hasGeneratorQueryState(search)) {
      return null;
    }

    const params = toSearchParams(search);
    const style = normalizeStyleValue(params.get('style') || 'solid');
    return buildGeneratorUrl(style, params, pathname);
  }

  const api = {
    AVAILABLE_STYLE_VALUES,
    GENERATOR_QUERY_KEYS,
    normalizeStyleValue,
    getGeneratorRouteStyleFromPathname,
    buildGeneratorPath,
    buildGeneratorUrl,
    hasGeneratorQueryState,
    getLegacyGeneratorRedirectUrl
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.GeneratorRoutes = api;
})(typeof window !== 'undefined' ? window : globalThis);
