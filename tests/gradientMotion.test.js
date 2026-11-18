const { createGradientPatternGeometry, createBarPatternSVG } = require('../js/utils/barPattern');
const { advanceLiveLoopPhase, getLoopingGifFramePlan, getLoopingAnimationState, normalizeLoopSpeed } = require('../js/utils/loopingGif');
const marquee = require('../js/utils/marqueeAnimation');

test.each([1, 2])('Gradient %s shows 21 logarithmic light levels and ignores historical phases', variant => {
  const options = {variant, barStartX:13, barY:7, exactBarWidth:500, barHeight:36};
  const original = createGradientPatternGeometry(options).rects;
  expect(original).toHaveLength(variant === 1 ? 21 : 63);
  const columns = original.filter((_, index) => variant === 1 || index % 3 === 0);
  expect(columns).toHaveLength(21);
  for (let i = 0; i < columns.length; i++) {
    const relativeLight = 2 ** -i;
    const minimumLight = 2 ** -20;
    expect(columns[i].width / columns[0].width)
      .toBeCloseTo(Math.log2(1 + relativeLight / minimumLight) / Math.log2(1 + 1 / minimumLight), 12);
    if (i > 0) {
      expect(columns[i].width).toBeLessThan(columns[i - 1].width);
      expect(columns[i].x).toBeGreaterThan(columns[i - 1].x + columns[i - 1].width);
    }
  }
  const pitches = columns.slice(1).map((r, i) => r.x + r.width / 2 - columns[i].x - columns[i].width / 2);
  pitches.forEach(pitch => expect(pitch).toBeCloseTo(pitches[0], 10));
  expect(columns[20].width).toBeGreaterThan(.5); // One pixel at a 1000px bar.
  expect(columns[0].x).toBeCloseTo(13, 10);
  expect(columns[20].x + columns[20].width).toBeCloseTo(513, 10);
  for (const phase of [undefined, 0, 1, -1, NaN, Infinity]) {
    expect(createGradientPatternGeometry({...options, gradientPhase:phase}).rects).toEqual(original);
  }
  expect(createGradientPatternGeometry({...options, gradientPhase:.25}).rects).toEqual(original);
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

test('Gradient cannot animate or export a looping GIF, even with legacy motion settings', () => {
  const { isLoopingGifEligibleStyle } = require('../js/utils/loopingGif');
  expect(isLoopingGifEligibleStyle('gradient')).toBe(false);
  expect(getLoopingGifFramePlan('gradient', { gradientSpeed: .4, gradientReverse: true })).toBeNull();
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
  const context = { normalizeStyleValue: x => x, currentShader: 17, MOTION_ENABLED_BY_STYLE: {ticker:true, waveform:true} };
  vm.runInNewContext(source.slice(source.indexOf('function styleSupportsMotion('), source.indexOf('function getMotionControlConfig(')), context);
  expect(context.styleSupportsMotion('gradient')).toBe(false);
  expect(context.getCurrentMotionStyle()).toBeNull();
  const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
  expect(html).not.toMatch(/id="gradient-(motion-toggle|speed-slider|reverse-toggle)"/);
});

test('Gradient SVG ignores historical phases and Home remains static', () => {
  const config = {currentShader:17,barStartX:0,barY:0,exactBarWidth:250,barHeight:18,fgColor:'#000000',values:{gradientVariant:2}};
  const resting = createBarPatternSVG(config);
  const moving = createBarPatternSVG({...config,values:{...config.values,gradientPhase:.25}});
  expect(moving).toBe(resting);
  expect(moving).not.toMatch(/opacity|linearGradient|NaN|undefined/);
  expect(marquee.createSettings({value:'gradient',query:'gradientVariant=2'})).toBeNull();
});

test.each(['ticker'])('%s resets its motion clock on every Loop change', style => {
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require.resolve('../js/main'), 'utf8');
  const context = {
    window: { barShareController: { isRestoring: () => false } },
    normalizeStyleValue: value => value,
    styleSupportsMotion: value => value === style,
    MOTION_ENABLED_BY_STYLE: { [style]: true },
    resetAnimationClock: jest.fn(),
    syncMotionToggleState: jest.fn(),
    requestUpdate: jest.fn()
  };
  vm.runInNewContext(source.slice(source.indexOf('function setMotionEnabledForStyle('), source.indexOf('function generateRandomStaffPattern(')), context);
  for (const enabled of [false, true, false, true]) {
    context.setMotionEnabledForStyle(style, enabled);
    expect(context.MOTION_ENABLED_BY_STYLE[style]).toBe(enabled);
  }
  expect(context.resetAnimationClock).toHaveBeenCalledTimes(4);
  context.window.barShareController.isRestoring = () => true;
  context.setMotionEnabledForStyle(style, false);
  expect(context.resetAnimationClock).toHaveBeenCalledTimes(4);
});

test.each([[1,'gradient.svg'],[2,'gradient-1.svg']])('Gradient %s phase zero exactly retains the shipped Home sample', (variant,file) => {
  const fs=require('node:fs'), path=require('node:path');
  const original=fs.readFileSync(path.join(__dirname,'../assets/images/marquee-bars',file),'utf8');
  const current=createBarPatternSVG({currentShader:17,barStartX:0,barY:0,exactBarWidth:250,barHeight:18,
    fgColor:'currentColor',values:{gradientVariant:variant,gradientPhase:0}});
  // Exclude the defensive viewport clip rectangle from both representations.
  const rectangles=svg=>[...svg.matchAll(/<rect [^>]*rx="0"[^>]*\/>/g)].map(match=>match[0]);
  expect(rectangles(current).length).toBe(variant===1?21:63);
  expect(rectangles(current)).toEqual(rectangles(original));
});
