/* Three shared model clocks, never one generator per repeated marquee item.
   Geometry and transport come from the generator's canonical utilities. */
(function (scope) {
  const STYLES = Object.freeze(['ticker', 'waveform', 'wave-quantum']);
  const FRAME_INTERVAL = 1000 / 30;
  const node = typeof module !== 'undefined' && module.exports;
  const dependencies = () => node ? {
    ...require('./barPattern'), loopingGifUtils: require('./loopingGif'), quantumModel: require('./quantumModel')
  } : scope;

  function createSettings(entry, random = Math.random) {
    if (!STYLES.includes(entry.value)) return null;
    const prefix = entry.value === 'wave-quantum' ? 'quantum' : entry.value;
    const maximum = { ticker: 8, waveform: 10, quantum: 10 }[prefix];
    const speed = (2 + Math.floor(random() * (maximum - 1))) / 10;
    // Keep the owner's left-to-right default. Variety comes from genuine
    // configurations, speed and phase, not an unexpected reverse direction.
    const reverse = false;
    const query = new URLSearchParams(entry.query);
    query.set(`${prefix}Speed`, String(speed));
    query.set(`${prefix}Reverse`, String(reverse));
    // Quantum has a genuine phase control and retains its selected sample phase.
    const phase = prefix === 'quantum' ? Number(query.get('quantumPhase') || 0) : random();
    return { style: entry.value, phase, query: query.toString(),
      values: Object.fromEntries(query), prefix };
  }

  function advancePhase(settings, deltaMs, api = dependencies()) {
    if (settings.style === 'wave-quantum') {
      return api.quantumModel.advancePhase(settings.phase, deltaMs, {
        speed: settings.values.quantumSpeed, reverse: settings.values.quantumReverse === 'true'
      });
    }
    return api.loopingGifUtils.advanceLiveLoopPhase(settings.phase, settings.style, settings.values, deltaMs);
  }

  function createGeometry(settings, api = dependencies()) {
    const dimensions = { barStartX: 0, barY: 0, exactBarWidth: 250, barHeight: 18 };
    const values = settings.values;
    if (settings.style === 'wave-quantum') {
      return { polygons: api.createWaveQuantumPatternGeometry({ ...dimensions, quantumPhase: settings.phase }).polygons };
    }
    const motion = api.loopingGifUtils.getLoopingAnimationState(settings.style, values, { phase: settings.phase });
    const options = { ...values, ...dimensions, loopOffsetX: motion.loopOffsetX, timeSeconds: motion.timeSeconds };
    if (settings.style === 'waveform') return { polygons: [api.createWaveformPatternGeometry(options).polygon] };
    return { rects: api.createTickerPatternGeometry(options).rects };
  }

  function paintGeometry(context, geometry, width) {
    const scale = width / 250;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, 250, 18);
    context.fillStyle = '#fff';
    for (const rect of geometry.rects || []) context.fillRect(rect.x, rect.y, rect.width, rect.height);
    for (const polygon of geometry.polygons || []) {
      context.beginPath();
      polygon.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.closePath();
      context.fill();
    }
  }

  function rasterWidth(cssWidth, pixelRatio = 1) {
    // Whole125:9 pixels preserve the canonical ratio. Bound memory on very
    // large displays; DPR never changes geometry or marquee composition.
    return Math.min(2000, Math.max(500, Math.ceil(cssWidth * Math.min(2, pixelRatio) / 125) * 125));
  }

  function consumeFrameTime(clock, deltaMs) {
    const delta = Math.max(0, Math.min(40, deltaMs));
    clock.elapsed += delta;
    clock.remainder += delta;
    if (clock.remainder + 0.01 < FRAME_INTERVAL) return 0;
    const elapsed = clock.elapsed;
    clock.elapsed = 0;
    clock.remainder = Math.max(0, clock.remainder
      - Math.floor((clock.remainder + 0.01) / FRAME_INTERVAL) * FRAME_INTERVAL);
    return elapsed;
  }

  let modelPromise;
  function loadScript(name) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `js/utils/${name}.js?v=20261104-numeric-seams`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  function loadModels() {
    // Both canonical tick geometry and motion capture the scale model at load.
    if (!modelPromise) modelPromise = loadScript('rulerScale').then(() =>
      Promise.all(['loopingGif', 'quantumModel', 'barPattern'].map(loadScript)));
    return modelPromise;
  }

  function shouldHoldPreview(asset) {
    return asset.classList.contains('is-hovered') || asset.classList.contains('is-pressed');
  }

  function create(entries, random = Math.random) {
    const settings = new Map(entries.map(entry => [entry.path, createSettings(entry, random)]).filter(([, value]) => value));
    const assets = new Map();
    let ready = false, failed = false, pending = null, observer = null;
    const clock = { elapsed: 0, remainder: 0 };

    function decorate(asset, path) {
      const state = settings.get(path);
      if (!state || failed) return;
      assets.set(asset, { state, canvas: null, context: null, visible: false });
      if (observer) observer.observe(asset);
    }
    function resize() {
      for (const [asset, item] of assets) {
        if (!asset.isConnected) {
          observer?.unobserve(asset); assets.delete(asset); continue;
        }
        item.width = rasterWidth(asset.offsetWidth, scope.devicePixelRatio || 1);
      }
    }
    function fail() {
      failed = true; ready = false; observer?.disconnect();
      for (const [asset, item] of assets) {
        asset.classList.remove('is-animated');
        if (item.canvas) { item.canvas.width = 1; item.canvas.height = 1; }
      }
      assets.clear();
      for (const state of settings.values()) {
        if (state.surface) { state.surface.width = 1; state.surface.height = 1; }
      }
    }
    function start() {
      if (ready || failed || pending) return pending;
      pending = loadModels().then(() => {
        if (!scope.IntersectionObserver) { fail(); return; } // Retain stills on older browsers.
        for (const state of settings.values()) {
          state.surface = document.createElement('canvas');
          state.surface.addEventListener('contextlost', fail);
          state.context = state.surface.getContext('2d');
          if (!state.context) throw new Error('Canvas unavailable');
        }
        observer = new IntersectionObserver(records => {
          for (const record of records) {
            const item = assets.get(record.target);
            if (!item) continue;
            item.visible = record.isIntersecting;
            if (!item.visible && item.canvas) {
              record.target.classList.remove('is-animated');
              item.canvas.width = 1; item.canvas.height = 1;
            }
          }
        });
        resize();
        for (const asset of assets.keys()) observer.observe(asset);
        ready = true;
      }).catch(fail); // Stills and links remain usable if the enhancement fails.
      return pending;
    }
    function paintFrame(deltaMs) {
      if (!ready) return;
      const elapsed = consumeFrameTime(clock, deltaMs);
      if (!elapsed) return;
      // The canonical anti-aliasing cap applies per painted update, not per
      // skipped rAF. Dense tick patterns may slow down instead of skipping minor ticks.
      for (const state of settings.values()) state.phase = advancePhase(state, elapsed);
      const visible = new Map();
      for (const [asset, item] of assets) {
        // Retain this sample's last complete canvas (or its static fallback
        // before enhancement). Other copies keep using the shared live frame.
        // Leaving hover/hold rejoins that frame without another timer or model.
        if (!item.visible || !asset.isConnected || shouldHoldPreview(asset)) continue;
        const list = visible.get(item.state) || [];
        list.push([asset, item]); visible.set(item.state, list);
      }
      for (const [state, list] of visible) {
        const width = Math.max(...list.map(([, item]) => item.width || 500));
        if (state.surface.width !== width) {
          state.surface.width = width; state.surface.height = width * 18 / 250;
        }
        paintGeometry(state.context, createGeometry(state), width);
        for (const [asset, item] of list) {
          if (!item.canvas) {
            item.canvas = document.createElement('canvas');
            item.canvas.className = 'bar_asset bar_motion_asset';
            item.canvas.addEventListener('contextlost', fail);
            item.canvas.dataset.motionPreview = state.style;
            item.canvas.setAttribute('aria-hidden', 'true');
            item.context = item.canvas.getContext('2d');
            asset.append(item.canvas);
          }
          if (!item.context) continue;
          if (item.canvas.width !== width) {
            item.canvas.width = width; item.canvas.height = state.surface.height;
          }
          item.context.clearRect(0, 0, width, state.surface.height);
          item.context.drawImage(state.surface, 0, 0);
          if (!asset.classList.contains('is-animated')) asset.classList.add('is-animated');
        }
      }
    }
    function tick(deltaMs) {
      try { paintFrame(deltaMs); }
      catch (_) { fail(); } // An optional preview must never stop lane movement.
    }
    // Pauses discard partial intervals and never catch up across a hold.
    function hold() { clock.elapsed = 0; clock.remainder = 0; }
    return { settings, decorate, resize, start, tick, hold };
  }

  const api = { STYLES, FRAME_INTERVAL, createSettings, advancePhase, createGeometry, paintGeometry, rasterWidth, consumeFrameTime, shouldHoldPreview, create };
  if (node) module.exports = api;
  scope.MarqueeAnimation = api;
})(typeof window !== 'undefined' ? window : globalThis);
