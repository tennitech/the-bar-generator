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
