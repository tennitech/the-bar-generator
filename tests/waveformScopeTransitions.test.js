global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const {createWaveformPatternGeometry:geometry}=require('../js/utils/barPattern');
const base={note:24,type:0};
const pairRate=1000;
async function live(initial=base,extra={}) {
  let node;
  const environment={...extra,AudioWorkletNode:class {constructor(){node=this;this.port={};}connect(){}disconnect(){}}};
  const controller=scope.createController({environment});controller.configure(initial);
  await controller.attach({sampleRate:pairRate*8,audioWorklet:{addModule:async()=>{}},destination:{}},{connect(){},disconnect(){}});
  return {controller,environment,push(seconds,min=-.08,max=.08){
    node.port.onmessage({data:Float32Array.from({length:Math.round(seconds*pairRate)*2},(_,i)=>i%2?max:min)});
  }};
}
function offlineEngine() {
  const jobs=[];
  const environment={OfflineAudioContext:class {
    constructor(channels,length){this.length=length;}
    createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}
    startRendering(){return new Promise((resolve,reject)=>jobs.push({
      finish:value=>resolve({getChannelData:()=>new Float32Array(this.length).fill(value)}),fail:reject
    }));}
  }};
  return {environment,jobs};
}

test('partial history occupies its physical fraction of a fixed X axis, with no polygon over missing time',()=>{
  for(const count of [50,100,250,500,1000]) {
    const data=Float32Array.from({length:count*2},(_,i)=>i%2?.08:-.04);
    const frame=scope.frame(data,pairRate,0,1,'live',{alignEnd:true});
    expect(frame.seconds).toBe(1);expect(frame.availableSeconds).toBe(count/pairRate);
    expect(frame.startFraction).toBeCloseTo(1-count/pairRate,12);expect(frame.endFraction).toBe(1);
    const g=geometry({waveformScope:frame,exactBarWidth:250,barHeight:18});
    expect(g.polygon[0].x).toBeCloseTo(250*(1-count/pairRate),10);
    expect(Math.min(...g.polygon.map(p=>p.x))).toBeGreaterThanOrEqual(250*(1-count/pairRate)-1e-10);
    // Bin spacing is always .25 reference units, rather than 250/count.
    expect(g.curve[2].x-g.curve[0].x).toBeCloseTo(250/pairRate,10);
  }
});

test('min/max display resolution stays proportional to the fixed time window during filling',()=>{
  for(const count of [375,750,1500,3000,6000]) {
    const data=Float32Array.from({length:count*2},(_,i)=>i%2?.08:-.04);
    const f=scope.frame(data,6000,0,1,'live',{alignEnd:true});
    expect(f.extrema.length/2).toBe(1024*count/6000);
    const g=geometry({waveformScope:f,exactBarWidth:250,barHeight:18});
    expect(g.curve[2].x-g.curve[0].x).toBeCloseTo(250/1024,10);
  }
});

test('repeated edits hold settled frames rather than presenting transition history as whole cycles',async()=>{
  const {controller:c,push}=await live();
  try {
    push(4);c.tick(0);const original=c.capture();
    for(const [note,type] of [[49,.5],[84,3],[24,0]]) {
      const held=c.frame();c.configure({note,type});c.tick(0);
      expect(c.frame()).toBe(held);expect(c.status()).toContain('previous settings');
      push(.05,-.01,.01);c.tick(0);expect(c.frame()).toBe(held);
      push(.7,-.01,.01);c.tick(0);
      expect(c.frame()).toMatchObject({source:'live',seconds:scope.duration({note}),startFraction:0,filling:false,parameterChanges:false});
      expect(c.frame().extrema.every(x=>Math.abs(x)<.02)).toBe(true);
    }
    expect(original.recording.frame(0)).toBe(original.frame);
    expect(original.frame.extrema.some(x=>Math.abs(x)>.07)).toBe(true);
  } finally {c.dispose();}
});

test('a short initial capture stays unavailable until a complete settled note window exists',async()=>{
  const {controller:c,push}=await live({note:84,type:0});
  try {
    push(.004);c.tick(0);expect(c.frame()).toBeNull();
    c.configure({note:24,type:0});push(.1);c.tick(0);expect(c.frame()).toBeNull();
    push(.7);c.tick(0);expect(c.frame()).toMatchObject({seconds:scope.duration({note:24}),startFraction:0,filling:false});
    const held=c.frame();c.configure({note:84,type:0});c.tick(0);expect(c.frame()).toBe(held);
    push(.7);c.tick(0);expect(c.frame()).toMatchObject({seconds:scope.duration({note:84}),startFraction:0,filling:false});
  } finally {c.dispose();}
});

test('bounded history survives ring wraps and all note timebases',async()=>{
  const {controller:c,push}=await live({note:84,type:0});
  try {
    push(4);c.tick(0);
    for(const note of [24,84,49,24]) {
      c.configure({note,type:0});push(1.1);c.tick(0);
      expect(c.frame()).toMatchObject({seconds:scope.duration({note}),startFraction:0,filling:false,parameterChanges:false});
    }
  } finally {c.dispose();}
});

