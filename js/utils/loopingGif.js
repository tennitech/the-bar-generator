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
      const totalTicks = repeats * units + 1;
      const tickWidth = barWidth / (2 * totalTicks - 1);
      const repeatWidth = units * tickWidth * 2;

      return {
        style: normalizedStyle,
        frameCount: fps,
        frameDelayMs: Math.round(1000 / fps),
        repeatWidth,
        periodSeconds: 1,
        getLoopOffsetX(progress) {
          return repeatWidth * progress;
        }
      };
    }

    if (normalizedStyle === 'ticker') {
      const repeats = Math.max(1, Math.round(toPositiveNumber(values.tickerRepeats, 34)));
      const repeatWidth = barWidth / repeats;

      return {
        style: normalizedStyle,
        frameCount: fps,
        frameDelayMs: Math.round(1000 / fps),
        repeatWidth,
        periodSeconds: 1,
        getLoopOffsetX(progress) {
          return repeatWidth * progress;
        }
      };
    }

    const speed = Math.abs(toPositiveNumber(values.waveformSpeed, 1));
    const periodSeconds = speed > 0 ? 1 / speed : 1;
    const frameCount = clamp(
      Math.round(periodSeconds * fps),
      MIN_CAPTURE_FRAMES,
      MAX_CAPTURE_FRAMES
    );

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
        return periodSeconds * progress;
      }
    };
  }

  return {
    LOOPING_GIF_STYLE_SET,
    normalizeLoopingGifStyle,
    isLoopingGifEligibleStyle,
    getLoopingGifFramePlan
  };
});
