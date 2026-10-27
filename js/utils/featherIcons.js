/* Exact Feather v4.29.2 SVGs. MIT: third_party/feather/LICENSE.
 * Source assets and hashes: third_party/feather/notice.md. Do not redraw paths. */
(function (scope) {
  const icons = Object.freeze({
  "share": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"/><polyline points=\"16 6 12 2 8 6\"/><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"15\"/></svg>",
  "copy": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"/><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"/></svg>",
  "check": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"/></svg>"
});
  function getIconMarkup(name, className = '') {
    if (!Object.hasOwn(icons, name)) throw new Error('Unknown Feather icon.');
    const classes = String(className).replace(/[^a-zA-Z0-9_ -]/g, '');
    return icons[name].replace('<svg ', `<svg class="${classes}" aria-hidden="true" focusable="false" `);
  }
  const api = { icons, getIconMarkup, source: 'feathericons/feather@v4.29.2' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.FeatherIcons = api;
})(typeof window !== 'undefined' ? window : globalThis);
