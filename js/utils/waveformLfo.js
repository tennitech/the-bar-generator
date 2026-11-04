/* A sine LFO modulates amplitude, never carrier pitch or visual travel. */
(function (scope) {
  function bounded(value, fallback, min, max) {
    const number = value === null || value === '' ? NaN : Number(value);
    return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
  }
  function normalize(values = {}) {
    return { enabled: values.enabled === true || values.enabled === 'true',
      rate: bounded(values.rate, 2, 0.2, 8), depth: bounded(values.depth, 60, 0, 100) };
  }
  function amplitude(time, values) {
    const state = normalize(values);
    const depth = state.enabled ? state.depth / 100 : 0;
    return 1 - depth / 2 + depth / 2 * Math.sin(2 * Math.PI * state.rate * time);
  }
  function create(context, destination, values) {
    const input = context.createGain();
    const oscillator = context.createOscillator();
    const depth = context.createGain();
    oscillator.type = 'sine';
    oscillator.connect(depth);
    depth.connect(input.gain);
    input.connect(destination);
    let stopped = false;
    function update(values, immediate = false) {
      if (stopped) return;
      const state = normalize(values), time = context.currentTime;
      const amount = state.enabled ? state.depth / 100 : 0;
      for (const [param, value] of [[input.gain, 1 - amount / 2], [depth.gain, amount / 2], [oscillator.frequency, state.rate]]) {
        param.cancelScheduledValues(time);
        if (immediate) param.setValueAtTime(value, time);
        else param.setTargetAtTime(value, time, 0.015);
      }
    }
    update(values, true);
    oscillator.start();
    return { input, update, stop(when = context.currentTime) {
      if (stopped) return;
      stopped = true;
      oscillator.onended = () => { oscillator.disconnect(); depth.disconnect(); input.disconnect(); };
      oscillator.stop(when);
    } };
  }
  const api = { normalize, amplitude, create };
  scope.WaveformLfo = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
