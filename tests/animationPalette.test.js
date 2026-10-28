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
