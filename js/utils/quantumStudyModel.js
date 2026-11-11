// Dimensionless ideal models. Shared polygon primitives keep p5 and SVG identical.
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.quantumStudyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TAU = 2 * Math.PI;
  const PERIOD_SECONDS = 8; // Display time, not calibrated laboratory time.
  const DENSITY_BOUND = 4;
  const SAMPLES = 600;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  function finite(value, fallback) {
    if (value === null || value === '' || typeof value === 'boolean') return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function normalizePhase(value) {
    const number = finite(value, 0);
    return ((number % 1) + 1) % 1;
  }
  function normalizeSpeed(value) { return clamp(finite(value, 1), 0.2, 4); }
  function advancePhase(phase, deltaMs, options = {}) {
    const delta = clamp(finite(deltaMs, 0), 0, 50);
    return normalizePhase(normalizePhase(phase) + (options.reverse ? -1 : 1) *
      normalizeSpeed(options.speed) * delta / (1000 * PERIOD_SECONDS));
  }
  function isWell(style) { return style === 26 || style === '26' || style === 'well' || style === 'well-modes'; }
  function normalize(style, options = {}) {
    if (isWell(style)) {
      const wellN1 = Math.round(clamp(finite(options.wellN1, 2), 1, 6));
      let wellN2 = Math.round(clamp(finite(options.wellN2, 3), 1, 6));
      // Orthogonality is required for the stated normalized population weights.
      if (wellN2 === wellN1) wellN2 = wellN1 === 6 ? 5 : wellN1 + 1;
      return { wellN1, wellN2,
        wellPopulation: clamp(finite(options.wellPopulation, 0.5), 0, 1),
        wellPhase: normalizePhase(finite(options.wellPhase, 0.15)) };
    }
    return { rabiDetuning: clamp(finite(options.rabiDetuning, 0.45), 0, 3),
      rabiSpan: clamp(finite(options.rabiSpan, 4), 2, 8),
      rabiPhase: normalizePhase(finite(options.rabiPhase, 0.12)) };
  }
  function mode(n, u) {
    const value = Math.sin(Math.PI * n * u);
    return Math.abs(value) < 1e-14 ? 0 : value;
  }
  function wellDensity(u, p) {
    const a = Math.sqrt(2 * (1 - p.wellPopulation)) * mode(p.wellN1, u);
    const b = Math.sqrt(2 * p.wellPopulation) * mode(p.wellN2, u);
    // Complex modulus avoids cancellation-induced negative density at nodes.
    const angle = TAU * p.wellPhase;
    const re = a + b * Math.cos(angle), im = -b * Math.sin(angle);
    return clamp(re * re + im * im, 0, DENSITY_BOUND);
  }
  function sampleWell(u, options = {}) {
    return wellDensity(clamp(finite(u, 0), 0, 1), normalize('well', options));
  }
  function rabiPopulation(u, p) {
    const frequency = Math.sqrt(1 + p.rabiDetuning ** 2);
    // u is a pulse-duration scan coordinate, not position in physical space.
    const tau = u * p.rabiSpan * Math.PI + p.rabiPhase * TAU / frequency;
    const amplitude = Math.sin(frequency * tau / 2);
    return clamp(amplitude * amplitude / (frequency * frequency), 0, 1);
  }
  function sampleRabi(u, options = {}) {
    const pe = rabiPopulation(clamp(finite(u, 0), 0, 1), normalize('rabi', options));
    return { pe, pg: 1 - pe };
  }
  // Clip a filled polygon against one half-plane x+y <= bound (or >= bound).
  // Connecting disjoint clipped pieces along the clipping line adds zero area.
  function clipDiagonal(polygon, bound, below) {
    const output = [];
    if (!polygon.length) return output;
    let previous = polygon[polygon.length - 1];
    let previousValue = previous.x + previous.y - bound;
    for (const point of polygon) {
      const value = point.x + point.y - bound;
      const inside = below ? value <= 0 : value >= 0;
      const previousInside = below ? previousValue <= 0 : previousValue >= 0;
      if (inside !== previousInside) {
        const t = previousValue / (previousValue - value);
        output.push({ x: previous.x + t * (point.x - previous.x),
          y: previous.y + t * (point.y - previous.y) });
      }
      if (inside) output.push(point);
      previous = point;
      previousValue = value;
    }
    return output;
  }
  function metadata(style, parameters) {
    const well = isWell(style);
    return {
      model: well ? 'infinite-square-well-two-mode-v1' : 'ideal-driven-two-level-rabi-v1',
      parameters, units: 'dimensionless',
      observable: well ? 'L |psi|^2' : 'P(e), P(g)=1-P(e)',
      horizontalAxis: well ? 'x/L, 0 to 1' : 'pulse duration Omega*t; separate preparations',
      animation: well ? 'one relative beat cycle' : 'scan offset advances one population period',
      scale: well ? 'mirrored thickness = height * density / 4' : 'bottom solid P(e); top diagonally hatched P(g)',
      assumptions: well ? 'isolated particle; infinite walls; two distinct orthonormal modes' :
        'initial ground state; isolated two-level subspace; constant drive; rotating-wave approximation',
      display: 'fixed viewport and vertical scale; no per-frame normalization'
    };
  }
  function createGeometry(options = {}) {
    const well = isWell(options.currentShader);
    const parameters = normalize(well ? 'well' : 'rabi', options);
    const info = metadata(well ? 'well' : 'rabi', parameters);
    const x = clamp(finite(options.barStartX, 0), -1e9, 1e9);
    const y = clamp(finite(options.barY, 0), -1e9, 1e9);
    const width = clamp(finite(options.exactBarWidth, 250), 0, 1e6);
    const height = clamp(finite(options.barHeight, 18), 0, 1e6);
    if (!width || !height) return { polygons: [], metadata: info };
    // Work in the canonical 500 x 36 domain, including hatch spacing/angle.
    const values = Array.from({ length: SAMPLES + 1 }, (_, i) => well ?
      wellDensity(i / SAMPLES, parameters) : rabiPopulation(i / SAMPLES, parameters));
    let polygons;
    if (well) {
      const top = values.map((density, i) => ({ x: 500 * i / SAMPLES, y: 18 - 4.5 * density }));
      const bottom = values.map((density, i) => ({ x: 500 * i / SAMPLES, y: 18 + 4.5 * density })).reverse();
      polygons = [[...top, ...bottom]];
    } else {
      const boundary = values.map((pe, i) => ({ x: 500 * i / SAMPLES, y: 36 * (1 - pe) }));
      const ground = [{ x: 0, y: 0 }, { x: 500, y: 0 }, ...boundary.slice().reverse()];
      polygons = [];
      // A 1.35-unit perpendicular stripe width at 45 degrees, spaced 5 units.
      const stripeWidth = 1.35 * Math.SQRT2;
      for (let start = -5; start <= 536; start += 5) {
        const stripe = clipDiagonal(clipDiagonal(ground, start, false), start + stripeWidth, true);
        if (stripe.length >= 3) polygons.push(stripe);
      }
      polygons.push([...boundary, { x: 500, y: 36 }, { x: 0, y: 36 }]);
    }
    return { polygons: polygons.map(polygon => polygon.map(point => ({
      x: x + width * clamp(point.x / 500, 0, 1),
      y: y + height * clamp(point.y / 36, 0, 1)
    }))), metadata: info };
  }
  return { normalize, normalizePhase, normalizeSpeed, PERIOD_SECONDS, DENSITY_BOUND,
    advancePhase, sampleWell, sampleRabi, createGeometry };
});
