const { createGradientPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');
const { advanceLiveLoopPhase, getLoopingGifFramePlan, getLoopingAnimationState, normalizeLoopSpeed } = require('../js/utils/loopingGif');
const marquee = require('../js/utils/marqueeAnimation');

test.each([1, 2])('Gradient %s preserves its resting artwork, grid and containment throughout a seamless loop', variant => {
  const options = {variant, barStartX:13, barY:7, exactBarWidth:500, barHeight:36};
  const original = createGradientPatternGeometry(options).rects;
  expect(original).toHaveLength(variant === 1 ? 24 : 72);
  for (const phase of [undefined, 0, 1, -1, NaN, Infinity]) {
    expect(createGradientPatternGeometry({...options, gradientPhase:phase}).rects).toEqual(original);
  }
  expect(createGradientPatternGeometry({...options, gradientPhase:.25}).rects).not.toEqual(original);
  for (let frame = 0; frame < 120; frame++) {
    const rects = createGradientPatternGeometry({...options, gradientPhase:frame/120}).rects;
    rects.forEach((rect,index) => {
      expect(rect.x + rect.width/2).toBeCloseTo(original[index].x + original[index].width/2, 9);
      expect(rect.y).toBe(original[index].y); expect(rect.height).toBe(original[index].height);
      expect(rect.width).toBeGreaterThan(0); expect(rect.x).toBeGreaterThanOrEqual(13 - 1e-8);
      expect(rect.x + rect.width).toBeLessThanOrEqual(513 + 1e-8);
    });
  }
  const before = createGradientPatternGeometry({...options, gradientPhase:1-1e-8}).rects;
  const after = createGradientPatternGeometry({...options, gradientPhase:1e-8}).rects;
  before.forEach((rect,i) => expect(Math.abs(rect.width-after[i].width)).toBeLessThan(1e-5));
});

test('Gradient live and GIF transport share rate, direction and the same phase at all supported speeds', () => {
  for (const gradientSpeed of [.02,.1,.2,.3,.4]) for (const gradientReverse of [false,true]) {
    const values = {gradientSpeed,gradientReverse};
    const plan = getLoopingGifFramePlan('gradient',values);
    expect(plan.periodSeconds).toBeCloseTo(1/gradientSpeed);
    const direction = gradientReverse ? -1 : 1;
    const next = advanceLiveLoopPhase(.5,'gradient',values,16);
    expect(next).toBeCloseTo(.5 + direction*gradientSpeed*.016);
    const state = getLoopingAnimationState('gradient',values,{phase:next});
    const phase = ((state.timeSeconds*gradientSpeed)%1+1)%1;
    expect(phase).toBeCloseTo(next);
    expect(plan.getTimeSeconds(.25)*gradientSpeed).toBeCloseTo(direction*.25);
  }
  expect(normalizeLoopSpeed('gradient',999)).toBe(.4);
  expect(normalizeLoopSpeed('gradient','bad')).toBe(.1);
});

test('Gradient SVG consumes the explicit phase while marquee samples opt out of individual motion', () => {
  const config = {currentShader:17,barStartX:0,barY:0,exactBarWidth:250,barHeight:18,fgColor:'#000000',values:{gradientVariant:2}};
  const resting = createBarPatternSVG(config);
  const moving = createBarPatternSVG({...config,values:{...config.values,gradientPhase:.25}});
  expect(moving).not.toBe(resting);
  expect(moving).not.toMatch(/opacity|linearGradient|NaN|undefined/);
  expect(marquee.createSettings({value:'gradient',query:'gradientVariant=2'})).toBeNull();
});

test('Gradient pause/resume preserves phase and rebases the timestamp through the real transport function', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require.resolve('../js/main'),'utf8');
  const context = { normalizeStyleValue: value=>value, styleSupportsMotion: value=>value==='gradient',
    MOTION_ENABLED_BY_STYLE:{gradient:true}, lastAnimationFrameTimestamp:123, liveMotionPhase:.37,
    resetAnimationClock:jest.fn(), syncMotionToggleState:jest.fn(), requestUpdate:jest.fn() };
  vm.runInNewContext(source.slice(source.indexOf('function setMotionEnabledForStyle('),source.indexOf('function generateRandomStaffPattern(')),context);
  context.setMotionEnabledForStyle('gradient',false);
  expect(context.MOTION_ENABLED_BY_STYLE.gradient).toBe(false);expect(context.liveMotionPhase).toBe(.37);
  expect(context.lastAnimationFrameTimestamp).toBe(0);expect(context.resetAnimationClock).not.toHaveBeenCalled();
  context.setMotionEnabledForStyle('gradient',true);
  expect(context.MOTION_ENABLED_BY_STYLE.gradient).toBe(true);expect(context.liveMotionPhase).toBe(.37);
  context.setMotionEnabledForStyle('gradient',true,{resetPhase:true});expect(context.resetAnimationClock).toHaveBeenCalledTimes(1);
});

test.each([1,2])('Gradient %s GIF renderer paints the shared geometry at every captured phase', variant => {
  const fs=require('node:fs'), vm=require('node:vm');
  const source=fs.readFileSync(require.resolve('../js/drawing'),'utf8');
  const rectangles=[];
  const ctx={setTransform(){},clearRect(){rectangles.length=0;},save(){},restore(){},scale(){},translate(){},fill(){},beginPath(){},rect(){},clip(){},
    fillRect(...args){rectangles.push(args);},getImageData(){return rectangles.map(rect=>[...rect]);}};
  const context={document:{createElement:()=>({getContext:()=>ctx})},Path2D:class {},createGradientPatternGeometry};
  vm.runInNewContext(source.slice(source.indexOf('function createCapturedGifRenderer('),source.indexOf('function startLogoDownload(')),context);
  for(const gradientReverse of [false,true]) {
    const values={gradientVariant:variant,gradientSpeed:.2,gradientReverse};
    const plan=getLoopingGifFramePlan('gradient',values);
    const geometry={width:250,barY:132.4885,barHeight:18,exportPadding:20,paths:{r:'',p:'',i:''}};
    const renderer=context.createCapturedGifRenderer({currentShader:17,family:'gradient',values,
      foreground:'#000000',dimensions:{width:1160,height:762,scale:4},geometry},plan);
    for(const phase of [0,.125,.25,.5,.75,1]) {
      const actual=renderer.renderFrame(0,phase);
      const expected=createGradientPatternGeometry({variant,barY:geometry.barY,gradientPhase:phase*(gradientReverse?-1:1)}).rects;
      expect(actual).toEqual(expected.map(rect=>[rect.x,rect.y,rect.width,rect.height]));
    }
    renderer.release();
  }
});


test.each([[1,'gradient.svg'],[2,'gradient-1.svg']])('Gradient %s phase zero exactly retains the shipped Home sample', (variant,file) => {
  const fs=require('node:fs'), path=require('node:path');
  const original=fs.readFileSync(path.join(__dirname,'../assets/images/marquee-bars',file),'utf8');
  const current=createBarPatternSVG({currentShader:17,barStartX:0,barY:0,exactBarWidth:250,barHeight:18,
    fgColor:'currentColor',values:{gradientVariant:variant,gradientPhase:0}});
  // Exclude the defensive viewport clip rectangle from both representations.
  const rectangles=svg=>[...svg.matchAll(/<rect [^>]*rx="0"[^>]*\/>/g)].map(match=>match[0]);
  expect(rectangles(current).length).toBe(variant===1?24:72);
  expect(rectangles(current)).toEqual(rectangles(original));
});
