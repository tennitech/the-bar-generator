const fs=require('node:fs'), vm=require('node:vm');
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const {createWaveformPatternGeometry:geometry,createBarPatternSVG}=require('../js/utils/barPattern');
const {createRuntime}=require('./helpers/exportCompositionRuntime');
const {getLoopingGifFramePlan}=require('../js/utils/loopingGif');
const values={note:24,type:0};

test('physical timebase covers the nearest whole-cycle window for every selected note',()=>{
  const notes=require('../js/utils/waveformNotes');
  for(const note of [24,49,84])for(const rate of [.07,2,100,1300]) {
    const v={...values,note,lfo:{enabled:true,rate,depth:100,type:3}};
    expect(scope.duration(v)*WaveformAudio.frequency(note)).toBeCloseTo(notes.get(note).cycles,12);
    expect(scope.settings(v)).toEqual({note,type:0});
  }
});

test('extrema reduction preserves actual signed PCM peaks and temporal order, not a reconstructed oscillator',()=>{
  const pcm=Float32Array.from({length:8192},(_,i)=>Math.sin(i*.13)*.1*(i%37/37));
  const reduced=scope.pcmExtrema(pcm),f=scope.frame(reduced,6000,0,reduced.length/2/6000,'offline');
  for(let i=0;i<reduced.length/2;i++) {
    expect(reduced[i*2]).toBe(Math.min(...pcm.subarray(i*8,i*8+8)));
    expect(reduced[i*2+1]).toBe(Math.max(...pcm.subarray(i*8,i*8+8)));
  }
  const g=geometry({waveformScope:f,exactBarWidth:250,barHeight:18});
  expect(g.curve[0].y).toBeCloseTo(9-90*f.extrema[1],10);
  expect(g.curve[1].y).toBeCloseTo(9-90*f.extrema[0],10);
  expect(g.polygon[0]).toEqual({x:0,y:g.curve[0].y});
  const d=g.polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z';
  expect(createBarPatternSVG({currentShader:4,fgColor:'#000',barStartX:0,barY:0,exactBarWidth:250,barHeight:18,values:{waveformScope:f}})).toContain(`d="${d}"`);
  expect(geometry({waveformScopeRequired:true})).toEqual({curve:[],polygon:[]});
});

test('the worklet captures post-gain PCM min/max and contributes exactly zero audible samples',()=>{
  let Processor;const batches=[];
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/waveform-scope-worklet'),'utf8'),{
    Float32Array,Math,Infinity,AudioWorkletProcessor:class {constructor(){this.port={postMessage:data=>batches.push(data)};}},
    registerProcessor:(name,type)=>{expect(name).toBe('waveform-scope');Processor=type;}
  });
  const p=new Processor(),pcm=Float32Array.from({length:4096},(_,i)=>.1*Math.sin(i*.3));
  const output=new Float32Array(128);
  for(let i=0;i<pcm.length;i+=128)p.process([[pcm.subarray(i,i+128)]],[[output]]);
  expect(batches).toHaveLength(2);expect(output.every(x=>x===0)).toBe(true);
  const expected=scope.pcmExtrema(pcm);
  expect(Array.from(batches[0].extrema)).toEqual(Array.from(expected.subarray(0,512)));
  expect(Array.from(batches[1].extrema)).toEqual(Array.from(expected.subarray(512)));
  expect(Array.from(batches[0].pcm)).toEqual(Array.from(pcm.subarray(0,2048)));
  expect(Array.from(batches[1].pcm)).toEqual(Array.from(pcm.subarray(2048)));
});

test('live capture keeps carrier timebase, freezes recording identity and retains history across pitch edits',async()=>{
  let node;const environment={AudioWorkletNode:class {constructor(){node=this;this.port={};}connect(){}disconnect(){}}};
  const input={connect:jest.fn(),disconnect:jest.fn()};
  const c=scope.createController({environment});
  c.configure(values);await c.attach({sampleRate:48000,audioWorklet:{addModule:async()=>{}},destination:{}},input);
  node.port.onmessage({data:Float32Array.from({length:12000},(_,i)=>i%2?.08:-.04)});
  c.tick(0,true);expect(c.frame()).toMatchObject({source:'live',seconds:scope.duration(values),filling:false});
  const captured=c.capture(),held=c.frame();expect(captured.recording.frame(0)).toBe(held);expect(captured.recording.frame(captured.recording.replaySeconds)).toBe(held);c.tick(100,false);
  node.port.onmessage({data:new Float32Array(12000)});c.tick(100,false);
  expect(c.frame()).toBe(held);expect(c.capture().recording).toBe(captured.recording);
  c.configure({...values,note:24});
  node.port.onmessage({data:Float32Array.from({length:12000},()=>.01)});
  c.tick(0,true);expect(c.frame()).toMatchObject({source:'live',filling:false,requestedSeconds:scope.duration({note:24})});
  expect(c.status()).not.toContain('filling history');
  c.detach();expect(input.disconnect).toHaveBeenCalled();c.dispose();
});

