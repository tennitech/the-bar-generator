const fs = require('node:fs');
const { normalizeState, decodeState, encodeState } = require('../js/utils/shareState');
const read = name => fs.readFileSync(require.resolve(`../${name}`), 'utf8');

test('legacy encoded shares discard all modulation fields and retain carrier, motion and other family settings', () => {
  const manifest = {
    'style-select': { options: ['waveform', 'ticker'] },
    'waveform-type-slider': { type: 'range', min: 0, max: 3, step: .01 },
    'waveform-frequency-slider': { type: 'range', min: 10, max: 100, step: 1 },
    'waveform-speed-slider': { type: 'range', min: .06, max: 1.2, step: .001 },
    'waveform-reverse-toggle': { type: 'checkbox' },
    'waveform-motion-toggle': { type: 'checkbox' },
    'ticker-repeats-slider': { type: 'range', min: 1, max: 100 }
  };
  const controls = {'style-select':'waveform','waveform-type-slider':'2.5','waveform-frequency-slider':'70',
    'waveform-speed-slider':'.6','waveform-reverse-toggle':true,'waveform-motion-toggle':false,'ticker-repeats-slider':'19'};
  const legacy = {v:1,name:'Saved carrier',controls:{...controls,'waveform-lfo-toggle':true,
    'waveform-lfo-rate':'.07','waveform-lfo-depth':'100','waveform-lfo-type':'3','waveform-lfo-rate-position':'.9'},
    runtime:{seed:42,phase:.4,time:8,lfoPhase:.8}};
  const fragment='#bar='+Buffer.from(JSON.stringify(legacy)).toString('base64url');
  const actual=decodeState(fragment,manifest),expected=normalizeState({v:1,name:legacy.name,controls,runtime:{seed:42,phase:.4,time:8}},manifest);
  expect(actual).toEqual(expected);
  const encoded=encodeState(actual,manifest);
  expect(Buffer.from(encoded.slice(5),'base64url').toString()).not.toMatch(/lfo/i);
  expect(decodeState(encoded,manifest)).toEqual(expected);
});

test('runtime, markup, export snapshots and bootstrap have no Waveform modulation dependency', () => {
  for (const name of ['js/main.js','js/drawing.js','js/utils/generatorParameters.js','js/utils/shareState.js',
    'js/utils/waveformAudio.js','js/utils/waveformScope.js','js/generatorBootstrap.js','generator/index.html','css/style.css']) {
    expect(read(name)).not.toMatch(/WaveformLfo|waveformLfo|waveform[-_]lfo|lfoPhase|triggerEnvelopeBefore/);
  }
  expect(read('js/utils/barInformation.js')).not.toContain('LFO');
  expect(fs.existsSync(require('node:path').resolve(__dirname,'../js/utils/waveformLfo.js'))).toBe(false);
});
