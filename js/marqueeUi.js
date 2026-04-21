const BAR_ASSET_WIDTH = '28rem';
const ROW_HEIGHT = '3.9rem';
const ROW_GAP = '1.45rem';
const ROW_COUNT = 10;
const ROW_START_PERCENT = -7.5;
const ROW_STEP_PERCENT = 7.35;
const ROW_REFERENCE_VIEWPORT_HEIGHT = 822;
const ROW_LEFT = '-44vw';
const ROW_WIDTH = '220vw';
const MEASUREMENT_EPSILON = 0.5;
const HOVER_SPEED_FACTOR = 0.16;
const PRESS_SPEED_FACTOR = 0.08;
const EASE_RATE = 5.2;
const STARTUP_STYLE_PROMPT_DELAY = 5000;
const BASE_SPEEDS = [62, 66, 64, 68, 65, 69, 63, 67, 64, 68];
const HERO_CLUSTER_WIDTH = 960;
const HERO_CLUSTER_HEIGHT = 330;
const MOBILE_HERO_BREAKPOINT = 550;
const HERO_MIN_SCALE = 0.5;
const HERO_COMPACT_CREDIT_SCALE = 0.76;
const HERO_BASE_MAX_SCALE = 1;
const LARGE_DESKTOP_BREAKPOINT = 1920;
const LARGE_DESKTOP_HEIGHT_BREAKPOINT = 1080;
const LARGE_DESKTOP_HERO_SCALE = 1.16;
const LARGE_DESKTOP_BAR_ASSET_WIDTH = '32rem';
const LARGE_DESKTOP_ROW_HEIGHT = '4.45rem';
const LARGE_DESKTOP_ROW_GAP = '1.7rem';
const NARROW_PORTRAIT_SCALE_HEIGHT_MIN = 760;
const NARROW_PORTRAIT_SCALE_WIDTH_START = 700;
const NARROW_PORTRAIT_SCALE_WIDTH_END = 520;
const NARROW_PORTRAIT_SCALE_MIN = 0.84;
const ROW_EDGE_CASE_MIN_HEIGHT = 700;
const ROW_EDGE_CASE_ASPECT_START = 1.4;
const ROW_EDGE_CASE_ASPECT_END = 1.05;
const ROW_EDGE_CASE_MAX_LIFT = 96;
const ROW_NARROW_CLEARANCE_HEIGHT_MIN = 760;
const ROW_NARROW_CLEARANCE_WIDTH_START = 550;
const ROW_NARROW_CLEARANCE_WIDTH_END = 430;
const ROW_NARROW_CLEARANCE_BASE_LIFT = 18;
const ROW_NARROW_CLEARANCE_MAX_LIFT = 56;

const rowPatterns = [
  ['assets/bar references/Style=Triangle Grid 1.svg', 'assets/bar references/Style=Ruler CM.svg', 'assets/bar references/Style=Ticker Md.svg', 'assets/bar references/Style=Grid 1.svg'],
  ['assets/bar references/Style=Point Connect 2.svg', 'assets/bar references/Style=Lines Md.svg', 'assets/bar references/Style=Triangle Grid 1.svg', 'assets/bar references/Style=Ruler CM.svg'],
  ['assets/bar references/Style=Ticker Lg.svg', 'assets/bar references/Style=Grid 1.svg', 'assets/bar references/Style=Lines Md.svg', 'assets/bar references/Style=Point Connect 2.svg'],
  ['assets/bar references/Style=Default.svg', 'assets/bar references/Style=Triangle Grid 1.svg', 'assets/bar references/Style=Ruler CM.svg', 'assets/bar references/Style=Grid 1.svg'],
  ['assets/bar references/Style=Lines Md.svg', 'assets/bar references/Style=Ticker Md.svg', 'assets/bar references/Style=Triangle Grid 1.svg', 'assets/bar references/Style=Point Connect 2.svg'],
  ['assets/bar references/Style=Grid 1.svg', 'assets/bar references/Style=Ruler CM.svg', 'assets/bar references/Style=Lines Md.svg', 'assets/bar references/Style=Ticker Lg.svg'],
  ['assets/bar references/Style=Triangle Grid 1.svg', 'assets/bar references/Style=Grid 1.svg', 'assets/bar references/Style=Ticker Md.svg', 'assets/bar references/Style=Lines Md.svg'],
  ['assets/bar references/Style=Ruler CM.svg', 'assets/bar references/Style=Point Connect 2.svg', 'assets/bar references/Style=Grid 1.svg', 'assets/bar references/Style=Triangle Grid 1.svg'],
  ['assets/bar references/Style=Ticker Md.svg', 'assets/bar references/Style=Lines Md.svg', 'assets/bar references/Style=Ruler CM.svg', 'assets/bar references/Style=Grid 1.svg'],
  ['assets/bar references/Style=Triangle Grid 1.svg', 'assets/bar references/Style=Ticker Lg.svg', 'assets/bar references/Style=Lines Md.svg', 'assets/bar references/Style=Point Connect 2.svg']
];

