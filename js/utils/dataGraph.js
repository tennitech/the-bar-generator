/* Numeric sample plots. One bounded geometry model for preview and every still export. */
(function (scope) {
  const MAX_SAMPLES = 200;
  const MAX_TEXT = 2400;
  const DEFAULT_DATA = '0, 0.259, 0.5, 0.707, 0.866, 0.966, 1, 0.966, 0.866, 0.707, 0.5, 0.259, 0, -0.259, -0.5, -0.707, -0.866, -0.966, -1, -0.966, -0.866, -0.707, -0.5, -0.259, 0';
  const DECAY_DATA = '1, 0.819, 0.67, 0.549, 0.449, 0.368, 0.301, 0.247, 0.202, 0.165, 0.135, 0.111, 0.091, 0.074, 0.061, 0.05, 0.041, 0.033, 0.027, 0.022, 0.018';
  const keys = ['graphData', 'graphData2', 'graphData3', 'graphData4', 'graphData5'];
  const numberToken = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) return { values: [], error: 'Enter at least two numbers.' };
    if (text.length > MAX_TEXT) return { values: [], error: `Use at most ${MAX_TEXT} characters per series.` };
    const raw = text.trim();
    if (/^[,;]|[,;]$|[,;]\s*[,;]/.test(raw)) return { values: [], error: 'A value is missing between separators.' };
    const tokens = raw.split(/[\s,;]+/);
    if (tokens.length < 2 || tokens.length > MAX_SAMPLES) return { values: [], error: `Use 2–${MAX_SAMPLES} values per series.` };
    if (tokens.some(token => !numberToken.test(token) || !Number.isFinite(Number(token)) || Math.abs(Number(token)) > 1e12)) {
      return { values: [], error: 'Use finite numbers from −1e12 to 1e12, separated by commas or spaces.' };
    }
    return { values: tokens.map(Number), error: '' };
  }
  function normalize(values = {}) {
    const weight = Number(values.graphWeight ?? 1.2);
    return { ...Object.fromEntries(keys.map((key, i) => [key, typeof values[key] === 'string' ? values[key] : i ? '' : DEFAULT_DATA])),
      graphMulti: values.graphMulti === true || values.graphMulti === 'true',
      graphSource: ['sine', 'decay', 'custom', 'legacy'].includes(values.graphSource) ? values.graphSource : 'sine',
      graphVariant: ['line', 'step', 'columns', 'dots'].includes(values.graphVariant) ? values.graphVariant : 'line',
      graphDomain: values.graphDomain === 'zero' ? 'zero' : 'fit',
      graphWeight: Number.isFinite(weight) ? Math.max(0.5, Math.min(2, weight)) : 1.2 };
  }
  function resolve(values = {}) {
    const settings = normalize(values);
    const active = keys.map(key => settings[key]);
    const entries = settings.graphMulti ? active.map((text, index) => ({ text, index })).filter(item => item.index === 0 || item.text.trim()) : [{ text: active[0], index: 0 }];
    const parsed = entries.map(item => ({ ...item, ...parse(item.text) }));
    const failure = parsed.find(item => item.error);
    if (failure) return { settings, series: [], error: `Series ${failure.index + 1}: ${failure.error}` };
    const series = parsed.map(item => item.values);
    if (settings.graphVariant === 'columns' && new Set(series.map(row => row.length)).size > 1) return { settings, series: [], error: 'Columns need the same sample count in every series. Use Line, Step or Dots to compare different counts.' };
    let min = Math.min(...series.flat()), max = Math.max(...series.flat());
    if (settings.graphDomain === 'zero' || settings.graphVariant === 'columns') { min = Math.min(0, min); max = Math.max(0, max); }
    const constant = min === max;
    // A constant fit-domain is centered, with an explicitly reported expanded range.
    if (constant) { const pad = Math.max(1, Math.abs(min) * 0.1); min -= pad; max += pad; }
    return { settings, series, min, max, constant, error: '' };
  }
  function legacy(text) {
    const source = typeof text === 'string' ? text.slice(0, MAX_SAMPLES) : '';
    const filter = typeof module !== 'undefined' && module.exports ? require('./profanityFilter') : scope.ProfanityFilter;
    if (!source || !filter || filter.hasProfanity(source)) return '';
    const codes = source.split('').map(char => char.charCodeAt(0));
    if (codes.length === 1) codes.push(codes[0]);
    return codes.join(', ');
  }
  function readQuery(params) {
    const old = !params.has('graphData') && ['graphText', 'graphText2', 'graphText3', 'graphText4', 'graphText5', 'graphScale'].some(key => params.has(key));
    const values = Object.fromEntries([...keys, 'graphSource', 'graphVariant', 'graphDomain', 'graphWeight', 'graphMulti'].filter(key => params.has(key)).map(key => [key, params.get(key)]));
    if (old) {
      keys.forEach((key, index) => { values[key] = legacy(params.get(`graphText${index ? index + 1 : ''}`) ?? (index ? '' : 'RPI')); });
      values.graphSource = 'legacy';
    }
    return normalize(values);
  }
  function geometry(options = {}) {
    const result = resolve(options);
    const paths = [], rects = [], circles = [];
    if (result.error) return { ...result, paths, rects, circles };
    const x = Number(options.barStartX) || 0, y = Number(options.barY) || 0;
    const width = Math.max(0, Number(options.exactBarWidth) || 250), height = Math.max(0, Number(options.barHeight) || 18);
    const scale = height / 18;
    const thickness = result.settings.graphWeight * scale;
    const radius = thickness * 1.15;
    const inset = result.settings.graphVariant === 'dots' ? radius : thickness / 2;
    const mapY = value => y + inset + (result.max - value) / (result.max - result.min) * Math.max(0, height - 2 * inset);
    result.series.forEach((series, seriesIndex) => {
      const points = series.map((value, index) => ({ x: x + inset + index / (series.length - 1) * Math.max(0, width - 2 * inset), y: mapY(value) }));
      if (result.settings.graphVariant === 'columns') {
        const cell = width / series.length, count = result.series.length;
        const columnWidth = cell * (0.4 + result.settings.graphWeight * 0.25) / count;
        const baseline = mapY(0);
        series.forEach((value, index) => {
          const top = mapY(value);
          if (value !== 0) rects.push({ x: x + cell * index + cell * 0.1 + seriesIndex * columnWidth,
            y: Math.min(top, baseline), width: columnWidth * 0.9, height: Math.abs(baseline - top) });
        });
      } else if (result.settings.graphVariant === 'dots') {
        points.forEach(point => circles.push({ ...point, radius }));
      } else {
        const vertices = [];
        points.forEach((point, index) => {
          if (index && result.settings.graphVariant === 'step') vertices.push({ x: point.x, y: points[index - 1].y });
          vertices.push(point);
        });
        paths.push(vertices);
      }
    });
    return { ...result, thickness, paths, rects, circles };
  }
  function sourceDescription(values = {}) {
    const state = normalize(values);
    if (state.graphSource === 'legacy') return 'Migrated UTF-16 character codes, not measured data. Old scale exaggeration is removed.';
    if (!state.graphMulti && state.graphData === DEFAULT_DATA) return 'Mathematical example: sin(2πi/24), i = 0…24, rounded to 3 decimals. Not measured data.';
    if (!state.graphMulti && state.graphData === DECAY_DATA) return 'Mathematical example: exp(−i/5), i = 0…20, rounded to 3 decimals. Not measured data.';
    return 'Entered numeric values. No external data source or units are attached.';
  }
  function exportError(values = {}) {
    const result = resolve(values);
    return result.error || (result.settings.graphVariant === 'columns' && result.series.every(series => series.every(value => value === 0)) ? 'All values are zero. Choose Line or Dots to export a visible graph.' : '');
  }
  function svg(options = {}, ink = 'currentColor') {
    const model = geometry(options);
    if (model.error || (!model.paths.length && !model.rects.length && !model.circles.length)) return '';
    const description = `Data Graph. ${sourceDescription(options)} Equal sample-index spacing within each series; shared Y range ${model.min} to ${model.max}. ${model.settings.graphVariant} plot. No time or physical units are inferred.`;
    return `<desc>${description}</desc>` + model.paths.map(points => `<path d="${points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')}" fill="none" stroke="${ink}" stroke-width="${model.thickness}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
      + model.rects.map(rect => `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${ink}"/>`).join('')
      + model.circles.map(circle => `<circle cx="${circle.x}" cy="${circle.y}" r="${circle.radius}" fill="${ink}"/>`).join('');
  }
  function draw(target, options, ink) {
    const model = geometry(options);
    target.push(); target.noFill(); target.stroke(ink); target.strokeWeight(model.thickness || 1);
    target.strokeJoin(target.ROUND); target.strokeCap(target.ROUND);
    model.paths.forEach(points => { target.beginShape(); points.forEach(point => target.vertex(point.x, point.y)); target.endShape(); });
    target.noStroke(); target.fill(ink); target.rectMode(target.CORNER); target.ellipseMode(target.CENTER);
    model.rects.forEach(rect => target.rect(rect.x, rect.y, rect.width, rect.height));
    model.circles.forEach(circle => target.ellipse(circle.x, circle.y, circle.radius * 2, circle.radius * 2));
    target.pop();
  }
  const api = { MAX_SAMPLES, MAX_TEXT, DEFAULT_DATA, DECAY_DATA, keys, parse, normalize, resolve, legacy, readQuery, geometry, sourceDescription, exportError, svg, draw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.DataGraph = api;
})(typeof window !== 'undefined' ? window : globalThis);
