/* Stable, versioned client-only snapshots. UMD matches the generator's unbundled scripts. */
(function (scope) {
  const VERSION = 1;
  const MAX_FRAGMENT_LENGTH = 24000;
  const MAX_NAME_LENGTH = 80;
  const MAX_TEXT_LENGTH = 4096;
  const PREFIX = '#bar=';
  const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const safeText = (value, limit) => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '')).slice(0, limit).join('');

  function normalizeRuntime(value) {
    const data = isRecord(value) ? value : {};
    const bounded = (key, fallback, max) => Number.isFinite(data[key]) && data[key] >= 0 && data[key] <= max ? data[key] : fallback;
    const notes = Array.isArray(data.notes) ? data.notes.slice(0, 64).filter(note => isRecord(note)
      && /^[A-G](?:#|b)?[0-8]$/.test(note.note) && [0.25, 0.5, 1, 2].includes(note.duration))
      .map(note => ({ note: note.note, duration: note.duration })) : [];
    let duration = 0;
    const boundedNotes = notes.filter(note => { duration += note.duration; return duration <= 16; });
    return {
      seed: Math.floor(bounded('seed', 1, 4294967295)),
      phase: bounded('phase', 0, 1),
      ...(Number.isFinite(data.lfoPhase) ? { lfoPhase: bounded('lfoPhase', 0, 1) } : {}),
      time: bounded('time', 0, 1e9),
      duration: [0.25, 0.5, 1, 2].includes(data.duration) ? data.duration : 1,
      notes: boundedNotes
    };
  }

  function normalizeState(value, manifest) {
    if (!isRecord(value) || value.v !== VERSION) throw new Error('This share link uses an unsupported version.');
    if (!isRecord(value.controls)) throw new Error('This share link has no valid controls.');
    const sourceControls = scope.loopingGifUtils && typeof scope.loopingGifUtils.normalizeMotionSpeedControls === 'function'
      ? scope.loopingGifUtils.normalizeMotionSpeedControls(value.controls)
      : { ...value.controls };
    if (manifest['triangle-grid-rows']) {
      const variant = Number(sourceControls['triangle-grid-variant-slider'] || 2);
      const defaults = { rows: variant + 1, density: 100, stroke: 100, stagger: 50 };
      for (const [key, value] of Object.entries(defaults)) {
        const id = `triangle-grid-${key}`;
        if (!Object.hasOwn(sourceControls, id)) sourceControls[id] = String(value);
      }
    }
    // The old division slider offered sixths. Restore them as eighths only
    // for its known legacy values; malformed snapshots still fail validation.
    if (manifest['ruler-divisions-select'] && Object.hasOwn(sourceControls, 'ruler-units-slider')) {
      const legacy = sourceControls['ruler-units-slider'];
      if (!['2', '4', '6', '8', '10'].includes(legacy)) throw new Error('This share link has invalid ruler divisions.');
      if (!Object.hasOwn(sourceControls, 'ruler-divisions-select')) {
        sourceControls['ruler-divisions-select'] = legacy === '6' ? '8' : legacy;
      }
      delete sourceControls['ruler-units-slider'];
    }
    // Old gradient shares contain only the preset; restore that preset's
    // authored values instead of applying Reference-row defaults to every one.
    if (manifest['circles-gradient-columns']) {
      const variant = String(sourceControls['circles-gradient-variant-slider'] || '1');
      const defaults = { columns: variant === '1' ? 29 : variant === '2' ? 24 : 28,
        rows: variant === '2' ? 2 : 3, size: 100, contrast: 100, stagger: variant === '1' ? 100 : 0, reverse: false };
      for (const [key, value] of Object.entries(defaults)) {
        const id = `circles-gradient-${key}`;
        if (!Object.hasOwn(sourceControls, id)) sourceControls[id] = key === 'reverse' ? value : String(value);
      }
    }
    // Older encoded-text shares allowed 100 code points. Migrate these fields.
    for (const id of ['binary-input', 'morse-input']) {
      if (manifest[id]?.maxLength === 10 && typeof sourceControls[id] === 'string') {
        if (Array.from(sourceControls[id]).length > 100) throw new Error('Text in this share link is too long.');
        sourceControls[id] = safeText(sourceControls[id], 10);
      }
    }
    if (scope.NumericControls && manifest['numeric-source-select']) {
      if (!Object.hasOwn(sourceControls, 'numeric-source-select')) {
        const migrated = scope.NumericControls.migrate(sourceControls['numeric-input']);
        sourceControls['numeric-source-select'] = migrated.numericSource;
        sourceControls['numeric-formula-select'] = migrated.numericFormula;
        sourceControls['numeric-input'] = migrated.numericValue;
      }
      if (sourceControls['numeric-input'] !== undefined && !scope.NumericControls.isDraft(sourceControls['numeric-input'])) throw new Error('This share link has an invalid numeric value.');
    }
    const triangleDirectionId = 'triangles-direction-select';
    const triangleDirections = manifest[triangleDirectionId] && manifest[triangleDirectionId].options;
    if (triangleDirections && triangleDirections.includes('up-left')) {
      // Omission identifies historical v1 state; fresh captures always include every native control.
      if (!Object.hasOwn(sourceControls, triangleDirectionId)) sourceControls[triangleDirectionId] = 'down-right';
      else if (sourceControls[triangleDirectionId] === 'up') sourceControls[triangleDirectionId] = 'up-right';
      else if (sourceControls[triangleDirectionId] === 'down') sourceControls[triangleDirectionId] = 'down-right';
    }
    // Variant 2 is the opposite corner of variant 1. Fold it into direction
    // only when the current shell no longer exposes the historical control.
    if (triangleDirections && !manifest['triangles-variant-slider']) {
      const legacyVariant = sourceControls['triangles-variant-slider'];
      if (legacyVariant !== undefined && !['1', '2'].includes(legacyVariant)) throw new Error('This share link has an invalid triangle variant.');
      if (legacyVariant === '2') {
        sourceControls[triangleDirectionId] = { 'down-right': 'up-left', 'up-left': 'down-right', 'up-right': 'down-left', 'down-left': 'up-right' }[sourceControls[triangleDirectionId]] || sourceControls[triangleDirectionId];
      }
      delete sourceControls['triangles-variant-slider'];
    }
    const controls = {};
    for (const id of Object.keys(manifest).sort()) {
      if (!Object.hasOwn(sourceControls, id)) continue;
      const spec = id === 'ticker-width-ratio-slider' && typeof scope.getTickerWidthRatioMax === 'function'
        ? { ...manifest[id], max: scope.getTickerWidthRatioMax(sourceControls['ticker-ratio-slider']) }
        : manifest[id];
      const raw = sourceControls[id];
      if (spec.type === 'checkbox') {
        if (typeof raw !== 'boolean') throw new Error('This share link has an invalid toggle.');
        controls[id] = raw;
      } else if (spec.options) {
        if (typeof raw !== 'string' || !spec.options.includes(raw)) throw new Error('This share link has an unavailable option.');
        controls[id] = raw;
      } else if (spec.type === 'range' || spec.type === 'number') {
        const number = typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
        if (!Number.isFinite(number) || number < spec.min || number > spec.max) throw new Error('This share link has an out-of-range control.');
        if (spec.step && Math.abs((number - spec.min) / spec.step - Math.round((number - spec.min) / spec.step)) > 1e-6) throw new Error('This share link has an invalid control step.');
        controls[id] = String(number);
      } else {
        const limit = id === 'nucleotide-input' ? MAX_TEXT_LENGTH : Math.min(spec.maxLength || MAX_TEXT_LENGTH, MAX_TEXT_LENGTH);
        if (typeof raw !== 'string' || Array.from(raw).length > limit) throw new Error('Text in this share link is too long.');
        controls[id] = id === 'nucleotide-input' ? raw.toUpperCase().replace(/[^ATCGU]/g, '').slice(0, 50) : raw;
      }
    }
    if (controls['color-mode-select'] === 'lunar' && controls['style-select'] !== 'lunar') throw new Error('This share link uses a theme unavailable for this bar.');
    return { v: VERSION, name: safeText(value.name, MAX_NAME_LENGTH), controls, runtime: normalizeRuntime(value.runtime) };
  }

  function encodeState(value, manifest) {
    const state = normalizeState(value, manifest);
    const bytes = new TextEncoder().encode(JSON.stringify(state));
    const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (encoded.length + PREFIX.length > MAX_FRAGMENT_LENGTH) throw new Error('This configuration is too large for a share link. Shorten its text and try again.');
    return PREFIX + encoded;
  }

  function decodeState(fragment, manifest) {
    if (!fragment.startsWith(PREFIX)) return null;
    if (fragment.length > MAX_FRAGMENT_LENGTH) throw new Error('This share link is too long.');
    try {
      const encoded = fragment.slice(PREFIX.length);
      if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('encoding');
      const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
      return normalizeState(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)), manifest);
    } catch (error) {
      if (/share link|Text in/.test(error.message)) throw error;
      throw new Error('This share link is malformed. Use the controls to start again.');
    }
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value + 0x6D2B79F5) >>> 0;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Retained as a no-op for cached route shells. Public share links are paused.
  function prepareTrigger() { return null; }

  function prepareNameContext(root = document, name = '') {
    let nameContext = root.querySelector('.share_document-context');
    if (!nameContext) {
      nameContext = document.createElement('span');
      nameContext.className = 'share_document-context';
      nameContext.hidden = true;
      const separator = document.createElement('span');
      separator.textContent = ' / ';
      separator.setAttribute('aria-hidden', 'true');
      const loadedName = document.createElement('span');
      loadedName.id = 'share-loaded-name';
      nameContext.append(separator, loadedName);
      const brandTitle = root.querySelector('.brand-title');
      brandTitle.append(nameContext);
    }
    const loadedName = nameContext.querySelector('#share-loaded-name');
    loadedName.textContent = name;
    nameContext.hidden = !name;
    const brandTitle = root.querySelector('.brand-title');
    brandTitle.classList.toggle('has-document-name', !!name);
    brandTitle.title = [name, brandTitle.dataset.actionTitle].filter(Boolean).join(' · ');
    return nameContext;
  }

  function initialize(bridge) {
    const fields = Array.from(document.querySelectorAll('#app-sidebar input[id], #app-sidebar select[id]'))
      .filter(field => !field.closest('[data-share-ui]'));
    const manifest = {};
    for (const field of fields) {
      manifest[field.id] = {
        type: field.type,
        min: Number(field.min || 0), max: Number(field.max || 100), step: Number(field.step || 1),
        maxLength: field.id === 'nucleotide-input' ? 50 : Number(field.dataset.maxCodePoints) || (field.maxLength > 0 ? field.maxLength : MAX_TEXT_LENGTH),
        ...(field.tagName === 'SELECT' ? { options: Array.from(field.options).filter(option => field.id !== 'style-select' || !option.disabled).map(option => option.value) } : {})
      };
    }
    const defaultControls = Object.fromEntries(fields.map(field => [field.id, field.type === 'checkbox'
      ? field.defaultChecked : field.tagName === 'SELECT' ? (Array.from(field.options).find(option => option.defaultSelected) || field.options[0]).value : field.defaultValue]));
    defaultControls['style-select'] = 'solid';
    let restoring = false;
    let name = '';
    // Existing snapshots still restore their document title. There is no Share
    // trigger, naming field, link-copy action or popover in the current UI.
    const brandTitle = document.querySelector('.brand-title');
    const nameContext = prepareNameContext();
    const loadedName = nameContext.querySelector('#share-loaded-name');
    const baseDocumentTitle = document.title;
    function updateNameContext() {
      loadedName.textContent = name;
      nameContext.hidden = !name;
      brandTitle.classList.toggle('has-document-name', !!name);
      brandTitle.title = [name, brandTitle.dataset.actionTitle].filter(Boolean).join(' · ');
      document.title = name ? `${name} · ${baseDocumentTitle}` : baseDocumentTitle;
    }
    const sanitize = value => bridge.sanitize ? bridge.sanitize(value) : value;
    const capture = () => ({ v: VERSION, name: sanitize(name), controls: Object.fromEntries(fields.map(field => [field.id,
      field.type === 'checkbox' ? field.checked : (field.type === 'text' ? sanitize(field.value) : field.value)])), runtime: bridge.capture() });
    function buildLink() {
      const snapshot = capture();
      const url = new URL(location.href);
      url.pathname = scope.GeneratorRoutes.buildGeneratorPath(snapshot.controls['style-select'], location.pathname);
      url.search = '';
      url.hash = encodeState(snapshot, manifest);
      return url.href;
    }
    function apply(snapshot, options = {}) {
      restoring = true;
      try {
        const values = { ...defaultControls, ...snapshot.controls };
        const countRatio = document.getElementById('ticker-ratio-slider');
        const widthRatio = document.getElementById('ticker-width-ratio-slider');
        if (countRatio) countRatio.value = values[countRatio.id];
        scope.applyTickerWidthRatioBounds?.(countRatio, widthRatio);
        for (const field of fields) {
          if (field.type === 'checkbox') field.checked = values[field.id];
          else field.value = field.type === 'text' ? sanitize(values[field.id]) : values[field.id];
        }
        name = sanitize(snapshot.name);
        updateNameContext();
        bridge.restore(snapshot.runtime, options);
        for (const field of fields) {
          if (field.id === 'style-select' || field.id === 'color-mode-select') continue;
          field.dispatchEvent(new Event(field.type === 'range' || field.type === 'text' ? 'input' : 'change', { bubbles: true }));
        }
        bridge.refresh();

      } finally { restoring = false; }
    }
    function load() {
      try {
        const snapshot = decodeState(location.hash, manifest);
        if (snapshot) apply(snapshot);
        else {
          restoring = true;
          for (const field of fields) {
            if (field.type === 'checkbox') field.checked = defaultControls[field.id];
            else field.value = defaultControls[field.id];
          }
          bridge.legacy();
          name = ''; updateNameContext();
          restoring = false;
        }
      } catch (error) { restoring = false; scope.Toast?.show(error.message, 'error'); }
    }
    const controller = {
      capture, manifest, buildLink, getName: () => name,
      restoreLocal(snapshot) {
        // The same validation and renderer bridge as historical snapshots,
        // without writing a share fragment or creating persistent storage.
        apply(normalizeState(snapshot, manifest), { local: true });
      },
      isRestoring: () => restoring,
      syncUrl() {
        if (restoring) return true;
        if (!location.hash.startsWith(PREFIX)) return false;
        try {
          if (scope.URLState) scope.URLState.replace(buildLink());
          else history.replaceState(history.state, '', buildLink());
        } catch (error) { scope.Toast?.show(error.message, 'error'); }
        return true;
      }
    };
    scope.barShareController = controller;
    document.getElementById('app-sidebar').addEventListener('input', () => controller.syncUrl());
    document.getElementById('app-sidebar').addEventListener('change', () => controller.syncUrl());
    window.addEventListener('popstate', load);
    window.addEventListener('hashchange', load);
    if (location.hash.startsWith(PREFIX)) load();
    updateNameContext();
    return controller;
  }

  const api = { VERSION, MAX_FRAGMENT_LENGTH, MAX_NAME_LENGTH, MAX_TEXT_LENGTH, normalizeState, normalizeRuntime, encodeState, decodeState, seededRandom, prepareTrigger, prepareNameContext, initialize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.BarShareState = api;
})(typeof window !== 'undefined' ? window : globalThis);
