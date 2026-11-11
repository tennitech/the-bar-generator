const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../js/utils/quantumStudyModel');
const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
function harness(style = 'well-modes', search = '', reduced = false) {
  const target = () => ({ value: '', checked: false, style: {}, dataset: {}, listeners: {},
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
    emit(type, event = {}) { for (const listener of this.listeners[type] || []) listener(event); }, setAttribute: jest.fn() });
  const elements = {};
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const attrs = Object.fromEntries(Array.from(match[0].matchAll(/([\w-]+)="([^"]*)"/g), m => [m[1],m[2]]));
    elements[match[1]] = Object.assign(target(), { ...attrs, defaultValue: attrs.value || '', defaultChecked: /\bchecked\b/.test(match[0]), checked: /\bchecked\b/.test(match[0]), dataset: { urlParameter: attrs['data-url-parameter'] } });
  }
  for (const [prefix, slug] of [['well','well-modes'],['rabi','rabi']]) elements[`${slug}-group`].querySelectorAll = () => Object.values(elements).filter(el => el.id.startsWith(`${prefix}-`) && el.dataset.urlParameter);
  elements['style-select'].value = style;
  const document = Object.assign(target(), { getElementById: id => elements[id], hidden: false });
  const media = Object.assign(target(), { matches: reduced });
  const editors = [];
  const window = Object.assign(target(), { quantumStudyModel: model, MotionSpeed: require('../js/utils/motionSpeed'), location: { search },
    matchMedia: () => media, registerSliderValueEditor: editor => editors.push(editor), parseSliderNumericInput: Number,
    ParameterControls: { refreshStyle: jest.fn() }, requestUpdate: jest.fn(), updateUrlParameters: jest.fn() });
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/utils/quantumStudyControls'), 'utf8'), { window, document, URLSearchParams });
  window.quantumStudyControls.setup();
  return { window, elements, document, media, editors, controls: window.quantumStudyControls,
    set(id, value) { elements[id].value = value; elements[id].emit('input'); },
    loop(prefix, checked) { elements[`${prefix}-motion-toggle`].checked = checked; elements[`${prefix}-motion-toggle`].emit('change'); } };
}
test.each(['well-modes','rabi'])('%s starts, pauses at current frame, seeks and resumes without catch-up', style => {
  const h = harness(style), prefix = style === 'rabi' ? 'rabi' : 'well';
  h.controls.tick(0); h.controls.tick(50);
  const phase = h.controls.values()[`${prefix}Phase`];
  expect(phase).toBeGreaterThan(prefix === 'well' ? .15 : .12);
  h.loop(prefix,false); h.controls.tick(5000);
  expect(h.controls.values()[`${prefix}Phase`]).toBe(phase);
  h.set(`${prefix}-phase`,.371); h.controls.tick(6000); h.controls.tick(6050);
  expect(h.controls.values()[`${prefix}Phase`]).toBeCloseTo(.371,12);
  h.loop(prefix,true); h.controls.tick(10000); h.controls.tick(10020);
  expect(h.controls.values()[`${prefix}Phase`]).toBeCloseTo(.371 + .02/8,12);
});
test('chosen phase ignores animation; query settings restore zero and reverse, hidden and reduced motion pause safely', () => {
  const h = harness('well-modes','?wellN1=6&wellN2=6&wellPopulation=0&wellPhase=0&wellSpeed=.2&wellReverse=true');
  expect(h.controls.values()).toMatchObject({wellN1:6,wellN2:5,wellPopulation:0,wellPhase:0,wellSpeed:.2,wellReverse:true});
  h.controls.tick(0); h.controls.tick(50);
  expect(h.controls.settingPhase('well')).toBe(0);
  const phase=h.controls.values().wellPhase;
  h.document.hidden=true; h.controls.tick(5000); expect(h.controls.values().wellPhase).toBe(phase);
  h.document.hidden=false; h.controls.tick(6000); expect(h.controls.values().wellPhase).toBe(phase);
  h.media.emit('change',{matches:true}); expect(h.elements['well-motion-toggle'].checked).toBe(false);
  const r=harness('rabi','',true); expect(r.elements['rabi-motion-toggle'].checked).toBe(false);
  r.loop('rabi',true); r.controls.tick(0); r.controls.tick(50); expect(r.controls.values().rabiPhase).toBeGreaterThan(.12);
});
test('mode collisions adjust the other mode visibly; restored illegal pair is normalized', () => {
  const h=harness(); h.set('well-n1',3);
  expect(h.controls.values()).toMatchObject({wellN1:3,wellN2:4});
  expect(h.elements['well-notice'].textContent).toContain('Mode B changed to 4');
  h.elements['well-n1'].value='6';h.elements['well-n2'].value='6';h.controls.restoreSettingPhase();h.controls.sync();
  expect(Number(h.elements['well-n2'].value)).toBe(5);
});
test.each(['well-modes','rabi'])('%s reset restores authored model, randomize changes settings, slider and numeric editing hold playback', style => {
  const h=harness(style),prefix=style==='rabi'?'rabi':'well';
  const initial=h.controls.values();
  h.controls.randomize(style); expect(h.controls.values()).not.toEqual(initial);
  h.controls.reset(style); expect(h.controls.values()).toEqual(initial);
  const input=h.elements[`${prefix}-phase`];input.emit('pointerdown',{pointerId:7});h.set(`${prefix}-phase`,.5);
  h.controls.tick(0);h.controls.tick(50);expect(h.controls.values()[`${prefix}Phase`]).toBe(.5);
  h.window.emit('pointerup',{pointerId:7});h.controls.tick(10000);h.controls.tick(10020);
  expect(h.controls.values()[`${prefix}Phase`]).toBeCloseTo(.5+.02/8,12);
  const editor=h.editors.find(e=>e.slider===input);editor.editorInput={};const phase=h.controls.values()[`${prefix}Phase`];
  h.controls.tick(20000);h.controls.tick(20050);expect(h.controls.values()[`${prefix}Phase`]).toBe(phase);
  input.value=editor.parseValue('42.5');editor.editorInput=null;editor.commit();
  expect(h.controls.values()[`${prefix}Phase`]).toBeCloseTo(.425,12);
});
test('working studies are routable and enabled only in Under Construction, not promoted Home catalog', () => {
  const construction=html.match(/<optgroup label="Under Construction">([\s\S]*?)<\/optgroup>/)[1];
  const routes=require('../js/utils/generatorRoutes');
  const catalog=fs.readFileSync(require.resolve('../js/utils/marqueeCatalog'),'utf8');
  for(const style of ['well-modes','rabi']) {
    expect(construction).toContain(`<option value="${style}">`);
    expect(routes.normalizeStyleValue(style)).toBe(style);
    expect(fs.existsSync(require('node:path').join(__dirname,`../generator/${style}/index.html`))).toBe(true);
    expect(catalog).not.toContain(`'${style}'`);
  }
});

