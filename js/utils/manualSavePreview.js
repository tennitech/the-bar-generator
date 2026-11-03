/* Prototype: browser-native saving from a real image, never a simulated download.
 * The exported bytes remain unchanged. Host permissions are only observed. */
(function (root) {
  const byId = id => root.document?.getElementById(id);
  const formats = new Set(['svg', 'png']);
  let current = null, generation = 0, pending = null, opening = 0;
  function enabled(format) {
    return formats.has(format) && root.embedSupport?.isEmbedded() && typeof byId('save-preview-dialog')?.showModal === 'function';
  }
  function isLightInk(rgb) {
    if (!Array.isArray(rgb) || rgb.length < 3) return false;
    return (.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]) > 155;
  }
  function formatInfo(format, dimensions) {
    return format === 'svg' ? 'SVG · Scalable vector · Transparent'
      : `PNG · ${dimensions.width} × ${dimensions.height} px · Transparent`;
  }
  function validateBlob(blob, format) {
    const expected = format === 'svg' ? 'image/svg+xml' : format === 'png' ? 'image/png' : null;
    if (!expected || blob?.type !== expected) throw new Error('The image format did not match the request.');
  }
  function abortError() { return new DOMException('Image preparation cancelled.', 'AbortError'); }
  async function decodedImage(blob, signal) {
    if (signal?.aborted) throw abortError();
    const url = root.URL.createObjectURL(blob), image = new root.Image();
    let abort;
    try {
      image.src = url;
      await Promise.race([image.decode(), new Promise((_, reject) => {
        abort = () => reject(abortError());
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) abort();
      })]);
      if (signal?.aborted) throw abortError();
      return { url, image };
    } catch (error) { root.URL.revokeObjectURL(url); image.src = ''; throw error; }
    finally { signal?.removeEventListener('abort', abort); }
  }
  function setBusy(busy, format) {
    byId('save-preview-stage')?.setAttribute('aria-busy', String(busy));
    if (byId('save-preview-busy')) byId('save-preview-busy').hidden = !busy;
    if (busy) byId('save-preview-status').textContent = `Preparing ${format.toUpperCase()}…`;
  }
  function display(prepared, format) {
    const oldURL = current.url;
    const image = prepared.image;
    image.id = 'save-preview-image'; image.className = 'save-preview_image';
    image.alt = `Your RPI bar design as a ${format.toUpperCase()} image, ready for your browser’s save menu`;
    image.tabIndex = 0; image.setAttribute('aria-describedby', 'save-preview-step-one save-preview-step-two');
    // Do not intercept contextmenu, drag, copy or touch-and-hold gestures.
    byId('save-preview-image-slot').replaceChildren(image);
    current.url = prepared.url; current.format = format;
    byId('save-preview-title').textContent = `Save your ${format.toUpperCase()}`;
    byId('save-preview-metadata').textContent = formatInfo(format, current.dimensions);
    byId('save-preview-filename').value = current.filename(format);
    byId('save-preview-extension').textContent = `Keep the .${format} extension.`;
    for (const type of formats) byId(`save-preview-${type}`).setAttribute('aria-pressed', String(type === format));
    byId('save-preview-status').textContent = `${format.toUpperCase()} image ready. Use your browser’s save menu to finish.`;
    byId('save-preview-error').hidden = true;
    setBusy(false);
    // Keep the live resource valid for the entire browser-menu interaction.
    if (oldURL) root.URL.revokeObjectURL(oldURL);
  }
  async function selectFormat(format) {
    if (!current || !formats.has(format) || (current.format === format && !pending)) return;
    pending?.abort();
    const controller = new AbortController(); pending = controller;
    const session = current, revision = ++generation;
    setBusy(true, format); byId('save-preview-error').hidden = true;
    try {
      const blob = await session.prepare(format, controller.signal);
      validateBlob(blob, format);
      const prepared = await decodedImage(blob, controller.signal);
      if (current !== session || revision !== generation || controller.signal.aborted) {
        root.URL.revokeObjectURL(prepared.url); return;
      }
      display(prepared, format);
    } catch (error) {
      if (current !== session || revision !== generation || error.name === 'AbortError') return;
      setBusy(false);
      byId('save-preview-error').hidden = false;
      byId('save-preview-error-text').textContent = `${format.toUpperCase()} could not be prepared. Your current image is unchanged.`;
      byId('save-preview-retry').onclick = () => selectFormat(format);
      byId('save-preview-status').textContent = `${format.toUpperCase()} preparation failed. You can try again.`;
    } finally { if (pending === controller) pending = null; }
  }
  function release() {
    ++generation; opening = 0; pending?.abort(); pending = null;
    if (current?.url) root.URL.revokeObjectURL(current.url);
    current = null;
    byId('save-preview-image-slot')?.replaceChildren();
    setBusy(false);
    root.document?.body.classList.remove('has-save-preview');
  }
  function close() {
    const cancelled = root.logoExportUI?.cancelPendingPreview();
    const dialog = byId('save-preview-dialog');
    if (!cancelled && !opening && !current && !dialog?.open) return;
    release();
    if (dialog?.open) dialog.close();
    byId('save-button')?.focus({ preventScroll: true });
  }
  async function open({ format, blob, snapshot, prepare, filename, signal, onReady }) {
    if (!formats.has(format)) throw new Error('This preview supports SVG and PNG.');
    validateBlob(blob, format);
    const revision = ++generation;
    opening = revision;
    let prepared;
    try { prepared = await decodedImage(blob, signal); }
    finally { if (opening === revision) opening = 0; }
    if (signal?.aborted || revision !== generation) { root.URL.revokeObjectURL(prepared.url); throw abortError(); }
    release();
    current = { dimensions: snapshot.dimensions, prepare, filename, url: null, format: null };
    try {
      display(prepared, format);
      const dark = isLightInk(snapshot.rgb);
      byId('save-preview-stage').classList.toggle('is-dark', dark);
      byId('save-preview-background').setAttribute('aria-pressed', String(dark));
      byId('save-preview-help').open = false;
      const touch = root.matchMedia?.('(pointer: coarse)').matches;
      byId('save-preview-gesture').textContent = touch ? 'Touch and hold the image' : 'Right-click the image';
      byId('save-preview-gesture-detail').textContent = touch ? 'Hold until your browser’s menu appears.' : 'On a trackpad, click with two fingers.';
      byId('save-preview-menu-action').textContent = touch ? 'Choose the image save option' : 'Choose “Save Image As…”';
      onReady?.();
      root.document.body.classList.add('has-save-preview');
      byId('save-preview-dialog').showModal();
      byId('save-preview-title').focus({ preventScroll: true });
    } catch (error) { release(); throw error; }
  }
  function init() {
    const dialog = byId('save-preview-dialog');
    if (!dialog) return;
    byId('save-preview-close').innerHTML = root.FeatherIcons.getIconMarkup('x', 'save-preview_close-icon');
    byId('save-preview-close').addEventListener('click', close);
    byId('save-preview-done').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { if (current) release(); });
    dialog.addEventListener('click', event => event.stopPropagation());
    for (const format of formats) byId(`save-preview-${format}`).addEventListener('click', () => selectFormat(format));
    byId('save-preview-background').addEventListener('click', () => {
      const dark = byId('save-preview-stage').classList.toggle('is-dark');
      byId('save-preview-background').setAttribute('aria-pressed', String(dark));
    });
    byId('save-preview-filename').addEventListener('focus', event => event.target.select());
    root.addEventListener('pagehide', close);
    root.addEventListener('popstate', close);
  }
  root.manualSavePreview = { enabled, open, close, selectFormat, isLightInk, formatInfo, validateBlob };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.manualSavePreview;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
