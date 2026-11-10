const lfo = require('../js/utils/waveformLfo');
test('normalizes LFO rate/depth and never exceeds unity gain', () => {
  expect(lfo.normalize({rate: null, depth: ''})).toEqual({enabled:false,rate:2,depth:60,type:0});
  expect(lfo.normalize({enabled:'true',rate:9999,depth:-1})).toEqual({enabled:true,rate:1300,depth:0,type:0});
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
  const gains=[]; const osc={connect:jest.fn(),disconnect:jest.fn(),start:jest.fn(),stop:jest.fn(),frequency:param(),setPeriodicWave:jest.fn()};
  const context={currentTime:2,createWaveShaper:()=>({connect:jest.fn(),disconnect:jest.fn()}),createPeriodicWave:jest.fn(),createConstantSource:()=>({offset:param(),connect:jest.fn(),disconnect:jest.fn(),start:jest.fn(),stop:jest.fn()}),createOscillator:()=>osc,createGain:()=>{const g={gain:param(),connect:jest.fn(),disconnect:jest.fn()};gains.push(g);return g;}};
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


test('waveform folding matches the carrier shape at a fixed quarter-cycle origin', () => {
  const { generateWaveValue } = require('../js/utils/barPattern');
  for (const type of [0, .3, 1, 1.4, 2, 2.7, 3]) for (let i = 1; i < 100; i++) {
    expect(lfo.wave(i / 100, type)).toBeCloseTo(generateWaveValue(i / 100 + .25, type), 10);
    const amplitude = lfo.amplitude(i / 100, {enabled:true,rate:1,depth:100,type});
    expect(amplitude).toBeGreaterThanOrEqual(0);
    expect(amplitude).toBeLessThanOrEqual(1);
  }
});

test('logarithmic rate scaling includes Grandmother endpoints and round trips hundredths', () => {
  expect(lfo.positionRate(0)).toBe(.07); expect(lfo.positionRate(1)).toBe(1300);
  for (const rate of [.07, .1, .29, 2, 8, 100, 1300]) expect(lfo.positionRate(lfo.ratePosition(rate))).toBe(rate);
  expect(lfo.normalize({rate:-9,type:99})).toMatchObject({rate:.07,type:3});
});

test('rate changes integrate continuously and clock handoffs preserve phase and amplitude', () => {
  const values = {enabled:true,rate:2,depth:100,type:0};
  const transport = lfo.createTransport(values);
  const before = transport.sample(.2);
  transport.update({...values,rate:4,depth:25},.2);
  for (const key of Object.keys(before)) expect(transport.sample(.2)[key]).toBeCloseTo(before[key],12);
  const state = transport.sample(.25);
  expect(state.phase).toBeCloseTo((.4 + 4 * .05 + (2 - 4) * .015 * (1 - Math.exp(-.05 / .015))) % 1, 10);
  const replacement = lfo.createTransport({...values,rate:4,depth:25},10,state);
  for (const key of Object.keys(state)) expect(replacement.sample(10)[key]).toBeCloseTo(state[key],12);
  expect(replacement.sample(10.1).phase).toBeCloseTo(transport.sample(.35).phase,10);
});

test('display sampling converges to the correct mean without high-rate alias beats', () => {
  for (const type of [0,.5,1,1.5,2,2.5,3]) for (const rate of [10,100,1300]) {
    const values={enabled:true,rate,depth:100,type};
    const clock=lfo.createTransport(values);
    const frames=Array.from({length:120},(_,i)=>lfo.visualAmplitude(clock.sample(i/60),type));
    frames.forEach(value=>expect(value).toBeCloseTo(lfo.mean(type),10));
  }
  const clock=lfo.createTransport({enabled:true,rate:2,depth:100});
  expect(lfo.visualAmplitude(clock.sample(.125))).toBe(1);
  expect(lfo.visualAmplitude(clock.sample(.375))).toBe(0);
});

test('LFO scales the shared polygon uniformly from the fixed bottom without changing x', () => {
  const {createWaveformPatternGeometry}=require('../js/utils/barPattern');
  for (const waveformType of [0,1,2,3]) {
    const options={waveformType,barY:10,barHeight:18,timeSeconds:.32};
    const full=createWaveformPatternGeometry(options);
    const half=createWaveformPatternGeometry({...options,waveformAmplitude:.5});
    half.curve.forEach((p,i)=>{expect(p.x).toBe(full.curve[i].x);expect(p.y).toBeCloseTo(28-(28-full.curve[i].y)*.5,10);});
    expect(createWaveformPatternGeometry({...options,waveformAmplitude:0}).curve.every(p=>p.y===28)).toBe(true);
  }
});

test('GIF closes both clocks, preserves carrier live speed, and averages audio-rate LFO', () => {
  const {getLoopingGifFramePlan,getLoopingAnimationState}=require('../js/utils/loopingGif');
  for (const rate of [.07,.2,.33,2,4.99]) {
    const values={waveformSpeed:.3,waveformLfo:true,waveformLfoRate:rate,waveformLfoDepth:100};
    const plan=getLoopingGifFramePlan('waveform',values);
    expect(plan.periodSeconds*.3).toBeCloseTo(Math.round(plan.periodSeconds*.3),8);
    expect(plan.periodSeconds*rate).toBeCloseTo(Math.round(plan.periodSeconds*rate),8);
    expect(plan.frameCount).toBeLessThanOrEqual(3000);
    expect(getLoopingAnimationState('waveform',values,{phase:.4}).timeSeconds).toBeCloseTo(.4/.3,8);
  }
  expect(getLoopingGifFramePlan('waveform',{waveformLfo:true,waveformLfoRate:1300,waveformLfoDepth:100}).periodSeconds).toBeCloseTo(1/.3,8);
});


test('the actual audio coefficient output follows all carrier folds including pulse DC and phase handoff', () => {
  const {generateWaveValue}=require('../js/utils/barPattern');
  for(const type of [0,.5,1,1.5,2,2.5,3]) for(const initialPhase of [0,.123]) {
    const parameter=()=>({setValueAtTime:jest.fn(),setTargetAtTime:jest.fn(),cancelScheduledValues:jest.fn()});
    const node=()=>({connect:jest.fn(),disconnect:jest.fn()});
    let coefficients,biasValue=0;
    const context={currentTime:0,createGain:()=>({...node(),gain:parameter()}),createWaveShaper:node,
      createConstantSource:()=>({...node(),start:jest.fn(),stop:jest.fn(),offset:{setValueAtTime:value=>{biasValue=value;}}}),
      createOscillator:()=>({...node(),frequency:parameter(),setPeriodicWave:jest.fn(),start:jest.fn(),stop:jest.fn()}),
      createPeriodicWave:(real,imaginary)=>{coefficients={real,imaginary};return coefficients;}};
    lfo.create(context,{}, {enabled:true,rate:1,depth:100,type},{phase:initialPhase});
    for(let i=1;i<100;i++) {
      const phase=i/100,wrapped=((phase+initialPhase+.25)%1);
      if([0,.5,.8,1].some(edge=>Math.abs(wrapped-edge)<.03)) continue;
      let value=biasValue;
      for(let n=1;n<coefficients.real.length;n++) value+=coefficients.real[n]*Math.cos(2*Math.PI*n*phase)+coefficients.imaginary[n]*Math.sin(2*Math.PI*n*phase);
      const amplitude=(1+Math.max(-1,Math.min(1,value)))/2;
      expect(amplitude).toBeCloseTo(generateWaveValue(phase+initialPhase+.25,type),1);
    }
  }
});
