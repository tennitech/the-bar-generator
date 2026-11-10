global.WaveformLfo=require('../js/utils/waveformLfo');
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const {getLoopingGifFramePlan:plan}=require('../js/utils/loopingGif');
const base={frequency:24,type:0,lfo:{enabled:true,rate:2,depth:100,type:0}};
const rate=6000;
function samples(v,seconds=4) {
  const hz=WaveformAudio.frequency(v.frequency);
  return Float32Array.from({length:Math.ceil(seconds*rate)*2},(_,i)=> {
    const t=Math.floor(i/2)/rate;
    return .1*Math.sin(2*Math.PI*hz*t)*(v.lfo.enabled?1-v.lfo.depth/200+v.lfo.depth/200*Math.sin(2*Math.PI*v.lfo.rate*t):1);
  });
}
test('default sweep scans at most one fastest-detail cycle over 3.333 display seconds for every carrier/LFO rate and depth',()=>{
  for(const frequency of [10,24,100])for(const enabled of [false,true])for(const lfoRate of [.07,2,1300])for(const depth of [0,25,100]) {
    const v={...base,frequency,lfo:{...base.lfo,enabled,rate:lfoRate,depth}};
    const fastest=Math.max(WaveformAudio.frequency(frequency),enabled&&depth>0?lfoRate:0);
    expect(scope.sweepSpan(v)*fastest).toBeCloseTo(1,12);
    const captured=scope.recording(samples(v),rate,.1,'offline');
    const view=scope.sweep(captured,v),first=captured.frame(view.origin);
    const forward=scope.sweepReplay(view,0,first,false),reverse=scope.sweepReplay(view,0,first,true);
    expect(forward.playbackSeconds).toBeCloseTo(1/.3,12);
    expect(forward.frame(view.span/4)).toEqual(captured.frame(view.origin+view.span/4));
    expect(reverse.frame(view.span/4)).toEqual(captured.frame(view.origin+view.span*3/4));
    expect(forward.frame(0)).toBe(first);expect(forward.frame(view.span)).toBe(first);
    for(const speed of [.06,.3,1.2]) {
      const p=plan('waveform',{waveformScope:first,waveformScopeReplaySeconds:forward.replaySeconds,waveformScopePlaybackSeconds:forward.playbackSeconds,waveformSpeed:speed});
      expect(p.periodSeconds).toBeCloseTo(1/speed,12);expect(p.frameCount).toBeGreaterThan(2);
    }
  }
});
test('actual rising crossings trigger the captured source without reconstructed values',()=>{
  const data=samples({...base,lfo:{enabled:false}}),recorded=scope.recording(data,rate,.1,'live');
  const view=scope.sweep(recorded,base),index=Math.round(view.origin*rate);
  expect(data[index*2]).toBeGreaterThan(0);expect(data[(index-1)*2]).toBeLessThanOrEqual(0);
  expect(view.origin+view.span).toBeLessThanOrEqual(recorded.replaySeconds);
});
test('live playback honors motion time without incoming packets, ignores packet jitter within a sweep and freezes exact exports',async()=>{
  let node;
  const c=scope.createController({environment:{AudioWorkletNode:class {constructor(){node=this;this.port={};}connect(){}disconnect(){}}}});
  c.configure(base);
  await c.attach({sampleRate:rate*8,audioWorklet:{addModule:async()=>{}},destination:{}},{connect(){},disconnect(){}});
  try {
    node.port.onmessage({data:samples(base)});c.tick(0);const first=c.capture();
    c.tick(1);expect(c.frame()).toEqual(first.recording.frame(first.recording.replaySeconds*.3));
    node.port.onmessage({data:new Float32Array(512).fill(.099)});c.tick(1);
    expect(c.frame()).toEqual(first.recording.frame(first.recording.replaySeconds*.3));
    c.tick(1,false);const frozen=c.capture();c.tick(99,false,true);expect(c.frame()).toBe(frozen.frame);
    c.tick(4,true);expect(c.status()).toContain('slowed sample sweep');
    expect(first.recording.frame(0)).toBe(first.frame);
    c.configure({...base,type:2,lfo:{...base.lfo,depth:25}});c.tick(4);
    expect(c.frame().seconds).toBe(1);expect(c.frame().parameterChanges).toBe(true);
  } finally {c.dispose();}
});
