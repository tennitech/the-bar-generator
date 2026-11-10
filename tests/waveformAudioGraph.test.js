const reference=require('./fixtures/waveformAudioReference');
global.WaveformLfo=require('../js/utils/waveformLfo');
const audio=require('../js/utils/waveformAudio');
function engine() {
  const events=[];let serial=0;
  function parameter(id) {return {id,value:1,...Object.fromEntries(['cancelScheduledValues','setValueAtTime','setTargetAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime'].map(name=>[name,(...args)=>events.push([id,name,...args])]))};}
  function node(type) {const id=`${type}:${serial++}`;return {id,connect:other=>events.push([id,'connect',other.id]),disconnect:()=>{},start:(...args)=>events.push([id,'start',...args]),stop:()=>{}};}
  const context={state:'running',currentTime:0,
    createGain:()=>{const n=node('gain');n.gain=parameter(n.id+'.gain');return n;},
    createOscillator:()=>{const n=node('osc');n.frequency=parameter(n.id+'.frequency');n.setPeriodicWave=wave=>events.push([n.id,'wave',wave]);return n;},
    createWaveShaper:()=>node('limiter'),createConstantSource:()=>{const n=node('constant');n.offset=parameter(n.id+'.offset');return n;},
    createPeriodicWave:(real,imaginary,options)=>({real:Array.from(real),imaginary:Array.from(imaginary),options})};
  class Worklet {constructor(){Object.assign(this,node('pulse'));this.port={postMessage:message=>events.push([this.id,'message',message])};}}
  const master=context.createGain();return {context,master,Worklet,events};
}
test('extracted actual graph schedules exactly the same oscillator, pulse, crossfade and gain events as pre-refactor audio',async()=>{
  for(const type of [0,.5,1,1.5,2,2.5,3])for(const frequency of [10,24,100]) {
    const values={frequency,type,lfo:{enabled:true,rate:2,depth:60,type:1.5}};
    const before=engine(),after=engine();
    const old=await reference(before.context,before.master,values,WaveformLfo,before.Worklet);
    const current=audio.create(after.context,after.master,values,{},after.Worklet);
    after.master.gain.cancelScheduledValues(0);after.master.gain.setValueAtTime(0,0);after.master.gain.linearRampToValueAtTime(1,.05);current.update(values);
    expect(after.events).toEqual(before.events);
    old.update({frequency:73,type:2.7});current.update({frequency:73,type:2.7});
    expect(after.events).toEqual(before.events);
  }
});

test('Square fallback preserves the pre-refactor pulse branch without a worklet',async()=>{
  const quiet=jest.spyOn(console,'error').mockImplementation(()=>{});
  try {
    for(const type of [2.5,3]) {
      const values={frequency:24,type,lfo:{enabled:true,rate:2,depth:100,type:0}};
      const before=engine(),after=engine(),Missing=class {constructor(){throw new Error('unavailable');}};
      await reference(before.context,before.master,values,WaveformLfo,Missing);
      const graph=audio.create(after.context,after.master,values,{},Missing);
      after.master.gain.cancelScheduledValues(0);after.master.gain.setValueAtTime(0,0);after.master.gain.linearRampToValueAtTime(1,.05);graph.update(values);
      expect(graph.pulseWorkletNode).toBe(null);expect(after.events).toEqual(before.events);
    }
  } finally {quiet.mockRestore();}
});
