const lfo = require('../js/utils/waveformLfo');
test('normalizes LFO rate/depth and never exceeds unity gain', () => {
  expect(lfo.normalize({rate: null, depth: ''})).toEqual({enabled:false,rate:2,depth:60});
  expect(lfo.normalize({enabled:'true',rate:99,depth:-1})).toEqual({enabled:true,rate:8,depth:0});
  for (const depth of [0,25,60,100]) for (let n=0;n<100;n++) {
    const gain=lfo.amplitude(n/100,{enabled:true,rate:2,depth});
    expect(gain).toBeGreaterThanOrEqual(1-depth/100-1e-12);
    expect(gain).toBeLessThanOrEqual(1);
  }
  expect(lfo.amplitude(.375,{enabled:true,rate:2,depth:100})).toBe(0);
  expect(lfo.amplitude(.375,{enabled:false,rate:2,depth:100})).toBe(1);
});
test('audio graph modulates the gain AudioParam, updates smoothly and stops once', () => {
  const param=()=>({setValueAtTime:jest.fn(),setTargetAtTime:jest.fn(),cancelScheduledValues:jest.fn()});
  const gains=[]; const osc={connect:jest.fn(),disconnect:jest.fn(),start:jest.fn(),stop:jest.fn(),frequency:param()};
  const context={currentTime:2,createOscillator:()=>osc,createGain:()=>{const g={gain:param(),connect:jest.fn(),disconnect:jest.fn()};gains.push(g);return g;}};
  const destination={}; const voice=lfo.create(context,destination,{enabled:true,rate:2,depth:100});
  expect(gains[1].connect).toHaveBeenCalledWith(gains[0].gain);
  expect(gains[0].connect).toHaveBeenCalledWith(destination);
  expect(gains[0].gain.setValueAtTime).toHaveBeenCalledWith(.5,2);
  expect(gains[1].gain.setValueAtTime).toHaveBeenCalledWith(.5,2);
  voice.update({enabled:false,rate:4,depth:100});
  expect(gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(1,2,.015);
  expect(gains[1].gain.setTargetAtTime).toHaveBeenCalledWith(0,2,.015);
  voice.stop(2.05);voice.stop();expect(osc.stop).toHaveBeenCalledTimes(1);
  osc.onended();expect(gains[0].disconnect).toHaveBeenCalled();
});
