/* Clipboard writes stay inside the click's user activation. Raster preparation
 * is supplied as a promise to ClipboardItem for Safari; no permission requests. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.logoClipboard = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  function native(mime) {
    if (!root.isSecureContext || !root.navigator?.clipboard?.write || !root.ClipboardItem || root.embedSupport?.clipboardBlocked()) return false;
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
      const label = `Copy ${format.toUpperCase()}`;
      const blocker = root.NucleotidePattern?.exportBlocker(document) || '';
      const dimensions = root.RPI_LOGO_GEOMETRY && root.logoExportOptions
        ? root.logoExportOptions.dimensions(root.logoExportUI.size(), root.RPI_LOGO_GEOMETRY, root.logoExportUI.composition?.()) : null;
      const description = root.embedSupport?.clipboardBlocked() ? 'Blocked by this site’s embed permissions'
        : unavailable ? `Not supported here. Save the ${format.toUpperCase()} file instead.`
          : format === 'svg' ? 'Scalable vector'
            : dimensions ? `${dimensions.width} × ${dimensions.height} px` : 'Transparent image';
      button.querySelector('.option-label').textContent = format.toUpperCase();
      button.querySelector('.option-desc').textContent = unavailable ? (root.embedSupport?.clipboardBlocked() ? 'Blocked by site' : 'Use download') : (format === 'svg' ? 'Scalable vector' : 'Transparent image');
      button.title = unavailable ? description : '';
      button.setAttribute('aria-label', `${label}: ${root.logoExportOptions?.compositionLabel(root.logoExportUI.composition?.()) || 'Bar + RPI'}, ${description}`);
      button.setAttribute('aria-disabled', String(unavailable || Boolean(blocker)));
      button.disabled = unavailable || Boolean(blocker) || Boolean(root.logoExportUI?.isBusy());
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
      root.logoExportUI.describe(job, snapshot);
      const mime = `image/${format === 'svg' ? 'svg+xml' : format}`;
      // Invoke write synchronously before any await. Never substitute source
      // text, HTML or raster data for an SVG clipboard request.
      const payload = (format === 'svg' ? Promise.resolve(new Blob([snapshot.svgSource], { type: mime }))
        : createRasterExportBlob(snapshot, job.controller.signal, stage => root.logoExportUI.message(job, stage)))
        .then(blob => {
          root.logoExportUI.ready(job, blob);
          root.logoExportUI.message(job, `Writing ${format.toUpperCase()} to clipboard…`);
          return blob;
        });
      payload.catch(() => {}); // A browser may reject write before consuming the promise.
      const write = root.navigator.clipboard.write([new root.ClipboardItem({ [mime]: payload })]);
      // Dispatched platform writes cannot be reliably cancelled.
      document.getElementById('export-cancel').hidden = true;
      const status = document.getElementById('export-message');
      status.tabIndex = -1; status.focus({ preventScroll: true });
      await write;
      const message = `${format.toUpperCase()} copied.`;
      root.logoExportUI.finish(job, 'copied', message);
      if (document.getElementById('save-menu')?.classList.contains('hidden')) Toast.show(message, 'success');
      return { mime, width: format === 'svg' ? null : snapshot.dimensions.width, height: format === 'svg' ? null : snapshot.dimensions.height };
    } catch (error) {
      job.controller.abort();
      const message = error.name === 'NotAllowedError' ? (root.embedSupport?.isEmbedded() ? 'Copy was blocked. This site may need to allow clipboard access for the embedded generator.' : 'Copy was blocked. Focus this page and try again, or download the file.')
        : `Copy failed: ${error.message} Try again or use a download.`;
      root.logoExportUI.finish(job, 'error', message);
      if (document.getElementById('save-menu')?.classList.contains('hidden')) Toast.show(message, 'error');
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
