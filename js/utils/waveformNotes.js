/* Note-domain authority. Keep display rounding OUT of every signal calculation. */
(function(root) {
  const MIN_NOTE = 24, MAX_NOTE = 84, DEFAULT_NOTE = 24, A4_HZ = 440;
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const C1_HZ = A4_HZ * 2 ** ((MIN_NOTE - 69) / 12);
  const REFERENCE_SECONDS = 1 / C1_HZ;
  function normalize(value) {
    const n = Number(value);
    return value === null || value === '' || !Number.isFinite(n) ? DEFAULT_NOTE
      : Math.max(MIN_NOTE, Math.min(MAX_NOTE, Math.round(n)));
  }
  // Twelve-tone equal temperament, scientific pitch notation (middle C = C4).
  // An octave is exactly a factor of two in the mathematical model. JS and
  // Web Audio necessarily evaluate the model with finite floating-point precision.
  const NOTES = Object.freeze(Array.from({length: MAX_NOTE - MIN_NOTE + 1}, (_, i) => {
    const midi = MIN_NOTE + i, frequencyHz = A4_HZ * 2 ** ((midi - 69) / 12);
    // Round the NUMBER OF CYCLES, never the frequency or period. A fixed C1
    // window only holds integer cycles for the octave Cs. Other semitones have
    // irrational frequency ratios; use the nearest whole-cycle window instead.
    const cycles = Math.max(1, Math.round(frequencyHz / C1_HZ));
    return Object.freeze({midi, name: NAMES[midi % 12] + (Math.floor(midi / 12) - 1),
      frequencyHz, periodSeconds: 1 / frequencyHz, cycles, seconds: cycles / frequencyHz});
  }));
  const get = value => NOTES[normalize(value) - MIN_NOTE];
  function parse(value) {
    const match = /^([A-G])([#b♯♭]?)([1-6])$/i.exec(String(value).trim());
    if (!match) return null;
    const pitch = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1].toUpperCase()];
    const midi = (Number(match[3]) + 1) * 12 + pitch + (['#','♯'].includes(match[2]) ? 1 : ['b','♭'].includes(match[2]) ? -1 : 0);
    return midi >= MIN_NOTE && midi <= MAX_NOTE ? midi : null;
  }
  function fromLegacy(value) {
    const n = Number(value);
    if (value === null || value === '' || !Number.isFinite(n)) return DEFAULT_NOTE;
    const hz = 32.70 + (Math.max(10, Math.min(100, n)) - 10) / 90 * (523.25 - 32.70);
    // Old controls were a linear 10–100 index, not Hz or MIDI. Migration is
    // intentionally a nearest-note approximation; fresh saves use waveformNote.
    return normalize(69 + 12 * Math.log2(hz / A4_HZ));
  }
  function read(values = {}) { return values.note !== undefined ? normalize(values.note) : fromLegacy(values.frequency); }
  const api = {MIN_NOTE, MAX_NOTE, DEFAULT_NOTE, A4_HZ, C1_HZ, REFERENCE_SECONDS, NOTES, normalize, get, parse, fromLegacy, read};
  root.WaveformNotes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
