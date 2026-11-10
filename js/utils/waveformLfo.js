/* Shared waveform amplitude modulation for audio and the generator bar. */
(function (scope) {
  const RAMP_SECONDS = 0.015;
  function bounded(value, fallback, min, max) {
    const number = value === null || value === '' ? NaN : Number(value);
    return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
  }
  function normalize(values = {}) {
    return { enabled: values.enabled === true || values.enabled === 'true',
      rate: Math.round(bounded(values.rate, 2, 0.07, 1300) * 100) / 100, depth: bounded(values.depth, 60, 0, 100), type: Math.round(bounded(values.type, 0, 0, 3) * 100) / 100 };
  }
  const waveNames = ['SINE', 'SAWTOOTH', 'SQUARE', 'PULSE'];
  const ratePosition = rate => Math.log(normalize({ rate }).rate / 0.07) / Math.log(1300 / 0.07);
  const positionRate = position => normalize({ rate: 0.07 * (1300 / 0.07) ** bounded(position, 0, 0, 1) }).rate;
  function wave(phase, type) {
    const p = ((phase + 0.25) % 1 + 1) % 1;
    const sine = (Math.sin(2 * Math.PI * phase) + 1) / 2;
    const square = p > 0.5 ? 1 : 0, pulse = p > 0.8 ? 1 : 0;
    return type < 1 ? sine + (p - sine) * type : type < 2 ? p + (square - p) * (type - 1) : square + (pulse - square) * (type - 2);
  }
  function mean(type) { return type <= 2 ? 0.5 : 0.5 - 0.3 * (type - 2); }
  // Above 6 Hz fade towards the cycle mean, reaching it at 10 Hz. At low
  // cadence use an even lower limit (six samples/cycle). Never sample a fast
  // oscillator into a slower flashing beat. Audio always keeps the full rate.
  function visualAmplitude(state, type = 0, frameSeconds = 1 / 60) {
    const limit = Math.min(10, 1 / Math.max(1 / 60, frameSeconds) / 6);
    const mix = Math.min(1, Math.max(0, (state.rate - limit * 0.6) / (limit * 0.4)));
    return state.amplitude * (1 - mix) + (1 - state.amount + state.amount * mean(type)) * mix;
  }
  function amplitude(time, values) {
    const state = normalize(values);
    const depth = state.enabled ? state.depth / 100 : 0;
    return 1 - depth + depth * wave(state.rate * time, state.type);
  }
  // Integrate the same exponential AudioParam ramps analytically. Sampling does
  // not mutate the clock, so the header and main canvas always share one frame.
  function createTransport(values, time = 0, initial = {}) {
    let target = normalize(values);
    let origin = time;
    let phase = Number(initial.phase) || 0;
    let rate = Number.isFinite(initial.rate) ? initial.rate : target.rate;
    let amount = Number.isFinite(initial.amount) ? initial.amount : (target.enabled ? target.depth / 100 : 0);
    function sample(time) {
      const elapsed = Math.max(0, Number(time) - origin || 0);
      const decay = Math.exp(-elapsed / RAMP_SECONDS);
      const targetAmount = target.enabled ? target.depth / 100 : 0;
      const cycles = phase + target.rate * elapsed + (rate - target.rate) * RAMP_SECONDS * (1 - decay);
      const currentAmount = targetAmount + (amount - targetAmount) * decay;
      return { phase: ((cycles % 1) + 1) % 1,
        rate: target.rate + (rate - target.rate) * decay, amount: currentAmount,
        amplitude: 1 - currentAmount + currentAmount * wave(cycles, target.type) };
    }
    function restore(state, time) {
      phase = state.phase; rate = state.rate; amount = state.amount; origin = time;
    }
    return { sample, restore, update(values, time, immediate = false) {
      restore(sample(time), time);
      target = normalize(values);
      if (immediate) { rate = target.rate; amount = target.enabled ? target.depth / 100 : 0; }
    } };
  }
  function create(context, destination, values, initial = {}) {
    const input = context.createGain();
    const oscillator = context.createOscillator();
    const depth = context.createGain();
    const transport = createTransport(values, context.currentTime, initial);
    // One phase-continuous oscillator folds between the same four shapes as
    // the carrier. PeriodicWave is band limited by Web Audio; clip Fourier
    // edge ringing so the tremolo gain stays inside [1-depth, 1].
    const clip = context.createWaveShaper();
    clip.curve = new Float32Array([-1, 1]);
    oscillator.connect(clip);
    clip.connect(depth);
    const bias = context.createConstantSource();
    bias.connect(clip);
    bias.start(context.currentTime);
    let waveformType = null;
    function setWaveform(type) {
      if (waveformType === type) return;
      waveformType = type;
      const real = new Float32Array(129), imaginary = new Float32Array(129);
      const weights = [Math.max(0, 1 - type), Math.max(0, 1 - Math.abs(type - 1)),
        Math.max(0, 1 - Math.abs(type - 2)), Math.max(0, type - 2)];
      // Retain Pulse's 20% duty cycle: PeriodicWave ignores DC. Supply it explicitly before the limiter.
      bias.offset.setValueAtTime(-0.6 * weights[3], context.currentTime);
      for (let n = 1; n < real.length; n++) {
        const a = weights[3] * -2 * Math.sin(1.6 * Math.PI * n) / (Math.PI * n);
        const b = -2 / (Math.PI * n) * (weights[1] + weights[2] * (1 - Math.cos(Math.PI * n))
          + weights[3] * (1 - Math.cos(1.6 * Math.PI * n)));
        const angle = 2 * Math.PI * n * ((initial.phase || 0) + 0.25);
        real[n] = a * Math.cos(angle) + b * Math.sin(angle);
        imaginary[n] = b * Math.cos(angle) - a * Math.sin(angle);
        if (n === 1) { real[n] += weights[0] * Math.sin(2 * Math.PI * (initial.phase || 0));
          imaginary[n] += weights[0] * Math.cos(2 * Math.PI * (initial.phase || 0)); }
      }
      oscillator.setPeriodicWave(context.createPeriodicWave(real, imaginary, { disableNormalization: true }));
    }
    depth.connect(input.gain);
    input.connect(destination);
    let stopped = false;
    function update(values, immediate = false) {
      if (stopped) return;
      const state = normalize(values), time = context.currentTime;
      const current = transport.sample(time);
      setWaveform(state.type);
      const amount = state.enabled ? state.depth / 100 : 0;
      for (const [param, value, previous] of [[input.gain, 1 - amount / 2, 1 - current.amount / 2],
        [depth.gain, amount / 2, current.amount / 2], [oscillator.frequency, state.rate, current.rate]]) {
        param.cancelScheduledValues(time);
        param.setValueAtTime(immediate ? value : previous, time);
        if (!immediate) param.setTargetAtTime(value, time, RAMP_SECONDS);
      }
      transport.update(state, time, immediate);
    }
    update(values, true);
    oscillator.start(context.currentTime);
    return { input, update, sample: () => transport.sample(context.currentTime), stop(when = context.currentTime) {
      if (stopped) return;
      stopped = true;
      oscillator.onended = () => { oscillator.disconnect(); bias.disconnect(); clip.disconnect(); depth.disconnect(); input.disconnect(); };
      oscillator.stop(when);
      bias.stop(when);
    } };
  }
  const api = { normalize, amplitude, wave, mean, visualAmplitude, waveNames, ratePosition, positionRate, createTransport, create };
  scope.WaveformLfo = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
