const fs = require('node:fs');
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
test('live controls and render collection no longer expose spatial-only envelope', () => {
  expect(fs.readFileSync(require.resolve('../generator/index.html'), 'utf8')).not.toContain('waveform-envelope');
  expect(fs.readFileSync(require.resolve('../js/main'), 'utf8')).not.toMatch(/waveformEnvelope|envelopeSettingsGroup/);
  expect(fs.readFileSync(require.resolve('../js/utils/barInformation'), 'utf8')).not.toContain('motion and envelope');
});
