/* SPEED is a multiplier of each style's original default; stored rates keep their units. */
(function (scope) {
  const defaults = Object.freeze({ ticker: 0.4, waveform: 0.3, gradient: 0.1, 'wave-quantum': 1 });
  function multiplier(style, rate) { return Number(rate) / defaults[style]; }
  function rate(style, value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(Math.max(0.2, Math.min(4, number)) * defaults[style] * 1000) / 1000 : null;
  }
  function format(style, value) { return `${Number(multiplier(style, value).toFixed(2))}×`; }
  function sync(style, slider, display) {
    if (!slider || !display) return;
    display.textContent = format(style, slider.value);
    slider.setAttribute('aria-valuetext', `${display.textContent} default speed`);
    if (slider.dataset.motionSpeedReady) return;
    slider.dataset.motionSpeedReady = 'true';
    slider.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const delta = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.25, PageDown: -0.25 }[event.key];
      if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0.2 : event.key === 'End' ? 4 : multiplier(style, slider.value) + delta;
      slider.value = rate(style, next);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  function editor(style, slider) {
    return { getEditorValue: () => Number(multiplier(style, slider.value).toFixed(2)).toString(),
      parseValue: value => {
        const text = String(value).trim().replace(/(?:×|x)$/i, '').trim();
        return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text) ? rate(style, Number(text)) : null;
      } };
  }
  const api = { defaults, multiplier, rate, format, sync, editor };
  scope.MotionSpeed = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
