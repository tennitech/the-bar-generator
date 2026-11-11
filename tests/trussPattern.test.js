const fs = require('node:fs');
const vm = require('node:vm');
const { createTrussPatternGeometry: geometry, normalizeTrussSettings: normalize, createBarPatternSVG } = require('../js/utils/barPattern');
const { normalizeState, encodeState, decodeState } = require('../js/utils/shareState');
const families = ['warren', 'pratt', 'howe', 'cross'];
const trussManifest = {
  'style-select': { options: ['solid', 'truss'] },
  'truss-family-select': { options: families },
  'truss-segments-slider': { type: 'range', min: 4, max: 32, step: 2 },
  'truss-depth-slider': { type: 'range', min: 50, max: 100, step: 5 },
  'truss-thickness-slider': { type: 'range', min: 0.5, max: 2, step: 0.25 }
};

test('normalization shares precise bounds and steps without accepting nonfinite geometry', () => {
  expect(normalize()).toEqual({ family: 'warren', segments: 16, depth: 100, thickness: 1.25 });
  expect(normalize({ family: 'flat', segments: 51, depth: -20, thickness: 99 })).toEqual({ family: 'pratt', segments: 32, depth: 50, thickness: 2 });
  expect(normalize({ family: 'unknown', segments: '15', depth: '63', thickness: '1.12' })).toEqual({ family: 'warren', segments: 16, depth: 65, thickness: 1 });
  expect(normalize({ segments: Infinity, depth: NaN, thickness: 'invalid' })).toEqual(normalize());
  const invalid = geometry({ exactBarWidth: NaN, barHeight: Infinity, barStartX: NaN, barY: Infinity });
  expect(invalid.lines.every(line => ['x1', 'y1', 'x2', 'y2'].every(key => Number.isFinite(line[key])))).toBe(true);
});

test.each(families)('%s has equal effective bays at every panel setting and no redundant lines', family => {
  for (let panels = 4; panels <= 32; panels += 2) {
    const result = geometry({ family, segments: panels });
    const diagonals = result.lines.filter(line => line.role === 'diagonal');
    expect(diagonals).toHaveLength(family === 'cross' ? panels * 2 : panels);
    expect(result.lines.filter(line => line.role === 'post')).toHaveLength(['pratt', 'howe'].includes(family) ? panels + 1 : 2);
    const width = (250 - result.thickness) / panels;
    for (const line of diagonals) expect(line.x2 - line.x1).toBeCloseTo(width, 10);
    const keys = result.lines.map(({ x1, y1, x2, y2 }) => [[x1, y1].join(','), [x2, y2].join(',')].sort().join('|'));
    expect(new Set(keys).size).toBe(result.lines.length);
  }
});

test('bracing orientations match the named geometric rules', () => {
  for (const family of families) {
    const diagonals = geometry({ family, segments: 8 }).lines.filter(line => line.role === 'diagonal');
    const signs = diagonals.map(line => Math.sign(line.y2 - line.y1));
    expect(signs).toEqual(family === 'pratt' ? [1, 1, 1, 1, -1, -1, -1, -1]
      : family === 'howe' ? [-1, -1, -1, -1, 1, 1, 1, 1]
      : family === 'warren' ? [-1, 1, -1, 1, -1, 1, -1, 1]
      : Array.from({ length: 16 }, (_, i) => i % 2 ? -1 : 1));
  }
});

test.each(families)('%s contains complete round strokes and preserves full width at all depth/weight extremes', family => {
  for (const segments of [4, 16, 32]) for (const depth of [50, 75, 100]) for (const thickness of [0.5, 1.25, 2]) {
    const result = geometry({ family, segments, depth, thickness, barStartX: -10, barY: 30 });
    const r = result.thickness / 2;
    for (const line of result.lines) for (const n of [1, 2]) {
      expect(line[`x${n}`] - r).toBeGreaterThanOrEqual(-10 - 1e-9);
      expect(line[`x${n}`] + r).toBeLessThanOrEqual(240 + 1e-9);
      expect(line[`y${n}`] - r).toBeGreaterThanOrEqual(30 - 1e-9);
      expect(line[`y${n}`] + r).toBeLessThanOrEqual(48 + 1e-9);
    }
    expect(Math.min(...result.lines.flatMap(l => [l.x1, l.x2])) - r).toBeCloseTo(-10);
    expect(Math.max(...result.lines.flatMap(l => [l.x1, l.x2])) + r).toBeCloseTo(240);
    const ys = result.lines.flatMap(l => [l.y1, l.y2]);
    expect(Math.max(...ys) - Math.min(...ys) + result.thickness).toBeCloseTo(18 * depth / 100);
  }
});