test('all routed inline scripts remain syntactically valid after the cache upgrade', () => {
  const path = require('node:path'), root = path.join(__dirname,'..');
  const pages = fs.readdirSync(root).filter(file=>file.endsWith('.html')).map(file=>path.join(root,file));
  for(const entry of fs.readdirSync(path.join(root,'generator'),{withFileTypes:true})) {
    const candidate=entry.isDirectory()?path.join(root,'generator',entry.name,'index.html'):path.join(root,'generator',entry.name);
    if(candidate.endsWith('.html')&&fs.existsSync(candidate)) pages.push(candidate);
  }
  let count=0;
  for(const page of pages) for(const match of fs.readFileSync(page,'utf8').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(/\bsrc=|type="application\//.test(match[1])) continue;
    expect(()=>new vm.Script(match[2],{filename:page})).not.toThrow();count++;
  }
  expect(count).toBeGreaterThan(70);
  const bootstrap=fs.readFileSync(require.resolve('../js/generatorBootstrap'),'utf8');
  expect(bootstrap).toContain("'quantumStudyModel'");
  for(const style of ['well-modes','rabi']) {
    const route=fs.readFileSync(path.join(root,`generator/${style}/index.html`),'utf8');
    expect(route).toContain("generator/index.html?v=20261111-quantum-studies");
    expect(route).toContain("js/generatorBootstrap.js?v=20261111-quantum-studies");
  }
});
