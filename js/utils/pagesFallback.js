(function (globalScope) {
  const AVAILABLE_STYLE_VALUES = new Set([
    'solid', 'ruler', 'ticker', 'binary', 'waveform', 'circles',
    'numeric', 'morse', 'circles-gradient', 'gradient', 'grid',
    'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles',
    'fibonacci-sequence', 'union', 'wave-quantum',
    'runway', 'lunar', 'truss', 'music', 'graph'
  ]);

  const UNAVAILABLE_STYLE_VALUES = new Set([
    'music',
    'graph',
    'truss'
  ]);

  const ROUTABLE_STYLE_VALUES = new Set(
    Array.from(AVAILABLE_STYLE_VALUES).filter(style => !UNAVAILABLE_STYLE_VALUES.has(style))
  );

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
    'circlesFill',
    'circlesDensity',
    'circlesSizeVariation',
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

  const ROOT_SITE_SEGMENTS = new Set([
    'generator',
    'css',
    'js',
    'assets',
    'references',
    'third_party',
    'frontify-block',
    'attached_assets',
    'index.html',
    'marquee-ui.html',
    'favicon.ico',
    '404.html',
    '.nojekyll'
  ]);

  function normalizeStyleValue(style) {
    if (style === 'staff') return 'solid';
    if (style === 'matrix') return 'solid';
    return ROUTABLE_STYLE_VALUES.has(style) ? style : 'solid';
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

  function buildPathFromSegments(segments) {
    return segments.length ? `/${segments.join('/')}/` : '/';
  }

  function inferPagesBasePath(pathname, hostname) {
    const normalizedPathname = normalizePathname(pathname);
    const pathParts = normalizedPathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    if (!firstPart || ROOT_SITE_SEGMENTS.has(firstPart)) {
      return '/';
    }

    if (typeof hostname === 'string' && hostname.endsWith('.github.io')) {
      return buildPathFromSegments([firstPart]);
    }

    return '/';
  }

  function stripBasePath(pathname, hostname) {
    const normalizedPathname = normalizePathname(pathname);
    const basePath = inferPagesBasePath(normalizedPathname, hostname);

    if (basePath === '/') {
      return {
        basePath,
        relativePath: normalizedPathname
      };
    }

    const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const relativePath = normalizedPathname.startsWith(`${normalizedBasePath}/`)
      ? normalizedPathname.slice(normalizedBasePath.length)
      : normalizedPathname;

    return {
      basePath,
      relativePath: relativePath.startsWith('/') ? relativePath : `/${relativePath}`
    };
  }

  function hasGeneratorQueryState(search) {
    const params = toSearchParams(search);
    return Array.from(params.keys()).some(key => GENERATOR_QUERY_KEYS.has(key));
  }

  function getGeneratorFallbackUrl(basePath, relativeParts, search) {
    const params = toSearchParams(search);
    const requestedStyle = relativeParts[1] || params.get('style') || 'solid';
    const style = normalizeStyleValue(requestedStyle);
    params.delete('style');

    const path = buildPathFromSegments([
      ...basePath.split('/').filter(Boolean),
      'generator',
      style
    ]);
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  function getPagesFallbackRedirectUrl(pathname, search, options = {}) {
    const { hostname = '' } = options;
    const params = toSearchParams(search);
    const { basePath, relativePath } = stripBasePath(pathname, hostname);
    const relativeParts = relativePath.split('/').filter(Boolean);

    if (relativeParts[0] === 'generator') {
      return getGeneratorFallbackUrl(basePath, relativeParts, params);
    }

    if (hasGeneratorQueryState(params)) {
      return getGeneratorFallbackUrl(basePath, relativeParts, params);
    }

    return basePath;
  }

  const api = {
    inferPagesBasePath,
    getPagesFallbackRedirectUrl,
    hasGeneratorQueryState,
    normalizeStyleValue
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.PagesFallback = api;
})(typeof window !== 'undefined' ? window : globalThis);
