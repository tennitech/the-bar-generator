/* One print pass across artwork; typography, identity and controls remain still. */
(function (scope) {
  const root = document.documentElement;
  const motion = scope.matchMedia('(prefers-reduced-motion: reduce)');
  const completed = new WeakSet();
  let active = null;
  let observer = null;
  const supported = typeof document.startViewTransition === 'function';
  let stopped = motion.matches || !supported || performance.getEntriesByType('navigation')[0]?.type === 'back_forward';

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
    pass.plane.classList.add('is-entry-complete');
    pass.styles.forEach(([element, previous]) => { element.style.viewTransitionName = previous; });
    pass.plane.dataset.entryActive = 'false';
    completed.add(pass.plane);
    active = null;
    stopped = true;
    root.classList.remove('has-page-entrance');
  }
  function cancel() {
    stopped = true;
    active?.transition?.skipTransition();
    finish();
    root.classList.remove('has-page-entrance');
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
  function prepareCanvas() {
    const canvas = document.querySelector('#p5-container > canvas');
    if (!canvas) return;
    const artwork = canvas.parentElement;
    artwork.dataset.entrancePlane = 'generator';
    start(artwork, 'generator');
    observer?.disconnect();
  }
  const selectorAssets = new Map();
  const selectorImages = [];
  let selectorScheduled = false;
  function revealAsset(image) {
    // All rows are constructed in one turn. Decode each distinct source before
    // taking the field snapshot, including sources that arrive out of order.
    selectorImages.push(image);
    if (!selectorAssets.has(image.src)) {
      selectorAssets.set(image.src, image.decode().catch(() => {}));
    }
    if (selectorScheduled) return;
    selectorScheduled = true;
    queueMicrotask(async () => {
      await Promise.allSettled(selectorAssets.values());
      selectorImages.forEach(asset => asset.classList.add('is-entrance-ready'));
      const plane = document.querySelector('[data-entrance-plane="selector"]');
      if (plane) start(plane, 'selector');
    });
  }
  if (!stopped) root.classList.add('has-page-entrance');
  observer = new MutationObserver(prepareCanvas);
  observer.observe(root, { childList: true, subtree: true });
  motion.addEventListener('change', () => { if (motion.matches) cancel(); });
  scope.addEventListener('resize', cancel);
  scope.addEventListener('popstate', cancel);
  scope.addEventListener('hashchange', cancel);
  scope.addEventListener('pagehide', () => { cancel(); scope.ThemeMotion?.cancel(); });
  scope.addEventListener('pageshow', event => {
    if (event.persisted) { cancel(); scope.ThemeMotion?.cancel(); }
  });
  document.addEventListener('pointerdown', cancel, { capture: true, passive: true });
  document.addEventListener('keydown', cancel, true);
  document.addEventListener('change', event => { if (event.target.id === 'color-mode-select') cancel(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  scope.PageEntrance = { revealAsset, cancel, isActive: () => Boolean(active),
    isHoldingArtwork: () => Boolean(active && (active.kind === 'selector' || active.hold)) };
})(window);
