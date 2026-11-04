const model = require('../js/utils/nucleotidePattern');
const { createBarPatternSVG } = require('../js/utils/barPattern');
test('nucleotide alphabet, case, empty input and work bound', () => {
  expect(model.normalize('a t-CgU!N123🙂')).toBe('ATCGU');
  expect(model.normalize('N')).toBe('');
  expect(model.normalize('A'.repeat(10000))).toHaveLength(50);
});
test('presets retain versioned coding-region excerpts and explicit RNA transcription', () => {
  expect(model.presets[0]).toMatchObject({accession:'NM_000207.3', range:'60–109', sequence:'ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTG'});
  expect(model.presets[1]).toMatchObject({accession:'NM_000518.5', range:'51–100', sequence:'ATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGG'});
  expect(model.presets[2].sequence).toBe(model.presets[0].sequence.replace(/T/g,'U'));
  model.presets.forEach(preset => expect(preset.sequence).toHaveLength(50));
});
test('one shape per base and U shares the T shape, not a sixth invented symbol', () => {
  const svg = model.svg({sequence:'ATCGU'});
  expect(svg.match(/<path /g)).toHaveLength(5);
  expect(model.svg({sequence:'U'}).replace('data-base="U"','data-base="T"')).toBe(model.svg({sequence:'T'}));
  expect(model.svg({sequence:''})).toBe('');
  expect(model.svg({sequence:'ATCG',variant:'backbone'})).toContain('<rect');
  expect(svg).not.toContain('<rect');
});
test('shared renderer uses the same bounded geometry in translated export coordinates', () => {
  const values={nucleotideSequence:'ATCGU',nucleotideVariant:'backbone'};
  expect(createBarPatternSVG({currentShader:25,barStartX:2,barY:3,exactBarWidth:250,barHeight:18,fgColor:'#000000',values}))
    .toBe(model.svg({sequence:'ATCGU',variant:'backbone',x:2,y:3,width:250,height:18,fill:'#000000'}));
});

test.each([0,1,5,29,30,31,40,50,60])('preview uses the minimum before ready, then only actual bases at input length %i', length => {
  const sequence='ATCGU'.repeat(12).slice(0,length);
  const count=Math.min(length,50);
  const preview=model.svg({sequence,preview:true});
  const output=model.svg({sequence});
  expect((preview.match(/data-base=/g)||[]).length).toBe(count);
  expect((preview.match(/data-placeholder=/g)||[]).length).toBe(Math.max(0,30-count));
  expect(output).not.toContain('data-placeholder');
  if (count<30) expect(preview).toContain('stroke-dasharray="1.4 1.2"');
  else expect(preview).toBe(output);
});
test('every entered count from 30 through 50 is export-ready, independent of old targets', () => {
  let style='nucleotide',sequence='ATCGU';
  const root={querySelector:id=>({value:id==='#style-select'?style:sequence})};
  expect(model.exportBlocker(root)).toMatch(/Add 25 bases/);
  sequence='A'.repeat(29);expect(model.exportBlocker(root)).toMatch(/Add 1 base/);
  for (let count=30;count<=50;count++) {
    sequence='A'.repeat(count);expect(model.exportBlocker(root)).toBe('');
  }
  sequence='';style='solid';expect(model.exportBlocker(root)).toBe('');
});
test('the 30-base gap stays fixed as segments shrink to fit more bases, without overlap', () => {
  for (let count=1;count<=50;count++) {
    const paths=[...model.svg({sequence:'A'.repeat(count)}).matchAll(/d="M([\d.e+-]+) 0 H([\d.e+-]+)/g)];
    expect(paths).toHaveLength(count);
    const toothWidth=Number(paths[0][2])-Number(paths[0][1]);
    const pitch=250/Math.max(30,count),gap=pitch-toothWidth;
    expect(toothWidth).toBeGreaterThan(0);
    expect(toothWidth).toBeLessThan(pitch);
    expect(Number(paths[0][1])).toBeGreaterThanOrEqual(0);
    expect(Number(paths.at(-1)[2])).toBeLessThanOrEqual(250);
    expect(gap).toBeCloseTo(4/3,10);
    if(count>1) expect(Number(paths[1][1])-Number(paths[0][2])).toBeCloseTo(4/3,10);
    if(count<=30) expect(toothWidth).toBeCloseTo(7);
    if(count===50) expect(toothWidth).toBeCloseTo(11/3);
  }
});

describe('maximum feedback lifecycle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
  function setup() {
    const handlers={},classes=new Set();
    const input={value:'A'.repeat(50),selectionStart:50,selectionEnd:50,
      addEventListener:(type,handler)=>{handlers[type]=handler;}};
    const error={hidden:true,textContent:''};
    const control={offsetWidth:0,classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}};
    const nodes={'#nucleotide-input':input,'#nucleotide-limit-error':error,
      '#nucleotide-sequence-control':control,'#style-select':{value:'nucleotide'}};
    const root={querySelector:selector=>nodes[selector]||null};
    const onEdit=jest.fn();
    model.bindInput(root,onEdit);
    const reject=()=>{const event={key:'A',preventDefault:jest.fn()};handlers.keydown(event);return event;};
    return {root,input,error,classes,onEdit,reject,blur:()=>handlers.blur()};
  }
  test('a blocked edit clears its notice after four seconds while the valid sequence stays exportable', () => {
    const state=setup();
    expect(state.reject().preventDefault).toHaveBeenCalled();
    expect(state.error.hidden).toBe(false);
    expect(state.classes.has('is-limit-error')).toBe(true);
    jest.advanceTimersByTime(650);
    expect(state.classes.has('is-limit-error')).toBe(false);
    expect(state.error.hidden).toBe(false);
    jest.advanceTimersByTime(3349);
    expect(state.error.hidden).toBe(false);
    jest.advanceTimersByTime(1);
    expect(state.error.hidden).toBe(true);
    expect(state.error.textContent).toBe('');
    expect(state.input.value).toHaveLength(50);
    expect(model.exportBlocker(state.root)).toBe('');
    expect(state.onEdit).not.toHaveBeenCalled();
  });
  test('repeated attempts renew the notice and leaving the field clears pending feedback', () => {
    const state=setup();
    state.reject();jest.advanceTimersByTime(3000);
    state.reject();jest.advanceTimersByTime(1000);
    expect(state.error.hidden).toBe(false);
    state.blur();
    expect(state.error.hidden).toBe(true);
    expect(state.classes.has('is-limit-error')).toBe(false);
    jest.advanceTimersByTime(5000);
    state.reject();
    expect(state.error.hidden).toBe(false);
    jest.advanceTimersByTime(4000);
    expect(state.error.hidden).toBe(true);
  });
});
