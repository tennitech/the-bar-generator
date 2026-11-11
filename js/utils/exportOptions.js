(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.logoExportOptions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Retain internal keys for existing controls; labels describe the tradeoff.
  const SIZES = Object.freeze({ standard: 1000, large: 4096 });
  const GIF_SIZES = Object.freeze({ standard: 1000, large: 2000 });
  const DEFAULT_SIZE = 'large';
  // Cropping changes the viewport, never the scientific or official coordinates.
  function normalizeComposition(value) { return value === 'bar' ? 'bar' : 'logo'; }
  function compositionLabel(value) { return normalizeComposition(value) === 'bar' ? 'Bar only' : 'Bar + RPI'; }
  function viewport(geometry, composition) {
    const barOnly = normalizeComposition(composition) === 'bar';
    return { x: -geometry.exportPadding, y: Number(((barOnly ? geometry.barY : 0) - geometry.exportPadding).toFixed(6)),
      width: geometry.width + geometry.exportPadding * 2,
      height: (barOnly ? geometry.barHeight : geometry.totalHeight) + geometry.exportPadding * 2 };
  }
  function dimensions(size, geometry, composition, format = 'png') {
    const sizes = format === 'gif' ? GIF_SIZES : SIZES;
    const logoWidth = sizes[size === 'standard' ? 'standard' : DEFAULT_SIZE];
    const scale = logoWidth / geometry.width;
    const frame = viewport(geometry, composition);
    return { logoWidth, scale, width: Math.ceil(frame.width * scale), height: Math.ceil(frame.height * scale) };
  }
  function utf8Length(value) { return new TextEncoder().encode(value).length; }
  function safeTitle(value, maxBytes = 64) {
    const normalized = String(value || '').normalize('NFC')
      .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '')
      .toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-+|-+$/g, '');
    const segments = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(normalized)].map(x => x.segment)
      : Array.from(normalized);
    let result = '';
    for (const segment of segments) { if (utf8Length(result + segment) > maxBytes) break; result += segment; }
    result = result.replace(/-+$/g, '');
    return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(result) ? `name-${result}` : result;
  }
  function filename(snapshot, format) {
    const values = snapshot.values || {};
    const tokens = ['rpi-bar', snapshot.family || 'solid'];
    if (normalizeComposition(snapshot.composition) === 'bar') tokens.push('bar-only');
    const variants = { 'circles-gradient': 'circlesGradientVariant', gradient: 'gradientVariant', grid: 'gridVariant',
      lines: 'linesVariant', 'point-connect': 'pointConnectVariant', 'triangle-grid': 'triangleGridVariant' };
    if (variants[snapshot.family]) tokens.push(`v${values[variants[snapshot.family]] || 1}`);
    if (snapshot.family === 'triangles') {
      if (values.trianglesDirection) tokens.push(values.trianglesDirection);
      if (values.trianglesCount) tokens.push(`n${values.trianglesCount}`);
    }
    if (snapshot.family === 'waveform') {
      const type = Number(values.waveformType);
      tokens.push(Number.isInteger(type) ? (['sine', 'saw', 'square', 'pulse'][type] || 'wave') : `wave-${String(type).replace('.', 'p')}`);
      tokens.push(`midi${values.waveformNote || 24}`);
    }
    if (snapshot.family === 'ruler') tokens.push(`r${values.rulerRepeats || 10}`, `u${values.rulerUnits || 10}`, `t${values.rulerThickness || 1}`);
    if (snapshot.family === 'ticker') tokens.push(`n${values.tickerRepeats || 34}`, `ratio${values.tickerRatio || 2}`);
    tokens.push(snapshot.inkName || snapshot.colorMode || 'black', 'clear');
    tokens.push(format === 'svg' ? 'vector' : `${snapshot.dimensions.width}x${snapshot.dimensions.height}`);
    if (format === 'gif') tokens.push('loop');
    const base = tokens.map(token => safeTitle(token, 40)).filter(Boolean).join('-');
    const title = safeTitle(snapshot.title, Math.max(0, Math.min(64, 175 - utf8Length(base))));
    return `${base}${title ? `--${title}` : ''}.${format}`;
  }
  return { SIZES, GIF_SIZES, DEFAULT_SIZE, normalizeComposition, compositionLabel, viewport, dimensions, safeTitle, filename };
});
