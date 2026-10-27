/* Clipboard writes stay inside the click's user activation. Raster preparation
 * is supplied as a promise to ClipboardItem for Safari; no permission requests. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.logoClipboard = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  function native(mime) {
    if (!root.isSecureContext || !root.navigator?.clipboard?.write || !root.ClipboardItem) return false;
    try {
      return typeof root.ClipboardItem.supports === 'function'
        ? root.ClipboardItem.supports(mime) : mime === 'image/png';
    } catch (_) { return false; }
  }
  function background(ink) {
    const rgb = ink.replace('#', '').match(/../g).map(value => {
      const s = parseInt(value, 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
  }
  function mode(format) {
    if (native(`image/${format === 'svg' ? 'svg+xml' : format}`)) return 'image';
    return format === 'svg' ? 'source' : format === 'jpeg' ? 'download' : 'unavailable';
  }
  function sync(credits = false) {
    const group = document.getElementById('clipboard-actions');
    if (!group) return;
    group.hidden = credits;
    const ink = typeof colors !== 'undefined' && typeof currentColorMode !== 'undefined'
      ? colors[currentColorMode]?.fg || '#000000' : '#000000';
    const matte = background(ink) === '#000000' ? 'Black' : 'White';
    for (const format of ['svg', 'png', 'jpeg']) {
      const button = document.getElementById(`copy-${format}`), action = mode(format);
      const label = action === 'source' ? 'Copy SVG source' : action === 'download' ? 'Download JPEG' : `Copy ${format.toUpperCase()}`;
      const description = format === 'jpeg' ? `${matte} background${action === 'download' ? ' · direct copy unavailable' : ''}`
        : format === 'svg' ? (action === 'source' ? 'Text fallback · download SVG for vector import' : 'Editable vector · compatible apps')
          : action === 'unavailable' ? 'Copy unavailable · use PNG download above' : 'Transparent · selected raster size';
      button.querySelector('.option-label').innerHTML = root.FeatherIcons.getIconMarkup(action === 'download' ? 'download' : 'copy', 'export_copy-icon') + label;
      button.querySelector('.option-desc').textContent = description;
      button.setAttribute('aria-label', `${label}: ${description}`);
    }
  }
  async function copy(format) {
    const action = mode(format);
    if (action === 'download') return runLogoExport('jpeg', 'copy-jpeg');
    const job = root.logoExportUI.begin(format);
    if (!job) return null;
    job.triggerId = `copy-${format}`;
    try {
      if (!root.isSecureContext) throw new Error('Copy needs HTTPS or localhost. Use the download actions.');
      if (action === 'unavailable' || !root.navigator?.clipboard) throw new Error('Image copy is unavailable here. Use the download actions.');
      const snapshot = captureLogoExportSnapshot();
      const mime = action === 'source' ? 'text/plain' : `image/${format === 'svg' ? 'svg+xml' : format}`;
      let write;
      // Invoke write synchronously before any await. Do not hide a clipboard
      // write behind an async permission query, timer, or raster decode.
      if (action === 'source') {
        if (!root.navigator.clipboard.writeText) throw new Error('Text copy is unavailable. Download SVG instead.');
        write = root.navigator.clipboard.writeText(snapshot.svgSource);
      } else {
        const payload = format === 'svg' ? Promise.resolve(new Blob([snapshot.svgSource], { type: mime }))
          : createRasterExportBlob(snapshot, job.controller.signal, mime, format === 'jpeg' ? background(snapshot.foreground) : null);
        payload.catch(() => {}); // A browser may reject write before consuming the promise.
        write = root.navigator.clipboard.write([new root.ClipboardItem({ [mime]: payload })]);
      }
      // Dispatched platform writes cannot be reliably cancelled.
      document.getElementById('export-cancel').hidden = true;
      const status = document.getElementById('export-message');
      status.tabIndex = -1; status.focus({ preventScroll: true });
      root.logoExportUI.message(job, `Preparing and copying ${format.toUpperCase()}${action === 'source' ? ' source text' : ''}…`);
      await write;
      const message = action === 'source' ? 'SVG source text copied. Download SVG to import a vector image.' : `${format.toUpperCase()} image copied. Paste into a compatible app.`;
      root.logoExportUI.finish(job, 'started', message);
      Toast.show(message, 'success');
      return { mime, width: format === 'svg' ? null : snapshot.dimensions.width, height: format === 'svg' ? null : snapshot.dimensions.height };
    } catch (error) {
      job.controller.abort();
      const message = error.name === 'NotAllowedError' ? 'Copy was blocked. Focus this page and try again, or download the asset.'
        : `Copy failed: ${error.message} Try again or use a download.`;
      root.logoExportUI.finish(job, 'error', message);
      Toast.show(message, 'error');
      return null;
    }
  }
  function init() {
    for (const format of ['svg', 'png', 'jpeg']) document.getElementById(`copy-${format}`)?.addEventListener('click', () => copy(format));
    sync();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  return { native, background, mode, sync, copy };
});
