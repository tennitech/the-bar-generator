const fs = require('node:fs');
const vm = require('node:vm');
const music = require('../js/utils/musicStyle');
const { createBarPatternSVG } = require('../js/utils/barPattern');
const { normalizeRuntime } = require('../js/utils/shareState');
const dimensions = { barStartX: 7, rectTop: 5, exactBarWidth: 500, rectHeight: 36 };
const model = (notes, noteShape = 'square') => music.buildMusicBarRenderData(notes, { ...dimensions, noteShape });

test('all 13 chromatic pitches occupy separate, equally spaced fixed lanes without clipping', () => {
  const result = model(music.pitches.map(note => ({note, duration:1})));
  expect(result.notes).toHaveLength(13);
  expect(new Set(result.notes.map(note => note.y)).size).toBe(13);
  result.notes.forEach((note, i) => {
    expect(note.y).toBeGreaterThanOrEqual(5);
    expect(note.y + note.height).toBeLessThanOrEqual(41);
    if (i) expect(result.notes[i-1].y - note.y).toBeCloseTo(36/13);
  });
  expect(model('C4_1').notes[0].y).toBe(result.notes[0].y);
  expect(model('C5_1').notes[0].y).toBe(result.notes[12].y);
});

test.each(['square','circle','diamond','triangle'])('%s spans exact note duration and onset; rests consume time with no painted marks', shape => {
  const result = model('C4_1,rest_0.5,C#4_0.5,C5_2', shape);
  expect(result.totalBeats).toBe(4);
  expect(result.notes).toHaveLength(3);
  expect(result.notes.map(n => n.width)).toEqual([125,62.5,250]);
  expect(result.notes.map(n => n.x)).toEqual([7,194.5,257]);
  for (const n of result.notes) {
    expect(Math.min(...n.points.map(p=>p[0]))).toBeCloseTo(n.x);
    expect(Math.max(...n.points.map(p=>p[0]))).toBeCloseTo(n.x+n.width);
    n.points.forEach(([x,y]) => { expect(x).toBeGreaterThanOrEqual(7); expect(x).toBeLessThanOrEqual(507); expect(y).toBeGreaterThanOrEqual(5); expect(y).toBeLessThanOrEqual(41); });
  }
});

test('phrase validation rejects unsafe pitches, durations and non-finite values and enforces 16 beats', () => {
  const malformed = [{note:'C4',duration:0},{note:'C#4',duration:Infinity},{note:'D5',duration:1},{note:'<script>',duration:.5},{note:'rest',duration:.5},{note:'B4',duration:1}];
  expect(music.serialize(malformed)).toBe('rest_0.5,B4_1');
  expect(music.normalizeNotes('C4_1junk,D4_-1,E4_1')).toEqual([{note:'E4',duration:1}]);
  const source = Array.from({length:1000},()=>({note:'C4',duration:.25}));
  expect(music.normalizeNotes(source)).toHaveLength(64);
  expect(music.totalBeats(source)).toBe(16);
  expect(model([]).notes).toEqual([]);
  expect(model('rest_2').notes).toEqual([]);
  expect(music.normalizeMusicNoteShape('constructor')).toBe('square');
});

test('audio pitches follow twelve-tone equal temperament anchored to A4 = 440 Hz', () => {
  expect(music.frequency('A4')).toBe(440);
  expect(music.frequency('C5')/music.frequency('C4')).toBeCloseTo(2,12);
  expect(music.frequency('C#4')/music.frequency('C4')).toBeCloseTo(2**(1/12),12);
  expect(music.frequency('rest')).toBe(0);
  expect(music.frequency('invalid')).toBe(0);
});

test('original presets and supported note/rest shares round trip exactly', () => {
  Object.values(music.presets).forEach(phrase => {
    const notes = music.normalizeNotes(phrase);
    expect(music.serialize(notes)).toBe(phrase);
    expect(music.totalBeats(notes)).toBeLessThanOrEqual(16);
    expect(normalizeRuntime({notes}).notes).toEqual(notes);
  });
  expect(normalizeRuntime({notes:[{note:'D5',duration:1},{note:'rest',duration:1},{note:'C#4',duration:.25}]}).notes).toEqual([{note:'rest',duration:1},{note:'C#4',duration:.25}]);
});

