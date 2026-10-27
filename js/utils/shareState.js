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
    const triangleDirectionId = 'triangles-direction-select';
    const triangleDirections = manifest[triangleDirectionId] && manifest[triangleDirectionId].options;
    if (triangleDirections && triangleDirections.includes('up-left')) {
      // Omission identifies historical v1 state; fresh captures always include every native control.
      if (!Object.hasOwn(sourceControls, triangleDirectionId)) sourceControls[triangleDirectionId] = 'down-right';
      else if (sourceControls[triangleDirectionId] === 'up') sourceControls[triangleDirectionId] = 'up-right';
      else if (sourceControls[triangleDirectionId] === 'down') sourceControls[triangleDirectionId] = 'down-right';
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
        if (typeof raw !== 'string' || Array.from(raw).length > Math.min(spec.maxLength || MAX_TEXT_LENGTH, MAX_TEXT_LENGTH)) throw new Error('Text in this share link is too long.');
        controls[id] = raw;
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

  function prepareTrigger(root = document) {
    const existing = root.querySelector('#share-button');
    if (existing) return existing;
    const trigger = document.createElement('button');
    trigger.id = 'share-button';
    trigger.type = 'button';
    trigger.className = 'header_icon-button share_trigger';
    trigger.setAttribute('aria-label', 'Share bar');
    trigger.setAttribute('title', 'Share bar');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'share-popover');
    trigger.innerHTML = scope.FeatherIcons.getIconMarkup('share', 'header_icon');
    root.querySelector('.header-actions .save-section').after(trigger);
    trigger.addEventListener('click', () => {
      if (trigger.openShare) trigger.openShare();
      else trigger.dataset.pendingOpen = 'true';
    });
    return trigger;
  }

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
    brandTitle.title = name;
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
        maxLength: field.maxLength > 0 ? field.maxLength : MAX_TEXT_LENGTH,
        ...(field.tagName === 'SELECT' ? { options: Array.from(field.options).filter(option => field.id !== 'style-select' || !option.disabled).map(option => option.value) } : {})
      };
    }
    const defaultControls = Object.fromEntries(fields.map(field => [field.id, field.type === 'checkbox'
      ? field.defaultChecked : field.tagName === 'SELECT' ? (Array.from(field.options).find(option => option.defaultSelected) || field.options[0]).value : field.defaultValue]));
    defaultControls['style-select'] = 'solid';
    let restoring = false;
    let name = '';
    let loadError = '';
    const trigger = prepareTrigger();
    const section = document.createElement('section');
    section.id = 'share-popover';
    section.className = 'save-menu share_popover';
    section.hidden = true;
    section.dataset.shareUi = '';
    section.setAttribute('role', 'dialog');
    section.setAttribute('aria-label', 'Share bar');
    section.innerHTML = '<button id="share-copy" class="save-option share_copy" type="button"><span class="option-label" data-share-copy-label>Copy link</span><span class="share_menu-icon" data-share-copy-icon></span></button><label class="u-sr-only" for="share-name">Name (optional, up to 80 characters)</label><input id="share-name" class="control-input share_name" type="text" maxlength="160" placeholder="Name this bar"><div id="share-fallback" class="share_fallback" hidden><label for="share-url">Select and copy</label><textarea id="share-url" rows="2" readonly spellcheck="false"></textarea></div><p id="share-status" class="share_status" role="status" aria-live="polite"></p>';
    document.body.append(section);
    // A named bar is document context in the app header, never part of the official mark.
    const brandTitle = document.querySelector('.brand-title');
    const nameContext = prepareNameContext();
    const loadedName = nameContext.querySelector('#share-loaded-name');
    const baseDocumentTitle = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '4315'
      ? 'BAR-05 · Share Links · 4315' : document.title;
    const nameInput = section.querySelector('#share-name');
    const output = section.querySelector('#share-url');
    const fallback = section.querySelector('#share-fallback');
    const copyButton = section.querySelector('#share-copy');
    const copyLabel = section.querySelector('[data-share-copy-label]');
    const copyIcon = section.querySelector('[data-share-copy-icon]');
    const status = section.querySelector('#share-status');
    function updateNameContext() {
      loadedName.textContent = name;
      nameContext.hidden = !name;
      brandTitle.classList.toggle('has-document-name', !!name);
      brandTitle.title = name || '';
      document.title = name ? `${name} · ${baseDocumentTitle}` : baseDocumentTitle;
    }
    function resetCopyFeedback() {
      copyLabel.textContent = 'Copy link';
      copyIcon.innerHTML = scope.FeatherIcons.getIconMarkup('copy', 'share_menu-glyph');
      status.classList.remove('u-sr-only');
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
    function refresh() {
      try { output.value = buildLink(); status.textContent = loadError; copyButton.title = `${output.value.length.toLocaleString()} characters. Some messaging apps limit long links.`; }
      catch (error) { output.value = ''; status.textContent = error.message; }
    }
    function apply(snapshot) {
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
        nameInput.value = name;
        updateNameContext();
        bridge.restore(snapshot.runtime);
        for (const field of fields) {
          if (field.id === 'style-select' || field.id === 'color-mode-select') continue;
          field.dispatchEvent(new Event(field.type === 'range' || field.type === 'text' ? 'input' : 'change', { bubbles: true }));
        }
        bridge.refresh();

      } finally { restoring = false; }
    }
    function load() {
      loadError = '';
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
          name = ''; nameInput.value = ''; updateNameContext();
          restoring = false;
        }
        refresh();
      } catch (error) { restoring = false; loadError = error.message; setOpen(true, false); }
    }
    const controller = {
      capture, manifest, buildLink,
      syncUrl() {
        if (restoring) return true;
        loadError = '';
        if (!location.hash.startsWith(PREFIX)) return false;
        try { history.replaceState(history.state, '', buildLink()); } catch (error) { status.textContent = error.message; }
        return true;
      }
    };
    scope.barShareController = controller;
    nameInput.addEventListener('input', () => { name = safeText(sanitize(nameInput.value), MAX_NAME_LENGTH); nameInput.value = name; resetCopyFeedback(); updateNameContext(); controller.syncUrl(); refresh(); });
    function positionPopover() {
      if (section.hidden) return;
      const anchor = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport ? viewport.offsetLeft : 0;
      const top = viewport ? viewport.offsetTop : 0;
      const width = viewport ? viewport.width : innerWidth;
      const height = viewport ? viewport.height : innerHeight;
      section.style.maxHeight = `${Math.max(44, height - 16)}px`;
      section.style.left = `${Math.max(left + 8, Math.min(anchor.right - section.offsetWidth, left + width - section.offsetWidth - 8))}px`;
      section.style.top = `${Math.max(top + 8, Math.min(anchor.bottom + 8, top + height - section.offsetHeight - 8))}px`;
    }
    function setOpen(open, moveFocus = true) {
      section.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) {
        if (typeof scope.hideSaveMenu === 'function') scope.hideSaveMenu();
        fallback.hidden = true;
        resetCopyFeedback();
        refresh();
        positionPopover();
        if (moveFocus) copyButton.focus({preventScroll:true});
      } else if (moveFocus) trigger.focus({preventScroll:true});
    }
    trigger.openShare = () => setOpen(section.hidden);
    if (trigger.dataset.pendingOpen === 'true') {
      delete trigger.dataset.pendingOpen;
      trigger.openShare();
    }
    document.addEventListener('pointerdown', event => {
      if (!section.hidden && !section.contains(event.target) && !trigger.contains(event.target)) setOpen(false, false);
    });
    document.addEventListener('keydown', event => {
      if (!section.hidden && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    }, true);
    document.addEventListener('focusin', event => {
      if (!section.hidden && !section.contains(event.target) && event.target !== trigger) setOpen(false, false);
    });
    window.addEventListener('resize', positionPopover);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', positionPopover);
      window.visualViewport.addEventListener('scroll', positionPopover);
    }
    copyButton.addEventListener('click', async () => {
      loadError = '';
      refresh();
      if (!output.value) return;
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(output.value);
        copyLabel.textContent = 'Copied';
        copyIcon.innerHTML = scope.FeatherIcons.getIconMarkup('check', 'share_menu-glyph');
        status.classList.add('u-sr-only');
        status.textContent = 'Link copied.';
        fallback.hidden = true;
      } catch (_) {
        status.classList.remove('u-sr-only');
        fallback.hidden = false;
        positionPopover();
        output.focus(); output.select();
        status.textContent = 'Copy the selected link with your keyboard or touch menu.';
      }
    });
    document.getElementById('app-sidebar').addEventListener('input', event => { if (!event.target.closest('[data-share-ui]')) { controller.syncUrl(); if (!section.hidden) refresh(); } });
    document.getElementById('app-sidebar').addEventListener('change', event => { if (!event.target.closest('[data-share-ui]')) { controller.syncUrl(); if (!section.hidden) refresh(); } });
    window.addEventListener('popstate', load);
    window.addEventListener('hashchange', load);
    if (location.hash.startsWith(PREFIX)) load();
    resetCopyFeedback();
    updateNameContext();
    return controller;
  }

  const api = { VERSION, MAX_FRAGMENT_LENGTH, MAX_NAME_LENGTH, MAX_TEXT_LENGTH, normalizeState, normalizeRuntime, encodeState, decodeState, seededRandom, prepareTrigger, prepareNameContext, initialize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.BarShareState = api;
})(typeof window !== 'undefined' ? window : globalThis);
