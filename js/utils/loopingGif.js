(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.loopingGifUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const LOOPING_GIF_STYLE_SET = new Set(['ruler', 'ticker', 'waveform']);
  const DEFAULT_CAPTURE_FPS = 24;
  const MIN_CAPTURE_FPS = 12;
  const MAX_CAPTURE_FPS = 30;
  const MIN_CAPTURE_FRAMES = 24;
  const MAX_CAPTURE_FRAMES = 72;
  const MIN_GIF_FRAME_DELAY_MS = 20;
  // p5 still uses requestAnimationFrame; this ceiling avoids skipping fast displays.
  const DEFAULT_LIVE_RENDER_FPS = 1000;
  const MIN_LIVE_RENDER_FPS = 60;
  const MAX_LIVE_RENDER_FPS = 1000;
  const MAX_LIVE_FRAME_DELTA_MS = 1000 / 20;
  // Speeds are major-pattern recurrences per display second, not physical units.
  // Ruler has up to ten minor ticks per recurrence; ticker has up to five.
  const LOOP_SPEED_LIMITS = Object.freeze({
    ruler: Object.freeze({ min: 0.2, max: 0.6, step: 0.1, default: 0.3 }),
    ticker: Object.freeze({ min: 0.2, max: 0.8, step: 0.1, default: 0.4 }),
    waveform: Object.freeze({ min: 0.2, max: 1, step: 0.1, default: 0.3 })
  });
  const DEFAULT_LOOP_SPEEDS = Object.freeze(Object.fromEntries(
    Object.entries(LOOP_SPEED_LIMITS).map(([style, limits]) => [style, limits.default])
  ));
  const DEFAULT_LOOP_REVERSE = {
    ruler: false,
    ticker: false,
    waveform: false
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toPositiveNumber(value, fallback) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
  }

  function normalizeLoopingGifStyle(style) {
    return String(style || '').trim().toLowerCase();
  }

  function getLoopSpeedLimits(style) {
    return LOOP_SPEED_LIMITS[normalizeLoopingGifStyle(style)] || LOOP_SPEED_LIMITS.waveform;
  }

  function getDefaultLoopSpeed(style) {
    return getLoopSpeedLimits(style).default;
  }

  function normalizeLoopSpeed(style, value) {
    const limits = getLoopSpeedLimits(style);
    const valid = typeof value === 'number' || (typeof value === 'string'
      && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()));
    const numericValue = valid ? Number(value) : NaN;
    return Number.isFinite(numericValue)
      ? Math.round((clamp(numericValue, limits.min, limits.max) + Number.EPSILON) * 10) / 10 : limits.default;
  }

  // Share owners can migrate only these known legacy controls before strict
  // manifest validation. All other fields remain subject to their existing rules.
  function normalizeMotionSpeedControls(controls) {
    const normalized = { ...controls };
    for (const style of Object.keys(LOOP_SPEED_LIMITS)) {
      const id = `${style}-speed-slider`;
      if (Object.hasOwn(normalized, id)) normalized[id] = String(normalizeLoopSpeed(style, normalized[id]));
    }
    return normalized;
  }

  function normalizeLoopReverse(style, value) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    const fallback = DEFAULT_LOOP_REVERSE[normalizedStyle] === true;

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue === 'true') {
        return true;
      }
      if (normalizedValue === 'false') {
        return false;
      }
      return fallback;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return fallback;
  }

  function getLoopSpeed(style, values = {}) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    if (normalizedStyle === 'ruler') {
      return normalizeLoopSpeed(normalizedStyle, values.rulerSpeed);
    }

    if (normalizedStyle === 'ticker') {
      return normalizeLoopSpeed(normalizedStyle, values.tickerSpeed);
    }

    if (normalizedStyle === 'waveform') {
      return normalizeLoopSpeed(normalizedStyle, values.waveformSpeed);
    }

    return getDefaultLoopSpeed(normalizedStyle);
  }

  function getLoopReverse(style, values = {}) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    if (normalizedStyle === 'ruler') {
      return normalizeLoopReverse(normalizedStyle, values.rulerReverse);
    }

    if (normalizedStyle === 'ticker') {
      // Ticker shipped with the reverse semantics flipped relative to the desired UI.
      // Keep the existing checkbox/URL key, but invert the effective direction here so
      // unchecked ticker motion runs in the reverse direction and checked runs forward.
      return !normalizeLoopReverse(normalizedStyle, values.tickerReverse);
    }

    if (normalizedStyle === 'waveform') {
      return normalizeLoopReverse(normalizedStyle, values.waveformReverse);
    }

    return normalizeLoopReverse(normalizedStyle, false);
  }

  function getFrameCountForPeriod(periodSeconds, fps) {
    const maxFrameCountForDelay = Math.max(
      2,
      Math.floor((periodSeconds * 1000) / MIN_GIF_FRAME_DELAY_MS)
    );
    const minFrameCount = Math.min(MIN_CAPTURE_FRAMES, maxFrameCountForDelay);
    const maxFrameCount = Math.min(MAX_CAPTURE_FRAMES, maxFrameCountForDelay);

    return clamp(
      Math.round(periodSeconds * fps),
      minFrameCount,
      maxFrameCount
    );
  }

  function getPreferredLiveRenderFps(value = DEFAULT_LIVE_RENDER_FPS) {
    const numericValue = Number(value);
    const fallback = DEFAULT_LIVE_RENDER_FPS;
    return clamp(
      Math.round(Number.isFinite(numericValue) ? numericValue : fallback),
      MIN_LIVE_RENDER_FPS,
      MAX_LIVE_RENDER_FPS
    );
  }

  function clampLiveAnimationDeltaMs(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return 0;
    }

    return Math.min(numericValue, MAX_LIVE_FRAME_DELTA_MS);
  }

  function advanceLiveLoopPhase(phase, style, values = {}, deltaMs = 0) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    const subdivisions = normalizedStyle === 'ruler'
      ? Math.max(1, Number(values.rulerUnits) || 4)
      : normalizedStyle === 'ticker' ? Math.max(1, Number(values.tickerRatio) || 2) : 1;
    // Keep each frame below a quarter of the smallest repeating tick interval.
    // A delayed frame slows the preview instead of sampling an apparent reversal.
    const step = Math.min(getLoopSpeed(normalizedStyle, values)
      * clampLiveAnimationDeltaMs(deltaMs) / 1000, 0.25 / subdivisions);
    const direction = getLoopReverse(normalizedStyle, values) ? -1 : 1;
    const current = Number.isFinite(phase) ? phase : 0;
    return ((current + step * direction) % 1 + 1) % 1;
  }

  function isLoopingGifEligibleStyle(style) {
    return LOOPING_GIF_STYLE_SET.has(normalizeLoopingGifStyle(style));
  }

  function getLoopingGifFramePlan(style, values = {}, options = {}) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    if (!isLoopingGifEligibleStyle(normalizedStyle)) {
      return null;
    }

    const fps = clamp(
      Math.round(toPositiveNumber(options.fps, DEFAULT_CAPTURE_FPS)),
      MIN_CAPTURE_FPS,
      MAX_CAPTURE_FPS
    );
    const barWidth = toPositiveNumber(options.barWidth, 250);

    if (normalizedStyle === 'ruler') {
      const repeats = Math.max(1, Math.round(toPositiveNumber(values.rulerRepeats, 10)));
      const units = Math.max(1, Math.round(toPositiveNumber(values.rulerUnits, 4)));
      const speed = getLoopSpeed(normalizedStyle, values);
      const direction = getLoopReverse(normalizedStyle, values) ? -1 : 1;
      const totalTicks = repeats * units + 1;
      const tickWidth = barWidth / (2 * totalTicks - 1);
      const repeatWidth = units * tickWidth * 2;
      const periodSeconds = 1 / speed;
      const frameCount = getFrameCountForPeriod(periodSeconds, fps);

      return {
        style: normalizedStyle,
        frameCount,
        frameDelayMs: Math.round((periodSeconds * 1000) / frameCount),
        repeatWidth,
        periodSeconds,
        getLoopOffsetX(progress) {
          return repeatWidth * progress * direction;
        }
      };
    }

    if (normalizedStyle === 'ticker') {
      const speed = getLoopSpeed(normalizedStyle, values);
      const direction = getLoopReverse(normalizedStyle, values) ? -1 : 1;
      const repeats = Math.max(1, Math.round(toPositiveNumber(values.tickerRepeats, 34)));
      const repeatWidth = barWidth / repeats;
      const periodSeconds = 1 / speed;
      const frameCount = getFrameCountForPeriod(periodSeconds, fps);

      return {
        style: normalizedStyle,
        frameCount,
        frameDelayMs: Math.round((periodSeconds * 1000) / frameCount),
        repeatWidth,
        periodSeconds,
        getLoopOffsetX(progress) {
          return repeatWidth * progress * direction;
        }
      };
    }

    const speed = getLoopSpeed(normalizedStyle, values);
    const direction = getLoopReverse(normalizedStyle, values) ? -1 : 1;
    const periodSeconds = 1 / speed;
    const frameCount = getFrameCountForPeriod(periodSeconds, fps);

    return {
      style: normalizedStyle,
      frameCount,
      frameDelayMs: Math.round((periodSeconds * 1000) / frameCount),
      periodSeconds,
      repeatWidth: 0,
      getLoopOffsetX() {
        return 0;
      },
      getTimeSeconds(progress) {
        return periodSeconds * progress * direction;
      }
    };
  }

  function getLoopingAnimationState(style, values = {}, options = {}) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    const framePlan = getLoopingGifFramePlan(normalizedStyle, values, options);
    if (!framePlan) {
      return null;
    }

    const elapsedSeconds = Math.max(0, Number(options.elapsedSeconds) || 0);
    const periodSeconds = Math.max(0.0001, Number(framePlan.periodSeconds) || 1);
    const direction = getLoopReverse(normalizedStyle, values) ? -1 : 1;
    const cycles = Number.isFinite(options.phase) ? options.phase * direction : elapsedSeconds / periodSeconds;
    const progress = ((cycles % 1) + 1) % 1;

    return {
      ...framePlan,
      progress,
      loopOffsetX: typeof framePlan.getLoopOffsetX === 'function'
        ? framePlan.getLoopOffsetX(progress)
        : 0,
      timeSeconds: typeof framePlan.getTimeSeconds === 'function'
        ? framePlan.getTimeSeconds(progress)
        : periodSeconds * progress
    };
  }

  return {
    advanceLiveLoopPhase,
    DEFAULT_CAPTURE_FPS,
    DEFAULT_LIVE_RENDER_FPS,
    MIN_GIF_FRAME_DELAY_MS,
    DEFAULT_LOOP_SPEEDS,
    DEFAULT_LOOP_REVERSE,
    LOOPING_GIF_STYLE_SET,
    LOOP_SPEED_LIMITS,
    getLoopSpeedLimits,
    clampLiveAnimationDeltaMs,
    getDefaultLoopSpeed,
    getPreferredLiveRenderFps,
    getLoopReverse,
    getLoopSpeed,
    getLoopingAnimationState,
    normalizeLoopingGifStyle,
    normalizeLoopReverse,
    normalizeLoopSpeed,
    normalizeMotionSpeedControls,
    isLoopingGifEligibleStyle,
    getLoopingGifFramePlan
  };
});
