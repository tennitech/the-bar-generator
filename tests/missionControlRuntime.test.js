const fs = require('node:fs');
const vm = require('node:vm');
const asset = require('../js/utils/lunarBarAsset');
const main = fs.readFileSync(require.resolve('../js/main.js'), 'utf8');

function drawRuntime() {
  const classes = new Set();
  const context = {
    width: 1000, height: 700, previewControlSpace: 80, zoomLevel: 1,
    panOffset: { x: 0, y: 0 }, currentShader: 24, currentColorMode: 'lunar',
    lastAnimationFrameTimestamp: 0, liveCanvasUsesWebGL: true, isAnimated: false,
    REFERENCE_WIDTH: 250, REFERENCE_LOGO_HEIGHT: 111.4885, LOGO_VERTICAL_OFFSET: -75.24425,
    paths: { r: 'r', p: 'p', i: 'i' }, colors: { lunar: { fg: '#f4f7fb' }, white: { fg: '#ffffff' } },
    document: { hidden: false, body: { classList: { contains: value => classes.has(value) } } },
    quantumStudyControls: { tick: jest.fn() }, quantumControls: { tick: jest.fn() }, PageEntrance: { isHoldingArtwork: () => false },
    _renderer: { canvas: { width: 2000, height: 1400 } },
    createLunarBarVectorFragment: () => '',
    tickWaveformScope: jest.fn(), getAnimationNowMs: () => 1234, getCurrentMotionStyle: () => null,
    isMotionEnabledForStyle: () => false, getRenderedResponsiveLogoScale: () => context.fitScale,
    getPreviewFitLayout: () => ({ controlSpace: context.previewControlSpace }),
    isLunarBarVectorPreviewReady: () => context.ready,
    color: value => value, fitScale: 2, ready: true,
    ...Object.fromEntries(['clear', 'resetShader', 'push', 'pop', 'translate', 'scale', 'fill',
      'noStroke', 'drawSVGPath', 'drawBottomBar', 'updateHeaderBrandPreview'].map(name => [name, jest.fn()]))
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(main.slice(main.indexOf("let lastLunarPreviewFrame = ''"), main.indexOf('function drawBottomBar(')), context);
  return { context, classes };
}

describe('Artemis frame invalidation', () => {
  test('120 unchanged scheduler frames paint once, while other families continue drawing', () => {
    const { context: r } = drawRuntime();
    for (let i = 0; i < 120; i++) r.draw();
    expect(r.clear).toHaveBeenCalledTimes(1);
    expect(r.drawBottomBar).toHaveBeenCalledTimes(1);
    expect(r.quantumControls.tick).toHaveBeenCalledTimes(120);
    r.currentShader = 22;
    r.draw(); r.draw();
    expect(r.clear).toHaveBeenCalledTimes(3);
    expect(r.updateHeaderBrandPreview).toHaveBeenCalledTimes(2);
    r.currentShader = 24;
    r.draw();
    expect(r.clear).toHaveBeenCalledTimes(4);
  });

  test.each([
    ['viewport width', r => r.width++], ['viewport height', r => r.height++],
    ['pixel density', r => r._renderer.canvas.width++], ['buffer height', r => r._renderer.canvas.height++],
    ['control space', r => r.previewControlSpace++], ['responsive fit', r => r.fitScale++],
    ['zoom', r => r.zoomLevel++], ['pan X', r => r.panOffset.x++], ['pan Y', r => r.panOffset.y++],
    ['theme', r => { r.currentColorMode = 'white'; }],
    ['renderer replacement', r => { r._renderer = { canvas: { width: 2000, height: 1400 } }; }],
    ['explicit request', r => r.invalidateLunarPreviewFrame()]
  ])('%s repaints once then settles', (_, change) => {
    const { context: r } = drawRuntime();
    r.draw(); change(r); r.draw(); r.draw();
    expect(r.clear).toHaveBeenCalledTimes(2);
  });

  test('missing source/removed or hidden overlay cannot become a permanently cached empty frame', () => {
    const { context: r } = drawRuntime();
    r.ready = false;
    r.createLunarBarVectorFragment = undefined;
    r.draw(); r.draw();
    r.createLunarBarVectorFragment = () => '';
    r.ready = true;
    r.draw(); r.draw();
    expect(r.clear).toHaveBeenCalledTimes(1);
    r.ready = false; r.draw();
    r.ready = true; r.draw();
    expect(r.clear).toHaveBeenCalledTimes(2);
  });

  test.each(['hidden', 'intro', 'entrance'])('%s suspension invalidates the resumed frame', suspension => {
    const { context: r, classes } = drawRuntime();
    r.draw();
    if (suspension === 'hidden') r.document.hidden = true;
    if (suspension === 'intro') classes.add('has-logo-animation');
    if (suspension === 'entrance') r.PageEntrance.isHoldingArtwork = () => true;
    r.draw();
    expect(r.clear).toHaveBeenCalledTimes(1);
    r.document.hidden = false; classes.clear(); r.PageEntrance.isHoldingArtwork = () => false;
    r.draw(); r.draw();
    expect(r.clear).toHaveBeenCalledTimes(2);
  });
});

function overlayRuntime() {
  const writes = { markup: 0, transform: 0, color: 0 };
  const makeStyle = () => new Proxy({}, { set(target, key, value) {
    if (Object.hasOwn(writes, key)) writes[key]++;
    target[key] = value;
    return true;
  } });
  const root = { append: node => { node.isConnected = true; } };
  let overlay;
  const context = {
    currentShader: 24, currentColorMode: 'lunar',
    RPI_LOGO_GEOMETRY: require('../js/utils/logoGeometry').RPI_LOGO_GEOMETRY,
    shouldUseWhiteLunarBarSource: asset.shouldUseWhiteLunarBarSource,
    createLunarBarVectorFragment: jest.fn(asset.createLunarBarVectorFragment),
    drawLunarBarVector: jest.fn(),
    _renderer: { width: 1000, height: 700, uMVMatrix: { mat4: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
      uPMatrix: { mat4: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }, canvas: { parentElement: root } },
    document: { createElement: () => {
      overlay = { dataset: {}, style: {}, setAttribute: jest.fn(),
        set innerHTML(value) {
          writes.markup++; this.markup = value; this.firstElementChild = { style: makeStyle() };
        } };
      return overlay;
    } }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../js/drawing.js'), 'utf8'), context);
  const draw = (color, mode, target = null) => context.drawLunarBarPattern(target, 0, 0, 250, 18, color, mode);
  return { context, draw, writes, overlay: () => overlay };
}

describe('live Artemis source reuse', () => {
  test('same-source recolors retain actual SVG object identity without repeated transform writes', () => {
    const { context: r, draw, writes, overlay } = overlayRuntime();
    draw('#f4f7fb', 'lunar');
    const svg = overlay().firstElementChild;
    draw('#ffffff', 'white'); draw('#f4f7fb', 'lunar'); draw('#f4f7fb', 'lunar');
    expect(overlay().firstElementChild).toBe(svg);
    expect(writes).toEqual({ markup: 1, transform: 1, color: 3 });
    expect(overlay().markup).toContain('fill="currentColor" color="currentColor"');
    expect(r.createLunarBarVectorFragment).toHaveBeenCalledTimes(1);
    expect(r.isLunarBarVectorPreviewReady()).toBe(true);
    draw('#000000', 'black');
    expect(overlay().firstElementChild).not.toBe(svg);
    expect(writes.markup).toBe(2);
    expect(overlay().markup).toContain('viewBox="0 0 499.92 36"');
  });

  test('transform/connection/visibility changes recover, and raster exports bypass the live overlay', () => {
    const { context: r, draw, writes, overlay } = overlayRuntime();
    draw('#f4f7fb', 'lunar');
    r._renderer.uMVMatrix.mat4[12] = 5;
    draw('#f4f7fb', 'lunar');
    expect(writes.transform).toBe(2);
    r.syncLunarBarVectorPreviewVisibility(false);
    expect(r.isLunarBarVectorPreviewReady()).toBe(false);
    draw('#f4f7fb', 'lunar');
    expect(r.isLunarBarVectorPreviewReady()).toBe(true);
    overlay().isConnected = false;
    draw('#f4f7fb', 'lunar');
    expect(writes.markup).toBe(2);
    const target = { drawingContext: {} };
    draw('#ffffff', 'white', target);
    expect(r.drawLunarBarVector).toHaveBeenCalledWith(target.drawingContext, 0, 0, 250, 18, '#ffffff', 'white');
    expect(writes.markup).toBe(2);
  });
});

function counterRuntime() {
  let now = 123456789;
  let nextTimer = 1;
  const timers = new Map();
  const nodes = Object.fromEntries(['lunar-splashdown-counter', 'lunar-counter-detail-toggle', 'lunar-counter-detail',
    'lunar-counter-days', 'lunar-counter-hours', 'lunar-counter-minutes', 'lunar-counter-seconds'].map(id => {
    const node = new EventTarget();
    const attrs = new Map();
    let text = '';
    Object.assign(node, { writes: 0, attrWrites: 0,
      getAttribute: key => attrs.get(key), setAttribute: (key, value) => { node.attrWrites++; attrs.set(key, value); } });
    Object.defineProperty(node, 'textContent', { get: () => text, set: value => { node.writes++; text = value; } });
    return [id, node];
  }));
  const document = Object.assign(new EventTarget(), { hidden: false, getElementById: id => nodes[id] });
  const window = new EventTarget();
  const r = { document, window, Date: { now: () => now }, ARTEMIS_II_SPLASHDOWN_AT: 0,
    lunarCounterRoot: null, lunarCounterInterval: 0, hasBoundLunarCounterLifecycle: false, lunarCounterPageActive: true,
    invalidateLunarPreviewFrame: jest.fn(),
    isMissionControlThemeActive: () => r.active, active: false,
    setInterval: callback => { const id = nextTimer++; timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id), toggleLunarCounterDetail: () => {},
    handleLunarCounterOutsideClick: () => {}, handleLunarCounterKeydown: () => {} };
  r.counterVisible = true;
  nodes['lunar-splashdown-counter'].getClientRects = () => r.counterVisible ? [{}] : [];
  vm.createContext(r);
  vm.runInContext(main.slice(main.indexOf('function padCounterValue('), main.indexOf('function toggleLunarCounterDetail(')), r);
  const send = (target, event) => target.dispatchEvent(new Event(event));
  return { r, nodes, timers, send, advance: ms => { now += ms; } };
}

describe('Mission Control wall-time counter lifecycle', () => {
  test('runs exactly one timer only in active visible Mission Control, including BFCache/visibility recovery', () => {
    const { r, timers, send, advance, nodes } = counterRuntime();
    r.setupLunarSplashdownCounter();
    expect(timers.size).toBe(0);
    r.active = true; r.syncLunarSplashdownCounter();
    expect(timers.size).toBe(1);
    r.setupLunarSplashdownCounter(); r.setupLunarSplashdownCounter();
    expect(timers.size).toBe(1);
    const before = nodes['lunar-counter-seconds'].textContent;
    r.document.hidden = true; send(r.document, 'visibilitychange');
    expect(timers.size).toBe(0);
    advance(27000);
    r.document.hidden = false; send(r.document, 'visibilitychange');
    expect(timers.size).toBe(1);
    expect(nodes['lunar-counter-seconds'].textContent).not.toBe(before);
    send(r.window, 'pagehide'); expect(timers.size).toBe(0);
    send(r.document, 'visibilitychange'); expect(timers.size).toBe(0);
    send(r.window, 'pageshow'); expect(timers.size).toBe(1);
    expect(r.invalidateLunarPreviewFrame).toHaveBeenCalledTimes(2);
    r.active = false; r.syncLunarSplashdownCounter(); expect(timers.size).toBe(0);
    r.active = true; r.syncLunarSplashdownCounter(); expect(timers.size).toBe(1);
    r.counterVisible = false; r.syncLunarSplashdownCounter(); expect(timers.size).toBe(0);
    r.counterVisible = true; r.syncLunarSplashdownCounter(); expect(timers.size).toBe(1);
  });

  test('ticks write only changed fields and retain accessible elapsed-time descriptions', () => {
    const { r, timers, nodes, advance } = counterRuntime();
    r.active = true; r.setupLunarSplashdownCounter();
    const day = nodes['lunar-counter-days'];
    const second = nodes['lunar-counter-seconds'];
    const root = nodes['lunar-splashdown-counter'];
    r.syncLunarSplashdownCounter();
    expect(day.writes).toBe(1); expect(second.writes).toBe(1); expect(root.attrWrites).toBe(1);
    advance(1000); Array.from(timers.values())[0]();
    expect(day.writes).toBe(1); expect(second.writes).toBe(2); expect(root.attrWrites).toBe(2);
    expect(root.getAttribute('aria-label')).toMatch(/^Time since Artemis II splashdown: .* seconds$/);
    expect(nodes['lunar-counter-detail-toggle'].getAttribute('aria-label')).toMatch(/^Show Artemis II splashdown details/);
  });
});

describe('Complete first preview frame', () => {
  test('does not paint letters or clear a prior frame before a static bar is ready', () => {
    const { context: r } = drawRuntime();
    r.currentShader = 5;
    r.getReadyCanonicalBarImage = jest.fn(() => null);
    r.draw(); r.draw();
    expect(r.clear).not.toHaveBeenCalled();
    expect(r.drawSVGPath).not.toHaveBeenCalled();
    expect(r.drawBottomBar).not.toHaveBeenCalled();
    r.getReadyCanonicalBarImage.mockReturnValue({ width: 1000 });
    r.draw();
    expect(r.clear).toHaveBeenCalledTimes(1);
    expect(r.drawSVGPath).toHaveBeenCalledTimes(3);
    expect(r.drawBottomBar).toHaveBeenCalledTimes(1);
    r.getReadyCanonicalBarImage.mockReturnValue(null);
    r.draw();
    expect(r.clear).toHaveBeenCalledTimes(1);
  });

  test('signals the entrance only after the complete mark has been drawn', () => {
    const { context: r } = drawRuntime();
    r._renderer.canvas.dataset = {};
    r.PageEntrance.revealGenerator = jest.fn(() => {
      expect(r.drawSVGPath).toHaveBeenCalledTimes(3);
      expect(r.drawBottomBar).toHaveBeenCalledTimes(1);
    });
    r.draw(); r.draw();
    expect(r._renderer.canvas.dataset.previewReady).toBe('true');
    expect(r.PageEntrance.revealGenerator).toHaveBeenCalledTimes(1);
  });
});


test('entrance source freezes the exact rendered transform and rejects later layout changes', () => {
  const { context: r } = drawRuntime();
  r._renderer.canvas.dataset = {};
  r.buildHeaderPreviewSVG = () => '<svg><path d="official"/></svg>';
  r.PageEntrance.revealGenerator = jest.fn();
  r.draw();
  const [source, current] = r.PageEntrance.revealGenerator.mock.calls[0];
  expect(current()).toBe(true);
  expect(source()).toContain('translate(500 310) scale(2) translate(0 0) scale(1) translate(-125 -75.24425)');
  expect(source()).toContain('data-ascii-mark');
  r.width = 900; r.previewControlSpace = 120; r.panOffset.x = 3; r.fitScale = 1.5;
  expect(current()).toBe(false);
  expect(source()).toContain('width="1000" height="700"');
  expect(source()).toContain('translate(500 310) scale(2) translate(0 0)');
});
