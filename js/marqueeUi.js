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
const HOVER_SPEED_FACTOR = 0;
const PRESS_SPEED_FACTOR = 0;
const EASE_RATE = 5.2;
const BRAKE_RATE = 28;
const DRAG_THRESHOLD = 8;
// An exponential glide keeps quick flicks lively without unbounded travel.
const INERTIA_FRICTION = 2.8;
const INERTIA_CATCH_GRACE_MS = 180;
const INERTIA_CATCH_DISTANCE = 18;
const INERTIA_STOP_SPEED = 8;
const STARTUP_STYLE_PROMPT_DELAY = 450;
const BASE_SPEEDS = [24, 28, 26, 30, 27, 29, 25, 28, 26, 30];
const HERO_CLUSTER_WIDTH = 960;
const HERO_CLUSTER_HEIGHT = 330;
const MOBILE_HERO_BREAKPOINT = 550;
const HERO_MIN_SCALE = 0.4;
const HERO_COMPACT_CREDIT_SCALE = 0.76;
// CSS-pixel viewport dimensions already incorporate browser/OS display scaling.
// DPR affects raster sharpness, never the composition's physical size twice.
const COMPOSITION_REFERENCE_WIDTH = 1440;
const COMPOSITION_REFERENCE_HEIGHT = 900;
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

const MARQUEE_MOTION_STORAGE_KEY = 'rpi-marquee-motion';

// Storage is optional (for example, in an embedded or private browsing context).
// An OS pause stays held for this visit until an intentional Resume, even if
// the OS setting changes back. It never overwrites an explicit saved choice.
function createMarqueeMotionPreference(getStorage, reduced = false) {
  let explicitlyPaused = false;
  try { explicitlyPaused = getStorage().getItem(MARQUEE_MOTION_STORAGE_KEY) === 'paused'; } catch (_) { /* Session-only fallback. */ }
  let reducedMotion = !!reduced;
  let systemHold = reducedMotion;
  return {
    get paused() { return explicitlyPaused || reducedMotion || systemHold; },
    get reduced() { return reducedMotion; },
    setReducedMotion(value) {
      reducedMotion = !!value;
      if (reducedMotion) systemHold = true;
    },
    setPaused(value) {
      if (!value && reducedMotion) return false;
      explicitlyPaused = !!value;
      if (!explicitlyPaused) systemHold = false;
      try { getStorage().setItem(MARQUEE_MOTION_STORAGE_KEY, explicitlyPaused ? 'paused' : 'running'); } catch (_) { /* Keep the current visit usable. */ }
      return true;
    },
    // A pause in another tab also stops this page. A remote Resume or storage
    // removal must not unexpectedly start a field the visitor left still.
    acceptStoredPause(value) { if (value === 'paused') explicitlyPaused = true; }
  };
}

const marqueeCatalogApi = typeof module !== 'undefined' && module.exports
  ? require('./utils/marqueeCatalog') : window.MarqueeCatalog;
const marqueeCatalog = marqueeCatalogApi.entries;
// Neighboring lanes use disjoint family palettes, independent of their drifting
// alignment. Each circular lane has at most seven distinct families, including
// its repeat seam. Group variants before partitioning so they cannot collide.
function createRowPatterns(entries) {
  const byStyle = new Map();
  entries.forEach(entry => {
    if (!byStyle.has(entry.value)) byStyle.set(entry.value, []);
    byStyle.get(entry.value).push(entry);
  });
  const families = [...byStyle.values()];
  if (families.length < 2) {
    throw new RangeError('Marquee rows need at least two distinct bar styles.');
  }
  // Two disjoint circular palettes each need at least two families. A smaller
  // catalog can only guarantee separation within a lane, not between lanes.
  const palettes = families.length >= 4
    ? [families.filter((_, index) => index % 2 === 0), families.filter((_, index) => index % 2 === 1)]
    : [families];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  return Array.from({ length: ROW_COUNT }, (_, row) => {
    const palette = palettes[row % palettes.length];
    const slots = Math.min(7, palette.length);
    let stride = Math.min(5, palette.length - 1);
    while (gcd(stride, palette.length) !== 1) stride--;
    return Array.from({ length: slots }, (_, slot) => {
      const position = Math.floor(row / palettes.length) * slots + slot;
      const variants = palette[(position * stride) % palette.length];
      return variants[Math.floor(position / palette.length) % variants.length].path;
    });
  });
}
// Choose the small static sample set once. Resize and every animation frame reuse it.
const selectedMarqueeEntries = marqueeCatalogApi.selectEntries();
const rowPatterns = createRowPatterns(selectedMarqueeEntries);

