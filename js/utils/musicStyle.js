(function (global) {
  const MUSIC_STAFF_POSITIONS = {
    'C4': 6, 'C#4': 6, 'D4': 5, 'D#4': 5,
    'E4': 4, 'F4': 3, 'F#4': 3, 'G4': 2, 'G#4': 2,
    'A4': 1, 'A#4': 1, 'B4': 0, 'C5': -1
  };

  const MUSIC_NOTE_SHAPES = new Set(['circle', 'square', 'diamond', 'triangle']);

  function normalizeMusicNoteShape(shape) {
    return MUSIC_NOTE_SHAPES.has(shape) ? shape : 'circle';
  }

  function getMusicHeadMetrics(lineSpacing, shape) {
    const normalizedShape = normalizeMusicNoteShape(shape);
    const unit = lineSpacing * 0.54;
    return {
      shape: normalizedShape,
      rx: unit,
      ry: unit
    };
  }

  function buildMusicBarRenderData(notesData, options) {
    const safeNotes = Array.isArray(notesData) ? notesData : [];
    const barStartX = options.barStartX;
    const exactBarWidth = options.exactBarWidth;
    const rectTop = options.rectTop || 0;
    const rectHeight = options.rectHeight;
    const noteShape = normalizeMusicNoteShape(options.noteShape || 'circle');

    const staffTop = rectTop + rectHeight * 0.18;
    const staffBottom = rectTop + rectHeight * 0.82;
    const lineSpacing = (staffBottom - staffTop) / 4;
    const step = lineSpacing / 2;
    const headMetrics = getMusicHeadMetrics(lineSpacing, noteShape);
    const { rx, ry } = headMetrics;
    const lineThickness = Math.max(0.7, rectHeight * 0.055);
    const noteInset = Math.max(rx, ry) + lineThickness;
    const noteTrackWidth = Math.max(1, exactBarWidth - noteInset * 2);

    const staffLines = [];
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * lineSpacing;
      staffLines.push({ x1: barStartX, y1: y, x2: barStartX + exactBarWidth, y2: y });
    }

    const notes = [];
    let cumulativeBeats = 0;
    for (let i = 0; i < safeNotes.length; i++) {
      const note = safeNotes[i];
      const pos = MUSIC_STAFF_POSITIONS[note.note] || 0;
      const noteX = barStartX + noteInset + noteTrackWidth * ((cumulativeBeats + note.duration / 2) / 16.0);
      const noteY = Math.max(rectTop + ry, Math.min(rectTop + rectHeight - ry, staffTop + 2 * lineSpacing + pos * step));

      notes.push({
        note,
        pos,
        noteX,
        noteY,
        rx,
        ry,
        noteShape: 'circle',
        headFill: true,
        ledgerLines: [],
        accidentalLines: [],
        stem: null,
        flags: []
      });

      cumulativeBeats += note.duration;
      if (cumulativeBeats >= 16) break;
    }

    return {
      lineThickness,
      staffTop,
      staffBottom,
      lineSpacing,
      staffLines,
      notes
    };
  }

  global.MUSIC_STAFF_POSITIONS = MUSIC_STAFF_POSITIONS;
  global.normalizeMusicNoteShape = normalizeMusicNoteShape;
  global.getMusicHeadMetrics = getMusicHeadMetrics;
  global.buildMusicBarRenderData = buildMusicBarRenderData;
})(window);
