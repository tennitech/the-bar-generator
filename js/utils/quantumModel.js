// Analytic, normalized free-particle state on a unit periodic domain.
// Browser globals match the existing p5 script loader; CommonJS supports numerical tests.
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.quantumModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TAU = 2 * Math.PI;
  const PERIOD_SECONDS = 120;
  function normalizePhase(value) {
    const number = Number(value);
    return Number.isFinite(number) ? ((number % 1) + 1) % 1 : 0;
  }
  const MODES = Object.freeze([-4, 3, 7]);
  const AMPLITUDE_BOUND = Math.sqrt(MODES.length);
  function sample(position, phase = 0) {
    // u=x/L, tau=E1*t/hbar. Integer n has energy n²*E1, including negative momentum.
    const u = Number(position);
    const time = TAU * normalizePhase(phase);
    let re = 0, im = 0;
    for (const n of MODES) {
      const angle = TAU * n * u - n * n * time;
      re += Math.cos(angle) / AMPLITUDE_BOUND;
      im += Math.sin(angle) / AMPLITUDE_BOUND;
    }
    return { re, im, density: re * re + im * im };
  }
  function normalizeSpeed(value) {
    const speed = Number(value);
    return Number.isFinite(speed) ? Math.max(0.2, Math.min(1, speed)) : 1;
  }
  function advancePhase(phase, deltaMs, options = {}) {
    // Cap a stalled frame; never catch up across background/overlay pauses.
    const delta = Math.max(0, Math.min(50, Number(deltaMs) || 0));
    return normalizePhase(normalizePhase(phase) + (options.reverse ? -1 : 1) * normalizeSpeed(options.speed ?? 1) * delta / (PERIOD_SECONDS * 1000));
  }
  return { sample, normalizePhase, normalizeSpeed, advancePhase, PERIOD_SECONDS, MODES, AMPLITUDE_BOUND };
});
