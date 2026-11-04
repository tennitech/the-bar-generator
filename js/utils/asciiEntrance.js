/* A bounded, automatic terminal wake resolves into the untouched real artwork. */
(function (scope) {
  const glyphs = ' .:-=+*#%@';
  function cells(width, height) {
    const columns = Math.min(100, Math.max(8, Math.ceil(width / 7)));
    return { columns, rows: Math.min(64, Math.max(2, Math.ceil(height / (width / columns * 1.8)))) };
  }
  const clamp = value => Math.max(0, Math.min(1, value));
  // The sweep spends its first beat in glyphs, then commits left to right.
  function frontier(progress) { return clamp((progress - 0.08) / 0.84); }
  function noise(cell, beat) { return ((Math.sin(cell * 127.1 + beat * 311.7) * 43758.5453) % 1 + 1) % 1; }
  function prepare(sources, texts, isCancelled, vectorSource) {
    const started = performance.now();
    const budget = 180;
    const overlay = document.createElement('canvas');
    overlay.className = 'entrance_ascii';
    overlay.setAttribute('aria-hidden', 'true');
    // A tiny marker preserves the entrance lifecycle hook; each measured
    // field owns its own bounded drawing surface instead of a page bitmap.
    overlay.width = 1; overlay.height = 1;
    if (!overlay.getContext('2d')) return Promise.resolve(null);
    const artworkLayers = [];
    const fields = [];
    const originals = new Set();
    const previousStyles = [];
    const bitmaps = new Map();
    let raf = 0;
    let frame = 0, deadline = 0, cleanupTimer = 0, stopped = false;
    let painted = 0, sampleMs = 0, captureMs = 0, maxSliceMs = 0;
    const clean = () => {
      stopped = true;
      clearTimeout(deadline);
      clearTimeout(cleanupTimer);
      clearTimeout(frame);
      cancelAnimationFrame(raf);
      overlay.remove();
      artworkLayers.forEach(layer => layer.remove());
      previousStyles.forEach(([element, clip, opacity]) => { element.style.clipPath = clip; element.style.opacity = opacity; });
      originals.forEach(element => element.classList.remove('is-ascii-original'));
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
            const width = item.text ? r.width : element.offsetWidth;
            const height = item.text ? r.height : element.offsetHeight;
            const { columns, rows } = cells(width, height);
            const sample = document.createElement('canvas');
            sample.width = item.text ? Math.ceil(width) : columns; sample.height = item.text ? Math.ceil(height) : rows;
            const source = sample.getContext('2d', { willReadFrequently: true });
            if (item.text) {
              // Sample actual letter silhouettes, not one random character per
              // letter. The live semantic text, font and spacing never change.
              source.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
              source.letterSpacing = style.letterSpacing;
              source.fillStyle = style.color;
              source.textBaseline = 'middle';
              source.fillText(element.textContent.trim(), 0, height / 2);
            } else source.drawImage(bitmaps.get(element) || element, 0, 0, columns, rows);
            const tiny = document.createElement('canvas');
            tiny.width = columns; tiny.height = rows;
            const sampler = tiny.getContext('2d', { willReadFrequently: true });
            sampler.drawImage(sample, 0, 0, columns, rows);
            const pixels = sampler.getImageData(0, 0, columns, rows).data;
            let ink = style.color;
            if (!item.text) {
              for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 200) {
                ink = `rgb(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]})`; break;
              }
            }
            const layer = document.createElement('canvas');
            layer.className = item.text ? 'entrance_ascii-text' : 'entrance_ascii-artwork';
            layer.setAttribute('aria-hidden', 'true');
            const ratio = Math.min(2, devicePixelRatio || 1, 1600 / width, 1200 / height);
            layer.width = Math.ceil(width * ratio); layer.height = Math.ceil(height * ratio);
            Object.assign(layer.style, { left: `${item.text ? r.left : element.offsetLeft}px`,
              top: `${item.text ? r.top : element.offsetTop}px`, width: `${width}px`, height: `${height}px` });
            const target = layer.getContext('2d');
            target.scale(ratio, ratio);
            artworkLayers.push(layer);
            layer._entranceParent = item.text ? document.body : element.parentElement;
            // Rasterize the small alphabet once. Reusing glyph sprites avoids
            // thousands of font-shaping calls during the short animation.
            const cw = width / columns, ch = height / rows;
            const spriteWidth = Math.ceil(cw * ratio), spriteHeight = Math.ceil(ch * ratio);
            const atlas = document.createElement('canvas');
            atlas.width = spriteWidth * glyphs.length; atlas.height = spriteHeight;
            const font = atlas.getContext('2d');
            font.fillStyle = ink;
            font.font = `500 ${Math.min(cw / 0.62, ch * 1.2) * ratio}px RPIGeistMono, monospace`;
            font.textAlign = 'center'; font.textBaseline = 'middle';
            [...glyphs].forEach((glyph, index) => font.fillText(glyph, (index + 0.5) * spriteWidth, spriteHeight / 2));
            fields.push({ target, width, height, columns, rows, pixels, ink, atlas, spriteWidth, spriteHeight });
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
          // Complementary clips keep the original and the ASCII in exactly the
          // same footprint. Each letter is uncovered in place, never crossfaded
          // with an unrelated string or replaced by a newly drawn logo.
          originals.forEach(element => {
            previousStyles.push([element, element.style.clipPath, element.style.opacity]);
            element.style.opacity = '1';
          });
          const began = performance.now();
          const metrics = scope.AsciiEntrance.lastAnimation = { frames: 0, maxPaintMs: 0 };
          function paint(now) {
            if (stopped || isCancelled()) { clean(); return; }
            const paintStarted = performance.now();
            const progress = clamp((now - began) / duration);
            const edge = frontier(progress);
            // A shared clock keeps original and glyph clips complementary even
            // when the browser throttles compositor animations independently.
            originals.forEach(element => { element.style.clipPath = `inset(0 ${(1 - edge) * 100}% 0 0)`; });
            const beat = Math.floor((now - began) / 55);
            fields.forEach(({ target, width, height, columns, rows, pixels, ink, atlas, spriteWidth, spriteHeight }, fieldIndex) => {
              const cw = width / columns, ch = height / rows;
              target.clearRect(0, 0, width, height);
              target.save();
              target.beginPath(); target.rect(width * edge, 0, width * (1 - edge), height); target.clip();
              target.fillStyle = ink;
              for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
                const k = y * columns + x, density = pixels[k * 4 + 3] / 255;
                if (density < 0.06 || (x + 1) / columns < edge) continue;
                const cx = (x + 0.5) * cw, cy = (y + 0.5) * ch;
                // A narrow travelling wake heats the field. Noise holds for a
                // terminal beat, rather than flickering independently every frame.
                const heat = Math.exp(-Math.pow((x / columns - edge) / 0.17, 2));
                const shimmer = noise(k + fieldIndex * 7919, beat);
                const strength = clamp(density * (0.3 + heat * 0.7) + (shimmer - 0.5) * heat * 0.28);
                target.globalAlpha = 0.45 + strength * 0.55;
                if (strength < 0.34) {
                  target.beginPath(); target.arc(cx, cy, Math.max(0.4, Math.min(cw, ch) * 0.22 * Math.sqrt(density)), 0, Math.PI * 2); target.fill();
                } else {
                  const glyph = Math.max(1, Math.min(9, Math.floor(strength * 10)));
                  target.drawImage(atlas, glyph * spriteWidth, 0, spriteWidth, spriteHeight, cx - cw / 2, cy - ch / 2, cw, ch);
                }
              }
              target.restore(); target.globalAlpha = 1;
            });
            metrics.frames++;
            metrics.maxPaintMs = Math.max(metrics.maxPaintMs, performance.now() - paintStarted);
            if (progress < 1) raf = requestAnimationFrame(paint);
          }
          paint(began);
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
  scope.AsciiEntrance = { prepare, cells, frontier, noise };
  if (typeof module !== 'undefined' && module.exports) module.exports = { cells, frontier, noise };
})(typeof window !== 'undefined' ? window : globalThis);
