// Quantum-specific state bridge. The phase input is the complete deterministic snapshot.
(function (root) {
  let lastTimestamp = null;
  let initialized = false;
  let hasPlayed = false;
  const el = id => document.getElementById(id);
  function values() {
    return {
      quantumPhase: root.quantumModel.normalizePhase(el('quantum-phase')?.value || 0),
      quantumView: el('quantum-view')?.value === 'density' ? 'density' : 'projections'
    };
  }
  function sync() {
    if (!initialized) return;
    el('quantum-group').style.display = el('style-select').value === 'wave-quantum' ? 'block' : 'none';
    const playing = el('quantum-motion-toggle').checked;
    root.renderPreviewButton(el('quantum-play-btn'), 'motion', { active: playing });
    el('quantum-play-btn').setAttribute('aria-pressed', String(playing));
    el('quantum-motion-state').textContent = playing ? 'PLAYING' : (hasPlayed ? 'PAUSED' : 'STATIC');
    el('quantum-phase-display').textContent = `${(values().quantumPhase * 100).toFixed(1)}%`;
    el('quantum-phase').setAttribute('aria-valuetext', `${(values().quantumPhase * 100).toFixed(1)} percent of recurrence`);
    el('quantum-description').textContent = values().quantumView === 'density'
      ? 'Probability density |ψ|² of two interfering states on a ring. Height shows density, not particle paths.'
      : 'Three phase projections of one wavefunction on a ring. These curves are not particle paths or probabilities.';
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
    el('quantum-view').value = query.get('quantumView') === 'density' ? 'density' : 'projections';
    const commit = () => { root.updateUrlParameters(); root.requestUpdate(); };
    // Reload/share restore never auto-starts motion. User can explicitly play even with reduced motion.
    pause();
    el('quantum-play-btn').addEventListener('click', () => {
      const toggle = el('quantum-motion-toggle');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    });
    el('quantum-motion-toggle').addEventListener('change', () => {
      hasPlayed = hasPlayed || el('quantum-motion-toggle').checked;
      lastTimestamp = null;
      sync();
      commit();
    });
    el('quantum-phase').addEventListener('input', () => { hasPlayed = true; pause(); sync(); commit(); });
    el('quantum-view').addEventListener('change', () => { sync(); commit(); });
    el('style-select').addEventListener('change', () => { lastTimestamp = null; sync(); });
    root.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
      if (event.matches) pause();
    });
    document.addEventListener('visibilitychange', () => { lastTimestamp = null; });
    sync();
  }
  function tick(timestamp, suspended) {
    if (!initialized) return;
    const active = !suspended && el('style-select').value === 'wave-quantum' && el('quantum-motion-toggle').checked;
    if (!active) { lastTimestamp = null; return; }
    if (lastTimestamp !== null) {
      el('quantum-phase').value = root.quantumModel.advancePhase(values().quantumPhase, timestamp - lastTimestamp);
      // Update only the phase label here; no synthetic input events or URL churn per frame.
      const percentage = (values().quantumPhase * 100).toFixed(1);
      el('quantum-phase-display').textContent = `${percentage}%`;
      el('quantum-phase').setAttribute('aria-valuetext', `${percentage} percent of recurrence`);
    }
    lastTimestamp = timestamp;
  }
  root.quantumControls = { setup, sync, values, tick, pause };
})(window);