test.each(['square','circle','diamond','triangle'])('SVG uses exactly the canonical %s polygons; graphics uses the same vertices', noteShape => {
  const notes = music.normalizeNotes(music.presets.syncopation);
  const geometry = model(notes,noteShape);
  const svg = createBarPatternSVG({currentShader:10,barStartX:7,barY:5,exactBarWidth:500,barHeight:36,fgColor:'#000000',values:{staffNotes:notes,staffNoteShape:noteShape}});
  expect((svg.match(/<polygon /g)||[]).length).toBe(notes.filter(n=>n.note!=='rest').length);
  for (const n of geometry.notes) expect(svg).toContain(`points="${n.points.map(p=>p.join(',')).join(' ')}"`);
  expect(svg).not.toMatch(/NaN|undefined|<line/);
  const source = fs.readFileSync(require.resolve('../js/drawing'),'utf8');
  const start=source.indexOf('  } else if (currentShader === 10)');
  const block=source.slice(start,source.indexOf('  } else if (currentShader === 11)',start)).replace('  } else if (currentShader === 10) {','');
  const drawn=[];
  const ctx={currentStaffNotes:notes,barStartX:7,barY:5,exactBarWidth:500,rectHeight:36,fgColor:'#000000',getSelectedMusicNoteShape:()=>noteShape,buildMusicBarRenderData:music.buildMusicBarRenderData,CLOSE:'close',pg:{noStroke(){},fill(){},beginShape(){drawn.push([])},vertex(x,y){drawn.at(-1).push([x,y])},endShape(){}}};
  vm.runInNewContext(block,ctx);
  expect(drawn).toEqual(geometry.notes.map(n=>n.points));
});

test('Music is selectable only in Under Construction, with labeled native controls and no autoplay animation', () => {
  const html=fs.readFileSync(require.resolve('../generator/index.html'),'utf8');
  const group=html.match(/<optgroup label="Under Construction">([\s\S]*?)<\/optgroup>/)[1];
  expect(group).toContain('<option value="music">Music</option>');
  const panel=html.slice(html.indexOf('<div id="staff-group"'),html.indexOf('<div id="graph-group"'));
  expect((panel.match(/<button [^>]*data-note=/g)||[]).length).toBe(14);
  expect(panel).toContain('aria-live="polite"');
  expect(panel).toContain('aria-pressed="true"');
  expect(panel).toContain('static scores');
  expect(panel).not.toContain('motion-toggle');
});

test('bar and logo exports freeze Music notes, retain alpha-ready SVG and reject an empty score', () => {
  const {createRuntime}=require('./helpers/exportCompositionRuntime');
  const runtime=createRuntime(); runtime.select('music');
  runtime.state.values.staffNotes=music.normalizeNotes('C4_1,rest_1,C#4_2');
  runtime.state.values.staffNoteShape='diamond';
  for (const composition of ['logo','bar']) {
    runtime.state.composition=composition;
    const snapshot=runtime.captureLogoExportSnapshot();
    expect(snapshot.svgSource).toContain('<polygon');
    expect(snapshot.values.staffNotes).toEqual(music.normalizeNotes('C4_1,rest_1,C#4_2'));
    expect(Object.isFrozen(snapshot.values.staffNotes)).toBe(true);
    expect(snapshot.svgSource).not.toMatch(/NaN|undefined/);
  }
  runtime.state.values.staffNotes=[];
  expect(()=>runtime.captureLogoExportSnapshot()).toThrow(/Add at least one note/);
  runtime.state.values.staffNotes=[{note:'rest',duration:2}];
  expect(()=>runtime.captureLogoExportSnapshot()).toThrow(/Add at least one note/);
});

test('audio scheduler preserves rests and note duration at the selected tempo without a fallback pitch', () => {
  const source=fs.readFileSync(require.resolve('../js/main'),'utf8');
  const block=source.slice(source.indexOf('function scheduleStaffNote()'),source.indexOf('// Simple single oscillator approach'));
  const ctx={window:{MusicStyle:music},currentStaffNotes:music.normalizeNotes('C#4_0.5,rest_1,C5_2'),staffTempoSlider:{value:120},staffInstrumentSelect:{value:'piano'},sequenceContext:{currentNote:0,nextNoteTime:1},updateStaffEffects:jest.fn(),triggerPianoVoice:jest.fn(),triggerSimpleStaffVoice:jest.fn()};
  vm.runInNewContext(block,ctx);
  ctx.scheduleStaffNote();
  expect(ctx.triggerPianoVoice).toHaveBeenLastCalledWith(music.frequency('C#4'),1,.25);
  ctx.scheduleStaffNote(); expect(ctx.triggerPianoVoice).toHaveBeenCalledTimes(1);
  expect(ctx.sequenceContext.nextNoteTime).toBe(1.75);
  ctx.scheduleStaffNote(); expect(ctx.triggerPianoVoice).toHaveBeenLastCalledWith(music.frequency('C5'),1.75,1);
  ctx.staffTempoSlider.value=60; ctx.staffInstrumentSelect.value='synth'; ctx.scheduleStaffNote();
  expect(ctx.triggerSimpleStaffVoice).toHaveBeenLastCalledWith(music.frequency('C#4'),2.75,.5,'synth');
});

