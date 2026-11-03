(function (root) {
  let active = null, nextId = 0, lastProgressAt = 0;
  const byId = id => document.getElementById(id);
  const controls = () => ['save-png', 'save-svg', 'save-loop-gif', 'export-size-select', 'copy-svg', 'copy-png'].map(byId).filter(Boolean);
  const text = (id, value) => { const element = byId(id); if (element) element.textContent = value; };
  function size() { return byId('export-size-select')?.value === 'standard' ? 'standard' : 'large'; }
  function pixelSize(dimensions) { return `${dimensions.width} × ${dimensions.height} px`; }
  function fileSize(bytes) {
    if (bytes < 1000) return `${bytes} B`;
    return bytes < 1000000 ? `${Math.round(bytes / 1000)} KB` : `${(bytes / 1000000).toFixed(1)} MB`;
  }
  function sync(credits = false) {
    if (byId('export-settings')) byId('export-settings').hidden = credits;
    if (byId('export-host-note')) byId('export-host-note').hidden = credits || !root.embedSupport?.isEmbedded();
    if (!credits && root.RPI_LOGO_GEOMETRY && root.logoExportOptions) {
      const dimensions = root.logoExportOptions.dimensions(size(), root.RPI_LOGO_GEOMETRY);
      text('export-dimensions', pixelSize(dimensions));
      for (const format of ['png', 'svg', 'gif']) {
        const button = byId(format === 'gif' ? 'save-loop-gif' : `save-${format}`);
        const label = `Download ${format.toUpperCase()}`;
        const description = format === 'svg' ? 'Scalable vector'
          : format === 'png' ? 'Transparent image' : 'Looping animation';
        if (!button) continue;
        button.querySelector('.option-label').textContent = format.toUpperCase();
        button.querySelector('.option-desc').textContent = description;
        button.setAttribute('aria-label', `${label}: ${description}${format === 'svg' ? '' : `, ${pixelSize(dimensions)}`}`);
      }
    }
    root.logoClipboard?.sync(credits);
  }
  function meter(value = null) {
    const indeterminate = value === null;
    byId('export-track')?.setAttribute('data-indeterminate', String(indeterminate));
    if (indeterminate) byId('export-meter').removeAttribute('value');
    else byId('export-meter').value = Math.max(0, Math.min(1, value));
    if (byId('export-fill')) byId('export-fill').style.width = indeterminate ? '' : `${Math.max(0, Math.min(1, value)) * 100}%`;
    text('export-percent', indeterminate ? '' : `${Math.floor(Math.max(0, Math.min(1, value)) * 100)}%`);
  }
  function begin(format) {
    if (active) return null;
    active = { id: ++nextId, format, controller: new AbortController() };
    const menu = byId('save-menu'), cancel = byId('export-cancel');
    const focusWasInMenu = menu?.contains(document.activeElement);
    controls().forEach(control => { control.disabled = true; });
    byId('save-button')?.setAttribute('aria-busy', 'true');
    byId('export-progress').hidden = false;
    byId('export-progress').setAttribute('data-outcome', 'working');
    if (byId('export-track')) byId('export-track').hidden = false;
    text('export-message', `Preparing ${format.toUpperCase()}…`);
    text('export-detail', 'Capturing the current design.');
    meter();
    cancel.hidden = false; cancel.disabled = false; cancel.removeAttribute('aria-disabled'); cancel.textContent = 'Cancel';
    if (focusWasInMenu) cancel.focus({ preventScroll: true });
    // Scroll only this menu. scrollIntoView can pan the document or embedding
    // viewport on mobile WebKit, moving the artwork and header out of place.
    if (menu && !menu.classList.contains('hidden')) menu.scrollTop = menu.scrollHeight;
    lastProgressAt = -Infinity;
    return active;
  }
  function describe(job, snapshot) {
    if (active !== job) return;
    job.dimensions = job.format === 'svg' ? 'Scalable vector' : pixelSize(snapshot.dimensions);
    text('export-detail', `${job.dimensions} · transparent background`);
  }
  function report(job, progress) {
    if (active !== job || job.controller.signal.aborted || !Number.isFinite(progress.total) || progress.total <= 0) return;
    const now = performance.now();
    if (now - lastProgressAt < 100 && progress.encoded !== progress.total) return;
    lastProgressAt = now;
    const prepared = Math.max(0, Math.min(progress.total, progress.prepared));
    const encoded = Math.max(0, Math.min(progress.total, progress.encoded));
    meter((prepared + encoded) / (2 * progress.total));
    text('export-message', encoded === progress.total ? 'Finishing GIF…' : 'Creating GIF…');
    text('export-detail', `${prepared}/${progress.total} frames rendered · ${encoded}/${progress.total} encoded`);
    byId('export-meter').setAttribute('aria-valuetext', `${prepared} of ${progress.total} frames rendered, ${encoded} encoded`);
  }
  function message(job, value) {
    if (active === job && !job.controller.signal.aborted) text('export-message', value);
  }
  function ready(job, blob) {
    if (active !== job) return;
    job.fileDetail = `${job.dimensions || job.format.toUpperCase()} · ${fileSize(blob.size)}`;
    text('export-detail', job.fileDetail);
  }
  function finish(job, outcome, value) {
    if (active !== job) return;
    const focusWasInMenu = byId('save-menu')?.contains(document.activeElement);
    active = null;
    controls().forEach(control => { control.disabled = false; });
    sync(Boolean(byId('clipboard-actions')?.hidden));
    byId('save-button')?.removeAttribute('aria-busy');
    byId('export-progress').setAttribute('data-outcome', outcome);
    text('export-message', value);
    byId('export-cancel').hidden = true;
    byId('export-meter').removeAttribute('aria-valuetext');
    const complete = ['started', 'requested', 'copied'].includes(outcome);
    meter(complete ? 1 : 0);
    if (!complete) {
      if (byId('export-track')) byId('export-track').hidden = true;
      text('export-percent', '');
      text('export-detail', outcome === 'cancelled' ? 'No file was downloaded.' : 'Choose an action above to try again.');
    } else {
      text('export-percent', outcome === 'copied' ? 'Copied' : 'Ready');
      const guidance = outcome === 'copied' ? 'Ready to paste.' : 'Check your browser’s downloads.';
      text('export-detail', `${job.fileDetail || job.dimensions || job.format.toUpperCase()} · ${guidance}`);
    }
    if (outcome === 'cancelled') {
      if (focusWasInMenu) byId('save-button')?.focus();
      if (typeof hideSaveMenu === 'function') hideSaveMenu();
      else byId('save-menu')?.classList.add('hidden');
      return;
    }
    // Keep the result visible. An anchor click confirms a request, not receipt.
    if (focusWasInMenu) {
      if (outcome === 'error') {
        const retry = byId(job.triggerId || (job.format === 'gif' ? 'save-loop-gif' : `save-${job.format}`));
        if (retry && !retry.disabled) retry.focus();
        else byId('save-button')?.focus();
      } else {
        const status = byId('export-message'); status.tabIndex = -1; status.focus({ preventScroll: true });
      }
    }
  }
  function init() {
    byId('export-size-select')?.addEventListener('change', () => sync(false));
    byId('export-cancel')?.addEventListener('click', () => {
      if (!active || active.controller.signal.aborted) return;
      text('export-message', 'Cancelling export…');
      byId('export-cancel').focus({ preventScroll: true });
      byId('export-cancel').setAttribute('aria-disabled', 'true');
      active.controller.abort();
    });
    const dismiss = event => {
      if (event.key !== 'Escape' || byId('save-menu')?.classList.contains('hidden')) return;
      event.preventDefault(); event.stopPropagation();
      if (typeof hideSaveMenu === 'function') hideSaveMenu();
      byId('save-button')?.focus();
    };
    byId('save-menu')?.addEventListener('keydown', dismiss);
    byId('save-button')?.addEventListener('keydown', dismiss);
    sync(false);
  }
  root.logoExportUI = { size, sync, begin, describe, report, message, ready, finish, isBusy: () => !!active };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
