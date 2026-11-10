const fs = require('node:fs');
const vm = require('node:vm');
const lfo = require('../js/utils/waveformLfo');
const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
function runtime() {
  const fields = Object.fromEntries(['toggle','rate','depth','type'].map((name,i)=>[`waveform-lfo-${name}`,{
    checked:i===0,value:[true,2,100,0][i],setAttribute:jest.fn()
  }]));
  const context = {
    window:{WaveformLfo:lfo},document:{getElementById:id=>fields[id],querySelector:()=>null},
    style:'waveform',running:true,clampLiveAnimationDeltaMs:delta=>Math.min(50,Math.max(0,delta)),
    getCurrentMotionStyle:()=>context.style,isMotionEnabledForStyle:()=>context.running,
    waveformLfoVoice:null,waveformVisualLfo:null,waveformLfoTime:0,waveformScopeTime:0,lastWaveformLfoTimestamp:0,
    updateWaveformScopeControls:jest.fn(),waveformSpeedSlider:{value:.3},waveformReverseToggle:{checked:false},
    waveformLfoFrame:{phase:0,rate:2,amount:0,amplitude:1}
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function getWaveformLfoSettings()'),source.indexOf('function getCurrentAudioPreviewType()')),context);
  context.updateWaveformLfoControls();
  return {context,fields};
}
test('silent playback holds through pause, hidden/intro suspension and style changes without catch-up',()=>{
  const {context:c}=runtime();c.tickWaveformVisualLfo(100);c.tickWaveformVisualLfo(150);
  expect(c.waveformLfoTime).toBe(.05);const phase=c.waveformLfoFrame.phase;
  c.running=false;c.tickWaveformVisualLfo(8000);expect(c.waveformLfoFrame.phase).toBe(phase);
  c.running=true;c.tickWaveformVisualLfo(8010);expect(c.waveformLfoTime).toBeCloseTo(.06);
  c.tickWaveformVisualLfo(8020,true);c.tickWaveformVisualLfo(20000);expect(c.waveformLfoTime).toBeCloseTo(.06);
  c.style='ticker';c.tickWaveformVisualLfo(21000);c.style='waveform';c.tickWaveformVisualLfo(30000);
  expect(c.waveformLfoTime).toBeCloseTo(.06);
});
test('audio-clock frames drive both renderers, and silent handoff keeps phase',()=>{
  const {context:c}=runtime();
  const audio=lfo.createTransport({enabled:true,rate:2,depth:100});
  c.waveformLfoVoice={sample:()=>audio.sample(.123),update:jest.fn()};c.tickWaveformVisualLfo(100);
  expect(c.waveformLfoFrame.phase).toBeCloseTo(.246,10);
  c.waveformLfoVoice=null;c.tickWaveformVisualLfo(110);
  expect(c.waveformLfoFrame.phase).toBeCloseTo(.266,10);
});
test('reduced-motion parameter editing and Reset leave a stable bounded bar',()=>{
  const {context:c,fields}=runtime();c.running=false;
  fields['waveform-lfo-rate'].value=1300;fields['waveform-lfo-type'].value=3;c.updateWaveformLfoControls();
  expect(c.waveformLfoFrame.amplitude).toBe(0);
  const phase=c.waveformLfoFrame.phase;c.tickWaveformVisualLfo(10000);expect(c.waveformLfoFrame.phase).toBe(phase);
  c.resetWaveformLfo();expect(c.waveformLfoFrame.amplitude).toBe(1);expect(c.waveformLfoFrame.phase).toBe(0);
  expect(fields['waveform-lfo-toggle'].checked).toBe(false);
});


test('Loop freezes the scope and explicit reset still resets carrier phase', () => {
  const {context:c}=runtime();
  const frame={extrema:[-.04,.08,-.09,.03],seconds:1,gainScale:.1,source:'offline'};
  c.window.waveformScopeController={frame:()=>frame,tick:jest.fn(),status:()=>''};
  Object.assign(c, { createWaveformPatternGeometry:require('../js/utils/barPattern').createWaveformPatternGeometry,
    MOTION_ENABLED_BY_STYLE:{waveform:true}, normalizeStyleValue:x=>x,styleSupportsMotion:()=>true,
    lastAnimationFrameTimestamp:123,resetAnimationClock:jest.fn(),syncMotionToggleState:jest.fn(),requestUpdate:jest.fn() });
  vm.runInContext(source.slice(source.indexOf('function getLiveWaveformGeometry('),source.indexOf('function getWaveformLfoSettings()')),c);
  vm.runInContext(source.slice(source.indexOf('function setMotionEnabledForStyle('),source.indexOf('function generateRandomStaffPattern(')),c);
  const before=c.getLiveWaveformGeometry(0,0,250,18,0);
  c.setMotionEnabledForStyle('waveform',false);c.running=false;c.tickWaveformVisualLfo(5000);
  expect(c.window.waveformScopeController.tick).toHaveBeenLastCalledWith(0,false,false);
  expect(c.getLiveWaveformGeometry(0,0,250,18,0)).toEqual(before);
  expect(c.resetAnimationClock).not.toHaveBeenCalled();
  c.setMotionEnabledForStyle('waveform',true,{resetPhase:true});
  expect(c.resetAnimationClock).toHaveBeenCalledTimes(1);
});
