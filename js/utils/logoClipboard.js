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
    return native(`image/${format === 'svg' ? 'svg+xml' : format}`) ? 'image' : 'unavailable';
  }
  function sync(credits = false) {
    const group = document.getElementById('clipboard-actions');
    if (!group) return;
    group.hidden = credits;
    for (const format of ['svg', 'png']) {
      const button = document.getElementById(`copy-${format}`), unavailable = mode(format) === 'unavailable';
      const label = unavailable ? `${format.toUpperCase()} copy unavailable` : `Copy ${format.toUpperCase()}`;
      const description = unavailable ? `Use ${format.toUpperCase()} download` : format === 'svg' ? 'Vector format' : 'Transparent · selected raster size';
      button.querySelector('.option-label').innerHTML = root.FeatherIcons.getIconMarkup('copy', 'export_copy-icon') + label;
      button.querySelector('.option-desc').textContent = description;
      button.setAttribute('aria-label', `${label}: ${description}`);
      button.setAttribute('aria-disabled', String(unavailable));
      button.disabled = unavailable || Boolean(root.logoExportUI?.isBusy());
    }
  }
  async function copy(format) {
    if (!['svg', 'png'].includes(format)) return null;
    const job = root.logoExportUI.begin(format);
    if (!job) return null;
    job.triggerId = `copy-${format}`;
    try {
      if (!root.isSecureContext) throw new Error('Copy needs HTTPS or localhost. Use the download actions.');
      if (mode(format) === 'unavailable') throw new Error(`${format.toUpperCase()} clipboard copying is unavailable in this browser. Use the ${format.toUpperCase()} download.`);
      const snapshot = captureLogoExportSnapshot();
      const mime = `image/${format === 'svg' ? 'svg+xml' : format}`;
      // Invoke write synchronously before any await. Never substitute source
      // text, HTML or raster data for an SVG clipboard request.
      const payload = format === 'svg' ? Promise.resolve(new Blob([snapshot.svgSource], { type: mime }))
        : createRasterExportBlob(snapshot, job.controller.signal);
      payload.catch(() => {}); // A browser may reject write before consuming the promise.
      const write = root.navigator.clipboard.write([new root.ClipboardItem({ [mime]: payload })]);
      // Dispatched platform writes cannot be reliably cancelled.
      document.getElementById('export-cancel').hidden = true;
      const status = document.getElementById('export-message');
      status.tabIndex = -1; status.focus({ preventScroll: true });
      root.logoExportUI.message(job, `Preparing and copying ${format.toUpperCase()}…`);
      await write;
      const message = `${format.toUpperCase()} copied.`;
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