test('responsive scaling changes geometry and stroke proportionally, never panel topology', () => {
  const base = geometry({ family: 'pratt', segments: 12, depth: 60, thickness: 1.75 });
  for (const scale of [0.5, 2, 8]) {
    const scaled = geometry({ family: 'pratt', segments: 12, depth: 60, thickness: 1.75, exactBarWidth: 250 * scale, barHeight: 18 * scale });
    expect(scaled.thickness).toBeCloseTo(base.thickness * scale);
    for (const [i, line] of scaled.lines.entries()) for (const key of ['x1', 'y1', 'x2', 'y2']) expect(line[key]).toBeCloseTo(base.lines[i][key] * scale);
  }
});

test('SVG serializes the exact same coordinates and caps for every family and remains static', () => {
  for (const family of families) {
    const settings = { family, segments: 18, depth: 70, thickness: 1.75 };
    const expected = geometry(settings);
    const config = { currentShader: 9, barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18, fgColor: '#000000', values: {
      trussFamily: family, trussSegments: 18, trussDepth: 70, trussThickness: 1.75 } };
    const svg = createBarPatternSVG(config);
    const commands = [...svg.matchAll(/M ([\d.e+-]+) ([\d.e+-]+) L ([\d.e+-]+) ([\d.e+-]+)/g)].map(m => m.slice(1).map(Number));
    expect(commands).toEqual(expected.lines.map(l => [l.x1, l.y1, l.x2, l.y2]));
    expect(svg).toContain('stroke-linecap="round"');
    expect(svg).toContain('stroke-width="1.75"');
    expect(createBarPatternSVG({ ...config, values: { ...config.values, timeSeconds: 99, loopOffsetX: 20 } })).toBe(svg);
  }
});

test.each(['solid', 'truss'])('legacy dormant fields migrate without breaking a %s saved link', style => {
  const state = { v: 1, controls: { 'style-select': style, 'truss-family-select': 'flat', 'truss-segments-slider': '15', 'truss-thickness-slider': '2' } };
  const migrated = normalizeState(state, trussManifest);
  expect(migrated.controls).toEqual({ 'style-select': style, 'truss-family-select': 'pratt', 'truss-segments-slider': '16', 'truss-depth-slider': '100', 'truss-thickness-slider': '2' });
  expect(decodeState(encodeState(migrated, trussManifest), trussManifest)).toEqual(migrated);
});

test('only validated old controls migrate; invalid modern controls still reject', () => {
  const modern = { v: 1, controls: { 'style-select': 'truss', 'truss-family-select': 'howe', 'truss-segments-slider': '18', 'truss-depth-slider': '55', 'truss-thickness-slider': '1.75' } };
  expect(decodeState(encodeState(modern, trussManifest), trussManifest).controls).toEqual(modern.controls);
  for (const change of [{ 'truss-segments-slider': '15' }, { 'truss-depth-slider': '41' }, { 'truss-family-select': 'flat' }, { 'truss-thickness-slider': '99' }]) {
    expect(() => normalizeState({ ...modern, controls: { ...modern.controls, ...change } }, trussManifest)).toThrow();
  }
  for (const change of [{ 'truss-segments-slider': '999' }, { 'truss-family-select': 'bad' }, { 'truss-thickness-slider': 'NaN' }]) {
    expect(() => normalizeState({ v: 1, controls: change }, trussManifest)).toThrow();
  }
});

test('Truss stays selectable under Under Construction with all controls keyboard/native and no motion toggle', () => {
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  const category = html.match(/<optgroup label="Under Construction">([\s\S]*?)<\/optgroup>/)[1];
  expect(category).toContain('<option value="truss">Truss</option>');
  const group = html.slice(html.indexOf('<div id="truss-group"'), html.indexOf('<div id="staff-group"'));
  for (const id of ['family-select', 'segments-slider', 'depth-slider', 'thickness-slider']) {
    expect(group).toContain(`for="truss-${id}"`);
    expect(group).toMatch(new RegExp(`id="truss-${id}"[^>]*data-url-parameter="truss`));
    expect(group).toMatch(new RegExp(`id="truss-${id}"[^>]*aria-describedby="truss-`));
  }
  expect(group).not.toContain('motion-toggle');
});

test('normalized query values include every new control and are safe to rehydrate', () => {
  const pattern = require('../js/utils/barPattern');
  const context = { window: { location: { pathname: '/generator/truss/', search: '?trussFamily=howe&trussSegments=31&trussDepth=63&trussThickness=2.15' },
    GeneratorRoutes: require('../js/utils/generatorRoutes'), GeneratorInitialState: { resolveTheme: () => 'black' },
    NucleotidePattern: require('../js/utils/nucleotidePattern'), NumericControls: require('../js/utils/numericControls'), RulerScale: require('../js/utils/rulerScale'),
    loopingGifUtils: require('../js/utils/loopingGif'), WaveformLfo: require('../js/utils/waveformLfo') }, URLSearchParams, ...pattern, normalizeMusicNoteShape: () => 'circle' };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/generatorParameters'), 'utf8'), context);
  expect(context.window.GeneratorParameters.read()).toMatchObject({ style: 'truss', trussFamily: 'howe', trussSegments: 32, trussDepth: 65, trussThickness: 2 });
});