test('offline unavailability and pending captures never claim an idealized waveform is actual audio',async()=>{
  const c=scope.createController({environment:{}});
  c.configure(values,true);expect(()=>c.capture()).toThrow(/rendering/);
  await c.ready();expect(c.frame()).toBe(null);expect(c.status()).toMatch(/cannot render a silent audio scope/);
  expect(()=>c.capture()).toThrow(/cannot render/);c.dispose();
});

test('SVG/PNG freeze displayed PCM and GIF reads the frozen actual recording after settings change',()=>{
  const data=Float32Array.from({length:8000},(_,i)=>i%2?.08*Math.sin(i*.2):-.04);
  const recording=scope.recording(data,1000,1,'offline'),f=recording.frame(.4);
  const r=createRuntime({waveformScopeController:{capture:()=>({frame:f,recording})}});
  r.select('waveform');r.state.composition='bar';r.state.values.waveformScopeRequired=true;
  const snapshot=r.captureLogoExportSnapshot();
  expect(snapshot.values.waveformScope).toEqual(f);expect(snapshot.waveformRecording).toBe(recording);
  r.state.values.waveformFrequency=100;expect(snapshot.values.waveformFrequency).toBe(17);
  const paths=[],ctx=Object.fromEntries(['setTransform','clearRect','save','scale','translate','beginPath','rect','clip','restore'].map(k=>[k,()=>{}]));
  ctx.fill=path=>paths.push(path.d);ctx.getImageData=()=>null;
  r.Path2D=class {constructor(d){this.d=d;}};r.document.createElement=()=>({getContext:()=>ctx});
  const plan=getLoopingGifFramePlan('waveform',snapshot.values),renderer=r.createCapturedGifRenderer(snapshot,plan);
  for(const progress of [0,.37,1]) {
    paths.length=0;renderer.renderFrame(0,progress);
    const g=geometry({waveformScope:recording.frame(2*progress),barY:132.4885,exactBarWidth:250,barHeight:18});
    expect(paths[0]).toBe(g.polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z');
  }
  expect(plan.scopeReplay).toBe(true);expect(plan.periodSeconds).toBe(2);
  renderer.release();
});

test('offline render jobs serialize and stale completed PCM cannot replace newer controls',async()=>{
  jest.useFakeTimers();const jobs=[];
  const original=WaveformAudio.create;WaveformAudio.create=()=>({update(){},pulseWorkletNode:{}});
  const environment={OfflineAudioContext:class {
    constructor(channels,length){this.length=length;}
    createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}
    startRendering(){return new Promise(resolve=>jobs.push({resolve:()=>resolve({getChannelData:()=>new Float32Array(this.length).fill(.04)})}));}
  }};
  const c=scope.createController({environment});
  try {
    c.configure(values,true);await jest.advanceTimersByTimeAsync(0);expect(jobs).toHaveLength(1);
    c.configure({...values,type:3},true);await jest.advanceTimersByTimeAsync(0);expect(jobs).toHaveLength(1);
    jobs[0].resolve();await jest.advanceTimersByTimeAsync(0);expect(jobs).toHaveLength(2);expect(c.frame()).toBe(null);
    jobs[1].resolve();await c.ready();expect(c.frame().source).toBe('offline');
  } finally {c.dispose();WaveformAudio.create=original;jest.useRealTimers();}
});

test('routed bootstrap loads the actual audio/scope head dependencies before main setup',()=>{
  const bootstrap=fs.readFileSync(require.resolve('../js/generatorBootstrap'),'utf8');
  const early=bootstrap.slice(bootstrap.indexOf('const earlySources'),bootstrap.indexOf('await Promise.all(earlySources'));
  const html=fs.readFileSync(require.resolve('../generator/index.html'),'utf8');
  for(const name of ['waveformAudio','waveformScope']) {
    expect(early).toContain(`'${name}'`);
    const version='20261111-waveform-notes-r2';
    expect(html).toContain(`src="js/utils/${name}.js?v=${version}"`);
  }
});


test('captured replay starts at the displayed phase and reverses without synthesizing new samples',()=>{
  const data=Float32Array.from({length:8000},(_,i)=>i/8000/10);
  const recorded=scope.recording(data,1000,1,'offline'),first=recorded.frame(.6);
  const forward=scope.replayFrom(recorded,.6,first),reverse=scope.replayFrom(recorded,.6,first,true);
  expect(forward.frame(0)).toBe(first);expect(forward.frame(2)).toBe(first);
  expect(forward.frame(.2)).toEqual(recorded.frame(.8));
  expect(reverse.frame(.2)).toEqual(recorded.frame(.4));
});

test('frozen scope note/type metadata describes captured PCM rather than newer control values',()=>{
  const pcm=Float32Array.from({length:48000},(_,i)=>.1*Math.sin(i*.01));
  const recorded=scope.recording(scope.pcmExtrema(pcm),6000,scope.duration({note:49}), 'offline',scope.displaySettings({note:49,type:1.5}),pcm);
  const frame=recorded.frame(0),r=createRuntime({waveformScopeController:{capture:()=>({frame,recording:recorded})}});
  r.select('waveform');Object.assign(r.state.values,{waveformNote:84,waveformType:3});
  const snapshot=r.captureLogoExportSnapshot();
  expect(snapshot.values.waveformNote).toBe(49);expect(snapshot.values.waveformType).toBe(1.5);
});
