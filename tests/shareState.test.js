const { encodeState, decodeState, normalizeState, normalizeRuntime, seededRandom, MAX_FRAGMENT_LENGTH } = require('../js/utils/shareState');
const manifest = {
  'style-select': { options: ['solid', 'binary', 'waveform', 'circles'] },
  'binary-input': { type: 'text', maxLength: 100 },
  'frequency': { type: 'range', min: 0, max: 10, step: 0.5 },
  'motion': { type: 'checkbox' }
};
const state = { v: 1, name: '探索 🚀 <img src=x>', controls: { 'style-select': 'binary', 'binary-input': 'Café 東京 🚀', frequency: '0', motion: false }, runtime: { seed: 415, phase: 0.75, time: 123, notes: [{ note: 'C#4', duration: 0.25 }], duration: 0.25 } };
const rawFragment = value => '#bar=' + Buffer.from(JSON.stringify(value)).toString('base64url');

test('Unicode, empty strings, zero values, paused phase, and names round-trip deterministically', () => {
  expect(decodeState(encodeState(state, manifest), manifest)).toEqual(state);
  const reordered = { ...state, controls: { motion: false, frequency: '0', 'binary-input': 'Café 東京 🚀', 'style-select': 'binary' } };
  expect(encodeState(state, manifest)).toEqual(encodeState(reordered, manifest));
  expect(decodeState(encodeState({ ...state, controls: { ...state.controls, 'binary-input': '' } }, manifest), manifest).controls['binary-input']).toBe('');
});

test('unknown fields are ignored without assigning arbitrary properties', () => {
  const result = normalizeState({ ...state, controls: { ...state.controls, extra: 'bad' }, runtime: { ...state.runtime, unexpected: 1 }, unexpected: true }, manifest);
  expect(result).toEqual(state);
  expect({}.unexpected).toBeUndefined();
});

test.each(['#bar=', '#bar=***', '#bar=e30', rawFragment({ ...state, v: 99 }), rawFragment({ ...state, controls: null }), '#bar=' + 'x'.repeat(MAX_FRAGMENT_LENGTH)])('rejects malformed, future and oversized snapshots case %#', fragment => {
  expect(() => decodeState(fragment, manifest)).toThrow();
});

test.each([{ motion: 'false' }, { frequency: 'NaN' }, { frequency: '-1' }, { frequency: '11' }, { frequency: '0.1' }, { 'style-select': 'unknown' }, { 'binary-input': 'a'.repeat(101) }])('rejects invalid control values %p', values => {
  expect(() => encodeState({ ...state, controls: { ...state.controls, ...values } }, manifest)).toThrow();
});

test('legacy anchors are not share snapshots; absent runtime uses bounded defaults', () => {
  expect(decodeState('#help', manifest)).toBeNull();
  expect(normalizeRuntime({ seed: -1, phase: Infinity, time: 1e15, notes: [{ note: '<script>', duration: 1 }] })).toEqual({ seed: 1, phase: 0, time: 0, duration: 1, notes: [] });
  expect(normalizeRuntime({ notes: Array.from({length:64}, () => ({note:'C4',duration:2})) }).notes).toHaveLength(8);
});

test('seeded layout randomness is reproducible, bounded, and differs by seed', () => {
  const sample = seed => { const random = seededRandom(seed); return Array.from({length:40}, random); };
  expect(sample(51)).toEqual(sample(51));
  expect(sample(51)).not.toEqual(sample(52));
  expect(sample(51).every(number => number >= 0 && number < 1)).toBe(true);
});

test('Mission Control theme remains restricted to Artemis II', () => {
  const restrictedManifest = { 'style-select': {options:['solid','lunar']}, 'color-mode-select': {options:['black','lunar']} };
  expect(() => encodeState({v:1,controls:{'style-select':'solid','color-mode-select':'lunar'}}, restrictedManifest)).toThrow(/unavailable/);
  expect(() => encodeState({v:1,controls:{'style-select':'lunar','color-mode-select':'lunar'}}, restrictedManifest)).not.toThrow();
});


test('legacy motion rates migrate narrowly before strict share validation', () => {
  const motion = require('../js/utils/loopingGif');
  const previous = global.loopingGifUtils;
  global.loopingGifUtils = motion;
  try {
    const manifest = {
        'ticker-speed-slider': { type: 'range', min: 0.08, max: 1.6, step: 0.001 },
      'waveform-speed-slider': { type: 'range', min: 0.06, max: 1.2, step: 0.001 },
      'triangles-count-slider': { type: 'range', min: 6, max: 28, step: 1 }
    };
    const controls = { 'ruler-speed-slider': '5', 'ticker-speed-slider': '999',
      'waveform-speed-slider': '0.35', 'triangles-count-slider': '14' };
    const raw = '#bar=' + Buffer.from(JSON.stringify({ v: 1, controls })).toString('base64url');
    const decoded = decodeState(raw, manifest);
    const { 'ruler-speed-slider': obsoleteRulerSpeed, ...currentControls } = controls;
    expect(decoded.controls).toEqual({ ...currentControls,
      'ticker-speed-slider': '1.6', 'waveform-speed-slider': '0.35' });
    const invalid = '#bar=' + Buffer.from(JSON.stringify({ v: 1,
      controls: { ...controls, 'triangles-count-slider': '999' } })).toString('base64url');
    expect(() => decodeState(invalid, manifest)).toThrow();
  } finally { global.loopingGifUtils = previous; }
});

