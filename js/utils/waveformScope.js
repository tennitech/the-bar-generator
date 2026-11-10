/* Actual PCM scope: bounded min/max recording, offline rendering and live tap. */
(function(root) {
  const GROUP = 8, BINS = 1024, REPLAY = 2, SETTLE = .25;
  function settings(values = {}) {
    return { frequency: Math.max(10, Math.min(100, Number(values.frequency) || 24)),
      type: Math.max(0, Math.min(3, Number(values.type) || 0)), lfo: root.WaveformLfo.normalize(values.lfo) };
  }
  function duration(values) {
    const v = settings(values), hz = root.WaveformAudio.frequency(v.frequency);
    return Math.max(4 / hz, v.lfo.enabled && v.lfo.depth > 0 ? 2 / v.lfo.rate : 0);
  }
  function pcmExtrema(pcm) {
    const result = new Float32Array(Math.floor(pcm.length / GROUP) * 2);
    for (let i = 0, out = 0; i + GROUP <= pcm.length; i += GROUP) {
      let min = Infinity, max = -Infinity;
      for (let j = 0; j < GROUP; j++) { min = Math.min(min, pcm[i+j]); max = Math.max(max, pcm[i+j]); }
      result[out++] = min; result[out++] = max;
    }
    return result;
  }
  function frame(data, rate, start, seconds, source, extra = {}) {
    const first = Math.max(0, Math.floor(start * rate + 1e-9));
    const count = Math.min(data.length / 2 - first, Math.floor(seconds * rate + 1e-9));
    if (count < 1) return null;
    const bins = Math.min(BINS, count), extrema = [];
    for (let x = 0; x < bins; x++) {
      const a = first + Math.floor(x * count / bins), b = first + Math.floor((x+1) * count / bins);
      let min = Infinity, max = -Infinity;
      for (let i = a; i < b; i++) { min = Math.min(min, data[i*2]); max = Math.max(max, data[i*2+1]); }
      extrema.push(min, max);
    }
    return Object.freeze({ extrema: Object.freeze(extrema), seconds: count / rate,
      source, gainScale: .1, ...extra });
  }
  function recording(data, rate, seconds, source, extra = {}) {
    // data is private and never modified after construction. Snapshots retain
    // the recording even when controls replace the controller's current one.
    const total = data.length / 2 / rate;
    const replaySeconds = Math.max(0, Math.min(REPLAY, total - seconds));
    return Object.freeze({ source, seconds, replaySeconds,
      frame: offset => frame(data, rate, Math.max(0, Math.min(replaySeconds, Number(offset) || 0)), seconds, source, extra) });
  }
  function replayFrom(captured, origin, first, reverse = false) {
    const span = captured.replaySeconds;
    return Object.freeze({ source: captured.source, seconds: captured.seconds, replaySeconds: span,
      frame(time) {
        if (!span || !time || Math.abs(time - span) < 1e-10) return first;
        const position = ((origin + (reverse ? -1 : 1) * time) % span + span) % span;
        return captured.frame(position);
      } });
  }
  async function render(values, environment = root) {
    const v = settings(values), seconds = duration(v), sampleRate = 48000;
    const Context = environment.OfflineAudioContext || environment.webkitOfflineAudioContext;
    if (!Context) throw new Error('This browser cannot render a silent audio scope. Start Audio for a live scope.');
    const context = new Context(1, Math.ceil((seconds + REPLAY + SETTLE) * sampleRate), sampleRate);
    try { await context.audioWorklet?.addModule('js/pulse-worklet.js'); } catch (_) { /* Same Square fallback as the audible graph. */ }
    const master = context.createGain(); master.connect(context.destination);
    master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(1, .05);
    const graph = root.WaveformAudio.create(context, master, v, {}, environment.AudioWorkletNode);
    graph.update(v);
    const buffer = await context.startRendering();
    const data = pcmExtrema(buffer.getChannelData(0).subarray(Math.round(SETTLE * sampleRate)));
    return recording(data, sampleRate / GROUP, seconds, 'offline', { pulse: graph.pulseWorkletNode || v.type <= 2 ? 'worklet' : 'square-fallback' });
  }
  function createController({ onChange = () => {}, environment = root } = {}) {
    let key = '', currentSettings, offline = null, current = null, error = '', generation = 0;
    let pending = null, cancelPending = () => {}, queue = Promise.resolve(), timer;
    let tap = null, input = null, ring = null, written = 0, pairRate = 0, attachGeneration = 0;
    let currentRecording = null, exportRecording = null, lastWritten = -1, liveError = '';
    let offset = 0, currentOrigin = 0, currentReverse = false, running = true;
    function liveData() {
      const count = Math.min(written, ring.length / 2), result = new Float32Array(count * 2);
      const first = written - count;
      for (let i = 0; i < count; i++) {
        const index = ((first+i) % (ring.length/2)) * 2;
        result[i*2] = ring[index]; result[i*2+1] = ring[index+1];
      }
      return result;
    }
    function configure(values, immediate = false) {
      const next = settings(values), nextKey = JSON.stringify(next);
      if (key === nextKey) return pending;
      key = nextKey; currentSettings = next; offline = null; current = null; currentRecording = exportRecording = null; error = ''; offset = 0;
      // Discard pre-edit live PCM; never label old settings as the new signal.
      written = 0; lastWritten = -1;
      if (ring) ring = new Float32Array(Math.ceil((duration(next) + REPLAY) * pairRate) * 2);
      const token = ++generation;
      clearTimeout(timer); cancelPending();
      pending = new Promise(resolve => {
        cancelPending = () => resolve(null);
        timer = setTimeout(() => {
          queue = queue.then(async () => {
            if (token !== generation) return resolve(null);
            try {
              const captured = await render(next, environment);
              if (token === generation) {
                offline = captured;
                if (!current) { current = captured.frame(0); currentRecording = captured; currentOrigin = 0; exportRecording = replayFrom(captured, 0, current, currentReverse); }
                onChange();
              }
              resolve(captured);
            } catch (failure) {
              if (token === generation) { error = failure.message; onChange(); }
              resolve(null);
            }
          });
        }, immediate ? 0 : 100);
      });
      return pending;
    }
    function detach() {
      attachGeneration++;
      if (tap) { if (input) input.disconnect(tap); tap.port.onmessage = null; tap.disconnect(); }
      tap = input = ring = null; written = 0; lastWritten = -1; liveError = '';
    }
    async function attach(context, destination) {
      detach(); const token = attachGeneration;
      try { await context.audioWorklet.addModule('js/waveform-scope-worklet.js'); }
      catch (failure) { liveError = ' · live capture unavailable'; onChange(); throw failure; }
      if (token !== attachGeneration) return;
      try { tap = new environment.AudioWorkletNode(context, 'waveform-scope'); }
      catch (failure) { liveError = ' · live capture unavailable'; onChange(); throw failure; }
      input = destination;
      pairRate = context.sampleRate / GROUP;
      ring = new Float32Array(Math.ceil((duration(currentSettings) + REPLAY) * pairRate) * 2);
      tap.port.onmessage = event => {
        const data = event.data;
        if (!ring || !(data instanceof Float32Array)) return;
        for (let i = 0; i < data.length; i += 2) {
          const index = (written++ % (ring.length / 2)) * 2;
          ring[index] = data[i]; ring[index+1] = data[i+1];
        }
      };
      input.connect(tap); tap.connect(context.destination);
    }
    function tick(seconds, isRunning = true, reverse = false) {
      running = isRunning;
      if (reverse !== currentReverse && currentRecording) exportRecording = replayFrom(currentRecording, currentOrigin, current, reverse);
      currentReverse = reverse;
      if (!running) return current;
      if (tap && written) {
        if (lastWritten === written) return current;
        lastWritten = written;
        const data = liveData(), available = data.length / 2 / pairRate;
        const requested = duration(currentSettings), shown = Math.min(available, requested);
        currentRecording = recording(data, pairRate, shown, 'live', { filling: available < requested, requestedSeconds: requested });
        currentOrigin = currentRecording.replaySeconds;
        current = currentRecording.frame(currentOrigin);
        exportRecording = replayFrom(currentRecording, currentRecording.replaySeconds, current, reverse);
      } else if (offline) {
        offset = ((Number(seconds) || 0) % REPLAY + REPLAY) % REPLAY;
        current = offline.frame(offset); currentRecording = offline; currentOrigin = offset;
        exportRecording = replayFrom(offline, offset, current, reverse);
      }
      return current;
    }
    function capture(reverse = currentReverse) {
      if (current && reverse !== currentReverse) {
        currentReverse = reverse; exportRecording = replayFrom(currentRecording, currentOrigin, current, reverse);
      }
      if (!current) throw new Error(error || 'The audio signal is rendering. Try exporting again in a moment.');
      return Object.freeze({ frame: current, recording: exportRecording });
    }
    return { configure, attach, detach, tick, frame: () => current, capture,
      status() { return current ? `${current.source === 'live' ? (tap && running ? 'Live audio' : 'Recorded audio') : 'Offline audio render'} · ${current.seconds.toFixed(3)} s window${current.filling ? ' · filling history' : ''}${current.pulse === 'square-fallback' ? ' · Square fallback' : ''}${liveError}` : error || 'Rendering audio signal…'; },
      ready: () => pending,
      dispose() { generation++; clearTimeout(timer); cancelPending(); detach(); offline = current = currentRecording = exportRecording = null; }
    };
  }
  const api = { settings, duration, pcmExtrema, frame, recording, replayFrom, render, createController };
  root.WaveformScope = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
