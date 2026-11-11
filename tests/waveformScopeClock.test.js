const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
function runtime() {
  const context = {
    window:{},document:{getElementById:()=>null},
    style:'waveform',running:true,clampLiveAnimationDeltaMs:delta=>Math.min(50,Math.max(0,delta)),
    getCurrentMotionStyle:()=>context.style,isMotionEnabledForStyle:()=>context.running,
    waveformScopeTime:0,lastWaveformScopeTimestamp:0,
    updateWaveformScopeControls:jest.fn(),waveformSpeedSlider:{value:.3},waveformReverseToggle:{checked:false}
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function tickWaveformScope('),source.indexOf('function getCurrentAudioPreviewType()')),context);
  return {context};
}
test('silent playback holds through pause, hidden/intro suspension and style changes without catch-up',()=>{
  const {context:c}=runtime();c.tickWaveformScope(100);c.tickWaveformScope(150);
  expect(c.waveformScopeTime).toBe(.05);const phase=c.waveformScopeTime;
  c.running=false;c.tickWaveformScope(8000);expect(c.waveformScopeTime).toBe(phase);
  c.running=true;c.tickWaveformScope(8010);expect(c.waveformScopeTime).toBeCloseTo(.06);
  c.tickWaveformScope(8020,true);c.tickWaveformScope(20000);expect(c.waveformScopeTime).toBeCloseTo(.06);
  c.style='ticker';c.tickWaveformScope(21000);c.style='waveform';c.tickWaveformScope(30000);
  expect(c.waveformScopeTime).toBeCloseTo(.06);
});
test('Reset restarts the scope clock without adding modulation state',()=>{
  const {context:c}=runtime();c.tickWaveformScope(100);c.tickWaveformScope(150);
  c.resetWaveformScope();expect(c.waveformScopeTime).toBe(0);expect(c.lastWaveformScopeTimestamp).toBe(0);
  expect(c.updateWaveformScopeControls).toHaveBeenCalledTimes(1);
});

test('Loop freezes the scope and explicit reset still resets carrier phase', () => {
  const {context:c}=runtime();
  const frame={extrema:[-.04,.08,-.09,.03],seconds:1,gainScale:.1,source:'offline'};
  c.window.waveformScopeController={frame:()=>frame,tick:jest.fn(),status:()=>''};
  Object.assign(c, { createWaveformPatternGeometry:require('../js/utils/barPattern').createWaveformPatternGeometry,
    MOTION_ENABLED_BY_STYLE:{waveform:true}, normalizeStyleValue:x=>x,styleSupportsMotion:()=>true,
    lastAnimationFrameTimestamp:123,resetAnimationClock:jest.fn(),syncMotionToggleState:jest.fn(),requestUpdate:jest.fn() });
  vm.runInContext(source.slice(source.indexOf('function getLiveWaveformGeometry('),source.indexOf('function tickWaveformScope(')),c);
  vm.runInContext(source.slice(source.indexOf('function setMotionEnabledForStyle('),source.indexOf('function generateRandomStaffPattern(')),c);
  const before=c.getLiveWaveformGeometry(0,0,250,18,0);
  c.setMotionEnabledForStyle('waveform',false);c.running=false;c.tickWaveformScope(5000);
  expect(c.window.waveformScopeController.tick).toHaveBeenLastCalledWith(0,false,false);
  expect(c.getLiveWaveformGeometry(0,0,250,18,0)).toEqual(before);
  expect(c.resetAnimationClock).not.toHaveBeenCalled();
  c.setMotionEnabledForStyle('waveform',true,{resetPhase:true});
  expect(c.resetAnimationClock).toHaveBeenCalledTimes(1);
});
