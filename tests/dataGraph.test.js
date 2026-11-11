const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../js/utils/dataGraph');
const { createBarPatternSVG } = require('../js/utils/barPattern');

test.each(['', '1', '1,', ',1,2', '1,,2', '1, ,2', '1 NaN', '1 Infinity', '1 2px', '1 1e13', '0x10, 2', '1 <svg>', '1 '.repeat(201)])('invalid data %s never invents replacement samples', data => {
  const result = model.geometry({ graphData: data });
  expect(result.error).toBeTruthy(); expect(result.paths).toEqual([]);
  expect(model.svg({ graphData: data })).toBe('');
});
test('strict finite decimal parsing accepts zero, signs, whitespace, semicolons and exponents', () => {
  expect(model.parse('0, -2.5; +.25 1e3\n-2E-3')).toEqual({ values: [0, -2.5, .25, 1000, -.002], error: '' });
  expect(model.parse('0 '.repeat(200)).values).toHaveLength(200);
  expect(model.parse('0 '.repeat(201)).error).toBeTruthy();
});
test('line endpoints, index spacing and shared Y domain have independently known coordinates', () => {
  const graph = model.geometry({ graphData: '0, 5, 10', graphWeight: 2, barStartX: 20, barY: 100, exactBarWidth: 250, barHeight: 18 });
  expect(graph.min).toBe(0); expect(graph.max).toBe(10);
  expect(graph.paths).toEqual([[{ x: 21, y: 117 }, { x: 145, y: 109 }, { x: 269, y: 101 }]]);
  expect(model.geometry({ graphData: '5,5', graphWeight: 2 }).paths[0].map(p => p.y)).toEqual([9,9]);
  const multi = model.geometry({ graphData: '0, 10', graphData2: '5, 5', graphMulti: true });
  expect(multi.paths[1].every(p => p.y === 9)).toBe(true);
});
test('fit, zero-inclusive and forced zero-baseline columns report their actual domains', () => {
  expect(model.resolve({ graphData: '10, 20' })).toMatchObject({ min: 10, max: 20 });
  expect(model.resolve({ graphData: '10, 20', graphDomain: 'zero' })).toMatchObject({ min: 0, max: 20 });
  expect(model.resolve({ graphData: '-20, -10', graphVariant: 'columns' })).toMatchObject({ min: -20, max: 0 });
  expect(model.geometry({ graphData: '-1, 0, 1', graphVariant: 'columns' }).rects).toHaveLength(2);
  expect(model.geometry({ graphData: '0, 0', graphVariant: 'columns' }).rects).toHaveLength(0);
});
test('step interpolation holds the left sample; dots retain one primitive per sample', () => {
  const graph = model.geometry({ graphData: '0, 1, 0', graphVariant: 'step', graphWeight: 2 });
  expect(graph.paths[0]).toEqual([{x:1,y:17},{x:125,y:17},{x:125,y:1},{x:249,y:1},{x:249,y:17}]);
  expect(model.geometry({ graphData: '0, 1, 0', graphVariant: 'dots' }).circles).toHaveLength(3);
});
test.each(['line', 'step', 'dots', 'columns'])('%s stays inside the fixed viewport for dense, constant, bipolar and very small data', graphVariant => {
  for (const graphData of ['-1e12,0,1e12', '7,7', '-1,-1', '1e-300,2e-300', Array.from({ length: 200 }, (_, i) => i % 7).join(',')]) {
    const result = model.geometry({ graphData, graphVariant, graphWeight: 2, barStartX: 20, barY: 30 });
    for (const path of result.paths) for (const point of path) { expect(point.x).toBeGreaterThanOrEqual(21); expect(point.x).toBeLessThanOrEqual(269); expect(point.y).toBeGreaterThanOrEqual(31); expect(point.y).toBeLessThanOrEqual(47); }
    for (const circle of result.circles) { expect(circle.x-circle.radius).toBeGreaterThanOrEqual(20); expect(circle.x+circle.radius).toBeLessThanOrEqual(270); expect(circle.y-circle.radius).toBeGreaterThanOrEqual(30 - 1e-10); expect(circle.y+circle.radius).toBeLessThanOrEqual(48 + 1e-10); }
    for (const rect of result.rects) { expect(rect.x).toBeGreaterThanOrEqual(20); expect(rect.x+rect.width).toBeLessThanOrEqual(270); expect(rect.y).toBeGreaterThanOrEqual(30); expect(rect.y+rect.height).toBeLessThanOrEqual(48); }
  }
});
test('all static SVG callers and p5 share the same complete geometry', () => {
  for (const graphVariant of ['line', 'step', 'dots', 'columns']) {
    const values = { graphData: '-3,0,2,1', graphData2: '1,0,-2,1', graphMulti: true, graphVariant };
    const box = { barStartX: 12, barY: 28, exactBarWidth: 250, barHeight: 18 };
    expect(createBarPatternSVG({currentShader:12, ...box, fgColor:'#000000', values})).toBe(model.svg({...values,...box},'#000000'));
    const points=[], rects=[], circles=[];
    const target = Object.fromEntries(['push','pop','noFill','stroke','strokeWeight','strokeJoin','strokeCap','beginShape','endShape','noStroke','fill','rectMode','ellipseMode'].map(key=>[key,()=>{}]));
    target.vertex=(x,y)=>points.push({x,y}); target.rect=(x,y,width,height)=>rects.push({x,y,width,height}); target.ellipse=(x,y,w,h)=>circles.push({x,y,radius:w/2});
    model.draw(target,{...values,...box},'#000000');
    const geometry=model.geometry({...values,...box});
    expect(points).toEqual(geometry.paths.flat()); expect(rects).toEqual(geometry.rects); expect(circles).toEqual(geometry.circles);
  }
});
test('queries preserve empty drafts and migrate historical UTF-16 codes with an explicit legacy disclosure', () => {
  expect(model.readQuery(new URLSearchParams('graphData='))).toMatchObject({graphData:''});
  const old=model.readQuery(new URLSearchParams('graphText=RPI&graphScale=14&graphText2=AA&graphMulti=true'));
  expect(old).toMatchObject({graphData:'82, 80, 73',graphData2:'65, 65',graphSource:'legacy',graphMulti:true,graphWeight:1.2});
  expect(model.legacy('😀')).toBe('55357, 56832');
  expect(model.legacy('fuck')).toBe('');
  expect(model.readQuery(new URLSearchParams('graphData=1%2C2&graphText=RPI')).graphData).toBe('1,2');
});
test('invalid active comparison blocks the entire plot; hidden and empty optional series do not', () => {
  expect(model.resolve({graphData:'1,2',graphData2:'nope',graphMulti:true}).error).toMatch('Series 2');
  expect(model.resolve({graphData:'1,2',graphData2:'nope',graphMulti:false}).error).toBe('');
  expect(model.resolve({graphData:'1,2',graphMulti:true}).series).toEqual([[1,2]]);
});
test('graph remains under construction but is available, static and connected to shared model paths', () => {
  const html=fs.readFileSync('generator/index.html','utf8');
  expect(html).toMatch(/<optgroup label="Under Construction">[\s\S]*?<option value="graph">Data Graph<\/option>[\s\S]*?<\/optgroup>/);
  expect(fs.readFileSync('js/main.js','utf8')).toContain('window.DataGraph.draw(window,');
  expect(fs.readFileSync('js/drawing.js','utf8')).toContain('window.DataGraph.draw(pg,');
  expect(fs.readFileSync('js/drawing.js','utf8')).toContain('window.DataGraphControls?.exportBlocker()');
  expect(fs.readFileSync('js/utils/dataGraph.js','utf8')).not.toMatch(/requestAnimationFrame|setInterval|Math.random/);
});