function toAssetUrl(path) { return encodeURI(path); }

function getMarqueeBarStyle(path) {
  const entry = marqueeCatalogApi.samples.find(item => item.path === path);
  if (entry) return entry;
  // Historical reference filenames remain recognized by external consumers.
  const name = String(path || '').split('/').pop() || '';
  const legacy = [['Triangle Grid', 'triangle-grid'], ['Point Connect', 'point-connect'],
    ['Ruler', 'ruler'], ['Ticker', 'ticker'], ['Grid', 'grid'], ['Lines', 'lines']];
  const match = legacy.find(([prefix]) => name.startsWith(`Style=${prefix}`));
  return marqueeCatalog.find(item => item.value === (match ? match[1] : 'solid'));
}

function getGeneratorHref(style = 'solid', query = '') {
  const route = window.GeneratorRoutes && typeof window.GeneratorRoutes.buildGeneratorPath === 'function'
    ? window.GeneratorRoutes.buildGeneratorPath(style, window.location.pathname)
    : `generator/${style}/`;
  return query ? `${route}?${query}` : route;
}

function getViewportMetrics() {
  const visualViewport = window.visualViewport && window.visualViewport.scale === 1
    ? window.visualViewport
    : null;
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

// Place the last diagonal lane above the actual brand, title and credits.
// A sub-lane offset keeps this boundary continuous as the viewport resizes;
// adding/removing whole lanes alone would leave up to one extra lane of space.
function fitRowsAboveHero({ rowStart, rowStep, rowHeight, firstBounds, tiltRadians, heroRects }) {
  const visibleRects = heroRects.filter(rect => rect.width > 0 && rect.height > 0);
  if (!(rowStep > 0) || !visibleRects.length) return null;
  const clearance = rowStep * 0.6;
  const slope = Math.tan(tiltRadians);
  const shift = Math.min(...visibleRects.map(rect => {
    const rightEdge = slope >= 0 ? rect.right : rect.left;
    const firstBottom = firstBounds.top + (rightEdge - firstBounds.left) * slope
      + rowHeight * Math.cos(tiltRadians);
    return rect.top - firstBottom - clearance;
  }));
  const rowCount = Math.max(1, 1 + Math.ceil(Math.max(0, shift) / rowStep - 1e-7));
  return { rowCount, rowStart: rowStart + shift - (rowCount - 1) * rowStep };
}

function getResponsiveMarqueeMetrics(viewportWidth, viewportHeight) {
  const scale = Math.max(1, Math.min(viewportWidth / COMPOSITION_REFERENCE_WIDTH,
    viewportHeight / COMPOSITION_REFERENCE_HEIGHT));
  const scaledRem = value => `${Number((parseFloat(value) * scale).toFixed(4))}rem`;
  return {
    assetWidth: scaledRem(BAR_ASSET_WIDTH),
    rowHeight: scaledRem(ROW_HEIGHT),
    rowGap: scaledRem(ROW_GAP),
    heroMaxScale: scale,
    scale
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getEdgeCaseRowLiftPx(viewportWidth, viewportHeight) {
  if (viewportWidth < MOBILE_HERO_BREAKPOINT && viewportHeight < ROW_EDGE_CASE_MIN_HEIGHT) {
    return clamp((ROW_EDGE_CASE_MIN_HEIGHT - viewportHeight) * 0.7, 0, 92);
  }

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

function getRowStepPx(stageHeight, rowHeight = resolveCssLengthToPx(ROW_HEIGHT)) {
  const referenceRowStep = (ROW_STEP_PERCENT / 100) * ROW_REFERENCE_VIEWPORT_HEIGHT;
  const responsiveRowStep = (ROW_STEP_PERCENT / 100) * stageHeight;
  // Tall screens get more lanes, not ever-growing gaps between fixed-size bars.
  return Math.min(rowHeight * 1.32, Math.max(referenceRowStep, responsiveRowStep));
}

function wrap(value, length) {
  return ((value % length) + length) % length;
}

function createAssetElement(path) {
  const asset = document.createElement('a');
  const style = getMarqueeBarStyle(path);
  asset.className = 'bar_asset_wrap';
  asset.style.setProperty('--asset-width', 'var(--marquee-asset-width)');
  asset.href = getGeneratorHref(style.value, style.query);
  asset.dataset.barVariant = style.variant;
  asset.dataset.barStyle = style.value;
  asset.setAttribute('aria-label', `Open ${style.label} in the generator`);
  asset.draggable = false;
  asset.tabIndex = -1;
  asset.setAttribute('aria-hidden', 'true');

  const image = document.createElement('img');
  image.className = 'bar_asset';
  image.src = toAssetUrl(path);
  image.alt = '';
  image.loading = 'eager';
  image.decoding = 'async';
  image.draggable = false;
  image.dataset.assetPath = path;

  if (window.PageEntrance) window.PageEntrance.revealAsset(image);
  asset.append(image);
  return asset;
}

function syncRowTargetFactor(state) {
  state.targetFactor = state.isPressed
    ? PRESS_SPEED_FACTOR
    : state.isHovered || state.focusedAsset
      ? HOVER_SPEED_FACTOR
      : 1;
  // Keep a hovered link exactly still. Deliberate drag momentum is separate
  // from autoplay, so a release can coast even while the pointer stays here.
  if (state.isPressed || state.isHovered || state.focusedAsset) state.currentFactor = 0;
}

function advanceRowSpeed(currentFactor, targetFactor, dt) {
  const rate = targetFactor < currentFactor ? BRAKE_RATE : EASE_RATE;
  const ease = 1 - Math.exp(-rate * dt);
  return currentFactor + (targetFactor - currentFactor) * ease;
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
  state.onHoverChange?.(state, asset);
}

// One focus owner keeps boundary events from an old row from clearing a newer
// hover. Opacity is applied to each complete link, never a clipped row.
function bindStageFocus(stage, rowStates) {
  let focusedRow = null;
  rowStates.forEach(state => {
    state.onHoverChange = (_, asset) => {
      if (asset) {
        focusedRow?.element.classList.remove('is-focus-row');
        focusedRow = state;
        state.element.classList.add('is-focus-row');
        stage.classList.add('has-bar-focus');
      } else if (focusedRow === state) {
        state.element.classList.remove('is-focus-row');
        stage.classList.remove('has-bar-focus');
        focusedRow = null;
      }
    };
  });
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

// Work in the lane's own coordinates, not screen x: each row is rotated.
function projectLaneDelta(dx, dy, axis) {
  return dx * axis.x + dy * axis.y;
}

function sampleDragVelocity(previous, distance, seconds, maximum) {
  if (!(seconds > 0)) return previous;
  const instant = clamp(distance / seconds, -maximum, maximum);
  return previous + (instant - previous) * (1 - Math.exp(-seconds / 0.035));
}

// A deliberate hold should settle the lane, while small release/event delays
// should taper the throw instead of switching it off at one abrupt threshold.
function getReleaseVelocity(velocity, idleMilliseconds) {
  if (!Number.isFinite(velocity) || !Number.isFinite(idleMilliseconds)) return 0;
  const idle = Math.max(0, idleMilliseconds);
  if (idle >= 160) return 0;
  return velocity * Math.exp(-Math.max(0, idle - 35) / 45);
}

function advanceRowInertia(velocity, seconds) {
  if (!velocity || !(seconds > 0)) return { velocity: velocity || 0, distance: 0 };
  const decay = Math.exp(-INERTIA_FRICTION * seconds);
  const next = velocity * decay;
  return {
    velocity: Math.abs(next) < INERTIA_STOP_SPEED ? 0 : next,
    distance: velocity * (1 - decay) / INERTIA_FRICTION
  };
}

function resetRowInteraction(state) {
  const drag = state.drag;
  if (drag) state.suppressClick = true;
  state.drag = null;
  state.inertiaVelocity = 0;
  state.inertiaOrigin = null;
  state.isPressed = false;
  state.isHovered = false;
  setPressedAsset(state, null);
  setHoveredAsset(state, null);
  state.element.classList.remove('is-dragging');
  syncRowTargetFactor(state);
  if (drag?.asset.hasPointerCapture(drag.pointerId)) {
    drag.asset.releasePointerCapture(drag.pointerId);
  }
}

function bindAssetInteractions(asset, state) {
  function catchMovingLane(event) {
    // Let a deliberate flick leave the hand. Release jitter and synthetic
    // boundary events must not cancel it; later movement to inspect a bar does.
    if (state.inertiaVelocity && state.inertiaOrigin && event.pointerType !== 'touch'
      && event.timeStamp - state.inertiaOrigin.time >= INERTIA_CATCH_GRACE_MS
      && Math.hypot(event.clientX - state.inertiaOrigin.x, event.clientY - state.inertiaOrigin.y) > INERTIA_CATCH_DISTANCE) {
      state.inertiaVelocity = 0;
      state.inertiaOrigin = null;
    }
  }
  function hoverAsset(event) {
    if (event.pointerType === 'touch' || state.drag) return;
    catchMovingLane(event);
    state.isHovered = true;
    setHoveredAsset(state, asset);
    syncRowTargetFactor(state);
  }
  asset.addEventListener('pointerenter', hoverAsset);
  asset.addEventListener('focus', () => {
    state.focusedAsset = asset;
    state.inertiaVelocity = 0;
    syncRowTargetFactor(state);
  });
  asset.addEventListener('blur', () => {
    if (state.focusedAsset === asset) state.focusedAsset = null;
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
    if (event.isPrimary === false) return;
    // A fresh press must never inherit suppression from an earlier drag.
    state.suppressClick = false;
    // Keep auxiliary and modified native-link activation unchanged.
    if (event.button !== 0 || event.ctrlKey
      || event.metaKey || event.shiftKey || event.altKey || state.drag) return;
    state.inertiaVelocity = 0;
    state.isHovered = event.pointerType !== 'touch';
    state.isPressed = true;
    setHoveredAsset(state, state.isHovered ? asset : null);
    setPressedAsset(state, asset);
    syncRowTargetFactor(state);
    const matrix = new DOMMatrixReadOnly(getComputedStyle(state.element).transform);
    const length = Math.hypot(matrix.a, matrix.b) || 1;
    state.drag = {
      asset, pointerId: event.pointerId, pointerType: event.pointerType,
      startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastY: event.clientY, time: event.timeStamp,
      axis: { x: matrix.a / length, y: matrix.b / length },
      velocity: 0, moved: false
    };
    asset.setPointerCapture(event.pointerId);
  });

  asset.addEventListener('pointermove', event => {
    const drag = state.drag;
    // Focus/history restoration may not emit a fresh pointerenter for the
    // asset already under the pointer. Re-establish hover on its next move.
    if (!drag) { hoverAsset(event); return; }
    if (drag.asset !== asset || drag.pointerId !== event.pointerId) return;
    if (drag.pointerType === 'mouse' && event.buttons === 0) {
      resetRowInteraction(state);
      return;
    }
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      const along = projectLaneDelta(dx, dy, drag.axis);
      const across = projectLaneDelta(dx, dy, { x: -drag.axis.y, y: drag.axis.x });
      // Hand vertical touch gestures back to the browser, including pinch.
      if (drag.pointerType === 'touch' && Math.abs(across) > Math.abs(along)) {
        state.suppressClick = true;
        resetRowInteraction(state);
        return;
      }
      drag.moved = true;
      state.element.classList.add('is-dragging');
    }
    if (event.cancelable) event.preventDefault();
    const stepX = event.clientX - drag.lastX, stepY = event.clientY - drag.lastY;
    const delta = projectLaneDelta(stepX, stepY, drag.axis);
    const across = projectLaneDelta(stepX, stepY, { x: -drag.axis.y, y: drag.axis.x });
    const seconds = (event.timeStamp - drag.time) / 1000;
    // A hand leaving the lane sideways is still throwing it. Sampling those
    // near-zero along-lane deltas as braking erased the flick before release.
    // Let that velocity decay naturally instead; a stationary hold still
    // settles through the release guard, and cancellation never throws.
    drag.velocity = Math.abs(across) > Math.abs(delta) * 2
      ? drag.velocity * Math.exp(-INERTIA_FRICTION * (seconds > 0 ? seconds : 0))
      : sampleDragVelocity(drag.velocity, delta, seconds, state.slotWidth * 4);
    state.travel += delta * state.direction;
    drag.lastX = event.clientX; drag.lastY = event.clientY; drag.time = event.timeStamp;
    updateRowLayout(state);
  });

  function finishPress(event) {
    const drag = state.drag;
    if (!drag || drag.asset !== asset || drag.pointerId !== event.pointerId) return;
    const released = event.type === 'pointerup';
    state.suppressClick = drag.moved || !released;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const paused = document.documentElement?.dataset.marqueeMotionPaused === 'true';
    // A held release, cancellation, or any motion pause never throws.
    state.inertiaVelocity = released && drag.moved && !reduced && !paused
      ? getReleaseVelocity(drag.velocity, event.timeStamp - drag.time) : 0;
    state.inertiaOrigin = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    state.drag = null;
    state.isPressed = false;
    state.element.classList.remove('is-dragging');
    setPressedAsset(state, null);
    const hit = released && drag.pointerType !== 'touch'
      ? document.elementFromPoint(event.clientX, event.clientY)?.closest('.bar_asset_wrap') : null;
    const hovered = hit && state.items.some(item => item.asset === hit) ? hit : null;
    state.isHovered = !!hovered;
    setHoveredAsset(state, hovered);
    syncRowTargetFactor(state);
    if (asset.hasPointerCapture(event.pointerId)) asset.releasePointerCapture(event.pointerId);
  }

  asset.addEventListener('pointerup', finishPress);
  asset.addEventListener('pointercancel', finishPress);
  asset.addEventListener('lostpointercapture', finishPress);
  // Prevent the anchor's own native ghost-image drag, not just image dragging.
  asset.addEventListener('dragstart', event => event.preventDefault());
  asset.addEventListener('click', event => {
    if (!state.suppressClick || event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.suppressClick = false;
  }, true);
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
    focusedAsset: null,
    pressedAsset: null,
    drag: null,
    inertiaVelocity: 0,
    inertiaOrigin: null,
    suppressClick: false,
    rowWidth: 0,
    rowHeight: 0,
    slotWidth: 0,
    patternSpan: 0,
    travel: 0,
    initialOffset: Math.random(),
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

  // Move one shared lane instead of rewriting every repeated bar each frame.
  // Static slot positions are assigned only when the layout changes.
  if (state.renderedX !== startX) {
    state.track.style.transform = `translate3d(${startX}px, 0, 0)`;
    state.renderedX = startX;
  }
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
    state.items.push({ element: itemElement, asset });
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
    if (state.focusedAsset === removed.asset) state.focusedAsset = null;
    removed.element.remove();
  }

  state.track.style.width = `${state.items.length * state.slotWidth}px`;
  state.items.forEach((itemState, index) => {
    itemState.element.style.left = `${index * state.slotWidth}px`;
  });
  syncRowTargetFactor(state);
  updateRowLayout(state);
}

function syncRowMeasurements(rowStates, force = false) {
  rowStates.forEach(state => {
    if (!state.measureItem) {
      state.measureItem = createTrackItem(state, state.pattern[0], true);
      state.track.append(state.measureItem);
    }

    const nextRowWidth = state.element.offsetWidth;
    const nextRowHeight = state.element.offsetHeight;
    const nextSlotWidth = state.measureItem.offsetWidth;

    if (!nextRowWidth || !nextRowHeight || !nextSlotWidth) {
      return;
    }

    const rowChanged = Math.abs(nextRowWidth - state.rowWidth) >= MEASUREMENT_EPSILON;
    const rowHeightChanged = Math.abs(nextRowHeight - state.rowHeight) >= MEASUREMENT_EPSILON;
    const slotChanged = Math.abs(nextSlotWidth - state.slotWidth) >= MEASUREMENT_EPSILON;

    if (!force && !rowChanged && !rowHeightChanged && !slotChanged) {
      return;
    }

    if (state.drag || state.inertiaVelocity) resetRowInteraction(state);
    const previousSlotWidth = state.slotWidth;
    state.rowWidth = nextRowWidth;
    state.rowHeight = nextRowHeight;
    state.slotWidth = nextSlotWidth;
    state.patternSpan = state.slotWidth * state.pattern.length;
    state.travel = previousSlotWidth > 0
      ? (state.travel / previousSlotWidth) * nextSlotWidth
      : state.initialOffset * state.patternSpan;

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
  let rowStart = ((ROW_START_PERCENT / 100) * stageHeight) - rowLift;
  const rowStep = getRowStepPx(stageHeight, rowStates[0].element.offsetHeight);
  const coveredSpan = (ROW_COUNT - 1) * (ROW_STEP_PERCENT / 100) * stageHeight;
  let neededRows = Math.max(ROW_COUNT, 1 + Math.floor(coveredSpan / rowStep));
  // Fit every viewport to the actual title and unscaled controls. This keeps
  // phone controls clear too, without squeezing their text or touch targets.
  {
    const first = rowStates[0].element;
    first.style.top = `${rowStart}px`;
    const fitted = fitRowsAboveHero({
      rowStart, rowStep, rowHeight: first.offsetHeight,
      firstBounds: first.getBoundingClientRect(),
      tiltRadians: parseFloat(getComputedStyle(stage).getPropertyValue('--marquee-tilt')) * Math.PI / 180,
      heroRects: [...document.querySelectorAll('.hero_brand, .hero_title-line, .hero_credit, .hero_controls')]
        .map(element => element.getBoundingClientRect())
    });
    if (fitted) { neededRows = fitted.rowCount; rowStart = fitted.rowStart; }
  }
  while (rowStates.length < neededRows) {
    const state = createRow(rowStates.length);
    rowStates.push(state);
    stage.append(state.element);
  }
  while (rowStates.length > neededRows) {
    const removed = rowStates.pop();
    resetRowInteraction(removed);
    removed.element.remove();
  }
  syncRowMeasurements(rowStates);
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
  root.style.setProperty('--composition-scale', String(metrics.scale));
  root.style.setProperty('--content-width', `${1400 * metrics.scale}px`);

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
  const availableWidth = heroLayout ? heroLayout.clientWidth
    : Math.max(0, viewportWidth - (horizontalPadding * 2));
  const controls = document.querySelector('[data-marquee-controls]');
  const controlsReserve = controls ? controls.offsetHeight + 16 : 0;
  root.style.setProperty('--marquee-controls-reserve', `${controlsReserve}px`);
  const layoutHeight = heroLayout ? heroLayout.clientHeight : viewportHeight;
  const availableHeight = Math.max(0, layoutHeight - verticalPaddingTop - verticalPaddingBottom - controlsReserve);
  const scale = Math.min(
    responsiveMetrics.heroMaxScale * narrowPortraitScaleCap,
    availableWidth / heroWidth,
    availableHeight / heroHeight
  );

  const clampedScale = Math.max(HERO_MIN_SCALE, scale);
  root.style.setProperty('--hero-scale', String(clampedScale));
  root.dataset.heroCreditLayout = clampedScale <= HERO_COMPACT_CREDIT_SCALE ? 'compact' : 'default';
}

function initMarqueeScene() {
  const stage = document.querySelector('[data-marquee-stage]');
  const startupStylePrompt = document.getElementById('startup-style-prompt');
  const root = document.documentElement;
  if (!stage) {
    return;
  }

  const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const motion = createMarqueeMotionPreference(() => window.localStorage, reducedMotion?.matches);
  const motionButton = document.getElementById('marquee-motion-toggle');
  const motionDescription = document.getElementById('marquee-motion-description');
  if (motionButton) motionButton.hidden = false;

  const rowStates = Array.from({ length: ROW_COUNT }, (_, index) => createRow(index));
  rowStates.forEach(state => stage.append(state.element));
  bindStageFocus(stage, rowStates);
  const cancelInteractions = () => rowStates.forEach(resetRowInteraction);
  stage.addEventListener('pointerdown', event => {
    if (event.isPrimary === false) cancelInteractions();
    else if (event.pointerType === 'touch') rowStates.forEach(state => {
      state.isHovered = false;
      setHoveredAsset(state, null);
      syncRowTargetFactor(state);
    });
  }, true);
  window.addEventListener('blur', cancelInteractions);

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

  const syncInitialLayout = () => {
    syncViewportHeightVar();
    const metrics = syncMarqueeSizing(root);
    syncHeroScale(root, metrics);
    syncRowMeasurements(rowStates, true);
    syncRowVerticalLayout(rowStates, stage);
  };
  syncInitialLayout();

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
  document.fonts?.ready.then(handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize, { passive: true });
    window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
  }

  let animationFrame = 0;
  let lastTime = performance.now();
  function animateRows(now) {
    animationFrame = 0;
    // A browser can update matches before delivering its change event.
    // Latch that pause immediately, including the control’s visible state.
    if (reducedMotion?.matches && !motion.reduced) syncMotionPreference();
    if (document.hidden || motion.paused) return;
    const dt = Math.min(0.04, (now - lastTime) / 1000);
    lastTime = now;
    if (window.PageEntrance?.isHoldingArtwork?.() || document.body.classList.contains('has-logo-animation')) {
      animationFrame = window.requestAnimationFrame(animateRows);
      return;
    }

    const viewport = getViewportMetrics();
    const speedScale = getResponsiveMarqueeMetrics(viewport.width, viewport.height).scale;
    rowStates.forEach(state => {
      if (!state.slotWidth || !state.items.length) {
        return;
      }

      if (state.drag) return;
      if (state.inertiaVelocity) {
        const inertia = advanceRowInertia(state.inertiaVelocity, dt);
        state.inertiaVelocity = inertia.velocity;
        state.travel += inertia.distance * state.direction;
      } else {
        state.currentFactor = advanceRowSpeed(state.currentFactor, state.targetFactor, dt);
        state.travel += state.baseSpeed * state.currentFactor * dt * speedScale;
      }
      updateRowLayout(state);
    });

    animationFrame = window.requestAnimationFrame(animateRows);
  }

  function syncMotionPreference() {
    motion.setReducedMotion(reducedMotion?.matches);
    root.dataset.marqueeMotionPaused = String(motion.paused);
    if (motionButton) {
      motionButton.disabled = motion.reduced;
      const label = motion.reduced ? 'Motion paused' : motion.paused ? 'Resume motion' : 'Pause motion';
      motionButton.setAttribute('aria-label', label);
      motionButton.dataset.motionPaused = String(motion.paused);
      motionButton.title = motion.reduced ? 'Reduced motion is on in your device settings.' : label;
    }
    if (motionDescription) motionDescription.textContent = motion.reduced
      ? 'Motion is paused by your device’s reduced motion setting. Dragging still works.'
      : 'Controls the scrolling rows. Dragging still works while paused.';
    if (motion.paused) window.PageEntrance?.cancel?.();
    handleResize();
    if (document.hidden || motion.paused) {
      if (document.hidden) cancelInteractions();
      else rowStates.forEach(state => {
        state.inertiaVelocity = 0;
        state.currentFactor = 0;
      });
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      return;
    }
    if (!animationFrame) {
      lastTime = performance.now();
      animationFrame = window.requestAnimationFrame(animateRows);
    }
  }

  motionButton?.addEventListener('click', () => {
    motion.setReducedMotion(reducedMotion?.matches);
    motion.setPaused(!motion.paused);
    syncMotionPreference();
  });
  window.addEventListener('storage', event => {
    if (event.key !== MARQUEE_MOTION_STORAGE_KEY || event.newValue !== 'paused') return;
    motion.acceptStoredPause(event.newValue);
    syncMotionPreference();
  });

  if (reducedMotion) {
    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', syncMotionPreference);
    } else if (typeof reducedMotion.addListener === 'function') {
      reducedMotion.addListener(syncMotionPreference);
    }
  }
  document.addEventListener('visibilitychange', syncMotionPreference);
  window.addEventListener('pagehide', () => {
    cancelInteractions();
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  });
  window.addEventListener('pageshow', () => {
    // A restored back/forward page may have missed a pause saved elsewhere.
    try { motion.acceptStoredPause(window.localStorage.getItem(MARQUEE_MOTION_STORAGE_KEY)); } catch (_) { /* Retain this visit’s preference. */ }
    syncMotionPreference();
  });
  syncMotionPreference();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MARQUEE_MOTION_STORAGE_KEY,
    STARTUP_STYLE_PROMPT_DELAY,
    createMarqueeMotionPreference,
    updateRowLayout,
    advanceRowSpeed,
    projectLaneDelta,
    sampleDragVelocity,
    getReleaseVelocity,
    advanceRowInertia,
    bindAssetInteractions,
    bindStageFocus,
    resetRowInteraction,
    createRowPatterns,
    syncRowTargetFactor,
    computeRowTopPositions,
    fitRowsAboveHero,
    getEdgeCaseRowLiftPx,
    getNarrowPortraitHeroScaleCap,
    getMarqueeBarStyle,
    getResponsiveMarqueeMetrics,
    getRowStepPx,
    resolveCssLengthToPx
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  syncViewportHeightVar();
  initMarqueeScene();
}
