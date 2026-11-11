// Editable model settings are separate from moving playback, matching the existing transport.
(function (root) {
  const configs = {
    well: { style: 'well-modes', name: 'Well Modes', keys: ['n1', 'n2', 'population'], phase: .15 },
    rabi: { style: 'rabi', name: 'Rabi', keys: ['detuning', 'span'], phase: .12 }
  };
  const state = {};
  let ready = false;
  const el = id => document.getElementById(id);
  const model = () => root.quantumStudyModel;
  const keyFor = (prefix, key) => prefix + key[0].toUpperCase() + key.slice(1);
  function values() {
    const result = {};
    for (const [prefix, config] of Object.entries(configs)) {
      const raw = Object.fromEntries([...config.keys, 'phase'].map(key => [keyFor(prefix, key), el(`${prefix}-${key}`)?.value]));
      Object.assign(result, model().normalize(config.style, raw), {
        [keyFor(prefix, 'speed')]: model().normalizeSpeed(el(`${prefix}-speed-slider`)?.value ?? 1),
        [keyFor(prefix, 'reverse')]: el(`${prefix}-reverse-toggle`)?.checked === true
      });
    }
    return result;
  }
  function settingPhase(prefix) {
    const current = model().normalizePhase(el(`${prefix}-phase`)?.value ?? configs[prefix].phase);
    if (!state[prefix] || current !== state[prefix].animated) {
      if (state[prefix]) state[prefix].chosen = current;
      return current;
    }
    return state[prefix].chosen;
  }
  function restoreSettingPhase() {
    for (const prefix of Object.keys(configs)) {
      if (!state[prefix]) continue;
      state[prefix].chosen = model().normalizePhase(el(`${prefix}-phase`).value);
      state[prefix].animated = null;
      state[prefix].last = null;
    }
  }
  function sync() {
    if (!ready) return;
    for (const [prefix, config] of Object.entries(configs)) {
      const normalized = values();
      for (const key of config.keys) el(`${prefix}-${key}`).value = normalized[keyFor(prefix, key)];
      el(`${config.style}-group`).style.display = el('style-select').value === config.style ? 'block' : 'none';
      for (const key of config.keys) {
        const input = el(`${prefix}-${key}`);
        const display = key === 'population' ? `${Math.round(Number(input.value) * 100)}%` : input.value;
        el(`${prefix}-${key}-display`).textContent = display;
        input.setAttribute('aria-valuetext', display);
      }
      const percent = (Number(el(`${prefix}-phase`).value) * 100).toFixed(1);
      el(`${prefix}-phase-display`).textContent = `${percent}%`;
      el(`${prefix}-phase`).setAttribute('aria-valuetext', `${percent} percent of ${prefix === 'well' ? 'relative-phase beat' : 'pulse-duration scan'}`);
      root.MotionSpeed.sync(config.style, el(`${prefix}-speed-slider`), el(`${prefix}-speed-slider-display`));
      root.ParameterControls?.refreshStyle(config.style);
    }
  }
  function pause() {
    for (const prefix of Object.keys(configs)) {
      el(`${prefix}-motion-toggle`).checked = false;
      if (state[prefix]) state[prefix].last = null;
    }
    sync();
  }
  function select() {
    for (const [prefix, config] of Object.entries(configs)) {
      if (el('style-select').value === config.style) {
        el(`${prefix}-motion-toggle`).checked = !root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      if (state[prefix]) state[prefix].last = null;
    }
    sync();
  }
  function readQuery() {
    const query = new URLSearchParams(root.location.search);
    for (const [prefix, config] of Object.entries(configs)) {
      const raw = Object.fromEntries([...config.keys, 'phase'].filter(key => query.has(keyFor(prefix, key))).map(key => [keyFor(prefix, key), query.get(keyFor(prefix, key))]));
      const normalized = model().normalize(config.style, raw);
      for (const key of [...config.keys, 'phase']) el(`${prefix}-${key}`).value = normalized[keyFor(prefix, key)];
      el(`${prefix}-speed-slider`).value = model().normalizeSpeed(query.get(`${prefix}Speed`) ?? 1);
      el(`${prefix}-reverse-toggle`).checked = query.get(`${prefix}Reverse`) === 'true';
    }
    restoreSettingPhase();
    sync();
  }
  function change(prefix, changedKey) {
    const config = configs[prefix];
    if (prefix === 'well' && ['n1', 'n2'].includes(changedKey)) {
      const other = changedKey === 'n1' ? 'n2' : 'n1';
      if (el(`well-${other}`).value === el(`well-${changedKey}`).value) {
        el(`well-${other}`).value = Number(el(`well-${changedKey}`).value) % 6 + 1;
        el('well-notice').textContent = `Modes must differ. Mode ${other === 'n1' ? 'A' : 'B'} changed to ${el(`well-${other}`).value}.`;
      }
    }
    const normalized = values();
    for (const key of [...config.keys, 'phase']) el(`${prefix}-${key}`).value = normalized[keyFor(prefix, key)];
    if (changedKey === 'phase') { state[prefix].chosen = Number(el(`${prefix}-phase`).value); state[prefix].animated = null; }
    state[prefix].last = null;
    sync(); root.updateUrlParameters(); root.requestUpdate();
  }
  function reset(style) {
    const prefix = style === 'well-modes' ? 'well' : 'rabi';
    for (const field of el(`${style}-group`).querySelectorAll('[data-url-parameter]')) {
      if (field.type === 'checkbox') field.checked = field.defaultChecked;
      else field.value = field.defaultValue;
    }
    restoreSettingPhase(); change(prefix, 'phase');
  }
  function randomize(style) {
    const prefix = style === 'well-modes' ? 'well' : 'rabi';
    const config = configs[prefix];
    for (const key of [...config.keys, 'phase']) {
      const input = el(`${prefix}-${key}`), step = key === 'phase' ? .001 : Number(input.step);
      const count = Math.round((Number(input.max) - Number(input.min)) / step);
      const current = Math.round((Number(input.value) - Number(input.min)) / step);
      const pick = Math.floor(Math.random() * count);
      const next = pick >= current ? pick + 1 : pick;
      input.value = Number((Number(input.min) + next * step).toFixed(3));
    }
    change(prefix, prefix === 'well' ? 'n1' : 'phase'); restoreSettingPhase();
  }
  function setup() {
    if (ready || !el('well-modes-group')) return;
    ready = true;
    for (const [prefix, config] of Object.entries(configs)) {
      state[prefix] = { last: null, chosen: config.phase, animated: null, pointers: new Set(), editors: [] };
      for (const key of [...config.keys, 'phase', 'speed-slider']) {
        const input = el(`${prefix}-${key}`), display = el(`${prefix}-${key}-display`);
        input.addEventListener('input', () => change(prefix, key));
        input.addEventListener('pointerdown', event => { state[prefix].pointers.add(event.pointerId); state[prefix].last = null; });
        const percent = key === 'phase' || key === 'population';
        const editor = { slider: input, display, refreshDisplay: sync,
          ...(key === 'speed-slider' ? root.MotionSpeed.editor(config.style, input) : {
            getEditorValue: () => String(Number(input.value) * (percent ? 100 : 1)),
            parseValue: value => {
              const n = root.parseSliderNumericInput(value);
              if (n === null) return null;
              const clamped = Math.max(Number(input.min), Math.min(Number(input.max), n / (percent ? 100 : 1)));
              const step = Number(input.step);
              return step > 0 ? Number((Math.round(clamped / step) * step).toFixed(3)) : clamped;
            }
          }), commit: () => change(prefix, key), ariaLabel: `Set ${config.name} ${key}${percent ? ' percent' : ''}` };
        state[prefix].editors.push(editor); root.registerSliderValueEditor(editor);
      }
      for (const suffix of ['motion-toggle', 'reverse-toggle']) el(`${prefix}-${suffix}`).addEventListener('change', () => change(prefix, suffix));
    }
    const finish = event => { for (const item of Object.values(state)) { item.pointers.delete(event.pointerId); item.last = null; } };
    root.addEventListener('pointerup', finish); root.addEventListener('pointercancel', finish);
    root.addEventListener('blur', () => { for (const item of Object.values(state)) { item.pointers.clear(); item.last = null; } });
    document.addEventListener('visibilitychange', () => { for (const item of Object.values(state)) item.last = null; });
    root.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) pause(); });
    el('style-select').addEventListener('change', select);
    readQuery(); select();
    if (root.matchMedia('(prefers-reduced-motion: reduce)').matches) pause();
  }
  function tick(timestamp, suspended) {
    if (!ready) return;
    let advanced = false;
    for (const [prefix, config] of Object.entries(configs)) {
      const item = state[prefix];
      const active = !suspended && !document.hidden && !item.pointers.size && !item.editors.some(editor => editor.editorInput)
        && el('style-select').value === config.style && el(`${prefix}-motion-toggle`).checked;
      if (!active) { item.last = null; continue; }
      if (item.last !== null) {
        settingPhase(prefix);
        el(`${prefix}-phase`).value = model().advancePhase(el(`${prefix}-phase`).value, timestamp - item.last,
          { speed: el(`${prefix}-speed-slider`).value, reverse: el(`${prefix}-reverse-toggle`).checked });
        item.animated = Number(el(`${prefix}-phase`).value);
        advanced = true;
      }
      item.last = timestamp;
    }
    if (advanced) sync();
  }
  root.quantumStudyControls = { setup, values, sync, tick, pause, select, reset, randomize, readQuery, settingPhase, restoreSettingPhase };
})(window);
