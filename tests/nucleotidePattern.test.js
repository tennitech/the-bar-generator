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

test.each([30,40,50])('preview holds the chosen %i slots throughout typing', targetLength => {
  for (const length of [0,1,targetLength-1,targetLength,targetLength+1]) {
    const sequence='ATCGU'.repeat(12).slice(0,length);
    const count=Math.min(length,targetLength);
    const preview=model.svg({sequence,targetLength,preview:true});
    const output=model.svg({sequence,targetLength});
    expect((preview.match(/data-base=/g)||[]).length).toBe(count);
    expect((preview.match(/data-placeholder=/g)||[]).length).toBe(targetLength-count);
    expect(output).not.toContain('data-placeholder');
    if (count<targetLength) expect(preview).toContain('stroke-dasharray="1.4 1.2"');
    else expect(preview).toBe(output);
    if (count) expect(preview.match(/<path[^>]+>/)[0]).toBe(model.svg({sequence:sequence.padEnd(targetLength,'A'),targetLength}).match(/<path[^>]+>/)[0]);
  }
});
test('export readiness requires the chosen length, with no moving threshold', () => {
  let style='nucleotide',sequence='ATCGU',target=30;
  const root={querySelector:id=>({value:id==='#style-select'?style:id==='#nucleotide-length'?String(target):sequence})};
  expect(model.exportBlocker(root)).toMatch(/Add 25 bases/);
  for (target=30;target<=50;target++) {
    sequence='A'.repeat(target-1);expect(model.exportBlocker(root)).toMatch(/Add 1 base/);
    sequence='A'.repeat(target);expect(model.exportBlocker(root)).toBe('');
  }
  target=30;sequence='A'.repeat(40);expect(model.exportBlocker(root)).toMatch(/Remove 10 bases/);
  sequence='';style='solid';expect(model.exportBlocker(root)).toBe('');
});
test('target length is bounded independently of sequence input', () => {
  expect(model.normalizeLength(undefined)).toBe(50);
  expect(model.normalizeLength(null)).toBe(50);
  expect(model.normalizeLength('no')).toBe(50);
  expect(model.normalizeLength(20)).toBe(30);
  expect(model.normalizeLength(100)).toBe(50);
  expect(model.normalize('A'.repeat(50),30)).toHaveLength(30);
});
