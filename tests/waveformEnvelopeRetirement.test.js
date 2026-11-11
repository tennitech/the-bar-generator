const { normalizeState } = require('../js/utils/shareState');
test('old shares drop retired envelope fields while preserving waveform controls', () => {
  const manifest = {
    'waveform-type-slider': { type: 'range', min: 0, max: 3 },
    'waveform-frequency-slider': { type: 'range', min: 10, max: 100 }
  };
  const result = normalizeState({ v: 1, controls: {
    'waveform-type-slider': '2', 'waveform-frequency-slider': '36',
    'waveform-envelope-toggle': true, 'waveform-envelope-type': 'inverse',
    'waveform-envelope-waves-slider': '6', 'waveform-envelope-center-slider': '.4'
  } }, manifest);
  expect(result.controls).toEqual({ 'waveform-type-slider': '2', 'waveform-frequency-slider': '36' });
});
