(function (root) {
  let active = null, nextId = 0, lastProgressAt = 0, selectedComposition = 'logo';
  let lastContext = null, designRevision = 0, creditsContext = false;
  const byId = id => document.getElementById(id);
  const controls = () => ['save-png', 'save-svg', 'save-loop-gif', 'export-size-select', 'export-size-large', 'export-size-standard', 'copy-svg', 'copy-png', 'export-composition-logo', 'export-composition-bar'].map(byId).filter(Boolean);
  const text = (id, value) => { const element = byId(id); if (element) element.textContent = value; };
  function size() { return byId('export-size-select')?.value === 'standard' ? 'standard' : 'large'; }
  function composition() { return selectedComposition; }
  function pixelSize(dimensions) { return `${dimensions.width} × ${dimensions.height} px`; }
  function fileSize(bytes) {
    if (bytes < 1000) return `${bytes} B`;
    return bytes < 1000000 ? `${Math.round(bytes / 1000)} KB` : `${(bytes / 1000000).toFixed(1)} MB`;
  }
  function contextKey() {
    const style = byId('style-select')?.value || '';
    return JSON.stringify([creditsContext, style, byId('color-mode-select')?.value || '', size(), composition(),
      style === 'wave-quantum' ? byId('quantum-speed-slider')?.value : '', designRevision]);
  }
  function resetResult() {
    const progress = byId('export-progress');
    const restoreFocus = progress?.contains(document.activeElement);
    if (progress) { progress.hidden = true; progress.removeAttribute('data-outcome'); }
    for (const id of ['export-message', 'export-detail', 'export-percent']) text(id, '');
    const meter = byId('export-meter');
    if (meter) { meter.value = 0; meter.removeAttribute('value'); meter.removeAttribute('aria-valuetext'); }
    if (byId('export-fill')) byId('export-fill').style.width = '';
    if (byId('export-cancel')) byId('export-cancel').hidden = true;
    if (restoreFocus) byId('save-button')?.focus({ preventScroll: true });
  }
  function sourcePrefix(job) {
    return job.context !== contextKey() && job.sourceLabel ? `${job.sourceLabel} · ` : '';
  }
  function sync(credits = false) {
    creditsContext = Boolean(credits);
    const context = contextKey();
    if (lastContext !== null && lastContext !== context) {
      if (!active) resetResult();
      else if (active.sourceLabel && !active.controller.signal.aborted) {
        text('export-message', `Creating ${active.sourceLabel}…`);
        text('export-detail', `${active.dimensions || ''} · captured before this design change`);
      }
    }
    lastContext = context;
    for (const value of ['logo', 'bar']) {
      const option = byId(`export-composition-${value}`);
      if (option) option.checked = composition() === value;
    }
    for (const value of ['large', 'standard']) {
      const option = byId(`export-size-${value}`);
      if (option) option.checked = size() === value;
    }
    if (byId('export-settings')) byId('export-settings').hidden = credits;
    if (byId('export-host-note')) byId('export-host-note').hidden = credits || !root.embedSupport?.isEmbedded();
    if (!credits && root.RPI_LOGO_GEOMETRY && root.logoExportOptions) {
      const dimensions = root.logoExportOptions.dimensions(size(), root.RPI_LOGO_GEOMETRY, composition());
      text('export-dimensions', pixelSize(dimensions));
      for (const format of ['png', 'svg', 'gif']) {
        const button = byId(format === 'gif' ? 'save-loop-gif' : `save-${format}`);
        const label = `Download ${format.toUpperCase()}`;
        let description = format === 'svg' ? 'Scalable vector'
          : format === 'png' ? 'Transparent image' : 'Looping animation';
        let actionDimensions = dimensions;
        if (format === 'gif' && byId('style-select')?.value === 'wave-quantum' && root.loopingGifUtils?.getRingGifExportPolicy) {
          const policy = root.loopingGifUtils.getRingGifExportPolicy({ quantumSpeed: byId('quantum-speed-slider')?.value ?? 1 }, { size: size(), composition: composition() });
          actionDimensions = root.logoExportOptions.dimensions(policy.size, root.RPI_LOGO_GEOMETRY, composition());
          description = policy.supported
            ? `${Number(policy.periodSeconds.toFixed(1))} s loop · 30 fps${policy.note ? ` · Standard (${pixelSize(actionDimensions)}) for long loop` : ''}`
            : 'Set SPEED to 1× or higher for GIF';
        }
        if (!button) continue;
        button.querySelector('.option-label').textContent = format.toUpperCase();
        button.querySelector('.option-desc').textContent = description;
        button.setAttribute('aria-label', `${label}: ${root.logoExportOptions.compositionLabel(composition())}, ${description}${format === 'svg' ? '' : `, ${pixelSize(actionDimensions)}`}`);
      }
    }
    root.logoClipboard?.sync(credits);
    const blocker = credits ? '' : root.NucleotidePattern?.exportBlocker(document) || '';
    const note = byId('export-input-note');
    if (note) { note.hidden = !blocker; note.textContent = blocker; }
    const trigger = byId('save-button'), explanation = byId('export-blocked-note');
    if (trigger) {
      trigger.setAttribute('aria-disabled', String(Boolean(blocker)));
      trigger.setAttribute('aria-label', blocker ? `Export unavailable. ${blocker}` : 'Open export menu');
      if (blocker) trigger.setAttribute('aria-describedby', 'export-blocked-note');
      else trigger.removeAttribute('aria-describedby');
    }
    if (explanation) {
      explanation.textContent = blocker;
      if (!blocker) explanation.hidden = true;
    }
    for (const id of ['save-png', 'save-svg', 'save-loop-gif']) {
      const button = byId(id);
      if (button) { button.disabled = Boolean(active || blocker); button.setAttribute('aria-disabled', String(button.disabled)); }
    }
  }
  // Keep the unavailable trigger focusable so pointer, keyboard and touch users
  // can get the same explanation. The actions and snapshot guard enforce it.
  function explainBlocked() {
    const blocker = root.NucleotidePattern?.exportBlocker(document) || '';
    if (!blocker) return false;
    const note = byId('export-blocked-note');
    if (note) { note.textContent = blocker; note.hidden = false; }
    return true;
  }
  function hideBlockedNote() { if (byId('export-blocked-note')) byId('export-blocked-note').hidden = true; }
  function meter(value = null) {
    const indeterminate = value === null;
    byId('export-track')?.setAttribute('data-indeterminate', String(indeterminate));
    if (indeterminate) byId('export-meter').removeAttribute('value');
    else byId('export-meter').value = Math.max(0, Math.min(1, value));
    if (byId('export-fill')) byId('export-fill').style.width = indeterminate ? '' : `${Math.max(0, Math.min(1, value)) * 100}%`;
    text('export-percent', indeterminate ? '' : `${Math.floor(Math.max(0, Math.min(1, value)) * 100)}%`);
  }
  function begin(format) {
    if (active || root.NucleotidePattern?.exportBlocker(document)) return null;
    active = { id: ++nextId, format, context: contextKey(), controller: new AbortController() };
    lastContext = active.context;
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
    const family = root.BarInformation?.descriptions?.[snapshot.family]?.title || snapshot.family;
    job.sourceLabel = `${family ? `${family} ` : ''}${job.format.toUpperCase()}`;
    job.dimensions = job.format === 'svg' ? 'Scalable vector' : pixelSize(snapshot.dimensions);
    job.compositionLabel = snapshot.composition && root.logoExportOptions?.compositionLabel(snapshot.composition);
    text('export-detail', `${job.compositionLabel ? `${job.compositionLabel} · ` : ''}${job.dimensions} · transparent background${snapshot.gifPolicy?.note ? ` · ${snapshot.gifPolicy.note}` : ''}`);
  }
  function report(job, progress) {
    if (active !== job || job.controller.signal.aborted || !Number.isFinite(progress.total) || progress.total <= 0) return;
    const now = performance.now();
    if (now - lastProgressAt < 100 && progress.encoded !== progress.total) return;
    lastProgressAt = now;
    const prepared = Math.max(0, Math.min(progress.total, progress.prepared));
    const encoded = Math.max(0, Math.min(progress.total, progress.encoded));
    meter((prepared + encoded) / (2 * progress.total));
    text('export-message', `${encoded === progress.total ? 'Finishing' : 'Creating'} ${sourcePrefix(job) ? job.sourceLabel : 'GIF'}…`);
    text('export-detail', `${sourcePrefix(job)}${prepared}/${progress.total} frames rendered · ${encoded}/${progress.total} encoded`);
    byId('export-meter').setAttribute('aria-valuetext', `${prepared} of ${progress.total} frames rendered, ${encoded} encoded`);
  }
  function message(job, value) {
    if (active === job && !job.controller.signal.aborted) text('export-message', `${sourcePrefix(job)}${value}`);
  }
  function ready(job, blob) {
    if (active !== job) return;
    job.fileDetail = `${job.compositionLabel ? `${job.compositionLabel} · ` : ''}${job.dimensions || job.format.toUpperCase()} · ${fileSize(blob.size)}`;
    text('export-detail', `${sourcePrefix(job)}${job.fileDetail}`);
  }
  function finish(job, outcome, value) {
    if (active !== job) return;
    const focusWasInMenu = byId('save-menu')?.contains(document.activeElement);
    const contextChanged = job.context !== contextKey();
    active = null;
    controls().forEach(control => { control.disabled = false; });
    sync(Boolean(byId('clipboard-actions')?.hidden));
    byId('save-button')?.removeAttribute('aria-busy');
    if (contextChanged) {
      resetResult();
      if (focusWasInMenu) byId('save-button')?.focus({ preventScroll: true });
      if (outcome === 'cancelled') {
        if (typeof hideSaveMenu === 'function') hideSaveMenu();
        else byId('save-menu')?.classList.add('hidden');
      }
      return;
    }
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
    byId('quantum-speed-slider')?.addEventListener('input', () => sync());
    const designChanged = event => {
      if (!event.target?.closest?.('[data-parameter-actions]')) return;
      designRevision++;
      sync(false);
    };
    document.addEventListener('input', designChanged);
    document.addEventListener('change', designChanged);
    byId('save-button')?.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') explainBlocked(); });
    byId('save-button')?.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') hideBlockedNote(); });
    byId('save-button')?.addEventListener('focus', explainBlocked);
    byId('save-button')?.addEventListener('blur', hideBlockedNote);
    document.addEventListener('click', event => {
      if (!byId('save-button')?.contains(event.target) && !byId('export-blocked-note')?.contains(event.target)) hideBlockedNote();
    });
    // Native radio inputs supply Tab/arrow/Space behavior and checked semantics.
    // These static diagrams reuse official paths; they are composition guides,
    // not a second live renderer or a replacement for the current bar preview.
    for (const value of ['logo', 'bar']) {
      const diagram = byId(`export-composition-preview-${value}`);
      const geometry = root.RPI_LOGO_GEOMETRY;
      if (diagram && geometry && root.logoExportOptions) {
        const frame = root.logoExportOptions.viewport(geometry, value);
        diagram.setAttribute('viewBox', `${frame.x} ${frame.y} ${frame.width} ${frame.height}`);
        const paths = value === 'bar' ? [geometry.barPath] : [...Object.values(geometry.paths), geometry.barPath];
        diagram.innerHTML = paths.map(path => `<path d="${path}" fill="currentColor"/>`).join('');
      }
      byId(`export-composition-${value}`)?.addEventListener('change', event => {
        if (!event.target.checked || active) return;
        selectedComposition = value;
        sync(false);
      });
    }
    for (const value of ['large', 'standard']) {
      byId(`export-size-${value}`)?.addEventListener('change', event => {
        if (!event.target.checked || active) return;
        byId('export-size-select').value = value;
        sync(false);
      });
    }
    byId('export-size-select')?.addEventListener('change', () => sync(false));
    byId('export-cancel')?.addEventListener('click', () => {
      if (!active || active.controller.signal.aborted) return;
      text('export-message', 'Cancelling export…');
      byId('export-cancel').focus({ preventScroll: true });
      byId('export-cancel').setAttribute('aria-disabled', 'true');
      active.controller.abort();
    });
    const dismiss = event => {
      if (event.key !== 'Escape') return;
      const note = byId('export-blocked-note');
      if (note && !note.hidden) {
        event.preventDefault(); event.stopPropagation(); hideBlockedNote();
        return;
      }
      if (byId('save-menu')?.classList.contains('hidden')) return;
      event.preventDefault(); event.stopPropagation();
      if (typeof hideSaveMenu === 'function') hideSaveMenu();
      byId('save-button')?.focus();
    };
    byId('save-menu')?.addEventListener('keydown', dismiss);
    byId('save-button')?.addEventListener('keydown', dismiss);
    sync(false);
  }
  root.logoExportUI = { size, composition, sync, explainBlocked, begin, describe, report, message, ready, finish, isBusy: () => !!active };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
