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
  function mode(format) {
    if (!['svg', 'png'].includes(format)) return 'unavailable';
    if (native(`image/${format === 'svg' ? 'svg+xml' : format}`)) return 'image';
    return format === 'svg' ? 'source' : 'unavailable';
  }
  function sync(credits = false) {
    const group = document.getElementById('clipboard-actions');
    if (!group) return;
    group.hidden = credits;
    for (const format of ['svg', 'png']) {
      const button = document.getElementById(`copy-${format}`), action = mode(format);
      const label = action === 'source' ? 'Copy SVG source (text)' : `Copy ${format.toUpperCase()}`;
      const description = format === 'svg' ? (action === 'source' ? 'Code text · download SVG for Finder' : 'For SVG apps · download SVG for Finder')
          : action === 'unavailable' ? 'Copy unavailable · use PNG download above' : 'Transparent · selected raster size';
      button.querySelector('.option-label').innerHTML = root.FeatherIcons.getIconMarkup('copy', 'export_copy-icon') + label;
      button.querySelector('.option-desc').textContent = description;
      button.setAttribute('aria-label', `${label}: ${description}`);
    }
  }
  async function copy(format) {
    if (!['svg', 'png'].includes(format)) return null;
    const action = mode(format);
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
          : createRasterExportBlob(snapshot, job.controller.signal);
        payload.catch(() => {}); // A browser may reject write before consuming the promise.
        write = root.navigator.clipboard.write([new root.ClipboardItem({ [mime]: payload })]);
      }
      // Dispatched platform writes cannot be reliably cancelled.
      document.getElementById('export-cancel').hidden = true;
      const status = document.getElementById('export-message');
      status.tabIndex = -1; status.focus({ preventScroll: true });
      root.logoExportUI.message(job, `Preparing and copying ${format.toUpperCase()}${action === 'source' ? ' source text' : ''}…`);
      await write;
      const message = action === 'source' ? 'SVG source text copied. For a Finder file, use Download SVG.'
        : format === 'svg' ? 'SVG data copied for compatible apps. For Finder, use Download SVG.'
          : `${format.toUpperCase()} image copied. Paste into a compatible app.`;
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
    for (const format of ['svg', 'png']) document.getElementById(`copy-${format}`)?.addEventListener('click', () => copy(format));
    sync();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  return { native, mode, sync, copy };
});
