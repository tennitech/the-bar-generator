global.WaveformLfo=require('../js/utils/waveformLfo');
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const {createWaveformPatternGeometry:geometry}=require('../js/utils/barPattern');
const sampleRate=48000,pairRate=6000;
const base={frequency:10,type:0,lfo:{enabled:false,rate:2,depth:100,type:0}};
function record(v) {
  const seconds=scope.duration(v),display=scope.displaySettings(v);
  const pcm=Float32Array.from({length:Math.ceil((seconds+display.replayLimit)*sampleRate)},(_,i)=>{
    const t=i/sampleRate,hz=WaveformAudio.frequency(v.frequency);
    return .1*Math.sin(2*Math.PI*hz*t)*(v.lfo.enabled?(.5+.5*Math.sin(2*Math.PI*v.lfo.rate*t)):1);
  });
  return {pcm,captured:scope.recording(scope.pcmExtrema(pcm),pairRate,seconds,'offline',display,pcm)};
}
test('sparse sine uses ordered real PCM and fractional-sample interpolation, with a smooth single contour at 400%',()=>{
  const {pcm,captured}=record(base),start=.0123456,frame=captured.frame(start);
  expect(frame.displayMode).toBe('trace');expect(frame.trace.length).toBeGreaterThan(5000);
  const source=start*sampleRate,index=Math.floor(source),f=source-index;
  expect(frame.trace[0]).toBeCloseTo(pcm[index]+(pcm[index+1]-pcm[index])*f,12);
  const shifted=captured.frame(start+1/(sampleRate*10));
  expect(shifted.trace[0]).not.toBe(frame.trace[0]);
  const g=geometry({waveformScope:frame,exactBarWidth:4000,barHeight:288});
  for(let i=1;i<g.curve.length;i++)expect(g.curve[i].x).toBeGreaterThan(g.curve[i-1].x);
  expect(g.curve[1].x-g.curve[0].x).toBeCloseTo(4000/(frame.seconds*sampleRate),8);
  // Four real carrier cycles have eight extrema, without bin-local teeth.
  let turns=0;
  for(let i=1;i<g.curve.length-1;i++)if((g.curve[i].y-g.curve[i-1].y)*(g.curve[i+1].y-g.curve[i].y)<0)turns++;
  expect(turns).toBe(8);
});
test('dense peak envelope has independent upper/lower contours bounded by measured extrema and visible LFO travel',()=>{
  for(const rate of [.07,2]) {
    const v={...base,lfo:{...base.lfo,enabled:true,rate}}, {captured}=record(v);
    const view=scope.sweep(captured,v),a=captured.frame(view.origin),b=captured.frame(view.origin+view.span/4);
    expect(a.displayMode).toBe('envelope');expect(a.trace).toBeUndefined();
    expect(view.span*rate).toBeCloseTo(1,12);
    expect(Math.max(...a.extrema.map((x,i)=>Math.abs(x-b.extrema[i])))).toBeGreaterThan(.02);
    const g=geometry({waveformScope:a,exactBarWidth:4000,barHeight:288});
    const top=g.polygon.filter(p=>p.y<144),bottom=g.polygon.filter(p=>p.y>144);
    for(let i=1;i<top.length;i++)expect(top[i].x).toBeGreaterThanOrEqual(top[i-1].x);
    for(let i=1;i<bottom.length;i++)expect(bottom[i].x).toBeLessThanOrEqual(bottom[i-1].x);
    expect(Math.min(...g.polygon.map(p=>p.y))).toBeGreaterThanOrEqual(144-144*Math.max(...a.extrema)/.1-1e-8);
    expect(Math.max(...g.polygon.map(p=>p.y))).toBeLessThanOrEqual(144-144*Math.min(...a.extrema)/.1+1e-8);
  }
});
test('high LFO rates retain ordered PCM detail rather than drawing a slow-envelope estimate',()=>{
  const v={...base,frequency:100,lfo:{...base.lfo,enabled:true,rate:1300}}, {captured}=record(v);
  expect(captured.frame(0).displayMode).toBe('trace');expect(captured.frame(0).trace.length).toBeGreaterThan(300);
});
test('live worklet ordered samples survive freeze and long-ring reconfiguration without replacing the audio route',async()=>{
  let node;const input={connect:jest.fn(),disconnect:jest.fn()};
  const c=scope.createController({environment:{AudioWorkletNode:class{constructor(){node=this;this.port={};}connect(){}disconnect(){}}}});
  c.configure(base);await c.attach({sampleRate,audioWorklet:{addModule:async()=>{}},destination:{}},input);
  try {
    const {pcm}=record(base);node.port.onmessage({data:{pcm,extrema:scope.pcmExtrema(pcm)}});c.tick(0);
    expect(c.frame().trace.length).toBeGreaterThan(5000);const held=c.capture();c.tick(0,false);
    c.configure({...base,lfo:{...base.lfo,enabled:true,rate:.07}});c.tick(4,false);
    expect(c.frame()).toBe(held.frame);expect(c.capture().recording).toBe(held.recording);
    expect(input.connect).toHaveBeenCalledTimes(1);expect(input.disconnect).not.toHaveBeenCalled();
  } finally {c.dispose();}
});

test('one-second PCM ring wraps correctly and survives slow-to-sparse reconfiguration',async()=>{
  let node;const c=scope.createController({environment:{AudioWorkletNode:class{constructor(){node=this;this.port={};}connect(){}disconnect(){}}}});
  c.configure(base);await c.attach({sampleRate,audioWorklet:{addModule:async()=>{}},destination:{}},{connect(){},disconnect(){}});
  try {
    const pcm=Float32Array.from({length:sampleRate*2},(_,i)=>.1*Math.sin(i*.037)),data=scope.pcmExtrema(pcm);
    node.port.onmessage({data:{pcm,extrema:data}});c.tick(0);
    const display=scope.displaySettings(base),seconds=scope.duration(base),count=Math.floor((seconds+display.replayLimit)*pairRate+1e-9);
    const first=data.length/2-count,reference=scope.recording(data.subarray(first*2),pairRate,seconds,'live',display,pcm.subarray(first*8));
    const view=scope.sweep(reference,base),expected=reference.frame(view.origin).trace;
    expect(c.frame().trace).toEqual(expected);
    c.configure({...base,lfo:{...base.lfo,enabled:true,rate:.07}});c.tick(0);expect(c.frame().trace).toBeUndefined();
    c.configure(base);c.tick(0);expect(c.frame().trace).toEqual(expected);
  } finally {c.dispose();}
});
