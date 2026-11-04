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

test.each([0,1,5,29,30,31,50,60])('preview has dashed empty slots only below the minimum, input length %i', length => {
  const sequence = 'ATCGU'.repeat(12).slice(0,length);
  const preview = model.svg({sequence,preview:true});
  const output = model.svg({sequence});
  const count = Math.min(length,50);
  expect((preview.match(/data-base=/g)||[]).length).toBe(count);
  expect((preview.match(/data-placeholder=/g)||[]).length).toBe(Math.max(0,30-count));
  expect(output).not.toContain('data-placeholder');
  if (count < 30) expect(preview).toContain('stroke-dasharray="1.4 1.2"');
  else expect(preview).toBe(output);
  if (count && count <= 30) expect(preview.match(/<path[^>]+>/)[0]).toBe(model.svg({sequence:sequence.padEnd(30,'A')}).match(/<path[^>]+>/)[0]);
});
test('only nucleotide requires at least 30 bases, and every length through 50 is ready', () => {
  let style='nucleotide', sequence='ATCGU';
  const root={querySelector:id=>({value:id==='#style-select'?style:sequence})};
  expect(model.exportBlocker(root)).toMatch(/Add 25 bases/);
  sequence='A'.repeat(29);expect(model.exportBlocker(root)).toMatch(/Add 1 base to export/);
  for (let length=30;length<=50;length++) {
    sequence='A'.repeat(length);expect(model.exportBlocker(root)).toBe('');
  }
  sequence='';style='solid';expect(model.exportBlocker(root)).toBe('');
});