test('SVG exports retain the scientific/source disclosure without raw input markup', () => {
  const xml = model.svg({graphData:'0,1',graphSource:'custom'});
  expect(xml).toContain('<desc>Data Graph. Entered numeric values.');
  expect(xml).toContain('shared Y range 0 to 1');
  expect(xml).toContain('No time or physical units are inferred.');
  expect(model.svg({graphData:'0,0',graphVariant:'columns'})).toBe('');
});
test('both compositions freeze entered data and reject bad graphs before export preparation', () => {
  const {createRuntime}=require('./helpers/exportCompositionRuntime');
  const r=createRuntime();r.select('graph');
  r.state.values.graphData='-1,0,1';r.state.values.graphSource='custom';
  for (const composition of ['bar','logo']) {
    r.state.composition=composition;
    const snap=r.captureLogoExportSnapshot();
    expect(snap.svgSource).toContain('shared Y range -1 to 1');
    expect(snap.values.graphData).toBe('-1,0,1');
    r.state.values.graphData='2,3';expect(snap.values.graphData).toBe('-1,0,1');r.state.values.graphData='-1,0,1';
  }
  r.state.values.graphData='';expect(()=>r.captureLogoExportSnapshot()).toThrow('Enter at least two numbers');
  r.state.values.graphData='0,0';r.state.values.graphVariant='columns';expect(()=>r.captureLogoExportSnapshot()).toThrow('All values are zero');
});
test('legacy snapshot controls migrate before native-field validation', () => {
  const context={DataGraph:model};context.window=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/utils/shareState.js','utf8'),context);
  const manifest={'style-select':{options:['graph']},'graph-data':{type:'text',maxLength:2400},'graph-data-2':{type:'text',maxLength:2400},'graph-source':{options:['sine','decay','custom','legacy']},'graph-multi-toggle':{type:'checkbox'}};
  const migrated=context.BarShareState.normalizeState({v:1,controls:{'style-select':'graph','graph-input':'RPI','graph-input-2':'AA','graph-multi-toggle':true}},manifest);
  expect(migrated.controls).toMatchObject({'graph-data':'82, 80, 73','graph-data-2':'65, 65','graph-source':'legacy','graph-multi-toggle':true});
});

test('unequal comparison series never invent corresponding column groups', () => {
  const data={graphData:'1,2,3',graphData2:'4,5',graphMulti:true};
  expect(model.resolve({...data,graphVariant:'line'}).error).toBe('');
  expect(model.resolve({...data,graphVariant:'columns'}).error).toMatch('same sample count');
});

test('numeric sample snapshots preserve valid values that resemble moderated leetspeak', () => {
  const {sanitizeControlText}=require('../js/utils/shareState');
  const sanitize=require('../js/utils/profanityFilter').sanitizeText;
  expect(sanitize('455,5')).not.toBe('455,5');
  expect(sanitizeControlText({id:'graph-data'},'455,5',sanitize)).toBe('455,5');
  expect(sanitizeControlText({id:'graph-data-2'},'1e3, -2',sanitize)).toBe('1e3, -2');
  expect(sanitizeControlText({id:'graph-data'},'fuck',sanitize)).toBe('****');
  expect(sanitizeControlText({id:'binary-input'},'455',sanitize)).toBe('***');
});
