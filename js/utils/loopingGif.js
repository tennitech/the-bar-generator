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
  const MIN_LOOP_SPEED = 0.2;
  const MAX_LOOP_SPEED = 5;
  const DEFAULT_LOOP_SPEEDS = {
    ruler: 1,
    ticker: 1,
    waveform: 0.7
  };
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

  function getDefaultLoopSpeed(style) {
    const normalizedStyle = normalizeLoopingGifStyle(style);
    return DEFAULT_LOOP_SPEEDS[normalizedStyle] || 1;
  }

  function normalizeLoopSpeed(style, value) {
    const fallback = getDefaultLoopSpeed(style);
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }

    return clamp(numericValue, MIN_LOOP_SPEED, MAX_LOOP_SPEED);
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
    const progress = ((elapsedSeconds / periodSeconds) % 1 + 1) % 1;

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
    DEFAULT_CAPTURE_FPS,
    MIN_GIF_FRAME_DELAY_MS,
    DEFAULT_LOOP_SPEEDS,
    DEFAULT_LOOP_REVERSE,
    LOOPING_GIF_STYLE_SET,
    getDefaultLoopSpeed,
    getLoopReverse,
    getLoopSpeed,
    getLoopingAnimationState,
    normalizeLoopingGifStyle,
    normalizeLoopReverse,
    normalizeLoopSpeed,
    isLoopingGifEligibleStyle,
    getLoopingGifFramePlan
  };
});