test('Ticker validates width against the restored count ratio rather than the previous page maximum', () => {
  const previous = global.getTickerWidthRatioMax;
  global.getTickerWidthRatioMax = require('../js/utils/tickerDisplay').getTickerWidthRatioMax;
  const manifest = { 'ticker-ratio-slider': {type:'range',min:1,max:5,step:1}, 'ticker-width-ratio-slider': {type:'range',min:1,max:3,step:1} };
  try {
    const state = {v:1,controls:{'ticker-ratio-slider':'5','ticker-width-ratio-slider':'10'}};
    expect(decodeState(encodeState(state,manifest),manifest).controls['ticker-width-ratio-slider']).toBe('10');
    expect(() => encodeState({...state,controls:{...state.controls,'ticker-ratio-slider':'2'}},manifest)).toThrow(/out-of-range/);
  } finally {
    if (previous === undefined) delete global.getTickerWidthRatioMax;
    else global.getTickerWidthRatioMax = previous;
  }
});

test('old triangle grid snapshots retain preset rows without overwriting new custom values',()=>{
  const schema={'triangle-grid-variant-slider':{options:['1','2','3']}};
  for(const [key,min,max] of [['rows',1,6],['density',50,150],['stroke',40,160],['stagger',0,100]]) schema[`triangle-grid-${key}`]={type:'range',min,max,step:1};
  expect(normalizeState({v:1,controls:{'triangle-grid-variant-slider':'3','triangle-grid-stagger':'0'}},schema).controls).toMatchObject({'triangle-grid-rows':'4','triangle-grid-density':'100','triangle-grid-stroke':'100','triangle-grid-stagger':'0'});
});

test('legacy gradient shares derive new controls from their preset, preserving explicit custom zeroes', () => {
  const schema = {'circles-gradient-variant-slider':{options:['1','2','3']}};
  for (const [key,min,max] of [['columns',8,48],['rows',1,5],['size',25,100],['contrast',0,100],['stagger',0,100]]) schema[`circles-gradient-${key}`]={type:'range',min,max,step:1};
  schema['circles-gradient-reverse']={type:'checkbox'};
  const controls=normalizeState({v:1,controls:{'circles-gradient-variant-slider':'2','circles-gradient-contrast':'0'}},schema).controls;
  expect(controls).toMatchObject({'circles-gradient-columns':'24','circles-gradient-rows':'2','circles-gradient-contrast':'0','circles-gradient-stagger':'0','circles-gradient-reverse':false});
  expect(()=>normalizeState({v:1,controls:{'circles-gradient-columns':'999'}},schema)).toThrow();
});

test('nucleotide ignores retired target controls and preserves actual bases up to 50', () => {
  const {normalizeState}=require('../js/utils/shareState');
  const manifest={'nucleotide-input':{type:'text',maxLength:50}};
  for (const count of [5,30,40,50,60]) {
    const state=normalizeState({v:1,name:'',controls:{'nucleotide-input':'a'.repeat(count),'nucleotide-length':'30'},runtime:{}},manifest);
    expect(state.controls['nucleotide-input']).toBe('A'.repeat(Math.min(50,count)));
    expect(state.controls).not.toHaveProperty('nucleotide-length');
  }
});


test('new LFO snapshots preserve a bounded optional modulation phase without changing old snapshots', () => {
  expect(normalizeRuntime({lfoPhase:.37})).toMatchObject({lfoPhase:.37});
  expect(normalizeRuntime({lfoPhase:2})).toMatchObject({lfoPhase:0});
  expect(normalizeRuntime({})).not.toHaveProperty('lfoPhase');
});

test('retired color compositions restore safely without losing their other settings', () => {
  const schema = { ...manifest, 'color-mode-select': { options: ['black', 'white', 'white-on-red', 'gray-on-red', 'blue', 'gray', 'silver'] } };
  for (const [legacy, fallback] of [['red', 'black'], ['red-on-white', 'black'], ['gray-on-red', 'gray-on-red'], ['blue', 'blue'], ['gray', 'gray'], ['silver', 'silver']]) {
    const old = { ...state, controls: { ...state.controls, 'color-mode-select': legacy } };
    const restored = decodeState(rawFragment(old), schema);
    expect(restored.controls).toEqual({ ...state.controls, 'color-mode-select': fallback });
    expect(restored.runtime).toEqual(state.runtime);
    expect(restored.name).toBe(state.name);
    expect(old.controls['color-mode-select']).toBe(legacy);
  }
  expect(() => decodeState(rawFragment({ ...state, controls: { ...state.controls, 'color-mode-select': 'unknown-theme' } }), schema)).toThrow();
});
