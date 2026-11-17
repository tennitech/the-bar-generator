const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));

test('Ticker and Binary never advertise or start audio; supported styles still do', () => {
  const context = { currentShader: 2, isMissionControlThemeActive: () => true };
  vm.runInNewContext(extract('getCurrentAudioPreviewType', 'getActiveAudioPreviewType'), context);
  for (const [shader, expected] of [[2, null], [3, null], [4, 'waveform'], [7, 'morse'], [10, 'staff'], [24, 'lunar']]) {
    context.currentShader = shader;
    expect(context.getCurrentAudioPreviewType()).toBe(expected);
  }
  expect(html).not.toMatch(/(?:ticker|binary)-audio-btn/);
  expect(source).not.toMatch(/tickerAudioBtn|scheduleTickerNote|startSequenceAudio\('ticker'\)/);
  vm.runInNewContext(extract('startSequenceAudio', 'stopSequenceAudio'), context);
  context.sequenceContext = { active: false };
  for (const type of ['ticker', 'binary']) {
    context.startSequenceAudio(type);
    expect(context.sequenceContext.active).toBe(false);
  }
});

test('a user start resumes prefixed Web Audio and an interrupted request cannot play after cancellation', async () => {
  let finishResume;
  const context = {
    isAudioPlaying: false,
    audioStartRequest: null,
    audioContext: undefined,

    getCurrentAudioPreviewType: () => 'waveform',
    getActiveAudioPreviewType: () => null,
    sequenceContext: {},
    window: {},
    updateAudioControlsUI: jest.fn(),
    startWaveformAudio: jest.fn(),
    console
  };
  context.window.webkitAudioContext = class {
    state = 'interrupted';
    createGain() { return { gain: {}, connect() {} }; }
    resume() {
      return new Promise(resolve => {
        finishResume = () => { this.state = 'running'; resolve(); };
      });
    }
  };
  vm.runInNewContext(extract('initializeAudio', 'updateStaffEffects'), context);
  vm.runInNewContext('async ' + extract('startAudio', 'startWaveformAudio'), context);
  vm.runInNewContext(extract('stopAudio', 'stopArtemisMissionAudio'), context);

  const cancelled = context.startAudio();
  expect(context.audioContext.state).toBe('interrupted');
  expect(context.startWaveformAudio).not.toHaveBeenCalled();
  context.stopAudio();
  finishResume();
  await cancelled;
  expect(context.startWaveformAudio).not.toHaveBeenCalled();

  await context.startAudio();
  expect(context.startWaveformAudio).toHaveBeenCalledTimes(1);
});
