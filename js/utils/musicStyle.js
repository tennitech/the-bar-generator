/* One chromatic score model for the composer, audio, preview and exports. */
(function (global) {
  const pitches = Object.freeze(['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']);
  const durations = Object.freeze([0.25, 0.5, 1, 2]);
  const shapes = new Set(['circle', 'square', 'diamond', 'triangle']);
  const presets = Object.freeze({
    rise: 'C4_1,D4_1,E4_1,G4_1,A4_2,G4_1,E4_1,F4_1,A4_1,C5_2,B4_1,G4_1,E4_1,C4_1',
    arpeggio: 'C4_0.5,E4_0.5,G4_0.5,C5_0.5,G4_1,E4_1,D4_0.5,F4_0.5,A4_0.5,C5_0.5,A4_1,F4_1',
    syncopation: 'C4_0.5,rest_0.5,G4_1,C5_0.25,B4_0.25,A4_0.5,rest_1,F4_0.5,F#4_0.5,G4_1,D#4_1,C4_2'
  });
  function normalizeNotes(input) {
    const source = typeof input === 'string' ? input.slice(0, 1024).split(',').map(item => {
      const [note, duration] = item.split('_'); return { note, duration: Number(duration) };
    }) : Array.isArray(input) ? input : [];
    const result = []; let beats = 0;
    for (const item of source.slice(0, 64)) {
      if (!item || (!pitches.includes(item.note) && item.note !== 'rest') || !durations.includes(item.duration)) continue;
      if (beats + item.duration > 16) break;
      result.push({ note: item.note, duration: item.duration }); beats += item.duration;
    }
    return result;
  }
  const serialize = input => normalizeNotes(input).map(item => `${item.note}_${item.duration}`).join(',');
  const totalBeats = input => normalizeNotes(input).reduce((sum, item) => sum + item.duration, 0);
  const frequency = note => pitches.includes(note) ? 440 * Math.pow(2, (pitches.indexOf(note) - 9) / 12) : 0;
  const normalizeMusicNoteShape = shape => shapes.has(shape) ? shape : 'square';
  function buildMusicBarRenderData(input, options = {}) {
    const score = normalizeNotes(input), beats = totalBeats(score);
    const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const left = finite(options.barStartX, 0), top = finite(options.rectTop, 0);
    const width = Math.max(0, finite(options.exactBarWidth, 500)), height = Math.max(0, finite(options.rectHeight, 36));
    const lane = height / 13, thickness = lane * 0.82;
    const shape = normalizeMusicNoteShape(options.noteShape);
    let position = 0;
    const notes = [];
    for (const item of score) {
      const x = left + width * position / beats, w = width * item.duration / beats;
      position += item.duration;
      if (item.note === 'rest') continue;
      const y = top + (12 - pitches.indexOf(item.note)) * lane + (lane - thickness) / 2;
      let points;
      if (shape === 'diamond') points = [[x, y + thickness / 2], [x + w / 2, y], [x + w, y + thickness / 2], [x + w / 2, y + thickness]];
      else if (shape === 'triangle') points = [[x, y + thickness], [x + w / 2, y], [x + w, y + thickness]];
      else if (shape === 'circle') {
        // Capsule ends retain exact onset/end bounds. Shared polygon avoids renderer drift.
        const radius = Math.min(thickness / 2, w / 2); points = [];
        for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; points.push([x + w - radius + radius * Math.cos(a), y + thickness / 2 + thickness / 2 * Math.sin(a)]); }
        for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 + Math.PI * i / 12; points.push([x + radius + radius * Math.cos(a), y + thickness / 2 + thickness / 2 * Math.sin(a)]); }
      } else points = [[x, y], [x + w, y], [x + w, y + thickness], [x, y + thickness]];
      points = points.map(([px, py]) => [Math.max(x, Math.min(x + w, px)), Math.max(y, Math.min(y + thickness, py))]);
      notes.push({ note: item, x, y, width: w, height: thickness, points });
    }
    return { notes, totalBeats: beats, laneHeight: lane };
  }
  function syncComposer(root, input, duration = 1) {
    const score = normalizeNotes(input), field = root.getElementById('staff-notes-input');
    if (field) field.value = serialize(score);
    const list = root.getElementById('music-sequence');
    if (list && list.dataset.score !== serialize(score)) {
      list.dataset.score = serialize(score);
      list.replaceChildren();
      score.forEach((item, index) => {
        const button = root.createElement('button'); button.type = 'button'; button.className = 'music_note';
        button.dataset.musicRemove = index;
        button.textContent = `${item.note === 'rest' ? 'Rest' : item.note.replace('#', '♯')} · ${item.duration}`;
        button.setAttribute('aria-label', `Remove event ${index + 1}: ${item.note.replace('#', ' sharp ')}, ${item.duration} quarter-note beats`);
        list.appendChild(button);
      });
    }
    const status = root.getElementById('music-status');
    const summary = score.length ? `${score.length} events · ${totalBeats(score)} / 16 beats. Select an event to remove it.` : 'Empty phrase. Add a note or choose a phrase.';
    if (status && status.textContent !== summary) status.textContent = summary;
    root.querySelectorAll('#staff-duration-selector [data-duration]').forEach(button => {
      const active = Number(button.dataset.duration) === duration;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    const preset = root.getElementById('music-preset');
    if (preset) preset.value = Object.keys(presets).find(key => presets[key] === serialize(score)) || 'custom';
    const clear = root.getElementById('staff-clear-btn'); if (clear) clear.disabled = !score.length;
  }
  const api = { pitches, durations, presets, normalizeNotes, serialize, totalBeats, frequency, syncComposer, buildMusicBarRenderData, normalizeMusicNoteShape };
  global.MusicStyle = api;
  global.normalizeMusicNoteShape = normalizeMusicNoteShape;
  global.buildMusicBarRenderData = buildMusicBarRenderData;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
