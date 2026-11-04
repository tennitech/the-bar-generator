const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
const source = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');
const numeric = require('../js/utils/numericControls');

// A small authored-control fixture exercises the actual action callbacks without
// pretending to provide rendered-browser/layout evidence.
function fixture(random = 0) {
  const fields = {};
  const attrs = tag => Object.fromEntries(Array.from(tag.matchAll(/([\w-]+)="([^"]*)"/g), m => [m[1], m[2]]));
  for (const match of html.matchAll(/<input\b([^>]*)>|<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
    const attributes = match[1] ?? match[2], tag = match[1] !== undefined ? 'INPUT' : 'SELECT';
    const a = attrs(attributes);
    if (!a.id) continue;
    const options = tag === 'SELECT' ? Array.from((match[3] || '').matchAll(/<option\b([^>]*)>/g), m => {
      const a = attrs(m[1]); return { value: a.value, defaultSelected: /\bselected\b/.test(m[1]), disabled: /\bdisabled\b/.test(m[1]) };
    }) : [];
    const value = options.length ? (options.find(o => o.defaultSelected) || options[0]).value : a.value || '';
    const field = { id: a.id, type: a.type || 'select-one', tagName: tag,
      options, defaultValue: value, defaultChecked: /\bchecked\b/.test(attributes),
      checked: /\bchecked\b/.test(attributes), min: a.min, max: a.max, step: a.step || 1,
      dataset: { ...(a['data-url-parameter'] ? { urlParameter: a['data-url-parameter'] } : {}) },
      style: {}, dispatchEvent: jest.fn() };
    let current = value;
    Object.defineProperty(field, 'value', { get: () => current, set: next => { current = field.tagName === 'SELECT' && !options.some(option => option.value === String(next)) ? '' : String(next); } });
    fields[a.id] = field;
  }
  const starts = Array.from(html.matchAll(/<div id="([^"]+-group)"[^>]*class="control-group"[^>]*>/g));
  const groups = {};
  starts.forEach((match, i) => {
    const style = attrs(match[0])['data-parameter-actions'];
    if (!style) return;
    const content = html.slice(match.index, starts[i + 1]?.index || html.length);
    const members = Object.values(fields).filter(field => content.includes(`id="${field.id}"`) &&
      (field.dataset.urlParameter || ['quantum-phase', 'quantum-speed-slider', 'quantum-reverse-toggle'].includes(field.id)));
    groups[style] = { dataset: { parameterActions: style }, querySelectorAll: () => members,
      querySelector: () => null };
  });
  const buttons = Object.fromEntries(Object.keys(groups).map(style => [style, { dataset: { parameterStyle: style }, disabled: false }]));
  const document = {
    getElementById: id => fields[id],
    querySelector(selector) {
      const style = /data-parameter-actions="([^"]+)"/.exec(selector)?.[1];
      return style ? groups[style] : buttons[/data-parameter-style="([^"]+)"/.exec(selector)?.[1]];
    },
    querySelectorAll(selector) {
      return selector === '[data-parameter-action="reset"]' ? Object.values(buttons)
        : selector === '[data-parameter-actions]' ? Object.values(groups) : [];
    }
  };
  const context = { document, URLSearchParams, Event: class { constructor(type) { this.type = type; } },
    Math: Object.assign(Object.create(Math), { random: () => random }),
    sharePatternSeed: 1, SURPRISE_TEXT_OPTIONS: ['RPI', 'BUILD', 'NEW'],
    pickRandom: choices => choices[Math.floor(random * choices.length)],
    getStepPrecision: step => String(step).split('.')[1]?.length || 0,
    randomStepValue: (min, max, step = 1) => min + Math.floor(random * (Math.round((max - min) / step) + 1)) * step,
    randomChance: probability => random < probability,
    getDefaultLoopSpeed: style => ({ ruler: .3, ticker: .4, waveform: .3 })[style],
    NucleotidePattern: require('../js/utils/nucleotidePattern'), syncNucleotideControls: jest.fn(),
    NumericControls: { ...numeric, sync: jest.fn() },
    normalizeTriangleGridSettings: require('../js/utils/barPattern').normalizeTriangleGridSettings,

    normalizeCirclesGradientSettings: require('../js/utils/barPattern').normalizeCirclesGradientSettings,
    quantumModel: require('../js/utils/quantumModel'),
    applyTickerWidthRatioBounds: () => {}, stopAudio: jest.fn() };
  context.window = context;
  for (const field of Object.values(fields)) context[field.id.replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = field;
  context.envelopeSettingsGroup = { style: {} };
  context.neuralNetworkHiddenLayersDisplay = { textContent: '' };
  context.updateUrlParameters = () => context.ParameterControls.refresh();
  for (const name of source.slice(source.indexOf('function resetStyleParameters'), source.indexOf('function getBugReportContextLabel'))
    .matchAll(/\b(update\w+|syncMotionToggleState|syncAllCustomSelects|resetCirclePatternCache|resetSequencePreviewState|handleBinaryInput|requestUpdate)\(/g)) {
    context[name[1]] ||= jest.fn();
  }
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/utils/parameterControls'), 'utf8'), context);
  vm.runInContext(source.slice(source.indexOf('function getTriangleGridControlValues'), source.indexOf('function updateTrianglesCountDisplay')), context);

  vm.runInContext(source.slice(source.indexOf('function getCirclesGradientControlValues'), source.indexOf('function updateGradientVariantDisplay')), context);
  vm.runInContext(source.slice(source.indexOf('const NEURAL_CONTROL_DEFAULTS'), source.indexOf('function updateTriangleGridVariantDisplay')), context);
  vm.runInContext(source.slice(source.indexOf('function resetWaveformLfo()'), source.indexOf('function getCurrentAudioPreviewType()')), context);
  vm.runInContext(source.slice(source.indexOf('function resetStyleParameters'), source.indexOf('function getBugReportContextLabel')), context);
  context.ParameterControls.bindActions({ reset: context.resetStyleParameters, randomize: context.randomizeStyleParameters,
    isDefaultSeed: () => context.sharePatternSeed === 1 });
  const snapshot = style => JSON.stringify([context.ParameterControls.fieldsFor(style).map(field =>
    field.type === 'checkbox' ? field.checked : field.value), style === 'circles' ? context.sharePatternSeed : null]);
  return { context, fields, groups, buttons, snapshot };
}

const active = ['nucleotide', 'ruler', 'binary', 'morse', 'ticker', 'waveform', 'wave-quantum', 'circles', 'numeric',
  'circles-gradient', 'gradient', 'grid', 'lines', 'point-connect', 'neural-network', 'triangle-grid', 'triangles'];
const fixed = ['solid', 'fibonacci-sequence', 'union', 'runway', 'lunar'];

test('explicit capabilities cover exactly all 22 selectable styles and reject construction/prototype names', () => {
  const h = fixture();
  expect(Object.keys(h.context.ParameterControls.capabilities).sort()).toEqual([...active, ...fixed].sort());
  expect(h.fields['style-select'].options.filter(option => !option.disabled).map(option => option.value).sort())
    .toEqual([...active, ...fixed].sort());
  for (const style of active) expect(h.context.ParameterControls.supportsActions(style)).toBe(true);
  for (const style of [...fixed, 'music', 'graph', 'truss', 'constructor', '__proto__']) {
    expect(h.context.ParameterControls.supportsActions(style)).toBe(false);
    h.context.resetStyleParameters(style); h.context.randomizeStyleParameters(style);
  }
  expect(h.context.stopAudio).not.toHaveBeenCalled();
});

test('routed startup and the fetched shell load the same parameter-action utility version', () => {
  const version = html.match(/parameterControls\.js\?v=([^"']+)/)[1];
  const generator = require('node:path').dirname(require.resolve('../generator/index.html'));
  for (const entry of fs.readdirSync(generator, { withFileTypes: true })) {
    if (!entry.isDirectory() || !fs.existsSync(`${generator}/${entry.name}/index.html`)) continue;
    const route = fs.readFileSync(`${generator}/${entry.name}/index.html`, 'utf8');
    expect(route.match(/parameterControls\.js\?v=([^"']+)/)[1]).toBe(version);
  }
});

test.each(active)('%s: authored defaults agree with runtime Reset, randomization always changes state, repeated Reset is pristine', style => {
  const h = fixture();
  expect(h.context.ParameterControls.fieldsFor(style).length).toBeGreaterThan(0);
  const baseline = h.snapshot(style);
  expect(h.buttons[style].disabled).toBe(true);
  for (let repeat = 0; repeat < 3; repeat++) {
    const before = h.snapshot(style);
    h.context.randomizeStyleParameters(style);
    expect(h.snapshot(style)).not.toBe(before);
    expect(h.buttons[style].disabled).toBe(h.snapshot(style) === baseline);
  }
  h.context.resetStyleParameters(style);
  expect(h.snapshot(style)).toBe(baseline);
  expect(h.context.syncAllCustomSelects).toHaveBeenCalledTimes(4);
  expect(h.buttons[style].disabled).toBe(true);
  h.context.resetStyleParameters(style);
  expect(h.snapshot(style)).toBe(baseline);
});

test.each(active)('%s: every directly edited parameter enables Reset and manually restored defaults disable it', style => {
  const h = fixture();
  for (const field of h.context.ParameterControls.fieldsFor(style)) {
    const original = field.value, checked = field.checked;
    if (field.type === 'checkbox') field.checked = !field.checked;
    else field.value = field.id === 'quantum-phase' ? '.5' : field.tagName === 'SELECT' ? field.options.find(option => option.value !== original).value
      : field.type === 'range' ? (Number(original) === Number(field.min) ? field.max : field.min) : '0123';
    h.context.ParameterControls.refreshStyle(style);
    expect(h.buttons[style].disabled).toBe(false);
    field.value = original; field.checked = checked;
    h.context.ParameterControls.refreshStyle(style);
    expect(h.buttons[style].disabled).toBe(true);
  }
});

test.each([false, true])('Reset and Randomize preserve explicit LOOP=%s for all three animated transport families', looping => {
  const h = fixture();
  for (const style of ['ticker', 'waveform', 'wave-quantum']) {
    const toggle = h.fields[`${style === 'wave-quantum' ? 'quantum' : style}-motion-toggle`];
    toggle.checked = looping;
    h.context.randomizeStyleParameters(style); expect(toggle.checked).toBe(looping);
    h.context.resetStyleParameters(style); expect(toggle.checked).toBe(looping);
  }
});

test.each(['dotmatrix', 'height'])('Numeric Values retains %s and inactive formula, and Formula retains inactive decimal data', mode => {
  const h = fixture();
  h.fields['numeric-mode-select'].value = mode;
  h.fields['numeric-formula-select'].value = 'half-life';
  h.fields['numeric-input'].value = '0001.25';
  h.context.randomizeStyleParameters('numeric');
  expect(h.fields['numeric-source-select'].value).toBe('values');
  expect(h.fields['numeric-mode-select'].value).toBe(mode);
  expect(h.fields['numeric-formula-select'].value).toBe('half-life');
  expect(h.fields['numeric-input'].value).toMatch(/^[0-9]{24}$/);
  const inactive = h.fields['numeric-input'].value;
  h.fields['numeric-source-select'].value = 'formula';
  h.context.randomizeStyleParameters('numeric');
  expect(h.fields['numeric-formula-select'].value).not.toBe('half-life');
  expect(h.fields['numeric-input'].value).toBe(inactive);
  expect(h.fields['numeric-mode-select'].value).toBe(mode);
});

test.each([1, 2, 4294967294, 4294967295])('Circles seed %i changes to a valid shareable nonzero seed, including RNG endpoints', seed => {
  for (const random of [0, 1 - Number.EPSILON]) {
    const h = fixture(random); h.context.sharePatternSeed = seed;
    h.context.randomizeStyleParameters('circles');
    expect(h.context.sharePatternSeed).not.toBe(seed);
    expect(h.context.sharePatternSeed).toBeGreaterThanOrEqual(1);
    expect(h.context.sharePatternSeed).toBeLessThanOrEqual(4294967295);
    h.context.resetStyleParameters('circles'); expect(h.context.sharePatternSeed).toBe(1);
  }
});

test('targeted refresh rejects unknown keys and follows a restored seed as well as fields', () => {
  const h = fixture();
  h.context.sharePatternSeed = 37; h.context.ParameterControls.refreshStyle('circles');
  expect(h.buttons.circles.disabled).toBe(false);
  h.context.sharePatternSeed = 1; h.context.ParameterControls.refreshStyle('circles');
  expect(h.buttons.circles.disabled).toBe(true);
  h.context.ParameterControls.refreshStyle('constructor');
});

test('Quantum full recurrence and numeric range formatting use logical rather than string defaults', () => {
  const h = fixture();
  h.fields['quantum-phase'].value = '1';
  h.fields['quantum-speed-slider'].value = '1.0';
  h.context.ParameterControls.refreshStyle('wave-quantum');
  expect(h.buttons['wave-quantum'].disabled).toBe(true);
  h.context.randomizeStyleParameters('wave-quantum');
  expect(Number(h.fields['quantum-phase'].value)).toBeGreaterThan(0);
  h.fields['quantum-phase'].value = '.5'; h.context.ParameterControls.refreshStyle('wave-quantum');
  expect(h.buttons['wave-quantum'].disabled).toBe(false);
});

test('same-page shared and legacy restoration refresh action state after the complete restored model', () => {
  const h = fixture();
  let bridge;
  Object.assign(h.context, {
    BarShareState: { initialize: next => { bridge = next; } },
    sanitizeBarText: value => value, liveMotionPhase: 0, currentStaffNotes: [], currentNoteDuration: 1,
    animationTime: 0, DEFAULT_MOTION_ENABLED: false, MOTION_ENABLED_BY_STYLE: { ticker: false, waveform: false },
    styleSupportsMotion: style => ['ticker', 'waveform'].includes(style),
    matchMedia: () => ({ matches: false }), location: { search: '' },
    resetAnimationClock: jest.fn(), quantumModel: require('../js/utils/quantumModel'),
    quantumControls: { select: () => {}, pause: jest.fn(), sync: jest.fn() },
    applyUrlParameters() {
      for (const field of Object.values(h.fields)) {
        if (field.type === 'checkbox') field.checked = field.defaultChecked;
        else field.value = field.defaultValue;
      }
    }
  });
  for (const name of ['applyColorMode', 'updateBinaryData', 'updateAllDisplays', 'handleStyleChange', 'syncAllCustomSelects']) {
    h.context[name] = jest.fn();
  }
  vm.runInContext(source.slice(source.indexOf('function setupShareLinks()')), h.context);
  h.context.setupShareLinks();
  // A share can alter only the Circles seed: fields still look pristine.
  bridge.restore({ seed: 87, notes: [], duration: 1, time: 0, phase: 0 });
  bridge.refresh();
  expect(h.context.sharePatternSeed).toBe(87);
  expect(h.buttons.circles.disabled).toBe(false);
  // A canonical shared default removes that state even without an input event.
  bridge.restore({ seed: 1, notes: [], duration: 1, time: 0, phase: 0 });
  bridge.refresh();
  expect(h.buttons.circles.disabled).toBe(true);
  h.fields['binary-input'].value = 'BUILD'; h.context.ParameterControls.refresh();
  expect(h.buttons.binary.disabled).toBe(false);
  h.context.sharePatternSeed = 87;
  bridge.legacy();
  expect(h.buttons.binary.disabled).toBe(true);
  expect(h.context.sharePatternSeed).toBe(1);
  expect(h.buttons.circles.disabled).toBe(true);
  h.context.matchMedia = () => ({ matches: true });
  bridge.legacy();
  expect(Object.values(h.context.MOTION_ENABLED_BY_STYLE)).toEqual([false, false]);
});

test('default descriptions reflect authored values, not the current edited value', () => {
  const h = fixture();
  const describe = h.context.ParameterControls.defaultValueLabel;
  expect(describe(h.fields['waveform-type-slider'])).toBe('Sine');
  expect(describe(h.fields['lines-variant-slider'])).toBe('MD');
  expect(describe(h.fields['ticker-ratio-slider'])).toBe('2:1');
  expect(describe(h.fields['ticker-width-ratio-slider'])).toBe('1:2');
  expect(describe(h.fields['quantum-phase'])).toBe('0.0%');
  expect(describe(h.fields['waveform-reverse-toggle'])).toBe('Off');
  h.fields['ticker-ratio-slider'].value = 5;
  expect(describe(h.fields['ticker-ratio-slider'])).toBe('2:1');
  expect(describe({ type: 'text', defaultValue: '' })).toBe('Empty');
  expect(describe({ tagName: 'SELECT', options: [{ value: 'one', textContent: 'One' },
    { value: 'two', textContent: 'Two', defaultSelected: true }] })).toBe('Two');
});


test.each([0, .5, .999])('nucleotide Randomize varies the entered length from 30 to 50 (random %s)', random => {
  const h=fixture(random);
  const model=require('../js/utils/nucleotidePattern');
  for (const previousLength of [30,40,50]) {
    h.fields['nucleotide-input'].value=model.DEFAULT_SEQUENCE.slice(0,previousLength);
    h.fields['nucleotide-preset'].value='0';
    h.context.randomizeStyleParameters('nucleotide');
    const sequence=h.fields['nucleotide-input'].value;
    const target=sequence.length;
    expect(target).toBeGreaterThanOrEqual(30);
    expect(target).toBeLessThanOrEqual(50);
    expect(target).not.toBe(previousLength);
    expect(sequence).toHaveLength(target);
    expect(model.presets.slice(1).some(preset=>preset.sequence.slice(0,target)===sequence)).toBe(true);
  }
});
