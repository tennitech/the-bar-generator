/* Actual PCM scope: bounded min/max recording, offline rendering and live tap. */
(function(root) {
  const GROUP = 8, BINS = 1024, REPLAY = 2, SETTLE = .5;
  const notes = root.WaveformNotes || (typeof require === 'function' ? require('./waveformNotes') : null);
  const SWEEP_HZ = .3;
  const MAX_HISTORY_SECONDS = 1;
  function settings(values = {}) {
    return { note: notes.read(values),
      type: Math.max(0, Math.min(3, Number(values.type) || 0)) };
  }
  function duration(values) {
    return notes.get(settings(values).note).seconds;
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
  function frame(data, rate, start, seconds, source, extra = {}, pcm = null) {
    const first = Math.max(0, Math.floor(start * rate + 1e-9));
    const target = Math.max(1, Math.floor(seconds * rate + 1e-9));
    const count = Math.min(data.length / 2 - first, target);
    if (count < 1) return null;
    // Keep approximately the same time represented by each display bin as
    // coverage fills, rather than spending all 1024 bins on a short prefix.
    const resolution = Math.min(BINS, target);
    const bins = Math.min(count, Math.max(1, Math.ceil(resolution * count / target)));
    const extrema = [];
    for (let x = 0; x < bins; x++) {
      const a = first + Math.floor(x * count / bins), b = first + Math.floor((x+1) * count / bins);
      let min = Infinity, max = -Infinity;
      for (let i = a; i < b; i++) { min = Math.min(min, data[i*2]); max = Math.max(max, data[i*2+1]); }
      extrema.push(min, max);
    }
    const coverage = count / target;
    let trace = null, traceDurationSeconds = 0;
    if (pcm && extra.displayMode === 'trace') {
      const sampleRate = rate * GROUP, begin = Math.max(0, start * sampleRate);
      const sampleSpan = Math.max(0, Math.min(seconds * sampleRate, pcm.length - 1 - begin));
      // Include both exact physical endpoints. Their sample indices are usually
      // fractional because equal-tempered periods are not integer sample counts.
      // Linear interpolation is a numerical reconstruction, not exact analog PCM.
      trace = [];
      const points = Math.min(16384, Math.ceil(sampleSpan) + 1);
      for (let i = 0; i < points; i++) {
        const at = begin + i * sampleSpan / Math.max(1, points - 1);
        const a = Math.floor(at), fraction = at - a;
        trace.push(pcm[a] + (pcm[Math.min(a + 1, pcm.length - 1)] - pcm[a]) * fraction);
      }
      trace = Object.freeze(trace); traceDurationSeconds = sampleSpan / sampleRate;
    }
    return Object.freeze({ extrema: Object.freeze(extrema), seconds,
      availableSeconds: count / rate,
      startFraction: extra.alignEnd ? 1 - coverage : 0,
      endFraction: extra.alignEnd ? 1 : coverage,
      source, gainScale: .1, ...extra, ...(trace ? { trace, traceDurationSeconds } : {}) });
  }
  function recording(data, rate, seconds, source, extra = {}, pcm = null) {
    // data is private and never modified after construction. Snapshots retain
    // the recording even when controls replace the controller's current one.
    // Keep the physical duration N/f. Quantizing to GROUP-sample blocks
    // truncates the last cycle; integer counts are only storage bounds.
    const windowPairs = Math.max(1, Math.ceil(seconds * rate));
    const replayPairs = Math.max(0, Math.min(Math.floor((extra.replayLimit ?? REPLAY) * rate + 1e-9), data.length / 2 - windowPairs));
    const replaySeconds = replayPairs / rate;
    return Object.freeze({ source, seconds, replaySeconds,
      triggerBefore(limit, searchSeconds) {
        // Interpolate the crossing time in ordered PCM, rather than selecting
        // a coarse eight-sample extrema block. Samples are never phase-forced.
        if (pcm) {
          const sampleRate = rate * GROUP;
          const end = Math.min(pcm.length - 1, Math.floor(Math.min(replaySeconds, limit) * sampleRate));
          const begin = Math.max(1, end - Math.ceil(searchSeconds * sampleRate));
          for (let i = end; i >= begin; i--) if (pcm[i-1] <= 0 && pcm[i] > 0) {
            return (i - 1 - pcm[i-1] / (pcm[i] - pcm[i-1])) / sampleRate;
          }
        }
        // Select an actual rising crossing; never alter or synthesize samples.
        const end = Math.min(replayPairs, Math.floor(limit * rate));
        const begin = Math.max(1, end - Math.ceil(searchSeconds * rate));
        for (let i = end; i >= begin; i--) {
          const before = data[(i-1)*2] + data[(i-1)*2+1];
          const after = data[i*2] + data[i*2+1];
          if (before <= 0 && after > 0) return i / rate;
        }
        return Math.max(0, end) / rate;
      },
      frame: offset => frame(data, rate, Math.max(0, Math.min(replaySeconds, Number(offset) || 0)), seconds, source, extra, pcm) });
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
  function sweepSpan(values) {
    const v = settings(values);
    return 1 / root.WaveformAudio.frequency(v.note);
  }
  function displaySettings(values) {
    const v = settings(values), carrierHz = root.WaveformAudio.frequency(v.note);
    return { displayMode: 'trace', carrierHz, note: v.note, type: v.type, cycles: notes.get(v.note).cycles, replayLimit: .1 };
  }
  function sweep(captured, values) {
    const requestedSpan = sweepSpan(values);
    const span = captured.replaySeconds >= requestedSpan ? requestedSpan : 0;
    const latest = Math.max(0, captured.replaySeconds - span);
    const display = displaySettings(values);
    const origin = captured.triggerBefore(latest, 1 / display.carrierHz);
    return { captured, origin, span };
  }
  function sweepReplay(view, offset, first, reverse) {
    const { captured, origin, span } = view;
    return Object.freeze({ source: captured.source, seconds: captured.seconds,
      replaySeconds: span, playbackSeconds: span > 0 ? 1 / SWEEP_HZ : 0,
      frame(time) {
        if (!span || !time || Math.abs(time - span) < 1e-10) return first;
        const position = ((offset + (reverse ? -1 : 1) * time) % span + span) % span;
        return captured.frame(origin + position);
      } });
  }
  async function render(values, environment = root) {
    const v = settings(values), seconds = duration(v), sampleRate = 48000, display = displaySettings(v);
    const Context = environment.OfflineAudioContext || environment.webkitOfflineAudioContext;
    if (!Context) throw new Error('This browser cannot render a silent audio scope. Start Audio for a live scope.');
    const context = new Context(1, Math.ceil((seconds + display.replayLimit + SETTLE) * sampleRate), sampleRate);
    const master = context.createGain(); master.connect(context.destination);
    master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(1, .05);
    const graph = root.WaveformAudio.create(context, master, v, environment.AudioWorkletNode);
    graph.update(v);
    const buffer = await context.startRendering();
    const pcm = buffer.getChannelData(0).slice(Math.round(SETTLE * sampleRate));
    return recording(pcmExtrema(pcm), sampleRate / GROUP, seconds, 'offline', {
      ...display, pulse: 'band-limited-periodic-wave'
    }, pcm);
  }
  function createController({ onChange = () => {}, environment = root } = {}) {
    let key = '', currentKey = '', currentSettings, offlineKey = '', offline = null, current = null;
    let error = '', rendering = false, generation = 0;
    let pending = null, cancelPending = () => {}, queue = Promise.resolve(), timer;
    let tap = null, input = null, ring = null, pcmRing = null, hasPcm = false, written = 0, pairRate = 0, attachGeneration = 0;
    let currentRecording = null, exportRecording = null, lastWritten = -1, lastEditAt = null, liveError = '';
    let offset = 0, currentOrigin = 0, currentReverse = false, running = true;
    let currentSweep = null, liveCycle = null;
    // Bounded per-controller LRU. Render on demand, reuse recent immutable PCM.
    // 8 entries keep memory bounded; do not pre-render all 61 x 301 morph values.
    const cache = new Map();
    function showSweep(view, time, capturedKey) {
      currentSweep = view;
      const phase = (((Number(time) || 0) * SWEEP_HZ) % 1 + 1) % 1;
      offset = phase * view.span;
      currentOrigin = view.origin + offset;
      currentRecording = view.captured;
      current = currentRecording.frame(currentOrigin); currentKey = capturedKey;
      exportRecording = sweepReplay(view, offset, current, currentReverse);
    }
    function liveData(seconds) {
      const count = Math.min(written, ring.length / 2, Math.floor(seconds * pairRate + 1e-9));
      const data = new Float32Array(count * 2), first = written - count;
      const pcmPairs = pcmRing.length / GROUP;
      const pcm = hasPcm && count <= pcmPairs ? new Float32Array(count * GROUP) : null;
      for (let i = 0; i < count; i++) {
        const index = ((first+i) % (ring.length/2)) * 2;
        data[i*2] = ring[index]; data[i*2+1] = ring[index+1];
        if (pcm) for (let j = 0; j < GROUP; j++) pcm[i*GROUP+j] = pcmRing[((first+i) % pcmPairs)*GROUP+j];
      }
      return { data, pcm, first };
    }
    function showOffline(captured, time, capturedKey) {
      const view = currentSweep?.captured === captured && currentKey === capturedKey ? currentSweep : sweep(captured, currentSettings);
      showSweep(view, time, capturedKey);
    }

    function configure(values, immediate = false) {
      const next = settings(values), nextKey = JSON.stringify(next);
      if (key === nextKey) return pending;
      key = nextKey; currentSettings = next; error = ''; rendering = true;
      // The tap records a continuous signal, including the real parameter
      // ramps. Keep that history and label views that include earlier settings.
      if (tap) lastEditAt = written;
      lastWritten = -1; liveCycle = null;
      const token = ++generation;
      clearTimeout(timer); cancelPending();
      pending = new Promise(resolve => {
        cancelPending = () => resolve(null);
        timer = setTimeout(() => {
          queue = queue.then(async () => {
            if (token !== generation) return resolve(null);
            try {
              let captured = cache.get(nextKey);
              if (captured) cache.delete(nextKey);
              else captured = await render(next, environment);
              cache.set(nextKey, captured);
              while (cache.size > 8) cache.delete(cache.keys().next().value);
              if (token === generation) {
                offline = captured; offlineKey = nextKey; rendering = false;
                // Frozen data remains frozen across edits. A first still can
                // appear on initial load; subsequent swaps wait for playback.
                if (!current || (running && !tap)) showOffline(captured, 0, nextKey);
                onChange();
              }
              resolve(captured);
            } catch (failure) {
              if (token === generation) { error = failure.message; rendering = false; onChange(); }
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
      tap = input = ring = pcmRing = null; hasPcm = false; written = 0; lastWritten = -1; liveCycle = null; lastEditAt = null; liveError = '';
    }
    async function attach(context, destination) {
      detach(); const token = attachGeneration;
      try { await context.audioWorklet.addModule('js/waveform-scope-worklet.js?v=20261110-scope-contours'); }
      catch (failure) { liveError = ' · live capture unavailable'; onChange(); throw failure; }
      if (token !== attachGeneration) return;
      try { tap = new environment.AudioWorkletNode(context, 'waveform-scope'); }
      catch (failure) { liveError = ' · live capture unavailable'; onChange(); throw failure; }
      input = destination;
      pairRate = context.sampleRate / GROUP;
      // One second covers the adaptive whole-cycle window plus
      // trigger/replay margin. Edits never resize or clear the live ring.
      ring = new Float32Array(Math.ceil(MAX_HISTORY_SECONDS * pairRate) * 2);
      // Retain ordered PCM for the same bounded history as the extrema.
      pcmRing = new Float32Array(Math.ceil(pairRate) * GROUP);
      tap.port.onmessage = event => {
        const data = event.data?.extrema || event.data, pcm = event.data?.pcm;
        if (!ring || !(data instanceof Float32Array)) return;
        for (let i = 0; i < data.length; i += 2) {
          const index = (written++ % (ring.length / 2)) * 2;
          ring[index] = data[i]; ring[index+1] = data[i+1];
          if (pcm instanceof Float32Array && pcm.length === data.length / 2 * GROUP) {
            for (let j = 0; j < GROUP; j++) pcmRing[((written-1) % (pcmRing.length/GROUP))*GROUP+j] = pcm[i/2*GROUP+j];
            hasPcm = true;
          }
        }
      };
      input.connect(tap); tap.connect(context.destination);
    }
    function tick(seconds, isRunning = true, reverse = false) {
      running = isRunning;
      if (reverse !== currentReverse && currentRecording) exportRecording = sweepReplay(currentSweep, offset, current, reverse);
      currentReverse = reverse;
      if (!running) return current;
      if (tap) {
        // Capture continuously, but present immutable, triggered sweeps at
        // the selected visual speed rather than racing through native PCM.
        if (!written) return current;
        const stableHistory = written - (lastEditAt || 0) > (SETTLE + duration(currentSettings) + .1) * pairRate;
        if (!stableHistory) {
          if (offline && offlineKey === key) showOffline(offline, seconds, offlineKey);
          return current;
        }
        const requested = duration(currentSettings), target = Math.floor(requested * pairRate + 1e-9);
        const cycle = Math.floor((Number(seconds) || 0) * SWEEP_HZ);
        const historySettled = current?.parameterChanges && lastEditAt !== null && written - target - Math.ceil(2 * sweepSpan(currentSettings) * pairRate) > lastEditAt;
        const refresh = !currentSweep || current.source !== 'live' || liveCycle !== cycle
          || lastWritten < 0 || current.filling || historySettled;
        if (refresh && lastWritten !== written) {
          lastWritten = written; liveCycle = cycle;
          const display = displaySettings(currentSettings);
          const { data, pcm, first } = liveData(requested + display.replayLimit);
          const visibleFirst = Math.max(first, written - target - Math.ceil(2 * sweepSpan(currentSettings) * pairRate));
          const captured = recording(data, pairRate, requested, 'live', {
            ...display, alignEnd: true, filling: data.length / 2 < target, requestedSeconds: requested,
            parameterChanges: lastEditAt !== null && visibleFirst <= lastEditAt
          }, pcm);
          currentSweep = sweep(captured, currentSettings);
        }
        if (currentSweep?.captured.source === 'live') showSweep(currentSweep, seconds, key);
      } else if (offline && offlineKey === key) {
        showOffline(offline, seconds, offlineKey);
      }
      return current;
    }
    function capture(reverse = currentReverse) {
      if (current && reverse !== currentReverse) {
        currentReverse = reverse; exportRecording = sweepReplay(currentSweep, offset, current, reverse);
      }
      if (!current) throw new Error(error || 'The audio signal is rendering. Try exporting again in a moment.');
      return Object.freeze({ frame: current, recording: exportRecording });
    }
    function status() {
      if (!current) return error || 'Rendering audio signal…';
      const label = current.source === 'live' ? (tap && running ? 'Live audio capture' : 'Recorded audio') : 'Offline audio render';
      const previous = currentKey !== key;
      const pitch = notes.get(current.note);
      return `${label} · ${pitch.name} · ${pitch.frequencyHz.toFixed(3)} Hz · ${current.cycles} ${current.cycles === 1 ? 'cycle' : 'cycles'} · ${(current.seconds * 1000).toFixed(6)} ms window · interpolated PCM${!running ? ' · frozen' : ''}`
        + (previous ? ` · previous settings${rendering ? ' (rendering update)' : error ? ' (update unavailable)' : ''}` : '')
        + (current.filling ? ` · filling history: ${current.availableSeconds.toFixed(3)} s recorded; blank area is unrecorded` : '')
        + (current.parameterChanges ? ' · includes parameter changes' : '')
        + (tap && current.source !== 'live' && running ? ' · waiting for settled live audio' : '')
        + (current.pulse === 'square-fallback' ? ' · Square fallback' : '') + liveError;
    }
    return { configure, attach, detach, tick, frame: () => current, capture, status,
      ready: () => pending,
      dispose() { generation++; clearTimeout(timer); cancelPending(); detach(); offline = current = currentRecording = exportRecording = null; cache.clear(); }
    };
  }

  const api = { settings, duration, displaySettings, sweepSpan, sweep, sweepReplay, pcmExtrema, frame, recording, replayFrom, render, createController };
  root.WaveformScope = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
