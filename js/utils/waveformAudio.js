/* Shared audible/offline carrier graph. Pitch is a note; Hz are derived once. */
(function(root) {
  const notes = root.WaveformNotes || (typeof require === 'function' ? require('./waveformNotes') : null);
  const frequency = note => notes.get(note).frequencyHz;
  // AudioParam frequency values use 32-bit floats. Track the value the native
  // oscillator receives for phase-boundary scheduling, not the display decimal.
  const scheduledFrequency = note => Math.fround(frequency(note));
  // Finite Fourier representation of a bipolar pulse, with the mean removed.
  // Native PeriodicWave/OscillatorNode performs frequency-dependent band limiting.
  // The former naive +/-1 AudioWorklet pulse folded harmonics above Nyquist back
  // into the audible band. Do not reintroduce sample-threshold oscillators here.
  function pulseCoefficients(width, harmonics = 2048) {
    const duty = Math.max(.2, Math.min(.8, width));
    const real = new Float32Array(harmonics + 1), imag = new Float32Array(harmonics + 1);
    for (let k = 1; k <= harmonics; k++) {
      real[k] = 2 * Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
      imag[k] = 2 * (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
    }
    return {real, imag};
  }
  function create(context, destination, values) {
    const oscillators = {}, oscillatorGains = {};
    let currentWidth = null, currentNote = null, phaseOrigin = context.currentTime, phaseCycles = 0;
    // A short future start gives every node the same schedulable phase origin.
    const startTime = context.currentTime + .01;
    phaseOrigin = startTime;
    const pulseWaves = new Map();
    for (const type of ['sine', 'sawtooth', 'square', 'pulse', 'reversePulse']) {
      const osc = context.createOscillator(), gain = context.createGain();
      if (type !== 'pulse' && type !== 'reversePulse') osc.type = type;
      osc.frequency.setValueAtTime(frequency(notes.read(values)), startTime);
      gain.gain.setValueAtTime(0, startTime);
      osc.connect(gain); gain.connect(destination);
      oscillators[type] = osc; oscillatorGains[type] = gain;
    }
    function update(values) {
      const note = notes.read(values), type = Math.max(0, Math.min(3, Number(values.type) || 0));
      const time = context.currentTime;
      if (note !== currentNote) {
        // Discrete note selection, not an unintended 100ms chromatic pitch glide.
        // Oscillator phase remains continuous. The scope excludes transition
        // history before claiming a stationary whole-cycle window.
        if (currentNote !== null) phaseCycles = (phaseCycles + Math.max(0, time - phaseOrigin) * scheduledFrequency(currentNote)) % 1;
        phaseOrigin = Math.max(startTime, time);
        for (const osc of Object.values(oscillators)) {
          osc.frequency.cancelScheduledValues(time);
          osc.frequency.setValueAtTime(frequency(note), time);
        }
        currentNote = note;
      }
      const width = .2 + Math.max(0, type - 2) * .6;
      if (width !== currentWidth) {
        let waves = pulseWaves.get(width);
        if (waves) pulseWaves.delete(width);
        else {
          const { real, imag } = pulseCoefficients(width);
          // f(-t) preserves cosine coefficients and negates sine coefficients.
          waves = [context.createPeriodicWave(real, imag),
            context.createPeriodicWave(real, imag.map(coefficient => -coefficient))];
        }
        pulseWaves.set(width, waves);
        while (pulseWaves.size > 16) pulseWaves.delete(pulseWaves.keys().next().value);
        oscillators.pulse.setPeriodicWave(waves[0]);
        oscillators.reversePulse.setPeriodicWave(waves[1]);
        currentWidth = width;
      }
      // Native sine, sawtooth and square are odd about their common phase origin.
      // Ramp their signed gains and crossfade the asymmetric Pulse through the
      // same envelope so Reverse can change during playback without a hard cut.
      const reverse = values.reverse === true, direction = reverse ? -1 : 1;
      const gains = {
        sine: direction * Math.max(0, 1 - type),
        sawtooth: direction * Math.max(0, 1 - Math.abs(type - 1)),
        square: direction * Math.max(0, 1 - Math.abs(type - 2)),
        pulse: reverse ? 0 : Math.max(0, type - 2),
        reversePulse: reverse ? Math.max(0, type - 2) : 0
      };
      for (const [key, target] of Object.entries(gains)) {
        const gain = oscillatorGains[key].gain;
        if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(time);
        else { gain.cancelScheduledValues(time); gain.setValueAtTime(gain.value, time); }
        // Finite linear ramp reaches an exactly scheduled target; an exponential
        // setTargetAtTime tail would never become strictly stationary.
        gain.linearRampToValueAtTime(target * .1, time + .05);
      }
    }
    update(values);
    // One shared start time keeps the native carrier shapes phase-coherent.
    Object.values(oscillators).forEach(osc => osc.start(startTime));
    function nextCycleBoundary(earliest) {
      const hz = scheduledFrequency(currentNote), elapsed = phaseCycles + (earliest - phaseOrigin) * hz;
      return phaseOrigin + (Math.ceil(elapsed) - phaseCycles) / hz;
    }
    function fadeOutAt(stopTime) {
      // A quick restart reuses the app master gain. Fade this graph's own gains
      // too, so cancelling the shared master fade cannot revive the old voice.
      for (const gainNode of Object.values(oscillatorGains)) {
        const gain = gainNode.gain, now = context.currentTime;
        if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
        else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); }
        gain.linearRampToValueAtTime(0, stopTime);
      }
    }
    return {nextCycleBoundary, fadeOutAt, oscillators, oscillatorGains, pulseWorkletNode: null, update};
  }
  const api = {create, frequency, pulseCoefficients};
  root.WaveformAudio = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
