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
    expect(loaded).toContain(`js/${file}.js?v=20261110-quiet-undo`);
  }
  expect(loaded).not.toContain('js/ui.js?v=20261104-scroll-cue-minimum');
  expect(loaded).not.toContain('js/main.js?v=20261110-waveform-scope');
});
