const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/utils/mobileBrowser'),'utf8');
function setup() {
  let observerCallback;
  let overlay = false;
  let background = '#000000';
  const root = { hasAttribute:()=>false,dataset:{},style:{} };
  const body = { classList:{ contains:()=>overlay },style:{ setProperty:jest.fn() } };
  const themeColor = { content:'' };
  const document = { documentElement:root,body,addEventListener:jest.fn(),querySelector:()=>themeColor,
    getElementById:id => id==='logo-animation-overlay' ? {style:{getPropertyValue:()=>background}} : null };
  const window = { matchMedia:()=>({matches:false,addEventListener:jest.fn()}),addEventListener:jest.fn() };
  function MutationObserver(callback) { observerCallback=callback; this.observe=jest.fn(); }
  vm.runInNewContext(source,{document,window,MutationObserver,getComputedStyle:()=>({backgroundColor:'rgb(16, 22, 29)'})});
  return {root,themeColor,change(value) { overlay=true;background=value;observerCallback(); },close() {overlay=false;observerCallback();} };
}
test.each([['#000000','dark'],['#ffffff','light'],['rgb(0, 0, 0)','dark'],['rgb(255, 255, 255)','light']])('%s keeps browser hint and scheme aligned with the intro', (background,scheme) => {
  const s=setup();s.change(background);
  expect(s.root.style.backgroundColor).toBe(background);expect(s.themeColor.content).toBe(background);
  expect(s.root.style.colorScheme).toBe(scheme);
  s.close();expect(s.root.style.colorScheme).toBe('dark');expect(s.themeColor.content).toBe('rgb(16, 22, 29)');
});
