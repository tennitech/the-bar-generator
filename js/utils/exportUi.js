(function (root) {
  let active = null, nextId = 0, lastProgressAt = 0;
  const byId = id => document.getElementById(id);
  const controls = () => ['save-png', 'save-svg', 'save-loop-gif', 'export-size-select'].map(byId).filter(Boolean);
  function size() { return byId('export-size-select')?.value === 'large' ? 'large' : 'standard'; }
  function sync(credits = false) {
    if (byId('export-settings')) byId('export-settings').hidden = credits;
    if (credits || !root.RPI_LOGO_GEOMETRY || !root.logoExportOptions) return;
    const dimensions = root.logoExportOptions.dimensions(size(), root.RPI_LOGO_GEOMETRY);
    for (const format of ['png', 'gif']) {
      const button = byId(format === 'png' ? 'save-png' : 'save-loop-gif');
      const description = button?.querySelector('.option-desc');
      if (description) description.textContent = `Transparent${format === 'gif' ? ' loop' : ''} · ${dimensions.width} × ${dimensions.height} px`;
      if (button) button.setAttribute('aria-label', `${format.toUpperCase()}: ${description?.textContent || ''}`);
    }
  }
  function begin(format) {
    if (active) {
      byId('export-message').textContent = 'An export is already in progress.';
      return null;
    }
    active = { id: ++nextId, format, controller: new AbortController() };
    const menu = byId('save-menu'), cancel = byId('export-cancel');
    const focusWasInMenu = menu?.contains(document.activeElement);
    controls().forEach(control => { control.disabled = true; });
    byId('save-button')?.setAttribute('aria-busy', 'true');
    byId('export-progress').hidden = false;
    byId('export-message').textContent = `Preparing ${format.toUpperCase()}…`;
    byId('export-meter').removeAttribute('value');
    cancel.hidden = false; cancel.disabled = false; cancel.removeAttribute('aria-disabled'); cancel.textContent = 'Cancel';
    if (focusWasInMenu) cancel.focus();
    lastProgressAt = 0;
    return active;
  }
  function report(job, progress) {
    if (active !== job) return;
    const now = performance.now();
    if (now - lastProgressAt < 150 && progress.encoded !== progress.total) return;
    lastProgressAt = now;
    byId('export-meter').value = (progress.prepared + progress.encoded) / (2 * progress.total);
    byId('export-message').textContent = `GIF frames: ${progress.prepared}/${progress.total} prepared · ${progress.encoded}/${progress.total} encoded`;
  }
  function message(job, text) { if (active === job) byId('export-message').textContent = text; }
  function finish(job, outcome, text) {
    if (active !== job) return;
    // Hiding the focused Cancel button makes browsers move focus to body.
    // Capture ownership before changing hidden/disabled state.
    const focusWasInMenu = byId('save-menu')?.contains(document.activeElement);
    active = null;
    controls().forEach(control => { control.disabled = false; });
    byId('save-button')?.removeAttribute('aria-busy');
    byId('export-message').textContent = text;
    byId('export-cancel').hidden = true;
    byId('export-meter').value = outcome === 'started' ? 1 : 0;
    if (outcome === 'error' && focusWasInMenu) {
      byId(job.format === 'gif' ? 'save-loop-gif' : `save-${job.format}`)?.focus();
    } else {
      if (focusWasInMenu) byId('save-button')?.focus();
      if (typeof hideSaveMenu === 'function') hideSaveMenu();
      else byId('save-menu')?.classList.add('hidden');
    }
  }
  function init() {
    byId('export-size-select')?.addEventListener('change', () => sync(false));
    byId('export-cancel')?.addEventListener('click', () => {
      if (!active || active.controller.signal.aborted) return;
      byId('export-message').textContent = 'Cancelling export…';
      // Keep native focus while cancellation propagates. A disabled focused
      // button blurs immediately, before finish() can restore its owner.
      // WebKit pointer activation does not automatically focus native buttons.
      byId('export-cancel').focus({ preventScroll: true });
      byId('export-cancel').setAttribute('aria-disabled', 'true');
      active.controller.abort();
    });
    byId('save-menu')?.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation();
      if (typeof hideSaveMenu === 'function') hideSaveMenu();
      byId('save-button')?.focus();
    });
    sync(false);
  }
  root.logoExportUI = { size, sync, begin, report, message, finish, isBusy: () => !!active };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
