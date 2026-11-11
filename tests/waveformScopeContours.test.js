global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const {createWaveformPatternGeometry:geometry}=require('../js/utils/barPattern');
const sampleRate=48000,pairRate=6000;
const base={note:24,type:0};
function record(v) {
  const seconds=scope.duration(v),display=scope.displaySettings(v);
  const pcm=Float32Array.from({length:Math.ceil((seconds+display.replayLimit+.7)*sampleRate/8)*8},(_,i)=>{
    const t=i/sampleRate,hz=WaveformAudio.frequency(v.note);
    return .1*Math.sin(2*Math.PI*hz*t);
  });
  return {pcm,captured:scope.recording(scope.pcmExtrema(pcm),pairRate,seconds,'offline',display,pcm)};
}
test('sparse sine uses ordered real PCM and fractional-sample interpolation, with a smooth single contour at 400%',()=>{
  const {pcm,captured}=record(base),start=.0123456,frame=captured.frame(start);
  expect(frame.displayMode).toBe('trace');expect(frame.trace.length).toBeGreaterThan(1400);
  const source=start*sampleRate,index=Math.floor(source),f=source-index;
  expect(frame.trace[0]).toBeCloseTo(pcm[index]+(pcm[index+1]-pcm[index])*f,12);
  const shifted=captured.frame(start+1/(sampleRate*10));
  expect(shifted.trace[0]).not.toBe(frame.trace[0]);
  const g=geometry({waveformScope:frame,exactBarWidth:4000,barHeight:288});
  for(let i=1;i<g.curve.length;i++)expect(g.curve[i].x).toBeGreaterThan(g.curve[i-1].x);
  expect(g.curve[1].x-g.curve[0].x).toBeCloseTo(4000/(frame.trace.length-1),8);
  // One real C1 carrier cycle has two extrema, without bin-local teeth.
  let turns=0;
  for(let i=1;i<g.curve.length-1;i++)if((g.curve[i].y-g.curve[i-1].y)*(g.curve[i+1].y-g.curve[i].y)<0)turns++;
  expect(turns).toBe(2);
});
test('all carrier frequencies keep ordered PCM and ignore old modulation fields',()=>{
  for(const note of [24,49,84]) {
    const v={...base,note,lfo:{enabled:true,rate:.07,depth:100}}, {captured}=record(v);
    expect(captured.frame(0).displayMode).toBe('trace');expect(captured.frame(0).trace.length).toBeGreaterThan(300);
    expect(scope.sweepSpan(v)*WaveformAudio.frequency(note)).toBeCloseTo(1,12);
  }
});
test('live worklet ordered samples survive freeze and carrier reconfiguration without replacing the audio route',async()=>{
  let node;const input={connect:jest.fn(),disconnect:jest.fn()};
  const c=scope.createController({environment:{AudioWorkletNode:class{constructor(){node=this;this.port={};}connect(){}disconnect(){}}}});
  c.configure(base);await c.attach({sampleRate,audioWorklet:{addModule:async()=>{}},destination:{}},input);
  try {
    const {pcm}=record(base);node.port.onmessage({data:{pcm,extrema:scope.pcmExtrema(pcm)}});c.tick(0);
    expect(c.frame().trace.length).toBeGreaterThan(1400);const held=c.capture();c.tick(0,false);
    c.configure({...base,note:84});c.tick(4,false);
    expect(c.frame()).toBe(held.frame);expect(c.capture().recording).toBe(held.recording);
    expect(input.connect).toHaveBeenCalledTimes(1);expect(input.disconnect).not.toHaveBeenCalled();
  } finally {c.dispose();}
});

test('one-second PCM ring wraps correctly and survives low-to-high pitch reconfiguration',async()=>{
  let node;const c=scope.createController({environment:{AudioWorkletNode:class{constructor(){node=this;this.port={};}connect(){}disconnect(){}}}});
  c.configure(base);await c.attach({sampleRate,audioWorklet:{addModule:async()=>{}},destination:{}},{connect(){},disconnect(){}});
  try {
    const pcm=Float32Array.from({length:sampleRate*2},(_,i)=>.1*Math.sin(i*.037)),data=scope.pcmExtrema(pcm);
    node.port.onmessage({data:{pcm,extrema:data}});c.tick(0);
    const display=scope.displaySettings(base),seconds=scope.duration(base),count=Math.floor((seconds+display.replayLimit)*pairRate+1e-9);
    const first=data.length/2-count,reference=scope.recording(data.subarray(first*2),pairRate,seconds,'live',display,pcm.subarray(first*8));
    const view=scope.sweep(reference,base),expected=reference.frame(view.origin).trace;
    expect(c.frame().trace).toEqual(expected);
    c.configure({...base,note:84});node.port.onmessage({data:{pcm,extrema:data}});c.tick(0);expect(c.frame().trace.length).toBeGreaterThan(300);
    c.configure(base);node.port.onmessage({data:{pcm,extrema:data}});c.tick(0);expect(c.frame().trace).toEqual(expected);
  } finally {c.dispose();}
});
