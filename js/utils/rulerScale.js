/* A dimensionless ruler scale: whole units and conventional equal subdivisions. */
(function (scope) {
  const DIVISIONS = Object.freeze([2, 4, 8, 10, 16]);
  const DEFAULT_UNITS = 10;
  const DEFAULT_DIVISIONS = 10;
  function normalizeUnits(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0
      ? Math.max(1, Math.min(20, Math.round(number))) : DEFAULT_UNITS;
  }
  function normalizeDivisions(value) {
    const number = Number(value);
    // Sixths were offered by the old decorative pattern. Use eighths when
    // restoring that setting; other unsupported values use the decimal scale.
    return number === 6 ? 8 : DIVISIONS.includes(number) ? number : DEFAULT_DIVISIONS;
  }
  function normalizeThickness(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0
      ? Math.round(Math.max(0.5, Math.min(3, number)) * 10) / 10 : 1;
  }
  function tickLevel(index, divisions) {
    const count = normalizeDivisions(divisions);
    const position = ((index % count) + count) % count;
    if (position === 0) return 0;
    if (position === count / 2) return 1;
    // Decimal rulers emphasize only the whole and half unit, not every fifth.
    if (count === 10) return 3;
    if (position % (count / 4) === 0) return 2;
    if (position % (count / 8) === 0) return 3;
    return 4;
  }
  const api = Object.freeze({ DIVISIONS, DEFAULT_UNITS, DEFAULT_DIVISIONS,
    normalizeUnits, normalizeDivisions, normalizeThickness, tickLevel });
  scope.RulerScale = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
