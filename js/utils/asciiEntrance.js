/* Whole letterforms settle from a held ASCII texture. No scanning edge or wipe. */
(function (scope) {
  const glyphs = ' .:-=+*#%@';
  function cells(width, height) {
    const columns = Math.min(100, Math.max(8, Math.ceil(width / 7)));
    return { columns, rows: Math.min(64, Math.max(2, Math.ceil(height / (width / columns * 1.8)))) };
  }
  const clamp = value => Math.max(0, Math.min(1, value));
  // Each complete letter settles in place. Adjacent letters overlap briefly,
  // but no boundary ever travels through a letter or an artwork sample.
  function resolveAt(progress, index, count, delay = 0) {
    const start = 0.1 + delay + (count > 1 ? index / (count - 1) * 0.48 : 0);
    const t = clamp((progress - start) / 0.24);
    return t * t * (3 - 2 * t);
  }
  function artworkRegions(pixels, columns, rows) {
    const occupied = y => Array.from({ length: columns }, (_, x) => pixels[(y * columns + x) * 4 + 3] > 24).some(Boolean);
    const bands = []; let start = -1;
    for (let y = 0; y <= rows; y++) {
      if (y < rows && occupied(y)) { if (start < 0) start = y; }
      else if (start >= 0) { bands.push([start, y]); start = -1; }
    }
    // Separate the official wordmark from its bar using the actual empty rows,
    // not replacement geometry or hard-coded letter proportions.
    const top = bands[0] || [0, rows];
    const groups = []; start = -1;
    for (let x = 0; x <= columns; x++) {
      let ink = false;
      if (x < columns) for (let y = top[0]; y < top[1]; y++) ink ||= pixels[(y * columns + x) * 4 + 3] > 24;
      if (ink) { if (start < 0) start = x; }
      else if (start >= 0) { groups.push({ x: Math.max(0, start - 0.5) / columns, y: 0, w: (x - start + 1) / columns, h: (top[1] + 0.5) / rows }); start = -1; }
    }
    if (bands.length > 1) groups.push({ x: 0, y: (top[1] + 0.5) / rows, w: 1, h: 1 - (top[1] + 0.5) / rows });
    return groups.length ? groups : [{ x: 0, y: 0, w: 1, h: 1 }];
  }
  function textRegions(element, bounds) {
    const groups = [], walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) for (let i = 0; i < node.length; i++) {
      if (/\s/.test(node.textContent[i])) continue;
      const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      groups.push({ x: (r.left - bounds.left) / bounds.width, y: 0, w: r.width / bounds.width, h: 1 });
    }
    return groups;
  }
  const maskSources = new WeakMap();
  function preloadMask(element) {
    if (!element) return Promise.resolve(null);
    if (!maskSources.has(element)) {
      const url = getComputedStyle(element).maskImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if (!url) return Promise.resolve(null);
      const image = new Image(); image.src = url;
      maskSources.set(element, image.decode().then(() => image, () => null));
    }
    return maskSources.get(element);
  }
  function noise(cell, beat) { return ((Math.sin(cell * 127.1 + beat * 311.7) * 43758.5453) % 1 + 1) % 1; }
  function prepare(sources, texts, isCancelled, vectorSource) {
    const started = performance.now();
    const budget = 350;
    const overlay = document.createElement('canvas');
    overlay.className = 'entrance_ascii';
    overlay.setAttribute('aria-hidden', 'true');
    // A tiny marker preserves the entrance lifecycle hook; each measured
    // field owns its own bounded drawing surface instead of a page bitmap.
    overlay.width = 1; overlay.height = 1;
    if (!overlay.getContext('2d')) return Promise.resolve(null);
    const artworkLayers = [];
    const atlasCache = new Map();
    const fields = [];
    const originals = new Set();
    const previousStyles = [];
    const chromeAnimations = [];
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
      chromeAnimations.forEach(animation => animation.cancel());
      artworkLayers.forEach(layer => layer.remove());
      previousStyles.forEach(([element, opacity]) => { element.style.opacity = opacity; });
      originals.forEach(element => element.classList.remove('is-ascii-original'));
      bitmaps.forEach(bitmap => bitmap.close?.());
      bitmaps.clear();
    };
    const visible = element => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
    };
    const queue = [...sources.filter(visible).slice(0, 128).map(element => ({ element, text: false })),
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
        while (queue.length && performance.now() - sliceStart < 8) {
          const item = queue.shift();
          const before = performance.now();
          const element = item.element, r = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          try {
            const fixed = item.text || element.classList.contains('hero_brand');
            const width = fixed ? r.width : element.offsetWidth;
            const height = fixed ? r.height : element.offsetHeight;
            // Home scales its complete title cluster on narrow screens. Fixed
            // overlays use viewport pixels, so carry that scale into type metrics.
            const textScale = item.text ? r.width / element.offsetWidth : 1;
            const scaledMetric = value => Number.isFinite(parseFloat(value)) ? `${parseFloat(value) * textScale}px` : value;
            const fontSize = scaledMetric(style.fontSize);
            const lineHeight = scaledMetric(style.lineHeight);
            const letterSpacing = scaledMetric(style.letterSpacing);
            const { columns, rows } = cells(width, height);
            const sample = document.createElement('canvas');
            sample.width = item.text ? Math.ceil(width) : columns; sample.height = item.text ? Math.ceil(height) : rows;
            const source = sample.getContext('2d', { willReadFrequently: true });
            if (item.text) {
              // Sample actual letter silhouettes, not one random character per
              // letter. The live semantic text, font and spacing never change.
              source.font = `${style.fontWeight} ${fontSize} ${style.fontFamily}`;
              source.letterSpacing = letterSpacing;
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
            if (element.classList.contains('hero_brand')) ink = style.backgroundColor;
            let groups = item.text ? textRegions(element, r) : element.tagName === 'CANVAS' ? artworkRegions(pixels, columns, rows) : [{ x: 0, y: 0, w: 1, h: 1 }];
            if (!groups.length) groups = [{ x: 0, y: 0, w: 1, h: 1 }];
            const layer = document.createElement('canvas');
            layer.className = fixed ? 'entrance_ascii-text' : 'entrance_ascii-artwork';
            layer.setAttribute('aria-hidden', 'true');
            const ratio = Math.min(2, devicePixelRatio || 1, 1600 / width, 1200 / height);
            layer.width = Math.ceil(width * ratio); layer.height = Math.ceil(height * ratio);
            Object.assign(layer.style, { left: `${fixed ? r.left : element.offsetLeft}px`,
              top: `${fixed ? r.top : element.offsetTop}px`, width: `${width}px`, height: `${height}px` });
            const target = layer.getContext('2d');
            target.scale(ratio, ratio);
            artworkLayers.push(layer);
            layer._entranceParent = fixed ? document.body : element.parentElement;
            // Rasterize the small alphabet once. Reusing glyph sprites avoids
            // thousands of font-shaping calls during the short animation.
            const cw = width / columns, ch = height / rows;
            const spriteWidth = Math.ceil(cw * ratio), spriteHeight = Math.ceil(ch * ratio);
            const atlasKey = `${spriteWidth}:${spriteHeight}:${ink}`;
            let atlas = atlasCache.get(atlasKey);
            if (!atlas) {
              atlas = document.createElement('canvas');
              atlas.width = spriteWidth * glyphs.length; atlas.height = spriteHeight;
              const font = atlas.getContext('2d');
              font.fillStyle = ink;
              font.font = `500 ${Math.min(cw / 0.62, ch * 1.2) * ratio}px RPIGeistMono, monospace`;
              font.textAlign = 'center'; font.textBaseline = 'middle';
              [...glyphs].forEach((glyph, index) => font.fillText(glyph, (index + 0.5) * spriteWidth, spriteHeight / 2));
              atlasCache.set(atlasKey, atlas);
            }
            const perLetter = item.text || element.tagName === 'CANVAS';
            if (perLetter) {
              // Fixed whole-letter windows contain the same text or canonical
              // vector source. Only opacity changes; these windows never move.
              const real = document.createElement('div');
              real.className = fixed ? 'entrance_ascii-text' : 'entrance_ascii-artwork';
              real.setAttribute('aria-hidden', 'true');
              real.style.cssText = layer.style.cssText;
              real._entranceParent = layer._entranceParent;
              groups.forEach(group => {
                const copy = item.text ? element.cloneNode(true) : document.createElement('img');
                if (!item.text) { copy.src = bitmaps.get(element).src; copy.alt = ''; }
                copy.dataset.asciiLetter = '';
                Object.assign(copy.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%',
                  margin: '0', opacity: '0', fontFamily: style.fontFamily, fontSize,
                  fontWeight: style.fontWeight, lineHeight, letterSpacing,
                  color: style.color, textAlign: style.textAlign, whiteSpace: 'pre',
                  clipPath: `inset(${group.y * 100}% ${Math.max(0, 1 - group.x - group.w) * 100}% ${Math.max(0, 1 - group.y - group.h) * 100}% ${Math.max(0, group.x) * 100}%)` });
                real.appendChild(copy); group.copy = copy;
              });
              artworkLayers.splice(artworkLayers.indexOf(layer), 0, real);
            }
            const cellGroups = new Int16Array(columns * rows).fill(-1);
            for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
              const px = (x + 0.5) / columns, py = (y + 0.5) / rows;
              cellGroups[y * columns + x] = groups.findIndex(g => px >= g.x && px <= g.x + g.w && py >= g.y && py <= g.y + g.h);
            }
            fields.push({ layer, element, perLetter, groups, cellGroups, target, width, height, columns, rows, pixels, ink, atlas, spriteWidth, spriteHeight });
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
        resolve({ cleanup: clean, start(duration, onStart) {
          fields.forEach(({ element }) => {
            previousStyles.push([element, element.style.opacity]);
            element.style.opacity = '0.18';
          });

          let began = 0, warming = false;
          const metrics = scope.AsciiEntrance.lastAnimation = { frames: 0, maxPaintMs: 0 };
          function paint(now) {
            if (stopped || isCancelled()) { clean(); return; }
            const paintStarted = performance.now();
            const progress = began ? clamp((now - began) / duration) : 0;
            const beat = began ? Math.floor((now - began) / 55) : 0;
            fields.forEach((field, fieldIndex) => {
              const { layer, element, perLetter, groups, cellGroups, target, width, height, columns, rows, pixels, ink, atlas, spriteWidth, spriteHeight } = field;
              const cw = width / columns, ch = height / rows;
              const delay = groups.length === 1 ? noise(fieldIndex, 7) * 0.28 : 0;
              const amounts = groups.map((group, index) => resolveAt(progress, index, groups.length, delay));
              if (perLetter) groups.forEach((group, index) => { group.copy.style.opacity = String(amounts[index]); });
              if (!perLetter) element.style.opacity = String(0.18 + amounts[0] * 0.82);
              if (!perLetter) {
                layer.style.opacity = String(1 - amounts[0]);
                if (field.lastBeat === beat || amounts[0] >= 1) return;
                field.lastBeat = beat;
              }
              target.clearRect(0, 0, width, height); target.save();
              target.fillStyle = ink;
              for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
                const k = y * columns + x, density = pixels[k * 4 + 3] / 255;
                const group = cellGroups[k];
                const settled = !perLetter || group < 0 ? 0 : amounts[group];
                if (density < 0.06 || settled >= 1) continue;
                const cx = (x + 0.5) * cw, cy = (y + 0.5) * ch;
                // Density and held shimmer change across the whole letter at
                // once. The texture tightens, then dissolves into that letter;
                // there is deliberately no x-coordinate-based moving front.
                const shimmer = noise(k + fieldIndex * 7919, beat);
                const strength = clamp(density * (0.55 + settled * 0.4) + (shimmer - 0.5) * 0.26);
                target.globalAlpha = (1 - settled) * (0.65 + strength * 0.35);
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
            if (!warming) {
              // Commit the ASCII first frame before starting its short clock.
              // Shader/font/compositor startup must not consume the reveal itself.
              warming = true;
              raf = requestAnimationFrame(() => { raf = requestAnimationFrame(time => {
                if (stopped || isCancelled()) { clean(); return; }
                began = time; onStart?.();
                if (texts.length) document.querySelectorAll('.hero_credit, .hero_controls').forEach(element => {
                  chromeAnimations.push(element.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: duration * 0.75, easing: 'ease-out', fill: 'both' }));
                });
                cleanupTimer = setTimeout(clean, duration + 50);
                paint(time);
              }); });
            } else if (progress < 1) raf = requestAnimationFrame(paint);
          }
          paint(0);
        } });
      }
      const canvasSource = queue.find(item => item.element.tagName === 'CANVAS');
      const images = [];
      function decode(element, src) {
        const image = new Image(); image.src = src;
        images.push(image.decode().then(() => bitmaps.set(element, image)));
      }
      try {
        if (canvasSource) {
          if (typeof vectorSource !== 'function') { clean(); resolve(null); return; }
          const captureStart = performance.now();
          decode(canvasSource.element, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(vectorSource()));
          captureMs = performance.now() - captureStart;
        }
        queue.filter(item => item.element.classList.contains('hero_brand')).forEach(({ element }) => {
          images.push(preloadMask(element).then(image => { if (image) bitmaps.set(element, image); }));
        });
        Promise.all(images).then(() => { if (!stopped && !isCancelled()) frame = setTimeout(step, 0); }, () => { clean(); resolve(null); });
      } catch (_) { clean(); resolve(null); }
    });
  }
  scope.AsciiEntrance = { prepare, preloadMask, cells, resolveAt, artworkRegions, noise };
  if (typeof module !== 'undefined' && module.exports) module.exports = { cells, resolveAt, artworkRegions, noise };
})(typeof window !== 'undefined' ? window : globalThis);
