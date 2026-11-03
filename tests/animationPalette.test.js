const { resolve } = require('../js/utils/animationPalette');
test.each(Object.entries({black:'#000000',white:'#ffffff',red:'#d6001c',blue:'#0081ce',gold:'#cdac38',silver:'#e1edf5',gray:'#b9ccd8',lunar:'#f4f7fb'}))('%s keeps the actual artwork ink and visible backdrop', (colorMode, foreground) => {
 const result=resolve({colorMode,foreground});
 expect(result.ink).toBe(foreground);
 expect(result.background).toBe(colorMode==='black'?'#ffffff':'#000000');
});
test('rejects arbitrary CSS from stored state and retains a valid captured ink',()=>{
 expect(resolve({colorMode:'black',foreground:'url(https://example.test)'}).ink).toBe('#000000');
 expect(resolve({colorMode:'red',foreground:'#E1EDF5'}).ink).toBe('#e1edf5');
});
test.each(['__proto__', 'constructor', 'toString', 'not-a-mode', ''])('unknown/prototype mode %s cannot supply CSS ink', colorMode => {
 expect(resolve({colorMode,foreground:'red; background: url(https://example.test)'})).toEqual({
  ink:'#d6001c',background:'#000000',backgroundRGB:'0, 0, 0',text:'#ffffff'
 });
});
test('captured black ink controls contrast even when a stale mode says red',()=>{
 expect(resolve({colorMode:'red',foreground:'#000000'})).toEqual({
  ink:'#000000',background:'#ffffff',backgroundRGB:'255, 255, 255',text:'#000000'
 });
});
test('artwork contrast stays above 3:1 while explanatory UI text stays 21:1',()=>{
 const luminance=hex=>hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255)
  .map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4)
  .reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
 const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+0.05)/(Math.min(luminance(a),luminance(b))+0.05);
 for(const colorMode of ['black','white','red','blue','gold','silver','gray','lunar']){
  const result=resolve({colorMode});
  expect(contrast(result.ink,result.background)).toBeGreaterThanOrEqual(3);
  expect(contrast(result.text,result.background)).toBe(21);
 }
});
