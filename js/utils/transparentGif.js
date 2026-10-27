(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.transparentGifUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const abortError = () => new DOMException('Export cancelled.', 'AbortError');
  const checkAbort = signal => { if (signal && signal.aborted) throw abortError(); };
  let yieldChannel;
  const yieldQueue = [];
  const yieldTask = () => {
    if (typeof window === 'undefined') return new Promise(resolve => setTimeout(resolve, 0));
    if (!yieldChannel) {
      yieldChannel = new MessageChannel();
      yieldChannel.port1.onmessage = () => yieldQueue.shift()?.();
    }
    return new Promise(resolve => { yieldQueue.push(resolve); yieldChannel.port2.postMessage(0); });
  };

  function createPalette(foreground) {
    if (!Array.isArray(foreground) || foreground.length !== 3 || foreground.some(v => !Number.isInteger(v) || v < 0 || v > 255)) {
      throw new Error('GIF foreground must contain three RGB bytes.');
    }
    const key = foreground[0] === 255 && foreground[1] === 0 && foreground[2] === 255
      ? [0, 255, 0] : [255, 0, 255];
    return { foreground: foreground.slice(), key, globalPalette: [...key, ...foreground],
      transparent: (key[0] << 16) | (key[1] << 8) | key[2] };
  }

  function frameTiming(periodSeconds, count) {
    if (!Number.isFinite(periodSeconds) || periodSeconds <= 0 || !Number.isInteger(count) || count < 2) {
      throw new Error('Invalid GIF loop timing.');
    }
    const centiseconds = Math.round(periodSeconds * 100);
    if (centiseconds < count * 2) throw new Error('GIF frames need at least 20 ms each.');
    const delays = Array.from({ length: count }, (_, i) =>
      (Math.round((i + 1) * centiseconds / count) - Math.round(i * centiseconds / count)) * 10);
    let elapsed = 0;
    const progress = delays.map(delay => { const phase = elapsed / (centiseconds * 10); elapsed += delay; return phase; });
    return { delays, progress, durationMs: centiseconds * 10 };
  }

  // GIF ignores RGBA alpha. Convert coverage into a unique palette key, with no
  // white/black matte. Ordered coverage is spatially anchored, not randomized.
  async function preparePixels(image, palette, options = {}) {
    const { data, width, height } = image;
    if (!data || data.length !== width * height * 4) throw new Error('Invalid GIF frame pixels.');
    const mode = options.alphaMode || 'ordered';
    const littleEndian = new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 4;
    const pixels = littleEndian ? new Uint32Array(data.buffer, data.byteOffset, width * height) : null;
    const pack = rgb => (255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
    const ink = pack(palette.foreground), clear = pack(palette.key);
    const thresholds = BAYER.map(value => (value + 0.5) * 255 / 16);
    let started = performance.now();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const position = y * width + x;
        const alpha = data[position * 4 + 3];
        const opaque = alpha === 255 || (alpha !== 0 && alpha > (mode === 'threshold' ? 127.5 : thresholds[(y & 3) * 4 + (x & 3)]));
        if (pixels) pixels[position] = opaque ? ink : clear;
        else {
          const i = position * 4, rgb = opaque ? palette.foreground : palette.key;
          data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = 255;
        }
      }
      if ((y & 15) === 15 && performance.now() - started >= 8) {
        checkAbort(options.signal);
        await yieldTask(); started = performance.now();
      }
    }
    checkAbort(options.signal);
    return image;
  }

  async function encode(options) {
    const { width, height, frameCount, periodSeconds, renderFrame, signal: externalSignal } = options;
    if (![width, height, frameCount].every(Number.isInteger) || width < 1 || height < 1 || width > 65535 || height > 65535 || frameCount < 2) {
      throw new Error('Invalid GIF frame dimensions.');
    }
    const palette = createPalette(options.foreground);
    const timing = frameTiming(periodSeconds, frameCount);
    const controller = new AbortController();
    const signal = controller.signal;
    const forwardAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener('abort', forwardAbort, { once: true });
    }
    const concurrency = Math.min(2, frameCount);
    const workers = [], parts = new Array(frameCount);
    const started = performance.now();
    let next = 0, prepared = 0, encoded = 0, prepareMs = 0, inFlight = 0, peakInFlight = 0;
    const progress = () => options.onProgress && options.onProgress({ prepared, encoded, total: frameCount });
    const request = (worker, task) => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => finish(new Error('GIF encoder timed out. Try again.')), 120000);
      const onAbort = () => finish(abortError());
      const finish = (error, value) => {
        clearTimeout(timeout);
        if (signal) signal.removeEventListener('abort', onAbort);
        worker.onmessage = null; worker.onerror = null;
        if (error) reject(error); else resolve(value);
      };
      worker.onmessage = event => finish(null, event.data);
      worker.onerror = event => { event.preventDefault(); finish(new Error('GIF encoder could not finish. Try again.')); };
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      try { checkAbort(signal); worker.postMessage(task, [task.data.buffer]); } catch (error) { finish(error); }
    });
    try {
      checkAbort(signal);
      progress();
      for (let i = 0; i < concurrency; i++) workers.push(new Worker(options.workerScript));
      await Promise.all(workers.map(async worker => {
        while (true) {
          checkAbort(signal);
          const index = next++;
          if (index >= frameCount) return;
          await yieldTask(); checkAbort(signal);
          const preparationStart = performance.now();
          const image = await renderFrame(index, timing.progress[index]);
          if (image.width !== width || image.height !== height) throw new Error('GIF frame dimensions changed during export.');
          await preparePixels(image, palette, { alphaMode: options.alphaMode, signal });
          prepareMs += performance.now() - preparationStart;
          prepared++; inFlight++; peakInFlight = Math.max(peakInFlight, inFlight); progress();
          const frame = await request(worker, { index, last: index === frameCount - 1,
            data: image.data, width, height, delay: timing.delays[index], transparent: palette.transparent,
            globalPalette: palette.globalPalette, quality: 1, dither: false, repeat: 0, canTransfer: true });
          checkAbort(signal);
          parts[index] = frame.data.map((page, pageIndex) => pageIndex === frame.data.length - 1
            ? page.subarray(0, frame.cursor) : page);
          inFlight--; encoded++; progress();
        }
      }));
      checkAbort(signal);
      const blob = new Blob(parts.flat(), { type: 'image/gif' });
      return { blob, metrics: { width, height, frameCount, bytes: blob.size,
        durationMs: timing.durationMs, requestedDurationMs: periodSeconds * 1000,
        prepareMs, elapsedMs: performance.now() - started, peakInFlight,
        maxInputFrameBytes: width * height * 4 * concurrency } };
    } catch (error) { controller.abort(); throw error; }
    finally {
      workers.forEach(worker => worker.terminate());
      if (externalSignal) externalSignal.removeEventListener('abort', forwardAbort);
    }
  }
  return { createPalette, frameTiming, preparePixels, encode };
});
