/* Numeric digit sources. No source text is executed. Browser/CommonJS compatibility. */
(function (scope) {
  const DEFAULT_VALUE = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
  const MAX_LENGTH = 200;
  const presets = Object.freeze([
    { id: 'pi', label: 'Pi · π', value: String(Math.PI), description: 'π ≈ 3.14159 — circumference divided by diameter.' },
    { id: 'e', label: 'Euler’s number · e', value: String(Math.E), description: 'e ≈ 2.71828 — the base of natural logarithms.' },
    { id: 'phi', label: 'Golden ratio · φ', value: String((1 + Math.sqrt(5)) / 2), description: '(1 + √5) / 2 ≈ 1.61803 — the positive solution of x² = x + 1.' },
    { id: 'sqrt2', label: 'Square root of 2 · √2', value: String(Math.SQRT2), description: '√2 ≈ 1.41421 — diagonal-to-side ratio of a square.' },
    { id: 'sqrt3', label: 'Square root of 3 · √3', value: String(Math.sqrt(3)), description: '√3 ≈ 1.73205 — height-to-half-base ratio of an equilateral triangle.' },
    { id: 'tau', label: 'Full turn · 2π', value: String(2 * Math.PI), description: '2π ≈ 6.28319 — radians in one complete turn.' },
    { id: 'rms', label: 'Sine RMS · 1 / √2', value: String(Math.SQRT1_2), description: '1 / √2 ≈ 0.70711 — RMS-to-peak ratio for a sine wave.' },
    { id: 'half-life', label: 'Decay half-life · ln(2)', value: String(Math.LN2), description: 'ln(2) ≈ 0.69315 — half-life divided by time constant for exponential decay.' }
  ].map(Object.freeze));
  const preset = id => presets.find(item => item.id === id) || presets[0];
  // Keep text as text: decimal digits (including leading zeros) need no floating-point coercion.
  function isDraft(value) { return typeof value === 'string' && value.length <= MAX_LENGTH && /^[+-]?[0-9]*(?:\.[0-9]*)?$/.test(value); }
  function isValue(value) { return isDraft(value) && /[0-9]/.test(value) && Number.isFinite(Number(value)); }
  function digits(value) {
    if (!isValue(value)) return [];
    return Array.from(value.replace(/^[+-]/, ''), char => char === '.' ? 10 : Number(char));
  }
  function resolve(values = {}) {
    return values.numericSource === 'formula' ? preset(values.numericFormula).value
      : (typeof values.numericValue === 'string' ? values.numericValue : DEFAULT_VALUE);
  }
  // Bounded arithmetic parser only for historical links. New UI never accepts expressions.
  function legacyValue(source) {
    if (typeof source !== 'string' || source.length > 4096) return null;
    if (isValue(source)) return source;
    if (!source.trim() || source.length > 512) return null;
    const text = source.replace(/Math\./g, '').replace(/\*\*/g, '^');
    const tokens = text.match(/(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|[A-Za-z]+|[()+*/^,\-]/g) || [];
    if (tokens.join('') !== text.replace(/\s/g, '') || tokens.length > 200) return null;
    let at = 0, depth = 0;
    const functions = { sqrt: Math.sqrt, pow: Math.pow, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log, exp: Math.exp, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max };
    function primary() {
      if (++depth > 32) throw Error('depth');
      let value, token = tokens[at++];
      if (token === '(') { value = expression(); if (tokens[at++] !== ')') throw Error('parenthesis'); }
      else if (/^(?:[0-9]|\.)/.test(token || '')) value = Number(token);
      else if (token === 'PI' || token === 'E') value = token === 'PI' ? Math.PI : Math.E;
      else if (Object.hasOwn(functions, token) && tokens[at++] === '(') {
        const args = [expression()];
        while (tokens[at] === ',') { at++; args.push(expression()); }
        if (tokens[at++] !== ')') throw Error('arguments');
        value = functions[token](...args);
      } else throw Error('token');
      depth--; return value;
    }
    function power() { const value = primary(); return tokens[at] === '^' ? (at++, value ** unary()) : value; }
    function unary() { if (tokens[at] === '+') { at++; return unary(); } if (tokens[at] === '-') { at++; return -unary(); } return power(); }
    function product() { let value = unary(); while (tokens[at] === '*' || tokens[at] === '/') { const op = tokens[at++], right = unary(); value = op === '*' ? value * right : value / right; } return value; }
    function expression() { let value = product(); while (tokens[at] === '+' || tokens[at] === '-') { const op = tokens[at++], right = product(); value = op === '+' ? value + right : value - right; } return value; }
    try {
      const value = expression();
      if (at !== tokens.length || !Number.isFinite(value)) return null;
      // Expand exponents for the decimal-only input without losing stored decimal digits.
      const raw = String(value);
      const match = /^(-?)([0-9]+)(?:\.([0-9]+))?e([+-]?[0-9]+)$/.exec(raw);
      let decimal = raw;
      if (match) {
        const digits = match[2] + (match[3] || '');
        const point = match[2].length + Number(match[4]);
        decimal = match[1] + (point <= 0 ? '0.' + '0'.repeat(-point) + digits
          : point >= digits.length ? digits + '0'.repeat(point - digits.length)
            : digits.slice(0, point) + '.' + digits.slice(point));
      }
      return isValue(decimal) ? decimal : null;
    } catch (_) { return null; }
  }
  function migrate(value) {
    if (value === undefined) return { numericSource: 'values', numericFormula: 'pi', numericValue: DEFAULT_VALUE };
    if (isDraft(value)) return { numericSource: 'values', numericFormula: 'pi', numericValue: value };
    const aliases = { PI: 'pi', 'Math.PI': 'pi', E: 'e', 'Math.E': 'e', 'sqrt(2)': 'sqrt2', 'Math.sqrt(2)': 'sqrt2', '(1+sqrt(5))/2': 'phi' };
    const key = String(value).replace(/\s/g, '');
    const id = Object.hasOwn(aliases, key) ? aliases[key] : null;
    return { numericSource: id ? 'formula' : 'values', numericFormula: id || 'pi', numericValue: id ? DEFAULT_VALUE : (legacyValue(value) ?? '') };
  }
  function readQuery(params) {
    if (!params.has('numericSource')) return migrate(params.get('numericValue') ?? undefined);
    return { numericSource: params.get('numericSource') === 'formula' ? 'formula' : 'values',
      numericFormula: preset(params.get('numericFormula')).id,
      numericValue: params.has('numericValue') ? (isDraft(params.get('numericValue')) ? params.get('numericValue') : '') : DEFAULT_VALUE };
  }
  function sync(root = document) {
    const source = root.querySelector('#numeric-source-select');
    if (!source) return;
    const formula = source.value === 'formula';
    root.querySelector('#numeric-values-control').hidden = formula;
    root.querySelector('#numeric-formula-control').hidden = !formula;
    const selected = preset(root.querySelector('#numeric-formula-select').value);
    root.querySelector('#numeric-formula-description').textContent = selected.description;
    root.querySelector('#numeric-formula-value').textContent = `Encoded value: ${selected.value}`;
    root.querySelector('#numeric-formula-select').parentElement.querySelector('.custom-select-trigger')?.setAttribute('aria-describedby', 'numeric-formula-description numeric-formula-value');
    const input = root.querySelector('#numeric-input');
    const complete = isValue(input.value);
    input.setAttribute('aria-invalid', String(!formula && !complete));
    root.querySelector('#numeric-input-error').textContent = !formula && !complete ? 'Enter at least one digit to create a pattern.' : '';
  }
  const api = { DEFAULT_VALUE, MAX_LENGTH, presets, preset, isDraft, isValue, digits, resolve, legacyValue, migrate, readQuery, sync };
  scope.NumericControls = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
