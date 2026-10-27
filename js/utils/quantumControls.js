// Quantum-specific controls use the same switches and editable sliders as other motion bars.
(function (root) {
  let lastTimestamp = null;
  let initialized = false;
  const el = id => document.getElementById(id);
  function values() {
    return { quantumPhase: root.quantumModel.normalizePhase(el('quantum-phase')?.value || 0) };
  }
  function updatePhaseLabel() {
    const percentage = (values().quantumPhase * 100).toFixed(1);
    el('quantum-phase-display').textContent = `${percentage}%`;
    el('quantum-phase').setAttribute('aria-valuetext', `${percentage} percent of recurrence`);
  }
  function sync() {
    if (!initialized) return;
    el('quantum-group').style.display = el('style-select').value === 'wave-quantum' ? 'block' : 'none';
    el('quantum-speed-display').textContent = root.quantumModel.normalizeSpeed(el('quantum-speed-slider').value).toFixed(1);
    updatePhaseLabel();
  }
  function pause() {
    el('quantum-motion-toggle').checked = false;
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
    pause(); // Never auto-start shared/reloaded state, including with reduced motion.
    el('quantum-motion-toggle').addEventListener('change', () => { lastTimestamp = null; commit(); });
    el('quantum-reverse-toggle').addEventListener('change', () => { lastTimestamp = null; commit(); });
    el('quantum-speed-slider').addEventListener('input', () => { lastTimestamp = null; sync(); commit(); });
    el('quantum-phase').addEventListener('input', () => { pause(); commit(); });
    root.registerSliderValueEditor({
      slider: el('quantum-speed-slider'), display: el('quantum-speed-display'), refreshDisplay: sync,
      commit: () => { lastTimestamp = null; sync(); commit(); }, ariaLabel: 'Set quantum motion speed'
    });
    root.registerSliderValueEditor({
      slider: el('quantum-phase'), display: el('quantum-phase-display'), refreshDisplay: sync,
      getEditorValue: () => (values().quantumPhase * 100).toFixed(1),
      parseValue: value => {
        const number = root.parseSliderNumericInput(value);
        return number === null ? null : Math.max(0, Math.min(100, number)) / 100;
      },
      commit: () => { pause(); commit(); }, ariaLabel: 'Set quantum phase percent'
    });
    el('quantum-phase-display').addEventListener('click', pause);
    el('quantum-phase-display').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') pause(); });
    el('style-select').addEventListener('change', () => { lastTimestamp = null; sync(); });
    root.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) pause(); });
    document.addEventListener('visibilitychange', () => { lastTimestamp = null; });
    sync();
  }
  function tick(timestamp, suspended) {
    if (!initialized) return;
    const active = !suspended && el('style-select').value === 'wave-quantum' && el('quantum-motion-toggle').checked;
    if (!active) { lastTimestamp = null; return; }
    if (lastTimestamp !== null) {
      el('quantum-phase').value = root.quantumModel.advancePhase(values().quantumPhase, timestamp - lastTimestamp, {
        speed: el('quantum-speed-slider').value, reverse: el('quantum-reverse-toggle').checked
      });
      updatePhaseLabel();
    }
    lastTimestamp = timestamp;
  }
  root.quantumControls = { setup, sync, values, tick, pause };
})(window);
