const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const shellURL = source => source.match(/generator\/index\.html\?v=[\w-]+/)[0];
const scriptNodes = source => Array.from(source.matchAll(/<script[^>]+src="([^"]+)"/g), match => ({
  getAttribute: () => match[1], remove() {}
}));

test('every routed entry and Home prefetch use the bootstrap shell version', () => {
  const bootstrap = read('js/generatorBootstrap.js');
  const expected = shellURL(bootstrap);
  const version = expected.split('?v=')[1];
  for (const style of fs.readdirSync(path.join(root, 'generator'))) {
    const entry = path.join('generator', style, 'index.html');
    if (!fs.existsSync(path.join(root, entry))) continue;
    const html = read(entry);
    expect(shellURL(html)).toBe(expected);
    expect(html).toContain(`js/generatorBootstrap.js?v=${version}`);
  }
  expect(shellURL(read('index.html'))).toBe(expected);
});

test('a warm routed page fetches the new shell and loads its current runtime helpers', async () => {
  const html = read('generator/waveform/index.html');
  const bootstrap = read('js/generatorBootstrap.js');
  const currentShell = read('generator/index.html');
  // Real stale URL/response observed in the deployed browser after PR #144.
  const oldURL = 'generator/index.html?v=20261110-waveform-scope';
  const oldShell = currentShell.replace(/transparentGif\.js\?v=[\w-]+/, 'transparentGif.js?v=20261110-gif-30fps')
    .replace(/js\/ui\.js\?v=[\w-]+/, 'js/ui.js?v=20261104-scroll-cue-minimum')
    .replace(/js\/main\.js\?v=[\w-]+/, 'js/main.js?v=20261110-waveform-scope');
  const loaded = [], requested = [];
  const window = { GeneratorRoutes: { getLegacyGeneratorRedirectUrl: () => null },
    location: { pathname: '/the-bar-generator/generator/waveform/', search: '', hash: '' },
    GeneratorInitialState: { apply() {}, syncHeaderLayout() {} }, setupCustomDropdowns() {},
    ParameterControls: { prepare() {} }, p5: function () {}, setup() {} };
  const document = { querySelector: () => null, createElement: () => ({}),
    body: { append(script) { loaded.push(script.src); script.onload(); }, replaceChildren() {} } };
  const context = vm.createContext({ window, document, console,
    fetch: async url => { requested.push(url); return { ok: true, text: async () => url === oldURL ? oldShell : currentShell }; },
    DOMParser: class { parseFromString(source) {
      const bodyScripts = scriptNodes(source.slice(source.indexOf('<body')));
      return { title: 'Generator', querySelector: () => null, querySelectorAll: () => scriptNodes(source),
        body: { cloneNode: () => ({ childNodes: [], querySelectorAll: () => bodyScripts }) } };
    } } });
  const routeSettings = html.match(/<script>\s*(window\.__RPI_GENERATOR_ROUTE_STYLE__[\s\S]*?)<\/script>/)[1];
  vm.runInContext(routeSettings, context);
  await vm.runInContext(bootstrap, context);
  expect(requested).toEqual([shellURL(bootstrap)]);
  expect(requested[0]).not.toBe(oldURL);
  expect(loaded).toContain(currentShell.match(/js\/utils\/transparentGif\.js\?v=[\w-]+/)[0]);
  expect(loaded).not.toContain('js/utils/transparentGif.js?v=20261110-gif-30fps');
  for (const file of ['ui', 'main']) {
    const currentSource = scriptNodes(currentShell).find(node => node.getAttribute('src').startsWith(`js/${file}.js?v=`)).getAttribute('src');
    expect(loaded).toContain(currentSource);
  }
  expect(loaded).toContain('js/utils/inputLimitFeedback.js?v=20261110-input-limit-feedback');
  expect(loaded).not.toContain('js/ui.js?v=20261104-scroll-cue-minimum');
  expect(loaded).not.toContain('js/main.js?v=20261110-waveform-scope');
  expect(loaded).toContain(currentShell.match(/js\/utils\/keyboardShortcuts\.js\?v=[\w-]+/)[0]);
});

