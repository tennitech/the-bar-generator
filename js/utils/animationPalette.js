/* Animation ink follows the captured artwork. Mission Control is a separate
   existing treatment; these values do not expand the selectable brand palette. */
(function (scope) {
  const inks = Object.freeze({ black: '#000000', white: '#ffffff', red: '#d6001c',
    blue: '#0081ce', gold: '#cdac38', silver: '#e1edf5', gray: '#b9ccd8', lunar: '#f4f7fb' });
  function resolve(state = {}) {
    const requested = String(state.foreground || '').toLowerCase();
    const ink = Object.values(inks).includes(requested) ? requested : (inks[state.colorMode] || inks.red);
    const light = ink === inks.black;
    return { ink, background: light ? '#ffffff' : '#000000',
      backgroundRGB: light ? '255, 255, 255' : '0, 0, 0', text: light ? '#000000' : '#ffffff' };
  }
  const api = { resolve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.AnimationPalette = api;
})(typeof window !== 'undefined' ? window : globalThis);
