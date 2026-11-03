/* Commit colors synchronously, then make one brief, display-only scan.
 * Avoid full-page view-transition snapshots: they delay the selected state and
 * stall canvas painting on slower devices. Artwork and export data stay canonical.
 */
(function () {
  let scanner = null;
  let motion = null;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');

  function commitImmediately(update) {
    document.body.classList.add('has-theme-snapshot');
    try {
      update();
      // Flush the final palette without stacking the controls' hover transitions.
      getComputedStyle(document.body).color;
    } finally {
      document.body.classList.remove('has-theme-snapshot');
    }
  }

  function cancel() {
    if (motion) motion.cancel();
    motion = null;
    if (scanner) scanner.remove();
    scanner = null;
  }

  function run(update) {
    cancel();
    commitImmediately(update);
    if (media.matches || document.hidden || document.body.classList.contains('has-logo-animation')) return;

    const strip = document.createElement('pre');
    strip.className = 'theme_scan';
    strip.setAttribute('aria-hidden', 'true');
    strip.textContent = Array.from({ length: Math.ceil(window.innerHeight / 16) }, (_, row) =>
      [' . : +', ' : + #', ' . : =', ' . + :'][row % 4]).join('\n');
    document.body.append(strip);
    scanner = strip;
    motion = strip.animate([
      { transform: 'translateX(-100%)', opacity: 0 },
      { opacity: 0.16, offset: 0.12 },
      { opacity: 0.16, offset: 0.85 },
      { transform: 'translateX(calc(100vw - 100%))', opacity: 0 }
    ], { duration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-theme-scan')) || 120, easing: 'linear' });
    const cleanup = () => {
      strip.remove();
      if (scanner === strip) { scanner = null; motion = null; }
    };
    motion.finished.then(cleanup, cleanup);
  }

  media.addEventListener('change', cancel);
  window.addEventListener('resize', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  window.ThemeMotion = { run, cancel };
}());