test.each(['runway', 'graph'])('routed %s startup loads the graph model before its consumers', async style => {
  const route = read(`generator/${style}/index.html`);
  const shell = read('generator/index.html');
  const loaded = [], initialStates = [], errors = [];
  const realModules = new Set(['waveformNotes', 'numericControls', 'rulerScale', 'loopingGif',
    'musicStyle', 'nucleotidePattern', 'dataGraph', 'dataGraphControls', 'barPattern', 'generatorParameters']);
  const scope = { URLSearchParams, console: { error: error => errors.push(String(error)) },
    GeneratorRoutes: require('../js/utils/generatorRoutes'),
    location: { pathname: `/the-bar-generator/generator/${style}/`, search: '?graphData=-1,0,1&graphSource=custom', hash: '' },
    GeneratorInitialState: { resolveTheme: () => 'black', apply() { initialStates.push(scope.GeneratorParameters.read()); }, syncHeaderLayout() {} },
    setupCustomDropdowns() {}, ParameterControls: { prepare() {} },
    p5: function () {}, setup() {},
    fetch: async () => ({ ok: true, text: async () => shell }),
    DOMParser: class { parseFromString(source) {
      const bodyScripts = scriptNodes(source.slice(source.indexOf('<body')));
      return { title: 'Generator', querySelector: () => null, querySelectorAll: () => scriptNodes(source),
        body: { cloneNode: () => ({ childNodes: [], querySelectorAll: () => bodyScripts }) } };
    } } };
  scope.window = scope;
  const context = vm.createContext(scope);
  scope.document = { querySelector: () => null, createElement: () => ({}),
    body: { append(script) {
      loaded.push(script.src);
      const name = script.src.match(/js\/utils\/([^/?]+)\.js/)?.[1];
      try { if (realModules.has(name)) vm.runInContext(read(script.src.split('?')[0]), context); script.onload(); }
      catch (error) { errors.push(error.message); script.onerror(); }
    }, replaceChildren() {}, removeAttribute() {} },
    getElementById: id => id === 'retry-generator' ? { addEventListener() {} } : null };
  vm.runInContext(route.match(/<script>\s*(window\.__RPI_GENERATOR_ROUTE_STYLE__[\s\S]*?)<\/script>/)[1], context);
  await vm.runInContext(read('js/generatorBootstrap.js'), context);
  expect(errors).toEqual([]);
  expect(initialStates).toHaveLength(1);
  expect(initialStates[0]).toMatchObject({ style, graphData: '-1,0,1', graphSource: 'custom' });
  const indexOf = name => loaded.findIndex(src => src.startsWith(`js/utils/${name}.js`));
  expect(indexOf('dataGraph')).toBeGreaterThanOrEqual(0);
  for (const consumer of ['dataGraphControls', 'barPattern', 'generatorParameters']) {
    expect(indexOf('dataGraph')).toBeLessThan(indexOf(consumer));
  }
  // Prove barPattern did not permanently capture an undefined browser global.
  expect(vm.runInContext(`createBarPatternSVG({ currentShader: 12, barStartX: 0, barY: 0,
    exactBarWidth: 250, barHeight: 18, fgColor: '#000000', values: GeneratorParameters.read() })`, context)).toContain('<path');
  expect(scope.DataGraphControls).toBeDefined();
  expect(scope.__RPI_GENERATOR_P5_INSTANCE__).toBeDefined();
  // Head-only dependencies must be present in either the route stub or the
  // bootstrap load, even when a future feature adds a new shell helper.
  const allLoaded = new Set([...scriptNodes(route).map(node => node.getAttribute('src')), ...loaded]);
  for (const node of scriptNodes(shell)) expect(allLoaded.has(node.getAttribute('src'))).toBe(true);
});
