const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalog = require('../js/utils/marqueeCatalog');
const routes = require('../js/utils/generatorRoutes');

function homepage() {
  const elements = [];
  const createElement = tag => {
    const element = {tag, dataset:{}, attributes:{}, children:[],
      style:{setProperty:jest.fn()},
      setAttribute(name,value) { this.attributes[name]=value; },
      append(child) { this.children.push(child); }};
    elements.push(element); return element;
  };
  const createAnimation = jest.fn(() => ({settings:new Map()}));
  const context=vm.createContext({
    window:{innerWidth:1440,innerHeight:900,location:{pathname:'/'},
      MarqueeCatalog:catalog,GeneratorRoutes:routes,MarqueeAnimation:{create:createAnimation}},
    document:{createElement,querySelector:()=>null,getElementById:()=>null,
      documentElement:{style:{setProperty:jest.fn()}}},
    encodeURI, Math, Map
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/marqueeUi.js'),'utf8'),context);
  return {context,elements,createAnimation};
}

test('every sample stays an SVG still and links to exactly its displayed configuration', () => {
  const {context,elements,createAnimation}=homepage();
  for(const sample of catalog.samples) {
    const asset=vm.runInContext(`createAssetElement(${JSON.stringify(sample.path)})`,context);
    expect(asset.tag).toBe('a');
    expect(asset.href).toBe(`/generator/${sample.value}/${sample.query ? `?${sample.query}` : ''}`);
    expect(asset.dataset.barVariant).toBe(sample.variant);
    expect(asset.dataset.barStyle).toBe(sample.value);
    expect(asset.attributes['aria-label']).toBe(`Open ${sample.label} in the generator`);
    expect(asset.children).toHaveLength(1);
    expect(asset.children[0].tag).toBe('img');
    expect(asset.children[0].src).toBe(encodeURI(sample.path));
    const svg=fs.readFileSync(path.join(__dirname,'..',sample.path.split('?')[0]),'utf8');
    expect(svg).not.toMatch(/<(?:animate\w*|set|script)\b|@keyframes|\banimation\s*:/i);
  }
  expect(createAnimation).not.toHaveBeenCalled();
  expect(elements.some(element=>element.tag==='canvas')).toBe(false);
});

test.each(['index.html','marquee-ui.html'])('%s never loads the optional live-preview renderer', file => {
  const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  expect(html).not.toContain('js/utils/marqueeAnimation.js');
  expect(html).toContain('Press Space to pause or resume scrolling.');
});
