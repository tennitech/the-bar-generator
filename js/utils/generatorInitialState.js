/* First-paint state shared by routed and direct generator entry points. */
(function (scope) {
  let pendingURLChecked = false;
  function resolvePendingURL(record, currentURL, navigationType) {
    if (navigationType !== 'reload' || !record || record.from !== currentURL || typeof record.to !== 'string') return null;
    try {
      const current = new URL(currentURL), target = new URL(record.to);
      if (target.origin !== current.origin || target.username || target.password
        || !scope.GeneratorRoutes.getGeneratorRouteStyleFromPathname(target.pathname)) return null;
      return target.href;
    } catch (_) { return null; }
  }
  function restorePendingURL() {
    if (pendingURLChecked) return;
    pendingURLChecked = true;
    try {
      const raw = scope.sessionStorage.getItem('rpi-pending-url');
      scope.sessionStorage.removeItem('rpi-pending-url');
      const target = resolvePendingURL(raw ? JSON.parse(raw) : null, scope.location.href,
        scope.performance.getEntriesByType('navigation')[0]?.type);
      if (target) {
        scope.history.replaceState(scope.history.state, '', target);
        scope.__RPI_GENERATOR_ROUTE_STYLE__ = scope.GeneratorRoutes.getGeneratorRouteStyleFromPathname(new URL(target).pathname);
      }
    } catch (_) { /* A blocked session store must not prevent startup. */ }
  }
  function isCompactLayoutViewport(viewportWidth, coarsePointer = false) {
    return Math.max(0, Math.round(viewportWidth || 0)) <= 900
      || (viewportWidth <= 1100 && coarsePointer);
  }
  function resolveTheme(search, style) {
    const theme = scope.themeModeUtils.normalizeColorModeValue(new URLSearchParams(search).get('colorMode'));
    return theme === 'lunar' && style !== 'lunar' ? 'black' : theme;
  }
  function resolveStyle() {
    return scope.GeneratorRoutes.normalizeStyleValue(scope.__RPI_GENERATOR_ROUTE_STYLE__ || scope.GeneratorRoutes.getGeneratorRouteStyleFromPathname(scope.location.pathname) || new URLSearchParams(scope.location.search).get('style') || 'solid');
  }
  function syncHeaderLayout(saveButton = document.getElementById('save-button'), saveButtonLabel = document.getElementById('save-button-label'), collapseBuffer = 96) {
    if (!saveButton || !saveButtonLabel) return;

    const appHeader = saveButton.closest('.app-header') || document.querySelector('.app-header');
    const headerActions = saveButton.closest('.header-actions');
    const headerBrand = appHeader ? appHeader.querySelector('.header-brand') : null;
    const brandTitle = appHeader ? appHeader.querySelector('.brand-title') : null;
    const lunarCounter = appHeader ? appHeader.querySelector('.lunar_counter') : null;

    saveButton.classList.remove('is-icon-only');

    const labelStyle = window.getComputedStyle(saveButtonLabel);
    const labelLineHeight = parseFloat(labelStyle.lineHeight);
    const labelWrapped = saveButtonLabel.getClientRects().length > 1 ||
      (Number.isFinite(labelLineHeight) && saveButtonLabel.offsetHeight > labelLineHeight * 1.35);
    const brandTitleStyle = brandTitle ? window.getComputedStyle(brandTitle) : null;
    const brandTitleLineHeight = brandTitleStyle ? parseFloat(brandTitleStyle.lineHeight) : NaN;
    const brandTitleWrapped = brandTitle ? (
      brandTitle.getClientRects().length > 1 ||
      (Number.isFinite(brandTitleLineHeight) && brandTitle.offsetHeight > brandTitleLineHeight * 1.35)
    ) : false;
    const brandTitleConstrained = brandTitle ? brandTitle.scrollWidth > brandTitle.clientWidth + 1 : false;
    const headerOverflow = appHeader ? appHeader.scrollWidth > appHeader.clientWidth + 1 : false;
    const actionsOverflow = headerActions ? headerActions.scrollWidth > headerActions.clientWidth + 1 : false;
    const brandRect = headerBrand ? headerBrand.getBoundingClientRect() : null;
    const actionsRect = headerActions ? headerActions.getBoundingClientRect() : null;
    const lunarCounterStyle = lunarCounter ? window.getComputedStyle(lunarCounter) : null;
    const lunarCounterIsVisible = lunarCounter && lunarCounterStyle && lunarCounterStyle.display !== 'none';
    const lunarCounterRect = lunarCounterIsVisible ? lunarCounter.getBoundingClientRect() : null;
    const inlineGaps = [];

    if (brandRect && actionsRect) inlineGaps.push(actionsRect.left - brandRect.right);
    if (lunarCounterRect && actionsRect) inlineGaps.push(actionsRect.left - lunarCounterRect.right);

    const smallestInlineGap = inlineGaps.length ? Math.min(...inlineGaps) : Infinity;
    const headerIsTight = smallestInlineGap < collapseBuffer;

    saveButton.classList.toggle(
      'is-icon-only',
      labelWrapped ||
      brandTitleWrapped ||
      brandTitleConstrained ||
      headerOverflow ||
      actionsOverflow ||
      headerIsTight
    );
  }

  function apply(root = document.body) {
    restorePendingURL();
    let style = resolveStyle();
    let theme = resolveTheme(scope.location.search, style);
    if (scope.GeneratorParameters && root.querySelector('#color-mode-select')) {
      const parameters = scope.GeneratorParameters.read();
      const countRatio = root.querySelector('#ticker-ratio-slider');
      if (countRatio) countRatio.value = parameters.tickerRatio;
      scope.applyTickerWidthRatioBounds?.(countRatio, root.querySelector('#ticker-width-ratio-slider'));
      root.querySelectorAll('[data-url-parameter]').forEach(field => {
        const value = parameters[field.dataset.urlParameter];
        if (value === undefined) return;
        if (field.type === 'checkbox') field.checked = value === true || value === 'true';
        else field.value = value;
      });
    }
    const phase = root.querySelector('#quantum-phase');
    const speed = root.querySelector('#quantum-speed-slider');
    const reverse = root.querySelector('#quantum-reverse-toggle');
    if (phase && scope.quantumModel) {
      const query = new URLSearchParams(scope.location.search);
      phase.value = scope.quantumModel.normalizePhase(query.get('quantumPhase') || 0);
      speed.value = scope.quantumModel.normalizeSpeed(query.has('quantumSpeed') ? query.get('quantumSpeed') : 1);
      reverse.checked = query.get('quantumReverse') === 'true';
    }
    // Validate the complete shared snapshot before using its startup theme.
    if (scope.BarShareState && root.querySelector('#color-mode-select') && scope.location.hash.startsWith('#bar=')) {
      const manifest = {};
      root.querySelectorAll('#app-sidebar input[id], #app-sidebar select[id]').forEach(field => {
        manifest[field.id] = {
          type: field.type, min: Number(field.min || 0), max: Number(field.max || 100), step: Number(field.step || 1),
          maxLength: field.maxLength > 0 ? field.maxLength : 4096,
          ...(field.tagName === 'SELECT' ? { options: Array.from(field.options).filter(option => field.id !== 'style-select' || !option.disabled).map(option => option.value) } : {})
        };
      });
      try {
        const state = scope.BarShareState.decodeState(scope.location.hash, manifest);
        if (state) {
          scope.BarShareState.prepareNameContext(root, scope.ProfanityFilter.sanitizeText(state.name));
          const countRatio = root.querySelector('#ticker-ratio-slider');
          if (countRatio && state.controls[countRatio.id] !== undefined) countRatio.value = state.controls[countRatio.id];
          scope.applyTickerWidthRatioBounds?.(countRatio, root.querySelector('#ticker-width-ratio-slider'));
          Object.entries(state.controls).forEach(([id, value]) => {
            const field = root.querySelector(`#${CSS.escape(id)}`);
            if (!field) return;
            if (field.type === 'checkbox') field.checked = value;
            else field.value = field.type === 'text' ? scope.ProfanityFilter.sanitizeText(value) : value;
          });
          const envelope = root.querySelector('#envelope-settings-group');
          if (envelope) envelope.style.display = root.querySelector('#waveform-envelope-toggle')?.checked ? '' : 'none';
          theme = state.controls['color-mode-select'] || 'black';
          style = state.controls['style-select'] || 'solid';
        }
      } catch (_) { /* Runtime provides the recovery UI for invalid snapshots. */ }
    }
    scope.NumericControls?.sync(root);
    if (phase && scope.quantumModel) {
      const phaseLabel = root.querySelector('#quantum-phase-display');
      const speedLabel = root.querySelector('#quantum-speed-display');
      phaseLabel.textContent = `${(scope.quantumModel.normalizePhase(phase.value) * 100).toFixed(1)}%`;
      speedLabel.textContent = scope.quantumModel.normalizeSpeed(speed.value).toFixed(1);
      root.querySelector('#quantum-motion-toggle').checked = false;
    }
    if (scope.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('input[id$="-motion-toggle"]').forEach(toggle => { toggle.checked = false; });
    }
    const envelope = root.querySelector('#envelope-settings-group');
    if (envelope) envelope.style.display = root.querySelector('#waveform-envelope-toggle')?.checked ? 'block' : 'none';
    const series = root.querySelector('#graph-multi-inputs');
    if (series) series.style.display = root.querySelector('#graph-multi-toggle')?.checked ? 'block' : 'none';
    scope.applyTickerWidthRatioBounds?.(root.querySelector('#ticker-ratio-slider'), root.querySelector('#ticker-width-ratio-slider'));
    root.querySelectorAll('[data-slider-value], #waveform-type-display, #lines-variant-display').forEach(display => {
      const field = root.querySelector(`#${CSS.escape(display.id.replace(/-display$/, '-slider'))}`)
        || root.querySelector(`#${CSS.escape(display.id.replace(/-display$/, ''))}`);
      if (!field || !field.dataset.urlParameter) return;
      let value = field.value;
      if (display.id === 'waveform-type-display') value = ['SINE', 'SAWTOOTH', 'SQUARE', 'PULSE'][Math.min(3, Math.max(0, Math.round(Number(value))))];
      else if (display.id === 'lines-variant-display') value = Number(value) === 1 ? 'LG' : 'MD';
      else if (display.id === 'ticker-ratio-display') value += ':1';
      else if (display.id === 'ticker-width-ratio-display') value = `1:${value}`;
      else if (/^(ruler|ticker|waveform)-speed-display$/.test(display.id)) value = Number(value).toFixed(1);
      display.textContent = value;
    });
    for (const target of new Set([document.documentElement, document.body, root])) {
      if (!target) continue;
      target.classList.remove(...scope.themeModeUtils.AVAILABLE_COLOR_MODES.map(mode => `theme-${mode}`));
      target.classList.add(`theme-${theme}`);
    }
    const themeSelect = root.querySelector('#color-mode-select');
    const styleSelect = root.querySelector('#style-select');
    if (themeSelect) themeSelect.value = theme;
    if (styleSelect) styleSelect.value = style;
    const lunarOption = themeSelect && themeSelect.querySelector('option[value="lunar"]');
    if (lunarOption) { lunarOption.hidden = style !== 'lunar'; lunarOption.disabled = style !== 'lunar'; }
    const groupId = style === 'wave-quantum' ? 'quantum-group' : `${style}-group`;
    const group = root.querySelector(`#${CSS.escape(groupId)}`);
    if (group) group.style.display = '';
    const compact = isCompactLayoutViewport(scope.innerWidth, scope.matchMedia('(pointer: coarse)').matches);
    const sidebar = root.querySelector('#app-sidebar');
    const toggle = root.querySelector('#mobile-menu-toggle');
    if (sidebar) { sidebar.inert = compact; sidebar.setAttribute('aria-hidden', String(compact)); }
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!compact));
      toggle.setAttribute('aria-label', compact ? 'Open design controls' : 'Close design controls');
    }
    const saveLabel = root.querySelector('#save-button-label');
    if (saveLabel && theme === 'lunar') saveLabel.textContent = 'Learn About RPI x Artemis';
    if (root.isConnected) syncHeaderLayout();
    return theme;
  }
  const api = { resolvePendingURL, resolveTheme, apply, syncHeaderLayout, isCompactLayoutViewport };
  scope.GeneratorInitialState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
