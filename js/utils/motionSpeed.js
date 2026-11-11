/* SPEED is a multiplier of each style's original default; stored rates keep their units. */
(function (scope) {
  const defaults = Object.freeze({ ticker: 0.4, waveform: 0.3, gradient: 0.1, 'wave-quantum': 1, 'well-modes': 1, rabi: 1 });
  const landmarks = Object.freeze([0.5, 1, 2]);
  // A narrow multiplier window is independent of each style's physical units.
  function snap(style, value) {
    const multiple = multiplier(style, value);
    const landmark = landmarks.find(point => Math.abs(point - multiple) <= 0.025 + Number.EPSILON);
    return landmark === undefined ? Number(value) : rate(style, landmark);
  }
  function pointerSnapping(style, slider) {
    let pointerId = null;
    const clear = () => { pointerId = null; };
    slider.addEventListener('pointerdown', event => {
      if (event.isPrimary !== false && (event.button === 0 || event.button === undefined)) pointerId = event.pointerId;
    });
    // Capture before the existing input listeners persist or render the value.
    slider.addEventListener('input', () => {
      if (pointerId !== null) slider.value = String(snap(style, slider.value));
    }, true);
    const finish = event => { if (event.pointerId === pointerId) clear(); };
    const target = slider.ownerDocument || slider;
    target.addEventListener('pointerup', finish);
    target.addEventListener('pointercancel', finish);
    slider.addEventListener('lostpointercapture', finish);
    slider.addEventListener('blur', clear);
    slider.addEventListener('keydown', clear, true);
    scope.addEventListener?.('blur', clear);
    scope.addEventListener?.('pagehide', clear);
  }
  function marks(slider) {
    if (!slider.ownerDocument) return;
    const ticks = slider.ownerDocument.createElement('div');
    ticks.className = 'motion_speed-marks';
    ticks.setAttribute('aria-hidden', 'true');
    for (const value of landmarks) {
      const tick = slider.ownerDocument.createElement('span');
      tick.className = 'motion_speed-mark';
      tick.style.left = `${(value - 0.2) / 3.8 * 100}%`;
      tick.textContent = `${value}×`;
      ticks.appendChild(tick);
    }
    slider.after(ticks);
  }
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
    pointerSnapping(style, slider);
    marks(slider);
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
    return { editorMin: 0.2, editorMax: 4, getEditorValue: () => Number(multiplier(style, slider.value).toFixed(2)).toString(),
      parseValue: value => {
        const text = String(value).trim().replace(/(?:×|x)$/i, '').trim();
        return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text) ? rate(style, Number(text)) : null;
      } };
  }
  const api = { defaults, landmarks, snap, pointerSnapping, multiplier, rate, format, sync, editor };
  scope.MotionSpeed = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
