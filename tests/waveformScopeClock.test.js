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
test('Reverse changes only the sign of subsequent clock increments', () => {
  const { context: c } = runtime();
  c.tickWaveformScope(100);
  c.tickWaveformScope(150);
  c.waveformReverseToggle.checked = true;
  expect(c.waveformScopeTime).toBeCloseTo(.05);
  c.tickWaveformScope(175);
  expect(c.waveformScopeTime).toBeCloseTo(.025);
  c.tickWaveformScope(225);
  expect(c.waveformScopeTime).toBeCloseTo(-.025);
});

test('Reset restarts the scope clock without adding modulation state',()=>{
  const {context:c}=runtime();c.tickWaveformScope(100);c.tickWaveformScope(150);
  c.resetWaveformScope();expect(c.waveformScopeTime).toBe(0);expect(c.lastWaveformScopeTimestamp).toBe(0);
  expect(c.updateWaveformScopeControls).toHaveBeenCalledTimes(1);
});

test('Waveform Loop resets both clocks and repaints the scope from the default phase', () => {
  const { context: c } = runtime();
  const scope = { tick: jest.fn(), resetSweep: jest.fn() };
  c.window.waveformScopeController = scope;
  Object.assign(c, {
    MOTION_ENABLED_BY_STYLE: { waveform: true },
    normalizeStyleValue: value => value,
    styleSupportsMotion: () => true,
    resetAnimationClock: jest.fn(),
    syncMotionToggleState: jest.fn(),
    requestUpdate: jest.fn()
  });
  vm.runInContext(source.slice(source.indexOf('function setMotionEnabledForStyle('), source.indexOf('function generateRandomStaffPattern(')), c);
  for (const enabled of [false, true]) {
    c.waveformScopeTime = .62;
    c.setMotionEnabledForStyle('waveform', enabled);
    c.running = enabled;
    c.tickWaveformScope(5000);
    expect(scope.tick).toHaveBeenLastCalledWith(0, enabled);
  }
  expect(scope.resetSweep).toHaveBeenCalledTimes(2);
  expect(c.resetAnimationClock).toHaveBeenCalledTimes(2);
});