function composerFixture(initial = []) {
  const elements=new Map(), durations=[], keys=[];
  function element(dataset = {}) {
    return {dataset, children:[], attrs:{}, handlers:{}, value:'', classList:{toggle:jest.fn()},
      setAttribute(name,value){this.attrs[name]=value}, addEventListener(type,listener){this.handlers[type]=listener},
      replaceChildren(){this.children=[]}, appendChild(child){this.children.push(child)}, focus:jest.fn()};
  }
  for (const id of ['staff-notes-input','music-sequence','music-status','music-preset','staff-clear-btn']) elements.set(id,element());
  for (const n of music.durations) durations.push(element({duration:String(n)}));
  for (const note of [...music.pitches,'rest']) keys.push(element({note}));
  const document={getElementById:id=>elements.get(id),createElement:()=>element(),querySelector:selector=>selector.includes('[data-note]')?keys[0]:null,
    querySelectorAll:selector=>selector.includes('[data-duration]')?durations:selector.includes('[data-music-remove]')?elements.get('music-sequence').children:selector.includes('[data-note]')?keys:[]};
  const context={document,window:{MusicStyle:music},currentStaffNotes:music.normalizeNotes(initial),currentNoteDuration:1,staffClearBtn:elements.get('staff-clear-btn'),stopAudio:jest.fn(),updateUrlParameters:jest.fn(),requestUpdate:jest.fn(),syncAllCustomSelects:jest.fn()};
  context.updateAudioControlsUI=()=>music.syncComposer(document,context.currentStaffNotes,context.currentNoteDuration);
  const source=fs.readFileSync(require.resolve('../js/main'),'utf8');
  vm.runInNewContext(source.slice(source.indexOf('  const commitMusic ='),source.indexOf('  // Setup pulse controls')),context);
  context.updateAudioControlsUI();
  return {context,document,elements,durations,keys};
}

test('composer native clicks add exact pitches and rests, reject overflow without changing the score and stop transport before edits', () => {
  const h=composerFixture();
  h.durations.find(b=>b.dataset.duration==='0.25').handlers.click();
  h.keys.find(b=>b.dataset.note==='C#4').handlers.click();
  h.keys.find(b=>b.dataset.note==='rest').handlers.click();
  expect(music.serialize(h.context.currentStaffNotes)).toBe('C#4_0.25,rest_0.25');
  expect(h.context.stopAudio).toHaveBeenCalledTimes(2);
  expect(h.elements.get('staff-notes-input').value).toBe('C#4_0.25,rest_0.25');
  expect(h.durations.find(b=>b.dataset.duration==='0.25').attrs['aria-pressed']).toBe('true');
  h.context.currentStaffNotes=music.normalizeNotes(Array.from({length:8},()=>({note:'C4',duration:2})));
  const before=music.serialize(h.context.currentStaffNotes);h.keys[0].handlers.click();
  expect(music.serialize(h.context.currentStaffNotes)).toBe(before);
  expect(h.elements.get('music-status').textContent).toMatch(/Phrase full/);
  expect(h.context.stopAudio).toHaveBeenCalledTimes(2);
  expect(h.keys[0].handlers.mousedown).toBeUndefined();
});

test('removal and clear preserve a useful focus target; unrelated synchronization does not replace focused chips', () => {
  const h=composerFixture('C4_1,C#4_0.5,rest_0.5');
  const list=h.elements.get('music-sequence'),first=list.children[0];
  const status=h.elements.get('music-status'); let summary=status.textContent;
  const statusWrite=jest.fn(value=>{summary=value});
  Object.defineProperty(status,'textContent',{get:()=>summary,set:statusWrite});
  h.context.updateAudioControlsUI();expect(list.children[0]).toBe(first);
  expect(statusWrite).not.toHaveBeenCalled();
  const removed=list.children[1];
  list.handlers.click({target:{closest:()=>removed}});
  expect(music.serialize(h.context.currentStaffNotes)).toBe('C4_1,rest_0.5');
  expect(list.children[1].focus).toHaveBeenCalled();
  h.elements.get('staff-clear-btn').handlers.click();
  expect(h.context.currentStaffNotes).toEqual([]);
  expect(h.elements.get('staff-clear-btn').disabled).toBe(true);
  expect(h.keys[0].focus).toHaveBeenCalled();
  expect(h.elements.get('music-status').textContent).toMatch(/Empty phrase/);
  h.elements.get('music-preset').handlers.change({target:{value:'syncopation'}});
  expect(music.serialize(h.context.currentStaffNotes)).toBe(music.presets.syncopation);
  expect(h.elements.get('staff-clear-btn').disabled).toBe(false);
});
