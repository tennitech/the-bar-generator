// Quantum-specific controls use the same switches and editable sliders as other motion bars.
(function (root) {
  let lastTimestamp = null;
  let initialized = false;
  let settingPhase = null;
  let lastAnimatedPhase = null;
  let phasePointerId = null;
  let phaseEditor = null;
  const el = id => document.getElementById(id);
  function values() {
    return { quantumPhase: root.quantumModel.normalizePhase(el('quantum-phase')?.value || 0) };
  }
  function restoreSettingPhase() {
    settingPhase = values().quantumPhase;
    lastAnimatedPhase = null;
  }
  function syncSettingPhase() {
    const phase = values().quantumPhase;
    // Moving model time is not an edit. Retain the chosen phase across ticks,
    // but recognize direct edits and restored snapshots before feedback reads.
    if (settingPhase === null || phase !== lastAnimatedPhase) settingPhase = phase;
    return settingPhase;
  }
  function updatePhaseLabel() {
    const percentage = (values().quantumPhase * 100).toFixed(1);
    el('quantum-phase-display').textContent = `${percentage}%`;
    el('quantum-phase').setAttribute('aria-valuetext', `${percentage} percent of recurrence`);
    root.ParameterControls?.refreshStyle('wave-quantum');
  }
  function sync() {
    if (!initialized) return;
    el('quantum-group').style.display = el('style-select').value === 'wave-quantum' ? 'block' : 'none';
    root.MotionSpeed.sync('wave-quantum', el('quantum-speed-slider'), el('quantum-speed-display'));
    updatePhaseLabel();
  }
  function pause() {
    el('quantum-motion-toggle').checked = false;
    lastTimestamp = null;
    sync();
  }
  function select() {
    el('quantum-motion-toggle').checked = !root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lastTimestamp = null;
    sync();
  }
  function setup() {
    if (initialized || !el('quantum-group')) return;
    initialized = true;
    const query = new URLSearchParams(root.location.search);
    el('quantum-phase').value = root.quantumModel.normalizePhase(query.get('quantumPhase') || 0);
    el('quantum-speed-slider').value = root.quantumModel.normalizeSpeed(query.has('quantumSpeed') ? query.get('quantumSpeed') : 1);
    el('quantum-reverse-toggle').checked = query.get('quantumReverse') === 'true';
    // Obsolete quantumView query/share fields are ignored; every snapshot uses projections.
    const commit = () => { root.updateUrlParameters(); root.requestUpdate(); };
    select(); // Default motion, with reduced-motion and shared-state overrides below.
    el('quantum-motion-toggle').addEventListener('change', () => {
      if (!el('quantum-motion-toggle').checked) {
        el('quantum-phase').value = 0;
        restoreSettingPhase();
      }
      lastTimestamp = null; sync(); commit();
    });
    el('quantum-reverse-toggle').addEventListener('change', () => { lastTimestamp = null; commit(); });
    el('quantum-speed-slider').addEventListener('input', () => { lastTimestamp = null; sync(); commit(); });
    // Seeking changes model time, not the user's explicit LOOP selection.
    const seek = () => { restoreSettingPhase(); lastTimestamp = null; sync(); commit(); };
    el('quantum-phase').addEventListener('input', seek);
    el('quantum-phase').addEventListener('pointerdown', event => {
      phasePointerId = event.pointerId;
      lastTimestamp = null;
    });
    const finishSeek = event => {
      if (phasePointerId !== event.pointerId) return;
      phasePointerId = null;
      lastTimestamp = null;
    };
    root.addEventListener('pointerup', finishSeek);
    root.addEventListener('pointercancel', finishSeek);
    root.addEventListener('blur', () => { phasePointerId = null; lastTimestamp = null; });
    root.registerSliderValueEditor({
      ...root.MotionSpeed.editor('wave-quantum', el('quantum-speed-slider')),
      slider: el('quantum-speed-slider'), display: el('quantum-speed-display'), refreshDisplay: sync,
      commit: () => { lastTimestamp = null; sync(); commit(); }, ariaLabel: 'Set Ring Wavefunction playback speed'
    });
    phaseEditor = {
      slider: el('quantum-phase'), display: el('quantum-phase-display'), refreshDisplay: sync,
      getEditorValue: () => (values().quantumPhase * 100).toFixed(1),
      parseValue: value => {
        const number = root.parseSliderNumericInput(value);
        return number === null ? null : Math.max(0, Math.min(100, number)) / 100;
      },
      commit: seek, ariaLabel: 'Set Ring Wavefunction phase percent'
    };
    root.registerSliderValueEditor(phaseEditor);
    el('style-select').addEventListener('change', () => {
      if (el('style-select').value === 'wave-quantum') select();
      else { lastTimestamp = null; sync(); }
    });
    root.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) pause(); });
    document.addEventListener('visibilitychange', () => { lastTimestamp = null; });
    sync();
  }
  function tick(timestamp, suspended) {
    if (!initialized) return;
    const seeking = phasePointerId !== null || Boolean(phaseEditor?.editorInput);
    const active = !suspended && !seeking && el('style-select').value === 'wave-quantum' && el('quantum-motion-toggle').checked;
    if (!active) { lastTimestamp = null; return; }
    if (lastTimestamp !== null) {
      syncSettingPhase();
      el('quantum-phase').value = root.quantumModel.advancePhase(values().quantumPhase, timestamp - lastTimestamp, {
        speed: el('quantum-speed-slider').value, reverse: el('quantum-reverse-toggle').checked
      });
      lastAnimatedPhase = values().quantumPhase;
      updatePhaseLabel();
    }
    lastTimestamp = timestamp;
  }
  root.quantumControls = { setup, sync, values, tick, pause, select, settingPhase: syncSettingPhase, restoreSettingPhase };
})(window);
