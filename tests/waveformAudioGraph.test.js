const audio=require('../js/utils/waveformAudio');
const notes=require('../js/utils/waveformNotes');
function engine() {
  const events=[];let serial=0;
  function parameter(id) {return {id,value:0,...Object.fromEntries(['cancelScheduledValues','setValueAtTime','linearRampToValueAtTime'].map(name=>[name,(...args)=>events.push([id,name,...args])]))};}
  function node(type) {const id=`${type}:${serial++}`;return {id,connect:other=>events.push([id,'connect',other.id]),start:time=>events.push([id,'start',time]),stop:time=>events.push([id,'stop',time])};}
  const context={currentTime:0,sampleRate:48000,
    createGain:()=>{const n=node('gain');n.gain=parameter(n.id+'.gain');return n;},
    createOscillator:()=>{const n=node('osc');n.frequency=parameter(n.id+'.frequency');n.setPeriodicWave=wave=>events.push([n.id,'wave',wave]);return n;},
    createPeriodicWave:jest.fn((real,imaginary)=>({real,imaginary}))};
  return {context,master:node('master'),events};
}
test('all four carriers use exact note frequencies and one explicit phase origin without worklets or pitch glides',()=>{
  for(const note of [24,49,69,84]) {
    const e=engine(),graph=audio.create(e.context,e.master,{note,type:3});
    expect(graph.pulseWorkletNode).toBe(null);
    const starts=e.events.filter(x=>x[1]==='start');expect(starts).toHaveLength(4);
    expect(new Set(starts.map(x=>x[2]))).toEqual(new Set([.01]));
    expect(e.events.filter(x=>x[0].includes('.frequency') && x[1]==='setValueAtTime').every(x=>x[2]===notes.get(note).frequencyHz)).toBe(true);
    expect(e.events.some(x=>x[1]==='exponentialRampToValueAtTime')).toBe(false);
    expect(e.events.filter(x=>x[1]==='connect' && x[2]===e.master.id)).toHaveLength(4);
    expect(e.context.createPeriodicWave).toHaveBeenCalledTimes(1);
  }
});
test('pulse is a DC-free finite Fourier model of positive-first bipolar duty, natively normalized and band limited',()=>{
  const {real,imag}=audio.pulseCoefficients(.8);
  expect(real).toHaveLength(2049);expect(real[0]).toBe(0);expect(imag[0]).toBe(0);
  function value(phase){let sum=0;for(let k=1;k<real.length;k++)sum+=real[k]*Math.cos(2*Math.PI*k*phase)+imag[k]*Math.sin(2*Math.PI*k*phase);return sum;}
  // Removing the mean 2D−1 leaves +2(1−D) for fraction D, and −2D otherwise.
  expect(value(.4)).toBeCloseTo(.4,2);expect(value(.9)).toBeCloseTo(-1.6,2);
  const square=audio.pulseCoefficients(.5,32);
  for(let k=2;k<=32;k+=2)expect(Math.abs(square.imag[k])+Math.abs(square.real[k])).toBeLessThan(1e-14);
});
test('finite 50ms ramps reach steady gains, unchanged settings reuse pulse coefficients, cache is bounded',()=>{
  const e=engine(),g=audio.create(e.context,e.master,{note:24,type:3});
  g.update({note:24,type:3});expect(e.context.createPeriodicWave).toHaveBeenCalledTimes(1);
  for(let i=0;i<=100;i++)g.update({note:24,type:2+i/100});
  expect(e.context.createPeriodicWave).toHaveBeenCalledTimes(102);
  expect(e.events.filter(x=>x[1]==='linearRampToValueAtTime').every(x=>x[3]===.05)).toBe(true);
  expect(e.events.some(x=>x[1]==='setTargetAtTime')).toBe(false);
});
test('audio stop is scheduled at a whole carrier phase after release, including note edits',()=>{
  const e=engine(),g=audio.create(e.context,e.master,{note:24,type:0});
  const f=Math.fround(notes.get(24).frequencyHz);
  let stop=g.nextCycleBoundary(.07);expect(stop).toBeGreaterThanOrEqual(.07);expect((stop-.01)*f).toBeCloseTo(Math.round((stop-.01)*f),12);
  e.context.currentTime=.123;g.update({note:49,type:0});
  stop=g.nextCycleBoundary(.2);const phase=(.123-.01)*f+(stop-.123)*Math.fround(notes.get(49).frequencyHz);
  expect(stop).toBeGreaterThanOrEqual(.2);expect(phase).toBeCloseTo(Math.round(phase),12);
});

test('stopped voices have their own finite gain release even if a rapid restart cancels the shared master fade',()=>{
  const e=engine(),g=audio.create(e.context,e.master,{note:24,type:0});
  const stop=g.nextCycleBoundary(.08);g.fadeOutAt(stop);
  expect(e.events.filter(x=>x[1]==='linearRampToValueAtTime' && x[2]===0 && x[3]===stop)).toHaveLength(4);
});
