/* One sampled ASCII frame; reveal is compositor-only and never enters exports. */
(function (scope) {
  const glyphs = ' .:-=+*#%@';
  function cells(width, height) {
    const columns = Math.min(100, Math.max(8, Math.ceil(width / 7)));
    return { columns, rows: Math.min(64, Math.max(2, Math.ceil(height / (width / columns * 1.8)))) };
  }
  function prepare(sources, texts, isCancelled, vectorSource) {
    const started = performance.now();
    const budget = 180;
    const overlay = document.createElement('canvas');
    overlay.className = 'entrance_ascii';
    overlay.setAttribute('aria-hidden', 'true');
    const scale = Math.min(1, 1600 / innerWidth, 1200 / innerHeight);
    overlay.width = Math.ceil(innerWidth * scale);
    overlay.height = Math.ceil(innerHeight * scale);
    const ctx = overlay.getContext('2d');
    if (!ctx || typeof overlay.animate !== 'function') return Promise.resolve(null);
    ctx.scale(scale, scale);
    const cache = new Map();
    const artworkLayers = [];
    const originals = new Set();
    const animations = [];
    const bitmaps = new Map();
    let frame = 0, deadline = 0, cleanupTimer = 0, stopped = false;
    let painted = 0, sampleMs = 0, captureMs = 0, maxSliceMs = 0;
    const clean = () => {
      stopped = true;
      clearTimeout(deadline);
      clearTimeout(cleanupTimer);
      clearTimeout(frame);
      overlay.remove();
      artworkLayers.forEach(layer => layer.remove());
      animations.forEach(animation => animation.cancel());
      originals.forEach(element => element.classList.remove('is-ascii-original'));
      cache.clear();
      bitmaps.forEach(bitmap => bitmap.close?.());
      bitmaps.clear();
    };
    const visible = element => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
    };
    const queue = [...sources.filter(visible).slice(0, 64).map(element => ({ element, text: false })),
      ...texts.filter(visible).slice(0, 12).map(element => ({ element, text: true }))];
    const record = outcome => {
      scope.AsciiEntrance.lastPreparation = { outcome, sampleMs, captureMs, maxSliceMs,
        wallMs: performance.now() - started, sourceCount: painted };
    };
    return new Promise(resolve => {
      deadline = setTimeout(() => { record('deadline'); clean(); resolve(null); }, budget);
      function step() {
        if (stopped || isCancelled() || performance.now() - started > budget) { record('cancelled-or-slow'); clean(); resolve(null); return; }
        const sliceStart = performance.now();
        while (queue.length && performance.now() - sliceStart < 4) {
          const item = queue.shift();
          const before = performance.now();
          const element = item.element, r = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          try {
            if (item.text) {
              // Original semantic text never changes; the temporary visual layer
              // uses the same baseline/footprint and a restrained symbol alphabet.
              const text = element.textContent.trim();
              const scrambled = text.replace(/[^\s]/g, (_, i) => '+:/=<>#'[i % 7]);
              ctx.font = `${style.fontWeight} ${style.fontSize} RPIGeistMono, monospace`;
              ctx.fillStyle = style.color;
              ctx.textBaseline = 'middle';
              ctx.fillText(scrambled, r.left, r.top + r.height / 2, r.width);
            } else {
              const width = element.offsetWidth, height = element.offsetHeight;
              const { columns, rows } = cells(width, height);
              const layer = document.createElement('canvas');
              layer.className = 'entrance_ascii-artwork';
              layer.setAttribute('aria-hidden', 'true');
              layer.width = Math.ceil(width); layer.height = Math.ceil(height);
              Object.assign(layer.style, { left: `${element.offsetLeft}px`, top: `${element.offsetTop}px`,
                width: `${width}px`, height: `${height}px` });
              const target = layer.getContext('2d');
              const key = `${element.currentSrc || element.src || 'canvas'}:${columns}:${rows}`;
              let lines = cache.get(key);
              if (!lines) {
                const sample = document.createElement('canvas');
                sample.width = columns; sample.height = rows;
                const sampleContext = sample.getContext('2d', { willReadFrequently: true });
                sampleContext.drawImage(bitmaps.get(element) || element, 0, 0, columns, rows);
                const data = sampleContext.getImageData(0, 0, columns, rows).data;
                lines = [];
                if (element.tagName === 'CANVAS') {
                  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200) { lines.ink = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`; break; }
                }
                for (let y = 0; y < rows; y++) {
                  let line = '';
                  for (let x = 0; x < columns; x++) line += glyphs[Math.min(9, Math.floor(data[(y * columns + x) * 4 + 3] / 256 * 10))];
                  lines.push(line);
                }
                cache.set(key, lines);
              }
              target.font = `${width / columns / 0.6}px RPIGeistMono, monospace`;
              target.textBaseline = 'top';
              target.fillStyle = element.tagName === 'IMG' ? '#ffffff' : (lines.ink || style.color);
              lines.forEach((line, y) => target.fillText(line, 0, y * height / rows, width));
              artworkLayers.push(layer);
              layer._entranceParent = element.parentElement;
            }
            originals.add(element);
            if (element.tagName === 'IMG') element.parentElement.querySelectorAll('.bar_motion_asset').forEach(node => originals.add(node));
            painted++;
          } catch (_) { /* Failed/tainted sources fall back to their real artwork. */ }
          sampleMs += performance.now() - before;
        }
        maxSliceMs = Math.max(maxSliceMs, performance.now() - sliceStart);
        if (queue.length) { frame = setTimeout(step, 0); return; }
        if (!painted) { record('empty'); clean(); resolve(null); return; }
        clearTimeout(deadline);
        record('ready');
        overlay.dataset.prepareMs = sampleMs.toFixed(2);
        overlay.dataset.captureMs = captureMs.toFixed(2);
        overlay.dataset.wallMs = (performance.now() - started).toFixed(2);
        overlay.dataset.sourceCount = String(painted);
        originals.forEach(element => element.classList.add('is-ascii-original'));
        document.body.appendChild(overlay);
        artworkLayers.forEach(layer => layer._entranceParent.appendChild(layer));
        resolve({ cleanup: clean, start(duration) {
          originals.forEach(element => animations.push(element.animate([{ opacity: 0 }, { opacity: 0, offset: 0.15 }, { opacity: 1 }],
            { duration, easing: 'ease-out', fill: 'forwards' })));
          [overlay, ...artworkLayers].forEach(layer => {
            const animation = layer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }],
              { duration, easing: 'ease-out', fill: 'forwards' });
            animations.push(animation);
            animation.finished.catch(() => {}).then(() => layer.remove());
          });
          cleanupTimer = setTimeout(clean, duration + 50);
        } });
      }
      const canvasSource = queue.find(item => item.element.tagName === 'CANVAS');
      if (!canvasSource) { frame = setTimeout(step, 0); return; }
      if (typeof vectorSource !== 'function') { clean(); resolve(null); return; }
      try {
        const captureStart = performance.now();
        const image = new Image();
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(vectorSource());
        captureMs = performance.now() - captureStart;
        image.decode().then(() => {
          if (stopped || isCancelled()) return;
          bitmaps.set(canvasSource.element, image);
          frame = setTimeout(step, 0);
        }, () => { clean(); resolve(null); });
      } catch (_) { clean(); resolve(null); }
    });
  }
  scope.AsciiEntrance = { prepare, cells };
  if (typeof module !== 'undefined' && module.exports) module.exports = { cells };
})(typeof window !== 'undefined' ? window : globalThis);
