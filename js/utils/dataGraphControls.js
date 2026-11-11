(function (scope) {
  const model = scope.DataGraph;
  const ids = { graphSource: 'graph-source', graphData: 'graph-data', graphData2: 'graph-data-2', graphData3: 'graph-data-3', graphData4: 'graph-data-4', graphData5: 'graph-data-5', graphMulti: 'graph-multi-toggle', graphVariant: 'graph-variant', graphDomain: 'graph-domain', graphWeight: 'graph-weight' };
  const field = key => document.getElementById(ids[key]);
  function values() { return model.normalize(Object.fromEntries(Object.keys(ids).map(key => [key, key === 'graphMulti' ? field(key)?.checked : field(key)?.value]))); }
  function sync() {
    const state = values(), resolved = model.resolve(state);
    const group = document.getElementById('graph-multi-inputs');
    if (group) group.hidden = !state.graphMulti;
    const status = document.getElementById('graph-status');
    const summary = document.getElementById('graph-summary');
    const source = document.getElementById('graph-source-note');
    if (status) status.textContent = resolved.error;
    model.keys.forEach((key, index) => field(key)?.setAttribute('aria-invalid', String(Boolean((!index || state.graphMulti && state[key].trim()) && model.parse(state[key]).error))));
    const fmt = number => Number(number.toPrecision(6)).toString();
    if (summary) summary.textContent = resolved.error ? 'No graph until the values are valid.'
      : `${resolved.series.length} series · ${resolved.series.map(series => series.length).join(' / ')} samples · Y ${fmt(resolved.min)} to ${fmt(resolved.max)}${resolved.constant ? ' (constant range expanded)' : ''}`;
    if (source) source.textContent = model.sourceDescription(state);
    const display = document.getElementById('graph-weight-display');
    if (display) display.textContent = state.graphWeight.toFixed(1);
    const domain = field('graphDomain');
    if (domain?.closest) domain.closest('.control').hidden = state.graphVariant === 'columns';
    const domainNote = document.getElementById('graph-domain-note');
    if (domainNote) domainNote.textContent = state.graphVariant === 'columns' ? 'Columns always include zero. Zero values have no height.' : 'All series share one vertical scale. Fit values can exaggerate small differences.';
  }
  function restore(values = {}) {
    const state = model.normalize(values);
    Object.keys(ids).forEach(key => { const element = field(key); if (!element) return; if (key === 'graphMulti') element.checked = state[key]; else element.value = state[key]; });
    sync();
  }
  function randomize() {
    // Only drawing controls vary. Never replace the user's data with invented samples.
    const state = values();
    const series = model.resolve({ ...state, graphVariant: 'line' }).series;
    const unequal = new Set(series.map(row => row.length)).size > 1;
    const variants = ['line', 'step', 'columns', 'dots'].filter(value => value !== state.graphVariant && !(unequal && value === 'columns'));
    restore({ ...state, graphVariant: variants[Math.floor(Math.random() * variants.length)], graphWeight: (5 + Math.floor(Math.random() * 16)) / 10 });
  }
  function bind(commit) {
    Object.keys(ids).forEach(key => {
      const element = field(key); if (!element) return;
      element.addEventListener(element.type === 'range' || element.type === 'text' ? 'input' : 'change', event => {
        if (key === 'graphSource') {
          const source = element.value;
          if (source === 'sine' || source === 'decay') restore({ ...values(), graphData: source === 'sine' ? model.DEFAULT_DATA : model.DECAY_DATA });
        } else if (model.keys.includes(key) && event.isTrusted) field('graphSource').value = 'custom';
        sync(); scope.syncAllCustomSelects?.(); commit();
      });
    });
    sync();
  }
  function writeQuery(params) { Object.entries(values()).forEach(([key, value]) => params.set(key, String(value))); }
  function exportBlocker() {
    if (document.getElementById('style-select')?.value !== 'graph') return '';
    return model.exportError(values());
  }
  scope.DataGraphControls = { values, sync, restore, reset: () => restore(), randomize, bind, writeQuery, exportBlocker };
})(window);
