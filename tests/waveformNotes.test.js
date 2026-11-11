const notes=require('../js/utils/waveformNotes');
global.WaveformAudio=require('../js/utils/waveformAudio');
const scope=require('../js/utils/waveformScope');
const fs=require('node:fs'),vm=require('node:vm');
test('61 note descriptors are immutable 12-TET A440 values, never rounded inputs',()=>{
  expect(notes.NOTES).toHaveLength(61);expect(Object.isFrozen(notes.NOTES)).toBe(true);
  expect(notes.get(24).name).toBe('C1');expect(notes.get(84).name).toBe('C6');
  expect(notes.get(24).periodSeconds*1000).toBeCloseTo(30.578051463771438,12);
  expect(notes.get(84).frequencyHz).toBeCloseTo(1046.5022612023945,10);
  expect(notes.get(69).frequencyHz).toBe(440);
  for(const n of notes.NOTES){
    expect(Object.isFrozen(n)).toBe(true);expect(n.frequencyHz).toBe(440*2**((n.midi-69)/12));
    expect(Number.isInteger(n.cycles)).toBe(true);expect(n.seconds*n.frequencyHz).toBeCloseTo(n.cycles,12);
    if(n.midi<=72)expect(notes.get(n.midi+12).frequencyHz/n.frequencyHz).toBeCloseTo(2,14);
    expect(scope.duration({note:n.midi})).toBe(n.seconds);
  }
  for(let octave=1;octave<=6;octave++){const n=notes.get((octave+1)*12);expect(n.cycles).toBe(2**(octave-1));expect(n.seconds).toBeCloseTo(notes.REFERENCE_SECONDS,14);}
});
test('note parsing, boundaries, enharmonics, and legacy index migration are explicit',()=>{
  for(const [text,midi] of [['C1',24],['C#3',49],['db3',49],['B#5',84],['C♯3',49],['Db3',49]])expect(notes.parse(text)).toBe(midi);
  for(const value of ['C0','C#6','A440','NaN','24','C1junk',''])expect(notes.parse(value)).toBeNull();
  expect(notes.fromLegacy(10)).toBe(24);expect(notes.fromLegacy(100)).toBe(72);expect(notes.fromLegacy(24)).toBe(45);
  expect(notes.read({note:49,frequency:10})).toBe(49);expect(notes.normalize(Infinity)).toBe(24);
});
test('adaptive windows expose the real count transition rather than silently retuning',()=>{
  expect(notes.get(31).cycles).toBe(1);expect(notes.get(32).cycles).toBe(2);
  expect(notes.get(31).seconds*1000).toBeCloseTo(20.4084,3);expect(notes.get(32).seconds*1000).toBeCloseTo(38.5259,3);
});
test('all notes keep exact physical endpoints independent of sample and extrema grids',()=>{
  for(const rate of [44100,48000,96000])for(const n of notes.NOTES){
    const pcm=Float32Array.from({length:Math.ceil((n.seconds+.02)*rate)+8},(_,i)=>.1*Math.sin(2*Math.PI*n.frequencyHz*i/rate));
    const r=scope.recording(scope.pcmExtrema(pcm),rate/8,n.seconds,'offline',scope.displaySettings({note:n.midi}),pcm);
    const f=r.frame(.0012345);
    expect(f.seconds).toBe(n.seconds);expect(f.traceDurationSeconds).toBeCloseTo(n.seconds,14);
    expect(f.trace[0]).toBeCloseTo(f.trace.at(-1),3); // Float32 + linear-interpolation error, not forced closure.
    expect(f.startFraction).toBe(0);expect(f.endFraction).toBe(1);
  }
});
test('old share indices migrate once and fresh MIDI state takes precedence',()=>{
  const context={window:{WaveformNotes:notes},module:{exports:{}}};vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/utils/shareState'),'utf8'),context);
  const api=context.module.exports,manifest={'waveform-note-slider':{type:'range',min:24,max:84,step:1}};
  const old={v:1,controls:{'waveform-frequency-slider':'100'}};
  const migrated=api.normalizeState(old,manifest);expect(migrated.controls['waveform-note-slider']).toBe('72');
  expect(migrated.controls['waveform-frequency-slider']).toBeUndefined();
  expect(()=>api.normalizeState({v:1,controls:{'waveform-frequency-slider':'NaN'}},manifest)).toThrow();
});