function toAssetUrl(path) {
  return encodeURI(path);
}

function getGeneratorHref() {
  if (window.GeneratorRoutes && typeof window.GeneratorRoutes.buildGeneratorPath === 'function') {
    return window.GeneratorRoutes.buildGeneratorPath('solid', window.location.pathname);
  }

  return 'generator/solid/';
}

function getViewportMetrics() {
  const visualViewport = window.visualViewport;
  const width = visualViewport && Number.isFinite(visualViewport.width) && visualViewport.width > 0
    ? visualViewport.width
    : window.innerWidth;
  const height = visualViewport && Number.isFinite(visualViewport.height) && visualViewport.height > 0
    ? visualViewport.height
    : window.innerHeight;

  return { width, height };
}

function syncViewportHeightVar() {
  const { height } = getViewportMetrics();
  if (height > 0) {
    document.documentElement.style.setProperty('--viewport-height', `${Math.round(height)}px`);
  }
}

function resolveCssLengthToPx(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmedValue = value.trim();
  const numericValue = Number.parseFloat(trimmedValue);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  if (trimmedValue.endsWith('rem')) {
    const rootFontSize = typeof window !== 'undefined'
      ? Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
    return numericValue * rootFontSize;
  }

  return numericValue;
}

function computeRowTopPositions({ rowCount, rowStart, rowStep }) {
  return Array.from({ length: rowCount }, (_, index) => rowStart + (rowStep * index));
}

