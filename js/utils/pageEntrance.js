/* Home arrives as one composition; generator artwork keeps its print reveal. */
(function (scope) {
  const root = document.documentElement;
  const motion = scope.matchMedia('(prefers-reduced-motion: reduce)');
  const completed = new WeakSet();
  let active = null;
  let observer = null;
  let generatorSource = null;
  let generatorIsCurrent = () => true;
  const supported = typeof document.startViewTransition === 'function';
  // Read in the head, before Home's first paint. This does not rely on body markup
  // that has not been parsed yet, or on View Transition support.
  const selectorPage = document.currentScript?.dataset.entryKind === 'selector';
  let savedPause = false;
  try { savedPause = selectorPage && scope.localStorage.getItem('rpi-marquee-motion') === 'paused'; } catch (_) {}
  let stopped = motion.matches || savedPause || (!selectorPage && !supported && !scope.AsciiEntrance)
    || performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  let selectorPending = selectorPage && !stopped;
  let readinessTimer = 0;

  function remember(kind) {
    try {
      const key = `rpi-entry-${kind}`;
      const repeat = scope.sessionStorage.getItem(key) === 'seen';
      scope.sessionStorage.setItem(key, 'seen');
      return repeat;
    } catch (_) { return false; }
  }
  function finish(pass = active) {
    if (!pass || active !== pass) return;
    cancelAnimationFrame(pass.frame);
    pass.ascii?.cleanup();
    clearTimeout(pass.timer);
    pass.reveal?.removeEventListener('transitionend', pass.onTransitionEnd);
    clearTimeout(readinessTimer);
    pass.plane.classList.add('is-entry-complete');
    pass.styles.forEach(([element, previous]) => { element.style.viewTransitionName = previous; });
    pass.plane.dataset.entryActive = 'false';
    completed.add(pass.plane);
    active = null;
    stopped = true;
    selectorPending = false;
    root.classList.remove('has-page-entrance', 'has-selector-entrance', 'is-selector-entering', 'has-ascii-entrance');
  }
  function cancel() {
    stopped = true;
    selectorPending = false;
    clearTimeout(readinessTimer);
    active?.transition?.skipTransition();
    finish();
    root.classList.remove('has-page-entrance', 'has-selector-entrance', 'is-selector-entering', 'has-selector-assets');
    if (selectorPage) {
      const plane = document.querySelector('[data-entrance-plane="selector"]');
      if (plane) { plane.classList.add('is-entry-complete'); plane.dataset.entryActive = 'false'; }
    }
  }
  function startSelector() {
    clearTimeout(readinessTimer);
    const plane = document.querySelector('[data-entrance-plane="selector"]');
    if (!plane) { cancel(); return; }
    // decode() can stall independently of a successfully loaded image.
    selectorImages.forEach(image => { if (image.complete && image.naturalWidth > 0) markAssetReady(image); });
    if (completed.has(plane) || active) return;
    if (stopped || motion.matches || document.hidden || document.body?.classList.contains('has-logo-animation')) {
      plane.dataset.entryMode = 'bypass';
      completed.add(plane);
      cancel();
      return;
    }
    const repeat = remember('selector');
    const duration = repeat ? 400 : 580;
    const asciiDuration = repeat ? 440 : 640;
    const pass = { plane, kind: 'selector', frame: 0, styles: [], hold: true, timer: 0,
      reveal: document.querySelector('[data-entrance-page="selector"]') };
    pass.onTransitionEnd = event => {
      if (event.target === pass.reveal && event.propertyName === 'opacity') finish(pass);
    };
    pass.reveal?.addEventListener('transitionend', pass.onTransitionEnd);
    active = pass;
    selectorPending = false;
    Object.assign(plane.dataset, { entryKind: 'selector', entryMode: 'fade', entryDuration: String(duration), entryBuffer: '0', entryActive: 'true' });
    root.style.setProperty('--selector-entry-duration', `${duration}ms`);
    if (scope.AsciiEntrance) {
      pass.frame = requestAnimationFrame(() => {
        pass.frame = requestAnimationFrame(() => {
          if (active !== pass) return;
          scope.AsciiEntrance.prepare(Array.from(document.querySelectorAll('.bar_asset, .hero_brand')),
            Array.from(document.querySelectorAll('.hero_title-line')),
            () => active !== pass || stopped || motion.matches || document.hidden).then(ascii => {
              if (active !== pass) { ascii?.cleanup(); return; }
              pass.ascii = ascii;
              plane.dataset.entryMode = ascii ? 'ascii' : 'fade';
              const revealDuration = ascii ? asciiDuration : duration;
              plane.dataset.entryDuration = String(revealDuration);
              if (ascii) root.classList.add('has-ascii-entrance');
              pass.timer = setTimeout(() => finish(pass), revealDuration + (ascii ? 1000 : 100));
              ascii?.start(revealDuration, () => {
                clearTimeout(pass.timer);
                pass.timer = setTimeout(() => finish(pass), revealDuration + 100);
              });
              root.classList.add('is-selector-entering');
            });
        });
      });
      return;
    }
    // Two frames commit the concealed state even with memory-cached SVGs/fonts.
    // The whole composition fades together without a captured page-sized image.
    pass.frame = requestAnimationFrame(() => {
      if (active !== pass) return;
      pass.frame = requestAnimationFrame(() => {
        if (active !== pass) return;
        root.classList.add('is-selector-entering');
        // Follow the actual painted transition. A deadline still reveals the page
        // if a browser drops transition events or styles are unavailable.
        pass.timer = setTimeout(() => finish(pass), duration + 250);
      });
    });
  }
  function start(plane, kind) {
    if (!plane || completed.has(plane) || active) return;
    if (stopped || motion.matches || document.hidden || document.body?.classList.contains('has-logo-animation')) {
      plane.classList.add('is-entry-complete');
      plane.dataset.entryMode = supported ? 'bypass' : 'fallback';
      completed.add(plane);
      stopped = true;
      root.classList.remove('has-page-entrance');
      return;
    }
    if (scope.AsciiEntrance) {
      const pass = { plane, kind, frame: 0, styles: [], hold: true, timer: 0, reveal: plane };
      active = pass;
      Object.assign(plane.dataset, { entryKind: kind, entryMode: 'preparing', entryDuration: '580', entryActive: 'true' });
      (scope.AsciiEntrance.prepareGenerator || scope.AsciiEntrance.prepare)(Array.from(plane.querySelectorAll('canvas')), [],
        () => active !== pass || stopped || motion.matches || document.hidden || !generatorIsCurrent(), generatorSource).then(ascii => {
          if (active !== pass) { ascii?.cleanup(); return; }
          pass.ascii = ascii;
          plane.dataset.entryMode = ascii ? 'ascii' : 'fallback';
          plane.classList.add('is-entry-complete');
          if (!ascii) { finish(pass); return; }
          // The wake resolves in place into the actual canvas; chrome stays still.
          pass.timer = setTimeout(() => finish(pass), 1580);
          ascii.start(580, () => {
            clearTimeout(pass.timer);
            pass.timer = setTimeout(() => finish(pass), 680);
          }, () => finish(pass));
        });
      return;
    }
    const repeat = remember(kind);
    const buffer = repeat ? 40 : 60;
    const duration = repeat ? 400 : 680;
    const pass = { plane, kind, frame: 0, styles: [], hold: false };
    active = pass;
    Object.assign(plane.dataset, { entryKind: kind, entryDuration: String(duration), entryBuffer: String(buffer), entryActive: 'true' });

    function print() {
      if (active !== pass) return;
      const bounds = plane.getBoundingClientRect();
      const left = Math.max(0, bounds.left);
      const right = Math.min(innerWidth, bounds.right);
      const clipStart = `${Math.max(0, (bounds.right - left) / bounds.width * 100)}%`;
      const clipEnd = `${Math.max(0, (bounds.right - right) / bounds.width * 100)}%`;
      root.style.setProperty('--entry-clip-start', clipStart);
      root.style.setProperty('--entry-clip-end', clipEnd);
      root.style.setProperty('--entry-duration', `${duration}ms`);
      root.style.setProperty('--entry-buffer', `${buffer}ms`);
      if (typeof document.startViewTransition !== 'function') {
        plane.dataset.entryMode = 'fallback';
        finish(pass);
        return;
      }
      plane.dataset.entryMode = 'native';
      // Capture only the artwork and fixed chrome, avoiding any whole-page loading layer.
      const names = [[root, 'none'], [plane, 'page-artwork'], ...Array.from(document.querySelectorAll('[data-page-entrance]')).map((element, index) => [element, `page-chrome-${index}`])];
      names.forEach(([element, name]) => {
        pass.styles.push([element, element.style.viewTransitionName]);
        element.style.viewTransitionName = name;
      });
      try {
        pass.transition = document.startViewTransition(() => {
          if (active === pass) {
            pass.hold = true;
            plane.classList.add('is-entry-complete');
          }
        });
        pass.transition.ready.catch(() => finish(pass));
        pass.transition.updateCallbackDone.catch(() => {});
        pass.transition.finished.then(() => finish(pass), () => finish(pass));
      } catch (_) { finish(pass); }
    }
    // Let the renderer's first shader/draw work finish before starting the visual clock.
    pass.frame = requestAnimationFrame(() => {
      if (active !== pass) return;
      pass.frame = requestAnimationFrame(print);
    });
  }
  function prepareCanvas(source, isCurrent) {
    if (typeof isCurrent === 'function') generatorIsCurrent = isCurrent;
    if (typeof source === 'function') generatorSource = source;
    const canvas = document.querySelector('#p5-container > canvas');
    if (!canvas) return;
    const artwork = canvas.parentElement;
    artwork.dataset.entrancePlane = 'generator';
    // Canvas insertion precedes SVG decoding. Capture only a complete first mark.
    if (canvas.dataset.previewReady !== 'true') return;
    start(artwork, 'generator');
    observer?.disconnect();
  }
  const selectorAssets = new Map();
  const selectorImages = [];
  let selectorScheduled = false;
  let selectorFinished = false;
  function markAssetReady(image) {
    image.classList.add('is-entrance-ready');
    image.classList.remove('is-entrance-decoding');
  }
  function revealAsset(image) {
    if (selectorFinished) {
      image.classList.add('is-entrance-ready');
      return;
    }
    selectorImages.push(image);
    if (selectorPage && !stopped) image.classList.add('is-entrance-decoding');
    // Share each source's decode, not one decode per repeated lane item.
    if (!selectorAssets.has(image.src)) {
      const decoded = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
      selectorAssets.set(image.src, decoded.catch(() => {}));
    }
    selectorAssets.get(image.src).then(() => markAssetReady(image));
    // Decode the CSS-masked red mark alongside the gallery, not after readiness.
    if (selectorPage && !selectorAssets.has('hero-brand') && scope.AsciiEntrance?.preloadMask) {
      selectorAssets.set('hero-brand', scope.AsciiEntrance.preloadMask(document.querySelector('.hero_brand')));
    }
    if (selectorScheduled) return;
    selectorScheduled = true;
    queueMicrotask(async () => {
      if (selectorPage && stopped) startSelector();
      await Promise.allSettled([...selectorAssets.values(), document.fonts?.ready]);
      selectorFinished = true;
      selectorImages.splice(0).forEach(markAssetReady);
      selectorAssets.clear();
      if (selectorPage) startSelector();
      else {
        const plane = document.querySelector('[data-entrance-plane="selector"]');
        if (plane) start(plane, 'selector');
      }
    });
  }
  if (selectorPending) {
    root.classList.add('has-selector-entrance', 'has-selector-assets');
    // An unavailable asset, font, or later script must never hide navigation
    // indefinitely. Slow images can fade in individually after this deadline.
    readinessTimer = setTimeout(startSelector, 2200);
  } else if (!stopped && !scope.AsciiEntrance) root.classList.add('has-page-entrance');
  if (!selectorPage) {
    observer = new MutationObserver(prepareCanvas);
    observer.observe(root, { childList: true, subtree: true });
  }
  motion.addEventListener('change', () => { if (motion.matches) cancel(); });
  // Home uses live layout, not a fixed snapshot; browser chrome/font resize is harmless.
  scope.addEventListener('resize', () => {
    // A sampled ASCII frame must not outlive its layout. Pending Home assets
    // can still settle naturally before the entrance has actually started.
    if (!selectorPage || active) cancel();
  });
  scope.addEventListener('popstate', cancel);
  scope.addEventListener('hashchange', cancel);
  scope.addEventListener('pagehide', () => { cancel(); scope.ThemeMotion?.cancel(); });
  scope.addEventListener('pageshow', event => {
    if (event.persisted) { cancel(); scope.ThemeMotion?.cancel(); }
  });
  document.addEventListener('pointerdown', cancel, { capture: true, passive: true });
  document.addEventListener('keydown', cancel, true);
  if (selectorPage) document.addEventListener('focusin', cancel, true);
  document.addEventListener('input', () => { if (!selectorPage && active) cancel(); }, true);
  document.addEventListener('change', event => {
    if ((!selectorPage && active) || event.target.id === 'color-mode-select') cancel();
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  scope.PageEntrance = { revealAsset, revealGenerator: prepareCanvas, cancel, isActive: () => Boolean(selectorPending || active),
    isHoldingArtwork: () => Boolean(selectorPending || (active && (active.kind === 'selector' || active.hold))) };
})(window);
