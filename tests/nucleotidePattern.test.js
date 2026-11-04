const model = require('../js/utils/nucleotidePattern');
const { createBarPatternSVG } = require('../js/utils/barPattern');
test('nucleotide alphabet, case, empty input and work bound', () => {
  expect(model.normalize('a t-CgU!N123🙂')).toBe('ATCGU');
  expect(model.normalize('N')).toBe('');
  expect(model.normalize('A'.repeat(10000))).toHaveLength(60);
});
test('presets retain versioned coding-region excerpts and explicit RNA transcription', () => {
  expect(model.presets[0]).toMatchObject({accession:'NM_000207.3', range:'60–89', sequence:'ATGGCCCTGTGGATGCGCCTCCTGCCCCTG'});
  expect(model.presets[1]).toMatchObject({accession:'NM_000518.5', range:'51–80', sequence:'ATGGTGCATCTGACTCCTGAGGAGAAGTCT'});
  expect(model.presets[2].sequence).toBe(model.presets[0].sequence.replace(/T/g,'U'));
  model.presets.forEach(preset => expect(preset.sequence).toHaveLength(30));
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