function getResponsiveMarqueeMetrics(viewportWidth, viewportHeight) {
  const isLargeDesktop = viewportWidth >= LARGE_DESKTOP_BREAKPOINT && viewportHeight >= LARGE_DESKTOP_HEIGHT_BREAKPOINT;

  return {
    assetWidth: isLargeDesktop ? LARGE_DESKTOP_BAR_ASSET_WIDTH : BAR_ASSET_WIDTH,
    rowHeight: isLargeDesktop ? LARGE_DESKTOP_ROW_HEIGHT : ROW_HEIGHT,
    rowGap: isLargeDesktop ? LARGE_DESKTOP_ROW_GAP : ROW_GAP,
    heroMaxScale: isLargeDesktop ? LARGE_DESKTOP_HERO_SCALE : HERO_BASE_MAX_SCALE
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getEdgeCaseRowLiftPx(viewportWidth, viewportHeight) {
  if (viewportHeight < ROW_EDGE_CASE_MIN_HEIGHT) {
    return 0;
  }

  if (
    viewportHeight >= ROW_NARROW_CLEARANCE_HEIGHT_MIN
    && viewportWidth < ROW_NARROW_CLEARANCE_WIDTH_START
    && viewportWidth >= ROW_NARROW_CLEARANCE_WIDTH_END
  ) {
    const rawFactor = (ROW_NARROW_CLEARANCE_WIDTH_START - viewportWidth)
      / (ROW_NARROW_CLEARANCE_WIDTH_START - ROW_NARROW_CLEARANCE_WIDTH_END);
    const factor = clamp(rawFactor, 0, 1);
    const easedFactor = factor * factor;

    return ROW_NARROW_CLEARANCE_BASE_LIFT
      + ((ROW_NARROW_CLEARANCE_MAX_LIFT - ROW_NARROW_CLEARANCE_BASE_LIFT) * easedFactor);
  }

  if (viewportWidth < MOBILE_HERO_BREAKPOINT) {
    return 0;
  }

  const aspectRatio = viewportWidth / viewportHeight;
  const rawFactor = (ROW_EDGE_CASE_ASPECT_START - aspectRatio) / (ROW_EDGE_CASE_ASPECT_START - ROW_EDGE_CASE_ASPECT_END);
  const factor = clamp(rawFactor, 0, 1);
  const easedFactor = factor * factor;

  return easedFactor * ROW_EDGE_CASE_MAX_LIFT;
}

function getNarrowPortraitHeroScaleCap(viewportWidth, viewportHeight) {
  if (viewportHeight < NARROW_PORTRAIT_SCALE_HEIGHT_MIN || viewportWidth > NARROW_PORTRAIT_SCALE_WIDTH_START) {
    return 1;
  }

  const rawFactor = (NARROW_PORTRAIT_SCALE_WIDTH_START - viewportWidth)
    / (NARROW_PORTRAIT_SCALE_WIDTH_START - NARROW_PORTRAIT_SCALE_WIDTH_END);
  const factor = clamp(rawFactor, 0, 1);
  const easedFactor = factor * factor;

  return 1 - ((1 - NARROW_PORTRAIT_SCALE_MIN) * easedFactor);
}

function getRowStepPx(stageHeight) {
  const referenceRowStep = (ROW_STEP_PERCENT / 100) * ROW_REFERENCE_VIEWPORT_HEIGHT;
  const responsiveRowStep = (ROW_STEP_PERCENT / 100) * stageHeight;
  return Math.max(referenceRowStep, responsiveRowStep);
}

function wrap(value, length) {
  return ((value % length) + length) % length;
}

function createAssetElement(path) {
  const asset = document.createElement('a');
  asset.className = 'bar_asset_wrap';
  asset.style.setProperty('--asset-width', 'var(--marquee-asset-width)');
  asset.href = getGeneratorHref();
  asset.setAttribute('aria-label', 'Open the generator');

  const image = document.createElement('img');
  image.className = 'bar_asset';
  image.src = toAssetUrl(path);
  image.alt = '';
  image.loading = 'eager';
  image.decoding = 'async';
  image.draggable = false;
  image.dataset.assetPath = path;

  asset.append(image);
  return asset;
}

function syncRowTargetFactor(state) {
  state.targetFactor = state.isPressed
    ? PRESS_SPEED_FACTOR
    : state.isHovered
      ? HOVER_SPEED_FACTOR
      : 1;
}

function setHoveredAsset(state, asset) {
  if (state.hoveredAsset === asset) {
    return;
  }

  if (state.hoveredAsset) {
    state.hoveredAsset.classList.remove('is-hovered');
  }

  state.hoveredAsset = asset;

  if (state.hoveredAsset) {
    state.hoveredAsset.classList.add('is-hovered');
  }
}

function setPressedAsset(state, asset) {
  if (state.pressedAsset === asset) {
    return;
  }

  if (state.pressedAsset) {
    state.pressedAsset.classList.remove('is-pressed');
  }

  state.pressedAsset = asset;

  if (state.pressedAsset) {
    state.pressedAsset.classList.add('is-pressed');
  }
}

function bindAssetInteractions(asset, state) {
  asset.addEventListener('pointerenter', () => {
    state.isHovered = true;
    setHoveredAsset(state, asset);
    syncRowTargetFactor(state);
  });

  asset.addEventListener('pointerleave', () => {
    if (state.hoveredAsset === asset && !state.isPressed) {
      setHoveredAsset(state, null);
      state.isHovered = false;
      syncRowTargetFactor(state);
    }
  });

  asset.addEventListener('pointerdown', event => {
    state.isHovered = true;
    state.isPressed = true;
    setHoveredAsset(state, asset);
    setPressedAsset(state, asset);
    syncRowTargetFactor(state);
    asset.setPointerCapture(event.pointerId);
  });

  asset.addEventListener('pointerup', event => {
    if (asset.hasPointerCapture(event.pointerId)) {
      asset.releasePointerCapture(event.pointerId);
    }

    state.isPressed = false;
    setPressedAsset(state, null);
    state.isHovered = asset.matches(':hover');
    if (!state.isHovered) {
      setHoveredAsset(state, null);
    }
    syncRowTargetFactor(state);
  });

  asset.addEventListener('pointercancel', () => {
    state.isPressed = false;
    setPressedAsset(state, null);
    state.isHovered = asset.matches(':hover');
    if (!state.isHovered) {
      setHoveredAsset(state, null);
    }
    syncRowTargetFactor(state);
  });
}

function createTrackItem(state, path, isMeasure = false) {
  const item = document.createElement('div');
  item.className = `marquee_item${isMeasure ? ' is-measure' : ''}`;
  item.style.setProperty('--asset-width', 'var(--marquee-asset-width)');
  item.style.setProperty('--row-gap', 'var(--marquee-row-gap)');

  const asset = createAssetElement(path);
  if (!isMeasure) {
    bindAssetInteractions(asset, state);
  }
  item.append(asset);

  return item;
}

function createRow(index) {
  const row = document.createElement('div');
  row.className = `marquee_row ${index % 2 === 0 ? 'is-backward' : 'is-forward'}`;
  row.style.left = ROW_LEFT;
  row.style.width = ROW_WIDTH;
  row.style.setProperty('--row-height', 'var(--marquee-row-height)');
  row.style.setProperty('--row-gap', 'var(--marquee-row-gap)');

  const track = document.createElement('div');
  track.className = 'marquee_track';
  row.append(track);

  return {
    element: row,
    track,
    pattern: rowPatterns[index % rowPatterns.length],
    direction: index % 2 === 0 ? -1 : 1,
    baseSpeed: BASE_SPEEDS[index % BASE_SPEEDS.length],
    currentFactor: 1,
    targetFactor: 1,
    isHovered: false,
    isPressed: false,
    hoveredAsset: null,
    pressedAsset: null,
    rowWidth: 0,
    rowHeight: 0,
    slotWidth: 0,
    patternSpan: 0,
    travel: index * 73,
    items: [],
    measureItem: null
  };
}

function updateRowLayout(state) {
  if (!state.slotWidth || !state.patternSpan || !state.items.length) {
    return;
  }

  const phase = wrap(state.travel, state.patternSpan);
  const startX = state.direction < 0
    ? -state.patternSpan - phase
    : -(2 * state.patternSpan) + phase;

  state.items.forEach((itemState, index) => {
    const x = startX + (index * state.slotWidth);
    itemState.x = x;
    itemState.element.style.transform = `translate3d(${x}px, 0, 0)`;
  });
}

function ensureRowItems(state) {
  if (!state.slotWidth || !state.rowWidth) {
    return;
  }

  const requiredCount = Math.max(
    (state.pattern.length * 3) + 2,
    Math.ceil(state.rowWidth / state.slotWidth) + (state.pattern.length * 2)
  );

  while (state.items.length < requiredCount) {
    const patternIndex = state.items.length % state.pattern.length;
    const itemElement = createTrackItem(state, state.pattern[patternIndex]);
    const asset = itemElement.querySelector('.bar_asset_wrap');
    state.track.append(itemElement);
    state.items.push({ element: itemElement, asset, x: 0 });
  }

  while (state.items.length > requiredCount) {
    const removed = state.items.pop();
    if (state.hoveredAsset === removed.asset) {
      state.hoveredAsset = null;
      state.isHovered = false;
    }
    if (state.pressedAsset === removed.asset) {
      state.pressedAsset = null;
      state.isPressed = false;
    }
    removed.element.remove();
  }

  updateRowLayout(state);
}

function syncRowMeasurements(rowStates, force = false) {
  rowStates.forEach(state => {
    if (!state.measureItem) {
      state.measureItem = createTrackItem(state, state.pattern[0], true);
      state.track.append(state.measureItem);
    }

    const nextRowWidth = state.element.getBoundingClientRect().width;
    const nextRowHeight = state.element.getBoundingClientRect().height;
    const nextSlotWidth = state.measureItem.getBoundingClientRect().width;

    if (!nextRowWidth || !nextRowHeight || !nextSlotWidth) {
      return;
    }

    const rowChanged = Math.abs(nextRowWidth - state.rowWidth) >= MEASUREMENT_EPSILON;
    const rowHeightChanged = Math.abs(nextRowHeight - state.rowHeight) >= MEASUREMENT_EPSILON;
    const slotChanged = Math.abs(nextSlotWidth - state.slotWidth) >= MEASUREMENT_EPSILON;

    if (!force && !rowChanged && !rowHeightChanged && !slotChanged) {
      return;
    }

    const previousSlotWidth = state.slotWidth;
    state.rowWidth = nextRowWidth;
    state.rowHeight = nextRowHeight;
    state.slotWidth = nextSlotWidth;
    state.patternSpan = state.slotWidth * state.pattern.length;
    state.travel = previousSlotWidth > 0
      ? (state.travel / previousSlotWidth) * nextSlotWidth
      : state.travel;

    ensureRowItems(state);
    updateRowLayout(state);
  });
}

function syncRowVerticalLayout(rowStates, stage) {
  if (!stage || !rowStates.length) {
    return;
  }

  const stageHeight = stage.getBoundingClientRect().height;
  const { width: viewportWidth, height: viewportHeight } = getViewportMetrics();
  const rowLift = getEdgeCaseRowLiftPx(viewportWidth, viewportHeight);
  const rowStart = ((ROW_START_PERCENT / 100) * stageHeight) - rowLift;
  const rowStep = getRowStepPx(stageHeight);
  const rowPositions = computeRowTopPositions({
    rowCount: rowStates.length,
    rowStart,
    rowStep
  });

  rowStates.forEach((state, index) => {
    state.element.style.top = `${rowPositions[index]}px`;
  });
}

function syncMarqueeSizing(root) {
  const { width: viewportWidth, height: viewportHeight } = getViewportMetrics();
  const metrics = getResponsiveMarqueeMetrics(viewportWidth, viewportHeight);

  root.style.setProperty('--marquee-asset-width', metrics.assetWidth);
  root.style.setProperty('--marquee-row-height', metrics.rowHeight);
  root.style.setProperty('--marquee-row-gap', metrics.rowGap);

  return metrics;
}

function syncHeroScale(root, metrics = null) {
  const { width: viewportWidth, height: viewportHeight } = getViewportMetrics();
  const responsiveMetrics = metrics || getResponsiveMarqueeMetrics(viewportWidth, viewportHeight);
  const narrowPortraitScaleCap = getNarrowPortraitHeroScaleCap(viewportWidth, viewportHeight);
  const rootStyles = getComputedStyle(root);
  const heroLayout = document.querySelector('.hero_layout');
  const heroCopy = document.querySelector('.hero_copy');
  const heroLayoutStyles = heroLayout ? getComputedStyle(heroLayout) : null;
  const horizontalPadding = parseFloat(rootStyles.getPropertyValue('--page-padding')) || 24;
  const verticalPaddingTop = heroLayoutStyles ? parseFloat(heroLayoutStyles.paddingTop) || 24 : 24;
  const verticalPaddingBottom = heroLayoutStyles ? parseFloat(heroLayoutStyles.paddingBottom) || 32 : 32;
  const isCreditHiddenLayout = viewportWidth < MOBILE_HERO_BREAKPOINT;
  const heroWidth = isCreditHiddenLayout && heroCopy
    ? Math.ceil(heroCopy.scrollWidth || heroCopy.getBoundingClientRect().width || HERO_CLUSTER_WIDTH)
    : HERO_CLUSTER_WIDTH;
  const heroHeight = isCreditHiddenLayout && heroCopy
    ? Math.ceil(heroCopy.scrollHeight || heroCopy.getBoundingClientRect().height || HERO_CLUSTER_HEIGHT)
    : HERO_CLUSTER_HEIGHT;
  const availableWidth = Math.max(0, viewportWidth - (horizontalPadding * 2));
  const availableHeight = Math.max(0, viewportHeight - verticalPaddingTop - verticalPaddingBottom);
  const scale = Math.min(
    responsiveMetrics.heroMaxScale,
    narrowPortraitScaleCap,
    availableWidth / heroWidth,
    availableHeight / heroHeight
  );

  const clampedScale = Math.max(HERO_MIN_SCALE, scale);
  root.style.setProperty('--hero-scale', String(clampedScale));
  root.dataset.heroCreditLayout = clampedScale <= HERO_COMPACT_CREDIT_SCALE ? 'compact' : 'default';
}

function preloadAssets() {
  const uniqueAssets = [...new Set(rowPatterns.flat())];

  return Promise.all(uniqueAssets.map(path => new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = toAssetUrl(path);
  })));
}