test('freeze holds exact data, recording and timebase through edits, incoming samples and mute',async()=>{
  const {controller:c,push}=await live();
  try {
    push(3);c.tick(0);const held=c.frame(),captured=c.capture();c.tick(0,false);
    for(const note of [49,73,84]) {
      c.configure({...base,note});push(.1,-.01,.01);c.tick(0,false);
      expect(c.frame()).toBe(held);expect(c.capture().recording).toBe(captured.recording);
      expect(c.status()).toContain('frozen');expect(c.status()).toContain('previous settings');
    }
    c.detach();c.tick(0,false);expect(c.frame()).toBe(held);expect(c.status()).toContain('Recorded audio');
  } finally {c.dispose();}
});

test('silent edits hold a labeled previous frame until one complete latest render replaces it',async()=>{
  jest.useFakeTimers();const {environment,jobs}=offlineEngine();
  const create=jest.spyOn(WaveformAudio,'create').mockReturnValue({update(){},pulseWorkletNode:{}});
  const c=scope.createController({environment});
  try {
    c.configure(base,true);await jest.advanceTimersByTimeAsync(0);jobs[0].finish(.01);await c.ready();
    c.tick(.3);const held=c.frame(),original=c.capture();
    c.configure({...base,type:1},true);await jest.advanceTimersByTimeAsync(0);
    expect(c.frame()).toBe(held);expect(c.status()).toContain('previous settings (rendering update)');
    c.configure({...base,type:2,note:24},true);
    jobs[1].finish(.04);await jest.advanceTimersByTimeAsync(0);
    expect(c.frame()).toBe(held);expect(jobs).toHaveLength(3);
    jobs[2].finish(.08);await c.ready();
    expect(c.frame()).toMatchObject({source:'offline',seconds:scope.duration({note:24}),startFraction:0,endFraction:1});
    expect(c.frame().extrema.every(x=>x>.07)).toBe(true);expect(c.status()).not.toContain('previous settings');
    expect(original.recording.frame(0)).toBe(original.frame);
    expect(original.frame.extrema.every(x=>x<.02)).toBe(true);
  } finally {c.dispose();create.mockRestore();jest.useRealTimers();}
});

test('frozen offline data survives replacement renders and failures until playback resumes',async()=>{
  jest.useFakeTimers();const {environment,jobs}=offlineEngine();
  const create=jest.spyOn(WaveformAudio,'create').mockReturnValue({update(){},pulseWorkletNode:{}});
  const c=scope.createController({environment});
  try {
    c.configure(base,true);await jest.advanceTimersByTimeAsync(0);jobs[0].finish(.01);await c.ready();
    c.tick(0,false);const held=c.frame();
    c.configure({...base,type:3},true);await jest.advanceTimersByTimeAsync(0);jobs[1].finish(.08);await c.ready();
    expect(c.frame()).toBe(held);expect(c.status()).toContain('frozen');expect(c.status()).toContain('previous settings');
    c.tick(0,true);expect(c.frame().extrema.every(x=>x>.07)).toBe(true);
    const complete=c.frame();c.configure({...base,type:2},true);await jest.advanceTimersByTimeAsync(0);
    jobs[2].fail(new Error('render failed'));await c.ready();c.tick(1,true);
    expect(c.frame()).toBe(complete);expect(c.status()).toContain('previous settings (update unavailable)');
  } finally {c.dispose();create.mockRestore();jest.useRealTimers();}
});

test('offline/live/mute handoffs never relabel cached or transitional data as live',async()=>{
  jest.useFakeTimers();const {environment,jobs}=offlineEngine();
  const create=jest.spyOn(WaveformAudio,'create').mockReturnValue({update(){},pulseWorkletNode:null});
  const {controller:c,push}=await live(base,environment);
  try {
    await jest.advanceTimersByTimeAsync(100);jobs[0].finish(.01);await c.ready();
    expect(c.frame().source).toBe('offline');c.tick(1);
    expect(c.status()).toContain('waiting for settled live audio');
    push(.005);c.tick(1);expect(c.frame().source).toBe('offline');
    push(.7);c.tick(1);expect(c.frame()).toMatchObject({source:'live',filling:false,parameterChanges:false});
    c.configure({...base,note:49},true);c.tick(1);const held=c.frame();
    await jest.advanceTimersByTimeAsync(0);jobs[1].finish(.08);await c.ready();
    expect(c.frame()).toBe(held);c.tick(1);expect(c.frame().source).toBe('offline');
    push(.7);c.tick(1);const liveFrame=c.frame();expect(liveFrame.source).toBe('live');
    c.tick(1,false);c.detach();c.tick(2,false);expect(c.frame()).toBe(liveFrame);
    c.tick(2,true);expect(c.frame()).toMatchObject({source:'offline',startFraction:0,endFraction:1});
    expect(c.frame().seconds).toBe(scope.duration({note:49}));
  } finally {c.dispose();create.mockRestore();jest.useRealTimers();}
});
