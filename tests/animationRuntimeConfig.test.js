const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../animation/animation.js'),'utf8').split('const runtimeConfig = readRuntimeConfig();')[0];
function read(search, getItem = () => null, blocked = false) {
  const window = { location:{ search } };
  Object.defineProperty(window,'sessionStorage',{ get() {
    if (blocked) throw Error('SecurityError'); return { getItem };
  } });
  return vm.runInNewContext(`${source}\nreadRuntimeConfig()`,{ window,document:{getElementById:()=>null},URLSearchParams });
}
test('validated query ink survives unavailable storage without SVG/text in the URL', () => {
  expect(read('?overlay=1&foreground=%23000000',null,true)).toMatchObject({ isOverlay:true,foreground:'#000000' });
  expect(read('?overlay=1&foreground=%23000000&stateKey=blocked',null,true)).toMatchObject({ isOverlay:true,foreground:'#000000' });
});
test('missing or malformed stored geometry retains query fallback ink', () => {
  for (const value of [null,'not JSON','{}']) {
    expect(read('?foreground=%230081ce&stateKey=missing',()=>value)).toMatchObject({ foreground:'#0081ce',barSvg:'' });
  }
});
test('captured state remains authoritative over query fallback', () => {
  expect(read('?foreground=%23d6001c&stateKey=valid',()=>JSON.stringify({foreground:'#e1edf5',barSvg:'<svg/>',colorMode:'silver'})))
    .toMatchObject({ foreground:'#e1edf5',barSvg:'<svg/>',colorMode:'silver' });
});
