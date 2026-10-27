/* A single ordered scan carries the ASCII projection language into theme changes.
 * This is display-only: the renderer, geometry and exported assets stay canonical.
 */
(function () {
  let transition = null;
  let scanner = null;
  let generation = 0;
  let pendingUpdate = null;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');

  function cancel() {
    generation++;
    const update = pendingUpdate;
    pendingUpdate = null;
    if (update) update();
    if (transition) transition.skipTransition();
    transition = null;
    document.body.classList.remove('has-theme-snapshot');
    if (scanner) scanner.remove();
    scanner = null;
  }

  function run(update) {
    cancel();
    if (media.matches || document.hidden || document.body.classList.contains('has-logo-animation')) {
      update();
      return;
    }
    const token = generation;
    const strip = document.createElement('pre');
    strip.className = 'theme_scan';
    strip.setAttribute('aria-hidden', 'true');
    // A fixed progression, not changing noise or a flickering full-screen field.
    strip.textContent = Array.from({ length: Math.ceil(window.innerHeight / 16) }, (_, row) =>
      [' . : +', ' : + #', ' . : =', ' . + :'][row % 4]).join('\n');
    document.body.append(strip);
    scanner = strip;
    const cleanup = () => {
      strip.remove();
      if (token === generation) { scanner = null; transition = null; }
    };
    if (typeof document.startViewTransition === 'function') {
      pendingUpdate = update;
      transition = document.startViewTransition(() => {
        if (token === generation) {
          pendingUpdate = null;
          document.body.classList.add('has-theme-snapshot');
          update();
        }
        // Rendering is synchronous here: browsers suspend animation frames while
        // preparing a view-transition snapshot.
      });
      const restoreTransitions = () => {
        if (token === generation) document.body.classList.remove('has-theme-snapshot');
      };
      transition.ready.then(restoreTransitions, restoreTransitions);
      transition.updateCallbackDone.catch(() => {});
      transition.finished.then(cleanup, cleanup);
    } else {
      update();
      const motion = strip.animate([
        { transform: 'translateX(-100%)', opacity: 0 },
        { opacity: 0.16, offset: 0.12 },
        { opacity: 0.16, offset: 0.85 },
        { transform: 'translateX(calc(100vw - 100%))', opacity: 0 }
      ], { duration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-theme-scan')) || 420, easing: 'linear' });
      motion.finished.then(cleanup, cleanup);
    }
  }

  media.addEventListener('change', cancel);
  window.addEventListener('resize', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  window.ThemeMotion = { run, cancel };
}());
