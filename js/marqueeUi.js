const BAR_ASSET_WIDTH = '28rem';
const ROW_HEIGHT = '3.9rem';
const ROW_GAP = '1.45rem';
const ROW_COUNT = 10;
const ROW_START_PERCENT = -7.5;
const ROW_STEP_PERCENT = 7.35;
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
const MOBILE_HERO_BOTTOM_GAP = 58;
const HERO_MIN_SCALE = 0.5;
const HERO_COMPACT_CREDIT_SCALE = 0.76;

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

function wrap(value, length) {
  return ((value % length) + length) % length;
}

function createAssetElement(path) {
  const asset = document.createElement('a');
  asset.className = 'bar_asset_wrap';
  asset.style.setProperty('--asset-width', BAR_ASSET_WIDTH);
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
  item.style.setProperty('--asset-width', BAR_ASSET_WIDTH);
  item.style.setProperty('--row-gap', ROW_GAP);

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
  row.style.top = `${ROW_START_PERCENT + (ROW_STEP_PERCENT * index)}%`;
  row.style.left = ROW_LEFT;
  row.style.width = ROW_WIDTH;
  row.style.setProperty('--row-height', ROW_HEIGHT);
  row.style.setProperty('--row-gap', ROW_GAP);

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
    const nextSlotWidth = state.measureItem.getBoundingClientRect().width;

    if (!nextRowWidth || !nextSlotWidth) {
      return;
    }

    const rowChanged = Math.abs(nextRowWidth - state.rowWidth) >= MEASUREMENT_EPSILON;
    const slotChanged = Math.abs(nextSlotWidth - state.slotWidth) >= MEASUREMENT_EPSILON;

    if (!force && !rowChanged && !slotChanged) {
      return;
    }

    const previousSlotWidth = state.slotWidth;
    state.rowWidth = nextRowWidth;
    state.slotWidth = nextSlotWidth;
    state.patternSpan = state.slotWidth * state.pattern.length;
    state.travel = previousSlotWidth > 0
      ? (state.travel / previousSlotWidth) * nextSlotWidth
      : state.travel;

    ensureRowItems(state);
    updateRowLayout(state);
  });
}

function syncHeroScale(root) {
  const rootStyles = getComputedStyle(root);
  const padding = parseFloat(rootStyles.getPropertyValue('--page-padding')) || 24;
  const isMobileHeroLayout = window.innerWidth < MOBILE_HERO_BREAKPOINT;
  const heroCopy = document.querySelector('.hero_copy');
  const mobileHeroWidth = heroCopy
    ? Math.ceil(heroCopy.scrollWidth || heroCopy.getBoundingClientRect().width || HERO_CLUSTER_WIDTH)
    : HERO_CLUSTER_WIDTH;
  const mobileHeroContentHeight = heroCopy
    ? Math.ceil(heroCopy.scrollHeight || heroCopy.getBoundingClientRect().height || HERO_CLUSTER_HEIGHT)
    : HERO_CLUSTER_HEIGHT;
  const mobileHeroHeight = mobileHeroContentHeight + MOBILE_HERO_BOTTOM_GAP;
  const heroWidth = isMobileHeroLayout ? mobileHeroWidth : HERO_CLUSTER_WIDTH;
  const heroHeight = isMobileHeroLayout ? mobileHeroHeight : HERO_CLUSTER_HEIGHT;
  const availableWidth = Math.max(0, window.innerWidth - (padding * 2));
  const availableHeight = Math.max(0, window.innerHeight - padding - 24);
  const scale = Math.min(
    1,
    availableWidth / heroWidth,
    availableHeight / heroHeight
  );

  const clampedScale = Math.max(HERO_MIN_SCALE, scale);
  root.style.setProperty('--hero-scale', String(clampedScale));
  root.style.setProperty('--mobile-hero-width', `${mobileHeroWidth}px`);
  root.style.setProperty('--mobile-hero-height', `${mobileHeroHeight}px`);
  root.dataset.heroLayout = isMobileHeroLayout ? 'mobile' : 'default';
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
    syncHeroScale(root);
    syncRowMeasurements(rowStates, true);
  });

  let resizeFrame = 0;
  function handleResize() {
    if (resizeFrame) {
      window.cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      syncHeroScale(root);
      syncRowMeasurements(rowStates);
    });
  }

  window.addEventListener('resize', handleResize);

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

initMarqueeScene();
