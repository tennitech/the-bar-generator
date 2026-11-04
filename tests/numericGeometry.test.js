const {createNumericHeightPolygons, createBarPatternSVG} = require('../js/utils/barPattern');
const {digits} = require('../js/utils/numericControls');
const geometry = value => createNumericHeightPolygons({digits:digits(value),barStartX:0,barY:0,exactBarWidth:250,barHeight:18});
const svg = (value, mode) => createBarPatternSVG({currentShader:6,barStartX:0,barY:0,exactBarWidth:250,barHeight:18,fgColor:'#000',parseNumericString:digits,values:{numericValue:value,numericMode:mode}});

test('height cells form one closed silhouette without internal raster edges (#52)', () => {
  const points = geometry('0123456789')[0];
  expect(geometry('0123456789')).toHaveLength(1);
  for (let i = 0; i < 10; i++) {
    expect(points[2*i+1][0]).toBe(i*25);
    expect(points[2*i+2][0]).toBe((i+1)*25);
    expect(points[2*i+1][1]).toBeCloseTo(18-(i+1)*1.8);
  }
  expect(svg('0123456789','height').match(/<path /g)).toHaveLength(1);
  expect(svg('0123456789','height')).not.toContain('<rect');
});
test('zero is preserved and distinguishable from decimal in both encodings (#10, #54)', () => {
  expect(geometry('0')[0][1][1]).toBeCloseTo(16.2);
  expect(svg('0','dotmatrix')).toBe('');
  expect(svg('0.0','dotmatrix').match(/<rect /g)).toHaveLength(1);
  expect(svg('0.0','dotmatrix')).toContain('y="16.5"');
  const separated = geometry('0.0');
  expect(separated).toHaveLength(2);
  expect(separated[0].at(-1)[0]).toBeCloseTo(250/3);
  expect(separated[1][0][0]).toBeCloseTo(500/3);
});
test('decimal whitespace and natural edges have no added side strips or baseline (#34, #54)', () => {
  expect(geometry('.9')[0][0][0]).toBe(125);
  expect(geometry('9.')[0].at(-1)[0]).toBe(125);
  expect(geometry('')).toEqual([]);
  expect(svg('000','dotmatrix')).toBe('');
  expect(svg('.9','height').match(/<path /g)).toHaveLength(1);
  expect(svg('.9','height')).not.toMatch(/<rect|stroke=/);
});
test('fractional cell boundaries share exact coordinates up to the 100-character limit', () => {
  for (const count of [3,7,99,100]) {
    const points = geometry('9'.repeat(count))[0];
    for (let i=1;i<count;i++) expect(points[2*i][0]).toBe(points[2*i+1][0]);
    expect(points.at(-1)).toEqual([250,18]);
  }
});
