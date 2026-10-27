(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.logoExportOptions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SIZES = Object.freeze({ standard: 1000, large: 2000 });
  function dimensions(size, geometry) {
    const logoWidth = SIZES[size] || SIZES.standard;
    const scale = logoWidth / geometry.width;
    return { logoWidth, scale, width: Math.ceil((geometry.width + geometry.exportPadding * 2) * scale),
      height: Math.ceil((geometry.totalHeight + geometry.exportPadding * 2) * scale) };
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
    const variants = { 'circles-gradient': 'circlesGradientVariant', gradient: 'gradientVariant', grid: 'gridVariant',
      lines: 'linesVariant', 'point-connect': 'pointConnectVariant', 'triangle-grid': 'triangleGridVariant', triangles: 'trianglesVariant' };
    if (variants[snapshot.family]) tokens.push(`v${values[variants[snapshot.family]] || 1}`);
    if (snapshot.family === 'triangles') {
      if (values.trianglesDirection) tokens.push(values.trianglesDirection);
      if (values.trianglesCount) tokens.push(`n${values.trianglesCount}`);
    }
    if (snapshot.family === 'waveform') {
      const type = Number(values.waveformType);
      tokens.push(Number.isInteger(type) ? (['sine', 'saw', 'square', 'pulse'][type] || 'wave') : `wave-${String(type).replace('.', 'p')}`);
      tokens.push(`f${values.waveformFrequency || 24}`);
    }
    if (snapshot.family === 'ruler') tokens.push(`r${values.rulerRepeats || 10}`, `u${values.rulerUnits || 4}`);
    if (snapshot.family === 'ticker') tokens.push(`n${values.tickerRepeats || 34}`, `ratio${values.tickerRatio || 2}`);
    tokens.push(snapshot.inkName || snapshot.colorMode || 'black', 'clear');
    tokens.push(format === 'svg' ? 'vector' : `${snapshot.dimensions.logoWidth}w`);
    if (format === 'gif') tokens.push('loop');
    const base = tokens.map(token => safeTitle(token, 40)).filter(Boolean).join('-');
    const title = safeTitle(snapshot.title, Math.max(0, Math.min(64, 175 - utf8Length(base))));
    return `${base}${title ? `--${title}` : ''}.${format}`;
  }
  return { SIZES, dimensions, safeTitle, filename };
});