function initMarqueeScene() {
  const stage = document.querySelector('[data-marquee-stage]');
  const startupStylePrompt = document.getElementById('startup-style-prompt');
  const root = document.documentElement;
  if (!stage) {
    return;
  }

  const rowStates = Array.from({ length: ROW_COUNT }, (_, index) => createRow(index));
  rowStates.forEach(state => stage.append(state.element));

  let startupStylePromptTimer = null;
  if (startupStylePrompt) {
    startupStylePromptTimer = window.setTimeout(() => {
      startupStylePrompt.classList.add('is-visible');
      startupStylePrompt.setAttribute('aria-hidden', 'false');
    }, STARTUP_STYLE_PROMPT_DELAY);

    stage.addEventListener('pointerdown', () => {
      if (startupStylePromptTimer) {
        window.clearTimeout(startupStylePromptTimer);
        startupStylePromptTimer = null;
      }
      startupStylePrompt.classList.remove('is-visible');
      startupStylePrompt.setAttribute('aria-hidden', 'true');
    }, { once: true });
  }

  preloadAssets().finally(() => {
    syncViewportHeightVar();
    const metrics = syncMarqueeSizing(root);
    syncHeroScale(root, metrics);
    syncRowMeasurements(rowStates, true);
    syncRowVerticalLayout(rowStates, stage);
  });

  let resizeFrame = 0;
  function handleResize() {
    if (resizeFrame) {
      window.cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      syncViewportHeightVar();
      const metrics = syncMarqueeSizing(root);
      syncHeroScale(root, metrics);
      syncRowMeasurements(rowStates);
      syncRowVerticalLayout(rowStates, stage);
    });
  }

  window.addEventListener('resize', handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize, { passive: true });
    window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
  }

  let lastTime = performance.now();
  function animateRows(now) {
    const dt = Math.min(0.04, (now - lastTime) / 1000);
    lastTime = now;

    rowStates.forEach(state => {
      if (!state.slotWidth || !state.items.length) {
        return;
      }

      const ease = 1 - Math.exp(-EASE_RATE * dt);
      state.currentFactor += (state.targetFactor - state.currentFactor) * ease;
      state.travel += state.baseSpeed * state.currentFactor * dt;
      updateRowLayout(state);
    });

    window.requestAnimationFrame(animateRows);
  }

  window.requestAnimationFrame(animateRows);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeRowTopPositions,
    getEdgeCaseRowLiftPx,
    getNarrowPortraitHeroScaleCap,
    getResponsiveMarqueeMetrics,
    getRowStepPx,
    resolveCssLengthToPx
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  syncViewportHeightVar();
  initMarqueeScene();
}
