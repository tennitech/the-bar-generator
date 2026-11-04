const fs = require('node:fs');
const path = require('node:path');
const { normalizeTriangleGridSettings: normalize, createTriangleGridPatternGeometry: geometry, createBarPatternSVG: svg } = require('../js/utils/barPattern');
test('all three presets preserve the shipped SVG line geometry', () => {
  for (const [variant,suffix] of [[2,''],[1,'-1'],[3,'-2']]) {
    const source=fs.readFileSync(path.join(__dirname,`../assets/images/marquee-bars/triangle-grid${suffix}.svg`),'utf8');
    const output=svg({currentShader:15,barStartX:0,barY:0,exactBarWidth:250,barHeight:18,fgColor:'currentColor',values:{triangleGridVariant:variant}});
    const linePath = text => text.match(/<path d="([^"]+)" fill="none"/)[1];
    expect(linePath(output)).toBe(linePath(source));
    expect(geometry(normalize({variant}))).toEqual(geometry({variant}));
  }
});
test('controls are bounded and each changes the resulting lattice', () => {
  expect(normalize({rows:99,density:NaN,stroke:0,stagger:0})).toMatchObject({rows:6,density:100,stroke:40,stagger:0});
  const baseline=geometry();
  for(const values of [{rows:5},{density:70},{stroke:60},{stagger:20}]) expect(geometry(values)).not.toEqual(baseline);
});
test('all control extremes preserve stroke-center padding and a limited primitive budget', () => {
  for(const variant of [1,2,3])for(const rows of [1,3,6])for(const density of [50,100,150])for(const stroke of [40,100,160])for(const stagger of [0,50,100]) {
    const g=geometry({variant,rows,density,stroke,stagger,barStartX:20,barY:40});
    expect(g.lines.length).toBeLessThanOrEqual(1200);
    expect(g.lines.every(l=>[l.x1,l.x2].every(x=>Number.isFinite(x)&&x-g.thickness/2>=20-1e-8&&x+g.thickness/2<=270+1e-8)&&[l.y1,l.y2].every(y=>Number.isFinite(y)&&y-g.thickness/2>=40-1e-8&&y+g.thickness/2<=58+1e-8))).toBe(true);
  }
});
