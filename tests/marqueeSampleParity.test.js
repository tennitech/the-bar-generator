const {compareSvgSamples}=require('../scripts/generateMarqueeAssets');
test('sample parity keeps exact source when available and tolerates only final floating-point noise',()=>{
 const source='<svg viewBox="0 0 250 18"><circle r="0.7409895767628233" fill="currentColor"/></svg>';
 expect(compareSvgSamples(source,source)).toEqual({exact:true,maxDelta:0});
 const comparison=compareSvgSamples(source,source.replace('8233','8234'));
 expect(comparison.exact).toBe(false);expect(comparison.maxDelta).toBeLessThan(1e-10);
});
test.each([
 ['r="1.25"','r="1.25000001"'],
 ['fill="currentColor"','fill="none"'],
 ['<rect x="0"/>','<circle r="0"/>'],
 ['fill="#000000"','fill="#ffffff"']
])('sample parity rejects material changes: %s', (before,after)=>{
 expect(()=>compareSvgSamples(before,after)).toThrow();
});
