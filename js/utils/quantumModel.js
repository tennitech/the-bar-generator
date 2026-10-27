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
  function sample(position, phase = 0) {
    // u=x/L, tau=E1*t/hbar. Here tau = 2*pi*phase, En=n^2*E1.
    const u = Number(position);
    const time = TAU * normalizePhase(phase);
    const a = TAU * 4 * u - 16 * time;
    const b = TAU * 7 * u - 49 * time;
    const re = (Math.cos(a) + Math.cos(b)) / Math.SQRT2;
    const im = (Math.sin(a) + Math.sin(b)) / Math.SQRT2;
    return { re, im, density: re * re + im * im };
  }
  function advancePhase(phase, deltaMs) {
    // Cap a stalled frame; never catch up across background/overlay pauses.
    const delta = Math.max(0, Math.min(50, Number(deltaMs) || 0));
    return normalizePhase(normalizePhase(phase) + delta / (PERIOD_SECONDS * 1000));
  }
  return { sample, normalizePhase, advancePhase, PERIOD_SECONDS };
});
